import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { within } from '@testing-library/react'

const mockUseListSparePartsQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../sparePartsApi', () => ({
  useListSparePartsQuery: (...args: unknown[]) => mockUseListSparePartsQuery(...args),
  useGetSparePartQuery: vi.fn(),
  useCreateSparePartMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateSparePartMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteSparePartMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import SparePartsPage from '../pages/SparePartsPage'

const sampleSpareParts = [
  {
    id: 'sp-1',
    code: 'OIL-10W40',
    name: 'Engine Oil 10W-40',
    description: 'Synthetic motor oil',
    category: 'Lubricants',
    unit: 'liter',
    currentStock: 25,
    minStock: 10,
    maxStock: 100,
    unitCost: 8.5,
    sellingPrice: 15,
    supplier: 'MotoParts Co',
    notes: '',
    status: 'active',
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'sp-2',
    code: 'BRK-PAD-001',
    name: 'Brake Pads Set',
    description: 'Front brake pads',
    category: 'Brakes',
    unit: 'pair',
    currentStock: 3,
    minStock: 5,
    maxStock: 50,
    unitCost: 25,
    sellingPrice: 45,
    supplier: 'StopWell Inc',
    notes: '',
    status: 'active',
    createdAt: '2026-06-15T09:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SparePartsPage', () => {
  it('should render spare part data from API', async () => {
    mockUseListSparePartsQuery.mockReturnValue({
      data: { data: sampleSpareParts, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<SparePartsPage />, {
      initialEntries: ['/spare-parts'],
    })

    expect(screen.getByText('OIL-10W40')).toBeInTheDocument()
    expect(screen.getByText('Engine Oil 10W-40')).toBeInTheDocument()
    expect(screen.getByText('Lubricants')).toBeInTheDocument()
    expect(screen.getByText('BRK-PAD-001')).toBeInTheDocument()
    expect(screen.getByText('Brake Pads Set')).toBeInTheDocument()
  })

  it('should render current stock values', () => {
    mockUseListSparePartsQuery.mockReturnValue({
      data: { data: sampleSpareParts, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<SparePartsPage />, {
      initialEntries: ['/spare-parts'],
    })

    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should navigate to spare part detail on row click', async () => {
    const user = userEvent.setup()
    mockUseListSparePartsQuery.mockReturnValue({
      data: { data: sampleSpareParts, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<SparePartsPage />, {
      initialEntries: ['/spare-parts'],
    })

    const row1 = screen.getByText('OIL-10W40').closest('tr')
    expect(row1).not.toBeNull()
    await user.click(row1!)

    expect(mockNavigate).toHaveBeenCalledWith('/inventory/sp-1')
  })

  it('should render min stock values inside table rows', () => {
    mockUseListSparePartsQuery.mockReturnValue({
      data: { data: sampleSpareParts, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<SparePartsPage />, {
      initialEntries: ['/spare-parts'],
    })

    // Find the table body and search within it to avoid matching pagination "10"
    const tableBody = document.querySelector('tbody')
    expect(tableBody).not.toBeNull()
    if (tableBody) {
      expect(within(tableBody).getByText('10')).toBeInTheDocument()
      expect(within(tableBody).getByText('5')).toBeInTheDocument()
    }
  })

  it('should pass pagination params when page changes', async () => {
    const user = userEvent.setup()
    mockUseListSparePartsQuery.mockReturnValue({
      data: { data: sampleSpareParts, meta: { total: 25, page: 0, limit: 10, totalPages: 3 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<SparePartsPage />, {
      initialEntries: ['/spare-parts'],
    })

    const nextButton = await screen.findByTitle('Go to next page', {}, { timeout: 3000 })
    await user.click(nextButton)

    await waitFor(() => {
      // Find the call with page=2 (skip the initial render calls)
      const calls = mockUseListSparePartsQuery.mock.calls
      const page2Call = calls.find(([args]: [Record<string, unknown>]) => args.page === 2)
      expect(page2Call).toBeDefined()
    }, { timeout: 3000 })
  })

  it('should show error alert when API fails', async () => {
    mockUseListSparePartsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Server error' } },
    })

    renderWithProviders(<SparePartsPage />, {
      initialEntries: ['/spare-parts'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
    expect(alert).toHaveTextContent(/server error/i)
  })

  it('should render loading skeleton when data is being fetched', () => {
    mockUseListSparePartsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    const { container } = renderWithProviders(<SparePartsPage />, {
      initialEntries: ['/spare-parts'],
    })

    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state when no spare parts exist', () => {
    mockUseListSparePartsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<SparePartsPage />, {
      initialEntries: ['/spare-parts'],
    })

    expect(screen.getByText('No spare parts yet')).toBeInTheDocument()
  })
})