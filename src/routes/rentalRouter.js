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
 *     parameters:
 *       - name: username
 *         description: Username to use for login.
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         description: User's password.
 *         in: formData
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: rental information
 */

const express = require("express");
require('dotenv').load();
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
 *     parameters:
 *       - name: username
 *         description: Username to use for login.
 *         in: formData
 *         required: true
 *         type: string
 *       - name: password
 *         description: User's password.
 *         in: formData
 *         required: true
 *         type: string
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
  
  // returns lat and long of passed in location.
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
  
  router.post("/:id", verifyUser, (req, res, next) => {
    const listing = req.body.listing;
    Rental.findByIdAndDelete(listing)
      .then(result => {
        res.status(200).json(result);
      })
      .catch(err => res.status(404).json(err.message));
  });
  
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
          listing: rentalToReturn,
          newUser
        });
      })
      .catch(next);
  });

  module.exports = router;