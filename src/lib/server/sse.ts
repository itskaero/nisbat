import "server-only";

export type SseSend = (event: string, data: unknown) => void;

/**
 * Server-Sent Events response. `open` is called with a send function once the
 * stream starts and returns a cleanup that runs when the client disconnects.
 */
export function sseResponse(req: Request, open: (send: SseSend) => () => void): Response {
  const encoder = new TextEncoder();
  let cleanup = () => {};
  let ping: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  const stop = () => {
    if (closed) return;
    closed = true;
    clearInterval(ping);
    cleanup();
  };
  const stream = new ReadableStream({
    start(controller) {
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          stop();
        }
      };
      write("retry: 3000\n\n");
      cleanup = open((event, data) => write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      ping = setInterval(() => write(": ping\n\n"), 15_000);
      req.signal.addEventListener("abort", () => {
        stop();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel: stop,
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
