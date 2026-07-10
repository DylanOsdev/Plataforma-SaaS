import { useState } from 'react'
import type React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import { useGetWorkOrderQuery } from '../../work-orders/workOrdersApi'
import { useListMechanicsQuery } from '../../mechanics/mechanicsApi'
import {
  useGetWorkOrderChecklistsQuery,
  useAssignChecklistMutation,
  useStartExecutionMutation,
} from '../checklistsApi'
import { useListChecklistTemplatesQuery } from '../checklistsApi'
import type { ChecklistExecution } from '../types'

export default function WorkOrderDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── Data fetching ──
  const {
    data: workOrder,
    isLoading,
    isError,
    error,
  } = useGetWorkOrderQuery(id!)

  const {
    data: executions,
    isLoading: isLoadingExecutions,
  } = useGetWorkOrderChecklistsQuery(id!, { skip: !id })

  // ── Assign dialog state ──
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedMechanic, setSelectedMechanic] = useState('')

  const { data: templatesData } = useListChecklistTemplatesQuery(
    { limit: 100 },
    { skip: !assignDialogOpen },
  )
  const { data: mechanicsData } = useListMechanicsQuery(
    { limit: 100 },
    { skip: !assignDialogOpen },
  )

  const [assignChecklist, { isLoading: isAssigning }] =
    useAssignChecklistMutation()
  const [startExecution] = useStartExecutionMutation()

  // ── Handlers ──
  const handleOpenAssignDialog = () => {
    setSelectedTemplate('')
    setSelectedMechanic('')
    setAssignDialogOpen(true)
  }

  const handleAssign = async () => {
    if (!selectedTemplate || !selectedMechanic) return
    try {
      await assignChecklist({
        workOrderId: id!,
        templateId: selectedTemplate,
        mechanicId: selectedMechanic,
      }).unwrap()
      setAssignDialogOpen(false)
    } catch {
      // Error handled by RTK Query
    }
  }

  const handleStartExecution = async (executionId: string) => {
    try {
      await startExecution(executionId).unwrap()
      navigate(`/work-orders/${id}/checklists/${executionId}`)
    } catch {
      // Error handled by RTK Query
    }
  }

  const handleViewExecution = (executionId: string) => {
    navigate(`/work-orders/${id}/checklists/${executionId}`)
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  // ── Error state ──
  if (isError) {
    return (
      <Alert severity="error">
        Failed to load work order.{' '}
        {(error as { data?: { message?: string } })?.data?.message ??
          'Please try again.'}
      </Alert>
    )
  }

  // ── Not found state ──
  if (!workOrder) {
    return (
      <Box>
        <Alert severity="warning">Work order not found.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/work-orders')}
          sx={{ mt: 2 }}
        >
          Back to Work Orders
        </Button>
      </Box>
    )
  }

  const primaryMechanic = workOrder.mechanics?.find((m) => m.isPrimary)
  const totalCost =
    workOrder.parts?.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0,
    ) ?? 0

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/work-orders')}
        sx={{ mb: 2 }}
      >
        Back to Work Orders
      </Button>

      <Typography variant="h4" gutterBottom>
        Work Order #{workOrder.id.slice(0, 8)}
      </Typography>

      {/* ── Work Order Information ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Work Order Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Client
            </Typography>
            <Typography>{workOrder.client.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={workOrder.milestone.replace(/_/g, ' ')}
              color={
                workOrder.milestone === 'completed' ||
                workOrder.milestone === 'paid'
                  ? 'success'
                  : workOrder.milestone === 'in_progress'
                    ? 'info'
                    : 'default'
              }
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Vehicle
            </Typography>
            <Typography>
              {workOrder.vehicle.model} ({workOrder.vehicle.plate})
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Primary Mechanic
            </Typography>
            <Typography>
              {primaryMechanic?.mechanic.name ?? '—'}
            </Typography>
          </Grid>
          {workOrder.priority && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Priority
              </Typography>
              <Typography sx={{ textTransform: 'capitalize' }}>
                {workOrder.priority}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Created
            </Typography>
            <Typography>
              {new Date(workOrder.createdAt).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography>{workOrder.description}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Costs ── */}
      {workOrder.parts && workOrder.parts.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Parts &amp; Costs
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Part</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workOrder.parts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell>{part.partName}</TableCell>
                    <TableCell align="right">{part.quantity}</TableCell>
                    <TableCell align="right">
                      ${part.unitPrice.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      ${(part.quantity * part.unitPrice).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Typography variant="subtitle1">
              <strong>Total: ${totalCost.toLocaleString()}</strong>
            </Typography>
          </Box>
        </Paper>
      )}

      {/* ── Assigned Checklists ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Assigned Checklists</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAssignDialog}
          >
            Assign Checklist
          </Button>
        </Box>

        {isLoadingExecutions ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : !executions || executions.length === 0 ? (
          <Typography color="text.secondary">
            No checklists assigned yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Mechanic</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executions.map((exec: ChecklistExecution) => (
                  <TableRow key={exec.id}>
                    <TableCell>{exec.templateName}</TableCell>
                    <TableCell>
                      <Chip
                        label={exec.status.replace(/_/g, ' ')}
                        color={
                          exec.status === 'completed'
                            ? 'success'
                            : exec.status === 'in_progress'
                              ? 'info'
                              : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{exec.mechanicName}</TableCell>
                    <TableCell align="right">
                      {exec.status === 'pending' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleStartExecution(exec.id)}
                          sx={{ mr: 0.5 }}
                        >
                          Start
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleViewExecution(exec.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Assign Checklist Dialog ── */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Checklist</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="template-select-label">Template</InputLabel>
              <Select
                labelId="template-select-label"
                value={selectedTemplate}
                label="Template"
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templatesData?.data?.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                )) ?? []}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="mechanic-select-label">Mechanic</InputLabel>
              <Select
                labelId="mechanic-select-label"
                value={selectedMechanic}
                label="Mechanic"
                onChange={(e) => setSelectedMechanic(e.target.value)}
              >
                {mechanicsData?.data?.map((m: { id: string; name: string }) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                )) ?? []}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={!selectedTemplate || !selectedMechanic || isAssigning}
          >
            {isAssigning ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
