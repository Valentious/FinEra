/**
 * FinEra Database Connection Test
 * Run: npx tsx src/tests/db.test.ts
 */

import { db } from '../lib/db/client.js';

async function testDatabase() {
  try {
    await db.connect();
    console.log('✅ Connected to database');

    const isHealthy = await db.healthCheck();
    console.log('Health check:', isHealthy ? '✅ Passed' : '❌ Failed');

    const prisma = db.getClient();
    const userCount = await prisma.user.count();
    const moduleCount = await prisma.learningModule.count();

    console.log('Database stats:', { userCount, moduleCount });

    await db.disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDatabase();
