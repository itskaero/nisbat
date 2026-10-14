import { allowed } from "@/lib/server/devices";
import { onStoreChange } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Server-Sent Events: tells every open Nisbat screen when shared data changed. */
export async function GET(req: Request) {
  if (!(await allowed(req))) return Response.json({ error: "Not allowed" }, { status: 401 });
  const encoder = new TextEncoder();
  let off = () => {};
  let ping: ReturnType<typeof setInterval>;
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* closed */
        }
      };
      send("retry: 3000\n\n");
      off = onStoreChange((change) => send(`event: change\ndata: ${JSON.stringify(change)}\n\n`));
      ping = setInterval(() => send(": ping\n\n"), 15000);
      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        off();
        try {
          controller.close();
        } catch {
          /* closed */
        }
      });
    },
    cancel() {
      clearInterval(ping);
      off();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
