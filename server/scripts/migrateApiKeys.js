/**
 * Migration script to move API keys from environment variables to database
 * Run this once after deploying the new API key system
 * 
 * Usage: node scripts/migrateApiKeys.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROVIDER_ENV_KEYS = {
  groq: 'GROQ_API_KEY',
  sambanova: 'SAMBANOVA_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  opencode: 'OPENCODE_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

async function migrateApiKeys() {
  console.log('🔄 Starting API key migration...\n');

  let migratedCount = 0;
  let skippedCount = 0;

  for (const [provider, envKey] of Object.entries(PROVIDER_ENV_KEYS)) {
    const apiKey = process.env[envKey];

    if (!apiKey || apiKey.trim().length === 0) {
      console.log(`⏭️  Skipping ${provider}: No API key in environment`);
      skippedCount++;
      continue;
    }

    // Check if this key already exists in database
    const existing = await prisma.apiKey.findFirst({
      where: {
        provider,
        apiKey: apiKey.trim(),
      },
    });

    if (existing) {
      console.log(`⏭️  Skipping ${provider}: Key already exists in database`);
      skippedCount++;
      continue;
    }

    // Add the key to database
    await prisma.apiKey.create({
      data: {
        provider,
        apiKey: apiKey.trim(),
        label: 'Migrated from environment',
        priority: 0,
        isActive: true,
      },
    });

    console.log(`✅ Migrated ${provider}: Added to database`);
    migratedCount++;
  }

  console.log(`\n📊 Migration complete:`);
  console.log(`   ✅ Migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`\n💡 You can now manage API keys through the admin panel at /api/admin/api-keys`);
  console.log(`💡 Environment variables will still work as fallback if no database keys are available`);
}

migrateApiKeys()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
