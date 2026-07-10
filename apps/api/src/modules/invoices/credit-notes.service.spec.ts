import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreditNotesService } from './credit-notes.service';
import { PrismaService } from '../../common/prisma';
import { Decimal } from '@prisma/client/runtime/library';

describe('CreditNotesService', () => {
  let module: TestingModule;
  let service: CreditNotesService;

  const mockTenantId = '00000000-0000-0000-0000-000000000001';
  const mockInvoiceId = '66666666-6666-6666-6666-666666666666';
  const mockCreditNoteId = '77777777-7777-7777-7777-777777777777';
  const mockUserId = '55555555-5555-5555-5555-555555555555';

  const mockTx = {
    creditNote: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(),
    },
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        CreditNotesService,
        {
          provide: PrismaService,
          useValue: {
            withRlsTransaction: jest.fn((callback) => callback(mockTx)),
          },
        },
      ],
    }).compile();

    service = module.get<CreditNotesService>(CreditNotesService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    for (const group of Object.values(mockTx)) {
      for (const fn of Object.values(group)) {
        if (jest.isMockFunction(fn)) fn.mockReset();
      }
    }
  });

  describe('create', () => {
    const mockInvoice = {
      id: mockInvoiceId,
      tenantId: mockTenantId,
      status: 'paid' as const,
      totalAmount: new Decimal(1210),
    };

    const mockCreditNote = {
      id: mockCreditNoteId,
      tenantId: mockTenantId,
      invoiceId: mockInvoiceId,
      type: 'credit' as const,
      amount: new Decimal(500),
      reason: 'Discount adjustment',
      status: 'active' as const,
      number: 'NC-0001',
      issueDate: new Date(),
      cancelledAt: null,
      cancelledBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dto = {
      type: 'credit' as const,
      amount: 500,
      reason: 'Discount adjustment',
    };

    it('should create a credit note when invoice exists and is not cancelled', async () => {
      mockTx.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockTx.creditNote.count.mockResolvedValue(0);
      mockTx.creditNote.create.mockResolvedValue(mockCreditNote);

      const result = await service.create(
        mockTenantId,
        mockInvoiceId,
        dto,
        mockUserId,
      );

      expect(result).toEqual(mockCreditNote);
      expect(mockTx.creditNote.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      mockTx.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, mockInvoiceId, dto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException when invoice is cancelled', async () => {
      mockTx.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'cancelled',
      });

      await expect(
        service.create(mockTenantId, mockInvoiceId, dto, mockUserId),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should generate NC-XXXX number for credit type', async () => {
      mockTx.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockTx.creditNote.count.mockResolvedValue(0);
      mockTx.creditNote.create.mockResolvedValue(mockCreditNote);

      await service.create(mockTenantId, mockInvoiceId, dto, mockUserId);

      const createCall = mockTx.creditNote.create.mock.calls[0][0];
      expect(createCall.data.number).toBe('NC-0001');
    });

    it('should generate ND-XXXX number for debit type', async () => {
      mockTx.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockTx.creditNote.count.mockResolvedValue(0);
      mockTx.creditNote.create.mockResolvedValue({
        ...mockCreditNote,
        type: 'debit',
        number: 'ND-0001',
      });

      await service.create(
        mockTenantId,
        mockInvoiceId,
        { ...dto, type: 'debit' },
        mockUserId,
      );

      const createCall = mockTx.creditNote.create.mock.calls[0][0];
      expect(createCall.data.number).toBe('ND-0001');
    });

    it('should increment number based on existing count', async () => {
      mockTx.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockTx.creditNote.count.mockResolvedValue(5);
      mockTx.creditNote.create.mockResolvedValue(mockCreditNote);

      await service.create(mockTenantId, mockInvoiceId, dto, mockUserId);

      const createCall = mockTx.creditNote.create.mock.calls[0][0];
      expect(createCall.data.number).toBe('NC-0006');
    });
  });

  describe('findByInvoice', () => {
    const mockNotes = [
      {
        id: mockCreditNoteId,
        tenantId: mockTenantId,
        invoiceId: mockInvoiceId,
        type: 'credit',
        amount: new Decimal(500),
        reason: 'Discount',
        status: 'active',
        number: 'NC-0001',
        issueDate: new Date(),
        cancelledAt: null,
        cancelledBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return credit notes for an invoice', async () => {
      mockTx.creditNote.findMany.mockResolvedValue(mockNotes);
      mockTx.creditNote.count.mockResolvedValue(1);

      const result = await service.findByInvoice(mockTenantId, mockInvoiceId);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockTx.creditNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { invoiceId: mockInvoiceId, tenantId: mockTenantId },
        }),
      );
    });

    it('should return empty list when invoice has no notes', async () => {
      mockTx.creditNote.findMany.mockResolvedValue([]);
      mockTx.creditNote.count.mockResolvedValue(0);

      const result = await service.findByInvoice(mockTenantId, mockInvoiceId);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should order notes by issueDate descending', async () => {
      mockTx.creditNote.findMany.mockResolvedValue(mockNotes);
      mockTx.creditNote.count.mockResolvedValue(1);

      await service.findByInvoice(mockTenantId, mockInvoiceId);

      expect(mockTx.creditNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { issueDate: 'desc' },
        }),
      );
    });
  });

  describe('cancel', () => {
    const mockActiveNote = {
      id: mockCreditNoteId,
      tenantId: mockTenantId,
      invoiceId: mockInvoiceId,
      type: 'credit' as const,
      amount: new Decimal(500),
      reason: 'Discount',
      status: 'active' as const,
      number: 'NC-0001',
      issueDate: new Date(),
      cancelledAt: null,
      cancelledBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCancelledNote = {
      ...mockActiveNote,
      status: 'cancelled' as const,
      cancelledAt: new Date(),
      cancelledBy: 'some-user-id',
    };

    const mockCancelledResult = {
      ...mockCancelledNote,
      cancelledAt: expect.any(Date),
      cancelledBy: mockUserId,
    };

    it('should cancel an active credit note', async () => {
      mockTx.creditNote.findFirst.mockResolvedValue(mockActiveNote);
      mockTx.creditNote.update.mockResolvedValue(mockCancelledResult);

      const result = await service.cancel(
        mockTenantId,
        mockCreditNoteId,
        mockUserId,
      );

      expect(result.status).toBe('cancelled');
      expect(result.cancelledAt).toBeDefined();
      expect(mockTx.creditNote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCreditNoteId, tenantId: mockTenantId },
          data: expect.objectContaining({
            status: 'cancelled',
            cancelledBy: mockUserId,
          }),
        }),
      );
    });

    it('should throw NotFoundException when credit note does not exist', async () => {
      mockTx.creditNote.findFirst.mockResolvedValue(null);

      await expect(
        service.cancel(mockTenantId, mockCreditNoteId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException when already cancelled', async () => {
      mockTx.creditNote.findFirst.mockResolvedValue(mockCancelledNote);

      await expect(
        service.cancel(mockTenantId, mockCreditNoteId, mockUserId),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
