/* Chromecast (Chrome 90) lacks a few newer built-ins used by shared code. */

if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, "at", {
    value(this: unknown[], n: number) {
      const i = Math.trunc(n) || 0;
      return this[i < 0 ? this.length + i : i];
    },
    writable: true,
    configurable: true,
  });
}
if (!String.prototype.at) {
  Object.defineProperty(String.prototype, "at", {
    value(this: string, n: number) {
      const i = Math.trunc(n) || 0;
      return this.charAt(i < 0 ? this.length + i : i) || undefined;
    },
    writable: true,
    configurable: true,
  });
}
if (!Object.hasOwn) {
  Object.defineProperty(Object, "hasOwn", {
    value: (o: object, k: PropertyKey) => Object.prototype.hasOwnProperty.call(o, k),
    writable: true,
    configurable: true,
  });
}
if (!Array.prototype.findLast) {
  Object.defineProperty(Array.prototype, "findLast", {
    value(this: unknown[], fn: (v: unknown, i: number, a: unknown[]) => boolean) {
      for (let i = this.length - 1; i >= 0; i--) if (fn(this[i], i, this)) return this[i];
      return undefined;
    },
    writable: true,
    configurable: true,
  });
}
if (typeof globalThis.structuredClone !== "function") {
  (globalThis as { structuredClone?: <T>(v: T) => T }).structuredClone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
}
