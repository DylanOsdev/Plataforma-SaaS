import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { httpClient } from '../../../lib/http/axios'
import { createWorkOrderSchema, type CreateWorkOrderPayload } from '../validation'
import { useCreateWorkOrderMutation } from '../workOrdersApi'
import type { ApiErrorResponse } from '../../../shared/types/api'

export interface Client {
  id: string
  name: string
}

export interface Vehicle {
  id: string
  model: string
  plate: string
}

export interface WorkOrderFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /**
   * Pre-fetched clients for testing or SSR. When omitted, the dialog fetches
   * clients from the API on mount.
   */
  initialClients?: Client[]
  /**
   * Pre-fetched vehicles for a specific client. When omitted, the dialog
   * fetches vehicles when a client is selected.
   */
  initialVehicles?: Vehicle[]
}

/**
 * Custom form dialog for creating work orders.
 * Uses react-hook-form + zod for validation.
 * Fetches clients and vehicles for cascading Autocomplete selects.
 */
export function WorkOrderFormDialog({
  open,
  onClose,
  onSuccess,
  initialClients,
  initialVehicles,
}: WorkOrderFormDialogProps) {
  const [clients, setClients] = useState<Client[]>(initialClients ?? [])
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles ?? [])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [createWorkOrder, { isLoading: isCreating }] = useCreateWorkOrderMutation()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateWorkOrderPayload>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      clientId: '',
      vehicleId: '',
      description: '',
      mechanicId: undefined,
      priority: undefined,
    },
  })

  const selectedClientId = watch('clientId')

  // Fetch clients when dialog opens, unless initialClients provided
  useEffect(() => {
    if (!open) return
    setServerError(null)
    setFieldErrors({})
    reset()

    if (initialClients) return // data provided via props

    setClientsLoading(true)
    httpClient
      .get<{ data: Client[] }>('/clients')
      .then((res) => {
        setClients(res.data.data ?? (res.data as unknown as Client[]))
        setClientsLoading(false)
      })
      .catch(() => {
        setClientsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])

  // Fetch vehicles when selected client changes, unless initialVehicles provided
  useEffect(() => {
    if (initialVehicles) return // data provided via props

    if (!selectedClientId) {
      setVehicles([])
      setValue('vehicleId', '')
      return
    }

    setVehiclesLoading(true)
    setValue('vehicleId', '')
    httpClient
      .get<{ data: Vehicle[] }>('/vehicles', {
        params: { clientId: selectedClientId },
      })
      .then((res) => {
        setVehicles(res.data.data ?? (res.data as unknown as Vehicle[]))
        setVehiclesLoading(false)
      })
      .catch(() => {
        setVehiclesLoading(false)
      })
  }, [selectedClientId, setValue, initialVehicles])

  const handleFormSubmit = handleSubmit(async (data: CreateWorkOrderPayload) => {
    setServerError(null)
    setFieldErrors({})
    try {
      await createWorkOrder(data).unwrap()
      onSuccess()
    } catch (err: unknown) {
      const apiError = err as { status?: number; data?: ApiErrorResponse }
      if (apiError?.status === 422 && apiError?.data) {
        const messages = apiError.data.message
        if (Array.isArray(messages)) {
          const fieldErrMap: Record<string, string> = {}
          messages.forEach((msg: string) => {
            const [field, ...rest] = msg.split(' ')
            if (field) fieldErrMap[field.toLowerCase()] = rest.join(' ') || msg
          })
          if (Object.keys(fieldErrMap).length > 0) {
            setFieldErrors(fieldErrMap)
          }
        }
        setServerError(
          Array.isArray(apiError.data.message)
            ? apiError.data.message.join(', ')
            : apiError.data.message,
        )
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleFormSubmit} noValidate>
        <DialogTitle>Create Work Order</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={clients}
                  loading={clientsLoading}
                  getOptionLabel={(option) => option.name}
                  value={clients.find((c) => c.id === field.value) ?? null}
                  onChange={(_, newValue) => {
                    field.onChange(newValue?.id ?? '')
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Client"
                      required
                      error={!!errors.clientId || !!fieldErrors.clientid}
                      helperText={errors.clientId?.message ?? fieldErrors.clientid}
                    />
                  )}
                />
              )}
            />

            <Controller
              name="vehicleId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={vehicles}
                  loading={vehiclesLoading}
                  getOptionLabel={(option) => `${option.model} (${option.plate})`}
                  value={vehicles.find((v) => v.id === field.value) ?? null}
                  onChange={(_, newValue) => {
                    field.onChange(newValue?.id ?? '')
                  }}
                  disabled={!selectedClientId}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vehicle"
                      required
                      error={!!errors.vehicleId || !!fieldErrors.vehicleid}
                      helperText={errors.vehicleId?.message ?? fieldErrors.vehicleid}
                    />
                  )}
                />
              )}
            />

            <TextField
              {...register('description')}
              label="Description"
              multiline
              rows={3}
              required
              error={!!errors.description || !!fieldErrors.description}
              helperText={errors.description?.message ?? fieldErrors.description}
              fullWidth
            />

            <TextField
              {...register('mechanicId')}
              label="Mechanic (optional)"
              fullWidth
              error={!!fieldErrors.mechanicid}
              helperText={fieldErrors.mechanicid}
            />

            <TextField
              {...register('priority')}
              label="Priority (optional)"
              select
              fullWidth
              error={!!errors.priority}
              helperText={errors.priority?.message}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isCreating}>
            {isCreating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
