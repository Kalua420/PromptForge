import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL    = 'admin@nexprompt.site';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_NAME     = 'Admin';

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    // Update password + ensure role is admin
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { passwordHash: hash, role: 'admin' },
    });
    console.log(`✅ Admin user updated.`);
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Role     : admin`);
  } else {
    // Create fresh admin user
    await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash: hash,
        role: 'admin',
      },
    });
    console.log(`✅ Admin user created.`);
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Role     : admin`);
  }

  // List all admin users for confirmation
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { email: true, role: true, createdAt: true },
  });
  console.log(`\n📋 All admin accounts (${admins.length}):`);
  admins.forEach(a => console.log(`   - ${a.email}`));
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
