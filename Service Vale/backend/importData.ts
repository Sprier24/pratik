import { db } from './db';
import { paymentTable } from './db/schema';
import fs from 'fs';

async function importData() {
  const raw = fs.readFileSync('appwrite_export.json', 'utf-8');
  const data = JSON.parse(raw);

  for (const doc of data) {
    try {
      await db.insert(paymentTable).values({
       id: doc.id ,
      engineerId: doc.engineerId || null,
      engineerName: doc.engineerName || null,
      amount: doc.amount || null,
      date:doc.date || null,
      createdAt: doc.$createdAt || null ,
      updatedAt: doc.$updatedAt || null,
    });
    } catch (err) {
      console.error(`Failed to insert record ${doc.id}:`, err);
    }
  }

  console.log('✅ Data import complete');
}

importData();
