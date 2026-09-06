import { prisma } from "@/lib/prisma";
import { updateHandler } from "@/lib/api/crud";

export const PATCH = updateHandler(prisma.followUpModule, { authRoles: ["sr_faculty", "admin"] });
