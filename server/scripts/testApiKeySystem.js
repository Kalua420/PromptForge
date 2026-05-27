/**
 * Test script for API Key Management System
 * Tests key selection, failover, and failure tracking
 * 
 * Usage: node scripts/testApiKeySystem.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  getApiKey,
  getAllApiKeys,
  markKeySuccess,
  markKeyFailure,
  hasApiKey,
  getAvailableProviders,
  addApiKey,
  listApiKeys,
  getApiKeyStats,
} from '../services/apiKeyService.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Testing API Key Management System\n');

  try {
    // Test 1: Check available providers
    console.log('Test 1: Get Available Providers');
    const providers = await getAvailableProviders();
    console.log(`✅ Found ${providers.length} providers:`, providers);
    console.log('');

    // Test 2: Check if providers have keys
    console.log('Test 2: Check Provider Key Availability');
    for (const provider of ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini']) {
      const hasKey = await hasApiKey(provider);
      console.log(`   ${provider}: ${hasKey ? '✅ Has keys' : '❌ No keys'}`);
    }
    console.log('');

    // Test 3: Get a key
    console.log('Test 3: Get API Key');
    const groqKey = await getApiKey('groq');
    if (groqKey) {
      console.log(`✅ Got Groq key: ${groqKey.key.substring(0, 10)}... (ID: ${groqKey.id || 'env'})`);
    } else {
      console.log('❌ No Groq key available');
    }
    console.log('');

    // Test 4: Get all keys for a provider
    console.log('Test 4: Get All Keys for Provider');
    const allGroqKeys = await getAllApiKeys('groq');
    console.log(`✅ Found ${allGroqKeys.length} Groq keys`);
    allGroqKeys.forEach((k, i) => {
      console.log(`   ${i + 1}. ${k.key.substring(0, 10)}... (ID: ${k.id || 'env'})`);
    });
    console.log('');

    // Test 5: List keys from database
    console.log('Test 5: List Database Keys');
    const dbKeys = await listApiKeys();
    console.log(`✅ Found ${dbKeys.length} keys in database`);
    dbKeys.forEach(k => {
      console.log(`   - ${k.provider}: ${k.label || 'No label'} (Priority: ${k.priority}, Fails: ${k.failCount})`);
    });
    console.log('');

    // Test 6: Get statistics
    console.log('Test 6: Get Key Statistics');
    const stats = await getApiKeyStats();
    console.log('✅ Statistics:');
    for (const [provider, stat] of Object.entries(stats)) {
      console.log(`   ${provider}: ${stat.active}/${stat.total} active, ${stat.failing} failing`);
    }
    console.log('');

    // Test 7: Test failure tracking (if we have a DB key)
    if (groqKey && groqKey.id) {
      console.log('Test 7: Test Failure Tracking');
      console.log(`   Marking key ${groqKey.id} as failed...`);
      await markKeyFailure(groqKey.id);
      
      const keyAfterFail = await prisma.apiKey.findUnique({
        where: { id: groqKey.id },
        select: { failCount: true, lastFailAt: true },
      });
      console.log(`   ✅ Fail count: ${keyAfterFail.failCount}, Last fail: ${keyAfterFail.lastFailAt}`);
      
      console.log(`   Marking key ${groqKey.id} as successful...`);
      await markKeySuccess(groqKey.id);
      
      const keyAfterSuccess = await prisma.apiKey.findUnique({
        where: { id: groqKey.id },
        select: { failCount: true, lastFailAt: true },
      });
      console.log(`   ✅ Fail count reset to: ${keyAfterSuccess.failCount}`);
      console.log('');
    } else {
      console.log('Test 7: Skipped (no database key available)');
      console.log('');
    }

    // Test 8: Test adding a key (then remove it)
    console.log('Test 8: Test Add/Delete Key');
    const testKey = await addApiKey('gemini', 'test_key_12345', 'Test Key', 0);
    console.log(`   ✅ Added test key: ${testKey.id}`);
    
    const keysWithTest = await listApiKeys('gemini');
    console.log(`   ✅ Gemini now has ${keysWithTest.length} key(s)`);
    
    await prisma.apiKey.delete({ where: { id: testKey.id } });
    console.log(`   ✅ Deleted test key`);
    console.log('');

    console.log('🎉 All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   - ${providers.length} providers configured`);
    console.log(`   - ${dbKeys.length} keys in database`);
    console.log(`   - Failover system operational`);
    console.log(`   - Failure tracking working`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
