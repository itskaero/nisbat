import { fetchUpstream, jsonError } from "@/lib/api/http";
import type { Channel, ChannelCategory } from "@/types/domain";

export const revalidate = 21600;

const PLAYLIST = "https://iptv-org.github.io/iptv/countries/pk.m3u";

const GROUP_MAP: Record<string, ChannelCategory> = {
  News: "news",
  Entertainment: "entertainment",
  Religious: "islamic",
  Education: "educational",
  Kids: "kids",
  Culture: "regional",
  General: "other",
  Music: "entertainment",
  Movies: "entertainment",
  Cooking: "entertainment",
  Travel: "other",
  Family: "entertainment",
};

/**
 * Opt-in community directory from the iptv-org project
 * (https://github.com/iptv-org/iptv). iptv-org only indexes links it found
 * publicly; it does not host streams or vouch for their licensing. We further
 * drop anything that is not HTTPS, carries auth tokens/tickets, or is a sports
 * channel (sports rights are licensed per event).
 */
export async function GET() {
  try {
    const res = await fetchUpstream(PLAYLIST, { revalidate: 21600 });
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    const channels: Channel[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith("#EXTINF")) continue;
      let url = "";
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j] && !lines[j].startsWith("#")) {
          url = lines[j].trim();
          break;
        }
      }
      const name = (line.split(",").pop() ?? "").replace(/\s*\(\d+p\)/, "").replace(/\s*\[.*?\]/g, "").trim();
      const id = /tvg-id="([^"]*)"/.exec(line)?.[1] ?? name;
      const groups = (/group-title="([^"]*)"/.exec(line)?.[1] ?? "").split(";");
      const needsReferrer = /http-referrer|EXTVLCOPT/.test(line) || lines[i + 1]?.startsWith("#EXTVLCOPT");
      if (!url.startsWith("https://")) continue;
      if (/[?&](token|ticket|auth|key)=/i.test(url) || /jazzauth|streamtest/i.test(url)) continue;
      if (needsReferrer) continue;
      if (groups.includes("Sports")) continue;
      const cid = "community-" + id.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (seen.has(cid)) continue;
      seen.add(cid);
      channels.push({
        id: cid,
        name,
        category: GROUP_MAP[groups[0]] ?? "other",
        country: "PK",
        stream: { url, type: "hls", provenance: "community", source: "iptv-org community playlist (unverified)" },
      });
    }
    return Response.json({ channels, source: PLAYLIST, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return jsonError(`Community playlist unavailable: ${(err as Error).message}`);
  }
}
