import type {
  Patient,
  Admission,
  Drug,
  Formulation,
  DoseRule,
  AdvicePack,
  FollowUpModule,
  InvestigationPanel,
  FrequencyPhrase,
  VocabularyList,
  ClinicalTemplate,
  InstitutionalSettings,
  AppUser,
} from "@/types";
import { emptyExaminationRecord, emptyDischargeContent, emptyHistoryCategories, type Discharge } from "@/types";
import { genId } from "@/lib/utils";
import { FREQUENCY_OPTIONS } from "@/lib/frequency";
import { EXAM_CHIPS, PRESENTING_COMPLAINT_CHIPS, HISTORY_CHIPS } from "@/lib/clinical-vocab";

// Note: deliberately no password/passwordHash field here — this file is
// imported by the client-side store (for CLINICAL_TEMPLATES), so secrets
// never belong in it. Default seed passwords live only in prisma/seed.ts,
// which hashes them before they ever touch the database.
export const USERS: AppUser[] = [
  { id: "u_rehan", name: "Dr. Rehan Malik", role: "pgr_mo", designation: "PGR, Pediatrics", username: "rehan.malik", active: true },
  { id: "u_ayesha", name: "Dr. Ayesha Khan", role: "pgr_mo", designation: "MO, Pediatrics", username: "ayesha.khan", active: true },
  {
    id: "u_faisal",
    name: "Prof. Faisal Nadeem",
    role: "sr_faculty",
    designation: "Associate Professor, Pediatrics",
    username: "faisal.nadeem",
    active: true,
  },
  { id: "u_admin", name: "Zainab Aslam", role: "admin", designation: "Administrator", username: "admin", active: true },
];

export const INSTITUTIONAL_SETTINGS: InstitutionalSettings = {
  hospitalName: "Shifa Children's Hospital",
  department: "Department of Pediatrics",
  hodName: "Prof. Dr. Nasreen Aslam",
  contactPhone: "+92 42 111 456 789",
  contactAddress: "Jail Road, Lahore, Pakistan",
  defaultPaperSize: "A4",
  defaultParentLanguage: "urdu_english",
};

export const CLINICAL_TEMPLATES: ClinicalTemplate[] = [
  {
    id: "standard_pediatric",
    name: "Standard Pediatric",
    description: "Default template for routine pediatric admissions.",
    emphasizedSections: ["diagnosis", "examination", "medications", "advice"],
  },
  {
    id: "infant_neonatal",
    name: "Infant / Neonatal",
    description: "Emphasizes growth, feeding and neonatal-specific fields.",
    emphasizedSections: ["growth", "immunization", "advice", "followUp"],
  },
  {
    id: "complex_long_stay",
    name: "Complex / Long Stay",
    description: "Expanded hospital course and multi-item reconciliation for complex admissions.",
    emphasizedSections: ["treatment", "clinicalCourse", "reconciliation", "followUp", "pendingTests"],
  },
];

// ---- Formulary ---------------------------------------------------------

export const DRUGS: Drug[] = [
  { id: "d_paracetamol", name: "Paracetamol", genericClass: "Analgesic/Antipyretic", formulary: "both" },
  { id: "d_amoxicillin", name: "Amoxicillin", genericClass: "Penicillin antibiotic", formulary: "both" },
  { id: "d_salbutamol", name: "Salbutamol", genericClass: "Bronchodilator", formulary: "both" },
  { id: "d_ors", name: "Oral Rehydration Salts", genericClass: "Rehydration", formulary: "both" },
  { id: "d_ceftriaxone", name: "Ceftriaxone", genericClass: "Cephalosporin antibiotic", formulary: "hospital" },
  { id: "d_ironsyrup", name: "Ferrous Sulphate", genericClass: "Iron supplement", formulary: "both" },
  { id: "d_vitd", name: "Vitamin D3", genericClass: "Vitamin supplement", formulary: "both" },
  { id: "d_ondansetron", name: "Ondansetron", genericClass: "Antiemetic", formulary: "both" },
  { id: "d_cefixime", name: "Cefixime", genericClass: "Cephalosporin antibiotic", formulary: "both" },
  { id: "d_azithromycin", name: "Azithromycin", genericClass: "Macrolide antibiotic", formulary: "both" },
  { id: "d_domperidone", name: "Domperidone", genericClass: "Prokinetic/Antiemetic", formulary: "both" },
  { id: "d_metronidazole", name: "Metronidazole", genericClass: "Antiprotozoal/Antibiotic", formulary: "both" },
  { id: "d_prednisolone", name: "Prednisolone", genericClass: "Corticosteroid", formulary: "hospital" },
  { id: "d_zinc", name: "Zinc Sulfate", genericClass: "Mineral supplement", formulary: "both" },
  { id: "d_cetirizine", name: "Cetirizine", genericClass: "Antihistamine", formulary: "both" },
  { id: "d_ibuprofen", name: "Ibuprofen", genericClass: "NSAID/Antipyretic", formulary: "both" },
  {
    id: "d_coamoxiclav",
    name: "Co-amoxiclav (Amoxicillin/Clavulanate)",
    genericClass: "Penicillin antibiotic (beta-lactamase inhibitor combination)",
    formulary: "both",
  },
  { id: "d_nystatin", name: "Nystatin", genericClass: "Antifungal (oral)", formulary: "both" },
  { id: "d_levetiracetam", name: "Levetiracetam", genericClass: "Anticonvulsant", formulary: "hospital" },
  { id: "d_multivitamin", name: "Multivitamin Syrup", genericClass: "Vitamin supplement", formulary: "both" },
  { id: "d_loratadine", name: "Loratadine", genericClass: "Antihistamine (non-sedating)", formulary: "both" },

  // --- Batch 2 (formulary expansion, ~150-drug target) — Cardiac + Emergency + Anti-TB ---
  { id: "d_digoxin", name: "Digoxin", genericClass: "Cardiac glycoside", formulary: "hospital" },
  { id: "d_furosemide", name: "Furosemide", genericClass: "Loop diuretic", formulary: "both" },
  { id: "d_spironolactone", name: "Spironolactone", genericClass: "Potassium-sparing diuretic", formulary: "both" },
  { id: "d_captopril", name: "Captopril", genericClass: "ACE inhibitor", formulary: "hospital" },
  { id: "d_enalapril", name: "Enalapril", genericClass: "ACE inhibitor", formulary: "both" },
  { id: "d_losartan", name: "Losartan", genericClass: "Angiotensin receptor blocker", formulary: "both" },
  { id: "d_metoprolol", name: "Metoprolol", genericClass: "Beta blocker", formulary: "both" },
  { id: "d_propranolol", name: "Propranolol", genericClass: "Beta blocker", formulary: "both" },
  { id: "d_amiodarone", name: "Amiodarone", genericClass: "Class III antiarrhythmic", formulary: "hospital" },
  { id: "d_aspirin", name: "Aspirin", genericClass: "Antiplatelet/anti-inflammatory (salicylate)", formulary: "both" },
  { id: "d_sildenafil", name: "Sildenafil", genericClass: "Pulmonary vasodilator (PDE5 inhibitor)", formulary: "hospital" },
  { id: "d_warfarin", name: "Warfarin", genericClass: "Vitamin K antagonist anticoagulant", formulary: "hospital" },
  { id: "d_enoxaparin", name: "Enoxaparin", genericClass: "Low-molecular-weight heparin", formulary: "hospital" },
  { id: "d_adrenaline", name: "Adrenaline (Epinephrine)", genericClass: "Emergency sympathomimetic", formulary: "hospital" },
  { id: "d_activated_charcoal", name: "Activated Charcoal", genericClass: "Adsorbent (poisoning)", formulary: "hospital" },
  { id: "d_isoniazid", name: "Isoniazid", genericClass: "Anti-tuberculous", formulary: "both" },
  { id: "d_rifampicin", name: "Rifampicin", genericClass: "Anti-tuberculous", formulary: "both" },
  { id: "d_pyrazinamide", name: "Pyrazinamide", genericClass: "Anti-tuberculous", formulary: "both" },
  { id: "d_ethambutol", name: "Ethambutol", genericClass: "Anti-tuberculous", formulary: "both" },

  // --- Batch 3 (formulary expansion) — remaining systemic antibiotics ---
  { id: "d_ampicillin", name: "Ampicillin", genericClass: "Penicillin antibiotic", formulary: "hospital" },
  { id: "d_cloxacillin", name: "Cloxacillin", genericClass: "Penicillin antibiotic (beta-lactamase resistant)", formulary: "both" },
  { id: "d_benzylpenicillin", name: "Benzylpenicillin (Penicillin G)", genericClass: "Penicillin antibiotic", formulary: "hospital" },
  { id: "d_cephradine", name: "Cephradine", genericClass: "Cephalosporin antibiotic (1st gen)", formulary: "both" },
  { id: "d_cefuroxime", name: "Cefuroxime", genericClass: "Cephalosporin antibiotic (2nd gen)", formulary: "both" },
  { id: "d_cefpodoxime", name: "Cefpodoxime", genericClass: "Cephalosporin antibiotic (3rd gen)", formulary: "both" },
  { id: "d_cefotaxime", name: "Cefotaxime", genericClass: "Cephalosporin antibiotic (3rd gen)", formulary: "hospital" },
  { id: "d_ceftazidime", name: "Ceftazidime", genericClass: "Cephalosporin antibiotic (3rd gen)", formulary: "hospital" },
  { id: "d_cefaclor", name: "Cefaclor", genericClass: "Cephalosporin antibiotic (2nd gen)", formulary: "both" },
  { id: "d_cefdinir", name: "Cefdinir", genericClass: "Cephalosporin antibiotic (3rd gen)", formulary: "both" },
  { id: "d_cefepime", name: "Cefepime", genericClass: "Cephalosporin antibiotic (4th gen)", formulary: "hospital" },
  { id: "d_clarithromycin", name: "Clarithromycin", genericClass: "Macrolide antibiotic", formulary: "both" },
  { id: "d_erythromycin", name: "Erythromycin", genericClass: "Macrolide antibiotic", formulary: "both" },
  { id: "d_clindamycin", name: "Clindamycin", genericClass: "Lincosamide antibiotic", formulary: "both" },
  { id: "d_vancomycin", name: "Vancomycin", genericClass: "Glycopeptide antibiotic", formulary: "hospital" },
  { id: "d_gentamicin", name: "Gentamicin", genericClass: "Aminoglycoside antibiotic", formulary: "hospital" },
  { id: "d_amikacin", name: "Amikacin", genericClass: "Aminoglycoside antibiotic", formulary: "hospital" },
  { id: "d_meropenem", name: "Meropenem", genericClass: "Carbapenem antibiotic", formulary: "hospital" },
  { id: "d_pip_tazo", name: "Piperacillin/Tazobactam", genericClass: "Penicillin antibiotic (beta-lactamase inhibitor combination)", formulary: "hospital" },
  { id: "d_cotrimoxazole", name: "Co-trimoxazole", genericClass: "Sulfonamide + folate antagonist combination", formulary: "both" },
  { id: "d_nitrofurantoin", name: "Nitrofurantoin", genericClass: "Urinary antiseptic", formulary: "both" },
  { id: "d_doxycycline", name: "Doxycycline", genericClass: "Tetracycline antibiotic", formulary: "both" },
  { id: "d_chloramphenicol", name: "Chloramphenicol", genericClass: "Antibiotic (broad-spectrum)", formulary: "hospital" },
  { id: "d_linezolid", name: "Linezolid", genericClass: "Oxazolidinone antibiotic", formulary: "hospital" },
  { id: "d_colistin", name: "Colistin", genericClass: "Polymyxin antibiotic", formulary: "hospital" },
  { id: "d_fosfomycin", name: "Fosfomycin", genericClass: "Phosphonic acid antibiotic", formulary: "both" },

  // --- Batch 4 (formulary expansion) — GI/electrolyte + Antifungals/Antiparasitics ---
  { id: "d_famotidine", name: "Famotidine", genericClass: "H2-receptor antagonist", formulary: "both" },
  { id: "d_omeprazole", name: "Omeprazole", genericClass: "Proton pump inhibitor", formulary: "both" },
  { id: "d_lactulose", name: "Lactulose", genericClass: "Osmotic laxative", formulary: "both" },
  { id: "d_simethicone", name: "Simethicone", genericClass: "Antiflatulent", formulary: "both" },
  { id: "d_racecadotril", name: "Racecadotril", genericClass: "Antisecretory antidiarrheal", formulary: "both" },
  { id: "d_sboulardii", name: "Saccharomyces boulardii", genericClass: "Probiotic", formulary: "both" },
  { id: "d_sucralfate", name: "Sucralfate", genericClass: "Mucosal protectant", formulary: "both" },
  { id: "d_ursodeoxycholic", name: "Ursodeoxycholic Acid", genericClass: "Bile acid (cholestasis)", formulary: "hospital" },
  { id: "d_metoclopramide", name: "Metoclopramide", genericClass: "Prokinetic/Antiemetic", formulary: "hospital" },
  { id: "d_potassium_chloride", name: "Potassium Chloride", genericClass: "Electrolyte supplement", formulary: "hospital" },
  { id: "d_hyoscine", name: "Hyoscine Butylbromide", genericClass: "Antispasmodic", formulary: "both" },
  { id: "d_sodium_bicarbonate", name: "Sodium Bicarbonate", genericClass: "Alkalinizing agent", formulary: "hospital" },

  // --- Batch 4b: Antifungals/Antiparasitics ---
  { id: "d_fluconazole", name: "Fluconazole", genericClass: "Antifungal (triazole)", formulary: "both" },
  { id: "d_griseofulvin", name: "Griseofulvin", genericClass: "Antifungal", formulary: "both" },
  { id: "d_albendazole", name: "Albendazole", genericClass: "Anthelmintic", formulary: "both" },
  { id: "d_mebendazole", name: "Mebendazole", genericClass: "Anthelmintic", formulary: "both" },
  { id: "d_tinidazole", name: "Tinidazole", genericClass: "Antiprotozoal", formulary: "both" },
  { id: "d_ivermectin", name: "Ivermectin", genericClass: "Anthelmintic/Antiparasitic", formulary: "both" },
  { id: "d_praziquantel", name: "Praziquantel", genericClass: "Anthelmintic (anti-schistosomal)", formulary: "hospital" },
  { id: "d_amphotericin_b", name: "Amphotericin B", genericClass: "Antifungal (polyene)", formulary: "hospital" },

  // --- Batch 5 (formulary expansion) — Anticonvulsants/Neuro + Steroids + Endocrine ---
  { id: "d_valproate", name: "Sodium Valproate", genericClass: "Anticonvulsant", formulary: "hospital" },
  { id: "d_carbamazepine", name: "Carbamazepine", genericClass: "Anticonvulsant", formulary: "hospital" },
  { id: "d_phenytoin", name: "Phenytoin", genericClass: "Anticonvulsant", formulary: "hospital" },
  { id: "d_phenobarbitone", name: "Phenobarbitone", genericClass: "Anticonvulsant", formulary: "hospital" },
  { id: "d_clobazam", name: "Clobazam", genericClass: "Anticonvulsant (benzodiazepine)", formulary: "hospital" },
  { id: "d_lamotrigine", name: "Lamotrigine", genericClass: "Anticonvulsant", formulary: "hospital" },
  { id: "d_topiramate", name: "Topiramate", genericClass: "Anticonvulsant", formulary: "hospital" },
  { id: "d_diazepam", name: "Diazepam", genericClass: "Anticonvulsant/Sedative (benzodiazepine)", formulary: "hospital" },
  { id: "d_midazolam", name: "Midazolam", genericClass: "Sedative (benzodiazepine)", formulary: "hospital" },
  { id: "d_baclofen", name: "Baclofen", genericClass: "Muscle relaxant (spasticity)", formulary: "hospital" },
  { id: "d_melatonin", name: "Melatonin", genericClass: "Sleep aid", formulary: "both" },
  { id: "d_dexamethasone", name: "Dexamethasone", genericClass: "Corticosteroid", formulary: "hospital" },
  { id: "d_hydrocortisone", name: "Hydrocortisone", genericClass: "Corticosteroid", formulary: "hospital" },
  { id: "d_deflazacort", name: "Deflazacort", genericClass: "Corticosteroid", formulary: "hospital" },
  { id: "d_insulin", name: "Insulin", genericClass: "Antidiabetic hormone", formulary: "hospital" },
  { id: "d_levothyroxine", name: "Levothyroxine", genericClass: "Thyroid hormone replacement", formulary: "both" },
  { id: "d_fludrocortisone", name: "Fludrocortisone", genericClass: "Mineralocorticoid", formulary: "hospital" },

  // --- Batch 6 (formulary expansion) — Analgesics + Respiratory + Antihistamines + Vitamins/Hematology/Neonatal ---
  { id: "d_mefenamic", name: "Mefenamic Acid", genericClass: "NSAID", formulary: "both" },
  { id: "d_diclofenac", name: "Diclofenac", genericClass: "NSAID", formulary: "both" },
  { id: "d_ketorolac", name: "Ketorolac", genericClass: "NSAID (short-course parenteral)", formulary: "hospital" },
  { id: "d_montelukast", name: "Montelukast", genericClass: "Leukotriene receptor antagonist", formulary: "both" },
  { id: "d_terbutaline", name: "Terbutaline", genericClass: "Bronchodilator", formulary: "both" },
  { id: "d_carbocisteine", name: "Carbocisteine", genericClass: "Mucolytic", formulary: "both" },
  { id: "d_theophylline", name: "Theophylline", genericClass: "Bronchodilator (methylxanthine)", formulary: "hospital" },
  { id: "d_aminophylline", name: "Aminophylline", genericClass: "Bronchodilator (methylxanthine)", formulary: "hospital" },
  { id: "d_chlorpheniramine", name: "Chlorpheniramine", genericClass: "Antihistamine (sedating)", formulary: "both" },
  { id: "d_diphenhydramine", name: "Diphenhydramine", genericClass: "Antihistamine (sedating)", formulary: "both" },
  { id: "d_levocetirizine", name: "Levocetirizine", genericClass: "Antihistamine (non-sedating)", formulary: "both" },
  { id: "d_fexofenadine", name: "Fexofenadine", genericClass: "Antihistamine (non-sedating)", formulary: "both" },
  { id: "d_promethazine", name: "Promethazine", genericClass: "Antihistamine (sedating)", formulary: "hospital" },
  { id: "d_vitk1", name: "Vitamin K1 (Phytomenadione)", genericClass: "Vitamin (neonatal prophylaxis)", formulary: "hospital" },
  { id: "d_vitb_complex", name: "Vitamin B Complex", genericClass: "Vitamin supplement", formulary: "both" },
  { id: "d_folic_acid", name: "Folic Acid", genericClass: "Vitamin supplement", formulary: "both" },
  { id: "d_vita", name: "Vitamin A", genericClass: "Vitamin supplement", formulary: "both" },
  { id: "d_pyridoxine", name: "Pyridoxine (Vitamin B6)", genericClass: "Vitamin supplement", formulary: "both" },
  { id: "d_caffeine_citrate", name: "Caffeine Citrate", genericClass: "Respiratory stimulant (neonatal apnea)", formulary: "hospital" },

  // --- Batch 7 (type-extension) — Topicals/Ophthalmic (dosed by instruction,
  // not a calculable mg amount — see FormulationForm/DoseBasis additions)
  // + Nebulized respiratory drugs ---
  { id: "d_fusidic_acid", name: "Fusidic Acid", genericClass: "Topical antibiotic", formulary: "both" },
  { id: "d_mupirocin", name: "Mupirocin", genericClass: "Topical antibiotic", formulary: "both" },
  { id: "d_clotrimazole", name: "Clotrimazole", genericClass: "Topical antifungal", formulary: "both" },
  { id: "d_hydrocortisone_topical", name: "Hydrocortisone (Topical)", genericClass: "Topical corticosteroid", formulary: "both" },
  { id: "d_betamethasone_topical", name: "Betamethasone (Topical)", genericClass: "Topical corticosteroid (potent)", formulary: "hospital" },
  { id: "d_silver_sulfadiazine", name: "Silver Sulfadiazine", genericClass: "Topical antibiotic (burn dressing)", formulary: "hospital" },
  { id: "d_permethrin", name: "Permethrin", genericClass: "Topical scabicide/pediculicide", formulary: "both" },
  { id: "d_calamine", name: "Calamine", genericClass: "Topical antipruritic", formulary: "both" },
  { id: "d_chloramphenicol_eye", name: "Chloramphenicol (Eye)", genericClass: "Ophthalmic antibiotic", formulary: "both" },
  { id: "d_tobramycin_eye", name: "Tobramycin (Eye)", genericClass: "Ophthalmic antibiotic", formulary: "hospital" },
  { id: "d_budesonide_neb", name: "Budesonide (Nebulized)", genericClass: "Inhaled corticosteroid", formulary: "hospital" },
  { id: "d_ipratropium", name: "Ipratropium Bromide", genericClass: "Bronchodilator (anticholinergic)", formulary: "hospital" },
];

export const FORMULATIONS: Formulation[] = [
  { id: "f_paracetamol_120_5", drugId: "d_paracetamol", form: "syrup", strengthLabel: "120 mg/5 mL", mgPerMl: 24, brandNames: ["Panadol", "Calpol", "Fevadol"] },
  { id: "f_paracetamol_250_5", drugId: "d_paracetamol", form: "syrup", strengthLabel: "250 mg/5 mL", mgPerMl: 50, brandNames: ["Calpol"] },
  { id: "f_paracetamol_500_tab", drugId: "d_paracetamol", form: "tablet", strengthLabel: "500 mg tablet", mgPerUnit: 500, brandNames: ["Panadol"] },

  { id: "f_amox_125_5", drugId: "d_amoxicillin", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Amoxil"] },
  { id: "f_amox_250_5", drugId: "d_amoxicillin", form: "suspension", strengthLabel: "250 mg/5 mL", mgPerMl: 50, brandNames: ["Amoxil"] },
  { id: "f_amox_250_cap", drugId: "d_amoxicillin", form: "capsule", strengthLabel: "250 mg capsule", mgPerUnit: 250, brandNames: ["Amoxil"] },

  { id: "f_salbutamol_2_5", drugId: "d_salbutamol", form: "syrup", strengthLabel: "2 mg/5 mL", mgPerMl: 0.4, brandNames: ["Ventolin"] },

  // No brand names: WHO-formula ORS sachets are frequently co-marketed with added
  // zinc/probiotics/vitamins under the same-sounding brand (e.g. Orapro, ORP) —
  // without a confirmed plain-WHO-formula Pakistani match, listing one here would
  // risk implying an added-ingredient product is this exact formulation (rule 4).
  { id: "f_ors_sachet", drugId: "d_ors", form: "sachet", strengthLabel: "ORS sachet (1 L)" },

  { id: "f_ceftriaxone_1g_inj", drugId: "d_ceftriaxone", form: "injection", strengthLabel: "1 g vial", mgPerUnit: 1000, brandNames: ["Rocephin", "Cefxone"] },

  // No brand names: the Pakistani ferrous-sulphate products found are combination
  // products (added folic acid/multivitamins) rather than a confirmed plain
  // elemental-iron-only match at this exact 30 mg/5 mL strength.
  { id: "f_iron_syrup_30_5", drugId: "d_ironsyrup", form: "syrup", strengthLabel: "30 mg elemental Fe/5 mL", mgPerMl: 6 },

  { id: "f_vitd_400_drops", drugId: "d_vitd", form: "drops", strengthLabel: "400 IU/mL drops", mgPerMl: 400, brandNames: ["UVI-D", "D-Max", "SunnyD"] },

  { id: "f_ondansetron_4_5", drugId: "d_ondansetron", form: "syrup", strengthLabel: "4 mg/5 mL", mgPerMl: 0.8, brandNames: ["Onseron"] },

  { id: "f_cefixime_100_5", drugId: "d_cefixime", form: "suspension", strengthLabel: "100 mg/5 mL", mgPerMl: 20, brandNames: ["Cefspan", "Cefiget"] },

  { id: "f_azithro_200_5", drugId: "d_azithromycin", form: "suspension", strengthLabel: "200 mg/5 mL", mgPerMl: 40, brandNames: ["Azomax", "Zetro"] },

  { id: "f_domperidone_5_5", drugId: "d_domperidone", form: "syrup", strengthLabel: "5 mg/5 mL", mgPerMl: 1, brandNames: ["Motilium"] },

  // No brand names: searches consistently surfaced Pakistani metronidazole brands
  // at 200 mg/5 mL (e.g. Flagyl), not a confirmed match at this 125 mg/5 mL strength.
  { id: "f_metronidazole_125_5", drugId: "d_metronidazole", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25 },

  { id: "f_prednisolone_15_5", drugId: "d_prednisolone", form: "syrup", strengthLabel: "15 mg/5 mL", mgPerMl: 3, brandNames: ["Rapicort", "Steron"] },

  { id: "f_zinc_20_5", drugId: "d_zinc", form: "syrup", strengthLabel: "20 mg/5 mL", mgPerMl: 4, brandNames: ["Zincat-OD", "Zincol"] },

  { id: "f_cetirizine_5_5", drugId: "d_cetirizine", form: "syrup", strengthLabel: "5 mg/5 mL", mgPerMl: 1, brandNames: ["Cetzine", "Zyrtec"] },

  { id: "f_ibuprofen_100_5", drugId: "d_ibuprofen", form: "syrup", strengthLabel: "100 mg/5 mL", mgPerMl: 20, brandNames: ["Brufen", "Nurofen"] },

  // Combination drug — always dosed by the amoxicillin component only, never the
  // combined total, per standard pediatric practice. mgPerMl below is the
  // AMOXICILLIN component's own concentration (125 mg/5 mL = 25 mg/mL) — the
  // strengthLabel spells out both components explicitly so this is never
  // ambiguous (CLAUDE.md rule 4/5: exact concentration must be explicit, not
  // assumed from a combination product's headline number).
  {
    id: "f_coamoxiclav_156_5",
    drugId: "d_coamoxiclav",
    form: "suspension",
    strengthLabel: "156.25 mg/5 mL (125 mg amoxicillin + 31.25 mg clavulanic acid per 5 mL) — dosed by amoxicillin component",
    mgPerMl: 25,
    brandNames: ["Augmentin", "Amclav"],
  },

  // Nystatin's potency is measured in units, not mg — mgPerMl below numerically
  // represents 100,000 units/mL, not milligrams. The ratio still resolves to the
  // correct real-world dispensed volume; only the internal field name is a unit
  // mismatch, and it is never shown raw — strengthLabel and finalDoseLabel are
  // each independently correct ("100,000 units/mL" and "1 mL").
  { id: "f_nystatin_100000_ml", drugId: "d_nystatin", form: "suspension", strengthLabel: "100,000 units/mL", mgPerMl: 100000, brandNames: ["Nystat"] },

  { id: "f_levetiracetam_100_ml", drugId: "d_levetiracetam", form: "syrup", strengthLabel: "100 mg/mL", mgPerMl: 100, brandNames: ["Recetam", "Levic"] },

  // Generic multivitamin blend — no single active ingredient's "mg" is
  // clinically meaningful, so this models a fixed 5 mL dose directly
  // (fixedMg: 5 with mgPerMl: 1 resolves to exactly 5 mL, never a real
  // milligram figure — same plumbing-only convention as Nystatin above).
  { id: "f_multivitamin_std", drugId: "d_multivitamin", form: "syrup", strengthLabel: "Multivitamin syrup (5 mL standard dose)", mgPerMl: 1, brandNames: ["BioGrow", "Vitamax"] },

  { id: "f_loratadine_5_5", drugId: "d_loratadine", form: "syrup", strengthLabel: "5 mg/5 mL", mgPerMl: 1, brandNames: ["Lorel", "Softin"] },

  // --- Batch 2: Cardiac + Emergency + Anti-TB ---
  // [HIGH-RISK] narrow therapeutic index — see the dose rule's own comment.
  { id: "f_digoxin_025_tab", drugId: "d_digoxin", form: "tablet", strengthLabel: "0.25 mg (250 mcg) tablet", mgPerUnit: 0.25, brandNames: ["Lanoxin"] },

  { id: "f_furosemide_40_tab", drugId: "d_furosemide", form: "tablet", strengthLabel: "40 mg tablet", mgPerUnit: 40, brandNames: ["Lasix"] },

  { id: "f_spironolactone_25_tab", drugId: "d_spironolactone", form: "tablet", strengthLabel: "25 mg tablet", mgPerUnit: 25, brandNames: ["Aldactone-A"] },

  { id: "f_captopril_25_tab", drugId: "d_captopril", form: "tablet", strengthLabel: "25 mg tablet", mgPerUnit: 25, brandNames: ["Capoten"] },

  { id: "f_enalapril_5_tab", drugId: "d_enalapril", form: "tablet", strengthLabel: "5 mg tablet", mgPerUnit: 5, brandNames: ["Renitec"] },

  { id: "f_losartan_25_tab", drugId: "d_losartan", form: "tablet", strengthLabel: "25 mg tablet", mgPerUnit: 25, brandNames: ["Losanta"] },

  { id: "f_metoprolol_25_tab", drugId: "d_metoprolol", form: "tablet", strengthLabel: "25 mg tablet", mgPerUnit: 25, brandNames: ["Betaloc"] },

  { id: "f_propranolol_10_tab", drugId: "d_propranolol", form: "tablet", strengthLabel: "10 mg tablet", mgPerUnit: 10, brandNames: ["Inderal"] },

  // [HIGH-RISK] — see dose rule comment.
  { id: "f_amiodarone_200_tab", drugId: "d_amiodarone", form: "tablet", strengthLabel: "200 mg tablet", mgPerUnit: 200, brandNames: ["Cordarone"] },

  { id: "f_aspirin_75_tab", drugId: "d_aspirin", form: "tablet", strengthLabel: "75 mg dispersible tablet", mgPerUnit: 75, brandNames: ["Ecosprin", "Ascard"] },

  // No confirmed Pakistan-market brand found for the oral-suspension form
  // specifically (only the international Revatio/originator name) — left
  // blank rather than guessed, per this project's established convention.
  { id: "f_sildenafil_10_ml", drugId: "d_sildenafil", form: "suspension", strengthLabel: "10 mg/mL oral suspension" },

  { id: "f_warfarin_5_tab", drugId: "d_warfarin", form: "tablet", strengthLabel: "5 mg tablet", mgPerUnit: 5, brandNames: ["Warfin"] },

  // One representative pre-filled-syringe size; real practice rounds to the
  // nearest available syringe (20/40/60/80 mg), not an arbitrary mL volume —
  // flagged here since calculateDose has no "round to nearest stocked size"
  // concept and will compute an exact-but-impractical mL figure.
  { id: "f_enoxaparin_40_04ml", drugId: "d_enoxaparin", form: "injection", strengthLabel: "40 mg/0.4 mL pre-filled syringe", mgPerMl: 100, brandNames: ["Clexane"] },

  { id: "f_adrenaline_1_1ml", drugId: "d_adrenaline", form: "injection", strengthLabel: "1 mg/1 mL ampoule (1:1000)", mgPerMl: 1, brandNames: ["Adrenaline"] },

  // No confirmed Pakistan-market brand found — left blank rather than guessed.
  { id: "f_charcoal_1g_5ml", drugId: "d_activated_charcoal", form: "suspension", strengthLabel: "1 g/5 mL suspension", mgPerMl: 200 },

  { id: "f_isoniazid_100_tab", drugId: "d_isoniazid", form: "tablet", strengthLabel: "100 mg tablet", mgPerUnit: 100, brandNames: ["Unexo"] },

  // No confirmed Pakistan brand name distinct from the generic descriptor —
  // "Rifampicin Syp 100mg/5ml" surfaced as a plain generic listing, not a
  // brand — left blank rather than guessed.
  { id: "f_rifampicin_100_5", drugId: "d_rifampicin", form: "suspension", strengthLabel: "100 mg/5 mL", mgPerMl: 20 },

  { id: "f_pyrazinamide_500_tab", drugId: "d_pyrazinamide", form: "tablet", strengthLabel: "500 mg tablet", mgPerUnit: 500, brandNames: ["Pyrazid"] },

  { id: "f_ethambutol_400_tab", drugId: "d_ethambutol", form: "tablet", strengthLabel: "400 mg tablet", mgPerUnit: 400, brandNames: ["Myambutol"] },

  // --- Batch 3: remaining systemic antibiotics ---
  { id: "f_ampicillin_500_inj", drugId: "d_ampicillin", form: "injection", strengthLabel: "500 mg vial", mgPerUnit: 500, brandNames: ["Amplus"] },

  { id: "f_cloxacillin_125_5", drugId: "d_cloxacillin", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Dawaclox"] },

  // Standard aqueous/crystalline form for acute IV dosing — potency is
  // conventionally expressed in units, not mg (same units-as-ratio
  // convention as Nystatin above); no confirmed Pakistan brand for this
  // specific salt (only the longer-acting Benzathine salt — a different
  // product, different indication — was confirmed), left blank rather
  // than guessed.
  { id: "f_benzylpenicillin_1mu_inj", drugId: "d_benzylpenicillin", form: "injection", strengthLabel: "1 million units vial", mgPerUnit: 1000000 },

  { id: "f_cephradine_125_5", drugId: "d_cephradine", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Velosef"] },

  { id: "f_cefuroxime_125_5", drugId: "d_cefuroxime", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Zinnat"] },

  // Confirmed Pakistani brand ("Cefidox") is at 40 mg/5 mL, not the more
  // commonly quoted 50 mg/5 mL international strength — modeled at the
  // confirmed strength rather than the assumed one.
  { id: "f_cefpodoxime_40_5", drugId: "d_cefpodoxime", form: "suspension", strengthLabel: "40 mg/5 mL", mgPerMl: 8, brandNames: ["Cefidox"] },

  { id: "f_cefotaxime_500_inj", drugId: "d_cefotaxime", form: "injection", strengthLabel: "500 mg vial", mgPerUnit: 500, brandNames: ["Ximatof"] },

  { id: "f_ceftazidime_1g_inj", drugId: "d_ceftazidime", form: "injection", strengthLabel: "1 g vial", mgPerUnit: 1000, brandNames: ["Fortum"] },

  { id: "f_cefaclor_125_5", drugId: "d_cefaclor", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Ceclor", "Cefalor"] },

  // No confirmed Pakistan-market brand found for this exact strength — left
  // blank rather than guessed (only the international Omnicef name surfaced).
  { id: "f_cefdinir_125_5", drugId: "d_cefdinir", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25 },

  { id: "f_cefepime_1g_inj", drugId: "d_cefepime", form: "injection", strengthLabel: "1 g vial", mgPerUnit: 1000, brandNames: ["Maxipime", "Maxpime", "Maxum"] },

  { id: "f_clarithromycin_125_5", drugId: "d_clarithromycin", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Klaricid", "Claritek"] },

  { id: "f_erythromycin_125_5", drugId: "d_erythromycin", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Epthrocin"] },

  { id: "f_clindamycin_75_5", drugId: "d_clindamycin", form: "suspension", strengthLabel: "75 mg/5 mL", mgPerMl: 15, brandNames: ["Dalacin C"] },

  { id: "f_vancomycin_500_inj", drugId: "d_vancomycin", form: "injection", strengthLabel: "500 mg vial", mgPerUnit: 500, brandNames: ["Vinjec"] },

  { id: "f_gentamicin_80_2ml", drugId: "d_gentamicin", form: "injection", strengthLabel: "80 mg/2 mL ampoule", mgPerMl: 40, brandNames: ["Genticyn"] },

  { id: "f_amikacin_500_2ml", drugId: "d_amikacin", form: "injection", strengthLabel: "500 mg/2 mL vial", mgPerMl: 250, brandNames: ["Amikin"] },

  { id: "f_meropenem_1g_inj", drugId: "d_meropenem", form: "injection", strengthLabel: "1 g vial", mgPerUnit: 1000, brandNames: ["Meronem"] },

  // Dosed and labeled by the TOTAL combined product (piperacillin +
  // tazobactam at their fixed 8:1 ratio), matching how this is commonly
  // written in local hospital protocols — not split by component the way
  // Co-amoxiclav is, since the fixed ratio means either convention scales
  // identically; strengthLabel spells out the actual split for clarity.
  { id: "f_pip_tazo_4p5g_inj", drugId: "d_pip_tazo", form: "injection", strengthLabel: "4.5 g vial (4 g piperacillin + 0.5 g tazobactam)", mgPerUnit: 4500, brandNames: ["Tazocin", "Tanzo"] },

  // Dosed by the trimethoprim (TMP) component, per standard reference
  // convention — mgPerMl below is the TMP component only (240 mg/5 mL total
  // = 200 mg sulfamethoxazole + 40 mg TMP, i.e. 8 mg TMP/mL), never the
  // combined total. strengthLabel spells out the full composition.
  { id: "f_cotrimoxazole_240_5", drugId: "d_cotrimoxazole", form: "suspension", strengthLabel: "240 mg/5 mL (200 mg sulfamethoxazole + 40 mg trimethoprim per 5 mL) — dosed by trimethoprim component", mgPerMl: 8, brandNames: ["Septran"] },

  // No confirmed Pakistan-market brand found at this exact strength (the
  // one confirmed match, "Nitrofur", is a Bangladeshi product) — left blank
  // rather than guessed.
  { id: "f_nitrofurantoin_25_5", drugId: "d_nitrofurantoin", form: "suspension", strengthLabel: "25 mg/5 mL", mgPerMl: 5 },

  // Modeled as the confirmed Pakistani capsule strength rather than an
  // unconfirmed suspension strength (doxycycline's usual pediatric
  // restriction to age >=8 years fits a capsule/tablet form regardless).
  { id: "f_doxycycline_100_cap", drugId: "d_doxycycline", form: "capsule", strengthLabel: "100 mg capsule", mgPerUnit: 100, brandNames: ["Vibramycin"] },

  { id: "f_chloramphenicol_125_5", drugId: "d_chloramphenicol", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Polyfine", "MB-CHLOR"] },

  { id: "f_linezolid_100_5", drugId: "d_linezolid", form: "suspension", strengthLabel: "100 mg/5 mL", mgPerMl: 20, brandNames: ["Linzo", "Nezolid"] },

  // strengthLabel reflects the confirmed Pakistani product's own labeling
  // (both the IU potency and its mg colistin-base equivalent).
  { id: "f_colistin_1miu_inj", drugId: "d_colistin", form: "injection", strengthLabel: "1 million IU vial (~80 mg colistin base)", mgPerUnit: 80, brandNames: ["Colistim"] },

  // Adults/adolescents only per standard labeling — see the dose rule's own
  // age gate; not a general pediatric formulation.
  { id: "f_fosfomycin_3g_sachet", drugId: "d_fosfomycin", form: "sachet", strengthLabel: "3 g sachet", mgPerUnit: 3000, brandNames: ["Focin Ultra"] },

  // --- Batch 4: GI/electrolyte ---
  // The liquid suspension form (10 mg/5 mL and 40 mg/5 mL) had its Pakistani
  // drug registration SUSPENDED by DRAP in 2022 (a real regulatory safety
  // action, confirmed directly against dra.gov.pk) — modeled as a tablet
  // instead, not the suspension, for exactly that reason.
  { id: "f_famotidine_20_tab", drugId: "d_famotidine", form: "tablet", strengthLabel: "20 mg tablet", mgPerUnit: 20, brandNames: ["Famot-20", "Nocid"] },

  { id: "f_omeprazole_20_cap", drugId: "d_omeprazole", form: "capsule", strengthLabel: "20 mg capsule", mgPerUnit: 20, brandNames: ["Opril"] },

  { id: "f_lactulose_10g_15ml", drugId: "d_lactulose", form: "syrup", strengthLabel: "10 g/15 mL", mgPerMl: 666.7, brandNames: ["Duphalac"] },

  // No confirmed Pakistan-market brand found at this exact strength — left
  // blank rather than guessed.
  { id: "f_simethicone_40_5", drugId: "d_simethicone", form: "drops", strengthLabel: "40 mg/5 mL", mgPerMl: 8 },

  { id: "f_racecadotril_10_sachet", drugId: "d_racecadotril", form: "sachet", strengthLabel: "10 mg sachet", mgPerUnit: 10, brandNames: ["Hidrasec", "Racedo"] },

  { id: "f_sboulardii_250_sachet", drugId: "d_sboulardii", form: "sachet", strengthLabel: "250 mg sachet", mgPerUnit: 250, brandNames: ["Bioflor", "Enflor"] },

  { id: "f_sucralfate_1g_5ml", drugId: "d_sucralfate", form: "suspension", strengthLabel: "1 g/5 mL", mgPerMl: 200, brandNames: ["Ulsanic"] },

  { id: "f_urso_250_5", drugId: "d_ursodeoxycholic", form: "suspension", strengthLabel: "250 mg/5 mL", mgPerMl: 50, brandNames: ["Urso"] },

  { id: "f_metoclopramide_5_5", drugId: "d_metoclopramide", form: "syrup", strengthLabel: "5 mg/5 mL", mgPerMl: 1, brandNames: ["Maxolon"] },

  // No confirmed Pakistan-market syrup brand found — left blank rather than
  // guessed. Potency is conventionally expressed in mEq, not mg (1 mEq KCl
  // ≈ 74.5 mg) — mgPerMl below numerically represents mEq/mL, same
  // units-as-ratio convention used elsewhere in this file.
  { id: "f_kcl_20meq_15ml", drugId: "d_potassium_chloride", form: "syrup", strengthLabel: "20 mEq/15 mL oral solution", mgPerMl: 1.33 },

  // No confirmed Pakistan-market brand at this specific syrup strength —
  // left blank rather than guessed.
  { id: "f_hyoscine_10_5", drugId: "d_hyoscine", form: "syrup", strengthLabel: "10 mg/5 mL", mgPerMl: 2 },

  // No system dose rule for this drug (see below) — correction of metabolic
  // acidosis is individualized to a measured base deficit, not a per-kg
  // formula, so only the formulation is seeded (mirrors the Insulin
  // precedent). Potency in mEq, not mg (1 mEq ≈ 84 mg) — mgPerMl below
  // numerically represents mEq/mL.
  { id: "f_nahco3_84pct_inj", drugId: "d_sodium_bicarbonate", form: "injection", strengthLabel: "8.4% (1 mEq/mL) injection", mgPerMl: 1 },

  // --- Batch 4b: Antifungals/Antiparasitics ---
  { id: "f_fluconazole_50_5", drugId: "d_fluconazole", form: "suspension", strengthLabel: "50 mg/5 mL", mgPerMl: 10, brandNames: ["Flucal", "Bactocan", "Flucon", "Fluka"] },

  { id: "f_griseofulvin_125_5", drugId: "d_griseofulvin", form: "suspension", strengthLabel: "125 mg/5 mL", mgPerMl: 25, brandNames: ["Grivin"] },

  { id: "f_albendazole_200_5", drugId: "d_albendazole", form: "suspension", strengthLabel: "200 mg/5 mL", mgPerMl: 40, brandNames: ["Zentel"] },

  { id: "f_mebendazole_100_tab", drugId: "d_mebendazole", form: "tablet", strengthLabel: "100 mg chewable tablet", mgPerUnit: 100, brandNames: ["Vermox"] },

  // No confirmed Pakistan-market brand found — left blank rather than guessed.
  { id: "f_tinidazole_500_tab", drugId: "d_tinidazole", form: "tablet", strengthLabel: "500 mg tablet", mgPerUnit: 500 },

  { id: "f_ivermectin_3_tab", drugId: "d_ivermectin", form: "tablet", strengthLabel: "3 mg tablet", mgPerUnit: 3, brandNames: ["Ivermec"] },

  // No confirmed Pakistan-market brand found — left blank rather than guessed.
  { id: "f_praziquantel_600_tab", drugId: "d_praziquantel", form: "tablet", strengthLabel: "600 mg tablet", mgPerUnit: 600 },

  { id: "f_amphotericin_b_50_inj", drugId: "d_amphotericin_b", form: "injection", strengthLabel: "50 mg vial", mgPerUnit: 50, brandNames: ["Amphotret"] },

  // --- Batch 5: Anticonvulsants/Neuro + Steroids + Endocrine ---
  { id: "f_valproate_200_5", drugId: "d_valproate", form: "syrup", strengthLabel: "200 mg/5 mL", mgPerMl: 40, brandNames: ["Epival"] },

  // No confirmed Pakistan-market brand found — left blank rather than guessed.
  { id: "f_carbamazepine_100_5", drugId: "d_carbamazepine", form: "suspension", strengthLabel: "100 mg/5 mL", mgPerMl: 20 },

  // No confirmed Pakistan-market brand found — left blank rather than guessed.
  { id: "f_phenytoin_30_5", drugId: "d_phenytoin", form: "suspension", strengthLabel: "30 mg/5 mL", mgPerMl: 6 },

  // No confirmed Pakistan-market brand found — left blank rather than guessed.
  { id: "f_phenobarbitone_20_5", drugId: "d_phenobarbitone", form: "syrup", strengthLabel: "20 mg/5 mL", mgPerMl: 4 },

  { id: "f_clobazam_10_tab", drugId: "d_clobazam", form: "tablet", strengthLabel: "10 mg tablet", mgPerUnit: 10, brandNames: ["Frisium"] },

  // [HIGH-RISK] Stevens-Johnson syndrome risk with rapid titration — no dose
  // rule for this drug (see below); the correct starting dose depends on
  // whether valproate is co-administered (a much slower titration schedule
  // is required if so) and this app deliberately does not encode that
  // branching, multi-week titration schedule as a single number.
  { id: "f_lamotrigine_25_tab", drugId: "d_lamotrigine", form: "tablet", strengthLabel: "25 mg tablet", mgPerUnit: 25, brandNames: ["Lamictal"] },

  { id: "f_topiramate_25_tab", drugId: "d_topiramate", form: "tablet", strengthLabel: "25 mg tablet", mgPerUnit: 25, brandNames: ["Topamax"] },

  { id: "f_diazepam_2_5", drugId: "d_diazepam", form: "syrup", strengthLabel: "2 mg/5 mL", mgPerMl: 0.4, brandNames: ["Calmpose"] },

  { id: "f_midazolam_5_5ml", drugId: "d_midazolam", form: "injection", strengthLabel: "5 mg/5 mL ampoule", mgPerMl: 1, brandNames: ["Dormicum"] },

  { id: "f_baclofen_10_tab", drugId: "d_baclofen", form: "tablet", strengthLabel: "10 mg tablet", mgPerUnit: 10, brandNames: ["Lioresal"] },

  { id: "f_melatonin_2_tab", drugId: "d_melatonin", form: "tablet", strengthLabel: "2 mg tablet", mgPerUnit: 2, brandNames: ["Somno"] },

  { id: "f_dexamethasone_4_1ml", drugId: "d_dexamethasone", form: "injection", strengthLabel: "4 mg/mL ampoule", mgPerMl: 4, brandNames: ["Decadron", "D.Dron"] },

  { id: "f_hydrocortisone_100_inj", drugId: "d_hydrocortisone", form: "injection", strengthLabel: "100 mg vial", mgPerUnit: 100, brandNames: ["Solu-Cortef"] },

  // No confirmed Pakistan-market brand found (only Bangladeshi/Indian
  // listings surfaced) — left blank rather than guessed.
  { id: "f_deflazacort_6_tab", drugId: "d_deflazacort", form: "tablet", strengthLabel: "6 mg tablet", mgPerUnit: 6 },

  // No system dose rule for this drug (see below) — insulin dosing is
  // individualized/titrated by blood glucose response, never a fixed
  // formula, mirroring the same choice made for Sodium Bicarbonate above.
  { id: "f_insulin_100iu_ml", drugId: "d_insulin", form: "injection", strengthLabel: "100 IU/mL (biphasic 30/70)", mgPerMl: 100, brandNames: ["Novomix"] },

  { id: "f_levothyroxine_25_tab", drugId: "d_levothyroxine", form: "tablet", strengthLabel: "25 mcg tablet", mgPerUnit: 0.025, brandNames: ["Eltroxin", "Thyronorm"] },

  { id: "f_fludrocortisone_01_tab", drugId: "d_fludrocortisone", form: "tablet", strengthLabel: "0.1 mg tablet", mgPerUnit: 0.1, brandNames: ["Florinef"] },

  // --- Batch 6: Analgesics + Respiratory + Antihistamines + Vitamins/Hematology/Neonatal ---
  { id: "f_mefenamic_50_5", drugId: "d_mefenamic", form: "suspension", strengthLabel: "50 mg/5 mL", mgPerMl: 10, brandNames: ["Ponstan"] },

  // Modeled at the confirmed Pakistani suppository strength (25 mg) rather
  // than the originally-planned 12.5 mg, which wasn't confirmed.
  { id: "f_diclofenac_25_supp", drugId: "d_diclofenac", form: "sachet", strengthLabel: "25 mg suppository", mgPerUnit: 25, brandNames: ["Voltral"] },

  { id: "f_ketorolac_30_1ml", drugId: "d_ketorolac", form: "injection", strengthLabel: "30 mg/mL ampoule", mgPerMl: 30, brandNames: ["Toradol", "Tekac"] },

  { id: "f_montelukast_4_sachet", drugId: "d_montelukast", form: "sachet", strengthLabel: "4 mg granules sachet", mgPerUnit: 4, brandNames: ["Montiget", "Singular"] },

  { id: "f_terbutaline_03_5", drugId: "d_terbutaline", form: "syrup", strengthLabel: "0.3 mg/5 mL", mgPerMl: 0.06, brandNames: ["Bricanyl"] },

  // Modeled at the confirmed Pakistani strength (100 mg/5 mL) rather than
  // the originally-planned 125 mg/5 mL, which wasn't confirmed.
  { id: "f_carbocisteine_100_5", drugId: "d_carbocisteine", form: "syrup", strengthLabel: "100 mg/5 mL", mgPerMl: 20, brandNames: ["Carbex"] },

  // No confirmed Pakistan-market brand found — left blank rather than guessed.
  { id: "f_theophylline_150_5", drugId: "d_theophylline", form: "syrup", strengthLabel: "150 mg/5 mL", mgPerMl: 30 },

  { id: "f_aminophylline_250_10ml", drugId: "d_aminophylline", form: "injection", strengthLabel: "250 mg/10 mL ampoule", mgPerMl: 25, brandNames: ["Amphyll"] },

  { id: "f_chlorpheniramine_2_5", drugId: "d_chlorpheniramine", form: "syrup", strengthLabel: "2 mg/5 mL", mgPerMl: 0.4, brandNames: ["Cepiam"] },

  { id: "f_diphenhydramine_125_5", drugId: "d_diphenhydramine", form: "syrup", strengthLabel: "12.5 mg/5 mL", mgPerMl: 2.5, brandNames: ["Adalin"] },

  { id: "f_levocetirizine_25_5", drugId: "d_levocetirizine", form: "syrup", strengthLabel: "2.5 mg/5 mL", mgPerMl: 0.5, brandNames: ["Leviva"] },

  // Adolescent/adult OTC strength — age-gated in the dose rule; a
  // confirmed Pakistani pediatric suspension strength was not found.
  { id: "f_fexofenadine_60_tab", drugId: "d_fexofenadine", form: "tablet", strengthLabel: "60 mg tablet", mgPerUnit: 60, brandNames: ["Telfast", "Fexet"] },

  { id: "f_promethazine_5_5", drugId: "d_promethazine", form: "syrup", strengthLabel: "5 mg/5 mL", mgPerMl: 1, brandNames: ["Phenergan"] },

  // No confirmed Pakistan-market brand found (Konakion confirmed only for
  // Bangladesh) — left blank rather than guessed. Standard neonatal
  // prophylaxis concentration.
  { id: "f_vitk1_1_1ml", drugId: "d_vitk1", form: "injection", strengthLabel: "1 mg/mL ampoule", mgPerMl: 1 },

  // Fixed 5 mL standard dose, same plumbing convention as the Multivitamin
  // formulation above (no single ingredient's "mg" is clinically meaningful
  // for a B-complex blend).
  { id: "f_vitb_complex_std", drugId: "d_vitb_complex", form: "syrup", strengthLabel: "Vitamin B Complex syrup (5 mL standard dose)", mgPerMl: 1, brandNames: ["Surbex"] },

  { id: "f_folic_acid_5_tab", drugId: "d_folic_acid", form: "tablet", strengthLabel: "5 mg tablet", mgPerUnit: 5, brandNames: ["Zafa"] },

  // No confirmed Pakistan-market brand found at this strength — left blank
  // rather than guessed. WHO single-dose deficiency-prevention strength.
  { id: "f_vita_200000_cap", drugId: "d_vita", form: "capsule", strengthLabel: "200,000 IU capsule", mgPerUnit: 200000 },

  { id: "f_pyridoxine_50_tab", drugId: "d_pyridoxine", form: "tablet", strengthLabel: "50 mg tablet", mgPerUnit: 50, brandNames: ["Vita-6"] },

  { id: "f_caffeine_citrate_20_1ml", drugId: "d_caffeine_citrate", form: "injection", strengthLabel: "20 mg/mL (equivalent to 10 mg/mL caffeine base)", mgPerMl: 20, brandNames: ["Peyona"] },

  // --- Batch 7: Topicals/Ophthalmic (no mgPerMl/mgPerUnit — dosed by
  // instruction, see the matching dose rule) + Nebules ---
  { id: "f_fusidic_acid_2pct", drugId: "d_fusidic_acid", form: "topical", strengthLabel: "2% cream", brandNames: ["Fucidin", "Fusimax"] },

  { id: "f_mupirocin_2pct", drugId: "d_mupirocin", form: "topical", strengthLabel: "2% ointment", brandNames: ["Bactroban"] },

  { id: "f_clotrimazole_1pct", drugId: "d_clotrimazole", form: "topical", strengthLabel: "1% cream", brandNames: ["Canesten"] },

  { id: "f_hydrocortisone_topical_1pct", drugId: "d_hydrocortisone_topical", form: "topical", strengthLabel: "1% cream", brandNames: ["Zafa"] },

  { id: "f_betamethasone_topical_01pct", drugId: "d_betamethasone_topical", form: "topical", strengthLabel: "0.1% cream", brandNames: ["Betnovate"] },

  // No confirmed Pakistan-market brand found — left blank rather than guessed.
  { id: "f_silver_sulfadiazine_1pct", drugId: "d_silver_sulfadiazine", form: "topical", strengthLabel: "1% cream" },

  { id: "f_permethrin_5pct", drugId: "d_permethrin", form: "topical", strengthLabel: "5% lotion", brandNames: ["Nixcal", "Scabrid"] },

  // No confirmed pharmaceutical-registered Pakistani brand found (only
  // cosmetic/organic sellers surfaced) — left blank rather than guessed.
  { id: "f_calamine_std", drugId: "d_calamine", form: "topical", strengthLabel: "Calamine lotion" },

  { id: "f_chloramphenicol_eye_05pct", drugId: "d_chloramphenicol_eye", form: "eye_drops", strengthLabel: "0.5% eye drops", brandNames: ["Chloroptic", "Optachlor"] },

  { id: "f_tobramycin_eye_03pct", drugId: "d_tobramycin_eye", form: "eye_drops", strengthLabel: "0.3% eye drops", brandNames: ["Tobrex"] },

  // No confirmed Pakistan-market brand found (only international Pulmicort
  // surfaced) — left blank rather than guessed.
  { id: "f_budesonide_neb_05mg", drugId: "d_budesonide_neb", form: "nebule", strengthLabel: "0.5 mg/2 mL nebule", mgPerMl: 0.25 },

  { id: "f_ipratropium_250mcg", drugId: "d_ipratropium", form: "nebule", strengthLabel: "250 mcg/mL nebule", mgPerMl: 0.25, brandNames: ["Atrovent", "Atem"] },
];

const SYSTEM_RULE_DEFAULTS = {
  source: "system" as const,
  status: "published" as const,
  version: 1,
  createdBy: "system",
  publishedBy: "system",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const DOSE_RULES: DoseRule[] = [
  {
    id: "r_paracetamol_std",
    drugId: "d_paracetamol",
    // MSF Medical Guidelines: 15 mg/kg 3-4x/day, max 60 mg/kg/day for age ≥1 month
    // (40 mg/kg/day under 1 month — not modeled separately in V1, so this rule
    // stays scoped to the general pediatric range). maxMgPerDay below is kept only
    // as a flat backstop for an adolescent near adult size; maxMgPerKgPerDay is
    // the one that actually binds for most pediatric weights.
    label: "Paracetamol — standard (10–15 mg/kg/dose, max 60 mg/kg/day, MSF)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 10,
    mgPerKgMax: 15,
    defaultFrequencyCode: "Q6H",
    maxMgPerDose: 500,
    maxMgPerDay: 4000,
    maxMgPerKgPerDay: 60,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_amox_std",
    drugId: "d_amoxicillin",
    label: "Amoxicillin — standard (45 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 45,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 1500,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_amox_high",
    drugId: "d_amoxicillin",
    label: "Amoxicillin — high dose, otitis media (90 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 90,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 3000,
    source: "faculty",
    status: "published",
    version: 1,
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "r_salbutamol_std",
    drugId: "d_salbutamol",
    label: "Salbutamol — standard (0.15 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.15,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 4,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_ceftriaxone_std",
    drugId: "d_ceftriaxone",
    label: "Ceftriaxone — standard (50 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 50,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 2000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_iron_std",
    drugId: "d_ironsyrup",
    label: "Ferrous Sulphate — standard (3 mg/kg/day elemental)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 3,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_vitd_std",
    drugId: "d_vitd",
    label: "Vitamin D3 — maintenance (400 IU/day fixed)",
    basis: "fixed",
    fixedMg: 400,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_ondansetron_std",
    drugId: "d_ondansetron",
    label: "Ondansetron — standard (0.15 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.15,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 8,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cefixime_std",
    drugId: "d_cefixime",
    label: "Cefixime — standard (8 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 8,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 400,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_azithro_std",
    drugId: "d_azithromycin",
    label: "Azithromycin — standard (10 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 10,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 500,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_domperidone_std",
    drugId: "d_domperidone",
    label: "Domperidone — standard (0.25 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.25,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 10,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_metronidazole_std",
    drugId: "d_metronidazole",
    label: "Metronidazole — standard (7.5 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 7.5,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 500,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_prednisolone_std",
    drugId: "d_prednisolone",
    label: "Prednisolone — standard (1 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 1,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 40,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_prednisolone_asthma",
    drugId: "d_prednisolone",
    label: "Prednisolone — asthma exacerbation (2 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 2,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 60,
    source: "faculty",
    status: "published",
    version: 1,
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "r_zinc_under6mo",
    drugId: "d_zinc",
    label: "Zinc Sulfate — under 6 months (10 mg/day fixed)",
    basis: "fixed",
    fixedMg: 10,
    defaultFrequencyCode: "OD",
    maxAgeMonths: 6,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_zinc_over6mo",
    drugId: "d_zinc",
    label: "Zinc Sulfate — 6 months and over (20 mg/day fixed)",
    basis: "fixed",
    fixedMg: 20,
    defaultFrequencyCode: "OD",
    minAgeMonths: 6,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cetirizine_std",
    drugId: "d_cetirizine",
    label: "Cetirizine — standard (0.25 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.25,
    defaultFrequencyCode: "OD",
    maxMgPerDose: 10,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_ibuprofen_std",
    drugId: "d_ibuprofen",
    // Standard pediatric NSAID dosing: 5-10 mg/kg/dose, max 40 mg/kg/day —
    // 10 mg/kg/dose at Q6H (4x/day) reaches exactly that cap, same consistency
    // check as the paracetamol rule above.
    label: "Ibuprofen — standard (5–10 mg/kg/dose, max 40 mg/kg/day)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 5,
    mgPerKgMax: 10,
    defaultFrequencyCode: "Q6H",
    maxMgPerDose: 400,
    maxMgPerDay: 2400,
    maxMgPerKgPerDay: 40,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_coamoxiclav_std",
    drugId: "d_coamoxiclav",
    label: "Co-amoxiclav — standard (25 mg/kg/day of amoxicillin component)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 25,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 1750,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_nystatin_std",
    drugId: "d_nystatin",
    label: "Nystatin — oral thrush (100,000 units fixed, per side of mouth)",
    basis: "fixed",
    fixedMg: 100000, // units, not mg — see the formulation's own comment
    defaultFrequencyCode: "QID",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_levetiracetam_initial",
    drugId: "d_levetiracetam",
    // FDA-approved pediatric starting dose (age >=6 months): 10 mg/kg/dose BD.
    // This is an INITIAL dose meant to be titrated by the treating physician
    // (up to 40-60 mg/kg/day) — never invented further than the cited starting
    // point; maxMgPerKgPerDay is a safety backstop, not a target dose.
    label: "Levetiracetam — initial dose, ≥6 months (10 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 10,
    defaultFrequencyCode: "BD",
    maxMgPerKgPerDay: 60,
    minAgeMonths: 6,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_multivitamin_std",
    drugId: "d_multivitamin",
    label: "Multivitamin — standard (5 mL once daily)",
    basis: "fixed",
    fixedMg: 5, // mL, via the formulation's 1:1 mgPerMl — see its own comment
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_loratadine_2to5y",
    drugId: "d_loratadine",
    label: "Loratadine — 2 to 5 years (5 mg fixed)",
    basis: "fixed",
    fixedMg: 5,
    defaultFrequencyCode: "OD",
    minAgeMonths: 24,
    maxAgeMonths: 72,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_loratadine_6yplus",
    drugId: "d_loratadine",
    label: "Loratadine — 6 years and over (10 mg fixed)",
    basis: "fixed",
    fixedMg: 10,
    defaultFrequencyCode: "OD",
    minAgeMonths: 72,
    ...SYSTEM_RULE_DEFAULTS,
  },

  // --- Batch 2: Cardiac + Emergency + Anti-TB ---
  {
    id: "r_digoxin_std",
    drugId: "d_digoxin",
    // [HIGH-RISK] Narrow therapeutic index — standard pediatric oral
    // maintenance range (BNF-C/Nelson Textbook of Pediatrics level reference),
    // divided BD. This is a MAINTENANCE dose, not a loading regimen — loading
    // (if needed) is a specialist decision this app deliberately does not model.
    label: "Digoxin — maintenance, oral (8–10 mcg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.008,
    mgPerKgMax: 0.01,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_furosemide_std",
    drugId: "d_furosemide",
    // FDA labeling: initial 1-2 mg/kg/dose; "doses greater than 6 mg/kg body
    // weight are not recommended" — cited directly, not estimated.
    label: "Furosemide — standard (1–2 mg/kg/dose, max 6 mg/kg/day, FDA label)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 1,
    mgPerKgMax: 2,
    defaultFrequencyCode: "BD",
    maxMgPerKgPerDay: 6,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_spironolactone_std",
    drugId: "d_spironolactone",
    label: "Spironolactone — standard (1–3 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 1,
    mgPerKgMax: 3,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 100,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_captopril_std",
    drugId: "d_captopril",
    // Starting dose — first-dose hypotension risk is real; start low and
    // monitor, never auto-escalate.
    label: "Captopril — starting dose (0.3–0.5 mg/kg/dose, watch for first-dose hypotension)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.3,
    mgPerKgMax: 0.5,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 25,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_enalapril_std",
    drugId: "d_enalapril",
    label: "Enalapril — standard (0.1–0.5 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.1,
    mgPerKgMax: 0.5,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 40,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_losartan_std",
    drugId: "d_losartan",
    label: "Losartan — standard (0.7–1.4 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.7,
    mgPerKgMax: 1.4,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 50,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_metoprolol_std",
    drugId: "d_metoprolol",
    label: "Metoprolol — standard (1–2 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 1,
    mgPerKgMax: 2,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 200,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_propranolol_std",
    drugId: "d_propranolol",
    // General beta-blocker dosing (arrhythmia/hypertension). Infantile
    // hemangioma uses a different, specialist-titrated regimen (up to
    // 1-3 mg/kg/day) with mandatory monitored initiation — not modeled as a
    // separate rule this round; use manual override with a documented reason
    // for that indication rather than this standard rule.
    label: "Propranolol — standard (0.5–1 mg/kg/dose, watch for infant hypoglycemia)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.5,
    mgPerKgMax: 1,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 20,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_amiodarone_std",
    drugId: "d_amiodarone",
    // [HIGH-RISK] Oral maintenance only — loading regimens are more complex
    // and specialist-managed; not modeled here.
    label: "Amiodarone — oral maintenance (5–10 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 5,
    mgPerKgMax: 10,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 400,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_aspirin_kawasaki_acute",
    drugId: "d_aspirin",
    label: "Aspirin — Kawasaki, acute anti-inflammatory phase (80–100 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 80,
    mgPerKgMax: 100,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 4000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_aspirin_kawasaki_lowdose",
    drugId: "d_aspirin",
    // Switched to once the acute fever/inflammatory phase has resolved —
    // a distinct clinical decision the prescriber makes, not an automatic
    // transition from the rule above.
    label: "Aspirin — Kawasaki, low-dose antiplatelet phase (3–5 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 3,
    mgPerKgMax: 5,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 100,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_sildenafil_std",
    drugId: "d_sildenafil",
    label: "Sildenafil — PPHN/PAH, starting dose (0.5–1 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.5,
    mgPerKgMax: 1,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 20,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_warfarin_std",
    drugId: "d_warfarin",
    // [HIGH-RISK] Starting dose ONLY — true maintenance dosing is
    // individualized entirely by INR, not by weight; never auto-titrate.
    label: "Warfarin — starting dose (0.2 mg/kg/day, max 10 mg) — maintenance requires INR-guided titration",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.2,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 10,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_enoxaparin_therapeutic",
    drugId: "d_enoxaparin",
    label: "Enoxaparin — therapeutic (1 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 1,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_enoxaparin_prophylactic",
    drugId: "d_enoxaparin",
    label: "Enoxaparin — prophylactic (0.5 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.5,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_adrenaline_anaphylaxis",
    drugId: "d_adrenaline",
    // [HIGH-RISK] Time-critical emergency dosing — standard IM anaphylaxis
    // dose, repeatable every 5-15 minutes per response; the hard per-dose
    // ceiling is a real safety cap, not a soft suggestion.
    label: "Adrenaline — anaphylaxis, IM (0.01 mg/kg/dose, max 0.5 mg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.01,
    maxMgPerDose: 0.5,
    defaultFrequencyCode: "PRN",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_charcoal_std",
    drugId: "d_activated_charcoal",
    // Single-dose poisoning management — "OD" here means "given once", not a
    // daily-repeat instruction; document the single-administration intent in
    // the prescription's own duration field when prescribing.
    label: "Activated Charcoal — single dose (1 g/kg, max 50 g)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 1000,
    maxMgPerDose: 50000,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_isoniazid_std",
    drugId: "d_isoniazid",
    label: "Isoniazid — WHO standard (7–15 mg/kg/day, max 300 mg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 7,
    mgPerKgMax: 15,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 300,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_rifampicin_std",
    drugId: "d_rifampicin",
    label: "Rifampicin — WHO standard (10–20 mg/kg/day, max 600 mg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 10,
    mgPerKgMax: 20,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 600,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_pyrazinamide_std",
    drugId: "d_pyrazinamide",
    label: "Pyrazinamide — WHO standard (30–40 mg/kg/day, max 2000 mg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 30,
    mgPerKgMax: 40,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 2000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_ethambutol_std",
    drugId: "d_ethambutol",
    // Optic toxicity monitoring is required at this dose range — a clinical
    // follow-up requirement this rule cannot itself enforce, noted here only.
    label: "Ethambutol — WHO standard (15–25 mg/kg/day, max 1600 mg/day, monitor vision)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 15,
    mgPerKgMax: 25,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 1600,
    ...SYSTEM_RULE_DEFAULTS,
  },

  // --- Batch 3: remaining systemic antibiotics ---
  {
    id: "r_ampicillin_std",
    drugId: "d_ampicillin",
    label: "Ampicillin — standard IV (100–200 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 100,
    mgPerKgMax: 200,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 12000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cloxacillin_std",
    drugId: "d_cloxacillin",
    label: "Cloxacillin — standard (50–100 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 50,
    mgPerKgMax: 100,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 4000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_benzylpenicillin_std",
    drugId: "d_benzylpenicillin",
    // Potency conventionally in units, not mg — mgPerKg below numerically
    // represents units/kg, matching the formulation's own units-as-mg
    // convention (see its comment).
    label: "Benzylpenicillin — standard IV (50,000–100,000 units/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 50000,
    mgPerKgMax: 100000,
    defaultFrequencyCode: "QID",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cephradine_std",
    drugId: "d_cephradine",
    label: "Cephradine — standard (25–50 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 25,
    mgPerKgMax: 50,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 4000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cefuroxime_std",
    drugId: "d_cefuroxime",
    label: "Cefuroxime — standard, oral (20–30 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 20,
    mgPerKgMax: 30,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 1000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cefpodoxime_std",
    drugId: "d_cefpodoxime",
    label: "Cefpodoxime — standard (10 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 10,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 400,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cefotaxime_std",
    drugId: "d_cefotaxime",
    label: "Cefotaxime — standard IV (100–200 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 100,
    mgPerKgMax: 200,
    defaultFrequencyCode: "TDS",
    maxMgPerDay: 12000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_ceftazidime_std",
    drugId: "d_ceftazidime",
    label: "Ceftazidime — standard IV (100–150 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 100,
    mgPerKgMax: 150,
    defaultFrequencyCode: "TDS",
    maxMgPerDay: 6000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cefaclor_std",
    drugId: "d_cefaclor",
    label: "Cefaclor — standard (20–40 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 20,
    mgPerKgMax: 40,
    defaultFrequencyCode: "TDS",
    maxMgPerDay: 1500,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cefdinir_std",
    drugId: "d_cefdinir",
    label: "Cefdinir — standard (14 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 14,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 600,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cefepime_std",
    drugId: "d_cefepime",
    label: "Cefepime — standard IV (100–150 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 100,
    mgPerKgMax: 150,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 6000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_clarithromycin_std",
    drugId: "d_clarithromycin",
    label: "Clarithromycin — standard (15 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 15,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 1000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_erythromycin_std",
    drugId: "d_erythromycin",
    label: "Erythromycin — standard (30–50 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 30,
    mgPerKgMax: 50,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 2000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_clindamycin_std",
    drugId: "d_clindamycin",
    label: "Clindamycin — standard (10–25 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 10,
    mgPerKgMax: 25,
    defaultFrequencyCode: "TDS",
    maxMgPerDay: 1800,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_vancomycin_std",
    drugId: "d_vancomycin",
    // [HIGH-RISK] Levels/renal function monitoring required at this dose.
    label: "Vancomycin — standard IV (40–60 mg/kg/day, monitor levels)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 40,
    mgPerKgMax: 60,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 4000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_gentamicin_std",
    drugId: "d_gentamicin",
    // [HIGH-RISK] Nephro/ototoxic — extended-interval (once-daily) dosing
    // for children >1 month; neonatal dosing is more nuanced (interval
    // varies by postmenstrual age) and is NOT modeled here — use manual
    // override with a documented reason for neonates.
    label: "Gentamicin — standard, once-daily (5–7.5 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 5,
    mgPerKgMax: 7.5,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_amikacin_std",
    drugId: "d_amikacin",
    // [HIGH-RISK] Nephro/ototoxic — monitor levels.
    label: "Amikacin — standard, once-daily (15–22.5 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 15,
    mgPerKgMax: 22.5,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_meropenem_std",
    drugId: "d_meropenem",
    label: "Meropenem — standard IV (20–40 mg/kg/dose, higher end for meningitis)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 20,
    mgPerKgMax: 40,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 2000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_pip_tazo_std",
    drugId: "d_pip_tazo",
    label: "Piperacillin/Tazobactam — standard IV (100 mg/kg/dose of total product)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 100,
    defaultFrequencyCode: "QID",
    maxMgPerDose: 4500,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_cotrimoxazole_std",
    drugId: "d_cotrimoxazole",
    label: "Co-trimoxazole — standard (4 mg/kg/dose of trimethoprim component)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 4,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_nitrofurantoin_std",
    drugId: "d_nitrofurantoin",
    label: "Nitrofurantoin — standard, treatment (5–7 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 5,
    mgPerKgMax: 7,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 400,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_doxycycline_std",
    drugId: "d_doxycycline",
    // Standard pediatric restriction: age >=8 years (tooth staining/enamel
    // hypoplasia risk below that age) — short courses in younger children
    // are a specialist decision, not modeled as the default rule.
    label: "Doxycycline — standard, age ≥8 years (2–4 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 2,
    mgPerKgMax: 4,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 200,
    minAgeMonths: 96,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_chloramphenicol_std",
    drugId: "d_chloramphenicol",
    // [HIGH-RISK] Aplastic anemia risk — reserve for indications with no
    // safer alternative.
    label: "Chloramphenicol — standard (50–100 mg/kg/day, higher end for meningitis)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 50,
    mgPerKgMax: 100,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 4000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_linezolid_std",
    drugId: "d_linezolid",
    label: "Linezolid — standard (10 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 10,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 600,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_colistin_std",
    drugId: "d_colistin",
    // [HIGH-RISK] Nephrotoxic — reserve for multi-drug-resistant organisms;
    // dosed by colistin base activity (CBA), matching the formulation's own
    // mg-base-equivalent labeling.
    label: "Colistin — standard, MDR-reserved (2.5–5 mg/kg/day colistin base)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 2.5,
    mgPerKgMax: 5,
    defaultFrequencyCode: "TDS",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_fosfomycin_std",
    drugId: "d_fosfomycin",
    // Adults/adolescents only per standard labeling for uncomplicated
    // cystitis — age-gated rather than offered as a general pediatric dose.
    label: "Fosfomycin — single dose, age ≥12 years (3 g once)",
    basis: "fixed",
    fixedMg: 3000,
    defaultFrequencyCode: "OD",
    minAgeMonths: 144,
    ...SYSTEM_RULE_DEFAULTS,
  },

  // --- Batch 4: GI/electrolyte ---
  {
    id: "r_famotidine_std",
    drugId: "d_famotidine",
    label: "Famotidine — standard (0.5–1 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.5,
    mgPerKgMax: 1,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 40,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_omeprazole_std",
    drugId: "d_omeprazole",
    label: "Omeprazole — standard (1–2 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 1,
    mgPerKgMax: 2,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 40,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_lactulose_std",
    drugId: "d_lactulose",
    // Expressed here as an mg/kg equivalent of the real 1-3 mL/kg/day dosing
    // (1 mL = 666.7 mg per this formulation's own concentration) so the
    // calculated volume comes out right — see the formulation's own note.
    label: "Lactulose — standard (1–3 mL/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 666.7,
    mgPerKgMax: 2000,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_simethicone_infant",
    drugId: "d_simethicone",
    label: "Simethicone — under 2 years (20 mg fixed)",
    basis: "fixed",
    fixedMg: 20,
    defaultFrequencyCode: "QID",
    maxAgeMonths: 24,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_simethicone_2yplus",
    drugId: "d_simethicone",
    label: "Simethicone — 2 years and over (40 mg fixed)",
    basis: "fixed",
    fixedMg: 40,
    defaultFrequencyCode: "QID",
    minAgeMonths: 24,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_racecadotril_std",
    drugId: "d_racecadotril",
    // Real-world dosing rounds to available sachet sizes (10/20/30 mg) by
    // weight band — this app only seeds the 10 mg sachet, so the mg/kg
    // figure below is an approximation, not the manufacturer's exact table.
    label: "Racecadotril — standard (1.5 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 1.5,
    defaultFrequencyCode: "TDS",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_sboulardii_std",
    drugId: "d_sboulardii",
    label: "Saccharomyces boulardii — standard (250 mg fixed)",
    basis: "fixed",
    fixedMg: 250,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_sucralfate_std",
    drugId: "d_sucralfate",
    label: "Sucralfate — standard (40–80 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 40,
    mgPerKgMax: 80,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 4000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_urso_std",
    drugId: "d_ursodeoxycholic",
    label: "Ursodeoxycholic Acid — standard (10–20 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 10,
    mgPerKgMax: 20,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_metoclopramide_std",
    drugId: "d_metoclopramide",
    // Extrapyramidal/dystonic reaction risk — short courses only, per
    // standard caution; not a first-line pediatric antiemetic.
    label: "Metoclopramide — standard, short course only (0.1–0.15 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.1,
    mgPerKgMax: 0.15,
    defaultFrequencyCode: "TDS",
    maxMgPerKgPerDay: 0.5,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_kcl_maintenance",
    drugId: "d_potassium_chloride",
    // Maintenance requirement ONLY — replacement of a measured/lab-guided
    // deficit is individualized and NOT this rule; per CLAUDE.md rule 1,
    // this app does not invent a formula for that. Potency in mEq — mgPerKg
    // below numerically represents mEq/kg, matching the formulation's own
    // units-as-ratio convention.
    label: "Potassium Chloride — maintenance only (1–2 mEq/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 1,
    mgPerKgMax: 2,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_hyoscine_std",
    drugId: "d_hyoscine",
    // Limited pediatric evidence base for this indication — use judiciously.
    label: "Hyoscine Butylbromide — standard (0.5 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.5,
    defaultFrequencyCode: "TDS",
    ...SYSTEM_RULE_DEFAULTS,
  },
  // No dose rule for Sodium Bicarbonate — see the formulation's own comment;
  // correction of metabolic acidosis is individualized to a measured base
  // deficit, not a per-kg formula this app should invent.

  // --- Batch 4b: Antifungals/Antiparasitics ---
  {
    id: "r_fluconazole_std",
    drugId: "d_fluconazole",
    label: "Fluconazole — standard (6–12 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 6,
    mgPerKgMax: 12,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 600,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_griseofulvin_std",
    drugId: "d_griseofulvin",
    label: "Griseofulvin — microsize, standard (10–20 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 10,
    mgPerKgMax: 20,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 1000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_albendazole_1to2y",
    drugId: "d_albendazole",
    label: "Albendazole — 12 months to 2 years (200 mg fixed, single dose)",
    basis: "fixed",
    fixedMg: 200,
    defaultFrequencyCode: "OD",
    minAgeMonths: 12,
    maxAgeMonths: 24,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_albendazole_2yplus",
    drugId: "d_albendazole",
    label: "Albendazole — over 2 years (400 mg fixed, single dose)",
    basis: "fixed",
    fixedMg: 400,
    defaultFrequencyCode: "OD",
    minAgeMonths: 24,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_mebendazole_std",
    drugId: "d_mebendazole",
    label: "Mebendazole — standard (100 mg fixed, BD for 3 days)",
    basis: "fixed",
    fixedMg: 100,
    defaultFrequencyCode: "BD",
    minAgeMonths: 24,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_tinidazole_std",
    drugId: "d_tinidazole",
    label: "Tinidazole — single dose (50 mg/kg, max 2 g)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 50,
    maxMgPerDose: 2000,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_ivermectin_std",
    drugId: "d_ivermectin",
    // Standard labeling restricts use to children >=15 kg — this app has no
    // weight-threshold field (only age), so that restriction is noted here
    // rather than enforced automatically; confirm weight before prescribing.
    label: "Ivermectin — single dose (0.2 mg/kg, weight ≥15 kg only)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.2,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_praziquantel_std",
    drugId: "d_praziquantel",
    label: "Praziquantel — single dose (40 mg/kg)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 40,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_amphotericin_b_std",
    drugId: "d_amphotericin_b",
    // [HIGH-RISK] Nephrotoxic, infusion reactions — a test dose and gradual
    // increase are standard practice and are NOT modeled here (a specialist
    // protocol decision, not a per-kg formula); this is the target
    // maintenance range only.
    label: "Amphotericin B (conventional) — maintenance (0.25–1 mg/kg/day, test dose + gradual increase not modeled)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.25,
    mgPerKgMax: 1,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },

  // --- Batch 5: Anticonvulsants/Neuro + Steroids + Endocrine ---
  {
    id: "r_valproate_std",
    drugId: "d_valproate",
    // [HIGH-RISK] Hepatotoxic — monitor LFTs, especially under age 2.
    label: "Sodium Valproate — standard (10–20 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 10,
    mgPerKgMax: 20,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 2000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_carbamazepine_std",
    drugId: "d_carbamazepine",
    // [HIGH-RISK] Start low and titrate; levels/blood count monitoring
    // standard practice.
    label: "Carbamazepine — standard (10–20 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 10,
    mgPerKgMax: 20,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 1000,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_phenytoin_std",
    drugId: "d_phenytoin",
    // [HIGH-RISK] Maintenance only — a loading dose (for acute seizure
    // control) is a separate, specialist-managed regimen, not modeled here.
    label: "Phenytoin — maintenance (5–8 mg/kg/day, loading dose not modeled)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 5,
    mgPerKgMax: 8,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 300,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_phenobarbitone_std",
    drugId: "d_phenobarbitone",
    // [HIGH-RISK] Maintenance only — the loading dose used for acute
    // neonatal/status seizure control (15-20 mg/kg) is a separate,
    // specialist-managed regimen, not modeled here.
    label: "Phenobarbitone — maintenance (3–5 mg/kg/day, loading dose not modeled)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 3,
    mgPerKgMax: 5,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 200,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_clobazam_std",
    drugId: "d_clobazam",
    label: "Clobazam — standard, adjunct (0.5–1 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.5,
    mgPerKgMax: 1,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 40,
    ...SYSTEM_RULE_DEFAULTS,
  },
  // No dose rule for Lamotrigine — see the formulation's own comment; the
  // correct starting dose and titration schedule depend on whether
  // valproate is co-administered, a branching decision this app does not
  // encode as a single per-kg number.
  {
    id: "r_topiramate_std",
    drugId: "d_topiramate",
    // Initial dose — further titration (commonly to 5-9 mg/kg/day) is a
    // gradual, response-guided process, not modeled as a single target.
    label: "Topiramate — initial dose (1–3 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 1,
    mgPerKgMax: 3,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 400,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_diazepam_std",
    drugId: "d_diazepam",
    label: "Diazepam — acute seizure/agitation (0.3–0.5 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.3,
    mgPerKgMax: 0.5,
    defaultFrequencyCode: "PRN",
    maxMgPerDose: 10,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_midazolam_std",
    drugId: "d_midazolam",
    // [HIGH-RISK] Respiratory depression — monitor closely, resuscitation
    // equipment available.
    label: "Midazolam — sedation/seizure (0.1–0.3 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.1,
    mgPerKgMax: 0.3,
    defaultFrequencyCode: "PRN",
    maxMgPerDose: 10,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_baclofen_std",
    drugId: "d_baclofen",
    // Starting dose — titrate gradually to effect/tolerability; the higher
    // maintenance range (up to ~1-2 mg/kg/day) is not modeled as a target.
    label: "Baclofen — starting dose (0.1–0.2 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.1,
    mgPerKgMax: 0.2,
    defaultFrequencyCode: "TDS",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_melatonin_std",
    drugId: "d_melatonin",
    // Given at bedtime — this app's frequency codes have no dedicated
    // "at bedtime" option, so OD is used contextually.
    label: "Melatonin — standard (2 mg fixed, at bedtime)",
    basis: "fixed",
    fixedMg: 2,
    defaultFrequencyCode: "OD",
    minAgeMonths: 36,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_dexamethasone_std",
    drugId: "d_dexamethasone",
    // Croup dosing — other indications (raised intracranial pressure,
    // general anti-inflammatory use) follow different regimens not modeled
    // as a separate rule this round.
    label: "Dexamethasone — croup (0.15–0.6 mg/kg/dose, single dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.15,
    mgPerKgMax: 0.6,
    defaultFrequencyCode: "OD",
    maxMgPerDose: 16,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_hydrocortisone_std",
    drugId: "d_hydrocortisone",
    // Stress-dose/adrenal-crisis regimen — physiologic replacement dosing
    // is much lower and not modeled as a separate rule this round.
    label: "Hydrocortisone IV — stress dose (2 mg/kg/dose, max 100 mg)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 2,
    maxMgPerDose: 100,
    defaultFrequencyCode: "QID",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_deflazacort_std",
    drugId: "d_deflazacort",
    label: "Deflazacort — standard (0.9–1.2 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.9,
    mgPerKgMax: 1.2,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 90,
    ...SYSTEM_RULE_DEFAULTS,
  },
  // No dose rule for Insulin — see the formulation's own comment; dosing is
  // individualized/titrated by blood glucose response, not a fixed formula.
  {
    id: "r_levothyroxine_infant",
    drugId: "d_levothyroxine",
    label: "Levothyroxine — congenital hypothyroidism/infant (10–15 mcg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.01,
    mgPerKgMax: 0.015,
    defaultFrequencyCode: "OD",
    maxAgeMonths: 12,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_levothyroxine_std",
    drugId: "d_levothyroxine",
    label: "Levothyroxine — standard pediatric replacement (1–2 mcg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.001,
    mgPerKgMax: 0.002,
    defaultFrequencyCode: "OD",
    minAgeMonths: 12,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_fludrocortisone_std",
    drugId: "d_fludrocortisone",
    // Titrated by electrolytes/plasma renin activity, not weight — this is
    // a reasonable starting point (matching the confirmed tablet strength
    // exactly), not a weight-scaled target.
    label: "Fludrocortisone — starting dose (0.1 mg fixed, titrated by labs)",
    basis: "fixed",
    fixedMg: 0.1,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },

  // --- Batch 6: Analgesics + Respiratory + Antihistamines + Vitamins/Hematology/Neonatal ---
  {
    id: "r_mefenamic_std",
    drugId: "d_mefenamic",
    label: "Mefenamic Acid — standard (6.5 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 6.5,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 500,
    minAgeMonths: 6,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_diclofenac_std",
    drugId: "d_diclofenac",
    label: "Diclofenac — standard, second-line (0.5–1 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.5,
    mgPerKgMax: 1,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 50,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_ketorolac_std",
    drugId: "d_ketorolac",
    // Short-course only (<=5 days) per standard labeling.
    label: "Ketorolac — short-course only, ≤5 days (0.5 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.5,
    maxMgPerDose: 30,
    defaultFrequencyCode: "TDS",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_montelukast_std",
    drugId: "d_montelukast",
    label: "Montelukast — 2 to 5 years (4 mg fixed)",
    basis: "fixed",
    fixedMg: 4,
    defaultFrequencyCode: "OD",
    minAgeMonths: 24,
    maxAgeMonths: 72,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_terbutaline_std",
    drugId: "d_terbutaline",
    label: "Terbutaline — standard (0.05–0.1 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.05,
    mgPerKgMax: 0.1,
    defaultFrequencyCode: "TDS",
    maxMgPerDose: 5,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_carbocisteine_std",
    drugId: "d_carbocisteine",
    // Limited evidence base under 2 years — age-gated rather than offered
    // as a general infant dose.
    label: "Carbocisteine — standard, age ≥2 years (10 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 10,
    defaultFrequencyCode: "TDS",
    minAgeMonths: 24,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_theophylline_std",
    drugId: "d_theophylline",
    // [HIGH-RISK] Narrow therapeutic index — monitor levels.
    label: "Theophylline — standard, oral maintenance (12–24 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 12,
    mgPerKgMax: 24,
    defaultFrequencyCode: "BD",
    maxMgPerDay: 900,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_aminophylline_loading",
    drugId: "d_aminophylline",
    // [HIGH-RISK] Narrow therapeutic index, arrhythmia risk — this is the
    // IV LOADING dose only (given slowly over ~20-30 minutes); ongoing
    // maintenance is an infusion-rate decision this app does not model.
    label: "Aminophylline — IV loading dose only (5 mg/kg, given slowly)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 5,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_chlorpheniramine_std",
    drugId: "d_chlorpheniramine",
    label: "Chlorpheniramine — standard (0.35 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 0.35,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 12,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_diphenhydramine_std",
    drugId: "d_diphenhydramine",
    label: "Diphenhydramine — standard (5 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 5,
    defaultFrequencyCode: "QID",
    maxMgPerDay: 300,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_levocetirizine_2to5y",
    drugId: "d_levocetirizine",
    label: "Levocetirizine — 2 to 5 years (1.25 mg fixed)",
    basis: "fixed",
    fixedMg: 1.25,
    defaultFrequencyCode: "OD",
    minAgeMonths: 24,
    maxAgeMonths: 72,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_levocetirizine_6yplus",
    drugId: "d_levocetirizine",
    label: "Levocetirizine — 6 years and over (2.5 mg fixed)",
    basis: "fixed",
    fixedMg: 2.5,
    defaultFrequencyCode: "OD",
    minAgeMonths: 72,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_fexofenadine_std",
    drugId: "d_fexofenadine",
    label: "Fexofenadine — age ≥12 years (60 mg fixed)",
    basis: "fixed",
    fixedMg: 60,
    defaultFrequencyCode: "BD",
    minAgeMonths: 144,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_promethazine_std",
    drugId: "d_promethazine",
    // Avoid under 2 years — respiratory depression risk.
    label: "Promethazine — standard, age ≥2 years (0.5 mg/kg/dose)",
    basis: "mg_per_kg_per_dose",
    mgPerKg: 0.5,
    maxMgPerDose: 25,
    defaultFrequencyCode: "TDS",
    minAgeMonths: 24,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_vitk1_neonatal",
    drugId: "d_vitk1",
    // Standard WHO/AAP one-time neonatal IM prophylaxis dose. The lower
    // 0.5 mg dose used for birthweight <1500 g is a birthweight threshold
    // this app cannot encode (only age, not weight-at-birth) — apply
    // clinical judgment for very-low-birthweight infants.
    label: "Vitamin K1 — neonatal prophylaxis, one-time IM (1 mg fixed)",
    basis: "fixed",
    fixedMg: 1,
    defaultFrequencyCode: "OD",
    maxAgeMonths: 1,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_vitb_complex_std",
    drugId: "d_vitb_complex",
    label: "Vitamin B Complex — standard (5 mL once daily)",
    basis: "fixed",
    fixedMg: 5,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_folic_acid_std",
    drugId: "d_folic_acid",
    // Treatment dose (e.g. hemolytic anemia) — lower prophylactic doses
    // (as low as 1 mg) exist and are not modeled as a separate rule.
    label: "Folic Acid — treatment (5 mg fixed)",
    basis: "fixed",
    fixedMg: 5,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_vita_6to11mo",
    drugId: "d_vita",
    label: "Vitamin A — 6 to 11 months, WHO single dose (100,000 IU fixed)",
    basis: "fixed",
    fixedMg: 100000,
    defaultFrequencyCode: "OD",
    minAgeMonths: 6,
    maxAgeMonths: 12,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_vita_12moplus",
    drugId: "d_vita",
    label: "Vitamin A — 12 months and over, WHO single dose (200,000 IU fixed)",
    basis: "fixed",
    fixedMg: 200000,
    defaultFrequencyCode: "OD",
    minAgeMonths: 12,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_pyridoxine_std",
    drugId: "d_pyridoxine",
    // Isoniazid-companion neuropathy-prevention dose.
    label: "Pyridoxine — with Isoniazid (1–2 mg/kg/day)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 1,
    mgPerKgMax: 2,
    defaultFrequencyCode: "OD",
    maxMgPerDay: 50,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_caffeine_citrate_maintenance",
    drugId: "d_caffeine_citrate",
    // Maintenance only — the 20 mg/kg loading dose is a separate,
    // specialist-initiated NICU step, not modeled here.
    label: "Caffeine Citrate — maintenance, neonatal apnea (5–10 mg/kg/day, loading dose not modeled)",
    basis: "mg_per_kg_per_day",
    mgPerKg: 5,
    mgPerKgMax: 10,
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },

  // --- Batch 7: Topicals/Ophthalmic (topical_instruction basis) + Nebules ---
  {
    id: "r_fusidic_acid_std",
    drugId: "d_fusidic_acid",
    basis: "topical_instruction",
    instructionText: "Apply a thin layer to the affected area",
    label: "Fusidic Acid — standard (apply thin layer)",
    defaultFrequencyCode: "TDS",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_mupirocin_std",
    drugId: "d_mupirocin",
    basis: "topical_instruction",
    // Short course (5-10 days) is standard for impetigo — a duration
    // decision made when prescribing, not encoded in this rule.
    instructionText: "Apply a thin layer to the affected area",
    label: "Mupirocin — standard, short course (apply thin layer)",
    defaultFrequencyCode: "TDS",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_clotrimazole_std",
    drugId: "d_clotrimazole",
    basis: "topical_instruction",
    instructionText: "Apply a thin layer to the affected area",
    label: "Clotrimazole — standard (apply thin layer)",
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_hydrocortisone_topical_std",
    drugId: "d_hydrocortisone_topical",
    basis: "topical_instruction",
    // Mildest topical steroid class — still standard practice to avoid
    // prolonged continuous use, especially on the face.
    instructionText: "Apply a thin layer to the affected area, short courses only",
    label: "Hydrocortisone (Topical) — standard, short course (apply thin layer)",
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_betamethasone_topical_std",
    drugId: "d_betamethasone_topical",
    basis: "topical_instruction",
    // Potent topical steroid — avoid face/prolonged use; short courses only.
    instructionText: "Apply a thin layer to the affected area, avoid the face, short courses only",
    label: "Betamethasone (Topical) — potent, short course (apply thin layer)",
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_silver_sulfadiazine_std",
    drugId: "d_silver_sulfadiazine",
    basis: "topical_instruction",
    instructionText: "Apply a 3–5 mm layer to the burn/wound with sterile technique",
    label: "Silver Sulfadiazine — standard, burn dressing (apply 3–5 mm layer)",
    defaultFrequencyCode: "OD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_permethrin_std",
    drugId: "d_permethrin",
    basis: "topical_instruction",
    // Single application per course — repeat after 7 days only if live mites
    // persist, a follow-up clinical decision, not a scheduled second dose.
    instructionText: "Apply to the whole body from the neck down; wash off after 8–14 hours. A single application — repeat after 7 days only if needed",
    label: "Permethrin — single application (whole body, wash off after 8–14h)",
    defaultFrequencyCode: "OD",
    minAgeMonths: 2,
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_calamine_std",
    drugId: "d_calamine",
    basis: "topical_instruction",
    instructionText: "Apply to the affected area as needed for itching",
    label: "Calamine — as needed (apply for itching)",
    defaultFrequencyCode: "PRN",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_chloramphenicol_eye_std",
    drugId: "d_chloramphenicol_eye",
    basis: "topical_instruction",
    instructionText: "Instil 1–2 drops in the affected eye(s)",
    label: "Chloramphenicol (Eye) — standard (instil 1–2 drops)",
    defaultFrequencyCode: "QID",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_tobramycin_eye_std",
    drugId: "d_tobramycin_eye",
    basis: "topical_instruction",
    instructionText: "Instil 1–2 drops in the affected eye(s)",
    label: "Tobramycin (Eye) — standard (instil 1–2 drops)",
    defaultFrequencyCode: "QID",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_budesonide_neb_std",
    drugId: "d_budesonide_neb",
    label: "Budesonide (Nebulized) — standard (0.5 mg fixed)",
    basis: "fixed",
    fixedMg: 0.5,
    defaultFrequencyCode: "BD",
    ...SYSTEM_RULE_DEFAULTS,
  },
  {
    id: "r_ipratropium_std",
    drugId: "d_ipratropium",
    label: "Ipratropium Bromide — standard (250 mcg fixed)",
    basis: "fixed",
    fixedMg: 0.25,
    defaultFrequencyCode: "TDS",
    ...SYSTEM_RULE_DEFAULTS,
  },
];

// ---- Content: Advice Packs, Follow-up Modules --------------------------

export const ADVICE_PACKS: AdvicePack[] = [
  // Home-care/danger-sign framing cross-checked against WHO Pocket Book of Hospital
  // Care for Children, 2nd ed. (2013), "Counselling and discharge from hospital" —
  // paraphrased into parent-facing wording, not copied; WHO's own content is written
  // for health workers, not parents. Added: the scheduled-follow-up reminder, which
  // that chapter treats as a core discharge-counselling element.
  {
    id: "ap_general_pediatric",
    title: "General Pediatric Home Care",
    category: "general_pediatric",
    version: 5,
    status: "published",
    linkedDiagnoses: [],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-05T07:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Ensure adequate rest and normal sleep routine.", ur: "بچے کو مناسب آرام اور نیند کا معمول برقرار رکھنے دیں۔" },
          { id: "s1b2", en: "Continue regular feeds/breastfeeding as tolerated.", ur: "بچے کی برداشت کے مطابق باقاعدہ خوراک/ماں کا دودھ جاری رکھیں۔" },
          { id: "s1b3", en: "Keep the child well hydrated.", ur: "بچے کو مناسب مقدار میں پانی/سیال پلاتے رہیں۔" },
          { id: "s1b4", en: "Attend the scheduled follow-up visit even if the child seems fully better.", ur: "اگر بچہ مکمل ٹھیک بھی لگے تب بھی مقررہ فالو اپ وزٹ پر ضرور آئیں۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "High fever not settling with medicine", ur: "تیز بخار جو دوا سے نہ اترے" },
          { id: "s2b2", en: "Difficulty breathing or fast breathing", ur: "سانس لینے میں دشواری یا سانس کا تیز چلنا" },
          { id: "s2b3", en: "Not feeding / persistent vomiting", ur: "دودھ/خوراک نہ لینا یا بار بار الٹی آنا" },
          { id: "s2b4", en: "Unusually drowsy or difficult to wake", ur: "غیر معمولی نیند یا سستی، جگانا مشکل ہونا" },
        ],
      },
    ],
  },
  // Cross-checked against WHO Pocket Book of Hospital Care for Children, 2nd ed.
  // (2013), "Cough or difficulty in breathing" chapter — added the nose-clearing
  // technique, the caution against unprescribed cough remedies (that chapter
  // explicitly advises against codeine-type/antihistamine cough preparations in
  // young children), and the standard 3-day review timing, all paraphrased for
  // parents rather than copied from the health-worker-facing original.
  {
    id: "ap_respiratory",
    title: "Respiratory Illness — Home Care & Danger Signs",
    category: "respiratory",
    version: 6,
    status: "published",
    linkedDiagnoses: ["Community-acquired pneumonia", "Bronchiolitis", "Asthma exacerbation"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-05T07:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Give nebulization/inhaler exactly as prescribed.", ur: "نیبولائزر/انہیلر بالکل ڈاکٹر کی ہدایت کے مطابق استعمال کریں۔" },
          { id: "s1b2", en: "Keep the child away from smoke and dust.", ur: "بچے کو دھوئیں اور گرد و غبار سے دور رکھیں۔" },
          { id: "s1b3", en: "Continue feeds in small, frequent amounts if breathless.", ur: "اگر سانس پھولی ہو تو تھوڑی تھوڑی مقدار میں بار بار خوراک دیں۔" },
          { id: "s1b4", en: "Before feeds, gently clear a blocked nose with a soft cloth twisted into a point and dipped in clean water.", ur: "دودھ پلانے سے پہلے، اگر ناک بند ہو تو صاف پانی میں بھگوئے ہوئے نرم کپڑے کی نوک بنا کر آہستگی سے ناک صاف کریں۔" },
          { id: "s1b5", en: "For cough, a warm sweet drink can soothe the throat — avoid over-the-counter cough syrups unless the doctor has prescribed one.", ur: "کھانسی کے لیے ہلکا گرم میٹھا مشروب گلے کو سکون دے سکتا ہے — ڈاکٹر کی تجویز کے بغیر بازاری کھانسی کا شربت نہ دیں۔" },
          { id: "s1b6", en: "Return for review after 3 days even if improving, or sooner if the child gets worse.", ur: "3 دن بعد فالو اپ کے لیے ضرور آئیں چاہے بچہ بہتر محسوس ہو رہا ہو، یا بگڑنے کی صورت میں جلد آئیں۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "Fast or difficult breathing", ur: "سانس کا تیز چلنا یا سانس لینے میں دشواری" },
          { id: "s2b2", en: "Chest indrawing", ur: "سانس لیتے وقت سینہ اندر دھنسنا" },
          { id: "s2b3", en: "Bluish lips or face", ur: "ہونٹوں یا چہرے کا نیلاہٹ زدہ ہونا" },
          { id: "s2b4", en: "Not able to feed due to breathlessness", ur: "سانس پھولنے کی وجہ سے خوراک نہ لے پانا" },
        ],
      },
    ],
  },
  // Cross-checked against WHO Pocket Book of Hospital Care for Children, 2nd ed.
  // (2013), "Diarrhoea" chapter — its "four rules of home treatment" are extra
  // fluid, zinc supplementation, continued feeding, and knowing when to return.
  // The zinc bullet was the one genuinely missing here (this app already has a
  // seeded Zinc Sulfate dose rule for exactly this indication — see medications);
  // "new fever" is added to the return criteria to match the chapter's own list.
  {
    id: "ap_gi",
    title: "Diarrhea / Vomiting — Home Care & Danger Signs",
    category: "gi",
    version: 4,
    status: "published",
    linkedDiagnoses: ["Acute gastroenteritis", "Acute diarrhea"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-05T07:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Give ORS after every loose stool/vomiting episode.", ur: "ہر بار پتلے دست یا الٹی کے بعد او آر ایس (ORS) دیں۔" },
          { id: "s1b2", en: "Continue normal feeding — do not withhold food.", ur: "معمول کی خوراک جاری رکھیں — کھانا بند نہ کریں۔" },
          { id: "s1b3", en: "Wash hands before feeding and after changing diapers.", ur: "خوراک دینے سے پہلے اور لنگوٹ تبدیل کرنے کے بعد ہاتھ دھوئیں۔" },
          { id: "s1b4", en: "Give the zinc supplement once daily for the full 10–14 days, even after the diarrhea stops — it reduces the severity and length of future episodes.", ur: "زنک کا سپلیمنٹ روزانہ ایک بار مکمل 10 سے 14 دن تک دیں، دست رکنے کے بعد بھی — یہ آئندہ دستوں کی شدت اور دورانیہ کم کرتا ہے۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "Blood in stool", ur: "پاخانے میں خون آنا" },
          { id: "s2b2", en: "Sunken eyes, very little urine, or unable to drink", ur: "آنکھیں دھنسی ہوئی ہوں، پیشاب بہت کم ہو، یا بچہ پی نہ سکے" },
          { id: "s2b3", en: "Persistent vomiting, unable to retain ORS", ur: "بار بار الٹی آنا، او آر ایس بھی نہ رک سکے" },
          { id: "s2b4", en: "New fever develops", ur: "نیا بخار ہو جانا" },
        ],
      },
    ],
  },
  // Cross-checked against WHO Pocket Book of Hospital Care for Children, 2nd ed.
  // (2013), "Problems of the neonate and young infant" chapter (its own danger-sign
  // list is considerably longer than what was here — fast breathing, grunting,
  // chest indrawing, convulsions, abnormal limpness, cyanosis, abdominal
  // distension — condensed into parent-facing bullets below rather than dropped).
  {
    id: "ap_neonatal",
    title: "Neonatal Home Care",
    category: "neonatal",
    version: 4,
    status: "published",
    linkedDiagnoses: ["Neonatal jaundice", "Term newborn"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-05T07:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Exclusive breastfeeding on demand, day and night.", ur: "دن رات جب بھی بچہ مانگے صرف ماں کا دودھ دیں۔" },
          { id: "s1b2", en: "Keep the umbilical cord dry and clean.", ur: "ناف کی جگہ کو خشک اور صاف رکھیں۔" },
          { id: "s1b3", en: "Maintain warmth — avoid overwrapping in hot weather.", ur: "بچے کو گرم رکھیں — گرم موسم میں زیادہ لپیٹنے سے گریز کریں۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "Yellow discoloration spreading or worsening", ur: "جسم پر زردی کا بڑھنا یا پھیلنا" },
          { id: "s2b2", en: "Poor feeding or excessive sleepiness", ur: "دودھ کم پینا یا حد سے زیادہ نیند/سستی" },
          { id: "s2b3", en: "Fever, or the baby feels cold to touch", ur: "بخار ہونا، یا بچے کے جسم کا چھونے سے ٹھنڈا محسوس ہونا" },
          { id: "s2b4", en: "Fast or grunting breathing, or the chest pulling in with each breath", ur: "سانس کا تیز چلنا، گھرگھراہٹ کی آواز، یا سانس کے ساتھ سینے کا اندر دھنسنا" },
          { id: "s2b5", en: "A fit/convulsion, unusual limpness, or bluish lips/body", ur: "دورہ پڑنا، غیر معمولی ڈھیلا پن، یا ہونٹوں/جسم کا نیلا پڑنا" },
          { id: "s2b6", en: "Swollen or distended abdomen", ur: "پیٹ کا سوجنا یا پھول جانا" },
        ],
      },
    ],
  },
  // Not WHO Pocket Book-sourced: that reference's convulsion/meningitis chapter is
  // written for inpatient acute management, not simple-febrile-seizure discharge
  // counselling. Content below reflects standard pediatric neurology teaching
  // (recovery position, the 5-minute status-epilepticus threshold) instead.
  {
    id: "ap_neurology_seizure",
    title: "Febrile Seizure — Home Care & Danger Signs",
    category: "neurology",
    version: 1,
    status: "published",
    linkedDiagnoses: ["Febrile seizure"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-03T10:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Control fever with paracetamol as advised; avoid overwrapping the child.", ur: "ڈاکٹر کی ہدایت کے مطابق پیراسیٹامول سے بخار کم رکھیں؛ بچے کو زیادہ نہ لپیٹیں۔" },
          { id: "s1b2", en: "If a seizure happens: lay the child on their side, do not restrain, do not put anything in the mouth.", ur: "اگر دورہ پڑے تو بچے کو ایک کروٹ پر لٹا دیں، اسے روکنے کی کوشش نہ کریں، اور منہ میں کچھ نہ ڈالیں۔" },
          { id: "s1b3", en: "Time any seizure — most stop within a few minutes on their own.", ur: "دورے کا وقت نوٹ کریں — زیادہ تر دورے چند منٹ میں خود ہی ختم ہو جاتے ہیں۔" },
          { id: "s1b4", en: "Keep a fever/seizure diary to show the follow-up doctor.", ur: "بخار اور دورے کی ڈائری بنائیں تاکہ فالو اپ پر ڈاکٹر کو دکھا سکیں۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "A seizure lasting more than 5 minutes", ur: "دورہ 5 منٹ سے زیادہ دیر تک جاری رہے" },
          { id: "s2b2", en: "More than one seizure in the same illness", ur: "اسی بیماری میں ایک سے زیادہ بار دورہ پڑے" },
          { id: "s2b3", en: "Difficulty breathing after the seizure", ur: "دورے کے بعد سانس لینے میں دشواری ہو" },
          { id: "s2b4", en: "Not returning to normal alertness within an hour", ur: "ایک گھنٹے میں بچہ معمول کے مطابق ہوش میں نہ آئے" },
        ],
      },
    ],
  },
  // Not WHO Pocket Book-sourced: congenital heart disease home care isn't covered
  // by that reference (it targets the major LMIC childhood-mortality causes —
  // pneumonia, diarrhea, malaria, malnutrition, neonatal illness — not cardiology).
  {
    id: "ap_cardiac_general",
    title: "Cardiac Follow-up — Home Care & Danger Signs",
    category: "cardiac",
    version: 1,
    status: "published",
    linkedDiagnoses: ["Congenital heart disease"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-03T10:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Give all cardiac medications at the same times each day — do not skip doses.", ur: "دل کی تمام دوائیں روزانہ ایک ہی وقت پر دیں — کوئی خوراک نہ چھوڑیں۔" },
          { id: "s1b2", en: "Feed in smaller, more frequent amounts if the child tires easily during feeds.", ur: "اگر بچہ دودھ پیتے وقت جلدی تھک جائے تو تھوڑی تھوڑی مقدار میں بار بار خوراک دیں۔" },
          { id: "s1b3", en: "Keep routine vaccinations up to date unless the cardiologist advises otherwise.", ur: "امراضِ قلب کے ڈاکٹر کی الگ ہدایت نہ ہو تو معمول کے حفاظتی ٹیکے وقت پر لگواتے رہیں۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "Bluish lips, tongue, or fingertips", ur: "ہونٹوں، زبان یا انگلیوں کے سروں کا نیلا پڑ جانا" },
          { id: "s2b2", en: "Fast breathing or breathlessness at rest", ur: "آرام کی حالت میں بھی سانس کا تیز چلنا یا سانس پھولنا" },
          { id: "s2b3", en: "Poor feeding with sweating during feeds", ur: "دودھ پیتے وقت پسینہ آنا اور خوراک کم لینا" },
          { id: "s2b4", en: "Swelling of the face, feet, or abdomen", ur: "چہرے، پیروں یا پیٹ پر سوجن" },
        ],
      },
    ],
  },
  // Not WHO Pocket Book-sourced: that reference discusses anemia mainly as a
  // finding within severe acute malnutrition (deferring iron until appetite/weight
  // gain resumes), not as its own outpatient iron-deficiency-anemia counselling
  // topic. Content below reflects standard iron-supplementation patient education.
  {
    id: "ap_hematology_anemia",
    title: "Iron Deficiency Anemia — Home Care & Danger Signs",
    category: "hematology",
    version: 1,
    status: "published",
    linkedDiagnoses: ["Iron deficiency anemia"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-03T10:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Give iron syrup with a straw or diluted — it can temporarily stain teeth.", ur: "آئرن کا شربت اسٹرا سے یا پانی میں ملا کر دیں — اس سے دانتوں پر عارضی داغ پڑ سکتے ہیں۔" },
          { id: "s1b2", en: "Give on an empty stomach if tolerated; a small amount of citrus juice helps absorption.", ur: "اگر برداشت ہو تو خالی پیٹ دیں؛ لیموں یا مالٹے کا تھوڑا رس جذب ہونے میں مدد دیتا ہے۔" },
          { id: "s1b3", en: "Offer iron-rich foods: meat, egg yolk, leafy greens, and iron-fortified cereal.", ur: "آئرن سے بھرپور خوراک دیں: گوشت، انڈے کی زردی، ہری سبزیاں، اور آئرن ملا سیریل۔" },
          { id: "s1b4", en: "Stools may turn dark — this is expected and not a concern.", ur: "پاخانے کا رنگ گہرا ہو سکتا ہے — یہ معمول کی بات ہے، پریشانی کی وجہ نہیں۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "Unusual paleness that is worsening", ur: "چہرے یا جسم کی زردی/پیلاہٹ کا بڑھتے جانا" },
          { id: "s2b2", en: "Breathlessness or rapid heartbeat with normal activity", ur: "معمولی کام کے دوران بھی سانس پھولنا یا دل کا تیز دھڑکنا" },
          { id: "s2b3", en: "Persistent vomiting after each dose", ur: "ہر خوراک کے بعد بار بار الٹی آنا" },
        ],
      },
    ],
  },
  // Cross-checked against WHO's dengue home-care/warning-sign guidance (bed rest,
  // oral fluids with electrolytes, urination-frequency threshold, and the specific
  // warning signs below) — paraphrased for parents. Enteric fever isn't covered by
  // that same source; its bullets here are general fever-management practice, not
  // WHO-specific, and were left unchanged.
  {
    id: "ap_infectious_fever",
    title: "Dengue / Enteric Fever — Home Care & Danger Signs",
    category: "infectious",
    version: 2,
    status: "published",
    linkedDiagnoses: ["Dengue fever", "Enteric fever"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-05T07:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Give plenty of oral fluids — water, ORS, and clear soups.", ur: "زیادہ سے زیادہ سیال دیں — پانی، او آر ایس، اور ہلکا سوپ۔" },
          { id: "s1b2", en: "Use paracetamol only for fever — avoid ibuprofen/aspirin-type medicines unless prescribed.", ur: "بخار کے لیے صرف پیراسیٹامول استعمال کریں — بغیر تجویز کے آئبوپروفین/اسپرین قسم کی دوائیں نہ دیں۔" },
          { id: "s1b3", en: "Rest at home and monitor temperature twice daily until settled.", ur: "گھر پر آرام کریں اور بخار ٹھیک ہونے تک روزانہ دو بار درجہ حرارت چیک کریں۔" },
          { id: "s1b4", en: "Complete the full course of any prescribed antibiotics.", ur: "تجویز کردہ اینٹی بائیوٹک کا مکمل کورس ضرور مکمل کریں۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "Bleeding from gums, nose, or in vomit/stool", ur: "مسوڑھوں یا ناک سے خون آنا، یا الٹی/پاخانے میں خون آنا" },
          { id: "s2b2", en: "Persistent abdominal pain or repeated vomiting", ur: "پیٹ میں مسلسل درد یا بار بار الٹی آنا" },
          { id: "s2b3", en: "Cold, clammy skin, or no urination for 6 hours or more", ur: "جسم کا ٹھنڈا اور چپچپا ہونا، یا 6 گھنٹے یا زیادہ دیر تک پیشاب نہ آنا" },
          { id: "s2b4", en: "Fever returning after several fever-free days", ur: "چند دن بخار اترنے کے بعد دوبارہ بخار آنا" },
          { id: "s2b5", en: "Unusual lethargy, restlessness, or irritability", ur: "غیر معمولی سستی، بے چینی، یا چڑچڑاپن" },
        ],
      },
    ],
  },
  // Cross-checked against WHO Pocket Book of Hospital Care for Children, 2nd ed.
  // (2013), "Severe acute malnutrition" chapter — its outpatient/discharge phase
  // specifies feeding at least 5 times daily with high-energy snacks between meals,
  // and treats failure to gain weight (or weight loss) over a 2-week window as the
  // primary criterion for returning to hospital, which was missing here before.
  {
    id: "ap_nutrition_feeding",
    title: "Malnutrition / Feeding — Home Care & Danger Signs",
    category: "nutrition",
    version: 2,
    status: "published",
    linkedDiagnoses: ["Protein-energy malnutrition"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-05T07:00:00.000Z",
    sections: [
      {
        id: "s1",
        heading: "Home Care",
        headingUr: "گھر کی دیکھ بھال",
        bullets: [
          { id: "s1b1", en: "Offer small, energy-dense meals at least 5 times a day, with high-energy snacks (e.g. milk, banana, bread, biscuits) in between.", ur: "دن میں کم از کم 5 بار تھوڑی مگر توانائی سے بھرپور خوراک دیں، اور درمیان میں توانائی بخش نمکو/اسنیکس (جیسے دودھ، کیلا، بریڈ، بسکٹ) دیں۔" },
          { id: "s1b2", en: "Continue breastfeeding alongside complementary feeds if under 2 years.", ur: "اگر بچہ 2 سال سے کم عمر ہے تو ماں کے دودھ کے ساتھ ساتھ اضافی خوراک بھی جاری رکھیں۔" },
          { id: "s1b3", en: "Follow the therapeutic/supplementary feeding plan exactly as advised.", ur: "علاجی/اضافی خوراک کا منصوبہ بالکل ہدایت کے مطابق اپنائیں۔" },
          { id: "s1b4", en: "Weigh the child weekly and bring the growth record to every follow-up visit.", ur: "ہر ہفتے بچے کا وزن کریں اور ہر فالو اپ وزٹ پر گروتھ ریکارڈ ساتھ لائیں۔" },
        ],
      },
      {
        id: "s2",
        heading: "Danger Signs — Return Immediately If",
        headingUr: "خطرے کی علامات — فوری واپس آئیں اگر",
        isDangerSigns: true,
        bullets: [
          { id: "s2b1", en: "Swelling of both feet", ur: "دونوں پیروں پر سوجن" },
          { id: "s2b2", en: "Refusing all feeds", ur: "بچے کا مکمل طور پر خوراک لینے سے انکار" },
          { id: "s2b3", en: "Lethargy or difficulty waking", ur: "سستی یا بچے کو جگانا مشکل ہونا" },
          { id: "s2b4", en: "New fever or worsening diarrhea", ur: "نیا بخار آنا یا دستوں کا بگڑنا" },
          { id: "s2b5", en: "Not gaining weight over 2 weeks, or weight loss between two weigh-ins", ur: "دو ہفتوں میں وزن نہ بڑھنا، یا دو وزن کے درمیان وزن کم ہو جانا" },
        ],
      },
    ],
  },
];

export const FOLLOW_UP_MODULES: FollowUpModule[] = [
  {
    id: "fm_peds_opd",
    service: "Pediatric OPD",
    version: 2,
    status: "published",
    defaultTimingLabel: "1 week",
    purpose: "Routine post-discharge review",
    instructions: "Bring this discharge card and any pending reports.",
    hasPendingResultReview: false,
    linkedDiagnoses: [],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "fm_chest_clinic",
    service: "Chest / Pulmonology Clinic",
    version: 1,
    status: "published",
    defaultTimingLabel: "2 weeks",
    purpose: "Respiratory recovery review",
    instructions: "Review chest exam; step down bronchodilator if improving.",
    hasPendingResultReview: false,
    linkedDiagnoses: ["Community-acquired pneumonia", "Asthma exacerbation", "Bronchiolitis"],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "fm_growth_clinic",
    service: "Growth & Nutrition Clinic",
    version: 1,
    status: "published",
    defaultTimingLabel: "4 weeks",
    purpose: "Growth monitoring",
    instructions: "Plot weight/height; review feeding practices.",
    hasPendingResultReview: false,
    linkedDiagnoses: [],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "fm_lab_review",
    service: "Pediatric OPD",
    version: 1,
    status: "published",
    defaultTimingLabel: "3 days",
    purpose: "Pending result review",
    instructions: "Review pending culture/lab results and adjust treatment if needed.",
    hasPendingResultReview: true,
    linkedDiagnoses: [],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
];

/** Modular rapid-fill catalog for Investigations — seeded deep (not a demo
 * sliver) so it's usable with zero setup; hospitals can add more via
 * Content Library → Investigation Panels. */
export const INVESTIGATION_PANELS: InvestigationPanel[] = [
  {
    id: "ip_cbc",
    name: "CBC",
    category: "Hematology",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "Hemoglobin" },
      { id: "t2", name: "TLC" },
      { id: "t3", name: "Platelets" },
      { id: "t4", name: "DLC" },
      { id: "t5", name: "ESR" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_serum_profile",
    name: "Serum Profile / RFTs",
    category: "Chemistry",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "Urea" },
      { id: "t2", name: "Creatinine" },
      { id: "t3", name: "Sodium" },
      { id: "t4", name: "Potassium" },
      { id: "t5", name: "Chloride" },
      { id: "t6", name: "Serum Calcium" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_lfts",
    name: "LFTs",
    category: "Chemistry",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "Bilirubin Total" },
      { id: "t2", name: "Bilirubin Direct" },
      { id: "t3", name: "ALT" },
      { id: "t4", name: "AST" },
      { id: "t5", name: "ALP" },
      { id: "t6", name: "Total Protein" },
      { id: "t7", name: "Albumin" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_sepsis_screen",
    name: "Sepsis Screen",
    category: "Infectious",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "CRP" },
      { id: "t2", name: "TLC" },
      { id: "t3", name: "ANC" },
      { id: "t4", name: "Blood Culture" },
      { id: "t5", name: "ESR" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_urine_re",
    name: "Urine R/E",
    category: "Chemistry",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "Colour" },
      { id: "t2", name: "Appearance" },
      { id: "t3", name: "pH" },
      { id: "t4", name: "Protein" },
      { id: "t5", name: "Glucose" },
      { id: "t6", name: "Pus Cells" },
      { id: "t7", name: "RBCs" },
      { id: "t8", name: "Epithelial Cells" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_crp",
    name: "CRP",
    category: "Infectious",
    version: 1,
    status: "published",
    tests: [{ id: "t1", name: "CRP" }],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_blood_culture",
    name: "Blood Culture & Sensitivity",
    category: "Infectious",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "Blood Culture" },
      { id: "t2", name: "Sensitivity" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_electrolytes",
    name: "Serum Electrolytes",
    category: "Chemistry",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "Sodium" },
      { id: "t2", name: "Potassium" },
      { id: "t3", name: "Chloride" },
      { id: "t4", name: "Bicarbonate" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_rbs",
    name: "Random Blood Sugar",
    category: "Chemistry",
    version: 1,
    status: "published",
    tests: [{ id: "t1", name: "RBS" }],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_coagulation",
    name: "Coagulation Profile",
    category: "Hematology",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "PT" },
      { id: "t2", name: "APTT" },
      { id: "t3", name: "INR" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_thyroid",
    name: "Thyroid Profile",
    category: "Chemistry",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "TSH" },
      { id: "t2", name: "T3" },
      { id: "t3", name: "T4" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_stool_re",
    name: "Stool R/E",
    category: "Chemistry",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "Consistency" },
      { id: "t2", name: "Mucus" },
      { id: "t3", name: "Blood" },
      { id: "t4", name: "Pus Cells" },
      { id: "t5", name: "Ova/Cysts" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_csf",
    name: "CSF Analysis",
    category: "Chemistry",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "Appearance" },
      { id: "t2", name: "Cell Count" },
      { id: "t3", name: "Protein" },
      { id: "t4", name: "Glucose" },
      { id: "t5", name: "Gram Stain" },
      { id: "t6", name: "Culture" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_malaria_ict",
    name: "Malaria ICT",
    category: "Infectious",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "P. Vivax" },
      { id: "t2", name: "P. Falciparum" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "ip_dengue",
    name: "Dengue Serology",
    category: "Infectious",
    version: 1,
    status: "published",
    tests: [
      { id: "t1", name: "NS1" },
      { id: "t2", name: "IgM" },
      { id: "t3", name: "IgG" },
    ],
    createdBy: "u_faisal",
    publishedBy: "u_admin",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
];

// ---- Modular content: frequency phrases + vocabulary lists -------------
// Faculty/Admin governed and versioned, same shape as everything above —
// replaces what used to be hardcoded in src/lib/frequency.ts (Urdu/English
// wording only — timesPerDay/intervalHours stay fixed, see FrequencyPhrase's
// own doc comment) and src/lib/clinical-vocab.ts (chip catalogs). Seeded
// from those same files' existing values so nothing changes on first load —
// only how it's edited afterward changes.
export const FREQUENCY_PHRASES: FrequencyPhrase[] = (Object.keys(FREQUENCY_OPTIONS) as (keyof typeof FREQUENCY_OPTIONS)[]).map(
  (code) => ({
    id: `fp_${code.toLowerCase()}`,
    frequencyCode: code,
    phraseEnglish: FREQUENCY_OPTIONS[code].parentPhraseEnglish,
    phraseUrdu: FREQUENCY_OPTIONS[code].parentPhraseUrdu,
    version: 1,
    status: "published",
    createdBy: "system",
    publishedBy: "system",
    updatedAt: "2026-09-05T00:00:00.000Z",
  }),
);

export const VOCABULARY_LISTS: VocabularyList[] = [
  {
    id: "vl_exam_chips",
    key: "exam_chips",
    label: "Examination Chips",
    chipsBySystem: EXAM_CHIPS,
    version: 1,
    status: "published",
    createdBy: "system",
    publishedBy: "system",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "vl_presenting_complaint_chips",
    key: "presenting_complaint_chips",
    label: "Presenting Complaint Chips",
    chipsBySystem: PRESENTING_COMPLAINT_CHIPS,
    version: 1,
    status: "published",
    createdBy: "system",
    publishedBy: "system",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "vl_history_chips",
    key: "history_chips",
    label: "History Chips",
    chipsBySystem: HISTORY_CHIPS,
    version: 1,
    status: "published",
    createdBy: "system",
    publishedBy: "system",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "vl_diagnosis_catalogue",
    key: "diagnosis_catalogue",
    label: "Diagnosis Catalogue",
    flatItems: [
      "Community-acquired pneumonia",
      "Bronchiolitis",
      "Asthma exacerbation",
      "Acute gastroenteritis",
      "Acute diarrhea",
      "Neonatal jaundice",
      "Term newborn",
      "Febrile seizure",
      "Urinary tract infection",
      "Acute tonsillitis",
      "Viral upper respiratory tract infection",
      "Dengue fever",
      "Enteric fever",
      "Iron deficiency anemia",
      "Protein-energy malnutrition",
      "Acute otitis media",
      "Congenital heart disease",
    ],
    version: 1,
    status: "published",
    createdBy: "system",
    publishedBy: "system",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
];

export const DIAGNOSIS_LIST: string[] = [
  "Community-acquired pneumonia",
  "Bronchiolitis",
  "Asthma exacerbation",
  "Acute gastroenteritis",
  "Acute diarrhea",
  "Neonatal jaundice",
  "Term newborn",
  "Febrile seizure",
  "Urinary tract infection",
  "Acute tonsillitis",
  "Viral upper respiratory tract infection",
  "Dengue fever",
  "Enteric fever",
  "Iron deficiency anemia",
  "Protein-energy malnutrition",
  "Acute otitis media",
  "Congenital heart disease",
];

// ---- Patients / Admissions ---------------------------------------------

export const PATIENTS: Patient[] = [
  {
    id: "p_ali_raza",
    mrNumber: "12345",
    name: "Ali Raza",
    fatherGuardianName: "Kamran Raza",
    dob: "2022-08-15",
    sex: "male",
  },
  {
    id: "p_sara_bibi",
    mrNumber: "12352",
    name: "Sara Bibi",
    fatherGuardianName: "Imran Ali",
    dob: "2025-12-20",
    sex: "female",
  },
  {
    id: "p_hamza_aslam",
    mrNumber: "12360",
    name: "Hamza Aslam",
    fatherGuardianName: "Shahid Aslam",
    dob: "2020-03-02",
    sex: "male",
  },
  {
    id: "p_fatima_zahra",
    mrNumber: "12366",
    name: "Fatima Zahra",
    fatherGuardianName: "Zahid Hussain",
    dob: "2024-01-11",
    sex: "female",
  },
  {
    id: "p_muhammad_ali",
    mrNumber: "12345",
    name: "Muhammad Ali",
    fatherGuardianName: "Tahir Mehmood",
    dob: "2022-08-28",
    sex: "male",
  },
];

export const ADMISSIONS: Admission[] = [
  {
    id: "a_ali_raza_1",
    patientId: "p_ali_raza",
    admissionDate: "2026-08-28",
    wardBed: "Peds / 12",
    reasonForAdmission: "Fever and cough for 3 days",
    weightKg: 14.2,
    heightCm: 96,
    allergy: { status: "not_documented", allergies: [] },
    alerts: ["High Alert"],
    status: "active",
  },
  {
    id: "a_sara_bibi_1",
    patientId: "p_sara_bibi",
    admissionDate: "2026-08-29",
    wardBed: "Peds / 08",
    reasonForAdmission: "Poor feeding, jaundice",
    weightKg: 4.1,
    heightCm: 55,
    allergy: { status: "none_known", allergies: [] },
    alerts: [],
    status: "active",
  },
  {
    id: "a_hamza_aslam_1",
    patientId: "p_hamza_aslam",
    admissionDate: "2026-08-27",
    dischargeDate: "2026-09-01",
    wardBed: "Peds / 05",
    reasonForAdmission: "Acute gastroenteritis with dehydration",
    weightKg: 17.8,
    heightCm: 110,
    allergy: { status: "documented", allergies: ["Penicillin"] },
    alerts: ["Drug Allergy"],
    status: "discharged",
  },
  {
    id: "a_fatima_zahra_1",
    patientId: "p_fatima_zahra",
    admissionDate: "2026-09-01",
    wardBed: "Peds / 11",
    reasonForAdmission: "Febrile seizure",
    weightKg: 10.6,
    heightCm: 82,
    allergy: { status: "none_known", allergies: [] },
    alerts: [],
    status: "active",
  },
  {
    id: "a_muhammad_ali_1",
    patientId: "p_muhammad_ali",
    admissionDate: "2026-08-28",
    dischargeDate: "2026-09-02",
    wardBed: "Pediatrics / 12",
    reasonForAdmission: "Fever, cough, breathlessness",
    weightKg: 14.2,
    heightCm: 97,
    allergy: { status: "not_documented", allergies: [] },
    alerts: ["High Alert"],
    status: "active",
  },
];

// ---- A seeded, partially-completed discharge for demo/reference --------

function seedMuhammadAliDischarge(): Discharge {
  const now = "2026-09-02T21:00:00.000Z";
  const content = emptyDischargeContent(emptyExaminationRecord, 14.2);

  content.diagnosis = {
    primary: { id: genId("dx"), label: "Community-acquired pneumonia", isCustom: false },
    secondary: [],
  };
  content.presentingComplaints = {
    complaints: [
      { id: genId("cx"), symptom: "Fever", duration: "3 days", isCustom: false },
      { id: genId("cx"), symptom: "Cough", duration: "3 days", isCustom: false },
      { id: genId("cx"), symptom: "Breathlessness", duration: "1 day", isCustom: false },
    ],
    narrative:
      "3-day history of high-grade fever and cough, with breathlessness for 1 day prior to admission. No vomiting, no diarrhea.",
  };
  content.history = {
    categories: {
      ...emptyHistoryCategories(),
      birth: { selected: ["Term delivery", "Birth history unremarkable"], note: "" },
      immunization: { selected: ["Immunization up to date per history"], note: "" },
      past_medical: { selected: ["No similar illness in the past"], note: "" },
      allergy: { selected: ["No known drug allergy"], note: "" },
    },
    narrative: "",
  };
  content.examination.general = { selected: ["Conscious", "Alert"], note: "Child conscious, alert, pale, febrile. No cyanosis. Mild dehydration." };
  content.examination.respiratory = { selected: ["Crepitations"], note: "Bilateral fine basal crepitations. No wheeze. No subcostal recession." };
  content.dischargeCondition = { selected: ["Conscious", "Afebrile", "Feeding well"], note: "" };

  content.investigations = [
    { id: genId("inv"), test: "CBC", result: "TLC 14.2, Hb 11.4", source: "manual", includeOnPrint: true },
    { id: genId("inv"), test: "CRP", result: "18 mg/L", source: "manual", includeOnPrint: true },
    { id: genId("inv"), test: "Chest X-ray", result: "Right lower lobe consolidation", source: "manual", includeOnPrint: true },
  ];

  content.treatment = {
    events: [
      { id: genId("tx"), type: "oxygen", detail: "2 L/min via nasal cannula, day 1–2" },
      { id: genId("tx"), type: "iv_fluids", detail: "Maintenance IV fluids, day 1–3" },
      { id: genId("tx"), type: "antibiotics", detail: "IV Ceftriaxone, day 1–4" },
    ],
    courseNarrative:
      "Admitted with community-acquired pneumonia. Started on oxygen and IV antibiotics; improved clinically over 4 days with resolution of breathlessness and defervescence. Weaned off oxygen on day 3.",
  };

  content.medications = [
    {
      id: genId("rx"),
      drugId: "d_amoxicillin",
      formulationId: "f_amox_250_5",
      doseRuleId: "r_amox_std",
      source: "new",
      trace: {
        weightKg: 14.2,
        doseRuleId: "r_amox_std",
        ruleLabel: "Amoxicillin — standard (45 mg/kg/day)",
        mgPerKg: 45,
        basis: "mg_per_kg_per_day",
        calculatedMgPerDay: 639,
        timesPerDay: 2,
        calculatedMgPerDose: 319.5,
        formulationId: "f_amox_250_5",
        formulationStrengthLabel: "250 mg/5 mL",
        calculatedVolumeMl: 6.4,
        finalDoseLabel: "6.4 mL",
        isOverridden: false,
        hasSubstantialDiscrepancy: false,
      },
      route: "PO",
      frequencyCode: "BD",
      duration: { preset: "7d" },
      prn: false,
    },
    {
      id: genId("rx"),
      drugId: "d_paracetamol",
      formulationId: "f_paracetamol_250_5",
      doseRuleId: "r_paracetamol_std",
      source: "new",
      trace: {
        weightKg: 14.2,
        doseRuleId: "r_paracetamol_std",
        ruleLabel: "Paracetamol — standard (15 mg/kg/dose)",
        mgPerKg: 15,
        basis: "mg_per_kg_per_dose",
        calculatedMgPerDose: 213,
        formulationId: "f_paracetamol_250_5",
        formulationStrengthLabel: "250 mg/5 mL",
        calculatedVolumeMl: 4.3,
        finalDoseLabel: "4.3 mL",
        isOverridden: false,
        hasSubstantialDiscrepancy: false,
      },
      route: "PO",
      frequencyCode: "Q6H",
      duration: { preset: "5d" },
      prn: true,
      prnIndication: "For fever above 100.4°F",
    },
  ];

  content.reconciliation = [
    {
      id: genId("rec"),
      sourceType: "inpatient",
      drugName: "Ceftriaxone (IV)",
      detailAsTaken: "IV Ceftriaxone 700 mg OD, day 1–4",
      decision: "stop",
      note: "IV course complete; stepped down to oral amoxicillin",
    },
    {
      id: genId("rec"),
      sourceType: "inpatient",
      drugName: "Amoxicillin (oral)",
      detailAsTaken: "Started day 3 as step-down",
      decision: "continue",
    },
  ];

  const respiratoryPack = ADVICE_PACKS.find((p) => p.id === "ap_respiratory")!;
  const respiratoryPackSections = JSON.parse(JSON.stringify(respiratoryPack.sections));
  content.advice = [
    {
      id: genId("adv"),
      packId: respiratoryPack.id,
      packTitle: respiratoryPack.title,
      version: respiratoryPack.version,
      category: respiratoryPack.category,
      sections: respiratoryPackSections,
      sourceSections: JSON.parse(JSON.stringify(respiratoryPack.sections)),
      appliedAt: now,
    },
  ];

  content.growth = { weightKg: 14.2, heightCm: 97, bmi: 15.1, showOnPrint: true };
  content.pendingTests = [
    { id: genId("pt"), test: "Blood culture", followUpAction: "Review at follow-up OPD visit" },
  ];
  content.immunization = { status: "up_to_date" };

  return {
    id: "dis_muhammad_ali_1",
    admissionId: "a_muhammad_ali_1",
    patientId: "p_muhammad_ali",
    status: "draft",
    revisionNumber: 1,
    templateId: "standard_pediatric",
    templateAutoSelected: true,
    parentLanguage: "urdu_english",
    paperSize: "A4",
    content,
    preparedById: "u_rehan",
    preparedByName: "Dr. Rehan Malik",
    revisionHistory: [],
    printEvents: [],
    archived: false,
    auditTrail: [
      {
        id: genId("audit"),
        dischargeId: "dis_muhammad_ali_1",
        actorId: "u_rehan",
        actorName: "Dr. Rehan Malik",
        action: "created",
        timestamp: now,
        revisionNumber: 1,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export const DISCHARGES: Discharge[] = [seedMuhammadAliDischarge()];
