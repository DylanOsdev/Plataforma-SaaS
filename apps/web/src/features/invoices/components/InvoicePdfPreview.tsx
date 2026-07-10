import { Box, Button, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface InvoicePdfPreviewProps {
  invoiceId: string;
}

export default function InvoicePdfPreview({ invoiceId }: InvoicePdfPreviewProps) {
  return (
    <Box
      sx={{
        p: 3,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        textAlign: 'center',
      }}
    >
      <Typography color="text.secondary" gutterBottom>
        PDF preview not yet available
      </Typography>
      <Button variant="outlined" startIcon={<DownloadIcon />} disabled>
        Download PDF
      </Button>
    </Box>
  );
}
