// tests/integration/comments.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db/models');
const { User, Post, Comment } = db;

let user1Token, user2Token;
let user1, user2;
let post1;

const setupTestUsersAndPost = async () => {
  user1 = await User.create({ name: 'Comment User1', username: 'commentuser1', email: 'commentuser1@example.com', password: 'password123' });
  user2 = await User.create({ name: 'Comment User2', username: 'commentuser2', email: 'commentuser2@example.com', password: 'password123' });

  let res = await request(app).post('/api/v1/auth/login').send({ email: 'commentuser1@example.com', password: 'password123' });
  user1Token = res.body.token;
  res = await request(app).post('/api/v1/auth/login').send({ email: 'commentuser2@example.com', password: 'password123' });
  user2Token = res.body.token;

  post1 = await Post.create({ user_id: user1.id, image_url: '/uploads/test/commentpost.jpg', caption: 'Post for comments' });
};

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await db.sequelize.sync({ force: true });
  } else {
    throw new Error('NODE_ENV not set to test. Aborting tests.');
  }
});

beforeEach(async () => {
  await setupTestUsersAndPost();
});

afterEach(async () => {
  await Comment.destroy({ where: {} });
  await Post.destroy({ where: {} });
  await User.destroy({ where: {} });
  user1Token = null; user2Token = null;
  user1 = null; user2 = null; post1 = null;
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('Comment API - /api/v1/posts/:postId/comments', () => {
  let comment1ByUser2;

  describe('POST / (Create Comment)', () => {
    it('should allow an authenticated user to create a comment on a post', async () => {
      const commentData = { text: 'This is a great post!' };
      const res = await request(app)
        .post(`/api/v1/posts/${post1.id}/comments`)
        .set('Authorization', `Bearer ${user2Token}`) // user2 comments on user1's post
        .send(commentData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.text).toEqual(commentData.text);
      expect(res.body.commenter.id).toEqual(user2.id);
      expect(res.body.post_id).toEqual(post1.id); // Check if comment is associated with the correct post
    });

    it('should allow creating a reply to a comment', async () => {
        comment1ByUser2 = await Comment.create({ user_id: user2.id, post_id: post1.id, text: "First level comment" });
        const replyData = { text: 'Replying to the first comment', parent_comment_id: comment1ByUser2.id };
        const res = await request(app)
            .post(`/api/v1/posts/${post1.id}/comments`)
            .set('Authorization', `Bearer ${user1Token}`) // user1 replies
            .send(replyData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.text).toEqual(replyData.text);
        expect(res.body.parent_comment_id).toEqual(comment1ByUser2.id);
    });

    it('should return 400 if comment text is empty', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${post1.id}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ text: '' });
      expect(res.statusCode).toEqual(400);
    });

    it('should return 404 if post not found', async () => {
        const res = await request(app)
        .post(`/api/v1/posts/9999/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ text: 'A comment' });
      expect(res.statusCode).toEqual(404); // Or 400 if postId validation fails first
    });
  });

  describe('GET / (Get Comments for Post)', () => {
    beforeEach(async () => {
        comment1ByUser2 = await Comment.create({user_id: user2.id, post_id: post1.id, text: "First comment by user2"});
        await Comment.create({user_id: user1.id, post_id: post1.id, text: "Reply by user1", parent_comment_id: comment1ByUser2.id});
        await Comment.create({user_id: user1.id, post_id: post1.id, text: "Second top comment by user1"});
    });

    it('should get all top-level comments for a post with replies', async () => {
      const res = await request(app).get(`/api/v1/posts/${post1.id}/comments?limit=5`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('comments');
      expect(res.body.comments.length).toEqual(2); // 2 top-level comments
      const firstTopComment = res.body.comments.find(c => c.id === comment1ByUser2.id);
      expect(firstTopComment).toBeDefined();
      expect(firstTopComment.replies).toBeInstanceOf(Array);
      expect(firstTopComment.replies.length).toEqual(1);
      expect(firstTopComment.replies[0].text).toEqual("Reply by user1");
    });
  });

  describe('PATCH /:commentId (Update Comment)', () => {
    beforeEach(async () => {
      comment1ByUser2 = await Comment.create({ user_id: user2.id, post_id: post1.id, text: 'Original comment text' });
    });

    it('should allow the author to update their comment', async () => {
      const updatedText = { text: 'Updated my comment!' };
      const res = await request(app)
        .patch(`/api/v1/posts/${post1.id}/comments/${comment1ByUser2.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updatedText);

      expect(res.statusCode).toEqual(200);
      expect(res.body.comment.text).toEqual(updatedText.text);
    });

    it('should not allow another user to update a comment', async () => {
      const res = await request(app)
        .patch(`/api/v1/posts/${post1.id}/comments/${comment1ByUser2.id}`)
        .set('Authorization', `Bearer ${user1Token}`) // user1 trying to update user2's comment
        .send({ text: 'Trying to update' });
      expect(res.statusCode).toBeOneOf([403, 404]); // Service should prevent this
    });

    it('should return 404 if comment not found', async () => {
        const res = await request(app)
        .patch(`/api/v1/posts/${post1.id}/comments/99999`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ text: 'Updating non-existent comment' });
        expect(res.statusCode).toEqual(404);
    });
  });

  describe('DELETE /:commentId (Delete Comment)', () => {
     beforeEach(async () => {
      comment1ByUser2 = await Comment.create({ user_id: user2.id, post_id: post1.id, text: 'To be deleted' });
      await Comment.create({ user_id: user1.id, post_id: post1.id, text: "A reply to be deleted too", parent_comment_id: comment1ByUser2.id });
    });

    it('should allow the author to delete their comment (and its replies)', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${post1.id}/comments/${comment1ByUser2.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Comment deleted successfully.');

      const deletedComment = await Comment.findByPk(comment1ByUser2.id);
      expect(deletedComment).toBeNull();
      const replies = await Comment.findAll({ where: { parent_comment_id: comment1ByUser2.id }});
      expect(replies.length).toEqual(0); // Assuming CASCADE delete worked
    });

    it('should not allow another user to delete a comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${post1.id}/comments/${comment1ByUser2.id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toBeOneOf([403, 404]);
    });
  });

  // Test GET /:commentId (get specific comment by ID)
  describe('GET /:commentId (Get Specific Comment)', () => {
    let testComment;
    beforeEach(async () => {
        testComment = await Comment.create({ user_id: user1.id, post_id: post1.id, text: "A specific comment" });
    });
    it('should retrieve a specific comment by its ID', async () => {
        const res = await request(app)
            .get(`/api/v1/posts/${post1.id}/comments/${testComment.id}`); // No auth needed for GET typically
        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toEqual(testComment.id);
        expect(res.body.text).toEqual("A specific comment");
        expect(res.body).toHaveProperty('commenter');
    });

    it('should return 404 if specific comment not found', async () => {
        const res = await request(app)
            .get(`/api/v1/posts/${post1.id}/comments/9999`);
        expect(res.statusCode).toEqual(404);
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