import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/dal";
import type { UserRole } from "@/types";

/**
 * Thin generic CRUD factory over a Prisma model delegate, so each resource's
 * route.ts file is a couple of lines instead of repeating the same
 * try/catch/json boilerplate. Every model here is a flat, non-relational
 * payload from the client's point of view (see prisma/schema.prisma) — the
 * client's TS domain objects already match the Prisma `data` shape 1:1.
 *
 * `authRoles` gates writes server-side (any authenticated user when omitted,
 * a specific role set when given) — closing the gap where content-governance
 * gates like canAuthorContent/canPublishContent (src/lib/permissions.ts)
 * used to be client-only and any caller could hit the API directly.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = any;

interface HandlerOptions {
  /** omitted = any authenticated user; given = must be one of these roles */
  authRoles?: UserRole[];
}

async function safeJson(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function authFailure(status: 401 | 403) {
  return NextResponse.json(
    { error: status === 401 ? "Unauthorized" : "Forbidden" },
    { status },
  );
}

export function createHandler(delegate: Delegate, options: HandlerOptions = {}) {
  return async function POST(req: NextRequest) {
    const auth = await authenticateRequest(req, options.authRoles);
    if (!auth.ok) return authFailure(auth.status);

    const body = await safeJson(req);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    try {
      const row = await delegate.create({ data: body });
      return NextResponse.json(row, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 400 });
    }
  };
}

/** PUT/PATCH by id — strips `id` out of the patch so the primary key is never
 * reassigned. When `authRoles` is set, a patch that transitions `status` to
 * "published" additionally always requires `admin` regardless of `authRoles`
 * — a Faculty-authored draft can only go live under an Admin's own request,
 * never as a side effect of a role check written for ordinary edits. */
export function updateHandler(delegate: Delegate, options: HandlerOptions = {}) {
  return async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(req, options.authRoles);
    if (!auth.ok) return authFailure(auth.status);

    const { id } = await ctx.params;
    const body = await safeJson(req);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    const { id: _drop, ...data } = body;
    void _drop;

    if (data.status === "published" && auth.user.role !== "admin") {
      const existing = await delegate.findUnique({ where: { id } });
      if (existing && existing.status !== "published") {
        return NextResponse.json({ error: "Only Admin can publish" }, { status: 403 });
      }
    }

    try {
      const row = await delegate.update({ where: { id }, data });
      return NextResponse.json(row);
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 400 });
    }
  };
}

export function listHandler(delegate: Delegate, options: HandlerOptions = {}) {
  return async function GET(req: NextRequest) {
    const auth = await authenticateRequest(req, options.authRoles);
    if (!auth.ok) return authFailure(auth.status);

    const rows = await delegate.findMany();
    return NextResponse.json(rows);
  };
}
