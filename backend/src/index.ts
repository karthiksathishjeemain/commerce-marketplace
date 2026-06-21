import app from "./app";
import { env } from "./config/env";

if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`Marketplace API running on http://localhost:${env.PORT}`);
  });
}

export default app;
