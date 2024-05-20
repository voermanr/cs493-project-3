const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const mongoConnection = require('../lib/mongoConnection')
const {isAuthenticated} = require("../lib/authenicator");
const {isOwner} = require("../lib/authorizer");
const {ObjectId} = require("mongodb");

exports.router = router;

/* Schema describing required/optional fields of a photo object. */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

/* Route to fetch info about a specific photo. */
router.get('/:photoid', async (req, res, next) => {
  let photo;

  try {
    photo = await mongoConnection.getDB().collection("photos")
        .findOne({
          _id: new ObjectId(req.params.photoid)
        });
  }
  catch (e) {
    next(e)
  }

  if (photo) {
    // DONE: ROUTE COVERED
    res.status(200).json(photo);
  }
  else {
    // TODO: cover route
    res.status(404).json( {error: "Photo not phound!"});
  }
});

/*
ROUTES BELOW REQUIRE AUTHENTICATION
*/
router.use(isAuthenticated);

/* Route to create a new photo. */
router.post('/', isAuthenticated, async (req, res) => {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const photo = extractValidFields(req.body, photoSchema);

    try {
      // DONE: route covered
      const result = await mongoConnection.getDB().collection("photos").insertOne(photo);
      res.status(201).json({
        _id: result.insertedId,
        links: {
          photo: result.insertedId,
          business: `/businesses/${photo.businessid}`
        }
      })
    }
    catch (e) {
      // TODO: cover route
      console.error(e)
      return res.status(400).json({ error: "Problem creating photo."})
    }
  } else {
    // TODO: cover route
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});

/*
ROUTES BELOW REQUIRE AUTHORIZATION
 */
router.use(isOwner);

/* Route to update a photo. */
router.put('/:photoid', async (req, res, next) => {
  let photo;
  const collection = mongoConnection.getDB().collection("photos");
  const photoId = req.params.photoid;

  try {
    photo = await collection
        .findOne({ _id: new ObjectId(photoId)});
  }
  catch (e) { next(e); }

  if (photo) {
    if (validateAgainstSchema(req.body, photoSchema)) {
      /*
       * Make sure the updated photo has the same businessid and userid as
       * the existing photo.
       */
      const updatedPhoto = extractValidFields(req.body, photoSchema);
      const existingPhoto = photo;

      if (existingPhoto && updatedPhoto.businessid === existingPhoto.businessid && updatedPhoto.userid === existingPhoto.userid) {
        try {
          await collection.updateOne(
              { _id: photoId },
              { $set: updatedPhoto }
          );
          // DONE: route covered
          res.status(200).json({
            _id: photoId,
            links: {
              photo: `/photos/${photoId}`,
              business: `/businesses/${updatedPhoto.businessid}`
            }
          });
        }
        catch (e) {
          next(e);
        }
      } else {
        // TODO: cover route
        res.status(403).json({
          error: "Updated photo cannot modify businessid or userid"
        });
      }
    } else {
      // TODO: cover route
      res.status(400).json({
        error: "Request body is not a valid photo object"
      });
    }
  } else {
    next();
  }
});

/* Route to delete a photo. */
router.delete('/:photoid', async (req, res, next) => {
  try {
    const result = await mongoConnection.getDB().collection("photos")
        .deleteOne({ _id: new ObjectId(req.params.photoid) });
    if (result.deletedCount === 0) {
      // TODO: cover route
      return res.status(404).json({ error: 'Photo not phound!}' })
    }
    // TODO: cover route
    res.status(200).end();
  }
  catch (e) {
    next(e);
  }
});
