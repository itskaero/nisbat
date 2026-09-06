import { prisma } from "@/lib/prisma";
import { updateHandler } from "@/lib/api/crud";

export const PATCH = updateHandler(prisma.frequencyPhrase, { authRoles: ["sr_faculty", "admin"] });
