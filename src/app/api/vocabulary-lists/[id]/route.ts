import { prisma } from "@/lib/prisma";
import { updateHandler } from "@/lib/api/crud";

export const PATCH = updateHandler(prisma.vocabularyList, { authRoles: ["sr_faculty", "admin"] });
