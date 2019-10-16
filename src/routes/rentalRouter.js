const express = require("express");
require("dotenv").load();
const UserModel = require("../models/User");
const RentalModel = require("../models/Rental");
const verifyUser = require("../verifyUser");

const router = express.Router();

/**
 * @swagger
 *
 * /rental/rentals:
 *   get:
 *     tags:
 *       - rentals
 *     description: Get all rentals sorted by newest added
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: rental information
 */

router.get("/rentals", (req, res, next) => {
  RentalModel.find({})
    .sort({
      price: 1,
      createOn: -1
    })
    .then(response => {
      console.log(response);
      res.status(200).json(response);
    })
    .catch(err => {
      console.error(err);
    });
});

/**
 * @swagger
 *
 * /rental/geometry:
 *   post:
 *     tags:
 *       - rentals
 *     description: Returns lat and long of passed in location.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: location
 *         description: address or street name(s) or place
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: lat and lng of requested address / place
 */

router.post("/geometry", (req, res, next) => {
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

/**
 * @swagger
 *
 * /rental/:id:
 *   delete:
 *     tags:
 *       - rentals
 *     description: Deletes specified rental
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Rental ID
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Deleted Rental
 *       404:
 *         description: error message
 */

router.delete("/:id", verifyUser, (req, res, next) => {
  const listing = req.body.listing;
  Rental.findByIdAndDelete(listing)
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => res.status(404).json(err.message));
});

/**
 * @swagger
 *
 * /rental/:id:
 *   get:
 *     tags:
 *       - rentals
 *     description: Returns specified rental details
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Rental ID
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Specified rental details
 *       404:
 *         description: error message
 */

router.get("/:id", verifyUser, (req, res, next) => {
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

/**
 * @swagger
 *
 * /rental/:id:
 *   put:
 *     tags:
 *       - rentals
 *     description: Updates specified rental
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Rental ID
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Updtaed Rental
 *       404:
 *         description: error message
 */

router.put("/:id", verifyUser, (req, res, next) => {
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

/**
 * @swagger
 *
 * /rental:
 *   post:
 *     tags:
 *       - rentals
 *     description: Adds property to db with property details
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: user token
 *         in: body
 *         required: true
 *         type: string
 *       - name: location
 *         description: address or street name(s) or place
 *         in: body
 *         required: true
 *         type: string
 *       - name: type
 *         description: apartment or house or townhome
 *         in: body
 *         required: true
 *         type: string
 *       - name: bedrooms
 *         description: number of bedrooms
 *         in: body
 *         required: true
 *         type: string
 *       - name: bath
 *         description: number of bathrooms
 *         in: body
 *         required: true
 *         type: string
 *       - name: wePay
 *         description: what (if any) utilities the landlord covers (e.g gas electric water heat)
 *         in: body
 *         required: false
 *         type: string
 *       - name: phone
 *         description: phone number of property owner
 *         in: body
 *         required: false
 *         type: string
 *       - name: price
 *         description: price per month
 *         in: body
 *         required: false
 *         type: number
 *       - name: comments
 *         description: optional comments by property owner
 *         in: body
 *         required: false
 *         type: string
 *       - name: pictures
 *         description: link to pictures of property
 *         in: body
 *         required: false
 *         type: array
 *       - name: email
 *         description: email address of property owner
 *         in: body
 *         required: false
 *         type: string
 *       - name: hud
 *         description: whether the property is HUD eligible
 *         in: body
 *         required: false
 *         type: boolean
 *     responses:
 *       200:
 *         description: Added Rental
 *       404:
 *         description: error message
 */

// adds rental to db, with lat and long data for rental location via google maps api
router.post("/", verifyUser, (req, res, next) => {
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
        listing: rentalToReturn, // test comment
        newUser
      });
    })
    .catch(next);
});

module.exports = router;
