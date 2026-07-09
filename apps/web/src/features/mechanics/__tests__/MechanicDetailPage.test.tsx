import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseGetMechanicQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../mechanicsApi', () => ({
  useGetMechanicQuery: (...args: unknown[]) => mockUseGetMechanicQuery(...args),
  useListMechanicsQuery: vi.fn(),
  useCreateMechanicMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateMechanicMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteMechanicMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import MechanicDetailPage from '../pages/MechanicDetailPage'

const sampleMechanic = {
  id: 'm-1',
  name: 'Mike Mechanic',
  email: 'mike@example.com',
  phone: '555-0201',
  specializations: ['Engine', 'Brakes'],
  hireDate: '2025-01-15',
  hourlyRate: 45,
  notes: 'Senior mechanic',
  status: 'active',
  createdAt: '2026-05-01T10:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

function renderDetailPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/mechanics/:id" element={<MechanicDetailPage />} />
    </Routes>,
    { initialEntries: ['/mechanics/m-1'] },
  )
}

describe('MechanicDetailPage', () => {
  it('should show loading state while fetching', () => {
    mockUseGetMechanicQuery.mockReturnValue({
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
    mockUseGetMechanicQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Failed to load mechanic' } },
    })

    renderDetailPage()

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
  })

  it('should show not found message when no data', () => {
    mockUseGetMechanicQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText(/mechanic not found/i)).toBeInTheDocument()
  })

  it('should render mechanic detail data', () => {
    mockUseGetMechanicQuery.mockReturnValue({
      data: sampleMechanic,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText('Mike Mechanic')).toBeInTheDocument()
    expect(screen.getByText('mike@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-0201')).toBeInTheDocument()
    expect(screen.getByText('Engine')).toBeInTheDocument()
    expect(screen.getByText('Brakes')).toBeInTheDocument()
  })

  it('should show specialization chips', () => {
    mockUseGetMechanicQuery.mockReturnValue({
      data: sampleMechanic,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    const engineChip = screen.getByText('Engine')
    expect(engineChip).toBeInTheDocument()
    // Specializations should be rendered as MUI Chip components
    expect(engineChip.closest('.MuiChip-root')).not.toBeNull()
  })

  it('should navigate back to list on back button click', async () => {
    const user = userEvent.setup()
    mockUseGetMechanicQuery.mockReturnValue({
      data: sampleMechanic,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    const backButton = screen.getByRole('button', { name: /back to mechanics/i })
    expect(backButton).toBeInTheDocument()
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/mechanics')
  })
})
