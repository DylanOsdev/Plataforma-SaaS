import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicePdfService, PaymentsService],
  exports: [InvoicesService, InvoicePdfService, PaymentsService],
})
export class InvoicesModule {}
