const express = require("express");
const postController = require("./posts.controller");
const { authenticateToken } = require("../../middleware/auth.middleware");
const {
  handleUploadPostImage,
} = require("../../middleware/fileUpload.middleware");
const { body, param, query } = require("express-validator");
const commentRoutes = require("../comments/comments.routes");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  handleUploadPostImage,
  [
    body("caption")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Caption cannot exceed 2000 characters"),
  ],
  postController.createPost
);

router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  postController.getAllPosts
);

router.get(
  "/:postId",
  authenticateToken,
  [param("postId").isInt().withMessage("Post ID must be an integer")],
  postController.getPostById
);

router.patch(
  "/:postId",
  authenticateToken,
  [
    param("postId").isInt().withMessage("Post ID must be an integer"),
    body("caption")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Caption cannot exceed 2000 characters"),
  ],
  postController.updatePost
);

router.delete(
  "/:postId",
  authenticateToken,
  [param("postId").isInt().withMessage("Post ID must be an integer")],
  postController.deletePost
);

router.post(
  "/:postId/like",
  authenticateToken,
  [param("postId").isInt().withMessage("Post ID must be an integer")],
  postController.likePost
);

router.delete(
  "/:postId/like",
  authenticateToken,
  [param("postId").isInt().withMessage("Post ID must be an integer")],
  postController.unlikePost
);

router.get(
  "/:postId/likes",
  [param("postId").isInt().withMessage("Post ID must be an integer")],
  postController.getUsersWhoLikedPost
);

router.post(
  "/:postId/save",
  authenticateToken,
  [param("postId").isInt().withMessage("Post ID must be an integer")],
  postController.savePost
);

router.delete(
  "/:postId/save",
  authenticateToken,
  [param("postId").isInt().withMessage("Post ID must be an integer")],
  postController.unsavePost
);

router.get("/user/liked", authenticateToken, postController.getLikedPosts);
router.get("/user/saved", authenticateToken, postController.getSavedPosts);

router.use(
  "/:postId/comments",
  (req, res, next) => {
    req.postId = parseInt(req.params.postId);
    if (isNaN(req.postId)) {
      const err = new Error("Invalid Post ID in path for comments.");
      err.statusCode = 400;
      return next(err);
    }
    next();
  },
  commentRoutes
);

module.exports = router;
