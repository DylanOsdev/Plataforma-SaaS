import { Box, Button, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useCallback, useState } from 'react';
import { httpClient } from '../../../lib/http/axios';

interface InvoicePdfPreviewProps {
  invoiceId: string;
}

export default function InvoicePdfPreview({ invoiceId }: InvoicePdfPreviewProps) {
  const [error, setError] = useState(false);
  const pdfUrl = `${httpClient.defaults.baseURL}/invoices/${invoiceId}/pdf`;

  const handleDownload = useCallback(() => {
    window.open(pdfUrl, '_blank');
  }, [pdfUrl]);

  if (error) {
    return (
      <Box
        sx={{
          p: 3,
          border: '1px dashed',
          borderColor: 'error.main',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Typography color="error" gutterBottom>
          No se pudo cargar la vista previa del PDF
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Intentar descarga directa
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        component="iframe"
        src={pdfUrl}
        sx={{
          width: '100%',
          height: 600,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
        title={`Factura ${invoiceId}`}
        onError={() => setError(true)}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Descargar PDF
        </Button>
      </Box>
    </Box>
  );
}
