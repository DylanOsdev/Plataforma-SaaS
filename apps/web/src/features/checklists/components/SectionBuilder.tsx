import type React from 'react'
import { useState } from 'react'
import {
  Box,
  Stack,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Paper,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { QuestionEditor } from './QuestionEditor'
import type { ChecklistQuestion, ChecklistSection } from '../types'

export interface SectionBuilderProps {
  sections: ChecklistSection[]
  onChange: (sections: ChecklistSection[]) => void
}

function createEmptyQuestion(order: number): ChecklistQuestion {
  return {
    text: '',
    type: 'text',
    weight: 1,
    required: false,
    order,
  }
}

function createEmptySection(order: number): ChecklistSection {
  return {
    name: '',
    order,
    isRequired: false,
    questions: [],
  }
}

export function SectionBuilder({
  sections,
  onChange,
}: SectionBuilderProps): React.JSX.Element {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleSectionChange = (
    index: number,
    field: keyof ChecklistSection,
    value: unknown,
  ) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const addSection = () => {
    onChange([...sections, createEmptySection(sections.length + 1)])
    setExpandedSections((prev) => new Set(prev).add(sections.length))
  }

  const removeSection = (index: number) => {
    const updated = sections
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i + 1 }))
    onChange(updated)
  }

  const addQuestion = (sectionIndex: number) => {
    const section = sections[sectionIndex]
    const updatedSection: ChecklistSection = {
      ...section,
      questions: [
        ...section.questions,
        createEmptyQuestion(section.questions.length + 1),
      ],
    }
    handleSectionChange(sectionIndex, 'questions', updatedSection.questions)
  }

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const section = sections[sectionIndex]
    const updatedQuestions = section.questions
      .filter((_, i) => i !== questionIndex)
      .map((q, i) => ({ ...q, order: i + 1 }))
    handleSectionChange(sectionIndex, 'questions', updatedQuestions)
  }

  const handleQuestionChange = (
    sectionIndex: number,
    questionIndex: number,
    updated: ChecklistQuestion,
  ) => {
    const section = sections[sectionIndex]
    const updatedQuestions = [...section.questions]
    updatedQuestions[questionIndex] = updated
    handleSectionChange(sectionIndex, 'questions', updatedQuestions)
  }

  return (
    <Box>
      <Stack spacing={2}>
        {sections.map((section, sectionIndex) => (
          <Paper key={sectionIndex} variant="outlined" sx={{ p: 2 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Box display="flex" alignItems="center" gap={1} flex={1}>
                <IconButton
                  size="small"
                  onClick={() => toggleSection(sectionIndex)}
                  aria-label={expandedSections.has(sectionIndex) ? 'Collapse section' : 'Expand section'}
                >
                  {expandedSections.has(sectionIndex) ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
                <TextField
                  value={section.name}
                  onChange={(e) =>
                    handleSectionChange(sectionIndex, 'name', e.target.value)
                  }
                  placeholder="Section name"
                  size="small"
                  sx={{ flex: 1, maxWidth: 400 }}
                  aria-label="Section name"
                />
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Required</InputLabel>
                  <Select
                    value={section.isRequired ? 'yes' : 'no'}
                    label="Required"
                    onChange={(e) =>
                      handleSectionChange(
                        sectionIndex,
                        'isRequired',
                        e.target.value === 'yes',
                      )
                    }
                  >
                    <MenuItem value="yes">Required</MenuItem>
                    <MenuItem value="no">Optional</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Tooltip title="Remove section">
                <IconButton
                  onClick={() => removeSection(sectionIndex)}
                  color="error"
                  size="small"
                  aria-label="Remove section"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Collapse in={expandedSections.has(sectionIndex)}>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {section.questions.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 1 }}
                  >
                    No questions yet. Click "Add Question" below.
                  </Typography>
                )}
                {section.questions.map((question, questionIndex) => (
                  <QuestionEditor
                    key={questionIndex}
                    question={question}
                    onChange={(updated) =>
                      handleQuestionChange(sectionIndex, questionIndex, updated)
                    }
                    onRemove={() => removeQuestion(sectionIndex, questionIndex)}
                  />
                ))}
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => addQuestion(sectionIndex)}
                  aria-label="Add question"
                >
                  Add Question
                </Button>
              </Stack>
            </Collapse>
          </Paper>
        ))}
      </Stack>

      <Button
        startIcon={<AddIcon />}
        onClick={addSection}
        sx={{ mt: 2 }}
        variant="outlined"
        aria-label="Add section"
      >
        Add Section
      </Button>
    </Box>
  )
}
