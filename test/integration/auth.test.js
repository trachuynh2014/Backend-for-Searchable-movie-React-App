const request = require("supertest");
const { User } = require("../../models/user");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

describe("/api/auth", () => {
  let server;
  let user;
  let email;
  let password;

  const exec = () => {
    return request(server).post("/api/auth").send({ email, password });
  };

  beforeEach(async () => {
    server = require("../../index");

    userId = mongoose.Types.ObjectId();
    password = "12345678";
    email = "admin@finnhuynh.me";
    user = new User({
      name: "Finn Huynh",
      email: "admin@finnhuynh.me",
      password: "12345678",
    });
    await user.save();
  });
  afterEach(async () => {
    await server.close();
    await User.remove({});
  });

  it("shoud return 400 if email is invalid", async () => {
    email = "1234";
    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("shoud return 400 if papssword is less than 5 characters", async () => {
    password = "1234";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("shoud return 400 if papssword is more than 255 characters", async () => {
    password = new Array(257).join("a");

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("shoud return 400 if cannot find user with given email", async () => {
    email = "12345@gmail.com";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("shoud return 400 if password is wrong", async () => {
    password = "23456789";

    const res = await exec();

    expect(res.status).toBe(400);
  });
});
