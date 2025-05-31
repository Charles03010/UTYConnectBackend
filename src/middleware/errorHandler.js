const { Sequelize } = require("sequelize");

const errorHandler = (err, req, res, next) => {
  console.error("------------------------------------------------------");
  console.error("Error Occurred:");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Path:", req.path);
  console.error("Method:", req.method);
  if (req.user) {
    console.error("User ID:", req.user.id);
  }
  console.error("Error Name:", err.name);
  console.error("Error Message:", err.message);
  if (err.errors) {
    console.error("Error Details:", JSON.stringify(err.errors, null, 2));
  }
  console.error("Stack Trace:", err.stack);
  console.error("------------------------------------------------------");

  let statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected internal server error occurred.";
  let errors = err.errors || undefined;

  if (err instanceof Sequelize.ValidationError) {
    statusCode = 400;
    message = "Validation failed.";
    errors = err.errors.map((e) => ({
      message: e.message,
      field: e.path,
      value: e.value,
      type: e.type,
    }));
  } else if (err instanceof Sequelize.UniqueConstraintError) {
    statusCode = 409;
    message = "A record with the provided value already exists.";
    errors = err.errors.map((e) => ({
      message: e.message,
      field: e.path,
      value: e.value,
    }));
  } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
    statusCode = 400;
    message = `A referenced entity does not exist or cannot be processed. Field: ${
      err.fields ? err.fields.join(", ") : err.index
    }`;
  } else if (err instanceof Sequelize.DatabaseError) {
    statusCode = 500;
    message = "A database error occurred.";

    if (process.env.NODE_ENV !== "production") {
      message += ` (DB Error: ${
        err.original ? err.original.message : err.message
      })`;
    }
  }

  if (err.name === "MulterError") {
    statusCode = 400;
    message = err.message;
    if (err.field) {
      errors = [{ field: err.field, message: err.message }];
    }
  }

  if (Array.isArray(err.errors) && err.errors[0] && err.errors[0].msg) {
    statusCode = 400;
    message = "Validation failed. Please check your input.";
    errors = err.errors.map((e) => ({
      message: e.msg,
      field: e.param || e.path,
      value: e.value,
    }));
  }

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" &&
      !errors && { stack: err.stack }),
  });
};

module.exports = errorHandler;
