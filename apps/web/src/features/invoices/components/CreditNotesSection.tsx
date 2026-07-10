import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useListCreditNotesQuery, useCancelCreditNoteMutation } from '../invoicesApi';
import CreditNoteDialog from './CreditNoteDialog';
import type { CreditNote, CreditNoteType } from '../types';

interface CreditNotesSectionProps {
  invoiceId: string;
  creditNoteType?: CreditNoteType;
}

const typeColors: Record<CreditNoteType, 'success' | 'warning'> = {
  credit: 'success',
  debit: 'warning',
};

export default function CreditNotesSection({ invoiceId, creditNoteType }: CreditNotesSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<CreditNote | null>(null);

  const {
    data: notes,
    isLoading,
    isError,
    error,
  } = useListCreditNotesQuery(invoiceId);

  const [cancelCreditNote, { isLoading: isCancelling }] = useCancelCreditNoteMutation();

  const filteredNotes = notes?.filter((n) => !creditNoteType || n.type === creditNoteType);

  const buttonLabel =
    creditNoteType === 'credit'
      ? 'Add Credit Note'
      : creditNoteType === 'debit'
        ? 'Add Debit Note'
        : 'Add Note';

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    await cancelCreditNote(cancelTarget.id);
    setCancelTarget(null);
  };

  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Credit/Debit Notes</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            {buttonLabel}
          </Button>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {isError && (
          <Alert severity="error">
            {(error as { data?: { message?: string } })?.data?.message ?? 'Failed to load credit notes.'}
          </Alert>
        )}

        {filteredNotes && filteredNotes.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No credit notes for this invoice.
          </Typography>
        )}

        {filteredNotes && filteredNotes.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Number</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>
                      <Chip label={note.type} color={typeColors[note.type]} size="small" />
                    </TableCell>
                    <TableCell>{note.number}</TableCell>
                    <TableCell>${note.amount.toLocaleString()}</TableCell>
                    <TableCell>{note.reason}</TableCell>
                    <TableCell>{new Date(note.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={note.status}
                        color={note.status === 'cancelled' ? 'error' : 'default'}
                        size="small"
                        variant={note.status === 'cancelled' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      {note.status === 'active' && (
                        <Button size="small" color="error" onClick={() => setCancelTarget(note)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <CreditNoteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        invoiceId={invoiceId}
        defaultType={creditNoteType}
        onSuccess={() => setDialogOpen(false)}
      />

      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        <DialogTitle>Cancel Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this {cancelTarget?.type} note ({cancelTarget?.number})?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)} disabled={isCancelling}>
            No
          </Button>
          <Button
            onClick={handleCancelConfirm}
            color="error"
            variant="contained"
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Yes, cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
