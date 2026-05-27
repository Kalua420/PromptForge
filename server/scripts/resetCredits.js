import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAllCreditsAndPayments() {
  try {
    console.log('🔄 Starting credit and payment reset...\n');

    // Delete all credit transactions
    const deletedTransactions = await prisma.creditTransaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTransactions.count} credit transactions`);

    // Delete all payments
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✅ Deleted ${deletedPayments.count} payment records`);

    // Reset all credit balances to 0
    const updatedBalances = await prisma.creditBalance.updateMany({
      data: {
        credits: 0,
      },
    });
    console.log(`✅ Reset ${updatedBalances.count} credit balances to 0`);

    console.log('\n✨ All payment history and credits have been reset successfully!');
    console.log('\nSummary:');
    console.log(`  - Credit transactions deleted: ${deletedTransactions.count}`);
    console.log(`  - Payment records deleted: ${deletedPayments.count}`);
    console.log(`  - Credit balances reset: ${updatedBalances.count}`);

  } catch (error) {
    console.error('❌ Error resetting credits and payments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetAllCreditsAndPayments()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
