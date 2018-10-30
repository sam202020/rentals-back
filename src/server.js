const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Rental = require('./models/Rental');


// setting up the server
const port = process.env.PORT || 3001; // uses the port provided by the process.env & defaults to 3002 if none is provided
const server = express();


// configuring the database
mongoose.Promise = global.Promise; // mongoose's promise library is deprecated, so we sub in the general ES6 promises here
const databaseOptions = {
    useNewUrlParser: true, // mongoose's URL parser is also deprecated, so we pass this in as a option to use the new one
};
mongoose.set('useCreateIndex', true); // collection.ensureIndex is also deprecated so we use 'useCreateIndex' instead


// connecting to the database
mongoose.connect(process.env.MONGO_URI, databaseOptions);
mongoose.connection
    .once('open', () => console.log(`The database is connected`))
    .on('error', (err) => console.warn(err));


// setting up middleware
server.use(express.json());
server.use(cors());


// error handling
const handleError = err => {
    console.log(err);
}


// test route
server.get('/', (req, res) => res.send(`The server is up and running!`));

server.get('/rentals', (req, res) => {
    Rental.find({})
        .then(response => { 
            console.log(response);
            res.json(response);
        })
        .catch(err => res.status(500).json(err.message));
});


server.post('/', (req, res) => {
    console.log(req.body)
    const {
        location,
        type,
        bedrooms,
        baths,
        wePay,
        phone,
        price,
        comments,
        imageURL,
        email,
        hud
    } = req.body;
    const newRental = new Rental({
        email,
        location,
        type,
        bedrooms,
        baths,
        wePay,
        phone,
        price,
        comments,
        imageURL
    });
    newRental.save()
        .then(result => res.json(result))
        .catch(err => console.error(err))
});


// initializing the server
server.listen(port, () => console.log(`The server is listening on port ${port}`));

module.exports = server;