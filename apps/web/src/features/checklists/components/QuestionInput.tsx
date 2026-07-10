import type React from 'react'
import {
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material'
import type { ChecklistQuestion } from '../types'

export interface QuestionInputProps {
  question: ChecklistQuestion
  value: string | number | boolean | undefined
  onChange: (value: string | number | boolean) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
}

export default function QuestionInput({
  question,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
}: QuestionInputProps): React.JSX.Element | null {
  const labelText = (
    <Box component="span" display="flex" alignItems="center" gap={0.5}>
      {question.text}
      {question.required && (
        <Typography component="span" color="error">
          *
        </Typography>
      )}
    </Box>
  )

  switch (question.type) {
    case 'text':
      return (
        <TextField
          fullWidth
          multiline
          minRows={2}
          label={labelText}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          error={error}
          helperText={helperText}
          sx={{ mb: 2 }}
        />
      )

    case 'number':
      return (
        <TextField
          fullWidth
          type="number"
          label={labelText}
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          error={error}
          helperText={helperText}
          sx={{ mb: 2 }}
        />
      )

    case 'boolean':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
          }
          label={
            <Box component="span">
              {question.text}
              {question.required && (
                <Typography component="span" color="error">
                  *
                </Typography>
              )}
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                {value === true ? 'Yes' : 'No'}
              </Typography>
            </Box>
          }
          sx={{ mb: 2 }}
        />
      )

    case 'selection':
      return (
        <FormControl fullWidth sx={{ mb: 2 }} error={error}>
          <InputLabel>
            {question.text}
            {question.required ? ' *' : ''}
          </InputLabel>
          <Select
            value={typeof value === 'string' ? value : ''}
            label={`${question.text}${question.required ? ' *' : ''}`}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            {question.options?.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
          {helperText && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {helperText}
            </Typography>
          )}
        </FormControl>
      )

    default:
      return null
  }
}
