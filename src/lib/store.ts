"use client";

import { create } from "zustand";
import { genId } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { CLINICAL_TEMPLATES } from "@/lib/seed-data";
import { emptyExaminationRecord, emptyDischargeContent } from "@/types";
import type {
  Patient,
  Admission,
  Discharge,
  DischargeContent,
  DischargeStatus,
  AppUser,
  AuditAction,
  PrescriptionItem,
  ReconciliationItem,
  AppliedAdvicePack,
  AppliedFollowUpItem,
  InstitutionalSettings,
  AdvicePack,
  FollowUpModule,
  InvestigationPanel,
  FrequencyPhrase,
  VocabularyList,
  DoseRule,
  Drug,
  Formulation,
} from "@/types";

/**
 * A single client-side store, now backed by a real Postgres database via
 * src/app/api/* route handlers (see src/lib/api-client.ts) rather than
 * localStorage. Kept behind action functions (not direct state mutation from
 * components) precisely so that swap was possible without touching call
 * sites — the store still owns all business logic (status transitions, audit
 * trail, revision snapshots) and computes the next state exactly as before;
 * each mutating action additionally pushes the result to the server.
 *
 * `updateContent` — the highest-frequency mutation (every keystroke/chip
 * toggle) — is synced on a short debounce per discharge id rather than on
 * every call, so autosave doesn't hammer the database. Every other mutation
 * is infrequent enough to sync immediately.
 *
 * No `persist` middleware anymore: identity used to be the one thing kept in
 * localStorage (which demo user this browser last picked); now that a real
 * login session is the source of truth, `hydrate()` gets `currentUserId` from
 * the server on every load and there is nothing left worth persisting
 * client-side.
 */
interface AppState {
  hydrated: boolean;
  patients: Patient[];
  admissions: Admission[];
  discharges: Discharge[];
  currentUserId: string;
  institutionalSettings: InstitutionalSettings;
  advicePacks: AdvicePack[];
  followUpModules: FollowUpModule[];
  investigationPanels: InvestigationPanel[];
  frequencyPhrases: FrequencyPhrase[];
  vocabularyLists: VocabularyList[];
  doseRules: DoseRule[];
  drugs: Drug[];
  formulations: Formulation[];
  users: AppUser[];

  /** fetches everything from the server once on app start */
  hydrate: () => Promise<void>;

  // ---- read helpers ----
  getPatient: (id: string) => Patient | undefined;
  getAdmission: (id: string) => Admission | undefined;
  getDischarge: (id: string) => Discharge | undefined;
  getAdmissionsForPatient: (patientId: string) => Admission[];
  getDischargesForAdmission: (admissionId: string) => Discharge[];
  getLatestDischargeForAdmission: (admissionId: string) => Discharge | undefined;
  getCurrentUser: () => AppUser;

  // ---- identity ----
  logout: () => Promise<void>;
  createUser: (input: { name: string; username: string; password: string; role: string; designation: string }) => Promise<AppUser>;
  updateUser: (id: string, patch: Partial<{ name: string; designation: string; role: string; active: boolean; password: string }>) => Promise<AppUser>;
  updateInstitutionalSettings: (patch: Partial<InstitutionalSettings>) => void;

  // ---- workflow ----
  createDischarge: (admissionId: string) => string; // returns new discharge id
  updateContent: (dischargeId: string, patch: (content: DischargeContent) => void) => void;
  setTemplate: (dischargeId: string, templateId: Discharge["templateId"]) => void;
  setParentLanguage: (dischargeId: string, lang: Discharge["parentLanguage"]) => void;
  /** `undefined` clears the override — Medications then follows parentLanguage again */
  setMedicationsLanguage: (dischargeId: string, lang: Discharge["medicationsLanguage"]) => void;
  /** `undefined` clears the override — Follow-up then follows parentLanguage again */
  setFollowUpLanguage: (dischargeId: string, lang: Discharge["followUpLanguage"]) => void;
  setPaperSize: (dischargeId: string, size: Discharge["paperSize"]) => void;
  recordPrint: (dischargeId: string) => void;
  submitForSrReview: (dischargeId: string) => void;
  returnForCorrection: (dischargeId: string, note?: string) => void;
  completeDischarge: (dischargeId: string, reviewerName: string) => void;
  archiveDischarge: (dischargeId: string, reason: string) => void;

  // ---- medications ----
  addPrescriptionItem: (dischargeId: string, item: PrescriptionItem) => void;
  updatePrescriptionItem: (dischargeId: string, itemId: string, patch: Partial<PrescriptionItem>) => void;
  removePrescriptionItem: (dischargeId: string, itemId: string) => void;

  // ---- reconciliation ----
  addReconciliationItem: (dischargeId: string, item: ReconciliationItem) => void;
  updateReconciliationItem: (dischargeId: string, itemId: string, patch: Partial<ReconciliationItem>) => void;
  removeReconciliationItem: (dischargeId: string, itemId: string) => void;

  // ---- content application (snapshotted) ----
  applyAdvicePack: (dischargeId: string, applied: AppliedAdvicePack) => void;
  removeAppliedAdvicePack: (dischargeId: string, appliedId: string) => void;
  /** Recomputes `sections` from `sourceSections`, keeping only the selected
   * bullets and dropping any section left with zero of them. */
  updateAppliedAdvicePackSelection: (dischargeId: string, appliedId: string, selectedBulletIds: Set<string>) => void;
  addFollowUpItem: (dischargeId: string, item: AppliedFollowUpItem) => void;
  updateFollowUpItem: (dischargeId: string, itemId: string, patch: Partial<AppliedFollowUpItem>) => void;
  removeFollowUpItem: (dischargeId: string, itemId: string) => void;

  // ---- content governance: Faculty/SR create & edit, Admin publishes ----
  createAdvicePack: (pack: AdvicePack) => void;
  updateAdvicePack: (id: string, patch: Partial<AdvicePack>) => void;
  publishAdvicePack: (id: string, publishedById: string) => void;
  unpublishAdvicePack: (id: string) => void;

  createFollowUpModule: (module: FollowUpModule) => void;
  updateFollowUpModule: (id: string, patch: Partial<FollowUpModule>) => void;
  publishFollowUpModule: (id: string, publishedById: string) => void;
  unpublishFollowUpModule: (id: string) => void;

  createInvestigationPanel: (panel: InvestigationPanel) => void;
  updateInvestigationPanel: (id: string, patch: Partial<InvestigationPanel>) => void;
  publishInvestigationPanel: (id: string, publishedById: string) => void;
  unpublishInvestigationPanel: (id: string) => void;

  createFrequencyPhrase: (phrase: FrequencyPhrase) => void;
  updateFrequencyPhrase: (id: string, patch: Partial<FrequencyPhrase>) => void;
  publishFrequencyPhrase: (id: string, publishedById: string) => void;
  unpublishFrequencyPhrase: (id: string) => void;

  createVocabularyList: (list: VocabularyList) => void;
  updateVocabularyList: (id: string, patch: Partial<VocabularyList>) => void;
  publishVocabularyList: (id: string, publishedById: string) => void;
  unpublishVocabularyList: (id: string) => void;

  /** Faculty/SR only — creates a new "faculty" rule, never a "system" one. */
  createDoseRule: (rule: DoseRule) => void;
  /** No-ops if the target rule's source is "system" — those are never editable via the UI. */
  updateDoseRule: (id: string, patch: Partial<DoseRule>) => void;
  publishDoseRule: (id: string, publishedById: string) => void;
  unpublishDoseRule: (id: string) => void;

  // ---- formulary ----
  createDrug: (drug: Drug) => void;
  createFormulation: (formulation: Formulation) => void;
}

function addAudit(
  d: Discharge,
  actor: AppUser,
  action: AuditAction,
  detail?: string,
  statusFrom?: string,
  statusTo?: string,
) {
  // reassign (not push) — d is a shallow copy whose array fields may still be
  // shared with the previous state object; never mutate a shared array in place.
  d.auditTrail = [
    ...d.auditTrail,
    {
      id: genId("audit"),
      dischargeId: d.id,
      actorId: actor.id,
      actorName: actor.name,
      action,
      timestamp: new Date().toISOString(),
      revisionNumber: d.revisionNumber,
      statusFrom,
      statusTo,
      detail,
    },
  ];
}

/** CLAUDE.md rule 12: editing a completed discharge opens a new revision and
 * returns it to SR review, before the edit itself is applied. */
function reopenIfCompleted(d: Discharge, actor: AppUser) {
  if (d.status !== "completed") return;
  d.revisionHistory = [
    ...d.revisionHistory,
    {
      revisionNumber: d.revisionNumber,
      content: JSON.parse(JSON.stringify(d.content)),
      completedAt: d.updatedAt,
      completedById: d.completedById ?? actor.id,
      completedByName: d.completedByName ?? actor.name,
      reviewerName: d.reviewerName,
      institutionalSnapshot: d.institutionalSnapshot!,
    },
  ];
  d.revisionNumber += 1;
  d.status = "pending_sr_review";
  addAudit(
    d,
    actor,
    "revision_opened",
    "Edited after completion — new revision opened, returned to SR review.",
    "completed",
    "pending_sr_review",
  );
}

/** debounced per-discharge sync so autosave (every keystroke/chip toggle)
 * doesn't fire a network+DB write on every call. */
const contentSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();
function scheduleDischargeSync(discharge: Discharge) {
  const existing = contentSyncTimers.get(discharge.id);
  if (existing) clearTimeout(existing);
  contentSyncTimers.set(
    discharge.id,
    setTimeout(() => {
      contentSyncTimers.delete(discharge.id);
      api.syncDischarge(discharge);
    }, 800),
  );
}

export const useAppStore = create<AppState>()(
  (set, get) => ({
    hydrated: false,
    patients: [],
    admissions: [],
    discharges: [],
    currentUserId: "",
    institutionalSettings: {
      hospitalName: "",
      department: "",
      hodName: "",
      contactPhone: "",
      contactAddress: "",
      defaultPaperSize: "A4",
      defaultParentLanguage: "urdu_english",
    },
    advicePacks: [],
    followUpModules: [],
    investigationPanels: [],
    frequencyPhrases: [],
    vocabularyLists: [],
    doseRules: [],
    drugs: [],
    formulations: [],
    users: [],

    hydrate: async () => {
      const { currentUser, ...rest } = await api.bootstrap();
      set({ ...rest, hydrated: true, currentUserId: currentUser.id });
    },

    getPatient: (id) => get().patients.find((p) => p.id === id),
    getAdmission: (id) => get().admissions.find((a) => a.id === id),
    getDischarge: (id) => get().discharges.find((d) => d.id === id),
    getAdmissionsForPatient: (patientId) =>
      get().admissions.filter((a) => a.patientId === patientId),
    getDischargesForAdmission: (admissionId) =>
      get().discharges.filter((d) => d.admissionId === admissionId && !d.archived),
    getLatestDischargeForAdmission: (admissionId) => {
      const list = get()
        .discharges.filter((d) => d.admissionId === admissionId && !d.archived)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return list[0];
    },
    getCurrentUser: () => {
      const s = get();
      return s.users.find((u) => u.id === s.currentUserId) ?? s.users[0];
    },

    logout: async () => {
      try {
        await api.logout();
      } finally {
        // Full reload rather than resetting store state piecemeal — a
        // fresh load re-runs StoreHydrator against the now-cleared session,
        // which is the same "redirect to /login" path an expired/invalid
        // session already takes, and guarantees no other user's in-memory
        // data (patients, discharges, …) survives in this tab. This action
        // isn't a component/hook, so `useRouter()` isn't available — and a
        // client-side route change wouldn't clear that in-memory state
        // anyway, which is the whole point on logout.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    },
    createUser: async (input) => {
      const user = await api.createUser(input);
      set((s) => ({ users: [...s.users, user] }));
      return user;
    },
    updateUser: async (id, patch) => {
      const user = await api.updateUser(id, patch);
      set((s) => ({ users: s.users.map((u) => (u.id === id ? user : u)) }));
      return user;
    },
    updateInstitutionalSettings: (patch) =>
      set((s) => {
        const next = { ...s.institutionalSettings, ...patch };
        api.syncInstitutionalSettings(next);
        return { institutionalSettings: next };
      }),

    createDischarge: (admissionId) => {
      const admission = get().admissions.find((a) => a.id === admissionId);
      if (!admission) throw new Error("Admission not found");
      const actor = get().getCurrentUser();
      const id = genId("dis");
      const now = new Date().toISOString();
      const discharge: Discharge = {
        id,
        admissionId,
        patientId: admission.patientId,
        status: "draft",
        revisionNumber: 1,
        templateId: "standard_pediatric",
        templateAutoSelected: true,
        parentLanguage: get().institutionalSettings.defaultParentLanguage,
        paperSize: get().institutionalSettings.defaultPaperSize,
        content: emptyDischargeContent(emptyExaminationRecord, admission.weightKg),
        preparedById: actor.id,
        preparedByName: actor.name,
        revisionHistory: [],
        printEvents: [],
        archived: false,
        auditTrail: [],
        createdAt: now,
        updatedAt: now,
      };
      addAudit(discharge, actor, "created");
      set((s) => ({ discharges: [...s.discharges, discharge] }));
      api.createDischarge(discharge);
      return id;
    },

    updateContent: (dischargeId, patch) => {
      set((s) => ({
        discharges: s.discharges.map((d) => {
          if (d.id !== dischargeId) return d;
          const actor = get().getCurrentUser();
          const next = { ...d, content: JSON.parse(JSON.stringify(d.content)) as DischargeContent };
          reopenIfCompleted(next, actor);
          patch(next.content);
          next.updatedAt = new Date().toISOString();
          return next;
        }),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) scheduleDischargeSync(updated);
    },

    setTemplate: (dischargeId, templateId) => {
      set((s) => ({
        discharges: s.discharges.map((d) =>
          d.id === dischargeId
            ? { ...d, templateId, templateAutoSelected: false, updatedAt: new Date().toISOString() }
            : d,
        ),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    setParentLanguage: (dischargeId, lang) => {
      set((s) => ({
        discharges: s.discharges.map((d) =>
          d.id === dischargeId ? { ...d, parentLanguage: lang, updatedAt: new Date().toISOString() } : d,
        ),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    setMedicationsLanguage: (dischargeId, lang) => {
      set((s) => ({
        discharges: s.discharges.map((d) =>
          d.id === dischargeId ? { ...d, medicationsLanguage: lang, updatedAt: new Date().toISOString() } : d,
        ),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    setFollowUpLanguage: (dischargeId, lang) => {
      set((s) => ({
        discharges: s.discharges.map((d) =>
          d.id === dischargeId ? { ...d, followUpLanguage: lang, updatedAt: new Date().toISOString() } : d,
        ),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    setPaperSize: (dischargeId, size) => {
      set((s) => ({
        discharges: s.discharges.map((d) =>
          d.id === dischargeId ? { ...d, paperSize: size, updatedAt: new Date().toISOString() } : d,
        ),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    recordPrint: (dischargeId) => {
      set((s) => ({
        discharges: s.discharges.map((d) => {
          if (d.id !== dischargeId) return d;
          const actor = get().getCurrentUser();
          const next = { ...d, printEvents: [...d.printEvents, {
            id: genId("print"),
            dischargeId: d.id,
            printedById: actor.id,
            printedByName: actor.name,
            timestamp: new Date().toISOString(),
            revisionNumber: d.revisionNumber,
            markedPendingReview: d.status !== "completed",
          }] };
          addAudit(next, actor, "printed", undefined, d.status, d.status === "draft" ? "pending_sr_review" : d.status);
          if (next.status === "draft" || next.status === "ready_for_print") {
            next.status = "pending_sr_review";
          }
          next.updatedAt = new Date().toISOString();
          return next;
        }),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    submitForSrReview: (dischargeId) => {
      set((s) => ({
        discharges: s.discharges.map((d) => {
          if (d.id !== dischargeId) return d;
          const actor = get().getCurrentUser();
          const next = { ...d, status: "ready_for_print" as DischargeStatus };
          addAudit(next, actor, "submitted_for_review", undefined, d.status, next.status);
          next.updatedAt = new Date().toISOString();
          return next;
        }),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    returnForCorrection: (dischargeId, note) => {
      set((s) => ({
        discharges: s.discharges.map((d) => {
          if (d.id !== dischargeId) return d;
          const actor = get().getCurrentUser();
          const next = { ...d, status: "draft" as DischargeStatus };
          addAudit(next, actor, "returned_by_reviewer", note, d.status, next.status);
          next.updatedAt = new Date().toISOString();
          return next;
        }),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    completeDischarge: (dischargeId, reviewerName) => {
      set((s) => {
        const actor = get().getCurrentUser();
        const settings = s.institutionalSettings;
        let admissionId = "";
        let dischargeDateStr = "";
        const discharges = s.discharges.map((d) => {
          if (d.id !== dischargeId) return d;
          const next: Discharge = {
            ...d,
            status: "completed",
            reviewerName,
            completedById: actor.id,
            completedByName: actor.name,
            institutionalSnapshot: {
              hospitalName: settings.hospitalName,
              logoUrl: settings.logoUrl,
              department: settings.department,
              hodName: settings.hodName,
              srName: reviewerName,
              contactPhone: settings.contactPhone,
              contactAddress: settings.contactAddress,
              capturedAt: new Date().toISOString(),
            },
          };
          addAudit(next, actor, "completed", `Reviewed and signed by ${reviewerName}`, d.status, next.status);
          next.updatedAt = new Date().toISOString();
          admissionId = next.admissionId;
          dischargeDateStr = next.updatedAt.slice(0, 10);
          return next;
        });
        const admissions = s.admissions.map((a) =>
          a.id === admissionId && !a.dischargeDate
            ? { ...a, dischargeDate: dischargeDateStr, status: "discharged" as const }
            : a,
        );
        return { discharges, admissions };
      });
      const updatedDischarge = get().getDischarge(dischargeId);
      if (updatedDischarge) {
        api.syncDischarge(updatedDischarge);
        const updatedAdmission = get().getAdmission(updatedDischarge.admissionId);
        if (updatedAdmission) api.syncAdmission(updatedAdmission);
      }
    },

    archiveDischarge: (dischargeId, reason) => {
      set((s) => ({
        discharges: s.discharges.map((d) => {
          if (d.id !== dischargeId) return d;
          const actor = get().getCurrentUser();
          const next = { ...d, archived: true, archivedReason: reason };
          addAudit(next, actor, "archived", reason);
          next.updatedAt = new Date().toISOString();
          return next;
        }),
      }));
      const updated = get().getDischarge(dischargeId);
      if (updated) api.syncDischarge(updated);
    },

    addPrescriptionItem: (dischargeId, item) =>
      get().updateContent(dischargeId, (c) => {
        c.medications.push(item);
      }),
    updatePrescriptionItem: (dischargeId, itemId, patch) =>
      get().updateContent(dischargeId, (c) => {
        const idx = c.medications.findIndex((m) => m.id === itemId);
        if (idx >= 0) c.medications[idx] = { ...c.medications[idx], ...patch };
      }),
    removePrescriptionItem: (dischargeId, itemId) =>
      get().updateContent(dischargeId, (c) => {
        c.medications = c.medications.filter((m) => m.id !== itemId);
      }),

    addReconciliationItem: (dischargeId, item) =>
      get().updateContent(dischargeId, (c) => {
        c.reconciliation.push(item);
      }),
    updateReconciliationItem: (dischargeId, itemId, patch) =>
      get().updateContent(dischargeId, (c) => {
        const idx = c.reconciliation.findIndex((r) => r.id === itemId);
        if (idx >= 0) c.reconciliation[idx] = { ...c.reconciliation[idx], ...patch };
      }),
    removeReconciliationItem: (dischargeId, itemId) =>
      get().updateContent(dischargeId, (c) => {
        c.reconciliation = c.reconciliation.filter((r) => r.id !== itemId);
      }),

    applyAdvicePack: (dischargeId, applied) =>
      get().updateContent(dischargeId, (c) => {
        if (!c.advice.some((a) => a.packId === applied.packId)) c.advice.push(applied);
      }),
    removeAppliedAdvicePack: (dischargeId, appliedId) =>
      get().updateContent(dischargeId, (c) => {
        c.advice = c.advice.filter((a) => a.id !== appliedId);
      }),
    updateAppliedAdvicePackSelection: (dischargeId, appliedId, selectedBulletIds) =>
      get().updateContent(dischargeId, (c) => {
        const applied = c.advice.find((a) => a.id === appliedId);
        if (!applied) return;
        applied.sections = applied.sourceSections
          .map((sec) => ({ ...sec, bullets: sec.bullets.filter((b) => selectedBulletIds.has(b.id)) }))
          .filter((sec) => sec.bullets.length > 0);
      }),
    addFollowUpItem: (dischargeId, item) =>
      get().updateContent(dischargeId, (c) => {
        c.followUp.push(item);
      }),
    updateFollowUpItem: (dischargeId, itemId, patch) =>
      get().updateContent(dischargeId, (c) => {
        const idx = c.followUp.findIndex((f) => f.id === itemId);
        if (idx >= 0) c.followUp[idx] = { ...c.followUp[idx], ...patch };
      }),
    removeFollowUpItem: (dischargeId, itemId) =>
      get().updateContent(dischargeId, (c) => {
        c.followUp = c.followUp.filter((f) => f.id !== itemId);
      }),

    createAdvicePack: (pack) => {
      set((s) => ({ advicePacks: [...s.advicePacks, pack] }));
      api.createAdvicePack(pack);
    },
    updateAdvicePack: (id, patch) => {
      set((s) => ({
        advicePacks: s.advicePacks.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
        ),
      }));
      const updated = get().advicePacks.find((p) => p.id === id);
      if (updated) api.syncAdvicePack(updated);
    },
    publishAdvicePack: (id, publishedById) => {
      set((s) => ({
        advicePacks: s.advicePacks.map((p) =>
          p.id === id
            ? { ...p, status: "published", publishedBy: publishedById, updatedAt: new Date().toISOString() }
            : p,
        ),
      }));
      const updated = get().advicePacks.find((p) => p.id === id);
      if (updated) api.syncAdvicePack(updated);
    },
    unpublishAdvicePack: (id) => {
      set((s) => ({
        advicePacks: s.advicePacks.map((p) =>
          p.id === id ? { ...p, status: "draft", updatedAt: new Date().toISOString() } : p,
        ),
      }));
      const updated = get().advicePacks.find((p) => p.id === id);
      if (updated) api.syncAdvicePack(updated);
    },

    createFollowUpModule: (module) => {
      set((s) => ({ followUpModules: [...s.followUpModules, module] }));
      api.createFollowUpModule(module);
    },
    updateFollowUpModule: (id, patch) => {
      set((s) => ({
        followUpModules: s.followUpModules.map((m) =>
          m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m,
        ),
      }));
      const updated = get().followUpModules.find((m) => m.id === id);
      if (updated) api.syncFollowUpModule(updated);
    },
    publishFollowUpModule: (id, publishedById) => {
      set((s) => ({
        followUpModules: s.followUpModules.map((m) =>
          m.id === id
            ? { ...m, status: "published", publishedBy: publishedById, updatedAt: new Date().toISOString() }
            : m,
        ),
      }));
      const updated = get().followUpModules.find((m) => m.id === id);
      if (updated) api.syncFollowUpModule(updated);
    },
    unpublishFollowUpModule: (id) => {
      set((s) => ({
        followUpModules: s.followUpModules.map((m) =>
          m.id === id ? { ...m, status: "draft", updatedAt: new Date().toISOString() } : m,
        ),
      }));
      const updated = get().followUpModules.find((m) => m.id === id);
      if (updated) api.syncFollowUpModule(updated);
    },

    createInvestigationPanel: (panel) => {
      set((s) => ({ investigationPanels: [...s.investigationPanels, panel] }));
      api.createInvestigationPanel(panel);
    },
    updateInvestigationPanel: (id, patch) => {
      set((s) => ({
        investigationPanels: s.investigationPanels.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
        ),
      }));
      const updated = get().investigationPanels.find((p) => p.id === id);
      if (updated) api.syncInvestigationPanel(updated);
    },
    publishInvestigationPanel: (id, publishedById) => {
      set((s) => ({
        investigationPanels: s.investigationPanels.map((p) =>
          p.id === id
            ? { ...p, status: "published", publishedBy: publishedById, updatedAt: new Date().toISOString() }
            : p,
        ),
      }));
      const updated = get().investigationPanels.find((p) => p.id === id);
      if (updated) api.syncInvestigationPanel(updated);
    },
    unpublishInvestigationPanel: (id) => {
      set((s) => ({
        investigationPanels: s.investigationPanels.map((p) =>
          p.id === id ? { ...p, status: "draft", updatedAt: new Date().toISOString() } : p,
        ),
      }));
      const updated = get().investigationPanels.find((p) => p.id === id);
      if (updated) api.syncInvestigationPanel(updated);
    },

    createFrequencyPhrase: (phrase) => {
      set((s) => ({ frequencyPhrases: [...s.frequencyPhrases, phrase] }));
      api.createFrequencyPhrase(phrase);
    },
    updateFrequencyPhrase: (id, patch) => {
      set((s) => ({
        frequencyPhrases: s.frequencyPhrases.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
        ),
      }));
      const updated = get().frequencyPhrases.find((p) => p.id === id);
      if (updated) api.syncFrequencyPhrase(updated);
    },
    publishFrequencyPhrase: (id, publishedById) => {
      const target = get().frequencyPhrases.find((p) => p.id === id);
      set((s) => ({
        frequencyPhrases: s.frequencyPhrases.map((p) => {
          if (p.id === id) {
            return { ...p, status: "published" as const, publishedBy: publishedById, updatedAt: new Date().toISOString() };
          }
          // Exactly one published phrase per frequency code at a time — a
          // prescription can't print two different active wordings for the
          // same code, so publishing one retires whichever was live for it.
          // This is what makes "add another phrasing for BD" safe: any
          // number of drafts can exist per code, only one is ever live.
          if (target && p.frequencyCode === target.frequencyCode && p.status === "published") {
            return { ...p, status: "draft" as const, updatedAt: new Date().toISOString() };
          }
          return p;
        }),
      }));
      const affected = get().frequencyPhrases.filter(
        (p) => p.id === id || (target && p.frequencyCode === target.frequencyCode),
      );
      for (const p of affected) api.syncFrequencyPhrase(p);
    },
    unpublishFrequencyPhrase: (id) => {
      set((s) => ({
        frequencyPhrases: s.frequencyPhrases.map((p) =>
          p.id === id ? { ...p, status: "draft", updatedAt: new Date().toISOString() } : p,
        ),
      }));
      const updated = get().frequencyPhrases.find((p) => p.id === id);
      if (updated) api.syncFrequencyPhrase(updated);
    },

    createVocabularyList: (list) => {
      set((s) => ({ vocabularyLists: [...s.vocabularyLists, list] }));
      api.createVocabularyList(list);
    },
    updateVocabularyList: (id, patch) => {
      set((s) => ({
        vocabularyLists: s.vocabularyLists.map((v) =>
          v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v,
        ),
      }));
      const updated = get().vocabularyLists.find((v) => v.id === id);
      if (updated) api.syncVocabularyList(updated);
    },
    publishVocabularyList: (id, publishedById) => {
      set((s) => ({
        vocabularyLists: s.vocabularyLists.map((v) =>
          v.id === id
            ? { ...v, status: "published", publishedBy: publishedById, updatedAt: new Date().toISOString() }
            : v,
        ),
      }));
      const updated = get().vocabularyLists.find((v) => v.id === id);
      if (updated) api.syncVocabularyList(updated);
    },
    unpublishVocabularyList: (id) => {
      set((s) => ({
        vocabularyLists: s.vocabularyLists.map((v) =>
          v.id === id ? { ...v, status: "draft", updatedAt: new Date().toISOString() } : v,
        ),
      }));
      const updated = get().vocabularyLists.find((v) => v.id === id);
      if (updated) api.syncVocabularyList(updated);
    },

    createDoseRule: (rule) => {
      set((s) => ({ doseRules: [...s.doseRules, rule] }));
      api.createDoseRule(rule);
    },
    updateDoseRule: (id, patch) => {
      set((s) => ({
        doseRules: s.doseRules.map((r) =>
          r.id === id && r.source === "faculty" ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
        ),
      }));
      const updated = get().doseRules.find((r) => r.id === id);
      if (updated && updated.source === "faculty") api.syncDoseRule(updated);
    },
    publishDoseRule: (id, publishedById) => {
      set((s) => ({
        doseRules: s.doseRules.map((r) =>
          r.id === id && r.source === "faculty"
            ? { ...r, status: "published", publishedBy: publishedById, updatedAt: new Date().toISOString() }
            : r,
        ),
      }));
      const updated = get().doseRules.find((r) => r.id === id);
      if (updated && updated.source === "faculty") api.syncDoseRule(updated);
    },
    unpublishDoseRule: (id) => {
      set((s) => ({
        doseRules: s.doseRules.map((r) =>
          r.id === id && r.source === "faculty" ? { ...r, status: "draft", updatedAt: new Date().toISOString() } : r,
        ),
      }));
      const updated = get().doseRules.find((r) => r.id === id);
      if (updated && updated.source === "faculty") api.syncDoseRule(updated);
    },

    createDrug: (drug) => {
      set((s) => ({ drugs: [...s.drugs, drug] }));
      api.createDrug(drug);
    },
    createFormulation: (formulation) => {
      set((s) => ({ formulations: [...s.formulations, formulation] }));
      api.createFormulation(formulation);
    },
  }),
);

export { CLINICAL_TEMPLATES };
