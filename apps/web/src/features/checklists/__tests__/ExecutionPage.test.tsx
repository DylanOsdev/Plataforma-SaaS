import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseGetChecklistExecutionQuery = vi.fn()
const mockSubmitAnswer = vi.fn()
const mockCompleteExecution = vi.fn()
const mockNavigate = vi.fn()

let mockParams: Record<string, string | undefined> = {
  id: 'wo-1',
  executionId: 'exec-1',
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

vi.mock('../checklistsApi', () => ({
  useGetChecklistExecutionQuery: (...args: unknown[]) =>
    mockUseGetChecklistExecutionQuery(...args),
  useSubmitAnswerMutation: vi.fn(() => [mockSubmitAnswer, { isLoading: false }]),
  useCompleteExecutionMutation: vi.fn(() => [
    mockCompleteExecution,
    { isLoading: false },
  ]),
}))

import ExecutionPage from '../pages/ExecutionPage'

const sampleExecution = {
  id: 'exec-1',
  workOrderId: 'wo-1',
  templateId: 't-1',
  templateName: 'Pre-Delivery Inspection',
  mechanicId: 'm-1',
  mechanicName: 'Mike Mech',
  status: 'in_progress',
  sections: [
    {
      id: 's-1',
      name: 'Exterior',
      order: 1,
      isRequired: true,
      questions: [
        {
          id: 'q-1',
          text: 'Check paint condition',
          type: 'boolean' as const,
          weight: 1,
          required: true,
          order: 1,
        },
        {
          id: 'q-2',
          text: 'Color notes',
          type: 'text' as const,
          weight: 1,
          required: false,
          order: 2,
        },
        {
          id: 'q-3',
          text: 'Number of scratches',
          type: 'number' as const,
          weight: 1,
          required: true,
          order: 3,
        },
        {
          id: 'q-4',
          text: 'Damage type',
          type: 'selection' as const,
          weight: 1,
          required: true,
          order: 4,
          options: ['Scratch', 'Dent', 'Rust'],
        },
      ],
    },
    {
      id: 's-2',
      name: 'Interior',
      order: 2,
      isRequired: false,
      questions: [
        {
          id: 'q-5',
          text: 'Seat condition',
          type: 'text' as const,
          weight: 1,
          required: false,
          order: 1,
        },
      ],
    },
  ],
  answers: {},
  createdAt: '2026-07-01T11:00:00Z',
}

const completedExecution = {
  ...sampleExecution,
  status: 'completed',
  answers: { 'q-1': true, 'q-2': 'Good', 'q-3': 0, 'q-4': 'None', 'q-5': 'Clean' },
  score: 100,
  passed: true,
  completedAt: '2026-07-01T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockParams = { id: 'wo-1', executionId: 'exec-1' }
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ExecutionPage', () => {
  it('should render execution info and sections', () => {
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: sampleExecution,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    expect(screen.getByText('Pre-Delivery Inspection')).toBeInTheDocument()
    expect(screen.getByText(/Mike Mech/)).toBeInTheDocument()
    expect(screen.getByText('Exterior')).toBeInTheDocument()
    expect(screen.getByText('Interior')).toBeInTheDocument()
  })

  it('should render boolean input as Switch', () => {
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: sampleExecution,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    expect(screen.getByText('Check paint condition')).toBeInTheDocument()
    const switches = document.querySelectorAll('.MuiSwitch-root')
    expect(switches.length).toBe(1)
  })

  it('should render text input', () => {
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: sampleExecution,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    const textField = screen.getByLabelText(/color notes/i)
    expect(textField).toBeInTheDocument()
    expect(textField.tagName).toBe('TEXTAREA')
  })

  it('should render number input', () => {
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: sampleExecution,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    const numberInput = screen.getByLabelText(/number of scratches/i)
    expect(numberInput).toBeInTheDocument()
    expect(numberInput).toHaveAttribute('type', 'number')
  })

  it('should render selection input as Select', () => {
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: sampleExecution,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    const labelElements = screen.getAllByText(/Damage type/)
    expect(labelElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should submit answer after debounce', async () => {
    mockSubmitAnswer.mockReturnValue({
      unwrap: () => Promise.resolve(undefined),
    })
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: sampleExecution,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    const textField = screen.getByLabelText(/color notes/i)
    await userEvent.type(textField, 'Good paint')

    // Advance past debounce (1500ms)
    vi.advanceTimersByTime(1600)

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalled()
    })
  })

  it('should complete execution and show summary', async () => {
    const user = userEvent.setup()
    mockSubmitAnswer.mockReturnValue({
      unwrap: () => Promise.resolve(undefined),
    })
    mockCompleteExecution.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          ...completedExecution,
          score: 100,
          passed: true,
          completedAt: '2026-07-01T12:00:00Z',
        }),
    })
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: sampleExecution,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    // Answer required questions first
    // q-1: boolean switch - click to set to true
    const switches = document.querySelectorAll('.MuiSwitch-input')
    await user.click(switches[0])

    // q-3: number - type a value
    const numberInputs = screen.getAllByRole('spinbutton')
    await user.type(numberInputs[0], '2')

    // q-4: selection - open and select
    const selectInputs = screen.getAllByRole('combobox')
    const damageTypeSelect = selectInputs[0]
    await user.click(damageTypeSelect)
    const option = await screen.findByRole('option', { name: 'Scratch' })
    await user.click(option)

    // Click complete button - now validation should pass
    const completeButton = screen.getByRole('button', { name: /complete/i })
    await user.click(completeButton)

    expect(mockCompleteExecution).toHaveBeenCalledWith('exec-1')

    // After mutation resolves, setShowSummary(true) triggers re-render
    // The component now shows the summary from completedResult state
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('Passed')).toBeInTheDocument()
    })
  })

  it('should show error state when fetching fails', () => {
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        status: 404,
        data: { message: 'Execution not found' },
      },
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/execution not found/i)
  })

  it('should show loading state when fetching', () => {
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should prevent answering when already completed', () => {
    mockUseGetChecklistExecutionQuery.mockReturnValue({
      data: completedExecution,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<ExecutionPage />, {
      initialEntries: ['/work-orders/wo-1/checklists/exec-1'],
    })

    // Should show the summary overlay instead of the question inputs
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Passed')).toBeInTheDocument()
  })
})
