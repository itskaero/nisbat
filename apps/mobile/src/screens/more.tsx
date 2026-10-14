import { Banknote, CloudSun, Flag, Gamepad2, Headphones, Newspaper, Settings, Sparkles, SquareCheckBig, Tv } from "lucide-react";
import { Page } from "../components/ui";
import { useConnection } from "../lib/conn";
import { tap } from "../lib/native";
import { push } from "../lib/nav";

const ITEMS = [
  { page: "remote", label: "TV remote", ur: "ریموٹ", icon: Gamepad2 },
  { page: "tasks", label: "Tasks", ur: "کام", icon: SquareCheckBig },
  { page: "azkar", label: "Azkar & tasbeeh", ur: "اذکار", icon: Sparkles },
  { page: "sunein", label: "Sunein", ur: "سنیں", icon: Headphones },
  { page: "news", label: "Ajj ka Haal", ur: "خبریں", icon: Newspaper },
  { page: "mausam", label: "Mausam & smog", ur: "موسم", icon: CloudSun },
  { page: "bazaar", label: "Bazaar", ur: "بازار", icon: Banknote },
  { page: "pakistan", label: "Tareekh & Kalam", ur: "پاکستان", icon: Flag },
  { page: "livetv", label: "Live TV", ur: "ٹی وی", icon: Tv },
  { page: "settings", label: "Settings", ur: "ترتیبات", icon: Settings },
];

export function MoreScreen() {
  const conn = useConnection();
  return (
    <Page title="More">
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.page}
              type="button"
              className="glass press flex flex-col items-start gap-3 p-4 text-start"
              onClick={() => {
                void tap();
                push({ name: it.page });
              }}
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald/15 text-emerald">
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-medium">{it.label}</span>
                <span lang="ur" className="font-urdu block text-xs text-ink-3">
                  {it.ur}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {conn && (
        <p className="mt-6 text-center text-xs text-ink-3">
          Connected to {conn.serverName} · {conn.base.replace(/^http:\/\//, "")} as {conn.phoneName}
        </p>
      )}
    </Page>
  );
}
