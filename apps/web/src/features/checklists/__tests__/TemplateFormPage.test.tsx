import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'

const mockUseGetChecklistTemplateQuery = vi.fn()
const mockCreateTemplate = vi.fn()
const mockUpdateTemplate = vi.fn()
const mockNavigate = vi.fn()

// Track current mock params state
let mockParams: Record<string, string | undefined> = { id: 't-1' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

vi.mock('../checklistsApi', () => ({
  useListChecklistTemplatesQuery: vi.fn(),
  useGetChecklistTemplateQuery: (...args: unknown[]) =>
    mockUseGetChecklistTemplateQuery(...args),
  useCreateChecklistTemplateMutation: vi.fn(() => [
    mockCreateTemplate,
    { isLoading: false },
  ]),
  useUpdateChecklistTemplateMutation: vi.fn(() => [
    mockUpdateTemplate,
    { isLoading: false },
  ]),
  useDeleteChecklistTemplateMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}))

import TemplateFormPage from '../pages/TemplateFormPage'

const sampleTemplate = {
  id: 't-1',
  name: 'Pre-Delivery Inspection',
  description: 'Checklist for PDI',
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
      ],
    },
  ],
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockParams = { id: 't-1' }
  mockCreateTemplate.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ id: 'new-1' }) })
  mockUpdateTemplate.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ id: 't-1' }) })
})

describe('TemplateFormPage — Edit Mode', () => {
  it('should render form with existing template data', async () => {
    mockUseGetChecklistTemplateQuery.mockReturnValue({
      data: sampleTemplate,
      isLoading: false,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/t-1/edit'],
    })

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText(/template name/i) as HTMLInputElement
      expect(nameInput.value).toBe('Pre-Delivery Inspection')
    })

    const descInput = screen.getByPlaceholderText(/description.*optional/i) as HTMLInputElement
    expect(descInput.value).toBe('Checklist for PDI')
  })

  it('should show loading state when fetching template', () => {
    mockUseGetChecklistTemplateQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/t-1/edit'],
    })

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should show error state when fetching fails', () => {
    mockUseGetChecklistTemplateQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 404, data: { message: 'Template not found' } },
    })

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/t-1/edit'],
    })

    expect(screen.getByText(/Template not found/i)).toBeInTheDocument()
  })
})

describe('TemplateFormPage — Create Mode', () => {
  beforeEach(() => {
    mockParams = {}
  })

  it('should render empty form for creating a new template', () => {
    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/new'],
    })

    expect(screen.getByPlaceholderText(/template name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/description.*optional/i)).toBeInTheDocument()
  })

  it('should display validation error when saving with empty name', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/new'],
    })

    const saveButton = screen.getByRole('button', { name: /save template/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockCreateTemplate).not.toHaveBeenCalled()
    })
  })

  it('should add a section when clicking add section', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/new'],
    })

    const addSectionButton = screen.getByRole('button', { name: /add section/i })
    await user.click(addSectionButton)

    const sectionNameFields = screen.getAllByPlaceholderText(/section name/i)
    expect(sectionNameFields.length).toBe(1)
  })

  it('should remove a section when clicking remove section', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/new'],
    })

    // Add a section first
    const addSectionButton = screen.getByRole('button', { name: /add section/i })
    await user.click(addSectionButton)
    expect(screen.getAllByPlaceholderText(/section name/i).length).toBe(1)

    // Remove it
    const removeButton = screen.getByRole('button', { name: /remove section/i })
    await user.click(removeButton)

    expect(screen.queryAllByPlaceholderText(/section name/i).length).toBe(0)
  })

  it('should add a question to a section', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/new'],
    })

    // Add section first
    await user.click(screen.getByRole('button', { name: /add section/i }))

    // Add question
    const addQuestionButton = screen.getByRole('button', { name: /add question/i })
    await user.click(addQuestionButton)

    const questionTextFields = screen.getAllByPlaceholderText(/question text/i)
    expect(questionTextFields.length).toBe(1)
  })

  it('should remove a question from a section', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/new'],
    })

    await user.click(screen.getByRole('button', { name: /add section/i }))
    await user.click(screen.getByRole('button', { name: /add question/i }))

    expect(screen.getAllByPlaceholderText(/question text/i).length).toBe(1)

    const removeQuestionButton = screen.getByRole('button', { name: /remove question/i })
    await user.click(removeQuestionButton)

    expect(screen.queryAllByPlaceholderText(/question text/i).length).toBe(0)
  })
})

describe('TemplateFormPage — Validation', () => {
  beforeEach(() => {
    mockParams = {}
  })

  it('should prevent saving with no sections', async () => {
    const user = userEvent.setup()

    renderWithProviders(<TemplateFormPage />, {
      initialEntries: ['/checklist-templates/new'],
    })

    // Fill in name
    const nameInput = screen.getByPlaceholderText(/template name/i)
    await user.type(nameInput, 'My Template')

    const saveButton = screen.getByRole('button', { name: /save template/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockCreateTemplate).not.toHaveBeenCalled()
    })

    expect(screen.getByText(/at least one section/i)).toBeInTheDocument()
  })
})
