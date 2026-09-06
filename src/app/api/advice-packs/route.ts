import { prisma } from "@/lib/prisma";
import { createHandler } from "@/lib/api/crud";

export const POST = createHandler(prisma.advicePack, { authRoles: ["sr_faculty", "admin"] });
