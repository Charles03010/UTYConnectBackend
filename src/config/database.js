const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config();

const env = process.env.NODE_ENV || "development";
const config = require("./config.json")[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  if (
    config.dialect === "sqlite" &&
    config.storage &&
    !path.isAbsolute(config.storage)
  ) {
    config.storage = path.resolve(
      __dirname,
      "..",
      "db",
      config.storage.split("/").pop()
    );
  }
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

testConnection();

module.exports = db;
