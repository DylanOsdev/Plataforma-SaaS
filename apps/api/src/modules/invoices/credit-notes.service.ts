import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { QueryCreditNoteDto } from './dto/query-credit-note.dto';
import { CreditNoteType, CreditNoteStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CreditNotesService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    invoiceId: string,
    dto: CreateCreditNoteDto,
    userId: string,
  ) {
    return this.prisma.withRlsTransaction(async (tx) => {
      // 1. Fetch invoice
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status === 'cancelled') {
        throw new UnprocessableEntityException(
          'Cannot create credit note for a cancelled invoice',
        );
      }

      // 2. Generate number
      const number = await this.generateNumber(tx, tenantId, dto.type);

      // 3. Create credit note
      const creditNote = await tx.creditNote.create({
        data: {
          tenantId,
          invoiceId,
          type: dto.type,
          amount: new Decimal(dto.amount),
          reason: dto.reason,
          number,
        },
      });

      return creditNote;
    });
  }

  async findByInvoice(
    tenantId: string,
    invoiceId: string,
    query?: QueryCreditNoteDto,
  ) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { invoiceId, tenantId };

    if (query?.type) {
      where.type = query.type;
    }

    if (query?.status) {
      where.status = query.status;
    }

    const [data, total] = await this.prisma.withRlsTransaction(async (tx) => {
      const notes = await tx.creditNote.findMany({
        where,
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      });

      const count = await tx.creditNote.count({ where });

      return [notes, count] as const;
    });

    return { data, total, page, limit };
  }

  async cancel(tenantId: string, creditNoteId: string, userId: string) {
    return this.prisma.withRlsTransaction(async (tx) => {
      // 1. Fetch credit note
      const note = await tx.creditNote.findFirst({
        where: { id: creditNoteId, tenantId },
      });

      if (!note) {
        throw new NotFoundException('Credit note not found');
      }

      if (note.status === 'cancelled') {
        throw new UnprocessableEntityException(
          'Credit note is already cancelled',
        );
      }

      // 2. Cancel
      const updated = await tx.creditNote.update({
        where: { id: creditNoteId, tenantId },
        data: {
          status: 'cancelled' as CreditNoteStatus,
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      });

      return updated;
    });
  }

  private async generateNumber(
    tx: any,
    tenantId: string,
    type: CreditNoteType,
  ): Promise<string> {
    const prefix = type === 'credit' ? 'NC' : 'ND';

    const count = await tx.creditNote.count({
      where: {
        tenantId,
        type,
      },
    });

    const nextNumber = count + 1;
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }
}
