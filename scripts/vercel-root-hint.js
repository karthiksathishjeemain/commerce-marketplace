console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  Vercel build failed: Root Directory is not configured.          ║
╠══════════════════════════════════════════════════════════════════╣
║  This repo is a monorepo. Create TWO Vercel projects:            ║
║                                                                  ║
║  Backend  → Settings → Root Directory → backend                  ║
║  Frontend → Settings → Root Directory → frontend                 ║
║                                                                  ║
║  Do NOT deploy from the repository root (/).                     ║
╚══════════════════════════════════════════════════════════════════╝
`);
process.exit(1);
