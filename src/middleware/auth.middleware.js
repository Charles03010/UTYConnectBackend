const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt.config");
const db = require("../db/models");
const User = db.User;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res
      .status(401)
      .json({ message: "Unauthorized. Authentication token is required." });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res
        .status(403)
        .json({
          message:
            "Forbidden. User associated with this token no longer exists.",
        });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Forbidden. Token has expired." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Forbidden. Invalid token." });
    }

    console.error("Token verification error:", err);
    return res
      .status(403)
      .json({ message: "Forbidden. Could not verify token." });
  }
};

module.exports = { authenticateToken };
