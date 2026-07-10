import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import { useCreateCreditNoteMutation } from '../invoicesApi';
import type { CreditNoteType } from '../types';

interface CreditNoteDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  onSuccess?: () => void;
  defaultType?: CreditNoteType;
}

export default function CreditNoteDialog({
  open,
  onClose,
  invoiceId,
  onSuccess,
  defaultType,
}: CreditNoteDialogProps) {
  const [createCreditNote, { isLoading, error }] = useCreateCreditNoteMutation();
  const [type, setType] = useState<CreditNoteType>(defaultType ?? 'credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState({ amount: false, reason: false });

  const parsedAmount = Number(amount);
  const amountError = touched.amount && (amount.length === 0 || isNaN(parsedAmount) || parsedAmount <= 0);
  const reasonError = touched.reason && reason.trim().length === 0;

  const canSubmit =
    !isLoading &&
    amount.length > 0 &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    reason.trim().length > 0;

  const resetForm = () => {
    setType(defaultType ?? 'credit');
    setAmount('');
    setReason('');
    setTouched({ amount: false, reason: false });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setTouched({ amount: true, reason: true });

    if (!canSubmit) return;

    try {
      await createCreditNote({
        invoiceId,
        data: { type, amount: parsedAmount, reason: reason.trim() },
      }).unwrap();
      onSuccess?.();
      handleClose();
    } catch {
      // Error is captured via mutation state
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Credit/Debit Note</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as { data?: { message?: string } })?.data?.message ?? 'Failed to create note.'}
          </Alert>
        )}

        <TextField
          select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as CreditNoteType)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="credit">Credit</MenuItem>
          <MenuItem value="debit">Debit</MenuItem>
        </TextField>

        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, amount: true }))}
          fullWidth
          margin="normal"
          error={amountError}
          helperText={amountError ? 'Amount must be greater than 0' : ' '}
          slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
        />

        <TextField
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, reason: true }))}
          fullWidth
          margin="normal"
          multiline
          rows={3}
          error={reasonError}
          helperText={reasonError ? 'Reason is required' : ' '}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
          {isLoading ? 'Creating...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
