"use client";

import type { CSSProperties } from "react";
import { AlertTriangle, Phone, MapPin } from "lucide-react";
import type { Admission, Discharge, InstitutionalSettings, Patient } from "@/types";
import { calculateAgeLabel, ageInDays } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { FREQUENCY_OPTIONS, parentPhrasePartsFor } from "@/lib/frequency";
import { formatDuration, formatBrandNames } from "@/lib/prescription-format";
import { EXAM_SYSTEMS, HISTORY_CATEGORIES } from "@/types";
import { TREATMENT_EVENT_LABELS } from "@/lib/clinical-vocab";
import { weightForAgeZ, lengthHeightForAgeZ, bmiForAgeZ, headCircumferenceForAgeZ, WFA_LMS, LHFA_LMS, BFA_LMS, HCFA_LMS } from "@/lib/growth-calc";
import { AdviceSectionsPreview, BilingualLine } from "@/components/content/advice-sections-preview";
import { GrowthIndicatorCard } from "@/components/discharge/growth-indicator";

const EXAM_SYSTEM_LABELS: Record<string, string> = {
  general: "General",
  respiratory: "Respiratory System",
  cvs: "Cardiovascular System",
  cns: "CNS",
  abdomen: "Abdomen",
  ent: "ENT",
  skin: "Skin",
  musculoskeletal: "Musculoskeletal",
  other: "Other",
};

const HISTORY_CATEGORY_LABELS: Record<string, string> = {
  birth: "Birth/Antenatal",
  immunization: "Immunization",
  past_medical: "Past Medical/Surgical",
  family: "Family",
  allergy: "Allergy",
  developmental: "Developmental",
};

const IMMUNIZATION_LABELS: Record<string, string> = {
  up_to_date: "Up to date",
  catch_up_required: "Catch-up required",
  not_assessed: "Not assessed",
  not_applicable: "Not applicable",
};

/**
 * The single source of truth for the clinical/parent-facing document — used
 * both by the workspace's inline Preview toggle and the standalone /print
 * route, so what a clinician previews is exactly what prints (DESIGN.md).
 */
export function DischargeDocument({
  discharge,
  patient,
  admission,
  institutionalSettings,
}: {
  discharge: Discharge;
  patient: Patient;
  admission: Admission;
  institutionalSettings: InstitutionalSettings;
}) {
  const drugs = useAppStore((s) => s.drugs);
  const formulations = useAppStore((s) => s.formulations);
  const frequencyPhrases = useAppStore((s) => s.frequencyPhrases);
  const { content } = discharge;
  const identity = discharge.institutionalSnapshot ?? {
    hospitalName: institutionalSettings.hospitalName,
    logoUrl: institutionalSettings.logoUrl,
    department: institutionalSettings.department,
    hodName: institutionalSettings.hodName,
    srName: discharge.reviewerName,
    contactPhone: institutionalSettings.contactPhone,
    contactAddress: institutionalSettings.contactAddress,
    capturedAt: discharge.updatedAt,
  };

  // Three independent language slots — Medications and each applied Advice
  // Pack can each override the discharge's own default (see summary/page.tsx
  // and advice/page.tsx for where those overrides are set); undefined always
  // means "follow the discharge default", never "off".
  const defaultLanguageMode = discharge.parentLanguage;
  const medicationsLanguageMode = discharge.medicationsLanguage ?? defaultLanguageMode;
  const followUpLanguageMode = discharge.followUpLanguage ?? defaultLanguageMode;
  const examSystemsWithContent = EXAM_SYSTEMS.filter(
    (sys) => content.examination[sys].selected.length > 0 || content.examination[sys].note.trim(),
  );
  const historyCategoriesWithContent = HISTORY_CATEGORIES.filter(
    (cat) => content.history.categories[cat].selected.length > 0 || content.history.categories[cat].note.trim(),
  );

  const growthSex = patient.sex === "male" || patient.sex === "female" ? patient.sex : null;
  const growthAgeDays = ageInDays(patient.dob);
  const growthAgeMonths = growthAgeDays / (365.25 / 12);
  const wfa = growthSex ? weightForAgeZ(growthSex, growthAgeDays, content.growth.weightKg) : null;
  const lhfa =
    growthSex && content.growth.heightCm ? lengthHeightForAgeZ(growthSex, growthAgeDays, content.growth.heightCm) : null;
  const bfa = growthSex && content.growth.bmi ? bmiForAgeZ(growthSex, growthAgeDays, content.growth.bmi) : null;
  const hcfa =
    growthSex && content.growth.headCircumferenceCm
      ? headCircumferenceForAgeZ(growthSex, growthAgeDays, content.growth.headCircumferenceCm)
      : null;

  return (
    <div
      className="discharge-document bg-white text-[#111318]"
      // GrowthIndicatorCard (built for the dark workspace UI) reads
      // `--foreground` for its own title text — that token is a near-white
      // dark-theme value (illegible on this always-white document), so it's
      // overridden here to the document's own base ink color. Muted/subtle
      // text and the Z-score badge colors are unaffected — they're already
      // mid-tone/accent colors that read fine on white as-is.
      style={{ "--foreground": "#111318" } as CSSProperties}
    >
      {discharge.status === "pending_sr_review" && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-[4px] border-2 border-dashed border-[#b45309] bg-[#fef3c7] py-2 text-[13px] font-bold uppercase tracking-wide text-[#92400e]">
          <AlertTriangle className="size-4" /> Pending SR Review — Not Yet Signed
        </div>
      )}

      {/* Institutional header */}
      <header className="mb-4 flex items-center justify-between gap-4 border-b-2 border-[#111318] pb-3">
        <div className="flex items-center gap-3">
          {identity.logoUrl ? (
            // An institution-supplied external URL, not a local/optimizable asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={identity.logoUrl}
              alt={`${identity.hospitalName} logo`}
              className="size-11 shrink-0 rounded-full border border-[#e2e8f0] object-contain bg-white"
            />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-full bg-primary text-[16px] font-bold text-white">
              N
            </div>
          )}
          <div>
            <div className="text-[16px] font-bold leading-tight">{identity.hospitalName}</div>
            <div className="text-[11px] leading-tight text-[#475569]">{identity.department}</div>
          </div>
        </div>
        <div className="text-right text-[10.5px] leading-tight text-[#475569]">
          <div>HOD: {identity.hodName}</div>
          {identity.srName && <div>Reviewing SR: {identity.srName}</div>}
          <div className="mt-0.5 flex items-center justify-end gap-1">
            <Phone className="size-3" /> {identity.contactPhone}
          </div>
        </div>
      </header>

      <div className="mb-1 text-center text-[13px] font-bold uppercase tracking-wide">Discharge Summary</div>

      {/* Patient identification */}
      <table className="mb-4 w-full border-collapse border border-[#cbd5e1] text-[11px]">
        <tbody>
          <tr>
            <IdCell label="Patient Name" value={patient.name} />
            <IdCell label="MR Number" value={patient.mrNumber} />
            <IdCell label="Age / Sex" value={`${calculateAgeLabel(patient.dob)} / ${patient.sex}`} />
          </tr>
          <tr>
            <IdCell label="Guardian" value={patient.fatherGuardianName} />
            <IdCell label="Ward / Bed" value={admission.wardBed} />
            <IdCell label="Weight" value={`${content.growth.weightKg} kg`} />
          </tr>
          <tr>
            <IdCell label="Date of Admission" value={formatDate(admission.admissionDate)} />
            <IdCell label="Date of Discharge" value={formatDate(admission.dischargeDate ?? discharge.updatedAt.slice(0, 10))} />
            <IdCell
              label="Allergy"
              value={
                admission.allergy.status === "documented"
                  ? admission.allergy.allergies.join(", ")
                  : admission.allergy.status === "none_known"
                    ? "No known drug allergy"
                    : "Not documented"
              }
            />
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4">
        <Section title="Diagnosis">
          {content.diagnosis.primary ? (
            <>
              <p className="font-semibold">{content.diagnosis.primary.label}</p>
              {content.diagnosis.secondary.length > 0 && (
                <p className="text-[#475569]">
                  Secondary: {content.diagnosis.secondary.map((d) => d.label).join(", ")}
                </p>
              )}
            </>
          ) : (
            <EmptyLine />
          )}
        </Section>

        {(content.presentingComplaints.complaints.length > 0 || content.presentingComplaints.narrative) && (
          <Section title="Presenting Complaints">
            {content.presentingComplaints.complaints.length > 0 && (
              <p>
                {content.presentingComplaints.complaints
                  .map((c) => (c.duration ? `${c.symptom} (${c.duration})` : c.symptom))
                  .join(", ")}
              </p>
            )}
            {/* Onset/progression/associated symptoms/relevant history stay a
                secondary line per complaint, only when actually filled in —
                routine complaints with just a duration print exactly as
                before, unchanged. */}
            {content.presentingComplaints.complaints
              .filter((c) => c.onset || c.progression || (c.associatedSymptoms && c.associatedSymptoms.length > 0) || c.relevantHistory)
              .map((c) => (
                <p key={c.id} className="mt-0.5 text-[#475569]">
                  <span className="font-medium">{c.symptom}: </span>
                  {[
                    c.onset && `Onset ${c.onset}`,
                    c.progression && `Progression: ${c.progression}`,
                    c.associatedSymptoms && c.associatedSymptoms.length > 0 && `Associated: ${c.associatedSymptoms.join(", ")}`,
                    c.relevantHistory && `Relevant history: ${c.relevantHistory}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ))}
            {content.presentingComplaints.narrative && <p className="mt-1 text-[#334155]">{content.presentingComplaints.narrative}</p>}
          </Section>
        )}

        {(historyCategoriesWithContent.length > 0 || content.history.narrative) && (
          <Section title="History">
            <div className="space-y-1">
              {historyCategoriesWithContent.map((cat) => (
                <p key={cat}>
                  <span className="font-semibold">{HISTORY_CATEGORY_LABELS[cat]}: </span>
                  {[...content.history.categories[cat].selected, content.history.categories[cat].note].filter(Boolean).join(". ")}
                </p>
              ))}
            </div>
            {content.history.narrative && <p className="mt-1 text-[#334155]">{content.history.narrative}</p>}
          </Section>
        )}

        {examSystemsWithContent.length > 0 && (
          <Section title="Examination">
            <div className="space-y-1">
              {examSystemsWithContent.map((sys) => (
                <p key={sys}>
                  <span className="font-semibold">{EXAM_SYSTEM_LABELS[sys]}: </span>
                  {[...content.examination[sys].selected, content.examination[sys].note].filter(Boolean).join(". ")}
                </p>
              ))}
            </div>
          </Section>
        )}

        {content.investigations.filter((i) => i.includeOnPrint).length > 0 && (
          <Section title="Investigations">
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                {content.investigations
                  .filter((i) => i.includeOnPrint)
                  .map((inv) => (
                    <tr key={inv.id} className="border-b border-[#e2e8f0] last:border-0">
                      <td className="py-1 pr-3 font-medium">{inv.test}</td>
                      <td className="py-1 text-[#334155]">{inv.result}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Section>
        )}

        {content.treatment.courseNarrative && (
          <Section title="Hospital Course">
            {content.treatment.events.length > 0 && (
              <p className="mb-1 text-[#475569]">
                {content.treatment.events.map((e) => TREATMENT_EVENT_LABELS[e.type]).join(", ")}
              </p>
            )}
            <p className="text-[#334155]">{content.treatment.courseNarrative}</p>
          </Section>
        )}

        {content.dischargeCondition.selected.length > 0 && (
          <Section title="Condition at Discharge">
            <p>{content.dischargeCondition.selected.join(", ")}{content.dischargeCondition.note ? `. ${content.dischargeCondition.note}` : ""}</p>
          </Section>
        )}

        {content.medications.length > 0 && (
          <Section title="Discharge Medications">
            <table className="w-full border-collapse border border-[#cbd5e1] text-[11px]">
              <thead>
                <tr className="bg-[#f1f5f9] text-left">
                  <Th>Drug</Th>
                  <Th>Strength</Th>
                  <Th>Dose</Th>
                  <Th>Route</Th>
                  <Th>Frequency</Th>
                  <Th>Duration</Th>
                  <Th>Instructions</Th>
                </tr>
              </thead>
              <tbody>
                {content.medications.map((m) => {
                  const drug = drugs.find((d) => d.id === m.drugId);
                  const formulation = formulations.find((f) => f.id === m.formulationId);
                  const freq = FREQUENCY_OPTIONS[m.frequencyCode];
                  return (
                    <tr key={m.id} className="border-t border-[#cbd5e1] align-top">
                      <Td className="font-semibold">{drug?.name}</Td>
                      <Td>
                        {formulation?.strengthLabel ?? "—"}
                        {formulation && formatBrandNames(formulation.brandNames) && (
                          <span className="block text-[#64748b]">{formatBrandNames(formulation.brandNames)}</span>
                        )}
                      </Td>
                      <Td>{m.trace.finalDoseLabel}</Td>
                      <Td>{m.route}</Td>
                      <Td>{m.prn ? `${freq.label} (PRN)` : freq.label}</Td>
                      <Td>{formatDuration(m.duration)}</Td>
                      <Td className="text-[11px]">
                        {(() => {
                          // A manual override wins per-language, not
                          // all-or-nothing — an Urdu override with no English
                          // override still falls back to the computed English
                          // phrase (and vice versa) rather than going blank.
                          const parts = parentPhrasePartsFor(m.frequencyCode, medicationsLanguageMode, frequencyPhrases);
                          const urdu = m.parentInstructionUrduOverride || parts.urdu;
                          const english = m.parentInstructionEnglishOverride || parts.english;
                          const showUrdu = medicationsLanguageMode !== "english_only";
                          const showEnglish = medicationsLanguageMode !== "urdu_only";
                          return (
                            <BilingualLine
                              en={showEnglish ? english : undefined}
                              ur={showUrdu ? urdu : undefined}
                              bothShown={showUrdu && showEnglish}
                            />
                          );
                        })()}
                        {m.prnIndication && <p className="font-sans text-[#475569]">({m.prnIndication})</p>}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        )}

        {content.advice.map((pack) => (
          <Section key={pack.id} title={pack.packTitle}>
            <AdviceSectionsPreview sections={pack.sections} mode={pack.languageOverride ?? defaultLanguageMode} />
          </Section>
        ))}

        {content.followUp.length > 0 && (
          <Section title="Follow-up">
            <table className="w-full border-collapse border border-[#cbd5e1] text-[11px]">
              <thead>
                <tr className="bg-[#f1f5f9] text-left">
                  <Th>Service</Th>
                  <Th>When</Th>
                  <Th>Purpose</Th>
                  <Th>Instructions</Th>
                </tr>
              </thead>
              <tbody>
                {content.followUp.map((f) => {
                  // purpose/instructions are the two fields a parent actually
                  // reads as prose — service/timing stay English-only, same as
                  // a drug name or frequency code elsewhere in this document.
                  const showUrdu = followUpLanguageMode !== "english_only";
                  const showEnglish = followUpLanguageMode !== "urdu_only";
                  return (
                    <tr key={f.id} className="border-t border-[#cbd5e1] align-top">
                      <Td className="font-semibold">{f.service}</Td>
                      <Td>{f.timingLabel}</Td>
                      <Td>
                        <BilingualLine
                          en={showEnglish ? f.purpose : undefined}
                          ur={showUrdu ? f.purposeUr : undefined}
                          bothShown={showUrdu && showEnglish}
                        />
                      </Td>
                      <Td>
                        <BilingualLine
                          en={showEnglish ? f.instructions : undefined}
                          ur={showUrdu ? f.instructionsUr : undefined}
                          bothShown={showUrdu && showEnglish}
                        />
                        {f.pendingResultReview && (
                          <span className="mt-0.5 block text-[#b45309]">Pending result review</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        )}

        {content.growth.showOnPrint && (
          <Section title="Growth">
            <p>
              Weight {content.growth.weightKg} kg
              {content.growth.heightCm ? ` · Height ${content.growth.heightCm} cm` : ""}
              {content.growth.bmi ? ` · BMI ${content.growth.bmi}` : ""}
              {content.growth.muacCm ? ` · MUAC ${content.growth.muacCm} cm` : ""}
            </p>
            {/* The same WHO percentile-curve charts the workspace Growth page
                shows — not just the Z-score text — so a signed discharge
                carries the actual chart, not a number a parent/referring
                clinician has to trust blind. */}
            {(wfa || lhfa || bfa || hcfa) && (
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {wfa && (
                  <GrowthIndicatorCard
                    title="Weight-for-age"
                    result={wfa}
                    table={WFA_LMS}
                    sex={growthSex!}
                    ageMonths={growthAgeMonths}
                    value={content.growth.weightKg}
                    unit="kg"
                  />
                )}
                {lhfa && content.growth.heightCm && (
                  <GrowthIndicatorCard
                    title="Height/Length-for-age"
                    result={lhfa}
                    table={LHFA_LMS}
                    sex={growthSex!}
                    ageMonths={growthAgeMonths}
                    value={content.growth.heightCm}
                    unit="cm"
                  />
                )}
                {bfa && content.growth.bmi && (
                  <GrowthIndicatorCard
                    title="BMI-for-age"
                    result={bfa}
                    table={BFA_LMS}
                    sex={growthSex!}
                    ageMonths={growthAgeMonths}
                    value={content.growth.bmi}
                    unit="kg/m²"
                  />
                )}
                {hcfa && content.growth.headCircumferenceCm && (
                  <GrowthIndicatorCard
                    title="Head circumference-for-age"
                    result={hcfa}
                    table={HCFA_LMS}
                    sex={growthSex!}
                    ageMonths={growthAgeMonths}
                    value={content.growth.headCircumferenceCm}
                    unit="cm"
                  />
                )}
              </div>
            )}
            {content.growth.whoInterpretation && <p className="mt-1 text-[#475569]">{content.growth.whoInterpretation}</p>}
          </Section>
        )}

        {content.immunization.status !== "not_assessed" && (
          <Section title="Immunization">
            <p>
              {IMMUNIZATION_LABELS[content.immunization.status]}
              {content.immunization.vaccinesDue ? ` — Due: ${content.immunization.vaccinesDue}` : ""}
            </p>
            {content.immunization.note && <p className="text-[#475569]">{content.immunization.note}</p>}
          </Section>
        )}

        {content.pendingTests.length > 0 && (
          <Section title="Pending Investigations">
            <ul className="list-disc space-y-0.5 pl-4">
              {content.pendingTests.map((t) => (
                <li key={t.id}>
                  <span className="font-semibold">{t.test}</span> — {t.followUpAction}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <footer className="mt-6 border-t border-[#cbd5e1] pt-2 text-[10px] text-[#64748b]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="size-3" /> {identity.contactAddress}
          </span>
          <span>Prepared by {discharge.preparedByName}</span>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-1 border-b border-[#e2e8f0] pb-0.5 text-[11.5px] font-bold uppercase tracking-wide text-[#334155]">
        {title}
      </h2>
      <div className="text-[12px] leading-snug">{children}</div>
    </section>
  );
}

function IdCell({ label, value }: { label: string; value: string }) {
  return (
    <td className="border border-[#cbd5e1] px-2 py-1">
      <span className="mr-1 text-[9.5px] uppercase tracking-wide text-[#64748b]">{label}:</span>
      <span className="font-semibold">{value}</span>
    </td>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-[#cbd5e1] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-2 py-1.5 " + (className ?? "")}>{children}</td>;
}

function EmptyLine() {
  return <p className="text-[#94a3b8]">Not yet documented.</p>;
}
