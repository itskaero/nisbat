"use client";

import { settingsStore } from "@/lib/storage/stores";
import { usePersisted } from "@/lib/storage/persisted-store";

/**
 * Interface strings. Urdu covers navigation, headings, greetings and the most
 * common actions; content from external sources keeps its own language.
 */
const en = {
  "nav.home": "Home",
  "nav.quran": "Tadabur Quran",
  "nav.news": "Ajj ka Haal",
  "nav.saman": "Saman",
  "nav.tasks": "Tasks",
  "nav.tv": "Live TV",
  "nav.namaz": "Namaz",
  "nav.azkar": "Azkar & Hadith",
  "nav.sunein": "Sunein",
  "nav.pakistan": "Pakistan",
  "nav.mausam": "Mausam",
  "nav.bazaar": "Bazaar",
  "nav.more": "More",
  "nav.settings": "Settings",
  "nav.collapse": "Collapse sidebar",
  "nav.expand": "Expand sidebar",
  "greet.morning": "Good Morning",
  "greet.afternoon": "Good Afternoon",
  "greet.evening": "Good Evening",
  "greet.night": "Assalamu Alaikum",
  "greet.urdu": "آج کا دن کیسا رہا؟",
  "search.placeholder": "Search anything…",
  "action.addItem": "Add Item",
  "action.addTask": "Add Task",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.delete": "Delete",
  "action.edit": "Edit",
  "action.retry": "Try again",
  "action.refresh": "Refresh",
  "action.viewAll": "View all",
  "home.quickActions": "Quick actions",
  "home.recent": "Recent activity",
  "home.today": "Today",
  "home.prayer": "Prayer Times",
  "module.quran.sub": "Continue your journey",
  "module.news.sub": "Stay informed",
  "module.saman.sub": "Manage your groceries",
  "module.tasks.sub": "Plan your day",
  "module.tv.sub": "Watch live channels",
  "tasks.today": "Today",
  "tasks.upcoming": "Upcoming",
  "tasks.completed": "Completed",
  "tasks.all": "All",
  "notifications": "Notifications",
};

type Key = keyof typeof en;

const ur: Partial<Record<Key, string>> = {
  "nav.home": "ہوم",
  "nav.quran": "تدبرِ قرآن",
  "nav.news": "آج کا حال",
  "nav.saman": "سامان",
  "nav.tasks": "کام",
  "nav.tv": "لائیو ٹی وی",
  "nav.namaz": "نماز",
  "nav.azkar": "اذکار و حدیث",
  "nav.sunein": "سنیں",
  "nav.pakistan": "پاکستان",
  "nav.mausam": "موسم",
  "nav.bazaar": "بازار",
  "nav.more": "مزید",
  "nav.settings": "ترتیبات",
  "nav.collapse": "سائیڈبار بند کریں",
  "nav.expand": "سائیڈبار کھولیں",
  "greet.morning": "صبح بخیر",
  "greet.afternoon": "سہ پہر بخیر",
  "greet.evening": "شام بخیر",
  "greet.night": "السلام علیکم",
  "search.placeholder": "کچھ بھی تلاش کریں…",
  "action.addItem": "سامان شامل کریں",
  "action.addTask": "کام شامل کریں",
  "action.save": "محفوظ کریں",
  "action.cancel": "منسوخ",
  "action.delete": "حذف کریں",
  "action.edit": "ترمیم",
  "action.retry": "دوبارہ کوشش کریں",
  "action.refresh": "تازہ کریں",
  "action.viewAll": "سب دیکھیں",
  "home.quickActions": "فوری اقدامات",
  "home.recent": "حالیہ سرگرمی",
  "home.today": "آج",
  "home.prayer": "اوقاتِ نماز",
  "module.quran.sub": "اپنا سفر جاری رکھیں",
  "module.news.sub": "باخبر رہیں",
  "module.saman.sub": "اپنا سودا سلف سنبھالیں",
  "module.tasks.sub": "اپنے دن کی منصوبہ بندی کریں",
  "module.tv.sub": "لائیو چینلز دیکھیں",
  "tasks.today": "آج",
  "tasks.upcoming": "آنے والے",
  "tasks.completed": "مکمل",
  "tasks.all": "سب",
  notifications: "اطلاعات",
};

export type TranslationKey = Key;

export function useT() {
  const { language } = usePersisted(settingsStore);
  return (key: Key) => (language === "ur" ? (ur[key] ?? en[key]) : en[key]);
}

export function useLanguage() {
  return usePersisted(settingsStore).language;
}
