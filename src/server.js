const express = require("express");
const mongoose = require("mongoose");
const compression = require('compression')
const helmet = require('helmet');
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY_SECRET);

const deployeduri = process.env.DEPLOYED_URI;
const localuri = process.env.LOCAL_URI;

const whitelist = [deployeduri, localuri]
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

const Rental = require("./models/Rental");

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_MAPS_GEOLOCATER_API_KEY,
  Promise: Promise
});

// setting up the server
const port = process.env.PORT || 3001;
const server = express();
server.use(helmet());
server.use(compression());
server.use(express.json());
server.use(cors(corsOptions));

// configuring the database
mongoose.Promise = global.Promise;
const databaseOptions = {
  useNewUrlParser: true
};
mongoose.set("useCreateIndex", true);

// connecting to the database
mongoose.connect(
  process.env.MONGO_URI,
  databaseOptions
);
mongoose.connection
  .on("error", err => console.warn(err));

// test route
server.get("/", (req, res) => res.send(`The server is up and running!`));

// posts payment to stripe api
server.post('/payment', async (req, res, next) => {
  const {
    token
  } = req.body;
  try {
    let {
      status
    } = await stripe.charges.create({
      amount: 1500,
      currency: "usd",
      description: "New Listing",
      source: token
    });

    res.json({
      status
    });
  } catch (err) {
    res.status(500).end();
  }
})

// returns all rentals in db
server.get("/rentals", (req, res, next) => {
  Rental.find({}).sort({
      price: 1,
      createOn: -1
    })
    .then(response => {
      res.json(response);
    })
    .catch(next);
});

// returns lat and long of passed in location.
server.post("/geometry", (req, res, next) => {
  const {
    location
  } = req.body;
  if (!req.body || !location) {
    res.status(404);
    return;
  }
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
    .catch(next);
});

// adds rental to db, with lat and long data for rental location via google maps api
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
      let address;
      let lat;
      let lng;
      if (!response.json.results[0] || !response.json.results[0].geometry) {
        address = null;
      } else {
        lat = response.json.results[0].geometry.location.lat;
        lng = response.json.results[0].geometry.location.lng;
        address = {
          lat,
          lng
        };
      }
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
      newRental.save().then(result => res.status(201).json(result));
    })
    .catch(next);
});

// express error handling:
server.use(function (err, req, res, next) {
  res.status(500).send(err.message);
})

// initializing the server
server.listen(port);

module.exports = server;