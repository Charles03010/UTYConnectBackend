// tests/integration/chats.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db/models');
const { User, Chat, ChatMessage } = db;

let user1Token, user2Token, user3Token;
let user1, user2, user3;

const setupTestUsersForChat = async () => {
  user1 = await User.create({ name: 'Chat User1', username: 'chatuser1', email: 'chatuser1@example.com', password: 'password123' });
  user2 = await User.create({ name: 'Chat User2', username: 'chatuser2', email: 'chatuser2@example.com', password: 'password123' });
  user3 = await User.create({ name: 'Chat User3', username: 'chatuser3', email: 'chatuser3@example.com', password: 'password123' });

  let res = await request(app).post('/api/v1/auth/login').send({ email: 'chatuser1@example.com', password: 'password123' });
  user1Token = res.body.token;
  res = await request(app).post('/api/v1/auth/login').send({ email: 'chatuser2@example.com', password: 'password123' });
  user2Token = res.body.token;
  res = await request(app).post('/api/v1/auth/login').send({ email: 'chatuser3@example.com', password: 'password123' });
  user3Token = res.body.token;
};

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await db.sequelize.sync({ force: true });
  } else {
    throw new Error('NODE_ENV not set to test. Aborting tests.');
  }
});

beforeEach(async () => {
  await setupTestUsersForChat();
});

afterEach(async () => {
  await ChatMessage.destroy({ where: {} });
  await Chat.destroy({ where: {} });
  await User.destroy({ where: {} });
  user1Token = null; user2Token = null; user3Token = null;
  user1 = null; user2 = null; user3 = null;
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('Chat API - /api/v1/chats', () => {
  describe('POST / (Get or Create Chat)', () => {
    it('should create a new chat between two users if one does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/chats')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ userId2: user2.id });

      expect(res.statusCode).toEqual(200); // Or 201 depending on service logic for creation
      expect(res.body).toHaveProperty('id');
      const u1Id = Math.min(user1.id, user2.id);
      const u2Id = Math.max(user1.id, user2.id);
      expect(res.body.user1_id).toEqual(u1Id);
      expect(res.body.user2_id).toEqual(u2Id);
    });

    it('should return an existing chat if one already exists', async () => {
      // First, create a chat
      await request(app)
        .post('/api/v1/chats')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ userId2: user2.id });

      // Then, try to get/create it again
      const res = await request(app)
        .post('/api/v1/chats')
        .set('Authorization', `Bearer ${user2Token}`) // user2 initiates
        .send({ userId2: user1.id });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id');
      const chat = await Chat.findOne({where: {user1_id: Math.min(user1.id, user2.id), user2_id: Math.max(user1.id, user2.id)}});
      expect(res.body.id).toEqual(chat.id);
    });

    it('should not allow creating a chat with oneself', async () => {
      const res = await request(app)
        .post('/api/v1/chats')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ userId2: user1.id });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Cannot create a chat with yourself.');
    });

    it('should require authentication', async () => {
        const res = await request(app)
            .post('/api/v1/chats')
            .send({ userId2: user2.id });
        expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET / (Get User Chats)', () => {
    let chat12, chat13;
    beforeEach(async () => {
        const u1 = Math.min(user1.id, user2.id);
        const u2 = Math.max(user1.id, user2.id);
        chat12 = await Chat.create({user1_id: u1, user2_id: u2});
        await ChatMessage.create({chat_id: chat12.id, sender_id: user1.id, message: "Hello user2"});

        const u1_3 = Math.min(user1.id, user3.id);
        const u3_1 = Math.max(user1.id, user3.id);
        chat13 = await Chat.create({user1_id: u1_3, user2_id: u3_1 });
        await ChatMessage.create({chat_id: chat13.id, sender_id: user3.id, message: "Hi user1"});
    });

    it('should get all chats for the authenticated user with last message and other user details', async () => {
      const res = await request(app)
        .get('/api/v1/chats')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toEqual(2);

      const chatWithUser2 = res.body.find(c => c.otherUser.id === user2.id || c.otherUser.id === user1.id && c.id === chat12.id);
      expect(chatWithUser2).toBeDefined();
      expect(chatWithUser2.lastMessage.message).toEqual("Hello user2");
      expect(chatWithUser2.otherUser.username).toEqual(user2.username); // user1 is self, user2 is other

      const chatWithUser3 = res.body.find(c => c.otherUser.id === user3.id || c.otherUser.id === user1.id && c.id === chat13.id);
      expect(chatWithUser3).toBeDefined();
      expect(chatWithUser3.lastMessage.message).toEqual("Hi user1");
      expect(chatWithUser3.otherUser.username).toEqual(user3.username);
    });
  });

  describe('POST /:chatId/messages (Send Message)', () => {
    let chatUser1User2;
    beforeEach(async () => {
        const u1 = Math.min(user1.id, user2.id);
        const u2 = Math.max(user1.id, user2.id);
        chatUser1User2 = await Chat.create({ user1_id: u1, user2_id: u2 });
    });

    it('should allow a user to send a message in a chat they are part of', async () => {
      const messageData = { message: 'Hello from user1!' };
      const res = await request(app)
        .post(`/api/v1/chats/${chatUser1User2.id}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(messageData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual(messageData.message);
      expect(res.body.sender_id).toEqual(user1.id);
      expect(res.body.chat_id).toEqual(chatUser1User2.id);
    });

    it('should return 403 if user tries to send message in a chat they are not part of', async () => {
      const messageData = { message: 'Intruder message' };
      const res = await request(app)
        .post(`/api/v1/chats/${chatUser1User2.id}/messages`)
        .set('Authorization', `Bearer ${user3Token}`) // user3 is not in chatUser1User2
        .send(messageData);
      expect(res.statusCode).toEqual(403); // Or 404 if chat not found for user logic
    });

    it('should return 404 if chat does not exist', async () => {
      const res = await request(app)
        .post(`/api/v1/chats/99999/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'msg' });
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('GET /:chatId/messages (Get Messages for Chat)', () => {
    let chat;
    beforeEach(async () => {
        const u1 = Math.min(user1.id, user2.id);
        const u2 = Math.max(user1.id, user2.id);
        chat = await Chat.create({ user1_id: u1, user2_id: u2 });
        await ChatMessage.create({ chat_id: chat.id, sender_id: user1.id, message: 'Msg1 from U1', status: 'sent' });
        await ChatMessage.create({ chat_id: chat.id, sender_id: user2.id, message: 'Msg2 from U2', status: 'sent' });
        await ChatMessage.create({ chat_id: chat.id, sender_id: user1.id, message: 'Msg3 from U1', status: 'sent' });
    });

    it('should get messages for a chat with pagination and mark as delivered/read', async () => {
      const res = await request(app)
        .get(`/api/v1/chats/${chat.id}/messages?page=1&limit=2`)
        .set('Authorization', `Bearer ${user1Token}`); // user1 requests messages

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('messages');
      expect(res.body.messages.length).toBeLessThanOrEqual(2); // Page limit
      expect(res.body.messages[0].message).toEqual('Msg2 from U2'); // Oldest in this batch after reverse
      expect(res.body.messages[1].message).toEqual('Msg3 from U1');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage', 1);

      // Check if user2's message status was updated by user1 viewing them
      const user2Message = await ChatMessage.findOne({ where: { chat_id: chat.id, sender_id: user2.id }});
      expect(user2Message.status).toBeOneOf(['delivered', 'read']); // Depending on service logic
    });

     it('should return 403 if user is not part of the chat', async () => {
        const res = await request(app)
        .get(`/api/v1/chats/${chat.id}/messages`)
        .set('Authorization', `Bearer ${user3Token}`);
        expect(res.statusCode).toEqual(403);
    });
  });

  describe('PATCH /:chatId/messages/read (Mark Messages as Read)', () => {
    let chatReadTest;
    beforeEach(async () => {
        const u1 = Math.min(user1.id, user2.id);
        const u2 = Math.max(user1.id, user2.id);
        chatReadTest = await Chat.create({ user1_id: u1, user2_id: u2 });
        await ChatMessage.create({ chat_id: chatReadTest.id, sender_id: user2.id, message: 'Unread message 1', status: 'delivered' });
        await ChatMessage.create({ chat_id: chatReadTest.id, sender_id: user2.id, message: 'Unread message 2', status: 'sent' });
        await ChatMessage.create({ chat_id: chatReadTest.id, sender_id: user1.id, message: 'My own message', status: 'read' }); // Should not be affected
    });

    it('should mark messages from the other user in the chat as read', async () => {
        const res = await request(app)
            .patch(`/api/v1/chats/${chatReadTest.id}/messages/read`)
            .set('Authorization', `Bearer ${user1Token}`); // User1 is reading messages from User2

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('messages marked as read');

        const messagesFromUser2 = await ChatMessage.findAll({
            where: { chat_id: chatReadTest.id, sender_id: user2.id }
        });
        messagesFromUser2.forEach(msg => {
            expect(msg.status).toEqual('read');
        });

        const messageFromUser1 = await ChatMessage.findOne({
            where: { chat_id: chatReadTest.id, sender_id: user1.id }
        });
        expect(messageFromUser1.status).toEqual('read'); // Should remain unchanged
    });

     it('should not fail if no messages to mark as read', async () => {
        // Mark them as read first
        await ChatMessage.update({status: 'read'}, {where: {chat_id: chatReadTest.id, sender_id: user2.id}});
        const res = await request(app)
            .patch(`/api/v1/chats/${chatReadTest.id}/messages/read`)
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('0 messages marked as read.');
    });

     it('should return 403 if user not part of chat', async () => {
        const res = await request(app)
            .patch(`/api/v1/chats/${chatReadTest.id}/messages/read`)
            .set('Authorization', `Bearer ${user3Token}`);
        expect(res.statusCode).toEqual(404); // Or 403 if that's how service handles it
     });
  });
});

// Helper for expect.toBeOneOf (if not globally defined)
if (!expect.toBeOneOf) {
  expect.extend({
    toBeOneOf(received, items) {
      const pass = items.includes(received);
      if (pass) {
        return {
          message: () => `expected ${received} not to be one of [${items.join(', ')}]`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be one of [${items.join(', ')}]`,
          pass: false,
        };
      }
    },
  });
}