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