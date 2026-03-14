import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, IconButton } from '@mui/material';
import { Button } from 'react-bootstrap';
import { Close, Visibility } from '@mui/icons-material';

const ViewDocumentsModal = ({ open, onClose, media = [] }) => {
    // If media is passed directly, we don't need to fetch.
    // However, if we support fetching by ID, we might need logic.
    // For now, let's assume `media` array is passed from parent (eager loaded).

    const renderDocument = (doc, index) => {
        // Handle different media structures. If coming from Media model:
        // doc.file_path, doc.file_name, doc.mime_type

        let fileUrl = doc.file_path;
        // Fix path if it starts with storage/ or public/ or just relative
        // Assuming asset() helper or relative path.
        // If stored as 'storage/path', it should be accessible from root.

        // Ensure leading slash
        if (fileUrl && !fileUrl.startsWith('/') && !fileUrl.startsWith('http')) {
            fileUrl = '/' + fileUrl;
        }

        const ext = doc.file_name ? doc.file_name.split('.').pop().toLowerCase() : 'file';

        // For images
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || doc.mime_type?.startsWith('image/')) {
            return (
                <Box key={index} sx={{ width: '120px', textAlign: 'center', cursor: 'pointer' }} onClick={() => window.open(fileUrl, '_blank')}>
                    <img
                        src={fileUrl}
                        alt={`Document ${index + 1}`}
                        style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                        }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>
                        {doc.file_name || `Image ${index + 1}`}
                    </Typography>
                </Box>
            );
        }

        // For PDF
        if (ext === 'pdf' || doc.mime_type === 'application/pdf') {
            return (
                <Box key={index} sx={{ width: '120px', textAlign: 'center', cursor: 'pointer' }} onClick={() => window.open(fileUrl, '_blank')}>
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
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>
                        {doc.file_name || `PDF ${index + 1}`}
                    </Typography>
                </Box>
            );
        }

        // For DOCX/DOC
        if (['docx', 'doc'].includes(ext) || doc.mime_type?.includes('word')) {
            return (
                <Box key={index} sx={{ width: '120px', textAlign: 'center', cursor: 'pointer' }} onClick={() => window.open(fileUrl, '_blank')}>
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
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>
                        {doc.file_name || `Word ${index + 1}`}
                    </Typography>
                </Box>
            );
        }

        // For other file types
        return (
            <Box key={index} sx={{ width: '120px', textAlign: 'center', cursor: 'pointer' }} onClick={() => window.open(fileUrl, '_blank')}>
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
                <Typography variant="caption" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>
                    {doc.file_name || `File ${index + 1}`}
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
                {media && media.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', py: 2 }}>{media.map((doc, index) => renderDocument(doc, index))}</Box>
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

export default ViewDocumentsModal;
