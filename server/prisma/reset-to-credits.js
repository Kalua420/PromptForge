import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  console.log('1. Deleting failed payment...');
  const del = await p.payment.deleteMany({ where: { status: 'failed' } });
  console.log(`   Deleted ${del.count} failed payment(s)`);

  console.log('2. Deleting all pending plan changes...');
  await p.pendingPlanChange.deleteMany();

  console.log('3. Deleting all team members...');
  await p.teamMember.deleteMany();

  console.log('4. Deleting all usage records...');
  await p.usageRecord.deleteMany();

  console.log('5. Resetting all subscriptions to free...');
  await p.subscription.updateMany({
    data: {
      planId: 'free',
      status: 'active',
      billingCycle: 'monthly',
      seats: 1,
      currentPeriodEnd: null,
      trialStart: null,
      trialEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      pausedAt: null,
      pauseResumesAt: null,
      paymentGatewaySubId: null,
    },
  });
  const subCount = await p.subscription.count();
  console.log(`   ${subCount} subscriptions reset to free`);

  console.log('6. Clearing credit balances...');
  await p.creditBalance.deleteMany();

  console.log('7. Clearing credit transactions...');
  await p.creditTransaction.deleteMany();

  console.log('\nDone. System is now credit-only with all users on free plan.');
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
