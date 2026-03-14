import React, { useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { Print, CheckCircle, Error } from '@mui/icons-material';
import axios from 'axios';
import POSLayout from "@/components/POSLayout";
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

export default function PrinterTest() {
    const [printerIp, setPrinterIp] = useState('');
    const [printerPort, setPrinterPort] = useState('9100');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    // const [open, setOpen] = useState(true);

    const handleTestPrint = async () => {
        if (!printerIp) {
            setResult({ success: false, message: 'Please enter a printer IP address.' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await axios.post(route(routeNameForContext('printer.test')), {
                printer_ip: printerIp,
                printer_port: parseInt(printerPort) || 9100,
            });
            setResult(response.data);
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Connection failed. Check IP and network.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <Box
                sx={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}> */}
            <Box sx={{
                minHeight: '100vh',
                bgcolor: '#f5f5f5',
                p: 2
            }}>
                <Typography sx={{ mb: 3, fontWeight: '600', fontSize: '30px', color: '#063455' }}>
                    🖨️ Printer Test
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                    <Card elevation={3} sx={{ maxWidth: '600px' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Test Thermal Printer Connection
                            </Typography>

                            <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Instructions:</strong>
                                    <br />
                                    1. Connect the printer to the same network (LAN) as this computer.
                                    <br />
                                    2. Find the printer's IP address (usually printed on self-test page).
                                    <br />
                                    3. Enter the IP below and click "Test Print".
                                </Typography>
                            </Paper>

                            <TextField label="Printer IP Address" placeholder="e.g. 192.168.1.100" value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} fullWidth sx={{ mb: 2 }} />

                            <TextField label="Port (Default: 9100)" placeholder="9100" value={printerPort} onChange={(e) => setPrinterPort(e.target.value)} fullWidth sx={{ mb: 3 }} type="number" />

                            <Button variant="contained" color="primary" size="large" fullWidth onClick={handleTestPrint} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Print />}>
                                {loading ? 'Sending Test Print...' : 'Test Print'}
                            </Button>

                            {result && (
                                <Alert severity={result.success ? 'success' : 'error'} icon={result.success ? <CheckCircle /> : <Error />} sx={{ mt: 3 }}>
                                    {result.message}
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </Box>
            {/* </Box> */}
        </>
    );
}

PrinterTest.layout = (page) => <POSLayout>{page}</POSLayout>;
