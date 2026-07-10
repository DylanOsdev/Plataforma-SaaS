import type React from 'react'
import { Box, Typography, Chip, Button } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

export interface ExecutionSummaryProps {
  score: number
  passed: boolean
  completedAt: string
  onBackToWorkOrder?: () => void
}

export default function ExecutionSummary({
  score,
  passed,
  completedAt,
  onBackToWorkOrder,
}: ExecutionSummaryProps): React.JSX.Element {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" py={4}>
      {passed ? (
        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      ) : (
        <CancelIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
      )}

      <Typography variant="h3" gutterBottom>
        {score}%
      </Typography>

      <Chip
        label={passed ? 'Passed' : 'Failed'}
        color={passed ? 'success' : 'error'}
        sx={{ mb: 2 }}
      />

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Completed: {new Date(completedAt).toLocaleString()}
      </Typography>

      {onBackToWorkOrder && (
        <Button variant="outlined" onClick={onBackToWorkOrder} sx={{ mt: 2 }}>
          Back to Work Order
        </Button>
      )}
    </Box>
  )
}
