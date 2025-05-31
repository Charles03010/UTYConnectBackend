// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app'); // Adjust path if needed
const db = require('../../src/db/models'); // Adjust path
const { User } = db;
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  // Sync database ensuring it's the test environment
  // In a real-world scenario, you might run migrations here instead of sync({ force: true })
  // especially if you have complex data or want to test migrations themselves.
  if (process.env.NODE_ENV === 'test') {
    await db.sequelize.sync({ force: true });
  } else {
    throw new Error('NODE_ENV not set to test. Aborting tests to prevent data loss.');
  }
});

afterEach(async () => {
  // Clean up database tables after each test
  // Delete in reverse order of dependency, or use truncate with cascade if supported and safe.
  // For simplicity, deleting from User will cascade if set up correctly in models.
  // However, more explicit deletion might be needed for complex scenarios.
  await User.destroy({ where: {}, truncate: false, cascade: true }); // cascade might not work for all SQLite versions with destroy directly
  // A more robust cleanup:
  // await db.ChatMessage.destroy({ where: {} });
  // await db.Chat.destroy({ where: {} });
  // await db.Comment.destroy({ where: {} });
  // await db.UserLike.destroy({ where: {} });
  // await db.UserSave.destroy({ where: {} });
  // await db.UserFollow.destroy({ where: {} });
  // await db.Post.destroy({ where: {} });
  // await User.destroy({ where: {} });
});


afterAll(async () => {
  await db.sequelize.close();
});

describe('Auth API - /api/v1/auth', () => {
  const testUser = {
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user.email).toEqual(testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for missing required fields (e.g., email)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Missing Email User',
          username: 'missingemail',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors).toBeInstanceOf(Array);
      expect(res.body.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should return 409 if username already exists', async () => {
      await User.create(testUser); // Password will be hashed by hook
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'newemail@example.com' }); // Same username, different email
      expect(res.statusCode).toEqual(409);
      expect(res.body.errors.some(e => e.field === 'username' && e.message === 'Username already taken.')).toBe(true);
    });

    it('should return 409 if email already exists', async () => {
      await User.create(testUser);
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, username: 'newusername' }); // Same email, different username
      expect(res.statusCode).toEqual(409);
       expect(res.body.errors.some(e => e.field === 'email' && e.message === 'Email already registered.')).toBe(true);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a user to login with
      // The password in User.create will be hashed by the model hook
      await User.create(testUser);
    });

    it('should login an existing user successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password, // Plain password, service will compare hashed
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid email or password.');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid email or password.');
    });
  });

  describe('GET /me (profile)', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const createdUser = await User.create(testUser);
      userId = createdUser.id;

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      token = loginRes.body.token;
    });

    it('should return user profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('username', testUser.username);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Unauthorized. Authentication token is required.');
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer invalidtoken123`);
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'Forbidden. Invalid token.');
    });
  });
});