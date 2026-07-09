import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseGetVehicleQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../vehiclesApi', () => ({
  useGetVehicleQuery: (...args: unknown[]) => mockUseGetVehicleQuery(...args),
  useListVehiclesQuery: vi.fn(),
  useCreateVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteVehicleMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import VehicleDetailPage from '../pages/VehicleDetailPage'

const sampleVehicle = {
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
}

beforeEach(() => {
  vi.clearAllMocks()
})

function renderDetailPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
    </Routes>,
    { initialEntries: ['/vehicles/v-1'] },
  )
}

describe('VehicleDetailPage', () => {
  it('should show loading state while fetching', () => {
    mockUseGetVehicleQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    const { container } = renderDetailPage()
    const spinners = container.querySelectorAll('.MuiCircularProgress-root')
    expect(spinners.length).toBeGreaterThan(0)
  })

  it('should show error alert when API fails', () => {
    mockUseGetVehicleQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Failed to load vehicle' } },
    })

    renderDetailPage()

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
  })

  it('should show not found message when no data', () => {
    mockUseGetVehicleQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText(/vehicle not found/i)).toBeInTheDocument()
  })

  it('should render vehicle detail data', () => {
    mockUseGetVehicleQuery.mockReturnValue({
      data: sampleVehicle,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText('Yamaha')).toBeInTheDocument()
    expect(screen.getByText('MT-07')).toBeInTheDocument()
    expect(screen.getByText('2023')).toBeInTheDocument()
    expect(screen.getByText('ABC-123')).toBeInTheDocument()
    expect(screen.getByText('YAMAHA123VIN0001')).toBeInTheDocument()
  })

  it('should show client info for the vehicle', () => {
    mockUseGetVehicleQuery.mockReturnValue({
      data: sampleVehicle,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('should navigate back to list on back button click', async () => {
    const user = userEvent.setup()
    mockUseGetVehicleQuery.mockReturnValue({
      data: sampleVehicle,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    const backButton = screen.getByRole('button', { name: /back to vehicles/i })
    expect(backButton).toBeInTheDocument()
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/vehicles')
  })
})
