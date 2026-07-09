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
import { useGetSparePartQuery } from '../sparePartsApi'

export default function SparePartDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: part, isLoading, isError, error } = useGetSparePartQuery(id!)

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
        Failed to load spare part.{' '}
        {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
      </Alert>
    )
  }

  if (!part) {
    return (
      <Box>
        <Alert severity="warning">Spare part not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/inventory')} sx={{ mt: 2 }}>
          Back to Inventory
        </Button>
      </Box>
    )
  }

  const isLowStock = part.currentStock < part.minStock
  const isOverstock = part.currentStock > part.maxStock
  const stockColor = isLowStock ? 'error.main' : isOverstock ? 'warning.main' : 'success.main'

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/inventory')} sx={{ mb: 2 }}>
        Back to Inventory
      </Button>

      <Typography variant="h4" gutterBottom>
        {part.name}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Spare Part Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Code</Typography>
            <Typography>{part.code}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Category</Typography>
            <Typography>{part.category}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography>{part.description}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Unit</Typography>
            <Typography>{part.unit}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Current Stock</Typography>
            <Typography sx={{ color: stockColor, fontWeight: 600 }}>
              {part.currentStock}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Min Stock</Typography>
            <Typography>{part.minStock}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Max Stock</Typography>
            <Typography>{part.maxStock}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Unit Cost</Typography>
            <Typography>${part.unitCost.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Selling Price</Typography>
            <Typography>${part.sellingPrice.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Supplier</Typography>
            <Typography>{part.supplier}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip label={part.status} color={part.status === 'active' ? 'success' : 'default'} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography>{new Date(part.createdAt).toLocaleDateString()}</Typography>
          </Grid>
          {part.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
              <Typography>{part.notes}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  )
}
