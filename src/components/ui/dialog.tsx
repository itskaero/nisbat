"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button, IconButton, cn } from "./primitives";

/**
 * Accessible modal built on the native <dialog> element: the browser provides
 * the top layer, inert background, focus containment and Escape handling. We
 * add focus restoration to the triggering element and a full-screen sheet
 * layout on small screens.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  initialFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      el.showModal();
      requestAnimationFrame(() => initialFocusRef?.current?.focus());
    } else if (!open && el.open) {
      el.close();
    }
  }, [open, initialFocusRef]);

  // Restore focus when the dialog closes for any reason.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => {
      const target = returnFocus.current;
      if (target && document.contains(target)) target.focus();
    };
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, []);

  const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

  return (
    <dialog
      ref={ref}
      className="nb-dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Backdrop click closes (the dialog element itself is the backdrop area).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div
          className={cn(
            "nb-dialog-panel glass flex max-h-[100dvh] w-full flex-col overflow-hidden !rounded-b-none sm:max-h-[min(88dvh,860px)] sm:!rounded-[var(--radius-lg)]",
            "bg-[rgba(14,22,35,0.96)]",
            widths[size],
            size !== "sm" && "h-[100dvh] sm:h-auto",
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-xs text-ink-2">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close dialog" size="sm" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/8 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-ink-2">{description}</div>
    </Dialog>
  );
}
