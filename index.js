const express = require("express");
require("dotenv").config();
var jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51PBVoLRpKZBTemtI25rA4u0oKiW9Uz2kaZWqZGhQCRjP2bqzdZpa7neCPUBKDQxz46zY3LXMy1YDAVTrEx1RsZHc00GMFIQ37w');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER}:${process.env.USER_PASS}@cluster0.km1azrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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


const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Invalid authorization' });
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(401).send({ error: true, message: 'Authorization Failed' });
    }
    req.decoded = decoded;
    next();
  });
};


async function run() {
  try {
    const dataBase = client.db("Ecommarce");
    const userCollection = dataBase.collection("users");
    const productDataCollection = dataBase.collection("productData");
    const ProductPurchaseListCollection = dataBase.collection("ProductPurchaseList");
    const ProductAddToCollection = dataBase.collection("ProductAddToCart");
    const categoriesCollection = dataBase.collection("categories");
    const paymentCollection = dataBase.collection("payment");
    // const activeOrderCollection = dataBase.collection("activeOrder");
    const reviewCollection = dataBase.collection("review");

    // Post User
    app.post('/user', async (req, res) => {
      const data = req.body;
      const query = { email: { $eq: data.email } }
      const find = await userCollection.findOne(query);
      if (find) {
        return
      }
      const result = await userCollection.insertOne(data);
      res.send(result);
    })

    // Patch User
    app.patch('/user/:uid', verifyToken, async (req, res) => {
      const id = req.params.uid;
      const data = req.body;
      const query = { uid: { $eq: id } };
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          name: data.name,
          address: data.address,
          mobileNumber: data.mobileNumber
        }
      }
      const result = await userCollection.updateOne(query, updateDoc, options)
      res.send(result);
    })

    // get user 
    app.get('/user/:uid', verifyToken, async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: { $eq: uid } };
      const result = await userCollection.findOne(query);
      res.send(result);
    })

    // jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body.email;
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1hr' })
      res.send({ token });
    })

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
    app.get("/users/:email", verifyToken, async (req, res) => {
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

    // Delete single Product
    app.delete('/data/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: id }
      const result = await productDataCollection.deleteOne(query);
      res.send(result);
    })

    // Get Single Id
    app.get("/data/:_id", async (req, res) => {
      const id = req.params._id;
      const query = { _id: id }
      const findOne = await productDataCollection.findOne(query);
      res.send(findOne)
    });

    app.patch('/data/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: id };
      const updateDoc = {
        $set: {
          Product_Name: data.Product_Name,
          Brand_Name: data.Brand_Name,
          Product_Code: data.Product_Code,
          Price: data.Price,
          Price_Without_Discount: data.Price_Without_Discount,
          Commission: data.Commission,
          Product_Description: data.Product_Description,
          Available_Size: data.Available_Size,
          Color_Variants: data.Color_Variants,
          Doc_1_PC: data.Doc_1_PC,
          Doc_2_PC: data.Doc_2_PC,
          Doc_3_PC: data.Doc_3_PC
        }
      }
      const result = await productDataCollection.updateOne(query, updateDoc)
      res.send(result);
    })


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
        const quantity = find.quantity + newItem.quantity
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            quantity: quantity
          }
        }
        const result = await ProductAddToCollection.updateOne({ _id: id }, updateDoc, options)
        return res.send(result);
      }
      const result = await ProductAddToCollection.insertOne(newItem);
      res.send(result);
    });

    // Get Product Add To cart
    app.get("/ProductAddToCart", verifyToken, async (req, res) => {
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

    app.patch('/ProductAddToCart/:id', verifyToken, async (req, res) => {
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
    app.delete('/ProductAddToCart', verifyToken, async (req, res) => {
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


    app.get('/suggestions', async (req, res) => {
      const search = req.query.search;
      const query = { Product_Name: { $regex: search, $options: 'i' } }
      const find = await productDataCollection.find(query).toArray();
      res.send(find);
    });

    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const { price } = req.body;
      console.log(price);
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: "bdt",
        payment_method_types: [
          'card',
        ]
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });


    app.post('/payments', async (req, res) => {
      const data = req.body;
      const ids = data.products?.map(product => product._id);
      const query = { _id: { $in: ids.map(id => id) } }
      const deleteCart = await ProductAddToCollection.deleteMany(query);
      const result = await paymentCollection.insertOne(data);
      res.send(result);
    })

    app.get('/payments', verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: { $eq: email } };
      const find = await paymentCollection.find(query).toArray();
      res.send(find);
    })

    // TO DO
    app.post('/review/:id', async (req, res) => {
      const data = req.body;
      const result = await reviewCollection.insertOne(data);
      res.send(result);
    })

    app.get('/productRating/:id', async (req, res) => {
      const id = req.params.id;
      const query = { id: id }
      const find = await reviewCollection.find(query).toArray();
      const ratings = find.reduce((sum, rating) => sum + rating.value, 0) / find.length;
      res.send({ ratings });
    })

    app.get('/review/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { id: id };
      const find = await reviewCollection.find(filter).toArray();
      res.send(find);
    })

    app.get('/allOrders', async (req, res) => {
      const options = {
        projection: { products: 1, _id: 1, transactionId: 1 }
      }
      const find = await paymentCollection.find({}, options).toArray();
      res.send(find);
    })

    app.patch('/allOrders/:id', async (req, res) => {
      const productId = req.query.productId;
      const paymentId = req.params.id;
      const query = { $and: [{ _id: new ObjectId(paymentId) }, { "products._id": productId }] }
      const updateDoc = { $set: { "products.$.deliveryStatus": true } }
      const find = await paymentCollection.updateOne(query, updateDoc);
      res.send(find);
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

