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
        type: Array
    },
    phone:  {
        type: Number,
    },
    email: {
        type: String
    },
    price: {
        type: Number,
        required: true, 
    },
    comments: {
        type: String
    },
    imageURL: {
        type: Array
    }, 
    createOn: {
        type: Date,
        default: Date.now()
    },
    hud?: {
        type: Boolean
    }
});

module.exports = mongoose.model('rentals', RentalModel);