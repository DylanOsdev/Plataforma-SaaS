import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'node:path';
import * as PDFDocument from 'pdfkit';
import { InvoicesService } from './invoices.service';

interface InvoicePdfData {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  cancelledAt: Date | null;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  workOrder: {
    description: string;
    milestone: string;
    vehicle: {
      make: string;
      model: string;
      year: number | null;
      plate: string;
    } | null;
    mechanics: Array<{
      mechanic: {
        name: string;
      };
      isPrimary: boolean;
    }>;
    spareParts: Array<{
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      sparePart: {
        name: string;
        code: string;
      };
    }>;
    cost: {
      subtotal: number | null;
      taxRate: number | null;
      taxAmount: number | null;
      total: number | null;
    } | null;
  } | null;
  payments: Array<{
    amount: number;
    method: string;
    reference: string | null;
    paymentDate: Date;
  }>;
}

@Injectable()
export class InvoicePdfService {
  private readonly fontPath: string;

  constructor(private readonly invoicesService: InvoicesService) {
    this.fontPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'assets',
      'fonts',
      'NotoSans-Regular.ttf',
    );
  }

  async generatePdf(tenantId: string, invoiceId: string): Promise<Buffer> {
    const invoice = await this.invoicesService.findOneForPdf(
      tenantId,
      invoiceId,
    );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.buildPdf(invoice as unknown as InvoicePdfData);
  }

  private buildPdf(invoice: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${invoice.invoiceNumber}`,
          Author: 'Taller SAAS',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.registerFont('NotoSans', this.fontPath);
      doc.font('NotoSans');

      if (invoice.status === 'cancelled') {
        this.drawCancelledBanner(doc);
      }

      doc.fontSize(22).font('NotoSans').text('Taller SAAS', { align: 'left' });
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Invoice', { align: 'right' })
        .fillColor('#000000');

      doc.moveDown(0.5);

      doc.fontSize(10).font('NotoSans');
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'left' });
      doc.text(
        `Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('es-AR')}`,
      );
      doc.text(`Status: ${invoice.status.toUpperCase()}`, { align: 'left' });
      doc.moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(0.5);

      if (invoice.client) {
        doc.fontSize(14).font('NotoSans').text('Client', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSans');
        doc.text(`Name: ${invoice.client.name}`);
        if (invoice.client.email) {
          doc.text(`Email: ${invoice.client.email}`);
        }
        if (invoice.client.phone) {
          doc.text(`Phone: ${invoice.client.phone}`);
        }
        if (invoice.client.address) {
          doc.text(`Address: ${invoice.client.address}`);
        }
        doc.moveDown(0.8);
      }

      if (invoice.workOrder?.vehicle) {
        doc.fontSize(14).font('NotoSans').text('Vehicle', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSans');
        const v = invoice.workOrder.vehicle;
        doc.text(
          `${v.make} ${v.model}${v.year ? ` (${v.year})` : ''} - Plate: ${v.plate}`,
        );
        doc.moveDown(0.8);
      }

      if (invoice.workOrder) {
        doc
          .fontSize(14)
          .font('NotoSans')
          .text('Work Order', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).font('NotoSans');
        doc.text(`Description: ${invoice.workOrder.description}`);
        doc.text(`Milestone: ${invoice.workOrder.milestone}`);

        if (
          invoice.workOrder.mechanics &&
          invoice.workOrder.mechanics.length > 0
        ) {
          doc.text(
            `Assigned Mechanics: ${invoice.workOrder.mechanics.map((m) => m.mechanic.name).join(', ')}`,
          );
        }
        doc.moveDown(0.8);
      }

      const parts =
        invoice.workOrder?.spareParts?.filter((p) => p.sparePart) ?? [];
      if (parts.length > 0) {
        doc
          .fontSize(14)
          .font('NotoSans')
          .text('Parts Used', { underline: true });
        doc.moveDown(0.3);
        this.drawTable(
          doc,
          ['Part', 'Code', 'Qty', 'Unit Price', 'Total'],
          parts.map((p) => [
            p.sparePart.name,
            p.sparePart.code,
            String(p.quantity),
            `$${Number(p.unitPrice).toFixed(2)}`,
            `$${Number(p.totalPrice).toFixed(2)}`,
          ]),
          [200, 70, 40, 80, 80],
        );
        doc.moveDown(0.5);
      } else {
        doc.fontSize(10).font('NotoSans').text('No parts used.');
        doc.moveDown(0.5);
      }

      if (invoice.payments && invoice.payments.length > 0) {
        doc.fontSize(14).font('NotoSans').text('Payments', { underline: true });
        doc.moveDown(0.3);
        this.drawTable(
          doc,
          ['Method', 'Amount', 'Reference', 'Date'],
          invoice.payments.map((p) => [
            p.method,
            `$${Number(p.amount).toFixed(2)}`,
            p.reference ?? '-',
            new Date(p.paymentDate).toLocaleDateString('es-AR'),
          ]),
          [100, 80, 150, 100],
        );
        doc.moveDown(0.5);
      }

      doc.moveDown(0.5);
      doc.fontSize(12).font('NotoSans');
      const subtotal = Number(invoice.subtotal);
      const taxAmount = Number(invoice.taxAmount);
      const totalAmount = Number(invoice.totalAmount);
      const paidAmount = Number(invoice.paidAmount);

      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' });
      doc.text(
        `Tax (${Number(invoice.taxRate) * 100}%): $${taxAmount.toFixed(2)}`,
        {
          align: 'right',
        },
      );
      doc
        .fontSize(14)
        .font('NotoSans')
        .text(`Total: $${totalAmount.toFixed(2)}`, { align: 'right' });
      doc.fontSize(10).font('NotoSans');
      doc.text(`Paid: $${paidAmount.toFixed(2)}`, { align: 'right' });
      const balance = totalAmount - paidAmount;
      doc
        .fontSize(12)
        .font('NotoSans')
        .fillColor(balance > 0 ? '#cc0000' : '#008000')
        .text(`Balance: $${balance.toFixed(2)}`, { align: 'right' })
        .fillColor('#000000');

      doc.moveDown(1);

      // --- QR PLACEHOLDER ---
      const qrX = 50;
      const qrY = doc.y + 10;
      const qrSize = 80;
      doc
        .rect(qrX, qrY, qrSize, qrSize)
        .lineWidth(1)
        .dash(3, { space: 2 })
        .stroke('#999999')
        .undash();
      doc
        .fontSize(8)
        .font('NotoSans')
        .fillColor('#666666')
        .text('QR Code', qrX + qrSize / 2 - 15, qrY + qrSize / 2 - 4, {
          align: 'center',
          width: 30,
        })
        .fillColor('#000000');

      doc.end();
    });
  }

  private drawCancelledBanner(doc: PDFKit.PDFDocument): void {
    const { width, height } = doc.page;
    const centerX = width / 2;
    const centerY = height / 2;

    doc.save();
    doc
      .fontSize(60)
      .font('NotoSans')
      .fillColor('#cc0000')
      .opacity(0.4)
      .translate(centerX, centerY)
      .rotate(-45)
      .text('CANCELLED', -150, -20, { align: 'center', width: 300 })
      .restore();

    doc.save();
    doc
      .rect(0, 0, width, 30)
      .fillColor('#cc0000')
      .fill()
      .fillColor('#ffffff')
      .fontSize(14)
      .font('NotoSans')
      .text('CANCELLED', width / 2 - 45, 6, { align: 'center', width: 90 })
      .restore();
  }

  private drawTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: string[][],
    columnWidths: number[],
  ): void {
    const startX = 50;
    let currentY = doc.y;
    const rowHeight = 18;

    doc.fontSize(9).font('NotoSans').fillColor('#ffffff');
    let x = startX;
    doc.save();
    doc
      .rect(
        startX,
        currentY,
        columnWidths.reduce((a, b) => a + b, 0),
        rowHeight,
      )
      .fill('#333333');
    doc.fillColor('#ffffff');
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x + 3, currentY + 4, {
        width: columnWidths[i],
        align: 'left',
      });
      x += columnWidths[i];
    }
    doc.restore();
    currentY += rowHeight;

    doc.fontSize(9).font('NotoSans').fillColor('#333333');
    for (const row of rows) {
      x = startX;
      const rowIndex = rows.indexOf(row);
      if (rowIndex % 2 === 1) {
        doc
          .rect(
            startX,
            currentY,
            columnWidths.reduce((a, b) => a + b, 0),
            rowHeight,
          )
          .fillColor('#f5f5f5')
          .fill()
          .fillColor('#333333');
      }
      for (let i = 0; i < row.length; i++) {
        doc.text(row[i] ?? '', x + 3, currentY + 4, {
          width: columnWidths[i],
          align: 'left',
        });
        x += columnWidths[i];
      }
      currentY += rowHeight;
    }
    doc.y = currentY + 5;
  }
}
