import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { CREDIT_PACKS } from '../config/tiers.js';

import authRoutes from '../routes/auth.js';
import promptRoutes from '../routes/prompts.js';
import templateRoutes from '../routes/templates.js';
import favoriteRoutes from '../routes/favorites.js';
import paymentRoutes from '../routes/payments.js';
import conversationRoutes from '../routes/conversations.js';
import subscriptionRoutes from '../routes/subscription.js';
import adminRoutes from '../routes/admin.js';
import creditRoutes from '../routes/credits.js';
import apiKeyRoutes from '../routes/apiKeys.js';
import { setupSocketHandlers } from '../sockets/handlers.js';
import { authenticateSocket } from '../middleware/auth.js';

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
  console.warn('WARNING: JWT secrets should be at least 32 characters long for security');
}

export const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

// In development, also allow the alternate localhost form
if (process.env.NODE_ENV !== 'production') {
  if (!allowedOrigins.includes('http://127.0.0.1:5173')) allowedOrigins.push('http://127.0.0.1:5173');
  if (!allowedOrigins.includes('http://localhost:5173'))  allowedOrigins.push('http://localhost:5173');
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use(authenticateSocket);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // In development, allow any localhost/127.0.0.1 origin regardless of port
    if (process.env.NODE_ENV !== 'production') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting: more lenient in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // 500 for dev, 100 for prod
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/credits', creditRoutes);
// api-keys must be registered BEFORE /api/admin to avoid the admin router swallowing the path
app.use('/api/admin/api-keys', apiKeyRoutes);
app.use('/api/admin', adminRoutes);

setupSocketHandlers(io);

// Daily cron: prune old prompts for free users only
async function runDailyTasks() {
  try {
    const cutoff = new Date(Date.now() - 7 * 86400000);

    // Only prune prompts for users with zero credit balance (free/inactive users)
    // Paid users (any credit balance > 0) keep their history indefinitely
    const freeUsers = await prisma.creditBalance.findMany({
      where: { credits: { lte: 0 } },
      select: { userId: true },
    });
    const freeUserIds = freeUsers.map((u) => u.userId);

    if (freeUserIds.length > 0) {
      const { count } = await prisma.prompt.deleteMany({
        where: {
          userId: { in: freeUserIds },
          createdAt: { lt: cutoff },
        },
      });
      if (count > 0) {
        console.log(`✓ Pruned ${count} old prompt(s) from ${freeUserIds.length} free user(s)`);
      }
    }

    // Clean up stale pending payments (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const stalePayments = await prisma.payment.updateMany({
      where: {
        status: 'pending',
        createdAt: { lt: oneHourAgo },
      },
      data: {
        status: 'failed',
      },
    });
    if (stalePayments.count > 0) {
      console.log(`✓ Marked ${stalePayments.count} stale pending payments as failed`);
    }
  } catch (error) {
    console.error('Daily cron error:', error);
  }
}

// Run daily tasks at startup and every 24 hours
runDailyTasks();
setInterval(runDailyTasks, 24 * 60 * 60 * 1000);

// Sync credit packs from static config into DB on startup
// This ensures price changes in tiers.js are reflected without manual DB edits
async function syncCreditPacks() {
  try {
    const staticPacks = Object.values(CREDIT_PACKS);
    const existing = await prisma.creditPack.findMany();

    if (existing.length === 0) {
      // Fresh DB — seed all packs
      await prisma.creditPack.createMany({
        data: staticPacks.map((p, i) => ({
          name: p.name,
          credits: p.credits,
          bonusCredits: p.bonus || 0,
          priceInPaise: p.price * 100,
          isActive: true,
          displayOrder: i,
          popular: p.popular || false,
        })),
      });
      console.log(`✓ Seeded ${staticPacks.length} credit packs`);
    } else {
      // Update existing packs that match by name
      let updated = 0;
      for (const [i, sp] of staticPacks.entries()) {
        const match = existing.find((e) => e.name === sp.name);
        if (match) {
          await prisma.creditPack.update({
            where: { id: match.id },
            data: {
              credits: sp.credits,
              bonusCredits: sp.bonus || 0,
              priceInPaise: sp.price * 100,
              popular: sp.popular || false,
              displayOrder: i,
            },
          });
          updated++;
        }
      }
      if (updated > 0) console.log(`✓ Synced ${updated} credit pack price(s) from config`);
    }
  } catch (err) {
    console.error('Credit pack sync error:', err);
  }
}

syncCreditPacks();

// One-time migration: mark all existing users as email-verified
// so accounts created before verification was introduced aren't locked out
async function migrateExistingUsers() {
  try {
    const { count } = await prisma.user.updateMany({
      where: { emailVerified: false, verificationToken: null },
      data: { emailVerified: true },
    });
    if (count > 0) console.log(`✓ Marked ${count} existing user(s) as email-verified`);
  } catch (err) {
    console.error('User migration error:', err);
  }
}

migrateExistingUsers();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
