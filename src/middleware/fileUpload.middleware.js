const multer = require("multer");
const path = require("path");
const fs = require("fs");

const profilePicDir = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "uploads",
  "profile_pictures"
);
const postImageDir = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "uploads",
  "post_images"
);

fs.mkdirSync(profilePicDir, { recursive: true });
fs.mkdirSync(postImageDir, { recursive: true });

const createStorage = (destinationPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + extension);
    },
  });
};

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Only image files (jpeg, png, gif, webp) are allowed!"
      ),
      false
    );
  }
};

const uploadProfilePicture = multer({
  storage: createStorage(profilePicDir),
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
  fileFilter: imageFileFilter,
}).single("profile_picture");

const uploadPostImage = multer({
  storage: createStorage(postImageDir),
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: imageFileFilter,
}).single("post_image");

const handleUploadProfilePicture = (req, res, next) => {
  uploadProfilePicture(req, res, (err) => {
    if (err) {
      return next(err);
    }

    next();
  });
};

const handleUploadPostImage = (req, res, next) => {
  uploadPostImage(req, res, (err) => {
    if (err) {
      return next(err);
    }

    next();
  });
};

module.exports = {
  handleUploadProfilePicture,
  handleUploadPostImage,
};
