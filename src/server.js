require("dotenv").config();

const app = require("./app");
const db = require("./config/database");

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`✅ Server is listening on port ${PORT}`);
      console.log(`🌐 Environment: ${NODE_ENV}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log(`🚀 API base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error(
      "❌ Failed to start server or connect to the database:",
      error
    );
    process.exit(1);
  }
};

startServer();
