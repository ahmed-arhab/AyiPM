// Creates demo accounts for local development. Run with `npm run db:seed`.
const { randomBytes, scrypt } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

const PASSWORD = 'ChangeMe@123';
const WORKSPACE_ID = 'default';

const ACCOUNTS = [
  { employeeId: 'AX001', email: 'admin@example.com', name: 'Demo Admin', role: 'admin', department: 'Management', designation: 'Workspace Owner' },
  { employeeId: 'AX002', email: 'pm@example.com', name: 'Demo Project Manager', role: 'project_manager', department: 'Product', designation: 'Project Manager' },
  { employeeId: 'AX003', email: 'employee@example.com', name: 'Demo Employee', role: 'employee', department: 'Engineering', designation: 'Software Engineer' },
];

// Must match the format in src/server/crypto.ts so the app can verify it.
function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) =>
      err ? reject(err) : resolve(`scrypt$${salt.toString('base64')}$${key.toString('base64')}`)
    );
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to create demo accounts with a known password in production.');
  }

  const db = new PrismaClient();
  try {
    if ((await db.user.count()) > 0) {
      console.log('The database already has accounts, so no demo accounts were created. Run `npm run db:reset` first for a clean start.');
      return;
    }

    const passwordHash = await hashPassword(PASSWORD);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    await db.$transaction([
      db.workspace.upsert({ where: { id: WORKSPACE_ID }, create: { id: WORKSPACE_ID, companyName: 'Demo Workspace' }, update: {} }),
      ...ACCOUNTS.map((account) =>
        db.user.create({ data: { ...account, joinDate: today, passwordHash, passwordUpdatedAt: new Date() } })
      ),
    ]);

    console.log(`Created ${ACCOUNTS.length} demo accounts. Password for all of them: ${PASSWORD}`);
    for (const account of ACCOUNTS) console.log(`  ${account.role.padEnd(16)} ${account.email}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
