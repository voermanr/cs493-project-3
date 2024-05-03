const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const mongoConnection = require("./lib/mongoConnection");
const {MongoClient} = require("mongodb");

const app = express();
const port = process.env.API_PORT;

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

async function initDB(){
    let client = null;

    console.log("\nEstablishing First User:\n--------------------\n")
    console.log("...ROOT_USERNAME:\t", process.env.MONGO_INITDB_ROOT_USERNAME);
    console.log("...ROOT_PASSWORD:\t", process.env.MONGO_INITDB_ROOT_PASSWORD);
    console.log("\n");

    try {
        const mongoURL = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}` +
            `@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/admin`
        console.log("Trying to connect to MongoDB server...");
        console.log("Assembling url:\t", mongoURL);
        client = await MongoClient.connect(mongoURL,
            { serverSelectionTimeoutMS: 30000 }
        );
        console.log("Connected to MongoDB server from initDB!");

        const db = client.db();
        await db.command({
            createUser: "dude",
            pwd: "hunter2",
            roles: [{role: "readWrite", db: "howl"}]
        });
        console.log("DB User 'dude' created successfully.");
    }
    catch (e) {
        console.error("Error creating first user.");
        throw e;
    }
    finally {
        if (client)
            await client.close()
        console.log("Connection closed");
    }
    console.log("Resolving initDB...");
    return Promise.resolve()
}

initDB().then(() => {
    mongoConnection.connectDB().then(() => {
        app.listen(port, function() {
            console.log("== Server is running on port", port);
        });
    })
})


/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      err: "Server error.  Please try again later."
  })
})



