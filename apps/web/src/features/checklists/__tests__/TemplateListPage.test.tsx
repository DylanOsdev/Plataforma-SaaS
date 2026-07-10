import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseListChecklistTemplatesQuery = vi.fn()
const mockUseDeleteChecklistTemplateMutation = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../checklistsApi', () => ({
  useListChecklistTemplatesQuery: (...args: unknown[]) =>
    mockUseListChecklistTemplatesQuery(...args),
  useGetChecklistTemplateQuery: vi.fn(),
  useCreateChecklistTemplateMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useUpdateChecklistTemplateMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useDeleteChecklistTemplateMutation: (...args: unknown[]) =>
    mockUseDeleteChecklistTemplateMutation(...args),
}))

import TemplateListPage from '../pages/TemplateListPage'

const sampleTemplates = [
  {
    id: 't-1',
    name: 'Pre-Delivery Inspection',
    description: 'Checklist for pre-delivery inspections',
    isActive: true,
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
            type: 'boolean',
            weight: 1,
            required: true,
            order: 1,
          },
        ],
      },
    ],
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 't-2',
    name: 'Oil Change Service',
    description: 'Standard oil change checklist',
    isActive: true,
    sections: [],
    createdAt: '2026-06-15T09:00:00Z',
    updatedAt: '2026-06-15T09:00:00Z',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockUseDeleteChecklistTemplateMutation.mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ])
})

describe('TemplateListPage', () => {
  it('should render template data from API', () => {
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: {
        data: sampleTemplates,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    expect(screen.getByText('Pre-Delivery Inspection')).toBeInTheDocument()
    expect(
      screen.getByText('Checklist for pre-delivery inspections'),
    ).toBeInTheDocument()
    expect(screen.getByText('Oil Change Service')).toBeInTheDocument()
  })

  it('should render section count for templates', () => {
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: {
        data: sampleTemplates,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    expect(screen.getByText('1 sections')).toBeInTheDocument()
    expect(screen.getByText('0 sections')).toBeInTheDocument()
  })

  it('should render active chip for templates', () => {
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: {
        data: sampleTemplates,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    const chips = screen.getAllByText('Active')
    expect(chips.length).toBeGreaterThanOrEqual(2)
  })

  it('should navigate to create template page when clicking create button', async () => {
    const user = userEvent.setup()
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    const createButton = screen.getByRole('button', { name: /create template/i })
    await user.click(createButton)
    expect(mockNavigate).toHaveBeenCalledWith('/checklist-templates/new')
  })

  it('should navigate to edit page when clicking edit action', async () => {
    const user = userEvent.setup()
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: {
        data: sampleTemplates,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/checklist-templates/t-1/edit')
  })

  it('should show delete confirmation and remove template', async () => {
    const user = userEvent.setup()
    const mockDeleteFn = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue(undefined) })
    mockUseDeleteChecklistTemplateMutation.mockReturnValue([mockDeleteFn, { isLoading: false }])
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: {
        data: sampleTemplates,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    // Confirm dialog should appear
    expect(screen.getByText(/delete template/i)).toBeInTheDocument()
    expect(
      screen.getByText(/are you sure/i),
    ).toBeInTheDocument()

    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /delete/i })
    await user.click(confirmButton)

    expect(mockDeleteFn).toHaveBeenCalledWith('t-1')
  })

  it('should show error alert when API fails', () => {
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Failed to load templates' } },
    })

    renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/failed to load/i)
  })

  it('should show empty state when no templates exist', () => {
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    expect(screen.getByText('No checklist templates yet')).toBeInTheDocument()
  })

  it('should show loading skeleton when data is being fetched', () => {
    mockUseListChecklistTemplatesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    const { container } = renderWithProviders(<TemplateListPage />, {
      initialEntries: ['/checklist-templates'],
    })

    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
