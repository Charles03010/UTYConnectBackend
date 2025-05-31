// tests/integration/posts.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db/models');
const { User, Post, UserLike, UserSave, Comment } = db;
const path = require('path');

let user1Token, user2Token;
let user1, user2;
let post1ByUser1, post2ByUser2;

const setupTestUsersAndTokens = async () => {
  user1 = await User.create({ name: 'Post User1', username: 'postuser1', email: 'postuser1@example.com', password: 'password123' });
  user2 = await User.create({ name: 'Post User2', username: 'postuser2', email: 'postuser2@example.com', password: 'password123' });

  let res = await request(app).post('/api/v1/auth/login').send({ email: 'postuser1@example.com', password: 'password123' });
  user1Token = res.body.token;
  res = await request(app).post('/api/v1/auth/login').send({ email: 'postuser2@example.com', password: 'password123' });
  user2Token = res.body.token;
};

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await db.sequelize.sync({ force: true });
  } else {
    throw new Error('NODE_ENV not set to test. Aborting tests.');
  }
});

beforeEach(async () => {
  await setupTestUsersAndTokens();
  // Create some posts for testing
  post1ByUser1 = await Post.create({ user_id: user1.id, image_url: '/uploads/test/post1.jpg', caption: 'Post 1 by User 1' });
  post2ByUser2 = await Post.create({ user_id: user2.id, image_url: '/uploads/test/post2.jpg', caption: 'Post 2 by User 2' });
});

afterEach(async () => {
  // Clean up in reverse order of creation or dependency
  await Comment.destroy({ where: {} });
  await UserLike.destroy({ where: {} });
  await UserSave.destroy({ where: {} });
  await Post.destroy({ where: {} });
  await User.destroy({ where: {} });
  user1Token = null; user2Token = null;
  user1 = null; user2 = null;
  post1ByUser1 = null; post2ByUser2 = null;
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('Post API - /api/v1/posts', () => {
  describe('POST / (Create Post)', () => {
    it('should create a new post with image and caption', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .field('caption', 'My new awesome post')
        .attach('post_image', path.resolve(__dirname, '../fixtures/sample-image.png'));

      expect(res.statusCode).toEqual(201);
      expect(res.body.caption).toEqual('My new awesome post');
      expect(res.body.image_url).toMatch(/^\/uploads\/post_images\/post_image-/);
      expect(res.body.author.id).toEqual(user1.id);
    });

    it('should require an image to create a post', async () => {
        const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ caption: 'Post without image' }); // No image attached

      expect(res.statusCode).toEqual(400); // Service layer should throw error if no file
      // The exact error message depends on your service implementation or file upload middleware.
      // If using the provided fileUpload.middleware and service correctly:
      expect(res.body.message).toContain('Post image is required');
    });


    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .field('caption', 'Unauthorized post')
        .attach('post_image', path.resolve(__dirname, '../fixtures/sample-image.png'));
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET / (Get All Posts - Feed)', () => {
    it('should get a list of posts with pagination', async () => {
      const res = await request(app).get('/api/v1/posts?page=1&limit=2');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('posts');
      expect(res.body.posts.length).toBeLessThanOrEqual(2);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage', 1);
      // Check if posts have author and counts
      if (res.body.posts.length > 0) {
          expect(res.body.posts[0]).toHaveProperty('author');
          expect(res.body.posts[0]).toHaveProperty('likesCount');
          expect(res.body.posts[0]).toHaveProperty('commentsCount');
      }
    });
  });

  describe('GET /:postId (Get Single Post)', () => {
    it('should get a single post by ID with details', async () => {
      const res = await request(app)
        .get(`/api/v1/posts/${post1ByUser1.id}`)
        .set('Authorization', `Bearer ${user1Token}`); // Auth to get isLikedByCurrentUser etc.

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(post1ByUser1.id);
      expect(res.body.caption).toEqual(post1ByUser1.caption);
      expect(res.body).toHaveProperty('author');
      expect(res.body).toHaveProperty('comments');
      expect(res.body).toHaveProperty('likesCount');
      expect(res.body).toHaveProperty('isLikedByCurrentUser'); // Because authenticated
    });

    it('should return 404 if post not found', async () => {
      const res = await request(app)
        .get('/api/v1/posts/99999')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PATCH /:postId (Update Post)', () => {
    it('should update a post caption if user is the author', async () => {
      const newCaption = 'Updated caption for post 1';
      const res = await request(app)
        .patch(`/api/v1/posts/${post1ByUser1.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ caption: newCaption });

      expect(res.statusCode).toEqual(200);
      expect(res.body.post.caption).toEqual(newCaption);
    });

    it('should return 404 if trying to update a non-existent post', async () => {
        const res = await request(app)
        .patch('/api/v1/posts/99999')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ caption: 'Non-existent' });
        expect(res.statusCode).toEqual(404);
    });

    it('should return 404 (or 403) if user is not the author', async () => {
      const res = await request(app)
        .patch(`/api/v1/posts/${post1ByUser1.id}`) // post1 is by user1
        .set('Authorization', `Bearer ${user2Token}`) // user2 trying to update
        .send({ caption: 'Attempted unauthorized update' });
      expect(res.statusCode).toBeOneOf([403, 404]); // Service might return 404 "not found (for this user)" or 403
      expect(res.body.message).toContain('Post not found or user not authorized');
    });
  });

  describe('DELETE /:postId (Delete Post)', () => {
    it('should delete a post if user is the author', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${post1ByUser1.id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Post deleted successfully.');

      const deletedPost = await Post.findByPk(post1ByUser1.id);
      expect(deletedPost).toBeNull();
    });

    it('should return 404 (or 403) if trying to delete post of another user', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${post1ByUser1.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.statusCode).toBeOneOf([403, 404]);
    });
  });

  describe('POST /:postId/like & DELETE /:postId/like (Like/Unlike Post)', () => {
    it('should allow a user to like a post', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${post2ByUser2.id}/like`) // user1 liking user2's post
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Post liked successfully.');
      const like = await UserLike.findOne({ where: { user_id: user1.id, post_id: post2ByUser2.id }});
      expect(like).not.toBeNull();
    });

     it('should return a message if post is already liked', async () => {
      await UserLike.create({ user_id: user1.id, post_id: post2ByUser2.id });
      const res = await request(app)
        .post(`/api/v1/posts/${post2ByUser2.id}/like`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Post already liked.');
    });

    it('should allow a user to unlike a post', async () => {
      await UserLike.create({ user_id: user1.id, post_id: post2ByUser2.id });
      const res = await request(app)
        .delete(`/api/v1/posts/${post2ByUser2.id}/like`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Post unliked successfully.');
      const like = await UserLike.findOne({ where: { user_id: user1.id, post_id: post2ByUser2.id }});
      expect(like).toBeNull();
    });

    it('should return 404 if trying to unlike a post not liked', async () => {
        const res = await request(app)
        .delete(`/api/v1/posts/${post2ByUser2.id}/like`)
        .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(404); // Or 400 based on service logic
    });
  });

  describe('POST /:postId/save & DELETE /:postId/save (Save/Unsave Post)', () => {
    it('should allow a user to save a post', async () => {
        const res = await request(app)
            .post(`/api/v1/posts/${post2ByUser2.id}/save`)
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Post saved successfully.');
        const save = await UserSave.findOne({ where: { user_id: user1.id, post_id: post2ByUser2.id } });
        expect(save).not.toBeNull();
    });

    it('should allow a user to unsave a post', async () => {
        await UserSave.create({ user_id: user1.id, post_id: post2ByUser2.id });
        const res = await request(app)
            .delete(`/api/v1/posts/${post2ByUser2.id}/save`)
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Post unsaved successfully.');
        const save = await UserSave.findOne({ where: { user_id: user1.id, post_id: post2ByUser2.id } });
        expect(save).toBeNull();
    });
  });

  describe('GET /user/liked & GET /user/saved', () => {
    beforeEach(async () => {
        await UserLike.create({ user_id: user1.id, post_id: post2ByUser2.id });
        await UserSave.create({ user_id: user1.id, post_id: post1ByUser1.id }); // user1 saves their own post
    });

    it('should get posts liked by the authenticated user', async () => {
        const res = await request(app)
            .get('/api/v1/posts/user/liked')
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toEqual(1);
        expect(res.body[0].id).toEqual(post2ByUser2.id);
    });

    it('should get posts saved by the authenticated user', async () => {
        const res = await request(app)
            .get('/api/v1/posts/user/saved')
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toEqual(1);
        expect(res.body[0].id).toEqual(post1ByUser1.id);
    });
  });

   describe('GET /:postId/likes (Get users who liked a post)', () => {
        beforeEach(async () => {
            await UserLike.create({ user_id: user1.id, post_id: post2ByUser2.id });
            await UserLike.create({ user_id: user2.id, post_id: post2ByUser2.id });
        });
        it('should get a list of users who liked a specific post', async () => {
            const res = await request(app)
                .get(`/api/v1/posts/${post2ByUser2.id}/likes`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toEqual(2);
            expect(res.body.some(u => u.username === user1.username)).toBe(true);
            expect(res.body.some(u => u.username === user2.username)).toBe(true);
        });

        it('should return empty array if no one liked the post', async () => {
             const res = await request(app)
                .get(`/api/v1/posts/${post1ByUser1.id}/likes`); // No one liked post1 yet
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toEqual(0);
        });
    });

});

// Helper for expect.toBeOneOf
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