import { joinAsPhone, joinAsTv } from "@/lib/remote/hub";
import { codeSchema } from "@/lib/remote/protocol";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Server-Sent Events stream for a TV (receives commands) or phone (receives TV state). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = codeSchema.safeParse(searchParams.get("code"));
  const role = searchParams.get("role");
  if (!code.success || (role !== "tv" && role !== "phone")) return Response.json({ error: "Invalid code or role" }, { status: 400 });

  const encoder = new TextEncoder();
  let leave = () => {};
  let heartbeat: ReturnType<typeof setInterval>;
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* stream already closed */
        }
      };
      controller.enqueue(encoder.encode("retry: 3000\n\n"));
      leave = role === "tv" ? joinAsTv(code.data, send) : joinAsPhone(code.data, send);
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        leave();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      clearInterval(heartbeat);
      leave();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
