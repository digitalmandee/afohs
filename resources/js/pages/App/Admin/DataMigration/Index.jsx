import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, Typography, Button, LinearProgress, Box, Grid, Alert, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Chip, Divider, CircularProgress, TextField, MenuItem } from '@mui/material';
import { PlayArrow, Stop, Refresh, CheckCircle, Error, Warning, Assessment, Storage, People, FamilyRestroom, Image, DeleteSweep, PhotoCamera, Receipt } from '@mui/icons-material';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

const DataMigrationIndex = ({ stats: initialStats }) => {
    const [stats, setStats] = useState(initialStats);
    const [migrationStatus, setMigrationStatus] = useState({
        members: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        families: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        media: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        invoices: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        media_photos: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        customers: { running: false, progress: 0, total: 0, migrated: 0, errors: [] }, // Add customers state
        employees: { running: false, progress: 0, total: 0, migrated: 0, errors: [] }, // Add employees state
        corporate_members: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        corporate_families: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        qr_codes: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        transaction_types: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        subscription_types: { running: false, progress: 0, total: 0, migrated: 0, errors: [] }, // Add subscription_types state
        corporate_qr_codes: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
        financials: { running: false, progress: 0, total: 0, migrated: 0, errors: [] }, // Add financials state
        deep_migration: { running: false, progress: 0, total: 0, migrated: 0, errors: [] }, // Deep migration state
        departments: { running: false, progress: 0, total: 0, migrated: 0, errors: [] }, // Add departments state
        fnb: { running: false, progress: 0, total: 0, migrated: 0, errors: [] }, // FNB state
    });
    const [transactionTypes, setTransactionTypes] = useState([]);
    const [selectedTransactionType, setSelectedTransactionType] = useState('');
    const [pendingTxCount, setPendingTxCount] = useState(0);
    const [validationDialog, setValidationDialog] = useState(false);
    const [validationResults, setValidationResults] = useState(null);
    const [resetDialog, setResetDialog] = useState(false);
    const [resetFamiliesDialog, setResetFamiliesDialog] = useState(false);
    const [deletePhotosDialog, setDeletePhotosDialog] = useState(false);
    const [cleanupDuplicatesDialog, setCleanupDuplicatesDialog] = useState(false);
    const [globalMigrationStats, setGlobalMigrationStats] = useState({ migrated: 0, distinct_total: 0, remaining: 0 });
    const [deleteLegacyInvoicesDialog, setDeleteLegacyInvoicesDialog] = useState(false);
    const migrationRunning = useRef({ members: false, families: false, media: false, media_photos: false, invoices: false, customers: false, employees: false, corporate_members: false, corporate_families: false, qr_codes: false, corporate_qr_codes: false, financials: false, departments: false, fnb: false });

    useEffect(() => {
        refreshStats();
        fetchTransactionTypes();
        // Initial fetch of pending invoices (optional, could be part of stats)
    }, []);

    const fetchTransactionTypes = async () => {
        try {
            const response = await axios.get('/admin/data-migration/old-transaction-types');
            setTransactionTypes(response.data);
        } catch (error) {
            console.error('Error fetching transaction types:', error);
        }
    };

    // Removed handleTypeChange as we are going global

    const startDeepMigration = async () => {
        migrationRunning.current.deep_migration = true;
        setMigrationStatus((prev) => ({
            ...prev,
            deep_migration: { ...prev.deep_migration, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processDeepMigrationBatch(0);
    };

    const processDeepMigrationBatch = async (offset) => {
        try {
            const batchSize = 50;
            // Use the new Global Route
            const response = await axios.post('/admin/data-migration/migrate-invoices-global', {
                batch_size: batchSize,
            });

            const { migrated, success, errors, has_more, remaining } = response.data;

            // Calculate total based on migrated + remaining
            // We store this in a ref or state because 'total' changes as we migrate?
            // Actually, we can just use "migrated + remaining" as the dynamic total.
            const currentTotal = (globalMigrationStats.migrated || 0) + (remaining || 0) + (migrated || 0);

            setGlobalMigrationStats((prev) => ({
                migrated: (prev.migrated || 0) + migrated,
                remaining: remaining,
            }));

            setMigrationStatus((prev) => {
                const newMigrated = prev.deep_migration.migrated + (migrated || 0);
                // Estimate progress: The backend returns "remaining".
                // Progress = 100 * (Total - Remaining) / Total?
                // Or just trust the loop.
                // Let's use has_more to keep running, and a simple progress bar if we knew the start total.
                // For now, let's just increment migrated count.
                return {
                    ...prev,
                    deep_migration: {
                        ...prev.deep_migration,
                        migrated: newMigrated,
                        errors: [...prev.deep_migration.errors, ...(errors || [])],
                        // If we really want a progress bar, we need the initial count of unmigrated invoices.
                        // But for now, just showing activity is improved.
                        progress: has_more ? 50 : 100,
                    },
                };
            });

            if (has_more && migrationRunning.current.deep_migration) {
                setTimeout(() => {
                    processDeepMigrationBatch(0); // Offset is irrelevant now as we query "migrated IS NULL"
                }, 500);
            } else {
                migrationRunning.current.deep_migration = false;
                setMigrationStatus((prev) => ({
                    ...prev,
                    deep_migration: { ...prev.deep_migration, running: false, progress: 100 },
                }));
                refreshStats();
            }
        } catch (error) {
            console.error('Error in deep migration:', error);
            migrationRunning.current.deep_migration = false;
            setMigrationStatus((prev) => ({
                ...prev,
                deep_migration: {
                    ...prev.deep_migration,
                    running: false,
                    errors: [...prev.deep_migration.errors, { error: error.response?.data?.error || error.message }],
                },
            }));
        }
    };

    const deleteLegacyInvoices = async () => {
        try {
            setMigrationStatus((prev) => ({ ...prev, invoices: { ...prev.invoices, running: true } }));
            const response = await axios.post(route('data-migration.delete-legacy-invoices'));
            alert(response.data.message);
            refreshStats();
        } catch (error) {
            console.error('Error deleting legacy invoices:', error);
            alert('Error deleting legacy invoices: ' + (error.response?.data?.error || error.message));
        } finally {
            setMigrationStatus((prev) => ({ ...prev, invoices: { ...prev.invoices, running: false } }));
            setDeleteLegacyInvoicesDialog(false);
        }
    };

    const refreshStats = async () => {
        try {
            const response = await axios.get('/admin/data-migration/stats');
            setStats(response.data);
            // We could also ask for "pending invoices" global count here if we updated the API
        } catch (error) {
            console.error('Error refreshing stats:', error);
        }
    };

    const startMembersMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.members = true;
        setMigrationStatus((prev) => ({
            ...prev,
            members: { ...prev.members, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('members', 0);
    };

    const startFamiliesMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.families = true;
        setMigrationStatus((prev) => ({
            ...prev,
            families: { ...prev.families, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('families', 0);
    };

    const startMediaMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.media = true;
        setMigrationStatus((prev) => ({
            ...prev,
            media: { ...prev.media, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('media', 0);
    };

    const startMediaPhotosMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.media_photos = true;
        setMigrationStatus((prev) => ({
            ...prev,
            media_photos: { ...prev.media_photos, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('media_photos', 0);
    };

    const startQrCodeGeneration = async () => {
        if (stats.pending_qr_codes_count === 0) {
            alert('No pending QR codes to generate');
            return;
        }

        migrationRunning.current.qr_codes = true;
        setMigrationStatus((prev) => ({
            ...prev,
            qr_codes: { ...prev.qr_codes, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('qr_codes', 0);
    };

    const startCorporateQrCodeGeneration = async () => {
        if (stats.pending_corporate_qr_codes_count === 0) {
            alert('No pending Corporate QR codes to generate');
            return;
        }

        migrationRunning.current.corporate_qr_codes = true;
        setMigrationStatus((prev) => ({
            ...prev,
            corporate_qr_codes: { ...prev.corporate_qr_codes, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('corporate_qr_codes', 0);
    };

    const startInvoicesMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.invoices = true;
        setMigrationStatus((prev) => ({
            ...prev,
            invoices: { ...prev.invoices, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('invoices', 0);
    };

    const startGenericMigration = async (type) => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current[type] = true;
        setMigrationStatus((prev) => ({
            ...prev,
            [type]: { ...prev[type], running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch(type, 0);
    };

    const startCustomersMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.customers = true;
        setMigrationStatus((prev) => ({
            ...prev,
            customers: { ...prev.customers, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('customers', 0);
    };

    const startEmployeesMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.employees = true;
        setMigrationStatus((prev) => ({
            ...prev,
            employees: { ...prev.employees, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('employees', 0);
    };

    const startCorporateMembersMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.corporate_members = true;
        setMigrationStatus((prev) => ({
            ...prev,
            corporate_members: { ...prev.corporate_members, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('corporate_members', 0);
    };

    const startCorporateFamiliesMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.corporate_families = true;
        setMigrationStatus((prev) => ({
            ...prev,
            corporate_families: { ...prev.corporate_families, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('corporate_families', 0);
    };

    const startDepartmentsMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.departments = true;
        setMigrationStatus((prev) => ({
            ...prev,
            departments: { ...prev.departments, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        await processMigrationBatch('departments', 0);
    };

    const startFnBMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }

        migrationRunning.current.fnb = true;
        setMigrationStatus((prev) => ({
            ...prev,
            fnb: { ...prev.fnb, running: true, progress: 0, migrated: 0, errors: [] },
        }));

        try {
            const response = await axios.post('/admin/data-migration/migrate-fnb');
            const { results, success, error } = response.data;

            if (success) {
                setStats((prev) => ({
                    ...prev,
                    // Update stats if we had fnb specific stats in the response
                }));
                setMigrationStatus((prev) => ({
                    ...prev,
                    fnb: {
                        ...prev.fnb,
                        running: false,
                        progress: 100,
                        migrated: results.products, // Showing product count as primary
                        errors: [],
                    },
                }));
                alert(`FnB Migration Completed!\nCategories: ${results.categories}\nSubCategories: ${results.sub_categories}\nManufacturers: ${results.manufacturers}\nUnits: ${results.units}\nProducts: ${results.products}`);
            } else {
                throw new Error(error);
            }
        } catch (error) {
            console.error('Error in FnB migration:', error);
            migrationRunning.current.fnb = false;
            setMigrationStatus((prev) => ({
                ...prev,
                fnb: {
                    ...prev.fnb,
                    running: false,
                    errors: [...prev.fnb.errors, { error: error.response?.data?.error || error.message }],
                },
            }));
        }
    };

    const startFinancialsMigration = async () => {
        if (!stats.old_tables_exist) {
            alert('Old tables not found in database');
            return;
        }
        // Redirect to Deep/Global migration instead of bulk
        // But user kept the "Financial Data Migration" block.
        // We will repurpose that block to call startDeepMigration.

        // This function was originally for the bulk generic migration.
        // We can leave it as legacy or just point it to the same thing if needed.
        // For now, let's allow it to run the Old Bulk if explicitly clicked, but
        // the UI below will be changed to call startDeepMigration.

        migrationRunning.current.invoices = true;
        setMigrationStatus((prev) => ({
            ...prev,
            invoices: { ...prev.invoices, running: true, progress: 0, migrated: 0, errors: [] },
        }));
        await processMigrationBatch('invoices', 0);
    };

    const processMigrationBatch = async (type, offset) => {
        try {
            const endpointMap = {
                members: '/admin/data-migration/migrate-members',
                families: '/admin/data-migration/migrate-families',
                media: '/admin/data-migration/migrate-media',
                media_photos: '/admin/data-migration/migrate-media-photos',
                invoices: '/admin/data-migration/migrate-invoices',
                customers: '/admin/data-migration/migrate-customers',
                employees: '/admin/data-migration/migrate-employees',
                corporate_members: '/admin/data-migration/migrate-corporate-members',
                corporate_families: '/admin/data-migration/migrate-corporate-families',
                qr_codes: '/admin/data-migration/generate-qr-codes',
                corporate_qr_codes: '/admin/data-migration/generate-corporate-qr-codes',
                financials: '/admin/data-migration/migrate-financials',
                transaction_types: '/admin/data-migration/migrate-transaction-types',
                subscription_types: '/admin/data-migration/migrate-subscription-types',
                departments: '/admin/data-migration/migrate-departments',
            };
            const endpoint = endpointMap[type];
            const batchSize = type === 'qr_codes' || type === 'corporate_qr_codes' ? 20 : type === 'invoices' || type === 'financials' ? 80 : 150;
            const response = await axios.post(endpoint, {
                batch_size: batchSize,
                offset: offset,
            });

            const { migrated, processed, errors, has_more, stats: responseStats } = response.data;
            const recordsProcessed = migrated || processed || responseStats?.departments_migrated + responseStats?.subdepartments_migrated || 0;

            const totalCountMap = {
                members: stats.old_members_count,
                families: stats.old_families_count,
                media: stats.old_media_count,
                media_photos: stats.old_media_count, // Using total media count as approximation or we can add a specific count stats later
                invoices: stats.old_financial_invoices_count,
                customers: stats.old_customers_count,
                employees: stats.old_employees_count,
                corporate_members: stats.old_corporate_members_count,
                corporate_families: stats.old_corporate_families_count,
                qr_codes: stats.pending_qr_codes_count,
                corporate_qr_codes: stats.pending_corporate_qr_codes_count,
                financials: stats.old_financial_invoices_count,
                transaction_types: 15,
                subscription_types: 10,
                departments: (stats.old_departments_count || 0) + (stats.old_subdepartments_count || 0),
            };

            setMigrationStatus((prev) => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    migrated: prev[type].migrated + recordsProcessed,
                    errors: [...prev[type].errors, ...(errors || [])],
                    progress: totalCountMap[type] > 0 ? ((offset + recordsProcessed) / totalCountMap[type]) * 100 : 0,
                },
            }));

            if (has_more && migrationRunning.current[type]) {
                setTimeout(() => {
                    processMigrationBatch(type, offset + batchSize);
                }, 500);
            } else {
                migrationRunning.current[type] = false;
                setMigrationStatus((prev) => ({
                    ...prev,
                    [type]: { ...prev[type], running: false },
                }));
                refreshStats();
            }
        } catch (error) {
            console.error(`Error in ${type} migration:`, error);
            migrationRunning.current[type] = false;
            setMigrationStatus((prev) => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    running: false,
                    errors: [...prev[type].errors, { error: error.response?.data?.error || error.message }],
                },
            }));
        }
    };

    const stopMigration = (type) => {
        migrationRunning.current[type] = false;
        setMigrationStatus((prev) => ({
            ...prev,
            [type]: { ...prev[type], running: false },
        }));
    };

    const validateMigration = async () => {
        try {
            const response = await axios.get('/admin/data-migration/validate');
            setValidationResults(response.data);
            setValidationDialog(true);
        } catch (error) {
            console.error('Validation error:', error);
            alert('Error during validation: ' + (error.response?.data?.error || error.message));
        }
    };

    const resetMigration = async () => {
        try {
            await axios.post('/admin/data-migration/reset');
            setResetDialog(false);
            refreshStats();
            setMigrationStatus({
                members: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
                families: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
                media: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
            });
            alert('Migration data reset successfully');
        } catch (error) {
            console.error('Reset error:', error);
            alert('Error resetting migration: ' + (error.response?.data?.error || error.message));
        }
    };

    const resetFamiliesOnly = async () => {
        try {
            await axios.post('/admin/data-migration/reset-families');
            setResetFamiliesDialog(false);
            refreshStats();
            setMigrationStatus((prev) => ({
                ...prev,
                families: { running: false, progress: 0, total: 0, migrated: 0, errors: [] },
            }));
            alert('Family members reset successfully');
        } catch (error) {
            console.error('Reset families error:', error);
            alert('Error resetting family members: ' + (error.response?.data?.error || error.message));
        }
    };

    const deleteProfilePhotos = async () => {
        try {
            const response = await axios.post('/admin/data-migration/delete-profile-photos');
            setDeletePhotosDialog(false);
            refreshStats();
            alert(`Profile photos deleted successfully - ${response.data.deleted_count} records removed`);
        } catch (error) {
            console.error('Delete profile photos error:', error);
            alert('Error deleting profile photos: ' + (error.response?.data?.error || error.message));
        }
    };

    const cleanupDuplicatePhotos = async () => {
        try {
            const response = await axios.post('/admin/data-migration/cleanup-profile-photos');
            setCleanupDuplicatesDialog(false);
            refreshStats();
            alert(response.data.message);
        } catch (error) {
            console.error('Cleanup duplicate photos error:', error);
            alert('Error cleaning up photos: ' + (error.response?.data?.error || error.message));
        }
    };

    if (!stats.old_tables_exist) {
        return (
            <AdminLayout>
                <Head title="Data Migration" />
                <Typography variant="h4" gutterBottom>
                    Data Migration
                </Typography>
                <Alert severity="error">{stats.error || 'Old tables (memberships, mem_families) not found in database'}</Alert>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Data Migration" />
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Data Migration Dashboard</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="outlined" startIcon={<Refresh />} onClick={refreshStats}>
                            Refresh Stats
                        </Button>
                        <Button variant="outlined" startIcon={<Assessment />} onClick={validateMigration}>
                            Validate Migration
                        </Button>
                        <Button variant="outlined" color="primary" startIcon={<PhotoCamera />} onClick={() => setCleanupDuplicatesDialog(true)}>
                            Cleanup Duplicates
                        </Button>
                        <Button variant="outlined" color="info" startIcon={<PhotoCamera />} onClick={() => setDeletePhotosDialog(true)}>
                            Delete Profile Photos
                        </Button>
                        <Button variant="outlined" color="warning" startIcon={<DeleteSweep />} onClick={() => setResetFamiliesDialog(true)}>
                            Reset Families Only
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<Warning />} onClick={() => setResetDialog(true)}>
                            Reset Migration
                        </Button>
                    </Box>
                </Box>

                {/* Statistics Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Storage sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">Old Members</Typography>
                                </Box>
                                <Typography variant="h4" color="primary">
                                    {stats.old_members_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    From memberships table
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <FamilyRestroom sx={{ mr: 1, color: 'secondary.main' }} />
                                    <Typography variant="h6">Old Families</Typography>
                                </Box>
                                <Typography variant="h4" color="secondary">
                                    {stats.old_families_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    From mem_families table
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <People sx={{ mr: 1, color: 'success.main' }} />
                                    <Typography variant="h6">New Members</Typography>
                                </Box>
                                <Typography variant="h4" color="success.main">
                                    {stats.new_members_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Migrated to members table
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <FamilyRestroom sx={{ mr: 1, color: 'info.main' }} />
                                    <Typography variant="h6">New Families</Typography>
                                </Box>
                                <Typography variant="h4" color="info.main">
                                    {stats.new_families_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Migrated family members
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Image sx={{ mr: 1, color: 'warning.main' }} />
                                    <Typography variant="h6">Old Media</Typography>
                                </Box>
                                <Typography variant="h4" color="warning.main">
                                    {stats.old_media_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    From old_media table
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Image sx={{ mr: 1, color: 'success.main' }} />
                                    <Typography variant="h6">New Media</Typography>
                                </Box>
                                <Typography variant="h4" color="success.main">
                                    {stats.new_media_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Migrated to media table
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Receipt sx={{ mr: 1, color: 'primary.dark' }} />
                                    <Typography variant="h6">Invoices</Typography>
                                </Box>
                                <Typography variant="h4" color="primary.dark">
                                    {stats.migrated_invoices_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Migrated / {stats.old_invoices_count?.toLocaleString() || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ mr: 1, color: 'info.main', fontWeight: 'bold', fontSize: '1.5rem' }}>QR</Box>
                                    <Typography variant="h6">Pending QR</Typography>
                                </Box>
                                <Typography variant="h4" color="info.main">
                                    {stats.pending_qr_codes_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Members without QR codes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <People sx={{ mr: 1, color: 'secondary.main' }} />
                                    <Typography variant="h6">Customers</Typography>
                                </Box>
                                <Typography variant="h4" color="secondary.main">
                                    {stats.new_customers_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Migrated / {stats.old_customers_count?.toLocaleString() || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <People sx={{ mr: 1, color: 'success.dark' }} />
                                    <Typography variant="h6">Employees</Typography>
                                </Box>
                                <Typography variant="h4" color="success.dark">
                                    {stats.new_employees_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Migrated / {stats.old_employees_count?.toLocaleString() || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ mr: 1, color: 'info.main', fontWeight: 'bold', fontSize: '1.5rem' }}>QR</Box>
                                    <Typography variant="h6">Pending Corp QR</Typography>
                                </Box>
                                <Typography variant="h4" color="info.main">
                                    {stats.pending_corporate_qr_codes_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Corp Members without QR codes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Corporate Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <People sx={{ mr: 1, color: 'primary.dark' }} />
                                    <Typography variant="h6">Corp Members</Typography>
                                </Box>
                                <Typography variant="h4" color="primary.dark">
                                    {stats.corporate_members_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Migrated / {stats.old_corporate_members_count?.toLocaleString() || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <FamilyRestroom sx={{ mr: 1, color: 'secondary.dark' }} />
                                    <Typography variant="h6">Corp Families</Typography>
                                </Box>
                                <Typography variant="h4" color="secondary.dark">
                                    {stats.corporate_families_count?.toLocaleString() || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Migrated / {stats.old_corporate_families_count?.toLocaleString() || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Migration Controls */}
                <Grid container spacing={3}>
                    {/* Transaction Types Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Receipt sx={{ mr: 1, color: 'info.dark' }} />
                                    <Typography variant="h6">Transaction Types</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Migrates Transaction Definitions (Debit/Credit types).
                                    <br />
                                    Run this before migrating Financials.
                                </Typography>
                                {migrationStatus.transaction_types.migrated > 0 && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Migrated {migrationStatus.transaction_types.migrated} types.
                                    </Alert>
                                )}
                                <Button variant="contained" color="info" startIcon={migrationStatus.transaction_types.running ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />} onClick={() => startGenericMigration('transaction_types')} disabled={migrationStatus.transaction_types.running}>
                                    {migrationStatus.transaction_types.running ? 'Migrating...' : 'Migrate Types'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Subscription Types Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Receipt sx={{ mr: 1, color: 'secondary.main' }} />
                                    <Typography variant="h6">Subscription Types</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Migrates Subscription Categories & Types from Legacy DB.
                                    <br />
                                    Run this before migrating Financials or Members.
                                </Typography>
                                {migrationStatus.subscription_types.migrated > 0 && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Migrated {migrationStatus.subscription_types.migrated} categories/types.
                                    </Alert>
                                )}
                                <Button variant="contained" color="secondary" startIcon={migrationStatus.subscription_types.running ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />} onClick={() => startGenericMigration('subscription_types')} disabled={migrationStatus.subscription_types.running}>
                                    {migrationStatus.subscription_types.running ? 'Migrating...' : 'Migrate Subs'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    {/* FnB Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Receipt sx={{ mr: 1, color: 'warning.dark' }} />
                                    <Typography variant="h6">FnB Data Migration</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Migrates FnB Categories, SubCategories, Manufacturers, Units & Products.
                                    <br />
                                    <strong>TRUNCATES:</strong> pos_categories, pos_sub_categories, pos_manufacturers, pos_units, products.
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Status: {migrationStatus.fnb.running ? 'Running...' : 'Ready'}
                                    </Typography>
                                    {migrationStatus.fnb.running && <LinearProgress sx={{ mt: 1 }} />}
                                </Box>

                                {migrationStatus.fnb.migrated > 0 && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Migrated {migrationStatus.fnb.migrated} products (and related entities).
                                    </Alert>
                                )}
                                <Button variant="contained" color="warning" startIcon={migrationStatus.fnb.running ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />} onClick={startFnBMigration} disabled={migrationStatus.fnb.running}>
                                    {migrationStatus.fnb.running ? 'Migrating...' : 'Start FnB Migration'}
                                </Button>

                                {migrationStatus.fnb.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.fnb.errors.length} errors occurred
                                        </Alert>
                                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                            {migrationStatus.fnb.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    {error.error}
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Financials Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Financial Data Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {migrationStatus.invoices.progress > 0 ? migrationStatus.invoices.progress.toFixed(2) : 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.invoices.progress} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.invoices.migrated} / {stats.old_financial_invoices_count || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Migrates Invoices, Items, Receipts, Transactions & Relations.
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.invoices.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startFinancialsMigration} disabled={migrationStatus.invoices.running}>
                                        {migrationStatus.invoices.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.invoices.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('invoices')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.invoices.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.invoices.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.invoices.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Invoice:</strong> {error.invoice_no}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Global Invoice Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Global Invoice Migration
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Migrates ALL Pending Invoices using the 'migrated' flag in Legacy DB.
                                    <br />
                                    This checks each invoice atomically, creates Items, Receipts & Ledger Entries.
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Status: {migrationStatus.deep_migration.running ? 'Running...' : 'Ready'}
                                    </Typography>
                                    {migrationStatus.deep_migration.running && <LinearProgress sx={{ mt: 1 }} />}
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated this session: {globalMigrationStats.migrated || 0}
                                    <br />
                                    Remaining (Approx via Batch): {globalMigrationStats.remaining || 'Unknown'}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" color="secondary" startIcon={migrationStatus.deep_migration.running ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />} onClick={startDeepMigration} disabled={migrationStatus.deep_migration.running}>
                                        {migrationStatus.deep_migration.running ? 'Migrating...' : 'Start Global Migration'}
                                    </Button>

                                    {migrationStatus.deep_migration.running && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<Stop />}
                                            onClick={() => {
                                                migrationRunning.current.deep_migration = false;
                                            }}
                                        >
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.deep_migration.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.deep_migration.errors.length} errors occurred
                                        </Alert>
                                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                            {migrationStatus.deep_migration.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    {error.invoice_no ? `Invoice ${error.invoice_no}: ` : ''} {error.error}
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Members Migration */}

                    {/* Validation Dialog */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Members Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.members_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.members.running ? migrationStatus.members.progress : stats.members_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.members.migrated || stats.migrated_members_count || 0} / {stats.old_members_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.members.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startMembersMigration} disabled={migrationStatus.members.running}>
                                        {migrationStatus.members.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.members.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('members')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.members.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.members.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.members.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Member ID:</strong> {error.member_id} | <strong>App No:</strong> {error.application_no} | <strong>Membership No:</strong> {error.membership_no}
                                                        <br />
                                                        <strong>Name:</strong> {error.name}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                        {error.file && (
                                                            <>
                                                                <br />
                                                                <strong>File:</strong> {error.file}:{error.line}
                                                            </>
                                                        )}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Families Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Family Members Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.families_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.families.running ? migrationStatus.families.progress : stats.families_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.families.migrated || stats.migrated_families_count || 0} / {stats.old_families_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.families.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startFamiliesMigration} disabled={migrationStatus.families.running}>
                                        {migrationStatus.families.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.families.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('families')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.families.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.families.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.families.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Family ID:</strong> {error.family_id} | <strong>Parent Member ID:</strong> {error.member_id}
                                                        <br />
                                                        <strong>Parent Membership No:</strong> {error.parent_membership_no} | <strong>Family Membership No:</strong> {error.family_membership_no}
                                                        <br />
                                                        <strong>Name:</strong> {error.name}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                        {error.file && (
                                                            <>
                                                                <br />
                                                                <strong>File:</strong> {error.file}:{error.line}
                                                            </>
                                                        )}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Media Migration */}
                    {/* Media Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Media Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.media_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.media.running ? migrationStatus.media.progress : stats.media_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.media.migrated || stats.migrated_media_count || 0} / {stats.old_media_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.media.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startMediaMigration} disabled={migrationStatus.media.running}>
                                        {migrationStatus.media.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.media.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('media')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.media.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.media.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.media.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Media ID:</strong> {error.media_id}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Media Photos Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Media Photos Migration
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Migrates Member & Family Profile Photos (Types 3 & 100) from Old Media.
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Status: {migrationStatus.media_photos.running ? 'Running...' : 'Ready'}
                                        {migrationStatus.media_photos.progress > 0 && ` (${migrationStatus.media_photos.progress.toFixed(2)}%)`}
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.media_photos.progress} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.media_photos.migrated} records
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" color="secondary" startIcon={migrationStatus.media_photos.running ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />} onClick={startMediaPhotosMigration} disabled={migrationStatus.media_photos.running}>
                                        {migrationStatus.media_photos.running ? 'Migrating...' : 'Start Photo Migration'}
                                    </Button>

                                    {migrationStatus.media_photos.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('media_photos')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.media_photos.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.media_photos.errors.length} errors occurred
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.media_photos.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Media ID:</strong> {error.media_id}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Invoices Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Invoices Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.invoices_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.invoices.running ? migrationStatus.invoices.progress : stats.invoices_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.invoices.migrated || stats.migrated_invoices_count || 0} / {stats.old_invoices_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.invoices.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startInvoicesMigration} disabled={migrationStatus.invoices.running}>
                                        {migrationStatus.invoices.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>
                                    <Button variant="contained" color="error" startIcon={<DeleteSweep />} onClick={() => setDeleteLegacyInvoicesDialog(true)} disabled={migrationStatus.invoices.running}>
                                        Delete Legacy Data
                                    </Button>

                                    {migrationStatus.invoices.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('invoices')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.invoices.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.invoices.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.invoices.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Invoice No:</strong> {error.invoice_no}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Customers Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Customers Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.customers_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.customers.running ? migrationStatus.customers.progress : stats.customers_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.customers.migrated || stats.new_customers_count || 0} / {stats.old_customers_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.customers.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startCustomersMigration} disabled={migrationStatus.customers.running}>
                                        {migrationStatus.customers.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.customers.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('customers')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.customers.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.customers.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.customers.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>ID:</strong> {error.customer_id}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Employees Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Employees Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.employees_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.employees.running ? migrationStatus.employees.progress : stats.employees_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.employees.migrated || stats.new_employees_count || 0} / {stats.old_employees_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.employees.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startEmployeesMigration} disabled={migrationStatus.employees.running}>
                                        {migrationStatus.employees.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.employees.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('employees')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.employees.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.employees.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.employees.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>ID:</strong> {error.old_id}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Departments Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Departments & Subdepartments
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.departments_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.departments.running ? migrationStatus.departments.progress : stats.departments_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {stats.new_departments_count || 0} / {stats.old_departments_count || 0} (Depts)
                                    <br />
                                    Migrated: {stats.new_subdepartments_count || 0} / {stats.old_subdepartments_count || 0} (SubDepts)
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Also links existing employees to the new departments.
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.departments.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startDepartmentsMigration} disabled={migrationStatus.departments.running}>
                                        {migrationStatus.departments.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.departments.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('departments')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.departments.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.departments.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.departments.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Corporate Members Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Corporate Members Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.corporate_members_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.corporate_members.running ? migrationStatus.corporate_members.progress : stats.corporate_members_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.corporate_members.migrated || stats.corporate_members_count || 0} / {stats.old_corporate_members_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.corporate_members.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startCorporateMembersMigration} disabled={migrationStatus.corporate_members.running}>
                                        {migrationStatus.corporate_members.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.corporate_members.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('corporate_members')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.corporate_members.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.corporate_members.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.corporate_members.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Corporate Families Migration */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Corporate Families Migration
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {stats.corporate_families_migration_percentage || 0}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.corporate_families.running ? migrationStatus.corporate_families.progress : stats.corporate_families_migration_percentage || 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Migrated: {migrationStatus.corporate_families.migrated || stats.corporate_families_count || 0} / {stats.old_corporate_families_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.corporate_families.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startCorporateFamiliesMigration} disabled={migrationStatus.corporate_families.running}>
                                        {migrationStatus.corporate_families.running ? 'Migrating...' : 'Start Migration'}
                                    </Button>

                                    {migrationStatus.corporate_families.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('corporate_families')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.corporate_families.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.corporate_families.errors.length} errors occurred during migration
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.corporate_families.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* QR Code Generation */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    QR Code Generation
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {migrationStatus.qr_codes.progress.toFixed(2)}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.qr_codes.progress} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Generated: {migrationStatus.qr_codes.migrated} / {stats.pending_qr_codes_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.qr_codes.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startQrCodeGeneration} disabled={migrationStatus.qr_codes.running}>
                                        {migrationStatus.qr_codes.running ? 'Generating...' : 'Start Generation'}
                                    </Button>

                                    {migrationStatus.qr_codes.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('qr_codes')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.qr_codes.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.qr_codes.errors.length} errors occurred during generation
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.qr_codes.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Member ID:</strong> {error.member_id}
                                                        <br />
                                                        <strong>Name:</strong> {error.name}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Corporate QR Code Generation */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Corporate QR Codes
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress: {migrationStatus.corporate_qr_codes.progress.toFixed(2)}%
                                    </Typography>
                                    <LinearProgress variant="determinate" value={migrationStatus.corporate_qr_codes.running ? migrationStatus.corporate_qr_codes.progress : stats.pending_corporate_qr_codes_count > 0 ? (migrationStatus.corporate_qr_codes.migrated / stats.pending_corporate_qr_codes_count) * 100 : 0} sx={{ mt: 1 }} />
                                </Box>

                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Generated: {migrationStatus.corporate_qr_codes.migrated} / {stats.pending_corporate_qr_codes_count || 0}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button variant="contained" startIcon={migrationStatus.corporate_qr_codes.running ? <CircularProgress size={20} /> : <PlayArrow />} onClick={startCorporateQrCodeGeneration} disabled={migrationStatus.corporate_qr_codes.running}>
                                        {migrationStatus.corporate_qr_codes.running ? 'Generating...' : 'Start Generation'}
                                    </Button>

                                    {migrationStatus.corporate_qr_codes.running && (
                                        <Button variant="outlined" startIcon={<Stop />} onClick={() => stopMigration('corporate_qr_codes')}>
                                            Stop
                                        </Button>
                                    )}
                                </Box>

                                {migrationStatus.corporate_qr_codes.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {migrationStatus.corporate_qr_codes.errors.length} errors occurred
                                        </Alert>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {migrationStatus.corporate_qr_codes.errors.map((error, index) => (
                                                <Alert key={index} severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>Member ID:</strong> {error.member_id}
                                                        <br />
                                                        <strong>Name:</strong> {error.name}
                                                        <br />
                                                        <strong>Error:</strong> {error.error}
                                                    </Typography>
                                                </Alert>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Validation Dialog */}
                <Dialog open={validationDialog} onClose={() => setValidationDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Migration Validation Results</DialogTitle>
                    <DialogContent>
                        {validationResults && (
                            <Box>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Count Validation
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                        <Chip icon={validationResults.members_count_match ? <CheckCircle /> : <Error />} label={`Members: ${validationResults.members_count_match ? 'Match' : 'Mismatch'}`} color={validationResults.members_count_match ? 'success' : 'error'} />
                                        <Chip icon={validationResults.families_count_match ? <CheckCircle /> : <Error />} label={`Families: ${validationResults.families_count_match ? 'Match' : 'Mismatch'}`} color={validationResults.families_count_match ? 'success' : 'error'} />
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="h6" gutterBottom>
                                    Sample Data Integrity
                                </Typography>
                                <List>
                                    {validationResults.sample_data_integrity.map((sample, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={`Old ID: ${sample.old_id} → New ID: ${sample.new_id}`}
                                                secondary={
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                        <Chip size="small" label="Name" color={sample.name_match ? 'success' : 'error'} />
                                                        <Chip size="small" label="Membership No" color={sample.membership_no_match ? 'success' : 'error'} />
                                                        <Chip size="small" label="CNIC" color={sample.cnic_match ? 'success' : 'error'} />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>

                                {validationResults.errors.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="h6" color="error" gutterBottom>
                                            Errors
                                        </Typography>
                                        <List>
                                            {validationResults.errors.map((error, index) => (
                                                <ListItem key={index}>
                                                    <ListItemText primary={error} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setValidationDialog(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* Reset Dialog */}
                <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
                    <DialogTitle>Reset Migration Data</DialogTitle>
                    <DialogContent>
                        <Typography>Are you sure you want to reset all migration data? This will delete all records from the members table.</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setResetDialog(false)}>Cancel</Button>
                        <Button onClick={resetMigration} color="error" variant="contained">
                            Reset
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Reset Families Only Dialog */}
                <Dialog open={resetFamiliesDialog} onClose={() => setResetFamiliesDialog(false)}>
                    <DialogTitle>Reset Family Members Only</DialogTitle>
                    <DialogContent>
                        <Typography>Are you sure you want to reset only family member migration data? This will delete all family member records (records with parent_id) from the members table, but will keep primary members intact.</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setResetFamiliesDialog(false)}>Cancel</Button>
                        <Button onClick={resetFamiliesOnly} color="warning" variant="contained">
                            Reset Families Only
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Profile Photos Dialog */}
                <Dialog open={deletePhotosDialog} onClose={() => setDeletePhotosDialog(false)}>
                    <DialogTitle>Delete Profile Photos</DialogTitle>
                    <DialogContent>
                        <Typography>Are you sure you want to delete all profile photos? This will permanently remove all media records where type is 'profile_photo' for both family members and primary members from the media table.</Typography>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Warning:</strong> This action cannot be undone. All profile photos will be permanently deleted.
                            </Typography>
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeletePhotosDialog(false)}>Cancel</Button>
                        <Button onClick={deleteProfilePhotos} color="info" variant="contained">
                            Delete Profile Photos
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Cleanup Duplicates Dialog */}
                <Dialog open={cleanupDuplicatesDialog} onClose={() => setCleanupDuplicatesDialog(false)}>
                    <DialogTitle>Cleanup Duplicate Profile Photos</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to cleanup duplicate profile photos? This will check all members and family members. If multiple profile photos are found for the same person, the <strong>latest one (by ID) will be kept</strong> and older ones will be deleted.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCleanupDuplicatesDialog(false)}>Cancel</Button>
                        <Button onClick={cleanupDuplicatePhotos} color="primary" variant="contained">
                            Cleanup Duplicates
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Legacy Invoices Dialog */}
                <Dialog open={deleteLegacyInvoicesDialog} onClose={() => setDeleteLegacyInvoicesDialog(false)}>
                    <DialogTitle>Delete Legacy Invoices</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to <strong>permanently delete</strong> all legacy invoices (ID &lt;= 8915) and their related transactions, receipts, and items?
                        </Typography>
                        <Alert severity="error" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Warning:</strong> This action is irreversible. Ensure you have a backup if needed.
                            </Typography>
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteLegacyInvoicesDialog(false)}>Cancel</Button>
                        <Button onClick={deleteLegacyInvoices} color="error" variant="contained" disabled={migrationStatus.invoices.running}>
                            {migrationStatus.invoices.running ? 'Deleting...' : 'Delete Legacy Data'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </AdminLayout>
    );
};

export default DataMigrationIndex;
