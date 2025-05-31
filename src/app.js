const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const apiRoutes = require("./api");
const errorHandler = require("./middleware/errorHandler");
const db = require("./config/database");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads"))
);

app.use("/api/v1", apiRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Social Media API is up and running! 🚀",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res, next) => {
  const error = new Error(
    `🔍 Oops! The resource at ${req.originalUrl} was not found.`
  );
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

module.exports = app;
