const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const fs = require("fs");

app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());

const port = 8082;
const host = "localhost";

app.listen(port, () => {
  console.log("App listening at http://%s:%s", host, port);
});

const { MongoClient } = require("mongodb");

// MongoDB
const url = "mongodb://localhost:27017";
const dbName = "reactdata";
const client = new MongoClient(url);
const db = client.db(dbName);

app.get("/listProducts", async (req, res) => {
  await client.connect();

  console.log("Node connected successfully to GET MongoDB");

  const query = {};

  const results = await db
    .collection("fake store_catalog")
    .find(query)
    .limit(100)
    .toArray();

  console.log(results);
  res.status(200);
  res.send(results);
});

app.get("/:id", async (req, res) => {
  console.log(req.params.id);
  const productId = Number(req.params.id);
  console.log("Product to find :", productId);

  await client.connect();
  console.log("Node connected successfully to GET-id MongoDB");
  const query = { id: productId };

  const results = await db.collection("fake store_catalog").findOne(query);

  console.log("Results :", results);
  if (!results) res.send("Not Found").status(404);
  else res.send(results).status(200);
});

app.post("/addProduct", async (req, res) => {
  try {
    await client.connect();
    console.log("Add product");
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);

    const newProduct = {
      id: values[0],
      title: values[1], // also "name": req.body.name,
      price: values[2], // also "price": req.body.price,
      description: values[3], // also "description": req.body.description,
      category: values[4],
      image: values[5],
    };

    console.log(newProduct);

    const results = await db
      .collection("fake store_catalog")
      .insertOne(newProduct);
    res.status(200);
    res.send(results);
  } catch (error) {
    console.error("An error occurred: ", error);
    res.status(500).send({ error: "An internal server error occurred" });
  }
});

app.delete("/deleteProduct/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await client.connect();
    console.log("Product to delete:", id);
    const query = { id: id };

    const productDeleted = await db
      .collection("fake store_catalog")
      .findOne(query);
    if (!productDeleted) {
      return res.status(404).send({ message: "Product not found" });
    }
    console.log(productDeleted);

    const results = await db.collection("fake store_catalog").deleteOne(query);
    res.status(200).send(productDeleted);
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.put("/updatePrice/:id", async (req, res) => {
  const id = Number(req.params.id);
  const query = { id: id };
  await client.connect();
  console.log("Product to Update :", id);
  // Data for updating the document, typically comes from the request body
  console.log(req.body);
  const updateData = {
    // is only price neccessary?
    $set: {
      title: req.body.title,
      price: req.body.price,
      description: req.body.description,
      category: req.bady.category,
      image: req.body.imageUrl,
    },
  };
  // Add options if needed, for example { upsert: true } to create a document if it doesn't exist

  const productUpdated = await db
    .collection("fake store_catalog")
    .findOne(query);

  const options = {};
  const results = await db
    .collection("fake store_catalog")
    .updateOne(query, updateData, options);
  if (results.matchedCount === 0) {
    return res.status(404).send({ message: "Product not found" });
  }
  res.status(200);
  res.send(productUpdated);
});
