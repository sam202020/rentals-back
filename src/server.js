const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Rental = require("./models/Rental");

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_MAPS_GEOLOCATER_API_KEY,
  Promise: Promise
});

// setting up the server
const port = process.env.PORT || 3001; // uses the port provided by the process.env & defaults to 3002 if none is provided
const server = express();

// configuring the database
mongoose.Promise = global.Promise; // mongoose's promise library is deprecated, so we sub in the general ES6 promises here
const databaseOptions = {
  useNewUrlParser: true // mongoose's URL parser is also deprecated, so we pass this in as a option to use the new one
};
mongoose.set("useCreateIndex", true); // collection.ensureIndex is also deprecated so we use 'useCreateIndex' instead

// connecting to the database
mongoose.connect(
  process.env.MONGO_URI,
  databaseOptions
);
mongoose.connection
  .once("open", () => console.log(`The database is connected`))
  .on("error", err => console.warn(err));

// setting up middleware
server.use(express.json());
server.use(cors());

// error handling
const handleError = err => {
  console.log(err);
};

// test route
server.get("/", (req, res) => res.send(`The server is up and running!`));

server.get("/rentals", (req, res) => {
  Rental.find({}).sort({
      price: 1
    })
    .then(response => {
      res.json(response);
    })
    .catch(err => res.status(500).json(err.message));
});

server.post("/geometry", (req, res) => {
  console.log(req.body)
  const {
    location
  } = req.body;
  googleMapsClient
    .geocode({
      address: location,
      bounds: {
        south: 40.014815,
        west: -74.311982,
        north: 40.131737,
        east: -74.118621
      }
    })
    .asPromise()
    .then(response => {
      if (!response.json.results[0]) {
        res.json(response);
        return
      }
      const lat = response.json.results[0].geometry.location.lat;
      const lng = response.json.results[0].geometry.location.lng;
      const address = {
        lat: lat,
        lng: lng
      };
      res.json(address);
    })
    .catch(err => console.error(err));
});

server.post("/", (req, res) => {
  const {
    location,
    type,
    bedrooms,
    baths,
    wePay,
    phone,
    price,
    comments,
    pictures,
    email,
    hud
  } = req.body;
  googleMapsClient
    .geocode({
      address: location,
      bounds: {
        south: 40.014815,
        west: -74.311982,
        north: 40.131737,
        east: -74.118621
      }
    })
    .asPromise()
    .then(response => {
      const lat = response.json.results[0].geometry.location.lat;
      const lng = response.json.results[0].geometry.location.lng;
      const address = {
        lat: lat,
        lng: lng
      };
      const newRental = new Rental({
        address,
        email,
        location,
        type,
        bedrooms,
        baths,
        wePay,
        phone,
        price,
        comments,
        pictures,
        hud
      });
      newRental.save().then(result => res.json(result));
    })
    .catch(err => console.error(err));
});

// initializing the server
server.listen(port, () =>
  console.log(`The server is listening on port ${port}`)
);

module.exports = server;