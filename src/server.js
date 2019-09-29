const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");

const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const rentalRouter = require("./routes/rentalRouter");
const userRouter = require("./userRouter");
const chatRouter = require("./chatRouter");

const deployeduri = process.env.DEPLOYED_URI;
const localuri = process.env.LOCAL_URI;

const whitelist = [deployeduri, localuri];
const corsOptionsDelegate = function(req, callback) {
  let corsOptions;
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = {
      origin: true
    }; // reflect (enable) the requested origin in the CORS response
    callback(null, corsOptions); // callback expects two parameters: error and options
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

// setting up the server
const port = process.env.PORT || 3001;
const server = express();

const options = {
  definition: {
    openapi: '3.0.0', // Specification (optional, defaults to swagger: '2.0')
    info: {
      title: 'Lakewood Rentals Backend API', // Title (required)
      version: '1.0.0', // Version (required)
    },
    
  },
  // Path to the API docs
  apis: ['./routes/*'],
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJSDoc(options);

server.use(helmet());
server.use(compression());
server.use(express.json());
server.use(cors());

server.use("/rental", rentalRouter);
server.use("/user", userRouter); // router for handling auth related requests, such as login and register
server.use("/chat", chatRouter);

server.get('/api-docs.json', function(req, res) { 
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// express error handling:
server.use(function(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json(err);
});

// configuring the database
mongoose.Promise = global.Promise;
const databaseOptions = {
  useNewUrlParser: true
};
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false); //see https://mongoosejs.com/docs/deprecations.html

// connecting to the database
mongoose.connect(process.env.MONGO_URI, databaseOptions);
mongoose.connection.on("error", err => {
  console.log("database error");
  console.warn(err);
});

// test route
server.get("/", (req, res) => res.send(`The server is up and running!`));

// initializing the server
server.listen(port);

var path = require('path');
var appDir = path.dirname(require.main.filename);
console.log(appDir)

module.exports = server;
