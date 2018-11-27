const express = require('express');
const UserModel = require('./models/User');

const router = express.Router();

router.get('/', (req, res, next) => res.send('The auth router is working!')); // test route

router.post('/', (req, res, next) => {
    const {
        uid,
        displayName,
        email
    } = req.body.user;
    const newUser = new UserModel({
        _id: uid,
        displayName,
        email
    });
    newUser.save().then(result => res.status(201).json(result))
        .catch(next);
});

module.exports = router;