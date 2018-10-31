const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Rental = require("./models/Rental");

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_MAPS_GEOLOCATER_API_KEY
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
  Rental.find({})
    .then(response => {
      console.log(response);
      res.json(response);
    })
    .catch(err => res.status(500).json(err.message));
});

//Gmaps API interaction
// Geocode an address.
const geocodeLookup = address => {
  googleMapsClient.geocode(
    {
      address: address,
      bounds: '40.014815,-74.311982|40.131737,-74.118621'
    },
    function(err, response) {
      if (!err) {
        console.log(response.json.results);
        return response.json.results[0];
      } else {
        console.error(err);
        return "error";
      }
    }
  );
};

server.post("/", (req, res) => {
  console.log(req.body);
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
  let address = {};
  const gAddress = geocodeLookup(location);
  if (gAddress !== "error") {
    const lat = gAddress.geometry.location.lat;
    const lng = gAddress.geometry.location.lng;
    address = { lat: lat, lng: lng };
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
    imageURL
  });
  newRental
    .save()
    .then(result => res.json(result))
    .catch(err => console.error(err));
});

// initializing the server
server.listen(port, () =>
  console.log(`The server is listening on port ${port}`)
);

module.exports = server;
