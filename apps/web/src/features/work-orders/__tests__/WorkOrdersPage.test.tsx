import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';

// Mock the workOrdersApi module so hooks return controlled data
const mockUseListWorkOrdersQuery = vi.fn();
const mockUseCreateWorkOrderMutation = vi.fn();
const mockUseGetWorkOrderQuery = vi.fn();
const mockCreateInvoice = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../workOrdersApi', () => ({
  useListWorkOrdersQuery: (...args: unknown[]) => mockUseListWorkOrdersQuery(...args),
  useCreateWorkOrderMutation: (...args: unknown[]) => mockUseCreateWorkOrderMutation(...args),
  useGetWorkOrderQuery: (...args: unknown[]) => mockUseGetWorkOrderQuery(...args),
  useTransitionWorkOrderStatusMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useAssignMechanicMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useAddPartMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useGetTimelineQuery: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('../../invoices/invoicesApi', () => ({
  useCreateInvoiceMutation: () => [mockCreateInvoice, { isLoading: false }],
}));

import WorkOrdersPage from '../pages/WorkOrdersPage';
import { MILESTONE_LABELS } from '../milestone-config';

const sampleWorkOrders = [
  {
    id: 'wo-1',
    client: { id: 'c1', name: 'John Doe' },
    vehicle: { id: 'v1', model: 'Yamaha MT-07', plate: 'ABC-123' },
    description: 'Oil change',
    milestone: 'in_progress' as const,
    mechanics: [{ mechanic: { id: 'm1', name: 'Mike Mech' }, isPrimary: true }],
    parts: [],
    priority: 'normal' as const,
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T12:00:00Z',
  },
  {
    id: 'wo-2',
    client: { id: 'c2', name: 'Jane Smith' },
    vehicle: { id: 'v2', model: 'Honda CB500', plate: 'DEF-456' },
    description: 'Brake replacement',
    milestone: 'created' as const,
    mechanics: [],
    parts: [],
    priority: 'high' as const,
    createdAt: '2026-07-02T09:00:00Z',
    updatedAt: '2026-07-02T09:00:00Z',
  },
];

const completedWorkOrder = {
  ...sampleWorkOrders[0],
  id: 'wo-completed',
  milestone: 'completed' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WorkOrdersPage', () => {
  it('should render client and vehicle info from nested data', async () => {
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: sampleWorkOrders, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Yamaha MT-07 (ABC-123)')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Honda CB500 (DEF-456)')).toBeInTheDocument();
  });

  it('should render milestone chip with correct label and color', async () => {
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: sampleWorkOrders, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    // Check milestone chips render with MILESTONE_LABELS
    const inProgressChip = screen.getByText(MILESTONE_LABELS.in_progress);
    expect(inProgressChip).toBeInTheDocument();
    expect(inProgressChip).toHaveClass('MuiChip-label');

    const createdChip = screen.getByText(MILESTONE_LABELS.created);
    expect(createdChip).toBeInTheDocument();

    // Verify the chips are rendered as MUI Chip components
    const chips = document.querySelectorAll('.MuiChip-root');
    expect(chips.length).toBeGreaterThanOrEqual(2);
  });

  it('should pass pagination params when page changes', async () => {
    const user = userEvent.setup();
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: sampleWorkOrders, meta: { total: 25, page: 0, limit: 10, totalPages: 3 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    // Click next page
    const nextButton = screen.getByTitle('Go to next page');
    await user.click(nextButton);

    await waitFor(() => {
      const lastCallArgs =
        mockUseListWorkOrdersQuery.mock.calls[mockUseListWorkOrdersQuery.mock.calls.length - 1][0];
      expect(lastCallArgs.page).toBe(2);
    });
  });

  it('should pass milestone filter param when filter changes', async () => {
    const user = userEvent.setup();
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: sampleWorkOrders, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    // Open milestone filter select — label changed from "Status" to "Milestone"
    const milestoneSelect = screen.getByLabelText('Milestone');
    await user.click(milestoneSelect);

    // Select 'En Progreso' from the list (labels come from MILESTONE_LABELS)
    const inProgressOption = screen.getByRole('option', { name: MILESTONE_LABELS.in_progress });
    await user.click(inProgressOption);

    // Verify the hook was called with milestone filter (not status)
    await waitFor(() => {
      const lastCallArgs =
        mockUseListWorkOrdersQuery.mock.calls[mockUseListWorkOrdersQuery.mock.calls.length - 1][0];
      expect(lastCallArgs.milestone).toBe('in_progress');
      expect(lastCallArgs).not.toHaveProperty('status');
    });
  });

  it('should show error alert when API fails', async () => {
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Internal server error' } },
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    // Error Alert with severity error should be visible
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/failed to load/i);
    expect(alert).toHaveTextContent(/internal server error/i);
  });

  it('should show empty state when no work orders exist', () => {
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    expect(screen.getByText('No work orders yet')).toBeInTheDocument();
  });

  it('should render loading skeleton when data is being fetched', () => {
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    const { container } = renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    // MUI Skeleton components render when loading
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show "Facturar" button for completed work orders', () => {
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: [completedWorkOrder], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
  });

  it('should NOT show "Facturar" button for non-completed work orders', () => {
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: sampleWorkOrders, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    expect(screen.queryByRole('button', { name: /create invoice/i })).not.toBeInTheDocument();
  });

  it('should open confirm dialog when "Facturar" is clicked', async () => {
    const user = userEvent.setup();
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: [completedWorkOrder], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    const facturarButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(facturarButton);

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
  });

  it('should call createInvoice mutation after confirm dialog submission', async () => {
    const user = userEvent.setup();
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: [completedWorkOrder], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    mockCreateInvoice.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 'invoice-123' }),
    });

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    // Click Facturar button to open confirm dialog
    const facturarButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(facturarButton);

    // Click confirm in dialog
    const confirmButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockCreateInvoice).toHaveBeenCalledWith({ workOrderId: 'wo-completed' });
    });
  });

  it('should navigate to invoice after successful creation', async () => {
    const user = userEvent.setup();
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: [completedWorkOrder], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    mockCreateInvoice.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 'invoice-123' }),
    });

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    // Click Facturar button to open confirm dialog
    const facturarButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(facturarButton);

    // Click confirm in dialog
    const confirmButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/invoices/invoice-123');
    });
  });

  it('should show error notification when invoice creation fails', async () => {
    const user = userEvent.setup();
    mockUseListWorkOrdersQuery.mockReturnValue({
      data: { data: [completedWorkOrder], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseCreateWorkOrderMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    mockCreateInvoice.mockReturnValue({
      unwrap: () => Promise.reject(new Error('API error')),
    });

    renderWithProviders(<WorkOrdersPage />, {
      initialEntries: ['/work-orders'],
    });

    // Click Facturar button to open confirm dialog
    const facturarButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(facturarButton);

    // Click confirm in dialog
    const confirmButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create invoice/i)).toBeInTheDocument();
    });
  });
});
