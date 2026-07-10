import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { PaymentsService } from './payments.service';
import { CreditNotesService } from './credit-notes.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicePdfService, PaymentsService, CreditNotesService],
  exports: [InvoicesService, InvoicePdfService, PaymentsService, CreditNotesService],
})
export class InvoicesModule {}
