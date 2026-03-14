// pages/CustomerLists.jsx or similar
import SideNav from '@/components/App/Sidebar/SideNav';

import { router } from '@inertiajs/react';
import { Add as AddIcon, Close as CloseIcon, KeyboardArrowRight as KeyboardArrowRightIcon, Search as SearchIcon } from '@mui/icons-material';
import { Alert, Avatar, Box, Button, IconButton, InputAdornment, Menu, MenuItem, Modal, Snackbar, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { routeNameForContext } from '@/lib/utils';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const WaiterDashboard = ({ userDetail, users }) => {
    const [open, setOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState({
        customer: null,
        dishCategory: '',
        amount: '110.00',
        favoriteItems: [],
    });
    const [dishCategoryMenuAnchor, setDishCategoryMenuAnchor] = useState(null);
    const [selectedDish, setSelectedDish] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const dishes = ['Tea', 'Coffee', 'Chicken', 'Cake', 'Biryani', 'Burger', 'Pizza', 'Pasta'];

    const handleCreateOrder = (customer) => {
        setCurrentOrder({
            customer,
            dishCategory: '',
            amount: '110.00',
            favoriteItems: [],
        });
        setOrderModalOpen(true);
    };

    const handleCloseOrderModal = () => {
        setOrderModalOpen(false);
        setDishCategoryMenuAnchor(null);
    };

    const handleOpenDishCategoryMenu = (event) => {
        setDishCategoryMenuAnchor(event.currentTarget);
    };

    const handleCloseDishCategoryMenu = () => {
        setDishCategoryMenuAnchor(null);
    };

    const handleSelectDish = (dish) => {
        setSelectedDish(dish);
        setCurrentOrder({
            ...currentOrder,
            dishCategory: dish,
        });
        setDishCategoryMenuAnchor(null);
    };

    const handleSaveOrder = () => {
        setSuccessMessage('Order saved successfully!');
        setShowSuccess(true);
        setOrderModalOpen(false);
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
    };

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
                <div style={{ backgroundColor: '#F6F6F6', padding: '20px' }}>
                    <div
                        style={{
                            display: 'flex',
                            backgroundColor: '#f0f0f0',
                            padding: '10px',
                            borderRadius: '10px',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        <Typography variant="h5">{userDetail.data.length} Waiter</Typography>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <TextField
                                placeholder="Search name or membership type"
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                style={{ width: '400px', backgroundColor: 'white' }}
                            />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.get(route(routeNameForContext('waiters.create')))} style={{ backgroundColor: '#063455', color: 'white' }}>
                                Add Waiter
                            </Button>
                        </div>
                    </div>

                    <Box>
                        <Table>
                            <TableHead style={{ backgroundColor: '#f0f0f0' }}>
                                <TableRow>
                                    <TableCell style={{ fontWeight: 'bold' }}>Membership ID</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Waiter Name</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Email</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Phone number</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users?.data?.length > 0 ? (
                                    users.data.map((user, index) => (
                                        <TableRow key={`${user.user_id}-${index}`}>
                                            <TableCell>{user.user_id || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Typography variant="body1">{user.name || 'N/A'}</Typography>
                                            </TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                            <TableCell>{user.phone_number || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow key="no-waiter">
                                        <TableCell colSpan={4}>
                                            <Typography variant="body2">No waiter details available.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* {userDetail?.data?.length > 0 ? (
                                    userDetail?.data?.map((user, userIndex) =>
                                        user.user_detail && user.user_detail.length > 0 ? (
                                            user.user_detail.map((detail, detailIndex) => (
                                                <TableRow key={`${user.user_id}-${detailIndex}`}>
                                                    <TableCell>{user.user_id || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body1">{user.name || 'N/A'}</Typography>
                                                    </TableCell>
                                                    <TableCell>{user.email || 'N/A'}</TableCell>
                                                    <TableCell>{user.phone_number || 'N/A'}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow key={`no-waiter-${userIndex}`}>
                                                <TableCell colSpan={4}>
                                                    <Typography variant="body2">No waiter details available.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4}>
                                            <Typography variant="body2">No customers found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )} */}
                            </TableBody>
                        </Table>
                    </Box>
                </div>
            </div>

            {/* Order Modal */}
            <Modal open={orderModalOpen} onClose={handleCloseOrderModal} aria-labelledby="order-modal-title" aria-describedby="order-modal-description">
                <Box
                    sx={{
                        position: 'absolute',
                        right: '0px',
                        width: '500px',
                        bgcolor: '#e3f2fd',
                        borderRadius: '8px',
                        boxShadow: 24,
                        p: 4,
                        height: '100vh',
                        overflowY: 'auto',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Create Order</Typography>
                        <IconButton onClick={handleCloseOrderModal}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    {currentOrder.customer && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar src={currentOrder.customer.profilePic} sx={{ width: 56, height: 56, mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle1">{currentOrder.customer.name}</Typography>
                                <Typography variant="body2">{currentOrder.customer.email}</Typography>
                                <Typography variant="body2">{currentOrder.customer.phone}</Typography>
                            </Box>
                        </Box>
                    )}

                    <TextField
                        label="Dish Category"
                        value={currentOrder.dishCategory}
                        onClick={handleOpenDishCategoryMenu}
                        fullWidth
                        InputProps={{
                            endAdornment: <KeyboardArrowRightIcon />,
                            readOnly: true,
                        }}
                        sx={{ mb: 2 }}
                    />
                    <Menu anchorEl={dishCategoryMenuAnchor} open={Boolean(dishCategoryMenuAnchor)} onClose={handleCloseDishCategoryMenu}>
                        {dishes.map((dish) => (
                            <MenuItem key={dish} onClick={() => handleSelectDish(dish)}>
                                {dish}
                            </MenuItem>
                        ))}
                    </Menu>

                    <TextField
                        label="Amount"
                        type="number"
                        fullWidth
                        value={currentOrder.amount}
                        onChange={(e) =>
                            setCurrentOrder({
                                ...currentOrder,
                                amount: e.target.value,
                            })
                        }
                        sx={{ mb: 2 }}
                    />

                    <Button variant="contained" fullWidth onClick={handleSaveOrder} style={{ backgroundColor: '#063455', color: 'white' }}>
                        Save Order
                    </Button>
                </Box>
            </Modal>

            {/* Success Snackbar */}
            <Snackbar open={showSuccess} autoHideDuration={3000} onClose={handleCloseSuccess}>
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </>
    );
};
WaiterDashboard.layout = (page) => page;
export default WaiterDashboard;
