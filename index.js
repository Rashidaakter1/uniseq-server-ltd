const express = require('express')
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bczoi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
      await client.connect();

      const partscollection = client.db("dbtools").collection("parts");
      const ordercollection = client.db("dbtools").collection("orders");
      const usercollection = client.db("dbtools").collection("users");
      const reviewcollection = client.db("dbtools").collection("reviews");
      
      console.log('inside connect');


          // get all parts

      app.get('/parts',async(req,res)=>{
          const result = await partscollection.find().toArray()
          res.send(result)
      })
        
        // get one part
      app.get('/parts/:id',async(req,res)=>{

          const id = req.params.id
          const query ={_id:ObjectId(id)}

          const result = await partscollection.findOne(query)
          res.send(result)
      })



      //order get api 

      app.get('/orders',async(req,res)=>{
        const email = req.query.email;
        const query ={email : email}
        const result = await ordercollection.find(query).toArray()
        res.send(result)
    })

      //order post api 

      app.post('/orders',async(req,res)=>{
          const orderData=req.body;
          const result = await ordercollection.insertOne(orderData)
          res.send(result)
      })

      //orders delete api 
      app.delete('/orders/:id',async(req,res)=>{
        const id =req.params.id;
        const query={_id:ObjectId(id)};
        const result = await ordercollection.deleteOne(query);
        res.send(result)
      })



      //user post api 
      app.post('/users',async(req,res)=>{
        const userData=req.body;
        const result = await usercollection.insertOne(userData)
        res.send(result)
    })


    //reviews put api
    app.put('/reviews/:email',async(req,res)=>{
      const email=req.params.email;
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
      app.get('/reviews',async(req,res)=>{
        
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