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
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useGetVehicleQuery } from '../vehiclesApi'

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: vehicle, isLoading, isError, error } = useGetVehicleQuery(id!)

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
        Failed to load vehicle.{' '}
        {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
      </Alert>
    )
  }

  if (!vehicle) {
    return (
      <Box>
        <Alert severity="warning">Vehicle not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/vehicles')} sx={{ mt: 2 }}>
          Back to Vehicles
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/vehicles')} sx={{ mb: 2 }}>
        Back to Vehicles
      </Button>

      <Typography variant="h4" gutterBottom>
        {vehicle.make} {vehicle.model}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vehicle Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Make</Typography>
            <Typography>{vehicle.make}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Model</Typography>
            <Typography>{vehicle.model}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Year</Typography>
            <Typography>{vehicle.year}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Plate</Typography>
            <Typography>{vehicle.plate}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">VIN</Typography>
            <Typography>{vehicle.vin}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Color</Typography>
            <Typography>{vehicle.color}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Fuel Type</Typography>
            <Typography>{vehicle.fuelType}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Mileage</Typography>
            <Typography>{vehicle.mileage.toLocaleString()} km</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip label={vehicle.status} color={vehicle.status === 'active' ? 'success' : 'default'} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography>{new Date(vehicle.createdAt).toLocaleDateString()}</Typography>
          </Grid>
          {vehicle.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
              <Typography>{vehicle.notes}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Owner Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Name</Typography>
            <Typography>{vehicle.client.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
            <Typography>{vehicle.client.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
            <Typography>{vehicle.client.phone}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
