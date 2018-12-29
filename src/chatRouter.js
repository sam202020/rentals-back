require('dotenv').load();
const express = require('express');
const axios = require('axios');
const AccessToken = require('twilio').jwt.AccessToken;
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyUser = require("./verifyUser");

const router = express.Router();
const ChatGrant = AccessToken.ChatGrant;
const twilioApiUri = 'https://chat.twilio.com/v2/Services'

router.get('/', (req, res, next) => res.send('The chat router is working!')); // test route

router.get('/chat-token', verifyUser, (req, res, next) => {
    const appName = 'Rentals';
    const identity = req.uid;
    const deviceId = req.query.device;
    const endpointId = appName + ':' + identity + ':' + deviceId;
    const chatGrant = new ChatGrant({
        serviceSid: process.env.TWILIO_CHAT_SERVICE_SID,
        endpointId: endpointId,
    });
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET
    );
    token.addGrant(chatGrant);
    token.identity = identity;
    if (!token) {
        res.status(400).json({
            err: 'unauthorized'
        });
    }    
    res.status(201).json({
        identity: identity,
        token: token.toJwt(),
    }).catch(next);
});

module.exports = router