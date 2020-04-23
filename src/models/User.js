const mongoose = require("mongoose");

//test
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
  messages: [
    {
      user: {
        type: String
      },
      toOrFrom: {
        type: String
      },
      message: {
        type: String
      }
    }
  ]
});

module.exports = mongoose.model("users", UserModel);
