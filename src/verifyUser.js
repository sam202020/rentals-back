const admin = require("firebase-admin");

const serviceAccount = require("./lakwood-rentals-1533001701310-firebase-adminsdk-ztq0g-a9f20e2746.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lakwood-rentals-1533001701310.firebaseio.com"
});

const verifyUser = (req, res, next) => {
    let idToken;
    if (req.body.user) idToken = req.body.user;
    else if (req.query.token) idToken = req.query.token;
    else {
        res.status(404).json({
            err: 'unauthorized'
        });
        return;
    }
    admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            req.uid = decodedToken.uid;
            req.name = decodedToken.name;
            next();
        }).catch(function (error) {
            console.error(error);
            res.status(404).json({
                err: 'unauthorized'
            });
            
        });
}

module.exports = verifyUser;