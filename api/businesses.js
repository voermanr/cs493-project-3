const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const { reviews } = require('./reviews');
const { photos } = require('./photos');
const mongoConnection = require("../lib/mongoConnection");
const {ObjectId} = require("mongodb");

exports.router = router;

//
/*
 * Schema describing required/optional fields of a business object.
 */

const businessSchema = {
  _id: { required: false },
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};


async function getBusinessesCount() {
  return await mongoConnection.getDB().collection('businesses').countDocuments();
}


async function getBusinessesPage(page) {
  const count = await getBusinessesCount();

  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const results = await mongoConnection.getDB().collection('businesses').aggregate([
      { $sort: { _id: 1} },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize}])
    .toArray();

  return {
    businesses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  }
}

/*
 * Route to return a list of businesses.
 */
router.get('/', async (req, res) => {
  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */

  let page = parseInt(req.query.page) || 1;
  const numPerPage = 10;
  const totalCount = await mongoConnection.getDB().collection("businesses").countDocuments();
  const lastPage = Math.ceil(totalCount / numPerPage);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;


  let pageBusinesses;
  try {
    pageBusinesses = await getBusinessesPage(page)
  } catch (err) {
    res.status(500).json({
      error: "Error fetching lodgings list. Try again later."
    })
  }

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/businesses?page=${page + 1}`;
    links.lastPage = `/businesses?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/businesses?page=${page - 1}`;
    links.firstPage = '/businesses?page=1';
  }

  /*
   * Construct and send response.
   */
  res.status(200).json({
    collectionPage: pageBusinesses,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: totalCount,
    links: links
  });

});


// Route to create a new business
router.post('/', function (req, res, next) {
  if (validateAgainstSchema(req.body, businessSchema)) {
    const business = extractValidFields(req.body, businessSchema);

    const db = mongoConnection.getDB();

    db.collection("businesses")
        .insertOne(business)
        .then( document => {
          res.status(201).json({
            id: document.insertedId,
            links: {
              business: `/businesses/${document.insertedId}`
            }
          })
        })
  } else {
    res.status(400).json({
      error: "Request body is not a valid business object"
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async function (req, res, next) {

  let business;
  try {
    let objectId = req.params.businessid;
    console.log("objectId", objectId);
    business = await mongoConnection.getDB().collection("businesses")
       .findOne({_id: objectId});
  }
  catch (e) {
    res.status(500).json({
      error: `Error getting business.\nError: \t${e}`
    })
  }

  if (business) {
    res.status(200).json(business);
  } else {
    next();
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async function (req, res, next) {

  const businessId = req.params.businessid;
  const collection = await mongoConnection.getDB().collection("businesses");

  if (await collection.findOne({_id: businessId})) {

    if (validateAgainstSchema(req.body, businessSchema)) {
      try {
        await collection.updateOne(
            {_id: businessId},
            { $set: extractValidFields(req.body, businessSchema) },
            )
      } catch (err) {
        res.status(500).send(err)
      }

      res.status(200).json({
        links: {
          business: `/businesses/${businessId}`
        }
      });
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (businesses[businessid]) {
    businesses[businessid] = null;
    res.status(204).end();
  } else {
    next();
  }
});
