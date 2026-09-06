import { prisma } from "@/lib/prisma";
import { createHandler } from "@/lib/api/crud";

export const POST = createHandler(prisma.drug, { authRoles: ["sr_faculty", "admin"] });
