import { CREDIT_PACKS } from '../config/tiers.js';

export async function listPlans(req, res) {
  const plans = Object.values(CREDIT_PACKS).map(pack => ({
    id: pack.id,
    name: pack.name,
    price: pack.price,
    credits: pack.credits,
    bonus: pack.bonus,
    pricePerCredit: pack.pricePerCredit,
    popular: pack.popular,
  }));
  res.json({ plans });
}

export async function getInvoicePreview(req, res) {
  try {
    const { planId } = req.query;
    const pack = CREDIT_PACKS[planId];
    if (!pack) return res.status(400).json({ error: 'Invalid plan' });
    res.json({
      planId: pack.id,
      planName: pack.name,
      credits: pack.credits,
      bonus: pack.bonus,
      totalCredits: pack.credits + pack.bonus,
      subtotal: pack.price,
      total: pack.price,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Error calculating invoice:', error);
    res.status(500).json({ error: 'Failed to calculate invoice' });
  }
}
