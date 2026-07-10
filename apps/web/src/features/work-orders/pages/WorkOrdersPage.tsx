import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Typography,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../../shared/components/DataTable';
import { useListWorkOrdersQuery } from '../workOrdersApi';
import { useCreateInvoiceMutation } from '../../invoices/invoicesApi';
import type { WorkOrder, ListWorkOrdersParams } from '../types';
import { MILESTONE_LABELS, MILESTONE_COLORS } from '../milestone-config';
import { WorkOrderFormDialog } from '../components/WorkOrderFormDialog';

const MILESTONE_FILTER_OPTIONS = [
  { value: 'created', label: MILESTONE_LABELS.created },
  { value: 'assigned', label: MILESTONE_LABELS.assigned },
  { value: 'in_progress', label: MILESTONE_LABELS.in_progress },
  { value: 'in_review', label: MILESTONE_LABELS.in_review },
  { value: 'completed', label: MILESTONE_LABELS.completed },
  { value: 'invoiced', label: MILESTONE_LABELS.invoiced },
  { value: 'paid', label: MILESTONE_LABELS.paid },
  { value: 'delivered', label: MILESTONE_LABELS.delivered },
];

const columns: Column<WorkOrder>[] = [
  {
    id: 'clientName',
    label: 'Client',
    render: (row) => row.client.name,
    sortable: true,
  },
  {
    id: 'vehicle',
    label: 'Vehicle',
    render: (row) => `${row.vehicle.model} (${row.vehicle.plate})`,
  },
  {
    id: 'milestone',
    label: 'Status',
    render: (row) => {
      const color = MILESTONE_COLORS[row.milestone] ?? 'default';
      const label = MILESTONE_LABELS[row.milestone] ?? row.milestone;
      return <Chip label={label} color={color} size="small" />;
    },
    sortable: true,
  },
  {
    id: 'mechanics',
    label: 'Mechanic',
    render: (row) => {
      const primary = row.mechanics?.find((m) => m.isPrimary);
      return primary?.mechanic.name ?? row.mechanics?.[0]?.mechanic.name ?? '—';
    },
  },
  {
    id: 'priority',
    label: 'Priority',
    render: (row) => {
      if (!row.priority) return '—';
      return row.priority.charAt(0).toUpperCase() + row.priority.slice(1);
    },
  },
  {
    id: 'createdAt',
    label: 'Created',
    render: (row) => new Date(row.createdAt).toLocaleDateString(),
    sortable: true,
  },
];

export type WorkOrdersPageProps = {
  /** For testing — allows overriding the initial query params */
  initialParams?: Partial<ListWorkOrdersParams>;
};

export default function WorkOrdersPage({ initialParams }: WorkOrdersPageProps) {
  const [page, setPage] = useState(initialParams?.page ?? 0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [milestoneFilter, setMilestoneFilter] = useState<string>(initialParams?.milestone ?? '');
  const [mechanicFilter, setMechanicFilter] = useState<string>(initialParams?.mechanicId ?? '');
  const [dateFrom, setDateFrom] = useState(initialParams?.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(initialParams?.dateTo ?? '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmInvoiceId, setConfirmInvoiceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const params: ListWorkOrdersParams = {
    page: page + 1, // API is 1-indexed, MUI DataTable is 0-indexed
    limit: rowsPerPage,
  };
  if (milestoneFilter) params.milestone = milestoneFilter;
  if (mechanicFilter) params.mechanicId = mechanicFilter;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const { data, isLoading, isError, error } = useListWorkOrdersQuery(params);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const handleMilestoneChange = useCallback((value: string) => {
    setMilestoneFilter(value);
    setPage(0);
  }, []);

  const handleMechanicChange = useCallback((value: string) => {
    setMechanicFilter(value);
    setPage(0);
  }, []);

  const navigate = useNavigate();
  const [createInvoice] = useCreateInvoiceMutation();

  const handleCreateSuccess = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleInvoiceConfirm = useCallback(async () => {
    if (!confirmInvoiceId) return;
    try {
      const invoice = await createInvoice({ workOrderId: confirmInvoiceId }).unwrap();
      setConfirmInvoiceId(null);
      navigate(`/invoices/${invoice.id}`);
    } catch {
      setConfirmInvoiceId(null);
      setErrorMessage('Failed to create invoice. Please try again.');
    }
  }, [confirmInvoiceId, createInvoice, navigate]);

  const handleCloseError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Work Orders</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Create Work Order
        </Button>
      </Box>

      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="milestone-filter-label">Milestone</InputLabel>
          <Select
            labelId="milestone-filter-label"
            value={milestoneFilter}
            label="Milestone"
            onChange={(e) => handleMilestoneChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {MILESTONE_FILTER_OPTIONS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Mechanic"
          value={mechanicFilter}
          onChange={(e) => handleMechanicChange(e.target.value)}
          sx={{ minWidth: 160 }}
        />

        <TextField
          size="small"
          type="date"
          label="From"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(0);
          }}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          size="small"
          type="date"
          label="To"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(0);
          }}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load work orders.{' '}
          {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalCount={data?.meta?.total ?? 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        isLoading={isLoading}
        emptyMessage="No work orders yet"
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/work-orders/${row.id}`)}
        renderActions={(row) => {
          if (row.milestone !== 'completed') return null;
          return (
            <Tooltip title="Create invoice">
              <IconButton
                size="small"
                color="primary"
                aria-label="Create invoice"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmInvoiceId(row.id);
                }}
              >
                <ReceiptIcon />
              </IconButton>
            </Tooltip>
          );
        }}
      />

      {dialogOpen && (
        <WorkOrderFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      <ConfirmDialog
        open={confirmInvoiceId !== null}
        title="Create Invoice"
        message="Are you sure you want to create an invoice from this completed work order?"
        confirmLabel="Create Invoice"
        confirmColor="primary"
        onConfirm={handleInvoiceConfirm}
        onCancel={() => setConfirmInvoiceId(null)}
      />

      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
