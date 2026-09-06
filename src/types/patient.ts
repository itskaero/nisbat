/**
 * Patient → Admission are the two entities above Discharge in the core domain model.
 * A Patient can have many Admissions; an Admission can have many Discharge revisions
 * over time (see discharge.ts) but only one "live" discharge workflow at once.
 */

export type Sex = "male" | "female" | "other";

export interface Patient {
  id: string;
  mrNumber: string;
  name: string;
  fatherGuardianName: string;
  dob: string; // ISO date
  sex: Sex;
  contactPhone?: string;
  address?: string;
}

export type AllergyStatus = "documented" | "none_known" | "not_documented";

export interface AllergyRecord {
  status: AllergyStatus;
  allergies: string[]; // e.g. ["Penicillin"]
}

export type AdmissionStatus = "active" | "discharged";

export interface Admission {
  id: string;
  patientId: string;
  admissionDate: string; // ISO date — DOA
  dischargeDate?: string; // ISO date — DOD, set on completion
  wardBed: string;
  reasonForAdmission: string;
  weightKg: number;
  heightCm?: number;
  lengthCm?: number; // for infants, recumbent length
  headCircumferenceCm?: number;
  allergy: AllergyRecord;
  alerts: string[]; // subtle clinical alerts shown in sticky banner, e.g. "High Alert"
  status: AdmissionStatus;
}

export function calculateAgeLabel(dob: string, atDate: string = new Date().toISOString()): string {
  const birth = new Date(dob);
  const at = new Date(atDate);
  let years = at.getFullYear() - birth.getFullYear();
  let months = at.getMonth() - birth.getMonth();
  let days = at.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(at.getFullYear(), at.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years >= 2) return `${years}y`;
  if (years === 1) return months > 0 ? `1y ${months}m` : `1y`;
  if (months >= 1) return `${months}m`;
  return `${Math.max(days, 0)}d`;
}

export function ageInDays(dob: string, atDate: string = new Date().toISOString()): number {
  const birth = new Date(dob);
  const at = new Date(atDate);
  return Math.floor((at.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

export function isInfant(dob: string, atDate: string = new Date().toISOString()): boolean {
  const birth = new Date(dob);
  const at = new Date(atDate);
  const months =
    (at.getFullYear() - birth.getFullYear()) * 12 + (at.getMonth() - birth.getMonth());
  return months < 12;
}

export function isNeonate(dob: string, atDate: string = new Date().toISOString()): boolean {
  const birth = new Date(dob);
  const at = new Date(atDate);
  const days = Math.floor((at.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  return days <= 28;
}
