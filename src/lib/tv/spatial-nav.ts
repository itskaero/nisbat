"use client";

/**
 * Spatial (D-pad) navigation for TV remotes.
 *
 * Arrow keys move focus to the nearest focusable element in that direction,
 * scoped to the top-most open <dialog>. Text fields keep left/right for the
 * caret until the caret reaches an edge; selects and ranges keep their own
 * keys only where that doesn't trap the user.
 */

export type Direction = "up" | "down" | "left" | "right";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), video[controls]';

function isVisible(el: HTMLElement): boolean {
  if (el.closest("[inert], [aria-hidden='true'], [data-spatial-skip]")) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const style = getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0.05;
}

function scope(): ParentNode {
  const dialogs = [...document.querySelectorAll<HTMLDialogElement>("dialog[open]")];
  return dialogs.at(-1) ?? document;
}

export function focusables(): HTMLElement[] {
  return [...scope().querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isVisible);
}

function center(r: DOMRect) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Pick the best candidate in a direction: close along the axis, aligned across it. */
/** Is `r` beyond `from` in `dir`? Strict uses edges (small overlap allowed); loose uses centres. */
function inDirection(from: DOMRect, r: DOMRect, dir: Direction, strict: boolean) {
  const t = 8;
  if (strict) {
    if (dir === "right") return r.left >= from.right - t;
    if (dir === "left") return r.right <= from.left + t;
    if (dir === "down") return r.top >= from.bottom - t;
    return r.bottom <= from.top + t;
  }
  const a = center(from);
  const b = center(r);
  if (dir === "right") return b.x - a.x > 1;
  if (dir === "left") return a.x - b.x > 1;
  if (dir === "down") return b.y - a.y > 1;
  return a.y - b.y > 1;
}

function best(from: DOMRect, dir: Direction, candidates: HTMLElement[], current: Element | null): HTMLElement | null {
  return pick(from, dir, candidates, current, true) ?? pick(from, dir, candidates, current, false);
}

function pick(from: DOMRect, dir: Direction, candidates: HTMLElement[], current: Element | null, strict: boolean): HTMLElement | null {
  const c0 = center(from);
  let winner: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of candidates) {
    if (el === current || el.contains(current)) continue;
    const r = el.getBoundingClientRect();
    if (!inDirection(from, r, dir, strict)) continue;
    const c = center(r);
    let primary: number;
    let cross: number;
    let overlap: number;
    if (dir === "right" || dir === "left") {
      primary = dir === "right" ? r.left - from.right : from.left - r.right;
      cross = Math.abs(c.y - c0.y);
      overlap = Math.max(0, Math.min(r.bottom, from.bottom) - Math.max(r.top, from.top));
    } else {
      primary = dir === "down" ? r.top - from.bottom : from.top - r.bottom;
      cross = Math.abs(c.x - c0.x);
      overlap = Math.max(0, Math.min(r.right, from.right) - Math.max(r.left, from.left));
    }
    const score = Math.max(primary, 0) + cross * (overlap > 0 ? 0.3 : 2) - (overlap > 0 ? 40 : 0);
    if (score < bestScore) {
      bestScore = score;
      winner = el;
    }
  }
  return winner;
}

function reduceMotion() {
  return document.documentElement.dataset.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function focusElement(el: HTMLElement) {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
}

/** Move focus; returns false when nothing lies in that direction. */
export function moveFocus(dir: Direction): boolean {
  const list = focusables();
  if (!list.length) return false;
  const active = document.activeElement as HTMLElement | null;
  const inScope = active && list.includes(active);
  if (!inScope) {
    // Start from the first control inside the main content, else the current nav item.
    const main = list.find((el) => el.closest("main")) ?? list.find((el) => el.getAttribute("aria-current") === "page") ?? list[0];
    focusElement(main);
    return true;
  }
  const target = best(active.getBoundingClientRect(), dir, list, active);
  if (target) {
    focusElement(target);
    return true;
  }
  // Nothing further that way: scroll so off-screen content can come into view.
  const amount = window.innerHeight * 0.6;
  if (dir === "down" || dir === "up") window.scrollBy({ top: dir === "down" ? amount : -amount, behavior: reduceMotion() ? "auto" : "smooth" });
  return false;
}

function caretAtEdge(el: HTMLInputElement | HTMLTextAreaElement, dir: Direction) {
  try {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const len = el.value.length;
    const rtl = getComputedStyle(el).direction === "rtl";
    const towardsStart = (dir === "left") !== rtl;
    if (dir === "left" || dir === "right") return towardsStart ? start === 0 && end === 0 : start === len;
    if (el instanceof HTMLTextAreaElement) return dir === "up" ? !el.value.slice(0, start).includes("\n") : !el.value.slice(end).includes("\n");
    return true;
  } catch {
    // Inputs like type=number/date don't expose a caret.
    return dir === "up" || dir === "down";
  }
}

const KEY_DIR: Record<string, Direction> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

/** Keys TV platforms use for "Back". */
export function isBackKey(e: KeyboardEvent) {
  return e.key === "GoBack" || e.key === "BrowserBack" || e.keyCode === 461 || e.keyCode === 10009 || (e.key === "Backspace" && !isTextField(e.target));
}

function isTextField(t: EventTarget | null): t is HTMLInputElement | HTMLTextAreaElement {
  if (t instanceof HTMLTextAreaElement) return true;
  return t instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit", "range", "color", "file"].includes(t.type);
}

/** Decide whether an arrow key should move focus (true) or stay with the control. */
export function shouldNavigate(e: KeyboardEvent): Direction | null {
  const dir = KEY_DIR[e.key];
  if (!dir || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return null;
  const t = e.target;
  if (isTextField(t)) return caretAtEdge(t, dir) ? dir : null;
  if (t instanceof HTMLInputElement && t.type === "range") return dir === "up" || dir === "down" ? dir : null;
  // Radiogroups/tablists we render handle their own arrows only within the group,
  // so let spatial nav take over for clarity on TV.
  return dir;
}
