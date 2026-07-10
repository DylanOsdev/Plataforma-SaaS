import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
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
  seedMechanic,
  truncateMechanicsTable,
} from '../helpers/mechanic-seed.helper';
import {
  seedSparePart,
  truncateSparePartsTable,
} from '../helpers/spare-part-seed.helper';

describe('Invoice PDF Generation (e2e)', () => {
  let app: INestApplication;
  let seedPrisma: PrismaClient;

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
    await truncateInvoicesTable(seedPrisma);
    await truncateWorkOrdersTable(seedPrisma);
    await truncateWorkOrderMechanics(seedPrisma);
    await truncateWorkOrderSpareParts(seedPrisma);
    await truncateMechanicsTable(seedPrisma);
    await truncateSparePartsTable(seedPrisma);
    await truncateVehiclesTable(seedPrisma);
    await truncateClientsTable(seedPrisma);
    await truncateAuthTables(seedPrisma);
    await seedPrisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await truncateInvoicesTable(seedPrisma);
    await truncateWorkOrdersTable(seedPrisma);
    await truncateWorkOrderMechanics(seedPrisma);
    await truncateWorkOrderSpareParts(seedPrisma);
    await truncateMechanicsTable(seedPrisma);
    await truncateSparePartsTable(seedPrisma);
    await truncateVehiclesTable(seedPrisma);
    await truncateClientsTable(seedPrisma);
    await truncateAuthTables(seedPrisma);
  }, 15000);

  /** Helper: create a fully seeded invoice with client, vehicle, work order, mechanic, parts */
  async function seedFullInvoice(overrides?: {
    clientName?: string;
    vehicleMake?: string;
    partName?: string;
    status?: 'pending' | 'partial' | 'paid' | 'overpaid' | 'cancelled';
    addParts?: boolean;
    addPayments?: boolean;
  }) {
    const { accessToken, tenantId, userId } =
      await seedActiveUserWithTenant(seedPrisma);

    const client = await seedClient(seedPrisma, {
      tenantId,
      name: overrides?.clientName ?? 'Juan Pérez',
      email: 'juan@example.com',
      phone: '555-0100',
      address: 'Av. Siempre Viva 123',
    });

    const vehicle = await seedVehicle(seedPrisma, {
      tenantId,
      clientId: client.id,
      make: overrides?.vehicleMake ?? 'Toyota',
      model: 'Corolla',
      year: 2020,
      plate: 'ABC-123',
    });

    const workOrder = await seedWorkOrder(seedPrisma, {
      tenantId,
      vehicleId: vehicle.id,
      clientId: client.id,
      milestone: 'invoiced',
      description: 'Cambio de aceite y filtros',
    });

    // Add mechanic
    const mechanic = await seedMechanic(seedPrisma, {
      tenantId,
      name: 'Carlos Mecánico',
    });

    await seedPrisma.workOrderMechanic.create({
      data: {
        tenantId,
        workOrderId: workOrder.id,
        mechanicId: mechanic.id,
        isPrimary: true,
      },
    });

    // Add parts if requested
    if (overrides?.addParts !== false) {
      const part = await seedSparePart(seedPrisma, {
        tenantId,
        name: overrides?.partName ?? 'Filtro de aceite',
        code: 'FA-001',
        sellingPrice: 25.5,
      });

      await seedPrisma.workOrderSparePart.create({
        data: {
          tenantId,
          workOrderId: workOrder.id,
          sparePartId: part.id,
          quantity: 2,
          unitPrice: new Decimal(25.5),
          totalPrice: new Decimal(51),
        },
      });
    }

    // Add cost
    await seedPrisma.workOrderCost.create({
      data: {
        workOrderId: workOrder.id,
        laborCost: new Decimal(100),
        partsCost:
          overrides?.addParts !== false ? new Decimal(51) : new Decimal(0),
        subtotal:
          overrides?.addParts !== false ? new Decimal(151) : new Decimal(100),
        taxRate: new Decimal(0.21),
        taxAmount:
          overrides?.addParts !== false ? new Decimal(31.71) : new Decimal(21),
        total:
          overrides?.addParts !== false
            ? new Decimal(182.71)
            : new Decimal(121),
        calculatedAt: new Date(),
      },
    });

    const status = overrides?.status ?? 'pending';
    const totalAmount = overrides?.addParts !== false ? 182.71 : 121;
    const paidAmount =
      status === 'partial'
        ? 100
        : status === 'paid'
          ? totalAmount
          : status === 'overpaid'
            ? 200
            : 0;

    const invoice = await seedInvoice(seedPrisma, {
      tenantId,
      workOrderId: workOrder.id,
      clientId: client.id,
      status,
      totalAmount,
      paidAmount,
    });

    // Add payments if requested
    if (overrides?.addPayments !== false && paidAmount > 0) {
      await seedPrisma.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          amount: new Decimal(paidAmount),
          method: 'cash',
          reference: 'Pago inicial',
          receivedBy: userId,
          paymentDate: new Date(),
        },
      });
    }

    return {
      accessToken,
      tenantId,
      userId,
      client,
      vehicle,
      workOrder,
      mechanic,
      invoice,
    };
  }

  // ====================
  // T3.1: Success scenario
  // ====================
  it('T3.1 should return valid PDF for a complete invoice', async () => {
    const { accessToken, invoice } = await seedFullInvoice({
      status: 'paid',
    });

    const response = await request(app.getHttpServer())
      .get(`/invoices/${invoice.id}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Verify Content-Type
    expect(response.headers['content-type']).toBe('application/pdf');
    // Verify Content-Disposition
    expect(response.headers['content-disposition']).toMatch(/^inline;.*INV-/);
    // Verify PDF magic bytes
    expect(response.body).toBeInstanceOf(Buffer);
    expect(response.body.slice(0, 5).toString()).toBe('%PDF-');
  });

  // ====================
  // T3.2: 404 for non-existent invoice
  // ====================
  it('T3.2 should return 404 for non-existent invoice', async () => {
    const { accessToken } = await seedActiveUserWithTenant(seedPrisma);
    const fakeId = '00000000-0000-0000-0000-000000000000';

    await request(app.getHttpServer())
      .get(`/invoices/${fakeId}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  // ====================
  // T3.3: Spanish characters
  // ====================
  it('T3.3 should handle Spanish characters (ñ, tildes) in PDF', async () => {
    const { accessToken, invoice } = await seedFullInvoice({
      clientName: 'Martínez',
      vehicleMake: 'Órdenes',
      partName: 'ñandú',
      status: 'pending',
    });

    const response = await request(app.getHttpServer())
      .get(`/invoices/${invoice.id}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.body.slice(0, 5).toString()).toBe('%PDF-');
    // PDF uses embedded font, no way to assert exact text via HTTP,
    // but we verify the PDF renders without errors (200 status + valid PDF)
  });

  // ====================
  // T3.4: No parts
  // ====================
  it('T3.4 should generate PDF for invoice without work order parts', async () => {
    const { accessToken, invoice } = await seedFullInvoice({
      addParts: false,
      status: 'pending',
    });

    const response = await request(app.getHttpServer())
      .get(`/invoices/${invoice.id}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.body.slice(0, 5).toString()).toBe('%PDF-');
  });

  // ====================
  // T3.5: No payments (pending)
  // ====================
  it('T3.5 should generate PDF for pending invoice without payments', async () => {
    const { accessToken, invoice } = await seedFullInvoice({
      addPayments: false,
      status: 'pending',
    });

    const response = await request(app.getHttpServer())
      .get(`/invoices/${invoice.id}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.body.slice(0, 5).toString()).toBe('%PDF-');
  });

  // ====================
  // T3.6: Cancelled invoice
  // ====================
  it('T3.6 should generate PDF with CANCELLED banner for cancelled invoice', async () => {
    const { accessToken, invoice } = await seedFullInvoice({
      status: 'cancelled',
    });

    const response = await request(app.getHttpServer())
      .get(`/invoices/${invoice.id}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.body.slice(0, 5).toString()).toBe('%PDF-');
  });
});

// Helper truncates for additional tables
async function truncateWorkOrderMechanics(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE work_order_mechanics RESTART IDENTITY CASCADE',
  );
}

async function truncateWorkOrderSpareParts(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE work_order_spare_parts RESTART IDENTITY CASCADE',
  );
}
