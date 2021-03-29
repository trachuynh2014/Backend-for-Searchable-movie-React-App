const auth = require("../middleware/auth");
const validateId = require("../middleware/validate");
const { User, validate } = require("../models/user");
const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const router = express.Router();

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", validateId(validate), async (req, res) => {
  let user = await User.lookup(req.body.email);
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["name", "email", "password"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();
  const token = user.generateAuthToken();
  res.header("X-auth-token", token).send(_.pick(user, ["id", "name", "email"]));
});

module.exports = router;
