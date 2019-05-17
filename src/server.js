const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");

const userRouter = require("./userRouter");
const chatRouter = require("./chatRouter");

const verifyUser = require("./verifyUser");

const deployeduri = process.env.DEPLOYED_URI;
const localuri = process.env.LOCAL_URI;

const whitelist = [deployeduri, localuri];
const corsOptionsDelegate = function(req, callback) {
  let corsOptions;
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = {
      origin: true
    }; // reflect (enable) the requested origin in the CORS response
    callback(null, corsOptions); // callback expects two parameters: error and options
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

const Rental = require("./models/Rental");
const User = require("./models/User");

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
server.use(cors());

server.use("/user", userRouter); // router for handling auth related requests, such as login and register
server.use("/chat", chatRouter);

// express error handling:
server.use(function(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json(err);
});

// configuring the database
mongoose.Promise = global.Promise;
const databaseOptions = {
  useNewUrlParser: true
};
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false); //see https://mongoosejs.com/docs/deprecations.html

// connecting to the database
mongoose.connect(process.env.MONGO_URI, databaseOptions);
mongoose.connection.on("error", err => {
  console.log("databas error");
  console.warn(err);
});

// test route
server.get("/", (req, res) => res.send(`The server is up and running!`));

// posts payment to stripe api
server.post("/payment", async (req, res, next) => {
  const { token } = req.body;
  try {
    let { status } = await stripe.charges.create({
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
});

// create subscription without charging card:
const subscription = async function(req, res, next) {
  const { token, email } = req.body;

  // Create a Customer:
  const customer = await stripe.customers.create({
    source: token,
    email
  });

  // Charge the Customer instead of the card:
  const charge = await stripe.charges.create({
    amount: 1000,
    currency: "usd",
    customer: customer.id
  });

  // YOUR CODE: Save the customer ID and other info in a database for later.
  const newUser = new User({
    email,
    stripe_id: customer.id
  });
  newUser
    .save()
    .then(result => next())
    .catch(next);
};

// returns all rentals in db
server.get("/rentals", (req, res, next) => {
  Rental.find({})
    .sort({
      price: 1,
      createOn: -1
    })
    .then(response => {
      console.log(response);
      res.json(response);
    })
    .catch(err => {
      console.error(err);
    });
});

// returns lat and long of passed in location.
server.post("/geometry", (req, res, next) => {
  const { location } = req.body;
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
        return;
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

server.post("/:id", verifyUser, (req, res, next) => {
  const listing = req.body.listing;
  Rental.findByIdAndDelete(listing)
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => res.status(404).json(err.message));
});

server.get("/:id", verifyUser, (req, res, next) => {
  Rental.findById(req.params.id)
    .then(result => {
      if (req.uid === result.user) res.status(200).json(result);
      else
        res.status(404).json({
          err: "unauthorized"
        });
    })
    .catch(err => res.status(404).json(err.message));
});

server.put("/:id", verifyUser, (req, res, next) => {
  Rental.findByIdAndUpdate(req.params.id, req.body)
    .then(result => {
      if (req.uid === result.user) res.status(200).json(result);
      else
        res.status(404).json({
          err: "unauthorized"
        });
    })
    .catch(err => res.status(404).json(err.message));
});

// adds rental to db, with lat and long data for rental location via google maps api
server.post("/", verifyUser, (req, res, next) => {
  let rentalToReturn;
  const user = req.uid;
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
        user,
        address,
        email,
        place: location, // to avoid conflict with react-router props
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
      return newRental.save();
    })
    .then(newRental => {
      rentalToReturn = newRental;
      return User.findOneAndUpdate(
        {
          user
        },
        {
          $push: {
            listings: newRental._id
          }
        },
        {
          new: true
        }
      );
    })
    .then(newUser => {
      res.status(201).json({
        listing: rentalToReturn,
        newUser
      });
    })
    .catch(next);
});

// initializing the server
server.listen(port);

module.exports = server;
