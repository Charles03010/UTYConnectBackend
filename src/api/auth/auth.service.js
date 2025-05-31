const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../db/models");
const { User } = db;
const jwtConfig = require("../../config/jwt.config");
const { Op } = require("sequelize");

class AuthService {
  async register(userData) {
    const { name, username, email, password } = userData;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      const errors = [];
      if (existingUser.username === username) {
        errors.push({ field: "username", message: "Username already taken." });
      }
      if (existingUser.email === email) {
        errors.push({ field: "email", message: "Email already registered." });
      }
      const error = new Error("Validation failed.");
      error.statusCode = 409;
      error.errors = errors;
      throw error;
    }

    const newUser = await User.create({ name, username, email, password });

    const userJson = newUser.toJSON();
    delete userJson.password;
    return userJson;
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      const error = new Error("Invalid email or password.");
      error.statusCode = 401;
      throw error;
    }

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    const userJson = user.toJSON();
    delete userJson.password;

    return { user: userJson, token };
  }
}

module.exports = new AuthService();
