"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

export function ReturnForCorrectionDialog({ dischargeId }: { dischargeId: string }) {
  const [note, setNote] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const returnForCorrection = useAppStore((s) => s.returnForCorrection);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="size-3.5" />
          Return for Correction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return for correction</DialogTitle>
          <DialogDescription>
            The discharge will move back to Draft so the PGR/MO can revise it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="return-note" recommended>
            Note for the preparer
          </Label>
          <Textarea
            id="return-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Please add discharge medication instructions in Urdu."
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="danger"
            onClick={() => {
              returnForCorrection(dischargeId, note || undefined);
              toast.info("Returned for correction", { description: "Status set back to Draft." });
              setOpen(false);
              setNote("");
            }}
          >
            Return for Correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
