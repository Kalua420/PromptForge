import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../src/index.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendEmailVerification,
} from '../services/emailService.js';
import { getOrCreateCreditBalance, addCredits } from '../services/creditService.js';
import { getAvailableProviders } from '../services/apiKeyService.js';

const SIGNUP_BONUS_CREDITS = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!PASSWORD_RE.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  return null;
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (typeof name !== 'string' || name.length < 1 || name.length > 100) return res.status(400).json({ error: 'Name must be 1-100 characters' });
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email format' });

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    // If account exists but is unverified, allow resending the verification email
    if (!exists.emailVerified) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: exists.id },
        data: { verificationToken },
      });
      sendEmailVerification(exists, verificationToken).catch((err) =>
        console.error('Failed to resend verification email:', err.message)
      );
      return res.status(409).json({
        error: 'Email already registered but not verified. A new verification email has been sent.',
        requiresVerification: true,
      });
    }
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      emailVerified: false,
      verificationToken,
    },
  });

  // Send verification email (non-blocking)
  sendEmailVerification(user, verificationToken).catch((err) =>
    console.error('Failed to send verification email:', err.message)
  );

  // Return without tokens — user must verify email first
  res.status(201).json({
    requiresVerification: true,
    message: 'Account created. Please check your email to verify your account before logging in.',
  });
}

export async function verifyEmail(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Verification token required' });

  const user = await prisma.user.findUnique({ where: { verificationToken: token } });
  if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });
  if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

  // Mark verified and clear token
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  });

  // Grant signup credits now that email is confirmed
  await getOrCreateCreditBalance(user.id);
  const balance = await addCredits(user.id, SIGNUP_BONUS_CREDITS, 'bonus', 'Welcome bonus — email verified');

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user, balance).catch((err) =>
    console.error('Failed to send welcome email:', err.message)
  );

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.json({
    message: 'Email verified successfully.',
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, plan: 'free' },
    credits: balance,
    accessToken,
    refreshToken,
  });
}

export async function resendVerification(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (user && !user.emailVerified) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });
    sendEmailVerification(user, verificationToken).catch((err) =>
      console.error('Failed to resend verification email:', err.message)
    );
  }

  res.json({ message: 'If that email is registered and unverified, a new verification link has been sent.' });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });

  // Block unverified accounts
  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Please verify your email address before logging in.',
      requiresVerification: true,
      email: user.email,
    });
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  res.json({
    user: {
      id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role,
      plan: 'free',
    },
    accessToken,
    refreshToken,
  });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ...user, plan: 'free' });
}

export async function refreshToken(req, res) {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    const accessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });
    
    // Send password reset email (non-blocking)
    sendPasswordResetEmail(user, resetToken).catch(err => 
      console.error('Failed to send password reset email:', err.message)
    );
    
    console.log(`✓ Password reset requested for ${email}`);
  }
  
  // Always return success to prevent email enumeration
  res.json({ message: 'If that email is registered, reset instructions have been sent.' });
}

export async function resetPassword(req, res) {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password required' });
  }
  
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }
  
  // Find user with valid reset token
  const user = await prisma.user.findUnique({
    where: { resetToken: token },
  });
  
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
  
  // Send confirmation email (non-blocking)
  sendPasswordResetConfirmation(user).catch(err => 
    console.error('Failed to send password reset confirmation:', err.message)
  );
  
  console.log(`✓ Password reset completed for ${user.email}`);
  
  res.json({ message: 'Password reset successful. You can now login with your new password.' });
}

export async function getProviders(req, res) {
  const providers = await getAvailableProviders();
  res.json({ providers });
}

export async function updateProfile(req, res) {
  try {
    const { name, avatar, currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data = {};

    // Name update
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
        return res.status(400).json({ error: 'Name must be 1–100 characters' });
      }
      data.name = name.trim();
    }

    // Avatar update — accept a data URL (base64) or a plain https URL, or null to clear
    if (avatar !== undefined) {
      if (avatar === null || avatar === '') {
        data.avatar = null;
      } else if (typeof avatar === 'string') {
        // Allow data URLs (base64 images) up to ~2 MB and plain https URLs
        if (avatar.startsWith('data:image/')) {
          const base64Part = avatar.split(',')[1] || '';
          const sizeBytes = Math.ceil((base64Part.length * 3) / 4);
          if (sizeBytes > 2 * 1024 * 1024) {
            return res.status(400).json({ error: 'Avatar image must be under 2 MB' });
          }
        } else if (!avatar.startsWith('https://') && !avatar.startsWith('http://')) {
          return res.status(400).json({ error: 'Invalid avatar URL' });
        }
        data.avatar = avatar;
      }
    }

    // Password change
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const passwordError = validatePassword(newPassword);
      if (passwordError) return res.status(400).json({ error: passwordError });
      data.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, avatar: true, role: true },
    });

    res.json({ user: { ...updated, plan: 'free' } });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
