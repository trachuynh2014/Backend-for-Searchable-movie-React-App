const request = require("supertest");
const { Genre } = require("../../models/genre");
const { User } = require("../../models/user");
const { Movie } = require("../../models/movie");
const mongoose = require("mongoose");

let server;

describe("/api/movies", () => {
  const api = "/api/movies";
  beforeEach(() => {
    server = require("../../index");
  });
  afterEach(async () => {
    await server.close();
    await Movie.remove({});
    await Genre.remove({});
  });
  describe("GET /", () => {
    it("should return all movies", async () => {
      await Movie.collection.insertMany([
        {
          title: "movie1",
          dailyRentalRate: 2,
          genre: { name: "12345" },
          numberInStock: 10,
        },
        {
          title: "movie2",
          dailyRentalRate: 3,
          genre: { name: "12345" },
          numberInStock: 11,
        },
      ]);
      const res = await request(server).get(api);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.title === "movie1")).toBeTruthy();
      expect(res.body.some((g) => g.title === "movie2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return a movie if valid id is passed", async () => {
      const movie = new Movie({
        title: "movie1",
        dailyRentalRate: 2,
        genre: { name: "12345" },
        numberInStock: 10,
      });
      await movie.save();

      const res = await request(server).get(api + "/" + movie._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("title", movie.title);
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get(api + "/1");

      expect(res.status).toBe(404);
    });

    it("should return 404 if no movie with the given id exists", async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get(api + "/" + id);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    let token;
    let title;
    let numberInStock;
    let dailyRentalRate;
    let genreId;

    const exec = async () => {
      return await request(server).post(api).set("x-auth-token", token).send({
        title,
        dailyRentalRate,
        genreId,
        numberInStock,
      });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();

      genre = new Genre({ name: "12345" });
      genreId = genre._id;
      await genre.save();

      title = "movie1";
      numberInStock = 10;
      dailyRentalRate = 2;
      movie = new Movie({
        title,
        dailyRentalRate,
        genre,
        numberInStock,
      });
      await movie.save();
    });

    it("shoud return 401 if client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("shoud return 400 if title is less than 5 characters", async () => {
      title = "1234";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if title is more than 255 characters", async () => {
      title = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if numberInStock is less than 0", async () => {
      numberInStock = -1;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if numberInStock is more than 255", async () => {
      numberInStock = 256;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if dailyRentalRate is less than 0", async () => {
      dailyRentalRate = -1;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if dailyRentalRate is more than 255", async () => {
      dailyRentalRate = 256;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if genre with given Id is not found", async () => {
      genreId = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud save the movie if it is valid", async () => {
      await exec();
      const movie = await Movie.findOne({ title: "movie1" });
      expect(movie).not.toBeNull();
    });

    it("shoud return the movie if it is valid", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          "_id",
          "title",
          "numberInStock",
          "dailyRentalRate",
          "genre",
        ])
      );
    });
  });

  describe("PUT /:id", () => {
    let token;
    let movie;
    let id;
    let newTitle;
    let newDailyRentalRate;
    let newNumberInStock;
    let genre;

    const exec = async () => {
      return await request(server)
        .put(api + "/" + id)
        .set("x-auth-token", token)
        .send({
          title: newTitle,
          dailyRentalRate: newDailyRentalRate,
          genreId,
          numberInStock: newNumberInStock,
        });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();

      genre = new Genre({ name: "12345" });
      genreId = genre._id;
      await genre.save();

      newTitle = "movie1";
      newNumberInStock = 10;
      newDailyRentalRate = 2;
      movie = new Movie({
        title: "12345",
        dailyRentalRate: 2,
        genre,
        numberInStock: 10,
      });
      id = movie._id;
      await movie.save();
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("shoud return 400 if title is less than 5 characters", async () => {
      newTitle = "1234";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if title is more than 255 characters", async () => {
      newTitle = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if numberInStock is less than 0", async () => {
      newNumberInStock = -1;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if numberInStock is more than 255", async () => {
      newNumberInStock = 256;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if dailyRentalRate is less than 0", async () => {
      newDailyRentalRate = -1;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if dailyRentalRate is more than 255", async () => {
      newDailyRentalRate = 256;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if genre with given Id is not found", async () => {
      genreId = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 if invalid id is passed", async () => {
      id = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if no movie with the given id exists", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("shoud return the movie if it is valid", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          "_id",
          "title",
          "numberInStock",
          "dailyRentalRate",
          "genre",
        ])
      );
    });
  });

  describe("DELETE /:id", () => {
    let token;
    let genre;
    let id;
    let movie;

    const exec = async () => {
      return await request(server)
        .delete(api + "/" + id)
        .set("x-auth-token", token)
        .send();
    };

    beforeEach(async () => {
      token = new User({ isAdmin: true }).generateAuthToken();
      genre = new Genre({ name: "12345" });
      await genre.save();

      title = "movie1";
      numberInStock = 10;
      dailyRentalRate = 2;
      movie = new Movie({
        title,
        dailyRentalRate,
        genre,
        numberInStock,
      });
      await movie.save();

      id = movie._id;
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 403 if user is not an admin", async () => {
      token = new User({ isAdmin: false }).generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return 404 if invalid id is passed", async () => {
      id = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if no movie with the given id exists", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("shoud delete the movie if it is valid", async () => {
      await exec();

      const deleteMovie = await Movie.findById(id);
      expect(deleteMovie).toBeNull();
    });

    it("shoud return the removed movie", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          "_id",
          "title",
          "numberInStock",
          "dailyRentalRate",
          "genre",
        ])
      );
    });
  });
});
