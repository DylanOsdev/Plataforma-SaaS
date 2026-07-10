import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseGetWorkOrderQuery = vi.fn()
const mockUseGetWorkOrderChecklistsQuery = vi.fn()
const mockUseAssignChecklistMutation = vi.fn()
const mockUseStartExecutionMutation = vi.fn()
const mockUseListChecklistTemplatesQuery = vi.fn()
const mockUseListMechanicsQuery = vi.fn()
const mockNavigate = vi.fn()

let mockParams: Record<string, string | undefined> = { id: 'wo-1' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

vi.mock('../../work-orders/workOrdersApi', () => ({
  useGetWorkOrderQuery: (...args: unknown[]) => mockUseGetWorkOrderQuery(...args),
  useListWorkOrdersQuery: vi.fn(),
}))

vi.mock('../../mechanics/mechanicsApi', () => ({
  useListMechanicsQuery: (...args: unknown[]) => mockUseListMechanicsQuery(...args),
}))

vi.mock('../checklistsApi', () => ({
  useGetWorkOrderChecklistsQuery: (...args: unknown[]) =>
    mockUseGetWorkOrderChecklistsQuery(...args),
  useAssignChecklistMutation: (...args: unknown[]) =>
    mockUseAssignChecklistMutation(...args),
  useStartExecutionMutation: (...args: unknown[]) =>
    mockUseStartExecutionMutation(...args),
  useListChecklistTemplatesQuery: (...args: unknown[]) =>
    mockUseListChecklistTemplatesQuery(...args),
}))

import WorkOrderDetailPage from '../pages/WorkOrderDetailPage'

const sampleWorkOrder = {
  id: 'wo-1',
  client: { id: 'c-1', name: 'John Doe' },
  vehicle: { id: 'v-1', model: 'Yamaha MT-07', plate: 'ABC-123' },
  description: 'Oil change and brake check',
  milestone: 'in_progress',
  mechanics: [
    { mechanic: { id: 'm-1', name: 'Mike Mech' }, isPrimary: true },
  ],
  parts: [
    {
      id: 'p-1',
      sparePartId: 'sp-1',
      partName: 'Oil Filter',
      quantity: 1,
      unitPrice: 25,
    },
  ],
  priority: 'normal',
  createdAt: '2026-07-01T10:00:00Z',
  updatedAt: '2026-07-01T12:00:00Z',
}

const sampleExecutions = [
  {
    id: 'exec-1',
    workOrderId: 'wo-1',
    templateId: 't-1',
    templateName: 'Pre-Delivery Inspection',
    mechanicId: 'm-1',
    mechanicName: 'Mike Mech',
    status: 'in_progress',
    sections: [],
    answers: {},
    createdAt: '2026-07-01T11:00:00Z',
  },
  {
    id: 'exec-2',
    workOrderId: 'wo-1',
    templateId: 't-2',
    templateName: 'Oil Change Service',
    mechanicId: 'm-1',
    mechanicName: 'Mike Mech',
    status: 'completed',
    sections: [],
    answers: {},
    score: 85,
    passed: true,
    createdAt: '2026-07-01T11:00:00Z',
    completedAt: '2026-07-01T12:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockParams = { id: 'wo-1' }
  mockUseAssignChecklistMutation.mockReturnValue([vi.fn(), { isLoading: false }])
  mockUseStartExecutionMutation.mockReturnValue([vi.fn(), { isLoading: false }])
  mockUseListChecklistTemplatesQuery.mockReturnValue({
    data: { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } },
    isLoading: false,
  })
  mockUseListMechanicsQuery.mockReturnValue({
    data: { data: [{ id: 'm-1', name: 'Mike Mech' }] },
    isLoading: false,
  })
})

describe('WorkOrderDetailPage', () => {
  it('should render work order info from API', () => {
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: sampleWorkOrder,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseGetWorkOrderChecklistsQuery.mockReturnValue({
      data: sampleExecutions,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Yamaha MT-07 (ABC-123)')).toBeInTheDocument()
    expect(screen.getByText('Oil change and brake check')).toBeInTheDocument()
  })

  it('should show assigned checklists with statuses', () => {
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: sampleWorkOrder,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseGetWorkOrderChecklistsQuery.mockReturnValue({
      data: sampleExecutions,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    expect(screen.getByText('Pre-Delivery Inspection')).toBeInTheDocument()
    expect(screen.getByText('Oil Change Service')).toBeInTheDocument()
    const chips = screen.getAllByText('in progress')
    expect(chips.length).toBeGreaterThanOrEqual(1)
    const mechElements = screen.getAllByText(/Mike Mech/)
    expect(mechElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should show loading state when fetching work order', () => {
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    mockUseGetWorkOrderChecklistsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should show error state when fetching fails', () => {
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Failed to load work order' } },
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
  })

  it('should show not found state when work order is null', () => {
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })

  it('should show empty state when no checklists assigned', () => {
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: sampleWorkOrder,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseGetWorkOrderChecklistsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    expect(screen.getByText(/No checklists assigned/i)).toBeInTheDocument()
  })

  it('should open assign checklist dialog when clicking button', async () => {
    const user = userEvent.setup()
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: sampleWorkOrder,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseGetWorkOrderChecklistsQuery.mockReturnValue({
      data: sampleExecutions,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    const assignButton = screen.getByRole('button', { name: /assign checklist/i })
    await user.click(assignButton)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should close assign dialog when cancelled', async () => {
    const user = userEvent.setup()
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: sampleWorkOrder,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseGetWorkOrderChecklistsQuery.mockReturnValue({
      data: sampleExecutions,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    // Open dialog
    await user.click(screen.getByRole('button', { name: /assign checklist/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Close it
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('should navigate to execution form when clicking View on in_progress execution', async () => {
    const user = userEvent.setup()
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: sampleWorkOrder,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseGetWorkOrderChecklistsQuery.mockReturnValue({
      data: sampleExecutions,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    // Both executions show "View" buttons; click the first one (in_progress → exec-1)
    const viewButtons = screen.getAllByRole('button', { name: /^view$/i })
    await user.click(viewButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/work-orders/wo-1/checklists/exec-1')
  })

  it('should show Start button for pending executions', () => {
    const pendingExecutions = [
      {
        ...sampleExecutions[0],
        id: 'exec-pending',
        status: 'pending' as const,
      },
    ]
    mockUseGetWorkOrderQuery.mockReturnValue({
      data: sampleWorkOrder,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseGetWorkOrderChecklistsQuery.mockReturnValue({
      data: pendingExecutions,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<WorkOrderDetailPage />, {
      initialEntries: ['/work-orders/wo-1'],
    })

    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
  })
})
