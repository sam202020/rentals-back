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
mongoose.connect('mongodb://localhost:27017/rentals', databaseOptions);
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


server.put('/', (req, res) => {
    const { location, type, bedroom, baths, wePay, phone, price, comments, imageURL } = req.body;
    const newRental = new Rental({ location, type, bedroom, baths, wePay, phone, price, comments, imageURL });
    newRental.save(function (err) {
        if (err) return handleError(err);
      })
    .then(result => res.json(result))
    .catch(err => handleError(err));
});


// initializing the server
server.listen(port, () => console.log(`The server is listening on port ${port}`));

module.exports = server;