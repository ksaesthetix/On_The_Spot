// updateTrialEndsAt.js
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://stuartshah22:Athletics%4010.99@onthespot.ui3y5c9.mongodb.net/?authSource=admin";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('onthespot'); // replace with your actual DB name
    const collection = db.collection('test'); // replace with your collection

    const result = await collection.updateMany(
      {}, // Match all documents or customize filter
      [
        {
          $set: {
            trialEndsAt: {
              $toDate: '2025-06-16T19:34:09.118+00:00'
            }
          }
        }
      ]
    );

    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
