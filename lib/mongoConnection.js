const {MongoClient} = require("mongodb");

let _db;
let _client = null;

module.exports = {
    connectDB: async () => {
        try {
            const mongoHost = process.env.MONGO_HOST;
            const mongoPort = process.env.MONGO_PORT;
            const mongoUser = process.env.MONGO_USER;
            const mongoPassword = process.env.MONGO_PASSWORD;
            const mongoDBName = process.env.MONGO_DB_NAME;
            const mongoURL = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/admin`;
            console.log("\nmongoConnection::connectDB invoked!\n--------------------")
            console.log("Trying to connect to MongoDB server...");
            console.log("Assembling url:\t", mongoURL);
            _client = await MongoClient.connect(mongoURL,
                {serverSelectionTimeoutMS: 30000});
            console.log("Connected to MongoDB server from connectDB!");
        }
        catch (err) {
            console.log("Error connecting during connectDB:");
            throw err;
        }
    },

    getDB: () => {
        if (!_db) {
            _db = _client.db(process.env.MONGO_DB_NAME);
            //console.log("The db is a thing, here it is:\t" + _db)
        }
        return _db
    },
};