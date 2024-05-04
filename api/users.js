const router = require('express').Router();

exports.router = router;

const mongoConnection = require("../lib/mongoConnection");

router.get('/:userid/:collection', async (req, res, next) => {
  try {
    const collection = req.params.collection;

    const userCollection = await mongoConnection.getDB().collection(collection)
        .find({ $or: [
            { ownerid: req.params.userid },
            { userid: req.params.userid }
        ]}).toArray();

    res.status(200).json({
      [collection]: userCollection
    });
  }
  catch (e) {
    next(e);
  }
});