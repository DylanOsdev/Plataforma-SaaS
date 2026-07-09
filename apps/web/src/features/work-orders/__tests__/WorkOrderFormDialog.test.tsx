import { describe, it, expect, vi, beforeEach } from 'vitest'

// Tests involving Autocomplete interaction take longer due to popup rendering
const AUTOCOMPLETE_TIMEOUT = 15000
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockCreateWorkOrderTrigger = vi.fn()
const mockUseCreateWorkOrderMutation = vi.fn()

vi.mock('../workOrdersApi', () => ({
  useCreateWorkOrderMutation: (...args: unknown[]) =>
    mockUseCreateWorkOrderMutation(...args),
  useListWorkOrdersQuery: vi.fn(() => ({
    data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
    isLoading: false,
  })),
}))

import { WorkOrderFormDialog, type Client, type Vehicle } from '../components/WorkOrderFormDialog'

const mockClients: Client[] = [
  { id: 'client-1', name: 'Alice Workshop' },
  { id: 'client-2', name: 'Bob Garage' },
]

const mockVehicles: Vehicle[] = [
  { id: 'veh-1', model: 'Yamaha MT-07', plate: 'ABC-123' },
  { id: 'veh-2', model: 'Honda CB500', plate: 'DEF-456' },
]

function buildMutationReturn<T>(value: T): { unwrap: () => Promise<T> } {
  return { unwrap: () => Promise.resolve(value) }
}

function buildMutationError(err: unknown): { unwrap: () => Promise<never> } {
  return { unwrap: () => Promise.reject(err) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseCreateWorkOrderMutation.mockReturnValue([mockCreateWorkOrderTrigger, { isLoading: false }])
})

describe('WorkOrderFormDialog', () => {
  it('should render title and submit button', () => {
    renderWithProviders(
      <WorkOrderFormDialog
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        initialClients={mockClients}
        initialVehicles={mockVehicles}
      />,
    )

    expect(screen.getByText('Create Work Order')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
  })

  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <WorkOrderFormDialog
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        initialClients={mockClients}
        initialVehicles={mockVehicles}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^create$/i }))

    // react-hook-form validation errors should appear (form must have noValidate)
    expect(screen.getByText('Client is required')).toBeInTheDocument()
    expect(screen.getByText('Vehicle is required')).toBeInTheDocument()
    expect(screen.getByText('Description is required')).toBeInTheDocument()
  })

  it('should allow selecting a client and vehicle via Autocomplete', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <WorkOrderFormDialog
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        initialClients={mockClients}
        initialVehicles={mockVehicles}
      />,
    )

    // Select client
    const clientInput = screen.getByLabelText(/client/i)
    await user.click(clientInput)
    const clientOptions = await screen.findAllByRole('option', {}, { timeout: 3000 })
    await user.click(clientOptions[0])

    // Select vehicle
    const vehicleInput = screen.getByLabelText(/vehicle/i)
    await user.click(vehicleInput)
    const vehicleOptions = await screen.findAllByRole('option', {}, { timeout: 3000 })
    await user.click(vehicleOptions[0])
  }, AUTOCOMPLETE_TIMEOUT)

  it('should call createWorkOrder mutation on submit with flat payload', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    mockCreateWorkOrderTrigger.mockReturnValue(buildMutationReturn({}))

    renderWithProviders(
      <WorkOrderFormDialog
        open
        onClose={vi.fn()}
        onSuccess={onSuccess}
        initialClients={mockClients}
        initialVehicles={mockVehicles}
      />,
    )

    // Select client
    const clientInput = screen.getByLabelText(/client/i)
    await user.click(clientInput)
    const clientOpts = await screen.findAllByRole('option', {}, { timeout: 3000 })
    await user.click(clientOpts[0])

    // Select vehicle
    const vehicleInput = screen.getByLabelText(/vehicle/i)
    await user.click(vehicleInput)
    const vehicleOpts = await screen.findAllByRole('option', {}, { timeout: 3000 })
    await user.click(vehicleOpts[0])

    // Enter description
    await user.type(screen.getByLabelText(/description/i), 'Oil change and inspection')

    // Submit
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(
      () => {
        expect(mockCreateWorkOrderTrigger).toHaveBeenCalledWith({
          clientId: 'client-1',
          vehicleId: 'veh-1',
          description: 'Oil change and inspection',
          // mechanicId and priority should be undefined (not empty string) when not filled
        })
      },
      { timeout: 5000 },
    )

    // Verify the payload is flat (no nested client/vehicle objects)
    const callArg = mockCreateWorkOrderTrigger.mock.calls[0][0]
    expect(callArg).not.toHaveProperty('client')
    expect(callArg).not.toHaveProperty('vehicle')
    expect(callArg).toHaveProperty('clientId')
    expect(callArg).toHaveProperty('vehicleId')

    expect(onSuccess).toHaveBeenCalled()
  }, AUTOCOMPLETE_TIMEOUT)

  it('should display server error alert on 422 response', async () => {
    const user = userEvent.setup()
    mockCreateWorkOrderTrigger.mockReturnValue(
      buildMutationError({
        status: 422,
        data: {
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: 'clientId Client not found',
        },
      }),
    )

    renderWithProviders(
      <WorkOrderFormDialog
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        initialClients={mockClients}
        initialVehicles={mockVehicles}
      />,
    )

    // Select client
    const clientInput = screen.getByLabelText(/client/i)
    await user.click(clientInput)
    const clientOpts = await screen.findAllByRole('option', {}, { timeout: 3000 })
    await user.click(clientOpts[0])

    // Select vehicle
    const vehicleInput = screen.getByLabelText(/vehicle/i)
    await user.click(vehicleInput)
    const vehicleOpts = await screen.findAllByRole('option', {}, { timeout: 3000 })
    await user.click(vehicleOpts[0])

    // Enter description
    await user.type(screen.getByLabelText(/description/i), 'Oil change')

    // Submit
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    // Wait for error alert
    await waitFor(() => {
      expect(screen.getByText(/clientId Client not found/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  }, AUTOCOMPLETE_TIMEOUT)
})
