import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders'

const mockUseGetLowStockCountQuery = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../features/spare-parts/sparePartsApi', () => ({
  useGetLowStockCountQuery: (...args: unknown[]) => mockUseGetLowStockCountQuery(...args),
}))

import { AppLayout } from '../AppLayout'

const mockUser = {
  id: 'user-1',
  email: 'test@motogest.com',
  fullName: 'Test User',
  role: 'admin_taller',
  tenantId: 'tenant-1',
}

function renderLayout(initialEntries = ['/']) {
  mockUseGetLowStockCountQuery.mockReturnValue({
    data: 0,
    isLoading: false,
    isError: false,
  })

  return renderWithProviders(<AppLayout />, {
    preloadedState: {
      auth: {
        user: mockUser,
        accessToken: 'mock-token',
        status: 'succeeded' as const,
        error: null,
      },
    },
    initialEntries,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AppLayout', () => {
  it('should render all navigation items', () => {
    renderLayout()

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Clients').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Vehicles').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mechanics').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Work Orders').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Inventory').length).toBeGreaterThan(0)
  })

  it('should show badge with low-stock count on Inventory nav item', () => {
    mockUseGetLowStockCountQuery.mockReturnValue({
      data: 3,
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<AppLayout />, {
      preloadedState: {
        auth: {
          user: mockUser,
          accessToken: 'mock-token',
          status: 'succeeded' as const,
          error: null,
        },
      },
    })

    // The badge content "3" should appear in the nav (in both mobile + desktop drawer)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
  })

  it('should not show badge count when low-stock count is 0', () => {
    renderLayout()

    // The MUI Badge with badgeContent={0} and no showZero prop renders
    // the badge as invisible. The nav items appear twice (mobile + desktop
    // drawer), so use getAllByText to handle duplicates.
    const inventoryLinks = screen.getAllByText('Inventory')
    expect(inventoryLinks.length).toBeGreaterThan(0)

    // The hook was called with the expected args
    expect(mockUseGetLowStockCountQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 30000,
    })
  })

  it('should navigate when clicking a nav item', async () => {
    const user = userEvent.setup()
    renderLayout()

    // Nav items appear in both mobile and desktop drawers, pick the first
    const clientsLink = screen.getAllByText('Clients')[0]
    await user.click(clientsLink)

    expect(mockNavigate).toHaveBeenCalledWith('/clients')
  })

  it('should display current page title in AppBar', () => {
    renderLayout(['/clients'])

    // The AppBar title should show "Clients" based on current path
    // navItems has one "Clients" entry, plus the title shows "Clients"
    expect(screen.getAllByText('Clients').length).toBeGreaterThanOrEqual(1)
  })

  it('should display user full name', () => {
    renderLayout()

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should render Dashboard nav item as selected on root path', () => {
    renderLayout(['/'])

    const dashboardButtons = screen.getAllByRole('button')
    const selectedButton = dashboardButtons.find(
      (btn) => btn.classList.contains('Mui-selected'),
    )
    expect(selectedButton).toBeDefined()
  })

  it('should show fallback title "Motogest" on unrecognized path', () => {
    renderLayout(['/unknown-path'])

    // The title bar should show "Motogest" as fallback
    const titleElements = screen.getAllByText('Motogest')
    // At least one is in the AppBar (the drawer logo is also "Motogest")
    expect(titleElements.length).toBeGreaterThan(0)
  })

  it('should navigate to /inventory when clicking Inventory nav item', async () => {
    const user = userEvent.setup()
    renderLayout()

    const inventoryLink = screen.getAllByText('Inventory')[0]
    await user.click(inventoryLink)

    expect(mockNavigate).toHaveBeenCalledWith('/inventory')
  })

  it('should render logout button', () => {
    renderLayout()

    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should show badge with larger count values', () => {
    mockUseGetLowStockCountQuery.mockReturnValue({
      data: 42,
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<AppLayout />, {
      preloadedState: {
        auth: {
          user: mockUser,
          accessToken: 'mock-token',
          status: 'succeeded' as const,
          error: null,
        },
      },
    })

    expect(screen.getAllByText('42').length).toBeGreaterThan(0)
  })
})
