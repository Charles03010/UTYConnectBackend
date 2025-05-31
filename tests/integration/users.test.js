// tests/integration/users.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db/models');
const { User, UserFollow } = db;
const path = require('path');

// Helper function to get a token
const getAuthToken = async (email = 'user1@example.com', password = 'password123') => {
  await User.create({ name: 'User One', username: 'user1', email, password });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.token;
};

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await db.sequelize.sync({ force: true });
  } else {
    throw new Error('NODE_ENV not set to test. Aborting tests.');
  }
});

afterEach(async () => {
  await UserFollow.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('User API - /api/v1/users', () => {
  let tokenUser1;
  let user1Data = { name: 'User One', username: 'user1', email: 'user1@example.com', password: 'password123' };
  let user2Data = { name: 'User Two', username: 'user2', email: 'user2@example.com', password: 'password123' };
  let createdUser1, createdUser2;

  beforeEach(async () => {
    // Manually create users to control their IDs and data for tests
    createdUser1 = await User.create(user1Data);
    createdUser2 = await User.create(user2Data);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Data.email, password: user1Data.password });
    tokenUser1 = loginRes.body.token;
  });

  describe('GET /:identifier (User Profile)', () => {
    it('should get a user profile by username', async () => {
      const res = await request(app).get(`/api/v1/users/${createdUser2.username}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.username).toEqual(createdUser2.username);
      expect(res.body).toHaveProperty('postsCount');
      expect(res.body).toHaveProperty('followersCount');
      expect(res.body).toHaveProperty('followingCount');
    });

    it('should get a user profile by ID', async () => {
      const res = await request(app).get(`/api/v1/users/${createdUser2.id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(createdUser2.id);
    });

    it('should return 404 if user not found', async () => {
      const res = await request(app).get('/api/v1/users/nonexistentuser');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PATCH /me/profile (Update Profile)', () => {
    it('should update authenticated user profile (name and bio)', async () => {
      const newProfileData = { name: 'Updated Name', bio: 'My new bio.' };
      const res = await request(app)
        .patch('/api/v1/users/me/profile')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send(newProfileData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.name).toEqual(newProfileData.name);
      expect(res.body.user.bio).toEqual(newProfileData.bio);
      expect(res.body.user.id).toEqual(createdUser1.id);
    });

    it('should update authenticated user profile picture', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me/profile')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .attach('profile_picture', path.resolve(__dirname, '../fixtures/sample-image.png')); // Create a dummy image file

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.profile_picture_url).toMatch(/^\/uploads\/profile_pictures\/profile_picture-/);
      // TODO: Add cleanup for uploaded files if not using :memory: for storage in tests
    });


    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me/profile')
        .send({ name: 'No Auth Update' });
      expect(res.statusCode).toEqual(401);
    });

    it('should return 409 if updating to an existing username', async() => {
        const res = await request(app)
        .patch('/api/v1/users/me/profile')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ username: createdUser2.username }); // Try to take user2's username

        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toEqual('Username already taken.');
    });
  });


  describe('POST /:username/follow & DELETE /:username/unfollow', () => {
    it('should allow authenticated user to follow another user', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${createdUser2.username}/follow`)
        .set('Authorization', `Bearer ${tokenUser1}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual(`Successfully followed ${createdUser2.username}.`);

      const followRecord = await UserFollow.findOne({
        where: { follower_id: createdUser1.id, following_id: createdUser2.id }
      });
      expect(followRecord).not.toBeNull();
    });

    it('should return a message if already following', async () => {
      await UserFollow.create({ follower_id: createdUser1.id, following_id: createdUser2.id });
      const res = await request(app)
        .post(`/api/v1/users/${createdUser2.username}/follow`)
        .set('Authorization', `Bearer ${tokenUser1}`);
      expect(res.statusCode).toEqual(200); // Or could be 409 Conflict depending on service logic
      expect(res.body.message).toEqual('You are already following this user.');
    });

    it('should not allow user to follow themselves', async () => {
        const res = await request(app)
        .post(`/api/v1/users/${createdUser1.username}/follow`)
        .set('Authorization', `Bearer ${tokenUser1}`);
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toEqual('You cannot follow yourself.');
    });

    it('should allow authenticated user to unfollow another user', async () => {
      await UserFollow.create({ follower_id: createdUser1.id, following_id: createdUser2.id });
      const res = await request(app)
        .delete(`/api/v1/users/${createdUser2.username}/unfollow`)
        .set('Authorization', `Bearer ${tokenUser1}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual(`Successfully unfollowed ${createdUser2.username}.`);

      const followRecord = await UserFollow.findOne({
        where: { follower_id: createdUser1.id, following_id: createdUser2.id }
      });
      expect(followRecord).toBeNull();
    });

    it('should return a message if not following when trying to unfollow', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${createdUser2.username}/unfollow`)
        .set('Authorization', `Bearer ${tokenUser1}`);
      expect(res.statusCode).toEqual(200); // Or 404 if service throws error
      expect(res.body.message).toEqual('You are not following this user.');
    });
  });

  describe('GET /:username/followers & GET /:username/following', () => {
    beforeEach(async () => {
        // user1 follows user2
        // user2 follows user1
        // a new user (user3) follows user1
        let user3 = await User.create({name: 'User Three', username: 'user3', email: 'user3@example.com', password: 'password123'});
        await UserFollow.create({ follower_id: createdUser1.id, following_id: createdUser2.id });
        await UserFollow.create({ follower_id: createdUser2.id, following_id: createdUser1.id });
        await UserFollow.create({ follower_id: user3.id, following_id: createdUser1.id });
    });

    it('should get list of followers for a user', async () => {
        const res = await request(app).get(`/api/v1/users/${createdUser1.username}/followers`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toEqual(2); // user2 and user3 follow user1
        expect(res.body.some(u => u.username === createdUser2.username)).toBe(true);
        expect(res.body.some(u => u.username === 'user3')).toBe(true);
    });

    it('should get list of users someone is following', async () => {
        const res = await request(app).get(`/api/v1/users/${createdUser1.username}/following`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toEqual(1); // user1 follows user2
        expect(res.body[0].username).toEqual(createdUser2.username);
    });

    it('should return 404 if user for followers/following list is not found', async () => {
        const resFollowers = await request(app).get('/api/v1/users/nonexistent/followers');
        expect(resFollowers.statusCode).toEqual(404);
        const resFollowing = await request(app).get('/api/v1/users/nonexistent/following');
        expect(resFollowing.statusCode).toEqual(404);
    });
  });
});

// Create a dummy file in tests/fixtures/sample-image.png for the upload test
// For example, a small 1x1 pixel PNG.
// You can create this manually or using a script.
// If not, the .attach test will fail to find the file.
// To create tests/fixtures directory: mkdir -p tests/fixtures
// Then place sample-image.png inside.