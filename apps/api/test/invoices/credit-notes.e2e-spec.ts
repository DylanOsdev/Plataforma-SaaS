import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { createSeedPrismaClient } from '../helpers/tenant-seed.helper';
import {
  seedActiveUserWithTenant,
  truncateAuthTables,
} from '../helpers/auth-seed.helper';
import {
  seedClient,
  truncateClientsTable,
} from '../helpers/client-seed.helper';
import {
  seedVehicle,
  truncateVehiclesTable,
} from '../helpers/vehicle-seed.helper';
import {
  seedWorkOrder,
  truncateWorkOrdersTable,
} from '../helpers/work-order-seed.helper';
import {
  seedInvoice,
  truncateInvoicesTable,
} from '../helpers/invoice-seed.helper';
import {
  seedCreditNote,
  truncateCreditNotesTable,
} from '../helpers/credit-note-seed.helper';

describe('CreditNotes (e2e)', () => {
  let app: INestApplication;
  let seedPrisma: PrismaClient;
  let accessToken: string;
  let tenantId: string;
  let userId: string;
  let invoiceId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    seedPrisma = createSeedPrismaClient();
  }, 30000);

  afterAll(async () => {
    await truncateCreditNotesTable(seedPrisma);
    await truncateInvoicesTable(seedPrisma);
    await truncateWorkOrdersTable(seedPrisma);
    await truncateVehiclesTable(seedPrisma);
    await truncateClientsTable(seedPrisma);
    await truncateAuthTables(seedPrisma);
    await seedPrisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await truncateCreditNotesTable(seedPrisma);
    await truncateInvoicesTable(seedPrisma);
    await truncateWorkOrdersTable(seedPrisma);
    await truncateVehiclesTable(seedPrisma);
    await truncateClientsTable(seedPrisma);
    await truncateAuthTables(seedPrisma);

    const user = await seedActiveUserWithTenant(seedPrisma);
    accessToken = user.accessToken;
    tenantId = user.tenantId;
    userId = user.userId;

    const client = await seedClient(seedPrisma, { tenantId });
    const vehicle = await seedVehicle(seedPrisma, {
      tenantId,
      clientId: client.id,
    });
    const workOrder = await seedWorkOrder(seedPrisma, {
      tenantId,
      vehicleId: vehicle.id,
      clientId: client.id,
      milestone: 'invoiced',
    });
    const invoice = await seedInvoice(seedPrisma, {
      tenantId,
      workOrderId: workOrder.id,
      clientId: client.id,
      totalAmount: 1000,
      status: 'paid',
    });
    invoiceId = invoice.id;
  });

  describe('GET /invoices/:id/credit-notes', () => {
    it('should return empty list when invoice has no credit notes', async () => {
      const response = await request(app.getHttpServer())
        .get(`/invoices/${invoiceId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return credit notes for an invoice', async () => {
      await seedCreditNote(seedPrisma, {
        tenantId,
        invoiceId,
        type: 'credit',
        amount: 500,
        reason: 'Discount',
      });
      await seedCreditNote(seedPrisma, {
        tenantId,
        invoiceId,
        type: 'debit',
        amount: 200,
        reason: 'Fee adjustment',
      });

      const response = await request(app.getHttpServer())
        .get(`/invoices/${invoiceId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.data[0].reason).toBeDefined();
    });
  });

  describe('POST /invoices/:id/credit-notes', () => {
    it('should create a credit note with valid data', async () => {
      const createDto = {
        type: 'credit',
        amount: 500,
        reason: 'Discount adjustment',
      };

      const response = await request(app.getHttpServer())
        .post(`/invoices/${invoiceId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.type).toBe('credit');
      expect(response.body.amount).toBe('500');
      expect(response.body.reason).toBe('Discount adjustment');
      expect(response.body.status).toBe('active');
      expect(response.body.number).toMatch(/^NC-\d{4}$/);
      expect(response.body.invoiceId).toBe(invoiceId);
    });

    it('should create a debit note with valid data', async () => {
      const createDto = {
        type: 'debit',
        amount: 300,
        reason: 'Fee adjustment',
      };

      const response = await request(app.getHttpServer())
        .post(`/invoices/${invoiceId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.type).toBe('debit');
      expect(response.body.amount).toBe('300');
      expect(response.body.number).toMatch(/^ND-\d{4}$/);
    });

    it('should return 404 when invoice does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/invoices/${fakeId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ type: 'credit', amount: 500, reason: 'Test' })
        .expect(404);
    });

    it('should return 422 when invoice is cancelled', async () => {
      // Create a cancelled invoice
      const invoice = await seedInvoice(seedPrisma, {
        tenantId,
        workOrderId: (
          await seedWorkOrder(seedPrisma, {
            tenantId,
            vehicleId: (
              await seedVehicle(seedPrisma, {
                tenantId,
                clientId: (
                  await seedClient(seedPrisma, { tenantId })
                ).id,
              })
            ).id,
            clientId: (
              await seedClient(seedPrisma, { tenantId })
            ).id,
            milestone: 'completed',
          })
        ).id,
        clientId: (
          await seedClient(seedPrisma, { tenantId })
        ).id,
        status: 'cancelled',
      });

      await request(app.getHttpServer())
        .post(`/invoices/${invoice.id}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ type: 'credit', amount: 500, reason: 'Test' })
        .expect(422);
    });

    it('should return 400 when amount is zero or negative', async () => {
      await request(app.getHttpServer())
        .post(`/invoices/${invoiceId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ type: 'credit', amount: 0, reason: 'Test' })
        .expect(400);

      await request(app.getHttpServer())
        .post(`/invoices/${invoiceId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ type: 'credit', amount: -100, reason: 'Test' })
        .expect(400);
    });

    it('should return 400 when type is invalid', async () => {
      await request(app.getHttpServer())
        .post(`/invoices/${invoiceId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ type: 'invalid', amount: 500, reason: 'Test' })
        .expect(400);
    });

    it('should not modify invoice paidAmount after credit note creation', async () => {
      const createDto = {
        type: 'credit',
        amount: 500,
        reason: 'Discount adjustment',
      };

      await request(app.getHttpServer())
        .post(`/invoices/${invoiceId}/credit-notes`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      // Verify invoice paidAmount was NOT modified
      const invoiceCheck = await seedPrisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      expect(invoiceCheck!.paidAmount.toString()).toBe('0');
      expect(invoiceCheck!.status).toBe('paid');
    });
  });

  describe('POST /credit-notes/:id/cancel', () => {
    it('should cancel an active credit note', async () => {
      const note = await seedCreditNote(seedPrisma, {
        tenantId,
        invoiceId,
        type: 'credit',
      });

      const response = await request(app.getHttpServer())
        .post(`/credit-notes/${note.id}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.status).toBe('cancelled');
      expect(response.body.cancelledAt).toBeDefined();
    });

    it('should return 422 when credit note is already cancelled', async () => {
      const note = await seedCreditNote(seedPrisma, {
        tenantId,
        invoiceId,
        type: 'credit',
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: userId,
      });

      await request(app.getHttpServer())
        .post(`/credit-notes/${note.id}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(422);
    });

    it('should return 404 when credit note does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/credit-notes/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should not see credit notes from another tenant', async () => {
      // Create note in tenant 1
      const note = await seedCreditNote(seedPrisma, {
        tenantId,
        invoiceId,
        type: 'credit',
      });

      // Create another tenant
      const otherUser = await seedActiveUserWithTenant(seedPrisma);
      const otherClient = await seedClient(seedPrisma, {
        tenantId: otherUser.tenantId,
      });
      const otherVehicle = await seedVehicle(seedPrisma, {
        tenantId: otherUser.tenantId,
        clientId: otherClient.id,
      });
      const otherWorkOrder = await seedWorkOrder(seedPrisma, {
        tenantId: otherUser.tenantId,
        vehicleId: otherVehicle.id,
        clientId: otherClient.id,
        milestone: 'invoiced',
      });
      const otherInvoice = await seedInvoice(seedPrisma, {
        tenantId: otherUser.tenantId,
        workOrderId: otherWorkOrder.id,
        clientId: otherClient.id,
        status: 'paid',
      });

      // Try to cancel the note from tenant 1 using tenant 2's token
      await request(app.getHttpServer())
        .post(`/credit-notes/${note.id}/cancel`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);
    });
  });
});
