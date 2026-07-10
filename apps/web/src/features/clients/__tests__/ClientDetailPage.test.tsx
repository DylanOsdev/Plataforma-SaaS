import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseGetClientQuery = vi.fn()
const mockUseListVehiclesQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../clientsApi', () => ({
  useGetClientQuery: (...args: unknown[]) => mockUseGetClientQuery(...args),
  useListClientsQuery: vi.fn(),
  useCreateClientMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateClientMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteClientMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

vi.mock('../../vehicles/vehiclesApi', () => ({
  useListVehiclesQuery: (...args: unknown[]) => mockUseListVehiclesQuery(...args),
  useGetVehicleQuery: vi.fn(),
  useCreateVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import ClientDetailPage from '../pages/ClientDetailPage'

const sampleClient = {
  id: 'c-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0101',
  address: '123 Main St',
  status: 'active',
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-10T14:00:00Z',
}

const sampleVehicles = [
  {
    id: 'v-1',
    client: { id: 'c-1', name: 'John Doe', email: 'john@example.com', phone: '555-0101' },
    make: 'Yamaha',
    model: 'MT-07',
    year: 2023,
    plate: 'ABC-123',
    vin: 'YAMAHA123VIN0001',
    color: 'Blue',
    fuelType: 'Gasoline',
    mileage: 5000,
    notes: '',
    status: 'active',
    createdAt: '2026-07-01T10:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

function renderDetailPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/clients/:id" element={<ClientDetailPage />} />
    </Routes>,
    { initialEntries: ['/clients/c-1'] },
  )
}

describe('ClientDetailPage', () => {
  it('should show loading state while fetching', () => {
    mockUseGetClientQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    mockUseListVehiclesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })

    const { container } = renderDetailPage()
    const spinners = container.querySelectorAll('.MuiCircularProgress-root')
    expect(spinners.length).toBeGreaterThan(0)
  })

  it('should show error alert when API fails', () => {
    mockUseGetClientQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Failed to load client' } },
    })
    mockUseListVehiclesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
  })

  it('should show not found message when no data', () => {
    mockUseGetClientQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText(/client not found/i)).toBeInTheDocument()
  })

  it('should render client detail data', async () => {
    mockUseGetClientQuery.mockReturnValue({
      data: sampleClient,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: sampleVehicles, meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-0101')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    // Client and vehicle both have 'active' status chips
    const activeChips = screen.getAllByText('active')
    expect(activeChips.length).toBeGreaterThanOrEqual(1)
  })

  it('should render vehicles section for the client', () => {
    mockUseGetClientQuery.mockReturnValue({
      data: sampleClient,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: sampleVehicles, meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText(/vehicles/i)).toBeInTheDocument()
    // Make and model rendered in separate table cells
    expect(screen.getByText('Yamaha')).toBeInTheDocument()
    expect(screen.getByText('MT-07')).toBeInTheDocument()
    expect(screen.getByText('ABC-123')).toBeInTheDocument()
  })

  it('should navigate back to list on back button click', async () => {
    const user = userEvent.setup()
    mockUseGetClientQuery.mockReturnValue({
      data: sampleClient,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    const backButton = screen.getByRole('button', { name: /back to clients/i })
    expect(backButton).toBeInTheDocument()
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/clients')
  })
})
