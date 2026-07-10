import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import { SectionBuilder } from '../components/SectionBuilder'
import {
  useGetChecklistTemplateQuery,
  useCreateChecklistTemplateMutation,
  useUpdateChecklistTemplateMutation,
} from '../checklistsApi'
import type { ChecklistSection } from '../types'

export default function TemplateFormPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: template, isLoading, isError, error } =
    useGetChecklistTemplateQuery(id!, { skip: !isEdit })

  const [createTemplate, { isLoading: isCreating }] =
    useCreateChecklistTemplateMutation()
  const [updateTemplate, { isLoading: isUpdating }] =
    useUpdateChecklistTemplateMutation()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sections, setSections] = useState<ChecklistSection[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load template data when editing
  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description ?? '')
      setSections(template.sections)
    }
  }, [template])

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = 'Template name is required'
    }
    if (sections.length === 0) {
      newErrors.sections = 'At least one section is required'
    }
    sections.forEach((section, i) => {
      if (!section.name.trim()) {
        newErrors[`section-${i}-name`] = 'Section name is required'
      }
      if (section.questions.length === 0) {
        newErrors[`section-${i}-questions`] =
          'Each section must have at least one question'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, sections])

  const handleSave = useCallback(async () => {
    if (!validate()) return

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      sections,
    }

    try {
      if (isEdit && id) {
        await updateTemplate({ id, changes: payload }).unwrap()
      } else {
        await createTemplate(payload).unwrap()
      }
      navigate('/checklist-templates')
    } catch {
      // Error handling is handled by RTK Query invalidation
    }
  }, [validate, name, description, sections, isEdit, id, updateTemplate, createTemplate, navigate])

  // Loading state for edit mode
  if (isEdit && isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  // Error state for edit mode
  if (isEdit && isError) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/checklist-templates')}
          sx={{ mb: 2 }}
        >
          Back to Templates
        </Button>
        <Alert severity="error">
          Failed to load template.{' '}
          {(error as { data?: { message?: string } })?.data?.message ??
            'Please try again.'}
        </Alert>
      </Box>
    )
  }

  const isSaving = isCreating || isUpdating

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/checklist-templates')}
        sx={{ mb: 2 }}
      >
        Back to Templates
      </Button>

      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Template' : 'Create Template'}
      </Typography>

      <Stack spacing={3} sx={{ maxWidth: 800 }}>
        <TextField
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          error={Boolean(errors.name)}
          helperText={errors.name}
          placeholder="Template name"
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          placeholder="Description (optional)"
        />

        <Box>
          <Typography variant="h6" gutterBottom>
            Sections
          </Typography>
          {errors.sections && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errors.sections}
            </Alert>
          )}
          <SectionBuilder sections={sections} onChange={setSections} />
        </Box>

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
            aria-label="Save template"
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/checklist-templates')}
          >
            Cancel
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
