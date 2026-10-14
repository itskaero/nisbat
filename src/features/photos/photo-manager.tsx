"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Button, IconButton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useFetch } from "@/lib/hooks";
import { uploadPhotos } from "./upload";

interface Photo {
  id: string;
  url: string;
  uploadedAt: string;
}

export function usePhotos() {
  const res = useFetch<{ photos: Photo[] }>("/api/photos");
  const { reload } = res;
  useEffect(() => {
    window.addEventListener("nisbat:photos-changed", reload);
    return () => window.removeEventListener("nisbat:photos-changed", reload);
  }, [reload]);
  return res;
}

export function PhotoUploadButton({ label = "Add photos", className }: { label?: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [progress, setProgress] = useState<[number, number] | null>(null);
  return (
    <>
      <Button variant="primary" className={className} disabled={!!progress} onClick={() => input.current?.click()}>
        {progress ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {progress ? `Uploading ${progress[0]}/${progress[1]}…` : label}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = e.target.files;
          if (!files?.length) return;
          setProgress([0, files.length]);
          const res = await uploadPhotos(files, (d, t) => setProgress([d, t]));
          setProgress(null);
          e.target.value = "";
          if (res.errors.length) toast(`${res.uploaded} added; ${res.errors.length} failed: ${res.errors[0]}`, { tone: "error" });
          else toast(`${res.uploaded} photo${res.uploaded === 1 ? "" : "s"} added to the family frame`);
        }}
      />
    </>
  );
}

/** Grid of family photos with delete; used in Settings. */
export function PhotoManager() {
  const { data, error } = usePhotos();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<Photo | null>(null);
  const photos = data?.photos ?? [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <PhotoUploadButton />
        <p className="text-xs text-ink-3">{error ? "Photo storage is unavailable." : `${photos.length} photo${photos.length === 1 ? "" : "s"} · stored on your Nisbat server, shown on the TV ambient screen.`}</p>
      </div>
      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((p) => (
            <li key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="Family photo" loading="lazy" className="h-full w-full object-cover" />
              <IconButton label="Delete photo" size="sm" className="absolute end-1 top-1 bg-black/50 !text-white hover:!text-coral" onClick={() => setConfirm(p)}>
                <Trash2 className="size-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete this photo?"
        description="It will be removed from the family frame on every screen."
        onConfirm={async () => {
          if (!confirm) return;
          const r = await fetch(`/api/photos/${confirm.id}`, { method: "DELETE" });
          window.dispatchEvent(new Event("nisbat:photos-changed"));
          toast(r.ok ? "Photo deleted" : "Couldn't delete the photo", { tone: r.ok ? "info" : "error" });
        }}
      />
    </div>
  );
}
