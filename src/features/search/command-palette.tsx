"use client";

import { BookOpen, CornerDownLeft, FileText, Loader2, Newspaper, Plus, Search, ShoppingCart, SquareCheckBig, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { NAV_ITEMS, SETTINGS_ITEM } from "@/components/layout/nav";
import { cn } from "@/components/ui/primitives";
import { GROCERY_CATALOG } from "@/data/grocery-catalog";
import quranMeta from "@/data/quran-meta.json";
import { useGroceryDialog } from "@/features/groceries/add-item-dialog";
import type { SearchMatch } from "@/features/quran/editions";
import { useTaskDialog } from "@/features/tasks/task-dialog";
import { useDebounced } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { usePersisted } from "@/lib/storage/persisted-store";
import { groceryStore, newsStore, settingsStore, tasksStore } from "@/lib/storage/stores";

interface Ctx {
  open: (query?: string) => void;
}
const PaletteContext = createContext<Ctx | null>(null);

export function useCommandPalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState({ query: "", key: 0 });
  const openFn = useCallback((query?: string) => {
    setInitial((i) => ({ query: query ?? "", key: i.key + 1 }));
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ open: openFn }), [openFn]);
  return (
    <PaletteContext.Provider value={value}>
      {children}
      {open && <Palette key={initial.key} initialQuery={initial.query} onClose={() => setOpen(false)} />}
    </PaletteContext.Provider>
  );
}

interface Result {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  dir?: "rtl";
  run: () => void;
}

const norm = (s: string) => s.toLowerCase().replace(/[-'’ʿ`\s]+/g, "");

function Palette({ onClose, initialQuery = "" }: { onClose: () => void; initialQuery?: string }) {
  const t = useT();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [q, setQ] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const debounced = useDebounced(q.trim(), 300);
  const tasks = usePersisted(tasksStore);
  const groceries = usePersisted(groceryStore);
  const news = usePersisted(newsStore);
  const { quranTranslation } = usePersisted(settingsStore);
  const { openAddItem } = useGroceryDialog();
  const { openTask } = useTaskDialog();
  const [verseState, setVerseState] = useState<{ q: string; matches: SearchMatch[]; error?: string; loading: boolean }>({ q: "", matches: [], loading: false });

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    el.showModal();
    inputRef.current?.focus();
    return () => {
      if (prev && document.contains(prev)) prev.focus();
    };
  }, []);

  // Translation search goes to the Quran API (via our server route) only when there's a real query.
  const verseQuery = debounced.length >= 3 && !/^\d/.test(debounced) ? debounced : "";
  useEffect(() => {
    if (!verseQuery) return;
    const ctrl = new AbortController();
    const edition = quranTranslation.startsWith("en.") ? quranTranslation : "en.sahih";
    setVerseState({ q: verseQuery, matches: [], loading: true });
    fetch(`/api/quran/search?q=${encodeURIComponent(verseQuery)}&edition=${edition}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Search failed");
        setVerseState({ q: verseQuery, matches: body.matches.slice(0, 6), loading: false });
      })
      .catch((e: Error) => e.name !== "AbortError" && setVerseState({ q: verseQuery, matches: [], loading: false, error: "Verse search is unavailable right now." }));
    return () => ctrl.abort();
  }, [verseQuery, quranTranslation]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const results = useMemo<Result[]>(() => {
    const needle = q.trim().toLowerCase();
    const out: Result[] = [];
    const pages = [...NAV_ITEMS, SETTINGS_ITEM].map((n) => ({ href: n.href, label: t(n.key), Icon: n.icon }));
    const actions: Result[] = [
      { id: "act-grocery", group: "Actions", title: "Add grocery item", icon: <Plus className="size-4" />, run: () => (onClose(), openAddItem()) },
      { id: "act-task", group: "Actions", title: "Create task", icon: <Plus className="size-4" />, run: () => (onClose(), openTask()) },
    ];

    if (!needle) {
      out.push(...pages.map((p) => ({ id: `page-${p.href}`, group: "Go to", title: p.label, icon: <p.Icon className="size-4" />, run: () => go(p.href) })));
      out.push(...actions);
      return out;
    }

    for (const p of pages) if (p.label.toLowerCase().includes(needle)) out.push({ id: `page-${p.href}`, group: "Go to", title: p.label, icon: <p.Icon className="size-4" />, run: () => go(p.href) });
    for (const a of actions) if (a.title.toLowerCase().includes(needle)) out.push(a);

    const ref = /^(\d{1,3})(?::(\d{1,3}))?$/.exec(needle);
    if (ref) {
      const s = quranMeta.surahs[Number(ref[1]) - 1];
      const ayah = ref[2] ? Number(ref[2]) : undefined;
      if (s && (!ayah || (ayah >= 1 && ayah <= s.numberOfAyahs))) {
        out.push({
          id: `ref-${needle}`,
          group: "Quran",
          title: ayah ? `${s.englishName} ${s.number}:${ayah}` : `Surah ${s.englishName}`,
          subtitle: s.englishNameTranslation,
          icon: <BookOpen className="size-4" />,
          run: () => go(`/quran?s=${s.number}${ayah ? `&a=${ayah}` : ""}`),
        });
      }
    } else {
      const nn = norm(needle);
      quranMeta.surahs
        .filter((s) => norm(s.englishName).includes(nn) || s.englishNameTranslation.toLowerCase().includes(needle) || s.name.includes(q.trim()))
        .slice(0, 5)
        .forEach((s) =>
          out.push({
            id: `surah-${s.number}`,
            group: "Quran",
            title: `${s.number}. ${s.englishName}`,
            subtitle: `${s.englishNameTranslation} · ${s.numberOfAyahs} verses`,
            icon: <BookOpen className="size-4" />,
            run: () => go(`/quran?s=${s.number}`),
          }),
        );
    }

    if (verseState.q === verseQuery && verseQuery) {
      verseState.matches.forEach((m) =>
        out.push({
          id: `verse-${m.surah}-${m.ayah}`,
          group: "Quran translation",
          title: m.text.length > 120 ? m.text.slice(0, 120) + "…" : m.text,
          subtitle: `${m.surahName} ${m.surah}:${m.ayah}`,
          icon: <FileText className="size-4" />,
          run: () => go(`/quran?s=${m.surah}&a=${m.ayah}`),
        }),
      );
    }

    news.saved
      .filter((a) => a.title.toLowerCase().includes(needle) || a.excerpt.toLowerCase().includes(needle))
      .slice(0, 5)
      .forEach((a) =>
        out.push({
          id: `news-${a.id}`,
          group: "Saved news",
          title: a.title,
          subtitle: a.source,
          dir: a.lang === "ur" ? "rtl" : undefined,
          icon: <Newspaper className="size-4" />,
          run: () => go(`/news?saved=1&article=${a.id}`),
        }),
      );

    groceries
      .filter((g) => g.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .forEach((g) =>
        out.push({
          id: `g-${g.id}`,
          group: "Groceries",
          title: g.name,
          subtitle: g.purchased ? "On your list · bought" : "On your list",
          icon: <ShoppingCart className="size-4" />,
          run: () => go("/saman"),
        }),
      );
    GROCERY_CATALOG.filter((p) => p.name.toLowerCase().includes(needle) || p.nameUr?.includes(q.trim()))
      .slice(0, 4)
      .forEach((p) =>
        out.push({
          id: `cat-${p.id}`,
          group: "Groceries",
          title: `Add ${p.name}`,
          subtitle: "From catalog",
          icon: <Plus className="size-4" />,
          run: () => (onClose(), openAddItem(p.id)),
        }),
      );

    tasks
      .filter((x) => x.title.toLowerCase().includes(needle) || x.tag?.toLowerCase().includes(needle))
      .slice(0, 5)
      .forEach((x) =>
        out.push({
          id: `task-${x.id}`,
          group: "Tasks",
          title: x.title,
          subtitle: x.completed ? "Completed" : x.dueDate ? `Due ${x.dueDate}` : "No due date",
          icon: <SquareCheckBig className="size-4" />,
          run: () => (onClose(), openTask({ taskId: x.id })),
        }),
      );
    return out;
  }, [q, t, verseState, verseQuery, news.saved, groceries, tasks, go, onClose, openAddItem, openTask]);

  const activeIdx = Math.min(active, Math.max(0, results.length - 1));
  const groups = results.reduce<Record<string, Result[]>>((acc, r) => ((acc[r.group] ??= []).push(r), acc), {});
  const verseLoading = verseQuery && (verseState.loading || verseState.q !== verseQuery);

  return (
    <dialog
      ref={dialogRef}
      className="nb-dialog"
      aria-label="Search"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 flex justify-center p-0 sm:items-start sm:p-6 sm:pt-[12vh]" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="nb-dialog-panel glass flex h-[100dvh] w-full flex-col overflow-hidden !bg-[rgba(14,22,35,0.97)] sm:h-auto sm:max-h-[70vh] sm:max-w-2xl sm:!rounded-[var(--radius-lg)] max-sm:!rounded-none">
          <div className="flex items-center gap-3 border-b border-white/8 px-4">
            <Search className="size-5 shrink-0 text-ink-3" aria-hidden />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  results[activeIdx]?.run();
                }
              }}
              placeholder="Search surahs, verses (e.g. 2:255), tasks, groceries, saved news…"
              className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-none"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={results[activeIdx] ? `${listId}-${results[activeIdx].id}` : undefined}
              aria-label="Search Nisbat"
            />
            {verseLoading && <Loader2 className="size-4 animate-spin text-ink-3" aria-label="Searching verses" />}
            <button type="button" onClick={onClose} aria-label="Close search" className="rounded-lg p-1.5 text-ink-3 hover:bg-white/8 hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
          <div id={listId} role="listbox" aria-label="Search results" className="min-h-0 flex-1 overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-ink">{verseLoading ? "Searching…" : `No results for “${q}”`}</p>
                <p className="mt-1 text-xs text-ink-3">
                  Search covers surah names, Quran translation text, your tasks, groceries and saved news on this device.
                </p>
              </div>
            ) : (
              Object.entries(groups).map(([group, items]) => (
                <div key={group} role="group" aria-label={group} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{group}</p>
                  {items.map((r) => {
                    const idx = results.indexOf(r);
                    return (
                      <div
                        key={r.id}
                        id={`${listId}-${r.id}`}
                        role="option"
                        aria-selected={idx === activeIdx}
                        onMouseMove={() => setActive(idx)}
                        onClick={r.run}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                          idx === activeIdx ? "bg-white/8 text-ink" : "text-ink-2",
                        )}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/6 text-ink-2">{r.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span dir={r.dir} className="block truncate text-sm">
                            {r.title}
                          </span>
                          {r.subtitle && <span className="block truncate text-xs text-ink-3">{r.subtitle}</span>}
                        </span>
                        {idx === activeIdx && <CornerDownLeft className="size-4 shrink-0 text-ink-3 rtl:-scale-x-100" aria-hidden />}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            {verseState.error && verseQuery && <p className="px-3 py-2 text-xs text-coral">{verseState.error}</p>}
          </div>
          <div className="hidden items-center gap-4 border-t border-white/8 px-4 py-2 text-[11px] text-ink-3 sm:flex">
            <span>↑↓ to move</span>
            <span>Enter to open</span>
            <span>Esc to close</span>
            <span className="ms-auto">Quran search via AlQuran Cloud</span>
          </div>
        </div>
      </div>
    </dialog>
  );
}
