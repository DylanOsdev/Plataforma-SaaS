import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  Chip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DataTable, type Column } from '../../../shared/components/DataTable';
import { useListInvoicesQuery } from '../invoicesApi';
import type { Invoice, ListInvoicesParams, InvoiceStatus } from '../types';

const statusColors: Record<InvoiceStatus, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  overpaid: 'error',
  cancelled: 'default',
};

const columns: Column<Invoice>[] = [
  {
    id: 'invoiceNumber',
    label: 'Invoice #',
    render: (row) => row.invoiceNumber,
    sortable: true,
  },
  {
    id: 'client',
    label: 'Client',
    render: (row) => row.client.name,
  },
  {
    id: 'totalAmount',
    label: 'Total',
    render: (row) => `$${row.totalAmount.toLocaleString()}`,
  },
  {
    id: 'status',
    label: 'Status',
    render: (row) => <Chip label={row.status} color={statusColors[row.status]} size="small" />,
    sortable: true,
  },
  {
    id: 'issueDate',
    label: 'Issued',
    render: (row) => new Date(row.issueDate).toLocaleDateString(),
    sortable: true,
  },
];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const params: ListInvoicesParams = {
    page: page + 1,
    limit: rowsPerPage,
  };
  if (statusFilter) params.status = statusFilter as InvoiceStatus;

  const { data, isLoading, isError, error } = useListInvoicesQuery(params);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(0);
  }, []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Invoices</Typography>
      </Box>

      <Stack direction="row" spacing={2} mb={2}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">pending</MenuItem>
            <MenuItem value="partial">partial</MenuItem>
            <MenuItem value="paid">paid</MenuItem>
            <MenuItem value="overpaid">overpaid</MenuItem>
            <MenuItem value="cancelled">cancelled</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load invoices.{' '}
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
        emptyMessage="No hay facturas"
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/invoices/${row.id}`)}
      />
    </Box>
  );
}
