import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://vaidia:vaidiagroup@jananjayacluster1.w5a7rvt.mongodb.net/mydb';
const client = new MongoClient(MONGODB_URI);

async function run() {
  try {
    await client.connect();
    const db = client.db('mydb');
    const users = await db.collection('users').find({}).toArray();
    console.log('[Users List]');
    users.forEach(u => console.log(`- Name: ${u.name}, Email: ${u.email}, ID: ${u._id}`));
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
