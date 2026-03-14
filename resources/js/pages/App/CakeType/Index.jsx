import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Box, Paper, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip } from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import POSLayout from "@/components/POSLayout";
import { routeNameForContext } from '@/lib/utils';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

function Index({ cakeTypes, filters }) {
    const [open, setOpen] = React.useState(true);
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        get(route(routeNameForContext('cake-types.index')), { preserveState: true });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this cake type?')) {
            router.delete(route(routeNameForContext('cake-types.destroy'), id));
        }
    };

    return (
        <>
            {/* <Head title="Cake Types" />
            <SideNav open={open} setOpen={setOpen} />
            <Box
                sx={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    // p: 3,
                }}
            > */}
                <Box sx={{
                    p: 2,
                    bgcolor: '#f5f5f5',
                    minHeight: '100vh'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '30px' }}>
                            Cake Types List
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Search by Name"
                                size="small"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        '&:hover fieldset': {
                                            borderRadius: '16px',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderRadius: '16px',
                                        },
                                    },
                                }} />
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                component={Link}
                                href={route(routeNameForContext('cake-types.trashed'))}
                                sx={{ bgcolor: 'transparent', borderRadius: '16px', height: 35, textTransform: 'none' }}>
                                Deleted
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                component={Link}
                                href={route(routeNameForContext('cake-types.create'))}
                                sx={{
                                    bgcolor: '#063455',
                                    borderRadius: '16px', height: 35, textTransform: 'none',
                                    '&:hover': { bgcolor: '#002a41' }
                                }}>
                                Add Cake Type
                            </Button>
                        </Box>
                    </Box>

                    {/* <Paper sx={{ p: 2, mb: 3 }}>
                    <form onSubmit={handleSearch}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            
                            <Button variant="outlined" startIcon={<Search />} type="submit" disabled={processing}>
                                Search
                            </Button>
                        </Box>
                    </form>
                </Paper> */}

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#063455' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Price</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: '600', color:'#fff' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cakeTypes.data.length > 0 ? (
                                    cakeTypes.data.map((type) => (
                                        <TableRow key={type.id}>
                                            <TableCell>{type.name}</TableCell>
                                            <TableCell>Rs {type.base_price}</TableCell>
                                            <TableCell>
                                                <Chip label={type.status} color={type.status === 'active' ? 'success' : 'default'} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton component={Link} href={route(routeNameForContext('cake-types.edit'), type.id)} size="small" color="primary">
                                                    <Edit />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(type.id)} size="small" color="error">
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            No cake types found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* Pagination can be added here if needed */}
                </Box>
            {/* </Box> */}
        </>
    );
}

Index.layout = (page) => <POSLayout>{page}</POSLayout>;
export default Index;
