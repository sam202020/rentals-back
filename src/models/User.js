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
    createOn: {
        type: Date,
        default: Date.now()
    },
    messages: {
        children: [mongoose.Schema({
            type: Object,
            toOrFrom: 'to' || 'from',
            message: String
        })]
    }
});

module.exports = mongoose.model('users', UserModel);