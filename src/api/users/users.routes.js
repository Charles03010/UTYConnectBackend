const express = require("express");
const userController = require("./users.controller");
const { authenticateToken } = require("../../middleware/auth.middleware");
const {
  handleUploadProfilePicture,
} = require("../../middleware/fileUpload.middleware");
const { body, param } = require("express-validator");

const router = express.Router();

router.get(
  "/:identifier",
  [
    param("identifier")
      .notEmpty()
      .withMessage("User identifier (ID or username) is required")
      .trim()
      .escape(),
  ],
  userController.getUserProfile
);

router.patch(
  "/me/profile",
  authenticateToken,
  handleUploadProfilePicture,
  [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .trim()
      .escape(),
    body("bio")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Bio cannot exceed 255 characters")
      .trim()
      .escape(),
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      )
      .trim()
      .escape(),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Provide a valid email")
      .normalizeEmail(),
  ],
  userController.updateUserProfile
);

router.post(
  "/:username/follow",
  authenticateToken,
  [
    param("username")
      .notEmpty()
      .withMessage("Username to follow is required")
      .trim()
      .escape(),
  ],
  userController.followUser
);

router.delete(
  "/:username/unfollow",
  authenticateToken,
  [
    param("username")
      .notEmpty()
      .withMessage("Username to unfollow is required")
      .trim()
      .escape(),
  ],
  userController.unfollowUser
);

router.get(
  "/:username/followers",
  [
    param("username")
      .notEmpty()
      .withMessage("Username is required")
      .trim()
      .escape(),
  ],
  userController.getFollowers
);

router.get(
  "/:username/following",
  [
    param("username")
      .notEmpty()
      .withMessage("Username is required")
      .trim()
      .escape(),
  ],
  userController.getFollowing
);

module.exports = router;
