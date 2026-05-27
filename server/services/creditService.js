import { prisma } from '../src/index.js';
import { CREDIT_COSTS, CREDIT_PACKS } from '../config/tiers.js';

/**
 * Get or create credit balance for a user
 */
export async function getOrCreateCreditBalance(userId) {
  let balance = await prisma.creditBalance.findUnique({ where: { userId } });
  
  if (!balance) {
    balance = await prisma.creditBalance.create({
      data: { userId, credits: 0 },
    });
  }
  
  return balance;
}

/**
 * Get credit balance for a user
 */
export async function getCreditBalance(userId) {
  const balance = await getOrCreateCreditBalance(userId);
  return balance.credits;
}

/**
 * Add credits to user balance (purchase, bonus, refund)
 */
export async function addCredits(userId, amount, type, description, metadata = null) {
  const balance = await getOrCreateCreditBalance(userId);
  const newBalance = balance.credits + amount;
  
  await prisma.$transaction([
    prisma.creditBalance.update({
      where: { userId },
      data: { credits: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type,
        amount,
        balance: newBalance,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    }),
  ]);
  
  return newBalance;
}

/**
 * Deduct credits from user balance (usage)
 */
export async function deductCredits(userId, amount, description, metadata = null) {
  const balance = await getOrCreateCreditBalance(userId);
  
  if (balance.credits < amount) {
    throw new Error(`Insufficient credits. You have ${balance.credits} credits but need ${amount}.`);
  }
  
  const newBalance = balance.credits - amount;
  
  await prisma.$transaction([
    prisma.creditBalance.update({
      where: { userId },
      data: { credits: newBalance },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type: 'usage',
        amount: -amount,
        balance: newBalance,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    }),
  ]);
  
  return newBalance;
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(userId, amount) {
  const balance = await getCreditBalance(userId);
  return balance >= amount;
}

/**
 * Get credit cost for a prompt generation
 */
export function getCreditCost(provider) {
  return CREDIT_COSTS[provider] || CREDIT_COSTS.groq;
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactions(userId, limit = 50) {
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  return transactions.map(t => ({
    ...t,
    metadata: t.metadata ? JSON.parse(t.metadata) : null,
  }));
}

/**
 * Get credit pack by ID
 */
export function getCreditPack(packId) {
  return CREDIT_PACKS[packId] || null;
}

/**
 * Get all credit packs
 */
export function getAllCreditPacks() {
  return Object.values(CREDIT_PACKS);
}

/**
 * Process credit pack purchase
 */
export async function processCreditPurchase(userId, packId) {
  const pack = getCreditPack(packId);
  if (!pack) {
    throw new Error('Invalid credit pack');
  }
  
  const totalCredits = pack.credits + pack.bonus;
  const description = `Purchased ${pack.name} - ${pack.credits} credits${pack.bonus > 0 ? ` + ${pack.bonus} bonus` : ''}`;
  
  const newBalance = await addCredits(
    userId,
    totalCredits,
    'purchase',
    description,
    { packId, baseCredits: pack.credits, bonusCredits: pack.bonus }
  );
  
  return { newBalance, creditsAdded: totalCredits, pack };
}
