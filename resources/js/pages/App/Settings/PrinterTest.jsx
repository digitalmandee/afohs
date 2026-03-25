import React from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    MenuItem,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';
import POSLayout from '@/components/POSLayout';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import StatCard from '@/components/App/ui/StatCard';
import { routeNameForContext } from '@/lib/utils';

const emptyProfileForm = {
    id: null,
    name: '',
    printer_ip: '',
    printer_port: 9100,
    notes: '',
    is_active: true,
};

const emptyRangeForm = {
    id: null,
    label: '',
    range_value: '',
    range_type: 'cidr',
    port: 9100,
    notes: '',
    is_active: true,
};

export default function PrinterTest({ restaurant = null, kitchens = [], profiles = [], scanRanges = [], setupError = null }) {
    const [savedProfiles, setSavedProfiles] = React.useState(profiles || []);
    const [savedScanRanges, setSavedScanRanges] = React.useState(scanRanges || []);
    const [discoveredPrinters, setDiscoveredPrinters] = React.useState([]);
    const [scanSummary, setScanSummary] = React.useState(null);
    const [scanRangeResults, setScanRangeResults] = React.useState([]);
    const [scanLoading, setScanLoading] = React.useState(false);
    const [profileSaving, setProfileSaving] = React.useState(false);
    const [rangeSaving, setRangeSaving] = React.useState(false);
    const [savingAssignments, setSavingAssignments] = React.useState(false);
    const [testingProfileId, setTestingProfileId] = React.useState(null);
    const [workingKitchenId, setWorkingKitchenId] = React.useState(null);
    const [testingReceipt, setTestingReceipt] = React.useState(false);
    const [testingManual, setTestingManual] = React.useState(false);
    const [result, setResult] = React.useState(null);
    const [health, setHealth] = React.useState(null);
    const [healthLoading, setHealthLoading] = React.useState(false);
    const [profileForm, setProfileForm] = React.useState(emptyProfileForm);
    const [rangeForm, setRangeForm] = React.useState(emptyRangeForm);
    const [receiptPrinter, setReceiptPrinter] = React.useState({
        printer_profile_id: restaurant?.printer_profile_id || '',
    });
    const [kitchenRows, setKitchenRows] = React.useState(
        (kitchens || []).map((row) => ({
            id: row.id,
            name: row.name,
            printer_profile_id: row.printer_profile_id || '',
        }))
    );
    const [manualPrinter, setManualPrinter] = React.useState({
        printer_ip: '',
        printer_port: 9100,
    });

    const activeProfiles = React.useMemo(
        () => savedProfiles.filter((profile) => profile.is_active),
        [savedProfiles]
    );

    const setKitchenProfile = (kitchenId, profileId) => {
        setKitchenRows((prev) =>
            prev.map((row) => (row.id === kitchenId ? { ...row, printer_profile_id: profileId } : row))
        );
    };

    const resetProfileForm = () => {
        setProfileForm(emptyProfileForm);
    };

    const resetRangeForm = () => {
        setRangeForm(emptyRangeForm);
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
            const printers = (response.data?.printers || []).filter((printer) => printer.source === 'network_scan');
            setDiscoveredPrinters(printers);
            setScanRangeResults(response.data?.scan_ranges || []);
            setScanSummary(response.data?.summary || null);
            setResult({
                success: true,
                message: printers.length
                    ? 'Network printer scan completed.'
                    : 'Scan completed but found no network printers on the scanned ranges.',
            });
        } catch (error) {
            setDiscoveredPrinters([]);
            setScanRangeResults([]);
            setScanSummary(null);
            setResult({
                success: false,
                message: error.response?.data?.message || 'Printer scan failed.',
            });
        } finally {
            setScanLoading(false);
        }
    };

    const saveProfile = async () => {
        if (!profileForm.name || !profileForm.printer_ip) {
            setResult({ success: false, message: 'Profile name and printer IP are required.' });
            return;
        }

        setProfileSaving(true);
        setResult(null);
        try {
            const endpoint = profileForm.id
                ? route(routeNameForContext('printers.profiles.update'), { printerProfile: profileForm.id })
                : route(routeNameForContext('printers.profiles.store'));
            const method = profileForm.id ? 'put' : 'post';

            const response = await axios[method](endpoint, {
                name: profileForm.name,
                printer_ip: profileForm.printer_ip,
                printer_port: Number(profileForm.printer_port) || 9100,
                notes: profileForm.notes || null,
                is_active: !!profileForm.is_active,
            });

            const profile = response.data?.profile;
            setSavedProfiles((prev) => {
                const next = prev.filter((item) => item.id !== profile.id);
                next.push(profile);
                return next.sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name));
            });
            resetProfileForm();
            setResult({
                success: true,
                message: profileForm.id ? 'Printer profile updated.' : 'Printer profile created.',
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to save printer profile.',
            });
        } finally {
            setProfileSaving(false);
        }
    };

    const editProfile = (profile) => {
        setProfileForm({
            id: profile.id,
            name: profile.name || '',
            printer_ip: profile.printer_ip || '',
            printer_port: profile.printer_port || 9100,
            notes: profile.notes || '',
            is_active: !!profile.is_active,
        });
    };

    const saveScanRange = async () => {
        if (!rangeForm.label || !rangeForm.range_value) {
            setResult({ success: false, message: 'Range label and range value are required.' });
            return;
        }

        setRangeSaving(true);
        setResult(null);
        try {
            const endpoint = rangeForm.id
                ? route(routeNameForContext('printers.scan-ranges.update'), { printerScanRange: rangeForm.id })
                : route(routeNameForContext('printers.scan-ranges.store'));
            const method = rangeForm.id ? 'put' : 'post';

            const response = await axios[method](endpoint, {
                label: rangeForm.label,
                range_value: rangeForm.range_value,
                range_type: rangeForm.range_type,
                port: Number(rangeForm.port) || 9100,
                notes: rangeForm.notes || null,
                is_active: !!rangeForm.is_active,
            });

            const scanRange = response.data?.scan_range;
            setSavedScanRanges((prev) => {
                const next = prev.filter((item) => item.id !== scanRange.id);
                next.push(scanRange);
                return next.sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.label.localeCompare(b.label));
            });
            resetRangeForm();
            setResult({
                success: true,
                message: rangeForm.id ? 'Scan range updated.' : 'Scan range created.',
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to save scan range.',
            });
        } finally {
            setRangeSaving(false);
        }
    };

    const editScanRange = (scanRange) => {
        setRangeForm({
            id: scanRange.id,
            label: scanRange.label || '',
            range_value: scanRange.range_value || '',
            range_type: scanRange.range_type || 'cidr',
            port: scanRange.port || 9100,
            notes: scanRange.notes || '',
            is_active: !!scanRange.is_active,
        });
    };

    const deleteProfile = async (profileId) => {
        setResult(null);
        try {
            await axios.delete(route(routeNameForContext('printers.profiles.destroy'), { printerProfile: profileId }));
            setSavedProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
            setReceiptPrinter((prev) => (Number(prev.printer_profile_id) === profileId ? { printer_profile_id: '' } : prev));
            setKitchenRows((prev) =>
                prev.map((row) => (Number(row.printer_profile_id) === profileId ? { ...row, printer_profile_id: '' } : row))
            );
            if (profileForm.id === profileId) {
                resetProfileForm();
            }
            setResult({ success: true, message: 'Printer profile deleted.' });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to delete printer profile.',
            });
        }
    };

    const deleteScanRange = async (scanRangeId) => {
        setResult(null);
        try {
            await axios.delete(route(routeNameForContext('printers.scan-ranges.destroy'), { printerScanRange: scanRangeId }));
            setSavedScanRanges((prev) => prev.filter((scanRange) => scanRange.id !== scanRangeId));
            if (rangeForm.id === scanRangeId) {
                resetRangeForm();
            }
            setResult({ success: true, message: 'Scan range deleted.' });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to delete scan range.',
            });
        }
    };

    const createProfileFromScan = (printer) => {
        setProfileForm({
            id: null,
            name: printer.label || `Network Printer ${printer.printer_ip}`,
            printer_ip: printer.printer_ip || '',
            printer_port: printer.printer_port || 9100,
            notes: '',
            is_active: true,
        });
        setResult({ success: true, message: 'Scanned printer details loaded into the profile form.' });
    };

    const saveMappings = async () => {
        setSavingAssignments(true);
        setResult(null);
        try {
            await axios.put(route(routeNameForContext('printers.update')), {
                receipt_printer: {
                    printer_profile_id: receiptPrinter.printer_profile_id || null,
                },
                kitchens: kitchenRows.map((row) => ({
                    kitchen_id: row.id,
                    printer_profile_id: row.printer_profile_id || null,
                })),
            });

            setResult({ success: true, message: 'Printer assignments updated successfully.' });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to save printer assignments.',
            });
        } finally {
            setSavingAssignments(false);
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

    const testProfile = async (profile) => {
        setTestingProfileId(profile.id);
        setResult(null);
        try {
            const response = await axios.post(route(routeNameForContext('printer.test')), {
                printer_ip: profile.printer_ip,
                printer_port: Number(profile.printer_port) || 9100,
            });
            setResult({
                success: true,
                message: response.data?.message || 'Profile test print sent successfully.',
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Profile test print failed.',
            });
        } finally {
            setTestingProfileId(null);
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

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <AppPage
                eyebrow="POS Settings"
                title="Printer Management"
                subtitle="Create saved network printer profiles once, assign them to receipt or kitchen routing, and let the print queue keep retrying until devices come back online."
                actions={[
                    <Button key="scan" variant="outlined" onClick={scanPrinters} disabled={scanLoading}>
                        {scanLoading ? 'Scanning...' : 'Scan Network'}
                    </Button>,
                    <Button key="refresh" variant="outlined" onClick={loadHealth} disabled={healthLoading}>
                        {healthLoading ? 'Refreshing...' : 'Refresh Health'}
                    </Button>,
                    <Button key="save" variant="contained" onClick={saveMappings} disabled={savingAssignments}>
                        {savingAssignments ? 'Saving...' : 'Save Assignments'}
                    </Button>,
                ]}
            >
                {setupError ? <Alert severity="warning">{setupError}</Alert> : null}
                {result ? <Alert severity={result.success ? 'success' : 'error'}>{result.message}</Alert> : null}

                <Grid container spacing={2.25}>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Saved Profiles" value={savedProfiles.length} accent />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Active Profiles" value={activeProfiles.length} tone="light" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Pending Jobs" value={health?.pending_print_jobs ?? '—'} tone="muted" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Failed Jobs" value={health?.failed_print_jobs ?? '—'} tone="light" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <StatCard label="Scan Ranges" value={savedScanRanges.length} tone="muted" />
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <SurfaceCard
                            title={profileForm.id ? 'Edit Printer Profile' : 'Create Printer Profile'}
                            subtitle="Profiles are the primary setup path. Save a network printer once, then assign it wherever you need it."
                        >
                            <Stack spacing={1.5}>
                                <TextField
                                    label="Profile Name"
                                    size="small"
                                    fullWidth
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                                />
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} sm={7}>
                                        <TextField
                                            label="Printer IP"
                                            size="small"
                                            fullWidth
                                            value={profileForm.printer_ip}
                                            onChange={(e) => setProfileForm((prev) => ({ ...prev, printer_ip: e.target.value }))}
                                            placeholder="192.168.1.100"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            label="Port"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={profileForm.printer_port}
                                            onChange={(e) => setProfileForm((prev) => ({ ...prev, printer_port: e.target.value }))}
                                        />
                                    </Grid>
                                </Grid>
                                <TextField
                                    label="Notes"
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    value={profileForm.notes}
                                    onChange={(e) => setProfileForm((prev) => ({ ...prev, notes: e.target.value }))}
                                />
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Switch
                                        checked={!!profileForm.is_active}
                                        onChange={(e) => setProfileForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                                    />
                                    <Typography variant="body2">Active profile</Typography>
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    <Button variant="contained" onClick={saveProfile} disabled={profileSaving}>
                                        {profileSaving ? 'Saving...' : profileForm.id ? 'Update Profile' : 'Create Profile'}
                                    </Button>
                                    {profileForm.id ? (
                                        <Button variant="outlined" onClick={resetProfileForm}>
                                            Cancel Edit
                                        </Button>
                                    ) : null}
                                </Stack>
                            </Stack>
                        </SurfaceCard>
                    </Grid>

                    <Grid item xs={12} lg={7}>
                        <SurfaceCard
                            title={rangeForm.id ? 'Edit Scan Range' : 'Add Scan Range'}
                            subtitle="Local scan stays automatic. Add printer VLANs or remote subnets here so discovery checks them too."
                        >
                            <Stack spacing={1.5}>
                                <TextField
                                    label="Range Label"
                                    size="small"
                                    fullWidth
                                    value={rangeForm.label}
                                    onChange={(e) => setRangeForm((prev) => ({ ...prev, label: e.target.value }))}
                                />
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            select
                                            label="Range Type"
                                            size="small"
                                            fullWidth
                                            value={rangeForm.range_type}
                                            onChange={(e) => setRangeForm((prev) => ({ ...prev, range_type: e.target.value }))}
                                        >
                                            <MenuItem value="cidr">CIDR</MenuItem>
                                            <MenuItem value="range">IP Range</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            label={rangeForm.range_type === 'cidr' ? 'CIDR Range' : 'IP Range'}
                                            size="small"
                                            fullWidth
                                            value={rangeForm.range_value}
                                            onChange={(e) => setRangeForm((prev) => ({ ...prev, range_value: e.target.value }))}
                                            placeholder={rangeForm.range_type === 'cidr' ? '192.168.50.0/24' : '192.168.50.20-192.168.50.80'}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            label="Port"
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={rangeForm.port}
                                            onChange={(e) => setRangeForm((prev) => ({ ...prev, port: e.target.value }))}
                                        />
                                    </Grid>
                                </Grid>
                                <TextField
                                    label="Notes"
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    value={rangeForm.notes}
                                    onChange={(e) => setRangeForm((prev) => ({ ...prev, notes: e.target.value }))}
                                />
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Switch
                                        checked={!!rangeForm.is_active}
                                        onChange={(e) => setRangeForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                                    />
                                    <Typography variant="body2">Active scan range</Typography>
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    <Button variant="contained" onClick={saveScanRange} disabled={rangeSaving}>
                                        {rangeSaving ? 'Saving...' : rangeForm.id ? 'Update Range' : 'Add Range'}
                                    </Button>
                                    {rangeForm.id ? (
                                        <Button variant="outlined" onClick={resetRangeForm}>
                                            Cancel Edit
                                        </Button>
                                    ) : null}
                                </Stack>
                            </Stack>
                        </SurfaceCard>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <SurfaceCard
                            title="Saved Scan Ranges"
                            subtitle="Discovery checks the local subnet automatically, then these active extra ranges."
                        >
                            <Stack spacing={1.25}>
                                {savedScanRanges.length === 0 ? (
                                    <Alert severity="info">
                                        No extra scan ranges saved yet. Add the printer VLAN or remote subnet here so scan can reach it.
                                    </Alert>
                                ) : null}
                                {savedScanRanges.map((scanRange) => (
                                    <Paper key={scanRange.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                                        <Grid container spacing={1.5} alignItems="center">
                                            <Grid item xs={12} md={5}>
                                                <Typography sx={{ fontWeight: 700 }}>{scanRange.label}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {scanRange.range_value} on port {scanRange.port}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {scanRange.notes || (scanRange.is_active ? 'Active saved range.' : 'Inactive saved range.')}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                                    <Button variant="outlined" onClick={() => editScanRange(scanRange)}>
                                                        Edit
                                                    </Button>
                                                    <Button color="error" variant="outlined" onClick={() => deleteScanRange(scanRange.id)}>
                                                        Delete
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
                            title="Saved Network Printer Profiles"
                            subtitle="These profiles stay assigned until you explicitly edit them. Discovery is just a helper to prefill profile details."
                        >
                            <Stack spacing={1.25}>
                                {savedProfiles.length === 0 ? (
                                    <Alert severity="info">
                                        No printer profiles saved yet. Create one manually or scan the network and turn a discovered printer into a saved profile.
                                    </Alert>
                                ) : null}
                                {savedProfiles.map((profile) => (
                                    <Paper key={profile.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                                        <Grid container spacing={1.5} alignItems="center">
                                            <Grid item xs={12} md={4}>
                                                <Typography sx={{ fontWeight: 700 }}>{profile.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {profile.printer_ip}:{profile.printer_port}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {profile.notes || (profile.is_active ? 'Active network printer profile.' : 'Inactive profile.')}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={5}>
                                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                                    <Button variant="outlined" onClick={() => editProfile(profile)}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => testProfile(profile)}
                                                        disabled={testingProfileId === profile.id}
                                                    >
                                                        {testingProfileId === profile.id ? <CircularProgress size={18} /> : 'Test'}
                                                    </Button>
                                                    <Button color="error" variant="outlined" onClick={() => deleteProfile(profile.id)}>
                                                        Delete
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
                            title="Kitchen KOT Assignments"
                            subtitle="Each kitchen selects from the same saved profile pool. Assign once and the mapping stays saved until you edit it."
                        >
                            <Stack spacing={1.5}>
                                {kitchenRows.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        No kitchen users found.
                                    </Typography>
                                ) : null}
                                {kitchenRows.map((kitchen) => (
                                    <Paper key={kitchen.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                                        <Grid container spacing={1.5} alignItems="center">
                                            <Grid item xs={12} md={4}>
                                                <Typography sx={{ fontWeight: 700 }}>{kitchen.name}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={5}>
                                                <TextField
                                                    select
                                                    label="Assigned Profile"
                                                    size="small"
                                                    fullWidth
                                                    value={kitchen.printer_profile_id}
                                                    onChange={(e) => setKitchenProfile(kitchen.id, e.target.value)}
                                                >
                                                    <MenuItem value="">No Profile</MenuItem>
                                                    {savedProfiles.map((profile) => (
                                                        <MenuItem key={profile.id} value={profile.id}>
                                                            {profile.name} ({profile.printer_ip}:{profile.printer_port})
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
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
                                title="Restaurant Receipt Assignment"
                                subtitle={restaurant?.name || 'Active restaurant'}
                            >
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12}>
                                        <TextField
                                            select
                                            label="Assigned Receipt Profile"
                                            size="small"
                                            fullWidth
                                            value={receiptPrinter.printer_profile_id}
                                            onChange={(e) => setReceiptPrinter({ printer_profile_id: e.target.value })}
                                        >
                                            <MenuItem value="">No Profile</MenuItem>
                                            {savedProfiles.map((profile) => (
                                                <MenuItem key={profile.id} value={profile.id}>
                                                    {profile.name} ({profile.printer_ip}:{profile.printer_port})
                                                </MenuItem>
                                            ))}
                                        </TextField>
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
                                subtitle="KOT jobs remain queued and retry in the background until the assigned network printer comes back online."
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
                        </Stack>
                    </Grid>

                    <Grid item xs={12} lg={7}>
                        <SurfaceCard
                            title="Network Scan Helper"
                            subtitle="Scan checks the auto local subnet and any saved extra ranges, then lets you turn results into stable profiles."
                        >
                            <Stack spacing={1.5}>
                                {scanSummary ? (
                                    <Alert severity={discoveredPrinters.length > 0 ? 'success' : 'info'}>
                                        Scanned {scanSummary.ranges_scanned} range{scanSummary.ranges_scanned === 1 ? '' : 's'} and found {scanSummary.printers_found} printer{scanSummary.printers_found === 1 ? '' : 's'} in {scanSummary.duration_ms} ms.
                                    </Alert>
                                ) : null}
                                {scanRangeResults.length > 0 ? (
                                    <Stack spacing={1}>
                                        {scanRangeResults.map((scanRange) => (
                                            <Paper key={scanRange.id} variant="outlined" sx={{ p: 1.25, borderRadius: 3 }}>
                                                <Typography sx={{ fontWeight: 700 }}>{scanRange.label}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {scanRange.range_value} · {scanRange.found_count} found · {scanRange.scanned_hosts} hosts scanned · {scanRange.duration_ms} ms
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {scanRange.message}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : null}
                                {discoveredPrinters.length === 0 ? (
                                    <Alert severity="info">
                                        No scanned network printers yet. Run Scan Network to check the local subnet and any saved extra ranges.
                                    </Alert>
                                ) : null}
                                {discoveredPrinters.map((printer) => (
                                    <Paper key={printer.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                                        <Grid container spacing={1.5} alignItems="center">
                                            <Grid item xs={12} md={5}>
                                                <Typography sx={{ fontWeight: 700 }}>{printer.label}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {printer.printer_ip}:{printer.printer_port}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Found on {printer.range_label || printer.range_value || 'scanned range'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {printer.assignment_label || 'Unassigned network printer candidate'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                                    <Button variant="outlined" onClick={() => createProfileFromScan(printer)}>
                                                        Create Profile
                                                    </Button>
                                                    <Button variant="contained" onClick={() => testProfile(printer)}>
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

                    <Grid item xs={12} lg={5}>
                        <SurfaceCard
                            title="Manual Debug Test"
                            subtitle="Keep direct IP testing available for troubleshooting without turning it into the main setup path."
                        >
                            <Grid container spacing={1.5}>
                                <Grid item xs={12} sm={7}>
                                    <TextField
                                        label="Printer IP"
                                        size="small"
                                        fullWidth
                                        value={manualPrinter.printer_ip}
                                        onChange={(e) => setManualPrinter((prev) => ({ ...prev, printer_ip: e.target.value }))}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        label="Port"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={manualPrinter.printer_port}
                                        onChange={(e) => setManualPrinter((prev) => ({ ...prev, printer_port: e.target.value }))}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button variant="outlined" onClick={testManualPrinter} disabled={testingManual}>
                                        {testingManual ? <CircularProgress size={18} /> : 'Manual Test Print'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </SurfaceCard>
                    </Grid>
                </Grid>
            </AppPage>
        </Box>
    );
}

PrinterTest.layout = (page) => <POSLayout>{page}</POSLayout>;
