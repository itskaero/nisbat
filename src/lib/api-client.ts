import { toast } from "sonner";
import type {
  Patient,
  Admission,
  Discharge,
  Drug,
  Formulation,
  DoseRule,
  AdvicePack,
  FollowUpModule,
  InvestigationPanel,
  FrequencyPhrase,
  VocabularyList,
  InstitutionalSettings,
  AppUser,
} from "@/types";

export interface BootstrapData {
  patients: Patient[];
  admissions: Admission[];
  discharges: Discharge[];
  drugs: Drug[];
  formulations: Formulation[];
  doseRules: DoseRule[];
  advicePacks: AdvicePack[];
  followUpModules: FollowUpModule[];
  investigationPanels: InvestigationPanel[];
  frequencyPhrases: FrequencyPhrase[];
  vocabularyLists: VocabularyList[];
  institutionalSettings: InstitutionalSettings;
  users: AppUser[];
  /** the session's own identity — replaces the old client-persisted
   * "which demo user am I" choice with the real logged-in account. */
  currentUser: AppUser;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    // Cookies are same-origin by default, but explicit here since every
    // authenticated call (i.e. all of them, post-login) depends on it.
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `${path} failed with ${res.status}`, res.status);
  }
  return res.status === 204 ? null : res.json();
}

/** Every sync call goes through this — logs failures as a toast rather than
 * throwing into the caller, since these fire from inside store actions that
 * already applied the change optimistically to local state. A failed sync
 * means "this device is out of sync with the server," not "the edit failed." */
async function fireAndForget(path: string, init: RequestInit, label: string) {
  try {
    await request(path, init);
  } catch (err) {
    console.error(`[sync] ${label} failed:`, err);
    toast.error("Couldn't save to the server", {
      description: `${label} — this device may be out of sync until the connection recovers.`,
    });
  }
}

export const api = {
  bootstrap: (): Promise<BootstrapData> => request("/api/bootstrap"),

  login: (username: string, password: string): Promise<AppUser> =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: (): Promise<void> => request("/api/auth/logout", { method: "POST" }),
  createUser: (u: { name: string; username: string; password: string; role: string; designation: string }) =>
    request("/api/users", { method: "POST", body: JSON.stringify(u) }) as Promise<AppUser>,
  updateUser: (
    id: string,
    patch: Partial<{ name: string; designation: string; role: string; active: boolean; password: string }>,
  ) => request(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }) as Promise<AppUser>,

  createPatient: (p: Patient) => fireAndForget("/api/patients", { method: "POST", body: JSON.stringify(p) }, "Create patient"),

  syncAdmission: (a: Admission) =>
    fireAndForget(`/api/admissions/${a.id}`, { method: "PATCH", body: JSON.stringify(a) }, "Update admission"),

  createDischarge: (d: Discharge) =>
    fireAndForget("/api/discharges", { method: "POST", body: JSON.stringify(d) }, "Create discharge"),
  syncDischarge: (d: Discharge) =>
    fireAndForget(`/api/discharges/${d.id}`, { method: "PATCH", body: JSON.stringify(d) }, "Save discharge"),

  createDrug: (d: Drug) => fireAndForget("/api/drugs", { method: "POST", body: JSON.stringify(d) }, "Create drug"),
  createFormulation: (f: Formulation) =>
    fireAndForget("/api/formulations", { method: "POST", body: JSON.stringify(f) }, "Create formulation"),

  createDoseRule: (r: DoseRule) =>
    fireAndForget("/api/dose-rules", { method: "POST", body: JSON.stringify(r) }, "Create dose rule"),
  syncDoseRule: (r: DoseRule) =>
    fireAndForget(`/api/dose-rules/${r.id}`, { method: "PATCH", body: JSON.stringify(r) }, "Update dose rule"),

  createAdvicePack: (p: AdvicePack) =>
    fireAndForget("/api/advice-packs", { method: "POST", body: JSON.stringify(p) }, "Create advice pack"),
  syncAdvicePack: (p: AdvicePack) =>
    fireAndForget(`/api/advice-packs/${p.id}`, { method: "PATCH", body: JSON.stringify(p) }, "Update advice pack"),

  createFollowUpModule: (m: FollowUpModule) =>
    fireAndForget("/api/follow-up-modules", { method: "POST", body: JSON.stringify(m) }, "Create follow-up module"),
  syncFollowUpModule: (m: FollowUpModule) =>
    fireAndForget(`/api/follow-up-modules/${m.id}`, { method: "PATCH", body: JSON.stringify(m) }, "Update follow-up module"),

  createInvestigationPanel: (p: InvestigationPanel) =>
    fireAndForget("/api/investigation-panels", { method: "POST", body: JSON.stringify(p) }, "Create investigation panel"),
  syncInvestigationPanel: (p: InvestigationPanel) =>
    fireAndForget(`/api/investigation-panels/${p.id}`, { method: "PATCH", body: JSON.stringify(p) }, "Update investigation panel"),

  createFrequencyPhrase: (p: FrequencyPhrase) =>
    fireAndForget("/api/frequency-phrases", { method: "POST", body: JSON.stringify(p) }, "Create frequency phrase"),
  syncFrequencyPhrase: (p: FrequencyPhrase) =>
    fireAndForget(`/api/frequency-phrases/${p.id}`, { method: "PATCH", body: JSON.stringify(p) }, "Update frequency phrase"),

  createVocabularyList: (v: VocabularyList) =>
    fireAndForget("/api/vocabulary-lists", { method: "POST", body: JSON.stringify(v) }, "Create vocabulary list"),
  syncVocabularyList: (v: VocabularyList) =>
    fireAndForget(`/api/vocabulary-lists/${v.id}`, { method: "PATCH", body: JSON.stringify(v) }, "Update vocabulary list"),

  syncInstitutionalSettings: (s: InstitutionalSettings) =>
    fireAndForget("/api/institutional-settings", { method: "PATCH", body: JSON.stringify(s) }, "Update settings"),
};
