import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Chip,
  Grid,
  Stack,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useGetMechanicQuery } from '../mechanicsApi'

export default function MechanicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: mechanic, isLoading, isError, error } = useGetMechanicQuery(id!)

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load mechanic.{' '}
        {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
      </Alert>
    )
  }

  if (!mechanic) {
    return (
      <Box>
        <Alert severity="warning">Mechanic not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mechanics')} sx={{ mt: 2 }}>
          Back to Mechanics
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mechanics')} sx={{ mb: 2 }}>
        Back to Mechanics
      </Button>

      <Typography variant="h4" gutterBottom>
        {mechanic.name}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Mechanic Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
            <Typography>{mechanic.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
            <Typography>{mechanic.phone}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Specializations</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {mechanic.specializations.map((spec) => (
                <Chip key={spec} label={spec} size="small" color="primary" variant="outlined" />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Hire Date</Typography>
            <Typography>{new Date(mechanic.hireDate).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Hourly Rate</Typography>
            <Typography>${mechanic.hourlyRate.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip label={mechanic.status} color={mechanic.status === 'active' ? 'success' : 'default'} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography>{new Date(mechanic.createdAt).toLocaleDateString()}</Typography>
          </Grid>
          {mechanic.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
              <Typography>{mechanic.notes}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  )
}
