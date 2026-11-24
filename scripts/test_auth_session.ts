import { auth } from '@repo/auth';

async function main() {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  console.log("Empty session:", session);
}

main().catch(console.error);
