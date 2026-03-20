import React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';
import POSLayout from '@/components/POSLayout';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import { routeNameForContext } from '@/lib/utils';

export default function PrinterTest({ restaurant = null, kitchens = [], setupError = null }) {
    const [discoveredPrinters, setDiscoveredPrinters] = React.useState([]);
    const [scanLoading, setScanLoading] = React.useState(false);
    const [kitchenRows, setKitchenRows] = React.useState(
        (kitchens || []).map((row) => ({
            ...row,
            printer_ip: row.printer_ip || '',
            printer_port: row.printer_port || 9100,
        }))
    );
    const [receiptPrinter, setReceiptPrinter] = React.useState({
        printer_ip: restaurant?.printer_ip || '',
        printer_port: restaurant?.printer_port || 9100,
    });
    const [manualPrinter, setManualPrinter] = React.useState({
        printer_ip: '',
        printer_port: 9100,
    });
    const [health, setHealth] = React.useState(null);
    const [healthLoading, setHealthLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [workingKitchenId, setWorkingKitchenId] = React.useState(null);
    const [testingReceipt, setTestingReceipt] = React.useState(false);
    const [testingManual, setTestingManual] = React.useState(false);
    const [assignmentTargets, setAssignmentTargets] = React.useState({});
    const [result, setResult] = React.useState(null);

    const setKitchenValue = (kitchenId, key, value) => {
        setKitchenRows((prev) => prev.map((row) => (row.id === kitchenId ? { ...row, [key]: value } : row)));
    };

    const loadHealth = async () => {
        setHealthLoading(true);
        try {
            const response = await axios.get(route(routeNameForContext('print.health')));
            setHealth(response.data);
        } catch (error) {
            setHealth(null);
            setResult({ success: false, message: 'Failed to load print health status.' });
        } finally {
            setHealthLoading(false);
        }
    };

    React.useEffect(() => {
        loadHealth();
    }, []);

    const scanPrinters = async () => {
        setScanLoading(true);
        setResult(null);
        try {
            const response = await axios.get(route(routeNameForContext('printers.discover')));
            const printers = response.data?.printers || [];
            setDiscoveredPrinters(printers);
            setResult({
                success: true,
                message: printers.length ? 'Printer scan completed.' : 'No printers were found on the current network scan.',
            });
        } catch (error) {
            setDiscoveredPrinters([]);
            setResult({
                success: false,
                message: error.response?.data?.message || 'Printer scan failed.',
            });
        } finally {
            setScanLoading(false);
        }
    };

    const saveMappings = async () => {
        setSaving(true);
        setResult(null);
        try {
            await axios.put(route(routeNameForContext('printers.update')), {
                receipt_printer: receiptPrinter,
                kitchens: kitchenRows.map((row) => ({
                    kitchen_id: row.id,
                    printer_ip: row.printer_ip || null,
                    printer_port: Number(row.printer_port) || 9100,
                })),
            });

            setResult({ success: true, message: 'Printer mappings updated successfully.' });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to save printer mappings.',
            });
        } finally {
            setSaving(false);
        }
    };

    const testKitchenPrinter = async (kitchenId) => {
        setWorkingKitchenId(kitchenId);
        setResult(null);
        try {
            const response = await axios.post(route(routeNameForContext('printers.test-kitchen')), {
                kitchen_id: kitchenId,
            });
            setResult({
                success: true,
                message: response.data?.message || 'Kitchen test print sent successfully.',
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Kitchen test print failed.',
            });
        } finally {
            setWorkingKitchenId(null);
        }
    };

    const testReceiptPrinter = async () => {
        setTestingReceipt(true);
        setResult(null);
        try {
            const response = await axios.post(route(routeNameForContext('printers.test-receipt')));
            setResult({
                success: true,
                message: response.data?.message || 'Receipt test print sent successfully.',
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Receipt test print failed.',
            });
        } finally {
            setTestingReceipt(false);
        }
    };

    const testManualPrinter = async () => {
        if (!manualPrinter.printer_ip) {
            setResult({ success: false, message: 'Enter manual printer IP first.' });
            return;
        }

        setTestingManual(true);
        setResult(null);
        try {
            const response = await axios.post(route(routeNameForContext('printer.test')), {
                printer_ip: manualPrinter.printer_ip,
                printer_port: Number(manualPrinter.printer_port) || 9100,
            });
            setResult({
                success: true,
                message: response.data?.message || 'Manual test print sent successfully.',
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Manual test print failed.',
            });
        } finally {
            setTestingManual(false);
        }
    };

    const assignPrinterToKitchen = (printer) => {
        const kitchenId = assignmentTargets[printer.id];
        if (!kitchenId) {
            setResult({ success: false, message: 'Select a kitchen before assigning a printer.' });
            return;
        }

        const kitchenName = kitchenRows.find((row) => row.id === kitchenId)?.name || 'kitchen';

        setKitchenRows((prev) =>
            prev.map((row) =>
                row.id === kitchenId
                    ? { ...row, printer_ip: printer.printer_ip, printer_port: printer.printer_port }
                    : row
            )
        );

        setDiscoveredPrinters((prev) =>
            prev.map((row) =>
                row.id === printer.id
                    ? { ...row, status: 'assigned_to_kitchen', assignment_label: `Assigned to ${kitchenName}` }
                    : row
            )
        );

        setResult({ success: true, message: 'Printer assigned to kitchen. Save mappings to persist it.' });
    };

    const assignPrinterToReceipt = (printer) => {
        setReceiptPrinter({
            printer_ip: printer.printer_ip,
            printer_port: printer.printer_port,
        });

        setDiscoveredPrinters((prev) =>
            prev.map((row) =>
                row.id === printer.id
                    ? { ...row, status: 'assigned_as_receipt', assignment_label: 'Assigned as receipt printer' }
                    : row
            )
        );

        setResult({ success: true, message: 'Printer assigned as receipt printer. Save mappings to persist it.' });
    };

    const testDiscoveredPrinter = async (printer) => {
        setTestingManual(true);
        setResult(null);
        try {
            const response = await axios.post(route(routeNameForContext('printer.test')), {
                printer_ip: printer.printer_ip,
                printer_port: Number(printer.printer_port) || 9100,
            });
            setResult({
                success: true,
                message: response.data?.message || 'Printer test sent successfully.',
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Printer test failed.',
            });
        } finally {
            setTestingManual(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <AppPage
                eyebrow="POS Settings"
                title="Printer Management"
                subtitle="Configure kitchen routing, receipt printing, and print diagnostics from a full-width premium workspace."
                actions={[
                    <Button key="scan" variant="outlined" onClick={scanPrinters} disabled={scanLoading}>
                        {scanLoading ? 'Scanning...' : 'Scan Printers'}
                    </Button>,
                    <Button key="refresh" variant="outlined" onClick={loadHealth} disabled={healthLoading}>
                        {healthLoading ? 'Refreshing...' : 'Refresh Health'}
                    </Button>,
                    <Button key="save" variant="contained" onClick={saveMappings} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Mappings'}
                    </Button>,
                ]}
            >
                {setupError ? (
                    <Alert severity="warning">
                        {setupError}
                    </Alert>
                ) : null}

                {result ? (
                    <Alert severity={result.success ? 'success' : 'error'}>
                        {result.message}
                    </Alert>
                ) : null}

                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Discovered Printers" value={discoveredPrinters.length} accent />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Kitchen Printers" value={kitchenRows.length} tone="light" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Receipt Printer" value={receiptPrinter.printer_ip ? 'Configured' : 'Missing'} tone="light" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Pending Jobs" value={health?.pending_print_jobs ?? '—'} tone="muted" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Failed Jobs" value={health?.failed_print_jobs ?? '—'} tone="light" />
                    </Grid>

                    <Grid item xs={12}>
                        <SurfaceCard
                            title="Discovered Printers"
                            subtitle="Scan the network, then assign a discovered printer to a kitchen or use it as the restaurant receipt printer."
                        >
                            <Stack spacing={1.5}>
                                {discoveredPrinters.length === 0 ? (
                                    <Alert severity="info">
                                        No printers discovered yet. Run Scan Printers to search the current network, or use the advanced manual test below for troubleshooting.
                                    </Alert>
                                ) : null}

                                {discoveredPrinters.map((printer) => (
                                    <Paper key={printer.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
                                        <Grid container spacing={1.5} alignItems="center">
                                            <Grid item xs={12} md={3}>
                                                <Typography sx={{ fontWeight: 700 }}>{printer.label}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {printer.printer_ip}:{printer.printer_port}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <Chip
                                                    label={printer.assignment_label || 'Found but unassigned'}
                                                    color={
                                                        printer.status === 'assigned_to_kitchen'
                                                            ? 'success'
                                                            : printer.status === 'assigned_as_receipt'
                                                                ? 'info'
                                                                : 'default'
                                                    }
                                                    size="small"
                                                    variant={printer.status === 'found' ? 'outlined' : 'filled'}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    select
                                                    size="small"
                                                    fullWidth
                                                    label="Kitchen"
                                                    value={assignmentTargets[printer.id] || ''}
                                                    onChange={(e) =>
                                                        setAssignmentTargets((prev) => ({ ...prev, [printer.id]: Number(e.target.value) }))
                                                    }
                                                >
                                                    {kitchenRows.map((kitchen) => (
                                                        <MenuItem key={kitchen.id} value={kitchen.id}>
                                                            {kitchen.name}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                                    <Button variant="outlined" onClick={() => assignPrinterToKitchen(printer)} disabled={kitchenRows.length === 0}>
                                                        Assign to Kitchen
                                                    </Button>
                                                    <Button variant="outlined" onClick={() => assignPrinterToReceipt(printer)}>
                                                        Assign as Receipt
                                                    </Button>
                                                    <Button variant="contained" onClick={() => testDiscoveredPrinter(printer)} disabled={testingManual}>
                                                        Test
                                                    </Button>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                            </Stack>
                        </SurfaceCard>
                    </Grid>

                    <Grid item xs={12} lg={7}>
                        <SurfaceCard
                            title="Kitchen Printers"
                            subtitle="Configure each kitchen target once and test it directly from the mapped printer profile."
                        >
                            <Stack spacing={1.5}>
                                {kitchenRows.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        No kitchen users found.
                                    </Typography>
                                ) : null}
                                {kitchenRows.map((kitchen) => (
                                    <Paper key={kitchen.id} variant="outlined" sx={{ p: 1.75, borderRadius: 3 }}>
                                        <Grid container spacing={1.5} alignItems="center">
                                            <Grid item xs={12} md={3}>
                                                <Typography sx={{ fontWeight: 700 }}>{kitchen.name}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    label="Printer IP"
                                                    value={kitchen.printer_ip}
                                                    onChange={(e) => setKitchenValue(kitchen.id, 'printer_ip', e.target.value)}
                                                    size="small"
                                                    fullWidth
                                                    placeholder="192.168.1.100"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <TextField
                                                    label="Port"
                                                    type="number"
                                                    value={kitchen.printer_port}
                                                    onChange={(e) => setKitchenValue(kitchen.id, 'printer_port', e.target.value)}
                                                    size="small"
                                                    fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Button
                                                    variant="outlined"
                                                    fullWidth
                                                    onClick={() => testKitchenPrinter(kitchen.id)}
                                                    disabled={workingKitchenId === kitchen.id}
                                                >
                                                    {workingKitchenId === kitchen.id ? <CircularProgress size={18} /> : 'Test Kitchen'}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                            </Stack>
                        </SurfaceCard>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <Stack spacing={2.25}>
                            <SurfaceCard
                                title="Restaurant Receipt Printer"
                                subtitle={restaurant?.name || 'Active restaurant'}
                            >
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} sm={7}>
                                        <TextField
                                            label="Printer IP"
                                            value={receiptPrinter.printer_ip}
                                            onChange={(e) => setReceiptPrinter((prev) => ({ ...prev, printer_ip: e.target.value }))}
                                            size="small"
                                            fullWidth
                                            placeholder="192.168.1.100"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            label="Port"
                                            type="number"
                                            value={receiptPrinter.printer_port}
                                            onChange={(e) => setReceiptPrinter((prev) => ({ ...prev, printer_port: e.target.value }))}
                                            size="small"
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button variant="outlined" onClick={testReceiptPrinter} disabled={testingReceipt}>
                                            {testingReceipt ? <CircularProgress size={18} /> : 'Test Receipt Printer'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </SurfaceCard>

                            <SurfaceCard
                                title="Print Health"
                                subtitle="Live operational status for the configured print queue and worker path."
                            >
                                {!health ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Health data unavailable.
                                    </Typography>
                                ) : (
                                    <Stack spacing={0.9}>
                                        <Typography variant="body2"><strong>Queue Driver:</strong> {health.queue_driver}</Typography>
                                        <Typography variant="body2"><strong>Queue:</strong> {health.queue_name}</Typography>
                                        <Typography variant="body2"><strong>Worker:</strong> {health.worker_online ? 'Online' : 'Offline'}</Typography>
                                        <Typography variant="body2"><strong>Pending Jobs:</strong> {health.pending_print_jobs}</Typography>
                                        <Typography variant="body2"><strong>Failed Jobs:</strong> {health.failed_print_jobs}</Typography>
                                    </Stack>
                                )}
                            </SurfaceCard>

                            <SurfaceCard
                                title="Manual Debug Test"
                                subtitle="Keep direct IP testing available for troubleshooting without making it the default setup path."
                            >
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} sm={7}>
                                        <TextField
                                            label="Printer IP"
                                            value={manualPrinter.printer_ip}
                                            onChange={(e) => setManualPrinter((prev) => ({ ...prev, printer_ip: e.target.value }))}
                                            size="small"
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            label="Port"
                                            type="number"
                                            value={manualPrinter.printer_port}
                                            onChange={(e) => setManualPrinter((prev) => ({ ...prev, printer_port: e.target.value }))}
                                            size="small"
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button variant="outlined" onClick={testManualPrinter} disabled={testingManual}>
                                            {testingManual ? <CircularProgress size={18} /> : 'Manual Test Print'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </SurfaceCard>
                        </Stack>
                    </Grid>
                </Grid>
            </AppPage>
        </Box>
    );
}

PrinterTest.layout = (page) => <POSLayout>{page}</POSLayout>;
