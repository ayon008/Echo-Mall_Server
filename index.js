const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = "mongodb+srv://ayon008:shariar5175@cluster0.km1azrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// FlashSells 
// Category
// All products


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const dataBase = client.db("Ecommarce")
    const userCollection = dataBase.collection("users");
    const productDataCollection = dataBase.collection("productData");
    const ProductPurchaseListCollection = dataBase.collection("ProductPurchaseList");
    const ProductAddToCollection = dataBase.collection("ProductAddToCart");
    const categoriesCollection = dataBase.collection("categories");

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
      const id = req.params._id;
      const query = { _id: id }
      const findOne = await productDataCollection.findOne(query);
      res.send(findOne)
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
      const id = newItem._id;
      const find = await ProductAddToCollection.findOne({ _id: id });
      if (find) {
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            quantity: parseInt(find.quantity) + 1
          }
        }
        const result = await ProductAddToCollection.updateOne({ _id: id }, updateDoc, options)
        return res.send(result);
      }
      newItem.quantity = 1;
      const result = await ProductAddToCollection.insertOne(newItem);
      res.send(result);
    });

    // Get Product Add To cart
    app.get("/ProductAddToCart", async (req, res) => {
      const email = req.query.email;
      const query = { email: { $eq: email } }
      const result = await ProductAddToCollection.find(query).toArray();
      res.send(result);
    });

    // Delete Product Add To Cart
    app.delete("/ProductAddToCart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id }
      const result = await ProductAddToCollection.deleteOne(query);
      res.send(result)
    });

    // Update Cart Quantity;

    app.patch('/ProductAddToCart/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const { quantity } = req.body;

      const updateDoc = {
        $set: {
          quantity: quantity
        }
      }
      const result = await ProductAddToCollection.updateOne(query, updateDoc, { upsert: true });
      res.send(result);
    })

    // Delete Cart
    app.delete('/ProductAddToCart', async (req, res) => {
      const result = await ProductAddToCollection.deleteMany({})
      res.send(result);
    })

    // Get all the categories || TO DO
    app.get('/categories', async (req, res) => {
      const categories = await categoriesCollection.find().toArray();
      res.send(categories);
    })

    // Get Product by category
    app.get('/products/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category: { $eq: category } }
      const result = await productDataCollection.find(query).toArray();
      res.send(result);
    })

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

