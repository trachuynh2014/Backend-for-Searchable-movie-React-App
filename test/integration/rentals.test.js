const request = require("supertest");
const { Rental } = require("../../models/rental");
const { Movie } = require("../../models/movie");
const { User } = require("../../models/user");
const mongoose = require("mongoose");

let server;

describe("/api/rentals", () => {
  const api = "/api/rentals";
  beforeEach(() => {
    server = require("../../index");
  });
  afterEach(async () => {
    await server.close();
    await Rental.remove({});
  });
  describe("GET /", () => {
    it("should return all rentals", async () => {
      await Rental.collection.insertMany([
        {
          customer: {
            _id: mongoose.Types.ObjectId(),
            name: "customer1",
            phone: "12345",
          },
          movie: {
            _id: mongoose.Types.ObjectId(),
            title: "12345",
            dailyRentalRate: 2,
          },
        },
        {
          customer: {
            _id: mongoose.Types.ObjectId(),
            name: "customer2",
            phone: "12345",
          },
          movie: {
            _id: mongoose.Types.ObjectId(),
            title: "12345",
            dailyRentalRate: 2,
          },
        },
      ]);
      const res = await request(server).get(api);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(
        res.body.some((g) => g.customer.name === "customer1")
      ).toBeTruthy();
      expect(
        res.body.some((g) => g.customer.name === "customer2")
      ).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return a rental if valid id is passed", async () => {
      const rental = new Rental({
        customer: {
          _id: mongoose.Types.ObjectId(),
          name: "customer1",
          phone: "12345",
        },
        movie: {
          _id: mongoose.Types.ObjectId(),
          title: "12345",
          dailyRentalRate: 2,
        },
      });
      await rental.save();

      const res = await request(server).get(api + "/" + rental._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("customer");
      expect(res.body).toHaveProperty("movie");
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get(api + "/1");

      expect(res.status).toBe(404);
    });

    it("should return 404 if no genre with the given id exists", async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get(api + "/" + id);

      expect(res.status).toBe(404);
    });
  });

  //   describe("POST /", () => {
  //     let server;
  //     let customerId;
  //     let movieId;
  //     let rental;
  //     let token;
  //     let movie;

  //     const exec = () => {
  //       return request(server)
  //         .post("/api/returns")
  //         .set("x-auth-token", token)
  //         .send({ customerId, movieId });
  //     };

  //     beforeEach(async () => {
  //       server = require("../../index");

  //       customerId = mongoose.Types.ObjectId();
  //       movieId = mongoose.Types.ObjectId();
  //       token = new User().generateAuthToken();

  //       movie = new Movie({
  //         _id: movieId,
  //         title: "12345",
  //         dailyRentalRate: 2,
  //         genre: { name: "12345" },
  //         numberInStock: 0,
  //       });
  //       await movie.save();

  //       rental = new Rental({
  //         customer: {
  //           _id: customerId,
  //           name: "12345",
  //           phone: "12345",
  //         },
  //         movie: {
  //           _id: movieId,
  //           title: "12345",
  //           dailyRentalRate: 2,
  //         },
  //       });

  //       await rental.save();
  //     });

  //     it("shoud return 401 if client is not logged in", async () => {
  //       token = "";
  //       const res = await exec();
  //       expect(res.status).toBe(401);
  //     });

  //     it("shoud return 400 if customerId is not provided", async () => {
  //       customerId = "";

  //       const res = await exec();

  //       expect(res.status).toBe(400);
  //     });

  //     it("shoud return 400 if movieId is not provided", async () => {
  //       movieId = "";

  //       const res = await exec();

  //       expect(res.status).toBe(400);
  //     });

  //     it("shoud return 400 if no more movies in stock", async () => {
  //       const res = await exec();
  //       const movie = await Movie.findById(movieId);
  //       expect(movie.numberInStock).toBe(0);
  //       expect(res.status).toBe(400);
  //     });

  //     //   it("shoud save the genre if it is valid", async () => {
  //     //     await exec();
  //     //     const genre = await Genre.find({ name: "genre1" });
  //     //     expect(genre).not.toBeNull();
  //     //   });

  //     //   it("shoud return the genre if it is valid", async () => {
  //     //     const res = await exec();
  //     //     expect(res.body).toHaveProperty("_id");
  //     //     expect(res.body).toHaveProperty("name", "genre1");
  //     //   });
  //   });
});
