const admin = require("firebase-admin");
require('dotenv').load();

const serviceAccount = {
  type: "service_account",
  project_id: "lakewood-rentals",
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email:
    "firebase-adminsdk-dozta@lakewood-rentals.iam.gserviceaccount.com",
  client_id: process.env.CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-dozta%40lakewood-rentals.iam.gserviceaccount.com"
};

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
      err: "unauthorized"
    });
    return;
  }
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(function(decodedToken) {
      req.uid = decodedToken.uid;
      req.name = decodedToken.name;
      next();
    })
    .catch(function(error) {
      console.error(error);
      res.status(404).json({
        err: "unauthorized"
      });
    });
};

module.exports = verifyUser;
