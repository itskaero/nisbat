"use client";

import { useMemo } from "react";
import { nearestSpiCity, SPI_CITY_SLUGS } from "@/data/spi-cities";
import { SPI_MAP } from "@/data/spi-map";
import { useFetch } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";

export interface PbsItem {
  no: number;
  name: string;
  unit: string;
  min: number | null;
  avg: number | null;
  max: number | null;
  prevAvg: number | null;
}
export interface PbsPrices {
  week: string;
  prevWeek: string | null;
  city: string;
  cityName: string;
  source: string;
  sourceUrl: string;
  fileUrl: string;
  stale: string | null;
  items: PbsItem[];
}
export interface ProductPrice {
  price: number;
  min: number | null;
  max: number | null;
  /** Percent change of the average vs the previous week. */
  change: number | null;
  note?: string;
  label: string;
}

export const fmtWeek = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const pctChange = (now: number | null, prev: number | null) => (now && prev ? ((now - prev) / prev) * 100 : null);

const round = (n: number) => (n >= 100 ? Math.round(n) : Math.round(n * 100) / 100);

/** The city whose PBS prices this household follows. */
export function usePriceCity(override?: string) {
  const { priceCity, location } = usePersisted(settingsStore);
  const chosen = override ?? priceCity;
  return chosen !== "auto" && SPI_CITY_SLUGS.has(chosen) ? chosen : nearestSpiCity(location);
}

/** This week's PBS SPI prices for the household's city, plus a per-product lookup for Saman. */
export function usePbsPrices(cityOverride?: string, enabled = true) {
  const city = usePriceCity(cityOverride);
  const res = useFetch<PbsPrices>(enabled ? `/api/prices?city=${city}` : null);
  const data = res.data;
  const forProduct = useMemo(() => {
    const byNo = new Map(data?.items.map((i) => [i.no, i]));
    return (productId: string | undefined): ProductPrice | null => {
      const link = productId ? SPI_MAP[productId] : undefined;
      const it = link && byNo.get(link.no);
      if (!data || !link || !it?.avg) return null;
      return {
        price: round(it.avg * link.factor),
        min: it.min != null ? round(it.min * link.factor) : null,
        max: it.max != null ? round(it.max * link.factor) : null,
        change: pctChange(it.avg, it.prevAvg),
        note: link.note,
        label: `PBS avg · ${data.cityName} · week ending ${fmtWeek(data.week)}`,
      };
    };
  }, [data]);
  return { ...res, city, forProduct };
}
