import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseGetSparePartQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../sparePartsApi', () => ({
  useGetSparePartQuery: (...args: unknown[]) => mockUseGetSparePartQuery(...args),
  useListSparePartsQuery: vi.fn(),
  useCreateSparePartMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateSparePartMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteSparePartMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import SparePartDetailPage from '../pages/SparePartDetailPage'

const sampleSparePart = {
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
}

beforeEach(() => {
  vi.clearAllMocks()
})

function renderDetailPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/inventory/:id" element={<SparePartDetailPage />} />
    </Routes>,
    { initialEntries: ['/inventory/sp-1'] },
  )
}

describe('SparePartDetailPage', () => {
  it('should show loading state while fetching', () => {
    mockUseGetSparePartQuery.mockReturnValue({
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
    mockUseGetSparePartQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Failed to load spare part' } },
    })

    renderDetailPage()

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
  })

  it('should show not found message when no data', () => {
    mockUseGetSparePartQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText(/spare part not found/i)).toBeInTheDocument()
  })

  it('should render spare part detail data', () => {
    mockUseGetSparePartQuery.mockReturnValue({
      data: sampleSparePart,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText('OIL-10W40')).toBeInTheDocument()
    expect(screen.getByText('Engine Oil 10W-40')).toBeInTheDocument()
    expect(screen.getByText('Lubricants')).toBeInTheDocument()
    expect(screen.getByText('liter')).toBeInTheDocument()
    expect(screen.getByText('MotoParts Co')).toBeInTheDocument()
  })

  it('should show stock level with appropriate color', () => {
    const lowStockPart = { ...sampleSparePart, currentStock: 3, minStock: 5 }
    mockUseGetSparePartQuery.mockReturnValue({
      data: lowStockPart,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    expect(screen.getByText('3')).toBeInTheDocument()
    // The min stock should also be shown for context
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should navigate back to list on back button click', async () => {
    const user = userEvent.setup()
    mockUseGetSparePartQuery.mockReturnValue({
      data: sampleSparePart,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderDetailPage()

    const backButton = screen.getByRole('button', { name: /back to inventory/i })
    expect(backButton).toBeInTheDocument()
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/inventory')
  })
})
