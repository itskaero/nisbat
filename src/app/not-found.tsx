import { Compass } from "lucide-react";
import { ButtonLink, EmptyState, Panel } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Panel className="mx-auto mt-10 max-w-lg">
      <EmptyState
        icon={<Compass className="size-5" />}
        title="Page not found"
        description="That page doesn't exist in Nisbat Home."
        action={
          <ButtonLink href="/" variant="primary" size="sm">
            Go home
          </ButtonLink>
        }
      />
    </Panel>
  );
}
