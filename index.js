const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER}:${process.env.USER_PASS}@cluster0.sistehv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("dreamgalaxyshop2").collection("users");
    const productDataCollection = client
      .db("dreamgalaxyshop2")
      .collection("ProductData");
    const ProductPurchaseListCollection = client
      .db("dreamgalaxyshop2")
      .collection("ProductPurchaseList");
    const ProductAddToCollection = client
      .db("dreamgalaxyshop2")
      .collection("ProductAddToCart");

    // Save User Email And Role In DB
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // Own Data Find
    app.get("/users/:email", async (req, res) => {
      const result = await userCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });

    // Post Product Data
    app.post("/data", async (req, res) => {
      const newItem = req.body;
      const result = await productDataCollection.insertOne(newItem);
      res.send(result);
    });

    // Get all Product
    app.get("/data", async (req, res) => {
      const result = await productDataCollection.find().toArray();
      res.send(result);
    });

    // Get Single Id
    app.get("/data/:_id", async (req, res) => {
      const _id = req.params.id;
      const query = {
        _id: new ObjectId(_id),
      };
      const user = await productDataCollection.findOne(query);
      res.send(user);
    });

    // Post Product purchase Data
    app.post("/ProductPurchase", async (req, res) => {
      const newItem = req.body;
      const result = await ProductPurchaseListCollection.insertOne(newItem);
      res.send(result);
    });

    // Post Product Add To cart
    app.post("/ProductAddToCart", async (req, res) => {
      const newItem = req.body;
      const result = await ProductAddToCollection.insertOne(newItem);
      res.send(result);
    });
    // Get Product Add To cart
    app.get("/ProductAddToCart", async (req, res) => {
      const result = await ProductAddToCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({
    //     ping: 1
    // });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server running");
});

app.listen(port, () => {
  console.log(`running ${port}`);
});
