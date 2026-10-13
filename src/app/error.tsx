"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button, EmptyState, Panel } from "@/components/ui/primitives";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Panel className="mx-auto mt-10 max-w-lg">
      <EmptyState
        tone="error"
        icon={<AlertTriangle className="size-5" />}
        title="Something went wrong on this page"
        description="Your saved data is safe in this browser. Try again, or go back to Home."
        action={
          <Button size="sm" onClick={reset}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        }
      />
    </Panel>
  );
}
