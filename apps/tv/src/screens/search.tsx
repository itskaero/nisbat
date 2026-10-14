import { useMemo, useState } from "preact/hooks";
import { NAV_ITEMS } from "@/components/layout/nav";
import { CHANNELS } from "@/data/channels";
import { SURAHS } from "@/features/quran/quran-state";
import { usePersisted } from "@/lib/storage/persisted-store";
import { groceryStore, tasksStore } from "@/lib/storage/stores";
import { Card, ScreenHeader, Tile } from "../components/ui";
import { navigate, useRoute } from "../lib/router";

interface Hit {
  group: string;
  title: string;
  sub?: string;
  go: string;
}

/** Search the TV's own content. Type from a phone ("Type on TV"). */
export function SearchScreen() {
  const { query } = useRoute();
  const [q, setQ] = useState(query.get("q") ?? "");
  const tasks = usePersisted(tasksStore);
  const groceries = usePersisted(groceryStore);
  const hits = useMemo<Hit[]>(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    const ref = /^(\d{1,3})(?::(\d{1,3}))?$/.exec(n);
    const out: Hit[] = [];
    if (ref && Number(ref[1]) >= 1 && Number(ref[1]) <= 114) {
      const s = SURAHS[Number(ref[1]) - 1];
      out.push({ group: "Quran", title: `${s.englishName}${ref[2] ? ` ${ref[1]}:${ref[2]}` : ""}`, sub: s.englishNameTranslation, go: `/quran?s=${ref[1]}${ref[2] ? `&a=${ref[2]}` : ""}` });
    }
    for (const it of NAV_ITEMS) if (it.short.toLowerCase().includes(n)) out.push({ group: "Screens", title: it.short, go: it.href });
    for (const s of SURAHS)
      if (s.englishName.toLowerCase().includes(n) || s.englishNameTranslation.toLowerCase().includes(n) || s.name.includes(q.trim()))
        out.push({ group: "Quran", title: `${s.number}. ${s.englishName}`, sub: s.englishNameTranslation, go: `/quran?s=${s.number}` });
    for (const c of CHANNELS) if (c.stream && c.name.toLowerCase().includes(n)) out.push({ group: "Live TV", title: c.name, go: `/tv?ch=${c.id}` });
    for (const t of tasks) if (t.title.toLowerCase().includes(n)) out.push({ group: "Tasks", title: t.title, sub: t.completed ? "Done" : t.dueDate, go: "/tasks" });
    for (const g of groceries) if (g.name.toLowerCase().includes(n)) out.push({ group: "Saman", title: g.name, sub: g.purchased ? "Bought" : "To buy", go: "/saman" });
    return out.slice(0, 40);
  }, [q, tasks, groceries]);

  return (
    <>
      <ScreenHeader title="Search" sub="Use “Type on TV” in the phone app, or a keyboard." />
      <input
        type="search"
        data-autofocus
        value={q}
        onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)}
        placeholder="Surah, verse (2:255), channel, task, item…"
        aria-label="Search"
        class="card w-full px-6 py-4 text-2xl outline-none placeholder:text-ink-3"
      />
      <div class="mt-6 grid grid-cols-3 gap-4">
        {hits.map((h, i) => (
          <Tile key={`${h.group}-${h.title}-${i}`} class="p-5" onClick={() => navigate(h.go)}>
            <p class="text-sm uppercase tracking-wider text-ink-3">{h.group}</p>
            <p class="mt-1 text-xl font-medium">{h.title}</p>
            {h.sub && <p class="text-base text-ink-3">{h.sub}</p>}
          </Tile>
        ))}
      </div>
      {q.trim() && !hits.length && (
        <Card class="mt-6">
          <p class="text-xl text-ink-2">Nothing found for “{q}”.</p>
        </Card>
      )}
    </>
  );
}
