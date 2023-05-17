const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('server side is running')
})
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bylwpc6.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) => {
  // console.log('varify hittitng');
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.CAR_ACCESS_TOKEN, (err, decoded) => {
    if(err){
      return res.status(401).send({err: true, message: 'unauthoriz access'})
    }
    req.decoded = decoded;
    next();
  })
} 

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const carCullection = client.db('carDB').collection('service');
    const bookngsCullection = client.db('carDB').collection('bookings')

    app.get('/service', async(req, res) =>{
        const cursor = carCullection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/service/:id', async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const options = {
            projection: { title: 1, price: 1, service_id: 1, img: 1 },
          };
        const result = await carCullection.findOne(query, options);
        res.send(result)
    })

    app.get('/booking', verifyJWT, async(req, res) =>{
      const decoded = req.decoded;
       console.log('come verify', decoded);

      if(decoded.email !== req.query.email){
        return res.status(403).send({err: true, message: 'forbidden access'})
      }

       let query = {};
       if(req.query?.email){
        query = {email: req.query.email}
       }
       const result = await bookngsCullection.find(query).toArray();
       res.send(result)
    })

    app.post('/booking', async(req, res) =>{
      const booking = req.body;
      console.log(booking);
      const result = await bookngsCullection.insertOne(booking);
      res.send(result)
    })

    app.delete('/booking/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookngsCullection.deleteOne(query)
      res.send(result)
    })

    app.patch('/booking/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        }
      }
       const result = await bookngsCullection.updateOne(filter, updateDoc);
       res.send(result);
    })

    app.post('/jwt', (req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.CAR_ACCESS_TOKEN, {expiresIn: '1h' });
      res.send({token});
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () =>{
    console.log('your server is running on PORT:', port);
})