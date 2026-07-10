import type React from 'react'
import {
  Box,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import type { ChecklistQuestion, QuestionType } from '../types'

export interface QuestionEditorProps {
  question: ChecklistQuestion
  onChange: (updated: ChecklistQuestion) => void
  onRemove: () => void
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'selection', label: 'Selection' },
]

export function QuestionEditor({
  question,
  onChange,
  onRemove,
}: QuestionEditorProps): React.JSX.Element {
  const handleChange = (field: keyof ChecklistQuestion, value: unknown) => {
    onChange({ ...question, [field]: value })
  }

  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.default',
      }}
    >
      <Stack spacing={2}>
        <Box display="flex" alignItems="flex-start" gap={1}>
          <TextField
            label="Question Text"
            value={question.text}
            onChange={(e) => handleChange('text', e.target.value)}
            fullWidth
            multiline
            minRows={2}
            size="small"
            placeholder="Question text"
          />
          <Tooltip title="Remove question">
            <IconButton
              onClick={onRemove}
              color="error"
              size="small"
              sx={{ mt: 0.5 }}
              aria-label="Remove question"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={question.type}
              label="Type"
              onChange={(e) => handleChange('type', e.target.value as QuestionType)}
            >
              {QUESTION_TYPES.map((qt) => (
                <MenuItem key={qt.value} value={qt.value}>
                  {qt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Weight"
            type="number"
            value={question.weight}
            onChange={(e) =>
              handleChange('weight', Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            size="small"
            sx={{ width: 100 }}
            inputProps={{ min: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Required</InputLabel>
            <Select
              value={question.required ? 'yes' : 'no'}
              label="Required"
              onChange={(e) => handleChange('required', e.target.value === 'yes')}
            >
              <MenuItem value="yes">Required</MenuItem>
              <MenuItem value="no">Optional</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {question.type === 'selection' && (
          <TextField
            label="Options"
            value={question.options?.join(', ') ?? ''}
            onChange={(e) =>
              handleChange(
                'options',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            fullWidth
            size="small"
            placeholder="Option 1, Option 2, Option 3"
            helperText="Comma-separated list of options"
          />
        )}
      </Stack>
    </Box>
  )
}
