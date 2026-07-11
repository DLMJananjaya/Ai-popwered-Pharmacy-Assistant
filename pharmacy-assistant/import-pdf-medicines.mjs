import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import readline from 'readline';

const MONGODB_URI = 'mongodb+srv://vaidia:vaidiagroup@jananjayacluster1.w5a7rvt.mongodb.net/mydb';
const client = new MongoClient(MONGODB_URI);

async function run() {
  try {
    await client.connect();
    const db = client.db('mydb');
    const users = db.collection('users');
    const inventory = db.collection('inventoryitems');

    const user = await users.findOne({ email: 'thamodaabishek@gmail.com' });
    if (!user) {
      console.log('User not found!');
      return;
    }
    console.log(`Found user: ${user.name} (${user._id})`);

    const fileStream = fs.createReadStream('medicines_from_pdf.txt');
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let addedCount = 0;
    let skippedCount = 0;
    
    // Future expiry date (1 year from now)
    const expireDate = new Date();
    expireDate.setFullYear(expireDate.getFullYear() + 1);

    for await (const line of rl) {
      if (!line.trim()) continue;

      let name, strength, qty, price;
      
      // Try matching with strength (e.g., 250 mg, 500mg, 13.81g)
      const match1 = line.match(/^(.*?)\s+([\d\.]+\s*(?:mg|g|ml))\s+(\d+)\s+([\d\.]+)$/i);
      if (match1) {
        name = match1[1].trim();
        strength = match1[2].trim();
        qty = parseInt(match1[3], 10);
        price = parseFloat(match1[4]);
      } else {
        // Try without strength (e.g., L-Trim 61 11.5)
        const match2 = line.match(/^(.*?)\s+(\d+)\s+([\d\.]+)$/);
        if (match2) {
          name = match2[1].trim();
          strength = 'N/A';
          qty = parseInt(match2[2], 10);
          price = parseFloat(match2[3]);
        } else {
          console.log(`Could not parse line: ${line}`);
          continue;
        }
      }

      // Check if medicine already exists for user (case insensitive)
      const existing = await inventory.findOne({
        userId: user._id,
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      if (existing) {
        skippedCount++;
      } else {
        await inventory.insertOne({
          userId: user._id,
          name: name,
          strength: strength,
          qty: qty,
          expireDate: expireDate,
          unitPrice: price,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        });
        addedCount++;
        console.log(`Added ${name} ${strength}`);
      }
    }
    
    console.log(`Done. Added ${addedCount} new items. Skipped ${skippedCount} existing items.`);

  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
