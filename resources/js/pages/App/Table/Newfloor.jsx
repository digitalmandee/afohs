import { useState } from 'react';
import SideNav from '@/components/App/SideBar/SideNav';
import { router, useForm } from '@inertiajs/react';
import { Add, ArrowBack, Delete, ExpandMore } from '@mui/icons-material';
import { Alert, Box, Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Snackbar, TextField, Typography } from '@mui/material';
import Table2Icon from '@/components/App/Icons/Table2';
import { routeNameForContext } from '@/lib/utils';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const NewFloor = ({ floorInfo, allrestaurants, activeTenantId }) => {
    const [open, setOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(true);
    const [isFloorExpanded, setIsFloorExpanded] = useState(true);
    const [isTableExpanded, setIsTableExpanded] = useState(true);
    const [duplicateError, setDuplicateError] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState(activeTenantId || '');
    const [confirmDeleteTable, setConfirmDeleteTable] = useState({ open: false, index: null });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success', // 'success' | 'error' | 'info' | 'warning'
    });

    const { data, setData, post, put, processing, errors, reset } = useForm({
        floor: floorInfo ? { name: floorInfo.name || '' } : { name: '' },
        tables:
            floorInfo && floorInfo.tables && floorInfo.tables.length > 0
                ? floorInfo.tables.map((t) => ({
                      id: t.id,
                      original_table_no: t.table_no,
                      original_capacity: Number(t.capacity) || 2,
                      table_no: t.table_no || '',
                      capacity: Number(t.capacity) || 2,
                  }))
                : [],
    });

    // Snackbar popup handle
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Handle input changes for floors
    const handleFloorChange = (key, value) => {
        setData('floor', { ...data.floor, [key]: value });
    };

    // Handle input changes for tables
    const handleTableChange = (index, key, value) => {
        const updatedTables = [...data.tables];
        updatedTables[index][key] = value;
        setData('tables', updatedTables);
    };

    const openDeleteTableDialog = (index) => setConfirmDeleteTable({ open: true, index });
    const closeDeleteTableDialog = () => setConfirmDeleteTable({ open: false, index: null });

    const confirmRemoveTable = () => {
        if (confirmDeleteTable.index === null) return;
        const updatedTables = data.tables.filter((_, i) => i !== confirmDeleteTable.index);
        setData('tables', updatedTables);
        closeDeleteTableDialog();
        setSnackbar({ open: true, message: 'Table removed. Click Save to apply changes.', severity: 'success' });
    };

    const addNewTable = () => {
        setData('tables', [
            ...data.tables,
            {
                id: `new`,
                original_table_no: '',
                original_capacity: 2,
                table_no: '',
                capacity: 2,
            },
        ]);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        // router.visit(route('table.management'));
    };

    const processTableData = () => {
        return data.tables.map((table) => {
            const idStr = String(table.id || ''); // ensure it's a string

            if (idStr.startsWith('new')) {
                return table; // Newly added table; already tagged
            }

            if (table.table_no !== table.original_table_no || Number(table.capacity) !== Number(table.original_capacity)) {
                return {
                    ...table,
                    id: `update-${idStr}`,
                };
            }

            return table;
        });
    };

    const handleSaveFloorAndTable = () => {
        const isNoFloor = floorInfo?.id === 'no_floor';
        const isEditingFloor = Boolean(floorInfo && floorInfo.id && !isNoFloor);
        const hasEmptyFields = data.tables.some((t) => !t.table_no.trim()) || (isEditingFloor && !data.floor.name.trim());

        const tableNumbers = data.tables.map((t) => t.table_no.trim());
        const hasDuplicateTableNumbers = new Set(tableNumbers).size !== tableNumbers.length;

        if (hasEmptyFields) {
            setSnackbar({ open: true, message: isEditingFloor ? 'Floor name and all table fields are required.' : 'All table fields are required.', severity: 'error' });
            return;
        }

        if (hasDuplicateTableNumbers) {
            setDuplicateError(true);
            setSnackbar({ open: true, message: 'Duplicate table numbers are not allowed.', severity: 'error' });
            return;
        }

        if (isNoFloor) {
            const updatedData = {
                ...data,
                tables: processTableData(),
                restaurant_id: selectedRestaurant,
            };

            router.put(route(routeNameForContext('tables.no-floor.update')), updatedData, {
                onSuccess: () => {
                    reset();
                    setModalOpen(false);
                    setSnackbar({ open: true, message: 'Tables updated successfully!', severity: 'success' });
                    router.visit(route(routeNameForContext('table.management'), { restaurant_id: selectedRestaurant }));
                },
                onError: (err) => {
                    setSnackbar({ open: true, message: 'Failed to update tables.', severity: 'error' });
                },
            });
        } else if (floorInfo && floorInfo.id) {
            const updatedData = {
                ...data,
                tables: processTableData(),
                restaurant_id: selectedRestaurant,
            };

            // Update existing floor
            router.put(route(routeNameForContext('floors.update'), floorInfo.id), updatedData, {
                onSuccess: () => {
                    reset();
                    setModalOpen(false);
                    setSnackbar({ open: true, message: 'Floor updated successfully!', severity: 'success' });
                    router.visit(route(routeNameForContext('table.management'), { restaurant_id: selectedRestaurant }));
                },
                onError: (err) => {
                    setSnackbar({ open: true, message: 'Failed to update floor.', severity: 'error' });
                },
            });
        } else {
            // Create new floor
            router.post(route(routeNameForContext('floors.store')), { ...data, restaurant_id: selectedRestaurant }, {
                onSuccess: () => {
                    reset();
                    setModalOpen(false);
                    setSnackbar({ open: true, message: 'Floor created successfully!', severity: 'success' });
                    router.visit(route(routeNameForContext('table.management'), { restaurant_id: selectedRestaurant }));
                },
                onError: (err) => {
                    setSnackbar({ open: true, message: 'Failed to create floor.', severity: 'error' });
                },
            });
        }
    };

    const tablePendingDelete = confirmDeleteTable.index !== null ? data.tables[confirmDeleteTable.index] : null;

    return (
        <>
            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            >
                <Container maxWidth="xl" sx={{ height: '100vh', py: 1, px: 2 }}>
                    <Box
                        sx={{
                            height: 'calc(100% - 20px)',
                            width: '100%',
                            bgcolor: '#0d3b5c',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            borderRadius: 3,
                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        {/* Header */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                zIndex: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: 'white',
                                    mr: 1.5,
                                }}
                            />
                            <Typography onClick={() => setModalOpen(true)} variant="body2" sx={{ color: 'white', cursor: 'pointer', fontWeight: 500 }}>
                                {data.floor.name ? data.floor.name : 'No Floor'}
                            </Typography>
                        </Box>
                        {/* Grid pattern */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                            }}
                        />
                        {/* Center message */}
                        {data.tables.length === 0 && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    maxWidth: 250,
                                    // display: modalOpen ? 'none' : 'block',
                                }}
                            >
                                <Typography variant="body2" sx={{ color: 'white' }}>
                                    You need to fill out the properties form to view table at here
                                </Typography>
                            </Box>
                        )}

                        {data.tables.length > 0 && (
                            <Box
                                sx={{
                                    flexGrow: 1,
                                    position: 'relative',
                                    overflow: 'auto',
                                    top: 50,
                                    height: '100%',
                                    minHeight: 500,
                                    zIndex: 1,
                                }}
                            >
                                {/* First row of tables */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 20,
                                        right: 20,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        width: '100%',
                                        gap: '30px',
                                    }}
                                >
                                    {data && data?.tables.map((table, index) => <DraggableTable key={index} index={index} data={table} />)}
                                </Box>
                            </Box>
                        )}

                        {/* Right side modal */}
                        {modalOpen && (
                            <Paper
                                elevation={4}
                                sx={{
                                    position: 'absolute',
                                    top: 5,
                                    right: 10,
                                    bottom: 5,
                                    width: 400,
                                    borderTopLeftRadius: 12,
                                    borderBottomLeftRadius: 12,
                                    overflow: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.15)',
                                    zIndex: 2,
                                }}
                            >
                                {/* Header */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 2,
                                        borderBottom: '1px solid #e0e0e0',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <IconButton size="small" sx={{ mr: 1 }} onClick={handleCloseModal}>
                                            <ArrowBack fontSize="small" />
                                        </IconButton>
                                        <Typography variant="subtitle1">{floorInfo && floorInfo.id ? 'Edit Floor' : 'Add New Floor'}</Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleSaveFloorAndTable}
                                        disabled={processing}
                                        sx={{
                                            bgcolor: '#0d3b5c',
                                            '&:hover': { bgcolor: '#0a2e4a' },
                                            textTransform: 'none',
                                            px: 3,
                                        }}
                                    >
                                        {processing ? 'Saving...' : 'Save'}
                                    </Button>
                                </Box>

                                {/* Floor List Section */}
                                <Box sx={{ p: 2 }}>
                                    {Array.isArray(allrestaurants) && allrestaurants.length > 1 && (
                                        <Box sx={{ mb: 2 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id="restaurant-label">Restaurant</InputLabel>
                                                <Select
                                                    labelId="restaurant-label"
                                                    value={selectedRestaurant || ''}
                                                    label="Restaurant"
                                                    onChange={(e) => {
                                                        const restaurantId = e.target.value;
                                                        setSelectedRestaurant(restaurantId);
                                                        const currentFloorId = floorInfo?.id ? String(floorInfo.id) : undefined;
                                                        const params = currentFloorId ? { id: currentFloorId, restaurant_id: restaurantId } : { restaurant_id: restaurantId };
                                                        router.get(route(routeNameForContext('floors.createOrEdit'), params), {}, { preserveScroll: true, replace: true });
                                                    }}
                                                >
                                                    {allrestaurants.map((item) => (
                                                        <MenuItem value={item.id} key={item.id}>
                                                            {item.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    )}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant="subtitle2">Floor List</Typography>
                                        <IconButton size="small" onClick={() => setIsFloorExpanded(!isFloorExpanded)}>
                                            <ExpandMore
                                                fontSize="small"
                                                sx={{
                                                    transform: isFloorExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: '0.3s',
                                                }}
                                            />
                                        </IconButton>
                                    </Box>
                                    {isFloorExpanded && (
                                        <>
                                            <Grid container spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                                                <Grid item xs={12}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Floor Name (optional)
                                                    </Typography>
                                                    <TextField size="small" value={data.floor.name} onChange={(e) => handleFloorChange('name', e.target.value)} fullWidth error={!!errors[`floor.name`]} helperText={errors[`floor.name`]} />
                                                </Grid>
                                            </Grid>
                                        </>
                                    )}
                                </Box>

                                {/* Table List Section */}
                                <Box sx={{ p: 2 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <Typography variant="subtitle2">Table List ({data.tables.length})</Typography>
                                        <IconButton size="small" onClick={() => setIsTableExpanded(!isTableExpanded)}>
                                            <ExpandMore
                                                fontSize="small"
                                                sx={{
                                                    transform: isTableExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: '0.3s',
                                                }}
                                            />
                                        </IconButton>
                                    </Box>

                                    {isTableExpanded && (
                                        <>
                                            {data.tables.map((table, index) => (
                                                <Grid container spacing={2} alignItems="center" key={index} sx={{ mt: 0.5 }}>
                                                    <Grid item xs={5}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Table Number
                                                        </Typography>
                                                        <TextField size="small" value={table.table_no} onChange={(e) => handleTableChange(index, 'table_no', e.target.value)} fullWidth error={!!errors[`tables.${index}.table_no`]} helperText={errors[`tables.${index}.table_no`]} />
                                                    </Grid>
                                                    <Grid item xs={5}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Capacity
                                                        </Typography>
                                                        <FormControl fullWidth size="small">
                                                            <Select value={table.capacity} onChange={(e) => handleTableChange(index, 'capacity', e.target.value)} error={!!errors[`tables.${index}.capacity`]}>
                                                                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                                                                    <MenuItem value={n} key={n}>
                                                                        {n}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>
                                                    <Grid item xs={2} sx={{ textAlign: 'center' }}>
                                                        <IconButton size="small" onClick={() => openDeleteTableDialog(index)}>
                                                            <Delete fontSize="small" sx={{ color: '#d32f2f' }} />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>
                                            ))}
                                            <Button startIcon={<Add />} onClick={addNewTable}>
                                                Add Table
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            </Paper>
                        )}
                    </Box>
                </Container>
            </div>

            <Dialog open={confirmDeleteTable.open} onClose={closeDeleteTableDialog}>
                <DialogTitle>Delete Table?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Delete {tablePendingDelete?.table_no ? `table "${tablePendingDelete.table_no}"` : 'this table'}? This will be applied after you click Save.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteTableDialog} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={confirmRemoveTable} disabled={processing} sx={{ color: '#c62828' }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};
NewFloor.layout = (page) => page;
export default NewFloor;

const DraggableTable = ({ data, reservation, index, moveTable, onClick, fill }) => {
    // Determine text color based on reservation status
    const getTextColor = () => {
        if (fill === '#d1fae5') return '#059669';
        if (fill === '#cfe7ff') return '#3b82f6';
        return '#6b7280';
    };

    return (
        <Box
            onClick={onClick}
            sx={{
                // width,
                // height,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'move',
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'scale(1.02)',
                },
            }}
        >
            <Table2Icon fillColor={fill} />

            <Box
                sx={{
                    position: 'absolute',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: getTextColor() }}>
                    {data.table_no}
                </Typography>
                <Typography variant="caption" sx={{ color: getTextColor(), fontSize: '0.7rem' }}>
                    Cap: {data.capacity}
                </Typography>
            </Box>
        </Box>
    );
};
