import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseListMechanicsQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../mechanicsApi', () => ({
  useListMechanicsQuery: (...args: unknown[]) => mockUseListMechanicsQuery(...args),
  useGetMechanicQuery: vi.fn(),
  useCreateMechanicMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateMechanicMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteMechanicMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import MechanicsPage from '../pages/MechanicsPage'

const sampleMechanics = [
  {
    id: 'm-1',
    name: 'Mike Mechanic',
    email: 'mike@example.com',
    phone: '555-0201',
    specializations: ['Engine', 'Brakes'],
    hireDate: '2025-01-15',
    hourlyRate: 45,
    notes: '',
    status: 'active',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'm-2',
    name: 'Sarah Tech',
    email: 'sarah@example.com',
    phone: '555-0202',
    specializations: ['Electrical', 'Diagnostics'],
    hireDate: '2025-06-01',
    hourlyRate: 50,
    notes: '',
    status: 'active',
    createdAt: '2026-05-15T09:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MechanicsPage', () => {
  it('should render mechanic data from API', async () => {
    mockUseListMechanicsQuery.mockReturnValue({
      data: { data: sampleMechanics, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<MechanicsPage />, {
      initialEntries: ['/mechanics'],
    })

    expect(screen.getByText('Mike Mechanic')).toBeInTheDocument()
    expect(screen.getByText('mike@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-0201')).toBeInTheDocument()
    expect(screen.getByText('Sarah Tech')).toBeInTheDocument()
    expect(screen.getByText('sarah@example.com')).toBeInTheDocument()
  })

  it('should render specializations joined by comma', () => {
    mockUseListMechanicsQuery.mockReturnValue({
      data: { data: sampleMechanics, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<MechanicsPage />, {
      initialEntries: ['/mechanics'],
    })

    expect(screen.getByText('Engine, Brakes')).toBeInTheDocument()
    expect(screen.getByText('Electrical, Diagnostics')).toBeInTheDocument()
  })

  it('should navigate to mechanic detail on row click', async () => {
    const user = userEvent.setup()
    mockUseListMechanicsQuery.mockReturnValue({
      data: { data: sampleMechanics, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<MechanicsPage />, {
      initialEntries: ['/mechanics'],
    })

    const row1 = screen.getByText('Mike Mechanic').closest('tr')
    expect(row1).not.toBeNull()
    await user.click(row1!)

    expect(mockNavigate).toHaveBeenCalledWith('/mechanics/m-1')
  })

  it('should pass pagination params when page changes', async () => {
    const user = userEvent.setup()
    mockUseListMechanicsQuery.mockReturnValue({
      data: { data: sampleMechanics, meta: { total: 25, page: 0, limit: 10, totalPages: 3 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<MechanicsPage />, {
      initialEntries: ['/mechanics'],
    })

    const nextButton = await screen.findByTitle('Go to next page', {}, { timeout: 3000 })
    await user.click(nextButton)

    await waitFor(() => {
      const calls = mockUseListMechanicsQuery.mock.calls
      const page2Call = calls.find((call) => (call[0] as Record<string, unknown>)?.page === 2)
      expect(page2Call).toBeDefined()
    }, { timeout: 3000 })
  })

  it('should show error alert when API fails', async () => {
    mockUseListMechanicsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Server error' } },
    })

    renderWithProviders(<MechanicsPage />, {
      initialEntries: ['/mechanics'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
    expect(alert).toHaveTextContent(/server error/i)
  })

  it('should render loading skeleton when data is being fetched', () => {
    mockUseListMechanicsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    const { container } = renderWithProviders(<MechanicsPage />, {
      initialEntries: ['/mechanics'],
    })

    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state when no mechanics exist', () => {
    mockUseListMechanicsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<MechanicsPage />, {
      initialEntries: ['/mechanics'],
    })

    expect(screen.getByText('No mechanics yet')).toBeInTheDocument()
  })
})