import { router } from '@inertiajs/react';
import { Add, ArrowBack, DeleteOutline } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Paper, Switch, Typography } from '@mui/material';
import { useState } from 'react';
import { routeNameForContext } from '@/lib/utils';
import { enqueueSnackbar } from 'notistack';

const TableSetting = ({ floorsdata, tablesData, selectedRestaurant, onClose }) => {
    const [processingId, setProcessingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, floor: null });

    const handleToggle = (id, newStatus) => {
        setProcessingId(id);

        router.put(
            route(routeNameForContext('floors.toggleStatus'), { id: id, restaurant_id: selectedRestaurant || undefined }),
            {
                status: newStatus,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const openDeleteDialog = (floor) => setConfirmDelete({ open: true, floor });
    const closeDeleteDialog = () => setConfirmDelete({ open: false, floor: null });

    const confirmDeleteFloor = () => {
        const floor = confirmDelete.floor;
        if (!floor?.id) return;

        setProcessingId(floor.id);
        router.delete(route(routeNameForContext('floors.destroy'), { floor: floor.id, restaurant_id: selectedRestaurant || undefined }), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                enqueueSnackbar('Floor deleted', { variant: 'success' });
                closeDeleteDialog();
            },
            onError: () => {
                enqueueSnackbar('Failed to delete floor', { variant: 'error' });
            },
            onFinish: () => setProcessingId(null),
        });
    };

    // Sort floorsdata in descending order by id
    const sortedFloors = [...floorsdata].sort((a, b) => b.id - a.id);

    // Function to count tables for a given floor
    const getTableCount = (floorId) => {
        return tablesData.filter((table) => table.floor_id === floorId).length;
    };

    const noFloorCount = tablesData.filter((table) => table.floor_id === null || table.floor_id === undefined).length;

    return (
        <Box
            sx={{
                bgcolor: '#FFFFFF',
                minHeight: '100vh',
                maxWidth: '450px',
                mx: 'auto',
                p: 1,
                mt: 1,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                    sx={{ mr: 1 }}
                    onClick={() => {
                        if (onClose) {
                            onClose();
                            return;
                        }
                        router.visit(route(routeNameForContext('table.management'), { restaurant_id: selectedRestaurant || undefined }));
                    }}
                >
                    <ArrowBack fontSize="small" />
                </IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '18px', color: '#121212' }}>
                    Table Settings
                </Typography>
            </Box>

            <Box
                sx={{
                    p: 1.5,
                    mt: 1,
                    flexGrow: 1,
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 120px)',
                }}
            >
                <Typography variant="body2" sx={{ mb: 1.5, color: '#7F7F7F' }}>
                    Floor Plan List
                </Typography>

                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Add />}
                    onClick={() => router.visit(route(routeNameForContext('floors.createOrEdit'), { restaurant_id: selectedRestaurant || undefined }))}
                    sx={{
                        mb: 2,
                        py: 1.5,
                        color: '#063455',
                        borderColor: '#063455',
                        borderStyle: 'dashed',
                        borderWidth: '1px',
                        borderRadius: 1,
                        bgcolor: '#B0DEFF',
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        '&:hover': {
                            bgcolor: '#d6eafc',
                            borderColor: '#063455',
                        },
                    }}
                >
                    Add New Floor
                </Button>

                <Paper
                    elevation={0}
                    sx={{
                        mb: 1,
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 1,
                        bgcolor: '#F6F6F6',
                        border: '1px solid #F1F1F2',
                    }}
                >
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                        }}
                    >
                        <img src="/assets/home-roof.png" alt="" style={{ width: 18, height: 18 }} />
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.9rem', color: '#121212' }}>
                            Without Floor (tables: {noFloorCount})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                            No floor assigned
                        </Typography>
                    </Box>

                    <img
                        src="/assets/edit.png"
                        alt="Edit"
                        style={{ width: 20, height: 20, marginLeft: 15, cursor: 'pointer' }}
                        onClick={() => router.visit(route(routeNameForContext('floors.createOrEdit'), { id: 'no_floor', restaurant_id: selectedRestaurant || undefined }))}
                    />
                </Paper>

                {sortedFloors?.map((floor, index) => (
                    <Paper
                        key={floor.id}
                        elevation={0}
                        sx={{
                            mb: 1,
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 1,
                            bgcolor: '#F6F6F6',
                            border: '1px solid #F1F1F2',
                        }}
                    >
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                            }}
                        >
                            <img src="/assets/home-roof.png" alt="" style={{ width: 18, height: 18 }} />
                        </Box>

                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.9rem', color: '#121212' }}>
                                {floor.name || `Floor ${index + 1}`} (tables: {getTableCount(floor.id)})
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                                {floor.area || 'No area defined'}
                            </Typography>
                        </Box>

                        {processingId === floor.id ? (
                            <CircularProgress size={18} thickness={5} sx={{ mx: 1 }} />
                        ) : (
                            <Switch checked={floor.status} onChange={(e) => handleToggle(floor.id, e.target.checked)} size="small" disabled={processingId !== null} />
                        )}

                        <img
                            src="/assets/edit.png"
                            alt="Edit"
                            style={{ width: 20, height: 20, marginLeft: 15, cursor: 'pointer' }}
                            onClick={() => router.visit(route(routeNameForContext('floors.edit'), { id: floor.id, restaurant_id: selectedRestaurant || undefined }))}
                        />
                        <IconButton
                            size="small"
                            onClick={() => openDeleteDialog(floor)}
                            disabled={processingId !== null}
                            sx={{ ml: 0.5 }}
                        >
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    </Paper>
                ))}
            </Box>

            <Dialog open={confirmDelete.open} onClose={closeDeleteDialog}>
                <DialogTitle>Delete Floor?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Delete "{confirmDelete.floor?.name || ''}"? Tables will be moved to "Without Floor".
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteDialog} disabled={processingId !== null}>
                        Cancel
                    </Button>
                    <Button onClick={confirmDeleteFloor} disabled={processingId !== null} sx={{ color: '#c62828' }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
TableSetting.layout = (page) => page;
export default TableSetting;
