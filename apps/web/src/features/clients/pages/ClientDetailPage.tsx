import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useGetClientQuery } from '../clientsApi'
import { useListVehiclesQuery } from '../../vehicles/vehiclesApi'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    data: client,
    isLoading,
    isError,
    error,
  } = useGetClientQuery(id!)

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useListVehiclesQuery(
    { clientId: id! },
    { skip: !id },
  )

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
        Failed to load client.{' '}
        {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
      </Alert>
    )
  }

  if (!client) {
    return (
      <Box>
        <Alert severity="warning">Client not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')} sx={{ mt: 2 }}>
          Back to Clients
        </Button>
      </Box>
    )
  }

  const vehicles = vehiclesData?.data ?? []

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')} sx={{ mb: 2 }}>
        Back to Clients
      </Button>

      <Typography variant="h4" gutterBottom>
        {client.name}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Client Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
            <Typography>{client.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
            <Typography>{client.phone}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Address</Typography>
            <Typography>{client.address}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip label={client.status} color={client.status === 'active' ? 'success' : 'default'} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography>{new Date(client.createdAt).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Updated</Typography>
            <Typography>{new Date(client.updatedAt).toLocaleDateString()}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vehicles
        </Typography>
        {isLoadingVehicles ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : vehicles.length === 0 ? (
          <Typography color="text.secondary">No vehicles registered for this client.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Make</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Plate</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.make}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.plate}</TableCell>
                    <TableCell>
                      <Chip
                        label={vehicle.status}
                        color={vehicle.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}
