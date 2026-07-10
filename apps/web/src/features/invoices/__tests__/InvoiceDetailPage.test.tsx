import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../../test/renderWithProviders';

const mockUseGetInvoiceQuery = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../invoicesApi', () => ({
  useGetInvoiceQuery: (...args: unknown[]) => mockUseGetInvoiceQuery(...args),
  useListInvoicesQuery: vi.fn(),
  useCreateInvoiceMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}));

import InvoiceDetailPage from '../pages/InvoiceDetailPage';

const sampleInvoice = {
  id: 'inv-1',
  invoiceNumber: 'INV-0001',
  status: 'paid' as const,
  subtotal: 10000,
  taxRate: 0.21,
  taxAmount: 2100,
  totalAmount: 12100,
  paidAmount: 12100,
  issueDate: '2026-07-01T10:00:00Z',
  notes: 'Regular maintenance',
  client: { id: 'c-1', name: 'John Doe' },
  workOrder: { id: 'wo-1' },
  payments: [
    { id: 'p-1', amount: 12100, method: 'transfer' as const, paymentDate: '2026-07-02T10:00:00Z' },
  ],
  createdAt: '2026-07-01T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderDetailPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
    </Routes>,
    { initialEntries: ['/invoices/inv-1'] },
  );
}

describe('InvoiceDetailPage', () => {
  it('should show loading state while fetching', () => {
    mockUseGetInvoiceQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { container } = renderDetailPage();
    const spinners = container.querySelectorAll('.MuiCircularProgress-root');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('should show error alert when API fails', () => {
    mockUseGetInvoiceQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Failed to load invoice' } },
    });

    renderDetailPage();

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/failed to load/i);
  });

  it('should show not found message when invoice does not exist', () => {
    mockUseGetInvoiceQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDetailPage();

    expect(screen.getByText(/factura no encontrada/i)).toBeInTheDocument();
  });

  it('should render invoice detail data', () => {
    mockUseGetInvoiceQuery.mockReturnValue({
      data: sampleInvoice,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDetailPage();

    expect(screen.getByText('INV-0001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    const amountElements = screen.getAllByText('$12,100');
    expect(amountElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render payment status chip', () => {
    mockUseGetInvoiceQuery.mockReturnValue({
      data: sampleInvoice,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDetailPage();

    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  it('should render issue date', () => {
    mockUseGetInvoiceQuery.mockReturnValue({
      data: sampleInvoice,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDetailPage();

    const dateStr = new Date(sampleInvoice.issueDate).toLocaleDateString();
    expect(screen.getByText(dateStr)).toBeInTheDocument();
  });

  it('should render PDF preview with download button', () => {
    mockUseGetInvoiceQuery.mockReturnValue({
      data: sampleInvoice,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDetailPage();

    const downloadBtn = screen.getByRole('button', { name: /descargar pdf/i });
    expect(downloadBtn).toBeInTheDocument();
    expect(downloadBtn).not.toBeDisabled();
  });

  it('should navigate back to invoices list on back button click', async () => {
    const user = userEvent.setup();
    mockUseGetInvoiceQuery.mockReturnValue({
      data: sampleInvoice,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderDetailPage();

    const backButton = screen.getByRole('button', { name: /back to invoices/i });
    expect(backButton).toBeInTheDocument();
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/invoices');
  });
});
