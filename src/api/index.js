const express = require("express");
const authRoutes = require("./auth/auth.routes");
const userRoutes = require("./users/users.routes");
const postRoutes = require("./posts/posts.routes");
const commentRoutes = require("./comments/comments.routes");
const chatRoutes = require("./chats/chats.routes");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Social Media API - Main Entry Point",
    version: "v1",
    documentation: "/api/v1/docs",
  });
});
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/chats", chatRoutes);

module.exports = router;
