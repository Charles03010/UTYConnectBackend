const authService = require("./auth.service");
const { validationResult } = require("express-validator");

class AuthController {
  async register(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Validation failed.");
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }

    try {
      const user = await authService.register(req.body);
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Validation failed.");
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }

    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({ message: "Login successful", ...result });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      if (!req.user) {
        const err = new Error("User not found in request.");
        err.statusCode = 404;
        return next(err);
      }
      res.status(200).json(req.user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
