const { User } = require("../models/user");
const express = require("express");
const validateId = require("../middleware/validate");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const _ = require("lodash");
const router = express.Router();

router.post("/", validateId(validate), async (req, res) => {
  let user = await User.lookup(req.body.email);
  if (!user) return res.status(400).send("Invalid email or password.");
  const validPassword = await bcrypt.compare(req.body.password, user.password);

  if (!validPassword) return res.status(400).send("Invalid email or password");

  const token = user.generateAuthToken();
  res.send(token);
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
      .min(8)
      .max(255)
      .required(),
  });

  return schema.validate(req);
}

module.exports = router;
