-- CreateEnum
CREATE TYPE "CreditNoteType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('active', 'cancelled');

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "type" "CreditNoteType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'active',
    "number" VARCHAR(20) NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_notes_tenant_id_invoice_id_idx" ON "credit_notes"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "credit_notes_tenant_id_type_idx" ON "credit_notes"("tenant_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_tenant_id_number_key" ON "credit_notes"("tenant_id", "number");

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "credit_notes" ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "tenant_isolation" ON "credit_notes" FOR ALL USING (
  tenant_id = current_setting('app.tenant_id')::uuid
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON "credit_notes" TO taller_app;
