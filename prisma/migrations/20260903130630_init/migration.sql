-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "designation" TEXT NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "hospitalName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "department" TEXT NOT NULL,
    "hodName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactAddress" TEXT NOT NULL,
    "defaultPaperSize" TEXT NOT NULL,
    "defaultParentLanguage" TEXT NOT NULL,

    CONSTRAINT "InstitutionalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "mrNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherGuardianName" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "contactPhone" TEXT,
    "address" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "admissionDate" TEXT NOT NULL,
    "dischargeDate" TEXT,
    "wardBed" TEXT NOT NULL,
    "reasonForAdmission" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "lengthCm" DOUBLE PRECISION,
    "headCircumferenceCm" DOUBLE PRECISION,
    "allergy" JSONB NOT NULL,
    "alerts" JSONB NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discharge" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateAutoSelected" BOOLEAN NOT NULL,
    "parentLanguage" TEXT NOT NULL,
    "paperSize" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "preparedById" TEXT NOT NULL,
    "preparedByName" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewerName" TEXT,
    "completedById" TEXT,
    "completedByName" TEXT,
    "revisionHistory" JSONB NOT NULL,
    "institutionalSnapshot" JSONB,
    "printEvents" JSONB NOT NULL,
    "auditTrail" JSONB NOT NULL,
    "archived" BOOLEAN NOT NULL,
    "archivedReason" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "Discharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericClass" TEXT,
    "formulary" TEXT NOT NULL,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formulation" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "strengthLabel" TEXT NOT NULL,
    "mgPerMl" DOUBLE PRECISION,
    "mgPerUnit" DOUBLE PRECISION,

    CONSTRAINT "Formulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoseRule" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "mgPerKg" DOUBLE PRECISION,
    "fixedMg" DOUBLE PRECISION,
    "defaultFrequencyCode" TEXT NOT NULL,
    "maxMgPerDose" DOUBLE PRECISION,
    "maxMgPerDay" DOUBLE PRECISION,
    "minAgeMonths" DOUBLE PRECISION,
    "maxAgeMonths" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedBy" TEXT,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "DoseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvicePack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "linkedDiagnoses" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedBy" TEXT,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "AdvicePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpModule" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "defaultTimingLabel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "hasPendingResultReview" BOOLEAN NOT NULL,
    "linkedDiagnoses" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedBy" TEXT,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "FollowUpModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Admission_patientId_idx" ON "Admission"("patientId");

-- CreateIndex
CREATE INDEX "Discharge_admissionId_idx" ON "Discharge"("admissionId");

-- CreateIndex
CREATE INDEX "Discharge_patientId_idx" ON "Discharge"("patientId");

-- CreateIndex
CREATE INDEX "Formulation_drugId_idx" ON "Formulation"("drugId");

-- CreateIndex
CREATE INDEX "DoseRule_drugId_idx" ON "DoseRule"("drugId");

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discharge" ADD CONSTRAINT "Discharge_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulation" ADD CONSTRAINT "Formulation_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoseRule" ADD CONSTRAINT "DoseRule_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
