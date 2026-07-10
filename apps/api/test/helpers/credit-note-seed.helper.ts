import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface SeedCreditNoteOpts {
  tenantId: string;
  invoiceId: string;
  type?: 'credit' | 'debit';
  amount?: number;
  reason?: string;
  status?: 'active' | 'cancelled';
  number?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
}

export async function seedCreditNote(
  prisma: PrismaClient,
  opts: SeedCreditNoteOpts,
): Promise<{ id: string }> {
  const count = opts.number
    ? 0
    : await prisma.creditNote.count({
        where: { tenantId: opts.tenantId, type: opts.type ?? 'credit' },
      });

  const prefix = (opts.type ?? 'credit') === 'credit' ? 'NC' : 'ND';
  const number =
    opts.number ?? `${prefix}-${String(count + 1).padStart(4, '0')}`;

  const note = await prisma.creditNote.create({
    data: {
      tenantId: opts.tenantId,
      invoiceId: opts.invoiceId,
      type: opts.type ?? 'credit',
      amount: opts.amount ?? 500,
      reason: opts.reason ?? 'Test credit note',
      status: opts.status ?? 'active',
      number,
      cancelledAt: opts.cancelledAt ?? null,
      cancelledBy: opts.cancelledBy ?? null,
    },
  });

  return { id: note.id };
}

export async function truncateCreditNotesTable(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE credit_notes RESTART IDENTITY CASCADE');
}
