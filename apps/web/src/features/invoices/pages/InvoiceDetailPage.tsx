import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGetInvoiceQuery } from '../invoicesApi';
import CreditNotesSection from '../components/CreditNotesSection';
import InvoicePdfPreview from '../components/InvoicePdfPreview';
import type { InvoiceStatus } from '../types';

const statusColors: Record<InvoiceStatus, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  overpaid: 'error',
  cancelled: 'default',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading, isError, error } = useGetInvoiceQuery(id!);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load invoice.{' '}
        {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
      </Alert>
    );
  }

  if (!invoice) {
    return (
      <Box>
        <Alert severity="warning">Factura no encontrada.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')} sx={{ mt: 2 }}>
          Back to Invoices
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')} sx={{ mb: 2 }}>
        Back to Invoices
      </Button>

      <Typography variant="h4" gutterBottom>
        {invoice.invoiceNumber}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invoice Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Client
            </Typography>
            <Typography>{invoice.client.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Chip label={invoice.status} color={statusColors[invoice.status]} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Issue Date
            </Typography>
            <Typography>{new Date(invoice.issueDate).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Work Order
            </Typography>
            <Typography>{invoice.workOrder.id}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Amounts
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Subtotal
            </Typography>
            <Typography>${invoice.subtotal.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Tax ({invoice.taxRate * 100}%)
            </Typography>
            <Typography>${invoice.taxAmount.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Total
            </Typography>
            <Typography variant="h6">${invoice.totalAmount.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Paid
            </Typography>
            <Typography>${invoice.paidAmount.toLocaleString()}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {invoice.payments.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payments
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>${payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <CreditNotesSection invoiceId={invoice.id} />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          PDF
        </Typography>
        <InvoicePdfPreview invoiceId={invoice.id} />
      </Paper>
    </Box>
  );
}
