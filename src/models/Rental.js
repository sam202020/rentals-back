const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const RentalModel = mongoose.Schema({
    location: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    bedrooms: {
        type: String,
        required: true,
    },
    baths: {
        type: String,
        required: true,
    },
    wePay: {
        type: String
    },
    phone:  {
        type: String,
    },
    email: {
        type: String
    },
    price: {
        type: Number
    },
    comments: {
        type: String
    },
    pictures: {
        type: Array
    }, 
    createOn: {
        type: Date,
        default: Date.now()
    },
    hud: {
        type: Boolean
    },
    address: {
        type: Object,
    }
});

module.exports = mongoose.model('rentals', RentalModel);