import { auth } from '@repo/auth';
import { db } from '@repo/db';
async function main() {
  const u = await db.query.user.findFirst();
  console.log('User:', u?.id, u?.email);

  const ctx = await (auth as any).$context;
  console.log('Secret exists:', !!ctx.secret);
  console.log('Session Cookie name:', ctx.authCookies?.sessionToken?.name);
  console.log('Cookie options:', ctx.authCookies?.sessionToken?.options);
  console.log('Available keys on ctx:', Object.keys(ctx));

  const session = await db.query.session.findFirst();
  console.log('Session from DB:', session);

  if (ctx.getSignedCookie) {
    console.log('ctx.getSignedCookie:', ctx.getSignedCookie.toString());
  }
}

main().catch(console.error);
