const request = require("supertest");
const { User } = require("../../models/user");
const { Customer } = require("../../models/customer");
const mongoose = require("mongoose");

let server;

describe("/api/customers", () => {
  const api = "/api/customers";
  beforeEach(() => {
    server = require("../../index");
  });
  afterEach(async () => {
    await server.close();
    await Customer.remove({});
  });
  describe("GET /", () => {
    it("should return all customers", async () => {
      await Customer.collection.insertMany([
        { name: "customer1", phone: "647111111" },
        { name: "customer2", phone: "647222222" },
      ]);
      const res = await request(server).get(api);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.name === "customer1")).toBeTruthy();
      expect(res.body.some((g) => g.name === "customer2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return a customer if valid id is passed", async () => {
      const customer = new Customer({ name: "customer1", phone: "647111111" });
      await customer.save();

      const res = await request(server).get(api + "/" + customer._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", customer.name);
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get(api + "/1");

      expect(res.status).toBe(404);
    });

    it("should return 404 if no customer with the given id exists", async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get(api + "/" + id);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    let token;
    let name;
    let phone;
    let customer;
    let isGold;

    const exec = async () => {
      return await request(server)
        .post(api)
        .set("x-auth-token", token)
        .send({ name, phone, isGold });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();
      phone = "647111111";
      name = "customer1";
      isGold = false;
      customer = new Customer({
        name,
        phone,
        isGold,
      });
      await customer.save();
    });

    it("shoud return 401 if client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("shoud return 400 if a customer's name is less than 5 characters", async () => {
      name = "1234";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if a customer's name is more than 50 characters", async () => {
      name = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if a customer's phone is less than 5 digits", async () => {
      phone = "1234";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if a customer's name is more than 11 digits", async () => {
      phone = new Array(13).join("1");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud save the customer if it is valid", async () => {
      await exec();
      const customer = await Customer.findOne({ name: "customer1" });
      expect(customer).not.toBeNull();
    });

    it("shoud return the customer", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(["_id", "name", "phone", "isGold"])
      );
    });
  });

  describe("PUT /:id", () => {
    let token;
    let id;
    let newName;
    let newPhone;

    const exec = async () => {
      return await request(server)
        .put(api + "/" + id)
        .set("x-auth-token", token)
        .send({ name: newName, phone: newPhone, isGold: false });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();
      newPhone = "647222222";
      newName = "customer2";
      isGold = false;
      customer = new Customer({
        name: "customer1",
        phone: "647111111",
        isGold: false,
      });
      id = customer._id;

      await customer.save();
    });
    it("shoud return 401 if client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("shoud return 400 if a customer's name is less than 5 characters", async () => {
      newName = "1234";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if a customer's name is more than 50 characters", async () => {
      newName = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if a customer's phone is less than 5 digits", async () => {
      newPhone = "1234";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("shoud return 400 if a customer's name is more than 11 digits", async () => {
      newPhone = new Array(13).join("1");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 if invalid id is passed", async () => {
      id = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if no customer with the given id exists", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("shoud return the customer", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(["_id", "name", "phone", "isGold"])
      );
    });
  });

  describe("DELETE /:id", () => {
    let token;
    let customer;
    let id;

    const exec = async () => {
      return await request(server)
        .delete(api + "/" + id)
        .set("x-auth-token", token)
        .send();
    };

    beforeEach(async () => {
      customer = new Customer({
        name: "customer1",
        phone: "647111111",
        isGold: false,
      });
      id = customer._id;

      await customer.save();

      token = new User({ isAdmin: true }).generateAuthToken();
      id = customer._id;
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

    it("should return 404 if no customer with the given id exists", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("shoud delete the movie if it is valid", async () => {
      await exec();

      const deleteCustomer = await Customer.findById(id);
      expect(deleteCustomer).toBeNull();
    });

    it("shoud return the removed movie", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(["_id", "name", "phone", "isGold"])
      );
    });
  });
});
