import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Stack, Typography, Box, IconButton } from '@mui/material';
import { Button } from 'react-bootstrap';
import { Close, Visibility } from '@mui/icons-material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { JSONParse } from '@/helpers/generateEventTemplate';

const EventViewDocumentsModal = ({ open, onClose, bookingId }) => {
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        if (!bookingId || !open) return;

        setLoading(true);
        axios
            .get(route('events.booking.invoice', { id: bookingId }))
            .then((res) => {
                const docs = JSONParse(res.data.booking?.booking_docs) || [];
                setDocuments(docs);
            })
            .catch((error) => {
                enqueueSnackbar('Failed to load documents.', { variant: 'error' });
            })
            .finally(() => setLoading(false));
    }, [bookingId, open]);

    const renderDocument = (doc, index) => {
        const ext = doc.split('.').pop().toLowerCase();

        // For images
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
            return (
                <Box key={index} sx={{ width: '120px', textAlign: 'center', cursor: 'pointer' }} onClick={() => window.open(doc, '_blank')}>
                    <img
                        src={doc}
                        alt={`Document ${index + 1}`}
                        style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                        }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        Image {index + 1}
                    </Typography>
                </Box>
            );
        }

        // For PDF
        if (ext === 'pdf') {
            return (
                <Box key={index} sx={{ width: '120px', textAlign: 'center', cursor: 'pointer' }} onClick={() => window.open(doc, '_blank')}>
                    <Box
                        sx={{
                            width: '100px',
                            height: '100px',
                            backgroundColor: '#dc3545',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                        }}
                    >
                        <Typography sx={{ color: 'white', fontWeight: 'bold' }}>PDF</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        PDF {index + 1}
                    </Typography>
                </Box>
            );
        }

        // For DOCX/DOC
        if (ext === 'docx' || ext === 'doc') {
            return (
                <Box key={index} sx={{ width: '120px', textAlign: 'center', cursor: 'pointer' }} onClick={() => window.open(doc, '_blank')}>
                    <Box
                        sx={{
                            width: '100px',
                            height: '100px',
                            backgroundColor: '#2b579a',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                        }}
                    >
                        <Typography sx={{ color: 'white', fontWeight: 'bold' }}>DOC</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        Word {index + 1}
                    </Typography>
                </Box>
            );
        }

        // For other file types
        return (
            <Box key={index} sx={{ width: '120px', textAlign: 'center', cursor: 'pointer' }} onClick={() => window.open(doc, '_blank')}>
                <Box
                    sx={{
                        width: '100px',
                        height: '100px',
                        backgroundColor: '#6c757d',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                    }}
                >
                    <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '10px' }}>{ext.toUpperCase()}</Typography>
                </Box>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    File {index + 1}
                </Typography>
            </Box>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Visibility sx={{ color: '#063455' }} />
                    <Typography variant="h6">Attached Documents</Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Stack alignItems="center" py={3}>
                        <CircularProgress />
                    </Stack>
                ) : documents.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', py: 2 }}>{documents.map((doc, index) => renderDocument(doc, index))}</Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No documents attached to this booking.</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventViewDocumentsModal;
