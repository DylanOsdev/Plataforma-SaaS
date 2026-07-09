import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseListVehiclesQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../vehiclesApi', () => ({
  useListVehiclesQuery: (...args: unknown[]) => mockUseListVehiclesQuery(...args),
  useGetVehicleQuery: vi.fn(),
  useCreateVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import VehiclesPage from '../pages/VehiclesPage'

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
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'v-2',
    client: { id: 'c-2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102' },
    make: 'Honda',
    model: 'CB500',
    year: 2024,
    plate: 'DEF-456',
    vin: 'HONDA456VIN0002',
    color: 'Red',
    fuelType: 'Gasoline',
    mileage: 1200,
    notes: '',
    status: 'active',
    createdAt: '2026-06-15T09:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VehiclesPage', () => {
  it('should render vehicle data from API', async () => {
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: sampleVehicles, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<VehiclesPage />, {
      initialEntries: ['/vehicles'],
    })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Yamaha')).toBeInTheDocument()
    expect(screen.getByText('MT-07')).toBeInTheDocument()
    expect(screen.getByText('ABC-123')).toBeInTheDocument()
    expect(screen.getByText('Honda')).toBeInTheDocument()
    expect(screen.getByText('CB500')).toBeInTheDocument()
  })

  it('should render year for each vehicle', () => {
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: sampleVehicles, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<VehiclesPage />, {
      initialEntries: ['/vehicles'],
    })

    expect(screen.getByText('2023')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('should navigate to vehicle detail on row click', async () => {
    const user = userEvent.setup()
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: sampleVehicles, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<VehiclesPage />, {
      initialEntries: ['/vehicles'],
    })

    const row1 = screen.getByText('Yamaha').closest('tr')
    expect(row1).not.toBeNull()
    await user.click(row1!)

    expect(mockNavigate).toHaveBeenCalledWith('/vehicles/v-1')
  })

  it('should pass pagination params when page changes', async () => {
    const user = userEvent.setup()
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: sampleVehicles, meta: { total: 25, page: 0, limit: 10, totalPages: 3 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<VehiclesPage />, {
      initialEntries: ['/vehicles'],
    })

    const nextButton = await screen.findByTitle('Go to next page', {}, { timeout: 3000 })
    await user.click(nextButton)

    await waitFor(() => {
      const calls = mockUseListVehiclesQuery.mock.calls
      const page2Call = calls.find((call) => (call[0] as Record<string, unknown>)?.page === 2)
      expect(page2Call).toBeDefined()
    }, { timeout: 3000 })
  })

  it('should show error alert when API fails', async () => {
    mockUseListVehiclesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Server error' } },
    })

    renderWithProviders(<VehiclesPage />, {
      initialEntries: ['/vehicles'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
    expect(alert).toHaveTextContent(/server error/i)
  })

  it('should render loading skeleton when data is being fetched', () => {
    mockUseListVehiclesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    const { container } = renderWithProviders(<VehiclesPage />, {
      initialEntries: ['/vehicles'],
    })

    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state when no vehicles exist', () => {
    mockUseListVehiclesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<VehiclesPage />, {
      initialEntries: ['/vehicles'],
    })

    expect(screen.getByText('No vehicles yet')).toBeInTheDocument()
  })
})