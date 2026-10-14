// Shared server helpers are type-checked here too; Next adds `next` to fetch options.
declare global {
  interface RequestInit {
    next?: { revalidate?: number | false; tags?: string[] };
  }
}
export {};
