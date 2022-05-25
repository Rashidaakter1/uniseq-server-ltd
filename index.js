const express = require('express')
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bczoi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();

    const partscollection = client.db("dbtools").collection("parts");
    const ordercollection = client.db("dbtools").collection("orders");
    const usercollection = client.db("dbtools").collection("users");
    const reviewcollection = client.db("dbtools").collection("reviews");

    console.log('inside connect');


    app.post('/create-payment-intent', async(req, res) =>{
      const order = req.body;
      const price = order.price;
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
    });


    // get all parts

    app.get('/parts', async (req, res) => {
      const result = await partscollection.find().toArray()
      res.send(result)
    })

    // get one part
    app.get('/parts/:id', async (req, res) => {

      const id = req.params.id
      const query = { _id: ObjectId(id) }

      const result = await partscollection.findOne(query)
      res.send(result)
    })

    //post api for parts

    app.post('/parts', async (req, res) => {
     
      const products = req.body;
      const result =await partscollection.insertOne(products)
      res.send(result);

    })



    //order get api 

    app.get('/orders', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email }
        const result = await ordercollection.find(query).toArray()
        return res.send(result)
      }
      else {
        return res.status(403).send({ message: 'forbidden access' })
      }


    })

    //order get api by id parameter
    app.get('/orders/:id',async(req,res)=>{
      const id = req.params.id;
      const query={_id: ObjectId(id)}
      const result = await ordercollection.findOne(query)
      res.send(result)
    })

    //order post api 

    app.post('/orders', async (req, res) => {
      const orderData = req.body;
      const result = await ordercollection.insertOne(orderData)
      res.send(result)
    })

    //orders delete api 
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordercollection.deleteOne(query);
      res.send(result)
    })


    //user get api
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await usercollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })

    app.get('/users', async (req, res) => {
      const result = await usercollection.find().toArray()
      res.send(result)
    })

    


    //make admin for users

    app.put('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const initiator = req.decoded.email;
      const requesterAccount = await usercollection.findOne({ email: initiator });
      if (requesterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await usercollection.updateOne(filter, updateDoc);
        res.send(result);
      }
      else{
        return res.status(403).send({ message: 'forbidden access' })
      }

    })

    //user put api 
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      console.log(user);
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usercollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });

    })



    //reviews put api
    app.put('/reviews/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const reviewData = req.body;
      const options = { upsert: true };

      const updateDoc = {
        $set: reviewData
      };
      const result = await reviewcollection.updateOne(filter, updateDoc, options);

      res.send(result)
    })
    // review get api
    app.get('/reviews', async (req, res) => {

      const result = await reviewcollection.find().toArray();
      res.send(result)
    })


  }

  finally {


  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`tools part is running ${port}`)
})