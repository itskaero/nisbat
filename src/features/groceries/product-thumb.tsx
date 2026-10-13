import {
  Apple,
  Baby,
  Bath,
  Bean,
  Carrot,
  Coffee,
  Cookie,
  Croissant,
  Drumstick,
  Droplet,
  Milk,
  Package,
  Snowflake,
  SprayCan,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui/primitives";
import imageData from "@/data/grocery-images.json";
import type { GroceryCategoryId, ProductImage } from "@/types/groceries";

const IMAGES = imageData as Record<string, ProductImage>;

export function productImage(productId?: string): ProductImage | undefined {
  return productId ? IMAGES[productId] : undefined;
}

export function allProductImages(): [string, ProductImage][] {
  return Object.entries(IMAGES);
}

export const CATEGORY_ART: Record<GroceryCategoryId, { icon: LucideIcon; from: string; to: string; fg: string }> = {
  grains: { icon: Wheat, from: "#3b2f1c", to: "#5a4524", fg: "#f2cf8a" },
  pulses: { icon: Bean, from: "#3a2a1f", to: "#5b3b26", fg: "#f0b483" },
  essentials: { icon: Droplet, from: "#3a3417", to: "#5a5020", fg: "#f0dc7a" },
  vegetables: { icon: Carrot, from: "#173426", to: "#1f4d33", fg: "#8fe3b0" },
  fruits: { icon: Apple, from: "#3a1b20", to: "#5a252c", fg: "#f6a0a6" },
  dairy: { icon: Milk, from: "#1d2a3a", to: "#2a3e56", fg: "#cfe3ff" },
  meat: { icon: Drumstick, from: "#3b1f1a", to: "#5c2c22", fg: "#f6a68a" },
  bakery: { icon: Croissant, from: "#3b2c1a", to: "#5e4524", fg: "#f6c98a" },
  beverages: { icon: Coffee, from: "#2b2119", to: "#45342a", fg: "#e3b892" },
  household: { icon: SprayCan, from: "#18303a", to: "#1f4656", fg: "#8fd7f0" },
  personal: { icon: Bath, from: "#2a2140", to: "#3c2f5c", fg: "#cbb8ff" },
  baby: { icon: Baby, from: "#3a2234", to: "#56314c", fg: "#f5b6dd" },
  snacks: { icon: Cookie, from: "#3a2a17", to: "#5a3f1f", fg: "#f3c27c" },
  frozen: { icon: Snowflake, from: "#17303d", to: "#1f4a5e", fg: "#a8e6ff" },
  other: { icon: Package, from: "#222b38", to: "#2f3b4c", fg: "#c3cedc" },
};

/**
 * Product visual. Uses a reviewed, openly licensed photo when we have one;
 * otherwise a category illustration (never an unrelated photo).
 */
export function ProductThumb({
  productId,
  category,
  name,
  className,
  iconClassName,
}: {
  productId?: string;
  category: GroceryCategoryId;
  name: string;
  className?: string;
  iconClassName?: string;
}) {
  const img = productImage(productId);
  if (img) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img.src}
        alt={name}
        loading="lazy"
        decoding="async"
        width={360}
        height={360}
        className={cn("aspect-square w-full object-cover", className)}
      />
    );
  }
  const art = CATEGORY_ART[category] ?? CATEGORY_ART.other;
  const Icon = art.icon;
  return (
    <div
      role="img"
      aria-label={`${name} (category illustration)`}
      className={cn("grid aspect-square w-full place-items-center", className)}
      style={{ background: `radial-gradient(circle at 30% 25%, ${art.to}, ${art.from})` }}
    >
      <Icon className={cn("size-1/3", iconClassName)} style={{ color: art.fg }} strokeWidth={1.5} aria-hidden />
    </div>
  );
}
