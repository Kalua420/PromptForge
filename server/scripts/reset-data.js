/**
 * Database Reset Utility
 * 
 * This script safely resets conversations, prompts, and generations
 * while preserving user accounts and other important data.
 * 
 * Usage: node scripts/reset-data.js
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function resetData() {
  try {
    console.log('\n⚠️  DATABASE RESET UTILITY\n');
    console.log('This will delete:');
    console.log('  • All conversations');
    console.log('  • All prompts');
    console.log('  • All generations');
    console.log('  • All favorites\n');
    console.log('This will preserve:');
    console.log('  • User accounts');
    console.log('  • Templates');
    console.log('  • Credit balances');
    console.log('  • Payments\n');

    // Count current data
    const counts = {
      conversations: await prisma.conversation.count(),
      prompts: await prisma.prompt.count(),
      generations: await prisma.generation.count(),
      favorites: await prisma.favorite.count(),
    };

    console.log('📊 Current database:');
    console.log(`   Conversations: ${counts.conversations}`);
    console.log(`   Prompts: ${counts.prompts}`);
    console.log(`   Generations: ${counts.generations}`);
    console.log(`   Favorites: ${counts.favorites}\n`);

    if (counts.conversations === 0 && counts.prompts === 0 && counts.generations === 0) {
      console.log('✅ Database is already empty. Nothing to reset.\n');
      return;
    }

    // Ask for confirmation
    const confirmed = await askConfirmation('Are you sure you want to proceed? (yes/no): ');

    if (!confirmed) {
      console.log('\n❌ Reset cancelled.\n');
      return;
    }

    console.log('\n🔄 Starting reset...\n');

    // Delete in correct order (respecting foreign key constraints)
    console.log('Deleting generations...');
    const deletedGenerations = await prisma.generation.deleteMany({});
    console.log(`✓ Deleted ${deletedGenerations.count} generations`);

    console.log('Deleting favorites...');
    const deletedFavorites = await prisma.favorite.deleteMany({});
    console.log(`✓ Deleted ${deletedFavorites.count} favorites`);

    console.log('Deleting prompts...');
    const deletedPrompts = await prisma.prompt.deleteMany({});
    console.log(`✓ Deleted ${deletedPrompts.count} prompts`);

    console.log('Deleting conversations...');
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`✓ Deleted ${deletedConversations.count} conversations`);

    console.log('\n✅ Database reset complete!\n');

  } catch (error) {
    console.error('\n❌ Error during reset:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetData();
