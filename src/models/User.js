const mongoose = require('mongoose');

const UserModel = mongoose.Schema({
    _id: {
        type: String
    },
    displayName: {
        type: String
    },
    email: {
        type: String
    },
    stripe_id: {
        type: String
    },
    createOn: {
        type: Date,
        default: Date.now()
    },
});

module.exports = mongoose.model('users', UserModel);