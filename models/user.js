const Joi = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 255,
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8, maxlength: 255 },
  isAdmin: Boolean,
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    config.get("jwtPrivateKey")
  );
  return token;
};

userSchema.statics.lookup = function (email) {
  return User.findOne({ email });
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    // genreID là input từ user, t k cần phải đưa cả genre object cho user
    name: Joi.string().min(5).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
      .min(8)
      .max(255)
      .required(),
  });

  return schema.validate(user);
}

exports.User = User;
exports.validate = validateUser;
