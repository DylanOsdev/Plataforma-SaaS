import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  StreamableFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { PaymentsService } from './payments.service';
import { CreditNotesService } from './credit-notes.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { QueryCreditNoteDto } from './dto/query-credit-note.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { ReportSummaryDto } from './dto/report-summary.dto';
import { TenantContextInterceptor } from '../../common/tenant/tenant-context.interceptor';
import { TenantContext } from '../../common/tenant/tenant-context.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  id: string;
  tenantId: string;
  role: string;
}

@Controller()
@UseInterceptors(TenantContextInterceptor)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly paymentsService: PaymentsService,
    private readonly creditNotesService: CreditNotesService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Roles('admin_taller', 'recepcionista')
  @Post('work-orders/:id/invoice')
  createInvoice(
    @Param('id') workOrderId: string,
    @Body() dto: CreateInvoiceDto,
  ): Promise<any> {
    return this.invoicesService.createInvoice(
      this.tenantContext.tenantId,
      workOrderId,
      dto,
    );
  }

  @Roles('admin_taller', 'recepcionista', 'mecanico')
  @Get('invoices')
  findAll(
    @Query() query: QueryInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.invoicesService.findAll(
      this.tenantContext.tenantId,
      query,
      user.id,
      user.role,
    );
  }

  @Roles('admin_taller', 'recepcionista')
  @Get('invoices/reports/summary')
  getReportSummary(@Query() query: ReportSummaryDto): Promise<any> {
    return this.invoicesService.getReportSummary(
      this.tenantContext.tenantId,
      query.dateFrom ? new Date(query.dateFrom) : undefined,
      query.dateTo ? new Date(query.dateTo) : undefined,
    );
  }

  @Roles('admin_taller', 'recepcionista', 'mecanico')
  @Get('invoices/:id')
  findOne(@Param('id') id: string): Promise<any> {
    return this.invoicesService.findOne(this.tenantContext.tenantId, id);
  }

  @Roles('admin_taller', 'recepcionista', 'mecanico')
  @Get('invoices/:id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.invoicePdfService.generatePdf(
      this.tenantContext.tenantId,
      id,
    );

    const invoice = await this.invoicesService.findOne(
      this.tenantContext.tenantId,
      id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    return new StreamableFile(pdfBuffer);
  }

  @Roles('admin_taller', 'recepcionista')
  @Post('invoices/:id/pay')
  registerPayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.paymentsService.registerPayment(
      this.tenantContext.tenantId,
      id,
      dto,
      user.id,
    );
  }

  @Roles('admin_taller', 'recepcionista')
  @Post('invoices/:id/cancel')
  cancelInvoice(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.invoicesService.cancelInvoice(
      this.tenantContext.tenantId,
      id,
      user.id,
    );
  }

  @Roles('admin_taller', 'recepcionista', 'mecanico')
  @Get('invoices/:id/credit-notes')
  findCreditNotes(
    @Param('id') id: string,
    @Query() query: QueryCreditNoteDto,
  ): Promise<any> {
    return this.creditNotesService.findByInvoice(
      this.tenantContext.tenantId,
      id,
      query,
    );
  }

  @Roles('admin_taller', 'recepcionista')
  @Post('invoices/:id/credit-notes')
  createCreditNote(
    @Param('id') id: string,
    @Body() dto: CreateCreditNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.creditNotesService.create(
      this.tenantContext.tenantId,
      id,
      dto,
      user.id,
    );
  }

  @Roles('admin_taller', 'recepcionista')
  @Post('credit-notes/:id/cancel')
  cancelCreditNote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.creditNotesService.cancel(
      this.tenantContext.tenantId,
      id,
      user.id,
    );
  }
}
