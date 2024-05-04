const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const mongoConnection = require('../lib/mongoConnection')

exports.router = router;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  _id: { required: false },
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};


/*
 * Route to create a new photo.
 */
router.post('/', async (req, res) => {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const photo = extractValidFields(req.body, photoSchema);

    try {
      const result = await mongoConnection.getDB().collection("photos").insertOne(photo);
      res.status(201).json({
        id: result.insertedId,
        links: {
          photo: result.insertedId,
          business: `/businesses/${photo.businessid}`
        }
      })
    }
    catch (e) {
      console.error(e)
      return res.status(400).json({ error: "Problem creating photo."})
    }
  } else {
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});


/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoid', async (req, res, next) => {
  let photo;

  try {
    photo = await mongoConnection.getDB().collection("photos")
        .findOne({ _id: req.params.photoid});
  }
  catch (e) {
    next(e)
  }

  if (photo) {
    res.status(200).json(photo);
  }
  else {
    res.status(404).json( {error: "Photo not phound!"});
  }
});


/*
 * Route to update a photo.
 */
router.put('/:photoid', async (req, res, next) => {
  let photo;
  const collection = mongoConnection.getDB().collection("photos");
  const photoId = req.params.photoid;

  try {
    photo = await collection
        .findOne({ _id: photoId})
  }
  catch (e) {
    next(e);
  }

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
          res.status(200).json({
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
        res.status(403).json({
          error: "Updated photo cannot modify businessid or userid"
        });
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid photo object"
      });
    }
  } else {
    next();
  }
});


/*
 * Route to delete a photo.
 */
router.delete('/:photoid', async (req, res, next) => {
  try {
    const result = await mongoConnection.getDB().collection("photos")
        .deleteOne({ _id: req.params.photoid });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Photo not phound!}' })
    }
    res.status(204).end();
  }
  catch (e) {
    next(e);
  }
});
