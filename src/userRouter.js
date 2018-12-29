const express = require("express");
const UserModel = require("./models/User");
const RentalModel = require("./models/Rental");
const verifyUser = require("./verifyUser");

const createNewUser = require("./chatRouter").createNewUser;
const AccessToken = require("twilio").jwt.AccessToken;
const client = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const ChatGrant = AccessToken.ChatGrant;
const twilioApiUri = "https://chat.twilio.com/v2/Services";

const router = express.Router();

router.get("/", (req, res, next) => res.send("The auth router is working!")); // test route

router.post("/", (req, res, next) => {
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
    newUser
        .save()
        .then(result => res.status(201).json(result))
        .catch(next);
});

router.post("/messages", verifyUser, (req, res, next) => {
    const uid = req.uid;
    const {
        message,
        regarding
    } = req.body;
    RentalModel.findByIdAndUpdate(
            regarding, {
                $push: {
                    inquries: {
                        user: uid,
                        message
                    }
                }
            }, {
                new: true
            }
        )
        .then(result => {
            getUserList(result.user)
                .then(usrExists => {
                    console.log(usrExists);
                    if (usrExists === true) {
                        res.status(201).json({ ...result,
                            uid
                        });
                    } else {
                        return client.chat
                            .services(process.env.TWILIO_CHAT_SERVICE_SID)
                            .users.create({
                                identity: result.user
                            })
                            .then(response => {
                                res.status(201).json({ ...result,
                                    uid,
                                    response
                                });
                            })
                            .catch(err => next(err));
                    }
                })
                .catch(err => next(err));
        })
        .catch(err => next(err));
});

const getUserList = async (user) => {
    return client.chat
        .services(process.env.TWILIO_CHAT_SERVICE_SID)
        .users.list()
        .then((list) => {
            for (let i of list)
                if (i.identity === user) return true;
        });
};

router.get('/messages', verifyUser, (req, res, next) => {
    const uid = req.uid;
    RentalModel.find({user: uid}).select("inquries").then(msgs => {
        res.status(200).json(msgs);
    })
})

module.exports = router;