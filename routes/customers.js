const auth = require("../middleware/auth");
const validateId = require("../middleware/validate");
const validateObjectId = require("../middleware/validateObjectId");
const admin = require("../middleware/admin");
const { Customer, validate } = require("../models/customer");
const express = require("express");
const router = express.Router();

router.post("/", [auth, validateId(validate)], async (req, res) => {
  const customer = new Customer({
    name: req.body.name,
    phone: req.body.phone,
    isGold: req.body.isGold,
  });
  await customer.save();
  res.send(customer);
});

router.get("/", async (req, res) => {
  const customers = await Customer.find().sort({ name: 1 });
  res.send(customers);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer)
    return res
      .status(404)
      .send("Cannot find the customer you are looking for.");
  res.send(customer);
});

router.put(
  "/:id",
  [auth, validateObjectId, validateId(validate)],
  async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    if (!customer)
      return res
        .status(404)
        .send("Cannot find the customer you are looking for.");

    res.send(customer);
  }
);

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const customer = await Customer.findByIdAndRemove(req.params.id);

  if (!customer)
    return res
      .status(404)
      .send("Cannot find the customer you are looking for.");

  res.send(customer);
});

module.exports = router;
