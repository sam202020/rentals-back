const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shalomlandsman@gmail.com',
        pass: 'azarya2020'
    }
});

const RentalModel = mongoose.Schema({
    place: {
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
    phone: {
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
    },
    user: {
        type: String
    },
    inquries: [{
        user: {
            type: String
        },
        message: {
            type: String
        }
    }],
});

RentalModel.post('save', function (doc) {
    console.log('rental added');
    let mailOptions = {
        from: 'shalomlandsman@gmail.com',
        to: 'shalomlandsman@gmail.com',
        subject: 'Rental added',
        text: String(doc._id)
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });


});

module.exports = mongoose.model('rentals', RentalModel);