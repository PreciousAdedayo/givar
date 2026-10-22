// Usage: npm run make-admin -- you@email.com
const { PrismaClient } = require("@prisma/client");
(async () => {
  const email = process.argv[2];
  if (!email) { console.error("Usage: npm run make-admin -- you@email.com"); process.exit(1); }
  const p = new PrismaClient();
  const u = await p.user.update({ where: { email: email.toLowerCase() }, data: { role: "ADMIN" } }).catch(() => null);
  console.log(u ? `${email} is now ADMIN. Sign out and in again.` : "No user with that email.");
  await p.$disconnect();
})();
