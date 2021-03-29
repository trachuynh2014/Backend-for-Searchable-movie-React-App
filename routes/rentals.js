const auth = require("../middleware/auth");
const validateId = require("../middleware/validate");
const validateObjectId = require("../middleware/validateObjectId");
const { Rental, validate } = require("../models/rental");
const { Movie } = require("../models/movie");
const { Customer } = require("../models/customer");
const mongoose = require("mongoose");
const Fawn = require("fawn");
const express = require("express");
const router = express.Router();

Fawn.init(mongoose);

router.post("/", [auth, validateId(validate)], async (req, res) => {
  const customer = await Customer.findById(req.body.customerId);
  const movie = await Movie.findById(req.body.movieId);
  if (!customer) return res.status(400).send("Invalid customer");
  if (!movie) return res.status(400).send("Invalid movie");
  if (movie.numberInStock === 0)
    return res.status(400).send("Movie not in stock");

  const rental = new Rental({
    // t k có Dateout bởi vì t set default value của DateOut là date.now -> khi t save, nó sẽ save thời gian t save, not thời gian mà user mượn
    customer: { _id: customer._id, name: customer.name, phone: customer.phone },
    movie: {
      _id: movie._id,
      title: movie.title,
      dailyRentalRate: movie.dailyRentalRate,
    },
  });
  // có 1 problem đó là tại vì t có 2 cái save, cho nên là nếu như something go wrong ở khoảng thời gian
  // giữa 2 cái save này, cái save thứ 2 sẽ k đc complete. Lúc này t cần 1 transaction,
  // với tran, t có thể ensure là cả 2 cái save đó đều có thể được ok hoặc là đều fail
  // tuy nhiên, ở trong mgdb lại k có concept của transaction
  try {
    new Fawn.Task()
      .save("rentals", rental)
      .update("movies", { _id: movie._id }, { $inc: { numberInStock: -1 } })
      .run();

    res.send(rental);
  } catch (error) {
    res.status(500).send("Something failed");
  }
});

router.get("/", async (req, res) => {
  const rentals = await Rental.find().sort({ dateOut: -1 });
  res.send(rentals);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const rental = await Rental.findById(req.params.id).select("-__v");
  if (!rental)
    return res.status(404).send("Cannot find the rental you are looking for.");
  res.send(rental);
});

module.exports = router;
