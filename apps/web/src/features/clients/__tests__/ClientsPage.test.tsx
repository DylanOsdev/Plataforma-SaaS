import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseListClientsQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../clientsApi', () => ({
  useListClientsQuery: (...args: unknown[]) => mockUseListClientsQuery(...args),
  useGetClientQuery: vi.fn(),
  useCreateClientMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateClientMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteClientMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import ClientsPage from '../pages/ClientsPage'

const sampleClients = [
  {
    id: 'c-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0101',
    address: '123 Main St',
    status: 'active',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'c-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0102',
    address: '456 Oak Ave',
    status: 'inactive',
    createdAt: '2026-06-15T09:00:00Z',
    updatedAt: '2026-06-15T09:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ClientsPage', () => {
  it('should render client data from API', async () => {
    mockUseListClientsQuery.mockReturnValue({
      data: { data: sampleClients, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ClientsPage />, {
      initialEntries: ['/clients'],
    })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-0101')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('should navigate to client detail on row click', async () => {
    const user = userEvent.setup()
    mockUseListClientsQuery.mockReturnValue({
      data: { data: sampleClients, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ClientsPage />, {
      initialEntries: ['/clients'],
    })

    const row1 = screen.getByText('John Doe').closest('tr')
    expect(row1).not.toBeNull()
    await user.click(row1!)

    expect(mockNavigate).toHaveBeenCalledWith('/clients/c-1')
  })

  it('should render status text for each client', () => {
    mockUseListClientsQuery.mockReturnValue({
      data: { data: sampleClients, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ClientsPage />, {
      initialEntries: ['/clients'],
    })

    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('should render created date for each client', () => {
    mockUseListClientsQuery.mockReturnValue({
      data: { data: sampleClients, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ClientsPage />, {
      initialEntries: ['/clients'],
    })

    const date1 = new Date(sampleClients[0].createdAt).toLocaleDateString()
    expect(screen.getByText(date1)).toBeInTheDocument()
  })

  it('should pass pagination params when page changes', async () => {
    const user = userEvent.setup()
    mockUseListClientsQuery.mockReturnValue({
      data: { data: sampleClients, meta: { total: 25, page: 0, limit: 10, totalPages: 3 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ClientsPage />, {
      initialEntries: ['/clients'],
    })

    // Wait for pagination to be rendered
    const nextButton = await screen.findByTitle('Go to next page', {}, { timeout: 3000 })
    await user.click(nextButton)

    await waitFor(() => {
      const calls = mockUseListClientsQuery.mock.calls
      const page2Call = calls.find(([args]: [Record<string, unknown>]) => args.page === 2)
      expect(page2Call).toBeDefined()
    }, { timeout: 3000 })
  })

  it('should show error alert when API fails', async () => {
    mockUseListClientsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Server error' } },
    })

    renderWithProviders(<ClientsPage />, {
      initialEntries: ['/clients'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
    expect(alert).toHaveTextContent(/server error/i)
  })

  it('should render loading skeleton when data is being fetched', () => {
    mockUseListClientsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    const { container } = renderWithProviders(<ClientsPage />, {
      initialEntries: ['/clients'],
    })

    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state when no clients exist', () => {
    mockUseListClientsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ClientsPage />, {
      initialEntries: ['/clients'],
    })

    expect(screen.getByText('No clients yet')).toBeInTheDocument()
  })
})