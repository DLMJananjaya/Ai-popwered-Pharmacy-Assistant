/**
 * seed.mjs
 * Seeds inventory items and rack layout for the user: matheeshajananjaya2@gmail.com
 * Run: node seed.mjs
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://vaidia:vaidiagroup@jananjayacluster1.w5a7rvt.mongodb.net/mydb';
const USER_EMAIL  = 'matheeshajananjaya2@gmail.com';

const client = new MongoClient(MONGODB_URI);

async function main() {
  await client.connect();
  console.log('[OK] Connected to MongoDB');

  const db = client.db('mydb');

  // ── 1. Find the user ─────────────────────────────────────────────────────
  const user = await db.collection('users').findOne({ email: USER_EMAIL });
  if (!user) {
    console.error(`[ERROR] User not found: ${USER_EMAIL}`);
    process.exit(1);
  }
  const userId = user._id;
  console.log(`[OK] Found user: ${user.name} (${user.email}) → _id: ${userId}`);

  // ── 2. Clear existing inventory & racks for this user ─────────────────────
  await db.collection('inventoryitems').deleteMany({ userId });
  await db.collection('racklayouts').deleteMany({ userId });
  console.log('[OK] Cleared existing inventory and rack layout for this user');

  // ── 3. Insert inventory items ──────────────────────────────────────────────
  const now = new Date();
  const exp1 = new Date('2026-12-31');
  const exp2 = new Date('2027-06-30');
  const exp3 = new Date('2027-03-31');

  const inventoryItems = [
    // Rack A — Common medicines
    { userId, name: 'paracetamol',         strength: '500mg',     qty: 200, expireDate: exp2, unitPrice: 15.00,   createdAt: now, updatedAt: now },
    { userId, name: 'ibuprofen',           strength: '400mg',     qty: 150, expireDate: exp2, unitPrice: 20.00,   createdAt: now, updatedAt: now },
    { userId, name: 'amoxicillin',         strength: '500mg',     qty: 120, expireDate: exp1, unitPrice: 35.00,   createdAt: now, updatedAt: now },
    { userId, name: 'amoxicillin clavulanate', strength: '625mg', qty: 80,  expireDate: exp1, unitPrice: 145.00,  createdAt: now, updatedAt: now },
    { userId, name: 'metronidazole',       strength: '400mg',     qty: 100, expireDate: exp2, unitPrice: 12.00,   createdAt: now, updatedAt: now },
    { userId, name: 'cetirizine',          strength: '10mg',      qty: 180, expireDate: exp3, unitPrice: 18.00,   createdAt: now, updatedAt: now },
    { userId, name: 'chlorpheniramine',    strength: '4mg',       qty: 200, expireDate: exp3, unitPrice: 8.00,    createdAt: now, updatedAt: now },
    { userId, name: 'oral rehydration salts', strength: 'Sachet', qty: 250, expireDate: exp2, unitPrice: 15.00,   createdAt: now, updatedAt: now },

    // Rack B — Antibiotics & Antifungals
    { userId, name: 'azithromycin',        strength: '500mg',     qty: 60,  expireDate: exp1, unitPrice: 65.00,   createdAt: now, updatedAt: now },
    { userId, name: 'ciprofloxacin',       strength: '500mg',     qty: 80,  expireDate: exp1, unitPrice: 35.00,   createdAt: now, updatedAt: now },
    { userId, name: 'doxycycline',         strength: '100mg',     qty: 60,  expireDate: exp2, unitPrice: 22.00,   createdAt: now, updatedAt: now },
    { userId, name: 'levofloxacin',        strength: '500mg',     qty: 50,  expireDate: exp1, unitPrice: 65.00,   createdAt: now, updatedAt: now },
    { userId, name: 'cefixime',            strength: '200mg',     qty: 60,  expireDate: exp1, unitPrice: 65.00,   createdAt: now, updatedAt: now },
    { userId, name: 'fluconazole',         strength: '150mg',     qty: 40,  expireDate: exp2, unitPrice: 65.00,   createdAt: now, updatedAt: now },
    { userId, name: 'clotrimazole',        strength: '1% Cream',  qty: 30,  expireDate: exp3, unitPrice: 85.00,   createdAt: now, updatedAt: now },

    // Rack C — Cardiovascular & Diabetes
    { userId, name: 'amlodipine',          strength: '5mg',       qty: 100, expireDate: exp3, unitPrice: 28.00,   createdAt: now, updatedAt: now },
    { userId, name: 'atenolol',            strength: '50mg',      qty: 90,  expireDate: exp3, unitPrice: 18.00,   createdAt: now, updatedAt: now },
    { userId, name: 'losartan',            strength: '50mg',      qty: 80,  expireDate: exp3, unitPrice: 45.00,   createdAt: now, updatedAt: now },
    { userId, name: 'metformin',           strength: '500mg',     qty: 150, expireDate: exp3, unitPrice: 28.00,   createdAt: now, updatedAt: now },
    { userId, name: 'glimepiride',         strength: '2mg',       qty: 90,  expireDate: exp2, unitPrice: 35.00,   createdAt: now, updatedAt: now },
    { userId, name: 'atorvastatin',        strength: '20mg',      qty: 100, expireDate: exp3, unitPrice: 55.00,   createdAt: now, updatedAt: now },
    { userId, name: 'aspirin',             strength: '75mg',      qty: 200, expireDate: exp3, unitPrice: 10.00,   createdAt: now, updatedAt: now },
    { userId, name: 'clopidogrel',         strength: '75mg',      qty: 60,  expireDate: exp3, unitPrice: 95.00,   createdAt: now, updatedAt: now },

    // Rack D — GI & Respiratory
    { userId, name: 'omeprazole',          strength: '20mg',      qty: 150, expireDate: exp2, unitPrice: 22.00,   createdAt: now, updatedAt: now },
    { userId, name: 'pantoprazole',        strength: '40mg',      qty: 100, expireDate: exp2, unitPrice: 32.00,   createdAt: now, updatedAt: now },
    { userId, name: 'ondansetron',         strength: '4mg',       qty: 80,  expireDate: exp2, unitPrice: 45.00,   createdAt: now, updatedAt: now },
    { userId, name: 'domperidone',         strength: '10mg',      qty: 100, expireDate: exp2, unitPrice: 18.00,   createdAt: now, updatedAt: now },
    { userId, name: 'loperamide',          strength: '2mg',       qty: 60,  expireDate: exp3, unitPrice: 20.00,   createdAt: now, updatedAt: now },
    { userId, name: 'salbutamol',          strength: '100mcg Inhaler', qty: 25, expireDate: exp3, unitPrice: 320.00, createdAt: now, updatedAt: now },
    { userId, name: 'montelukast',         strength: '10mg',      qty: 60,  expireDate: exp3, unitPrice: 95.00,   createdAt: now, updatedAt: now },

    // Rack E — Vitamins & Supplements
    { userId, name: 'folic acid',          strength: '5mg',       qty: 200, expireDate: exp3, unitPrice: 8.00,    createdAt: now, updatedAt: now },
    { userId, name: 'vitamin c',           strength: '500mg',     qty: 150, expireDate: exp3, unitPrice: 20.00,   createdAt: now, updatedAt: now },
    { userId, name: 'vitamin d',           strength: '1000IU',    qty: 100, expireDate: exp3, unitPrice: 45.00,   createdAt: now, updatedAt: now },
    { userId, name: 'calcium carbonate',   strength: '500mg',     qty: 100, expireDate: exp3, unitPrice: 25.00,   createdAt: now, updatedAt: now },
    { userId, name: 'zinc',               strength: '20mg',       qty: 120, expireDate: exp3, unitPrice: 15.00,   createdAt: now, updatedAt: now },
    { userId, name: 'multivitamin',        strength: 'Tablet',    qty: 100, expireDate: exp3, unitPrice: 35.00,   createdAt: now, updatedAt: now },

    // Rack F — Pain & Neurological
    { userId, name: 'diclofenac',          strength: '50mg',      qty: 100, expireDate: exp2, unitPrice: 18.00,   createdAt: now, updatedAt: now },
    { userId, name: 'tramadol',            strength: '50mg',      qty: 50,  expireDate: exp2, unitPrice: 35.00,   createdAt: now, updatedAt: now },
    { userId, name: 'prednisolone',        strength: '5mg',       qty: 100, expireDate: exp2, unitPrice: 15.00,   createdAt: now, updatedAt: now },
    { userId, name: 'dexamethasone',       strength: '0.5mg',     qty: 80,  expireDate: exp2, unitPrice: 18.00,   createdAt: now, updatedAt: now },
    { userId, name: 'gabapentin',          strength: '300mg',     qty: 60,  expireDate: exp3, unitPrice: 45.00,   createdAt: now, updatedAt: now },
    { userId, name: 'amitriptyline',       strength: '10mg',      qty: 60,  expireDate: exp3, unitPrice: 12.00,   createdAt: now, updatedAt: now },

    // Fridge — Insulin & Injectables
    { userId, name: 'insulin glargine',    strength: '100U/mL Pen', qty: 10, expireDate: exp1, unitPrice: 1850.00, createdAt: now, updatedAt: now },
    { userId, name: 'insulin regular',     strength: '100IU/mL',  qty: 8,   expireDate: exp1, unitPrice: 750.00,  createdAt: now, updatedAt: now },
    { userId, name: 'insulin isophane',    strength: '100IU/mL',  qty: 8,   expireDate: exp1, unitPrice: 750.00,  createdAt: now, updatedAt: now },
  ];

  const insertResult = await db.collection('inventoryitems').insertMany(inventoryItems);
  console.log(`[OK] Inserted ${insertResult.insertedCount} inventory items`);

  // ── 4. Build a rack layout with the items ─────────────────────────────────
  // Map inserted items by name for easy lookup
  const insertedIds = insertResult.insertedIds;
  const nameToIdx = {};
  inventoryItems.forEach((item, i) => { nameToIdx[item.name] = i; });

  const gridEntry = (name, strength) => ({ name: `${name} ${strength}`, qty: inventoryItems[nameToIdx[name]]?.qty ?? 0 });

  const rackLayout = [
    {
      id: 'rack-A',
      type: 'rack',
      name: 'Rack A — Common',
      rows: 3,
      cols: 3,
      x: 80,
      y: 80,
      rotation: 0,
      gridData: {
        '0-0': gridEntry('paracetamol', '500mg'),
        '0-1': gridEntry('ibuprofen', '400mg'),
        '0-2': gridEntry('amoxicillin', '500mg'),
        '1-0': gridEntry('amoxicillin clavulanate', '625mg'),
        '1-1': gridEntry('metronidazole', '400mg'),
        '1-2': gridEntry('cetirizine', '10mg'),
        '2-0': gridEntry('chlorpheniramine', '4mg'),
        '2-1': gridEntry('oral rehydration salts', 'Sachet'),
        '2-2': { name: '', qty: 0 },
      },
    },
    {
      id: 'rack-B',
      type: 'rack',
      name: 'Rack B — Antibiotics',
      rows: 3,
      cols: 3,
      x: 420,
      y: 80,
      rotation: 0,
      gridData: {
        '0-0': gridEntry('azithromycin', '500mg'),
        '0-1': gridEntry('ciprofloxacin', '500mg'),
        '0-2': gridEntry('doxycycline', '100mg'),
        '1-0': gridEntry('levofloxacin', '500mg'),
        '1-1': gridEntry('cefixime', '200mg'),
        '1-2': gridEntry('fluconazole', '150mg'),
        '2-0': gridEntry('clotrimazole', '1% Cream'),
        '2-1': { name: '', qty: 0 },
        '2-2': { name: '', qty: 0 },
      },
    },
    {
      id: 'rack-C',
      type: 'rack',
      name: 'Rack C — Cardio & Diabetes',
      rows: 3,
      cols: 3,
      x: 80,
      y: 340,
      rotation: 0,
      gridData: {
        '0-0': gridEntry('amlodipine', '5mg'),
        '0-1': gridEntry('atenolol', '50mg'),
        '0-2': gridEntry('losartan', '50mg'),
        '1-0': gridEntry('metformin', '500mg'),
        '1-1': gridEntry('glimepiride', '2mg'),
        '1-2': gridEntry('atorvastatin', '20mg'),
        '2-0': gridEntry('aspirin', '75mg'),
        '2-1': gridEntry('clopidogrel', '75mg'),
        '2-2': { name: '', qty: 0 },
      },
    },
    {
      id: 'rack-D',
      type: 'rack',
      name: 'Rack D — GI & Respiratory',
      rows: 3,
      cols: 3,
      x: 420,
      y: 340,
      rotation: 0,
      gridData: {
        '0-0': gridEntry('omeprazole', '20mg'),
        '0-1': gridEntry('pantoprazole', '40mg'),
        '0-2': gridEntry('ondansetron', '4mg'),
        '1-0': gridEntry('domperidone', '10mg'),
        '1-1': gridEntry('loperamide', '2mg'),
        '1-2': gridEntry('salbutamol', '100mcg Inhaler'),
        '2-0': gridEntry('montelukast', '10mg'),
        '2-1': { name: '', qty: 0 },
        '2-2': { name: '', qty: 0 },
      },
    },
    {
      id: 'rack-E',
      type: 'rack',
      name: 'Rack E — Vitamins',
      rows: 2,
      cols: 3,
      x: 80,
      y: 600,
      rotation: 0,
      gridData: {
        '0-0': gridEntry('folic acid', '5mg'),
        '0-1': gridEntry('vitamin c', '500mg'),
        '0-2': gridEntry('vitamin d', '1000IU'),
        '1-0': gridEntry('calcium carbonate', '500mg'),
        '1-1': gridEntry('zinc', '20mg'),
        '1-2': gridEntry('multivitamin', 'Tablet'),
      },
    },
    {
      id: 'rack-F',
      type: 'rack',
      name: 'Rack F — Pain & Neuro',
      rows: 2,
      cols: 3,
      x: 420,
      y: 600,
      rotation: 0,
      gridData: {
        '0-0': gridEntry('diclofenac', '50mg'),
        '0-1': gridEntry('tramadol', '50mg'),
        '0-2': gridEntry('prednisolone', '5mg'),
        '1-0': gridEntry('dexamethasone', '0.5mg'),
        '1-1': gridEntry('gabapentin', '300mg'),
        '1-2': gridEntry('amitriptyline', '10mg'),
      },
    },
    {
      id: 'rack-Fridge',
      type: 'rack',
      name: 'Fridge — Insulin',
      rows: 1,
      cols: 3,
      x: 760,
      y: 80,
      rotation: 0,
      gridData: {
        '0-0': gridEntry('insulin glargine', '100U/mL Pen'),
        '0-1': gridEntry('insulin regular', '100IU/mL'),
        '0-2': gridEntry('insulin isophane', '100IU/mL'),
      },
    },
    {
      id: 'door-1',
      type: 'door',
      name: 'Main Door',
      x: 760,
      y: 600,
      rotation: 0,
    },
    {
      id: 'user-1',
      type: 'user',
      name: 'Pharmacist',
      x: 760,
      y: 340,
      rotation: 0,
    },
  ];

  // Save as a single racklayout document (matching the app's structure)
  await db.collection('racklayouts').insertOne({
    userId,
    elements: rackLayout,
    createdAt: now,
    updatedAt: now,
  });
  console.log('[OK] Inserted rack layout with 6 racks + fridge + door + user marker');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== SEED COMPLETE ===');
  console.log(`User: ${USER_EMAIL}`);
  console.log(`Inventory items: ${inventoryItems.length}`);
  console.log(`Racks in layout: 7 (A, B, C, D, E, F, Fridge)`);
  console.log('\nInventory by rack:');
  console.log('  Rack A - Common:        paracetamol, ibuprofen, amoxicillin, augmentin, metronidazole, cetirizine, chlorpheniramine, ORS');
  console.log('  Rack B - Antibiotics:   azithromycin, ciprofloxacin, doxycycline, levofloxacin, cefixime, fluconazole, clotrimazole');
  console.log('  Rack C - Cardio/DM:     amlodipine, atenolol, losartan, metformin, glimepiride, atorvastatin, aspirin, clopidogrel');
  console.log('  Rack D - GI/Resp:       omeprazole, pantoprazole, ondansetron, domperidone, loperamide, salbutamol, montelukast');
  console.log('  Rack E - Vitamins:      folic acid, vitamin c, vitamin d, calcium carbonate, zinc, multivitamin');
  console.log('  Rack F - Pain/Neuro:    diclofenac, tramadol, prednisolone, dexamethasone, gabapentin, amitriptyline');
  console.log('  Fridge - Insulin:       insulin glargine, insulin regular, insulin isophane');

  await client.close();
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
