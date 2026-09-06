import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Connection URL for the Prisma CLI (migrate, studio, db seed). The app's own
// runtime client connects separately via the @prisma/adapter-pg driver
// adapter in src/lib/prisma.ts — see that file for why.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
