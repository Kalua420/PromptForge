import { prisma } from '../src/index.js';
import { CREDIT_PACKS } from '../config/tiers.js';

// ─── helper: shape a CreditPack row for API responses ───────────────────────
function formatPack(pack) {
  return {
    id: pack.id,
    name: pack.name,
    credits: pack.credits,
    bonus: pack.bonusCredits,
    price: pack.priceInPaise,          // stored in paise, e.g. 9900 = ₹99
    pricePerCredit: pack.credits > 0
      ? Number((pack.priceInPaise / 100 / pack.credits).toFixed(4))
      : 0,
    isActive: pack.isActive,
    displayOrder: pack.displayOrder,
    popular: pack.popular,
    createdAt: pack.createdAt,
  };
}

export async function getStats(req, res) {
  try {
    const [totalUsers, totalPrompts, totalTemplates, totalConversations, totalPayments, recentUsers, promptsByDay] = await Promise.all([
      prisma.user.count(),
      prisma.prompt.count(),
      prisma.template.count(),
      prisma.conversation.count(),
      prisma.payment.count(),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.prompt.groupBy({ by: ['createdAt'], _count: true, orderBy: { createdAt: 'desc' }, take: 7 }),
    ]);

    res.json({
      totalUsers,
      totalPrompts,
      totalTemplates,
      totalConversations,
      totalPayments,
      recentUsers,
      promptsByDay: promptsByDay.map((d) => ({ date: d.createdAt, count: d._count })),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export async function listUsers(req, res) {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }], // admins ('admin' < 'user') sort first
        select: {
          id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
          _count: { select: { prompts: true, conversations: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
}

export async function getUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
        _count: { select: { prompts: true, conversations: true, payments: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, amount: true, status: true, createdAt: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function updateUser(req, res) {
  try {
    const { name, email, role, avatar } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (avatar !== undefined) data.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function deleteUser(req, res) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

export async function listTemplatesAdmin(req, res) {
  try {
    const { page = 1, limit = 20, category, plan } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};
    if (category) where.category = category;
    if (plan) where.plan = plan;

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.template.count({ where }),
    ]);

    res.json({ templates, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
}

export async function createTemplateAdmin(req, res) {
  try {
    const { title, description, category, content, plan, featured } = req.body;
    if (!title || !category || !content) {
      return res.status(400).json({ error: 'Title, category, and content are required' });
    }
    const template = await prisma.template.create({
      data: {
        title,
        description: description || '',
        category,
        content,
        plan: plan || 'free',
        featured: featured || false,
      },
    });
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
}

export async function updateTemplateAdmin(req, res) {
  try {
    const { title, description, category, content, plan, featured } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (content !== undefined) data.content = content;
    if (plan !== undefined) data.plan = plan;
    if (featured !== undefined) data.featured = featured;

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data,
    });
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
}

export async function deleteTemplateAdmin(req, res) {
  try {
    await prisma.template.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}

export async function getPlans(req, res) {
  try {
    const packs = await prisma.creditPack.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // Seed from static config if DB is empty (first run)
    if (packs.length === 0) {
      const staticPacks = Object.values(CREDIT_PACKS);
      await prisma.creditPack.createMany({
        data: staticPacks.map((p, i) => ({
          name: p.name,
          credits: p.credits,
          bonusCredits: p.bonus || 0,
          priceInPaise: p.price * 100,   // convert ₹ → paise
          isActive: true,
          displayOrder: i,
          popular: p.popular || false,
        })),
        skipDuplicates: true,
      });
      const seeded = await prisma.creditPack.findMany({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      });
      return res.json({ plans: seeded.map(formatPack) });
    }

    res.json({ plans: packs.map(formatPack) });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
}

export async function createPlan(req, res) {
  try {
    const { name, credits, bonus, price, popular, displayOrder, isActive } = req.body;
    if (!name || credits == null || price == null) {
      return res.status(400).json({ error: 'name, credits, and price are required' });
    }
    if (credits < 1) return res.status(400).json({ error: 'credits must be at least 1' });
    if (price < 0)   return res.status(400).json({ error: 'price cannot be negative' });

    const pack = await prisma.creditPack.create({
      data: {
        name: String(name).trim(),
        credits: Number(credits),
        bonusCredits: Number(bonus || 0),
        priceInPaise: Math.round(Number(price) * 100),  // ₹ → paise
        popular: Boolean(popular),
        displayOrder: displayOrder != null ? Number(displayOrder) : 0,
        isActive: isActive !== false,
      },
    });
    res.status(201).json(formatPack(pack));
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
}

export async function updatePlan(req, res) {
  try {
    const { id } = req.params;
    const { name, credits, bonus, price, popular, displayOrder, isActive } = req.body;

    const existing = await prisma.creditPack.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Plan not found' });

    const data = {};
    if (name        !== undefined) data.name         = String(name).trim();
    if (credits     !== undefined) data.credits       = Number(credits);
    if (bonus       !== undefined) data.bonusCredits  = Number(bonus);
    if (price       !== undefined) data.priceInPaise  = Math.round(Number(price) * 100);
    if (popular     !== undefined) data.popular       = Boolean(popular);
    if (displayOrder!== undefined) data.displayOrder  = Number(displayOrder);
    if (isActive    !== undefined) data.isActive      = Boolean(isActive);

    const pack = await prisma.creditPack.update({ where: { id }, data });
    res.json(formatPack(pack));
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
}

export async function deletePlan(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.creditPack.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Plan not found' });

    await prisma.creditPack.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
}

export async function getCreditSummary(req, res) {
  try {
    const [totalCreditsSold, totalUsersWithCredits, totalOutstandingCredits, totalCreditTransactions] = await Promise.all([
      prisma.creditTransaction.aggregate({
        where: { type: 'purchase', amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      prisma.creditBalance.count({
        where: { credits: { gt: 0 } },
      }),
      prisma.creditBalance.aggregate({
        _sum: { credits: true },
      }),
      prisma.creditTransaction.count(),
    ]);

    const topBuyers = await prisma.creditTransaction.groupBy({
      by: ['userId'],
      where: { type: 'purchase' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    const buyerDetails = await Promise.all(
      topBuyers.map(b =>
        prisma.user.findUnique({
          where: { id: b.userId },
          select: { id: true, name: true, email: true },
        }).then(user => ({
          user,
          totalCreditsPurchased: b._sum.amount,
        }))
      )
    );

    const recentTransactions = await prisma.creditTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      totalCreditsSold: totalCreditsSold._sum.amount || 0,
      totalUsersWithCredits,
      totalOutstandingCredits: totalOutstandingCredits._sum.credits || 0,
      totalCreditTransactions,
      topBuyers: buyerDetails,
      recentTransactions: recentTransactions.map(t => ({
        ...t,
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching credit summary:', error);
    res.status(500).json({ error: 'Failed to fetch credit summary' });
  }
}

export async function grantCredits(req, res) {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ error: 'userId and amount are required' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { addCredits } = await import('../services/creditService.js');
    const newBalance = await addCredits(
      userId,
      amount,
      'admin_grant',
      description || `Admin grant of ${amount} credits`,
      { grantedBy: req.user?.id || 'admin', reason: description || 'Manual grant' }
    );

    res.json({ success: true, userId, creditsGranted: amount, newBalance });
  } catch (error) {
    console.error('Error granting credits:', error);
    res.status(500).json({ error: 'Failed to grant credits' });
  }
}

export async function getServices(req, res) {
  try {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch { /* not connected */ }

    // Check AI provider keys from database
    const PROVIDERS = ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini'];
    const [dbKeyCounts, failingCounts] = await Promise.all([
      prisma.apiKey.groupBy({
        by: ['provider'],
        where: { isActive: true },
        _count: { id: true },
      }),
      prisma.apiKey.groupBy({
        by: ['provider'],
        where: { isActive: true, failCount: { gte: 3 } },
        _count: { id: true },
      }),
    ]);

    const keyCountMap = Object.fromEntries(dbKeyCounts.map(r => [r.provider, r._count.id]));
    const failingMap = Object.fromEntries(failingCounts.map(r => [r.provider, r._count.id]));

    const ai = Object.fromEntries(
      PROVIDERS.map(p => [
        p,
        {
          status: (keyCountMap[p] || 0) > 0 ? 'configured' : 'not configured',
          keyCount: keyCountMap[p] || 0,
          failingCount: failingMap[p] || 0,
        },
      ])
    );

    const services = {
      database: { status: dbStatus, provider: 'MySQL' },
      razorpay: { status: process.env.RAZORPAY_KEY_ID ? 'configured' : 'not configured' },
      ai,
    };

    res.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
}

export async function getApiKeyFailures(req, res) {
  try {
    const { provider, keyId, limit = 100 } = req.query;
    const { getFailureLogs, getFailingSummary } = await import('../services/apiKeyService.js');

    const [logs, failing] = await Promise.all([
      getFailureLogs({ provider, keyId, limit: Math.min(Number(limit), 500) }),
      getFailingSummary(),
    ]);

    res.json({ logs, failing });
  } catch (error) {
    console.error('Error fetching API key failures:', error);
    res.status(500).json({ error: 'Failed to fetch failure logs' });
  }
}

export async function resetApiKeyFailures(req, res) {
  try {
    const { id } = req.params;
    const { resetKeyFailures } = await import('../services/apiKeyService.js');
    await resetKeyFailures(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting API key failures:', error);
    res.status(500).json({ error: 'Failed to reset fail count' });
  }
}


export async function getApiKeyUsageLogs(req, res) {
  try {
    const { provider, apiKeyId, userId, success, limit = 100, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (provider) where.provider = provider;
    if (apiKeyId) where.apiKeyId = apiKeyId;
    if (userId) where.userId = userId;
    if (success !== undefined) where.success = success === 'true';

    const [logs, total] = await Promise.all([
      prisma.apiKeyUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 500),
        skip,
        select: {
          id: true,
          apiKeyId: true,
          provider: true,
          userId: true,
          promptId: true,
          generationId: true,
          useCase: true,
          tokensUsed: true,
          success: true,
          errorMsg: true,
          createdAt: true,
        },
      }),
      prisma.apiKeyUsageLog.count({ where }),
    ]);

    // Enrich with user details, API key label, and prompt title
    const userIds = [...new Set(logs.map(l => l.userId))];
    const apiKeyIds = [...new Set(logs.map(l => l.apiKeyId))];
    const promptIds = [...new Set(logs.map(l => l.promptId).filter(Boolean))];

    const [users, apiKeys, prompts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, role: true },
      }),
      prisma.apiKey.findMany({
        where: { id: { in: apiKeyIds } },
        select: { id: true, label: true, provider: true },
      }),
      prisma.prompt.findMany({
        where: { id: { in: promptIds } },
        select: { id: true, title: true, useCase: true, provider: true, tokensUsed: true, createdAt: true },
      }),
    ]);

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const apiKeyMap = Object.fromEntries(apiKeys.map(k => [k.id, k]));
    const promptMap = Object.fromEntries(prompts.map(p => [p.id, p]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      user: userMap[log.userId] || null,
      apiKey: apiKeyMap[log.apiKeyId] || null,
      prompt: log.promptId ? (promptMap[log.promptId] || null) : null,
    }));

    res.json({ logs: enrichedLogs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error('Error fetching API key usage logs:', error);
    res.status(500).json({ error: 'Failed to fetch usage logs' });
  }
}

export async function getApiKeyUsageStats(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalRequests, successfulRequests, failedRequests, byProvider, byKey, topUsers] = await Promise.all([
      prisma.apiKeyUsageLog.count({ where }),
      prisma.apiKeyUsageLog.count({ where: { ...where, success: true } }),
      prisma.apiKeyUsageLog.count({ where: { ...where, success: false } }),
      
      // Requests by provider
      prisma.apiKeyUsageLog.groupBy({
        by: ['provider'],
        where,
        _count: { id: true },
        _sum: { tokensUsed: true },
      }),
      
      // Requests by API key
      prisma.apiKeyUsageLog.groupBy({
        by: ['apiKeyId', 'provider'],
        where,
        _count: { id: true },
        _sum: { tokensUsed: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      
      // Top users by request count
      prisma.apiKeyUsageLog.groupBy({
        by: ['userId'],
        where,
        _count: { id: true },
        _sum: { tokensUsed: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Enrich top users with user details
    const userIds = topUsers.map(u => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    
    const enrichedTopUsers = topUsers.map(u => ({
      user: userMap[u.userId],
      requestCount: u._count.id,
      totalTokens: u._sum.tokensUsed || 0,
    }));

    res.json({
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) : 0,
      byProvider: byProvider.map(p => ({
        provider: p.provider,
        requestCount: p._count.id,
        totalTokens: p._sum.tokensUsed || 0,
      })),
      byKey: byKey.map(k => ({
        apiKeyId: k.apiKeyId,
        provider: k.provider,
        requestCount: k._count.id,
        totalTokens: k._sum.tokensUsed || 0,
      })),
      topUsers: enrichedTopUsers,
    });
  } catch (error) {
    console.error('Error fetching API key usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
}
