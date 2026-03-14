import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputBase, InputLabel, List, ListItem, MenuItem, Paper, Radio, RadioGroup, Select, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import axios from 'axios';

import { useOrderStore } from '@/stores/useOrderStore';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import CancelOrder from '../Dashboard/DelModal';
import { routeNameForContext } from '@/lib/utils';

const OrderSaved = ({ setActiveView }) => {
    const { setOrderDetails } = useOrderStore();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const [savedOrders, setSavedOrders] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false); // State for popup
    const [selectedOrder, setSelectedOrder] = useState(null); // State for selected order
    const [formData, setFormData] = useState({
        id: '',
        order_no: '',
        order_type: '',
        member: null,
        person_count: 1,
        waiter: '',
        date: '',
        time: '',
        floor: '',
        table: '',
        order_items: [],
        order_status: 'pending',
    }); // State for form data
    const [waiters, setWaiters] = useState([]);
    const [errors, setErrors] = useState({});

    const [searchTerm, setSearchTerm] = useState('');
    const [filterOption, setFilterOption] = useState('all');

    const [floorTables, setFloorTables] = useState([]); // Replace with your actual data

    const handleFloorChange = (value) => {
        setFormData((prev) => ({ ...prev, floor: value }));
        handleOrderDetailChange('table', '');
        // Add logic to filter tables based on the selected floor
    };

    const handleFilterOptionChange = (event, newValue) => {
        if (newValue !== null) {
            setFilterOption(newValue);
            // Add logic to filter tables based on the selected filter option
        }
    };

    const handleOrderDetailChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCancelOrder = () => {
        setIsModalVisible(false); // Close the cancel order modal
        setIsNotificationVisible(true); // Show the notification

        // Auto-hide the notification after 3 seconds
        setTimeout(() => {
            setIsNotificationVisible(false);
        }, 3000);
    };

    const handleContinueOrderClick = (order) => {
        setFormData((prev) => ({
            ...prev,
            id: order.id,
            order_no: order.order_number,
            order_type: order.order_type,
            member: order.user,
            person_count: order.person_count,
            order_items: [],
            order_status: 'pending',
            date: order.start_date,
            time: order.start_time ? order.start_time.slice(0, 5) : '',
            floor: order.floor,
            table: order.table,
        }));
        setSelectedOrder(order); // Set the selected order
        setIsPopupOpen(true); // Open the popup
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false); // Close the popup
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleConfirmOrder = () => {
        const newErrors = {};
        if (!formData.waiter?.id) newErrors['member.id'] = 'Please select a waiter.';
        if (!formData.date) newErrors.date = 'Please select a date.';
        if (!formData.time) newErrors.time = 'Please select a time.';
        if (!formData.floor) newErrors.floor = 'Please select a floor.';
        if (!formData.table) newErrors.table = 'Please select a table.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            enqueueSnackbar('Please fix the errors in the form.', { variant: 'error' });
            return;
        }

        setOrderDetails(formData);
        setIsPopupOpen(false);
        setActiveView('orderDetail');
    };

    useEffect(() => {
        axios
            .get(route(routeNameForContext('order.savedOrder')))
            .then((response) => {
                setSavedOrders(response.data.SavedOrders);
            })
            .catch((error) => {
                console.error('Error fetching saved orders:', error);
            });
        axios.get(route(routeNameForContext('waiters.all'))).then((res) => setWaiters(res.data.waiters));
        axios.get(route(routeNameForContext('floor.all'))).then((res) => {
            setFloorTables(res.data.floors);
            setFormData((prev) => ({ ...prev, floor: res.data.floors[0]?.id }));
        });
    }, []);

    const currentFloor = floorTables.find((f) => f.id === formData.floor);

    const filteredTables = currentFloor?.tables?.length
        ? currentFloor.tables.filter((table) => {
              if (filterOption === 'available' && !table.available) return false;
              const keyword = searchTerm.toLowerCase();
              return table.table_no.toLowerCase().includes(keyword) || String(table.capacity).includes(keyword);
          })
        : [];

    return (
        <Box
            sx={{
                bgcolor: '#FFFFFF',
                mt: 2,
                px: 1,
                borderRadius: '20px',
                border: '1px solid #E3E3E3',
            }}
        >
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <Typography
                    sx={{
                        color: '#7F7F7F',
                        fontSize: '12px',
                    }}
                >
                    Order Saved
                </Typography>
                <Typography
                    sx={{
                        color: '#063455',
                        fontWeight: 700,
                        fontSize: '14px',
                        marginLeft: 1,
                    }}
                >
                    {savedOrders.length} Order{savedOrders.length !== 1 ? 's' : ''}
                </Typography>
            </Box>
            <List sx={{ p: 0 }}>
                {savedOrders.length > 0 &&
                    savedOrders.map((order, index) => (
                        <ListItem
                            key={index}
                            sx={{
                                px: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    width: '100%',
                                    bgcolor: '#F6F6F6',
                                    border: '1px solid #E3E3E3',
                                    p: 2,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: '#0C67AA',
                                            width: 32,
                                            height: 32,
                                            fontSize: '14px',
                                            color: '#FFFFFF',
                                        }}
                                    >
                                        {order.table.table_no}
                                    </Avatar>
                                    {isModalVisible && <CancelOrder onClose={() => setIsModalVisible(false)} onConfirm={handleCancelOrder} />}
                                    {isNotificationVisible && (
                                        <Box
                                            sx={{
                                                position: 'fixed',
                                                top: '5%',
                                                right: '2%',
                                                zIndex: 2000,
                                                display: 'flex',
                                                alignItems: 'center',
                                                bgcolor: '#E6FAE6',
                                                color: '#333',
                                                borderRadius: 2,
                                                p: 2,
                                                boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
                                                minWidth: 300,
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontWeight: 'bold',
                                                    mr: 1,
                                                }}
                                            >
                                                ✅ Order Canceled!
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                Order id <b>#Order002</b> has been canceled
                                            </Typography>
                                        </Box>
                                    )}
                                    <IconButton
                                        size="small"
                                        sx={{
                                            ml: 1,
                                            bgcolor: '#E3E3E3',
                                            width: 32,
                                            height: 32,
                                        }}
                                    >
                                        <img src="/assets/food-tray.png" style={{ height: 24, width: 24 }} alt="" />
                                    </IconButton>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mr: 1 }}>
                                        {order.member ? `${order.member?.full_name} (${order.member?.membership_no})` : `${order.customer?.name}`}
                                    </Typography>

                                    <img
                                        src="/assets/Diamond.png"
                                        alt=""
                                        style={{
                                            height: 24,
                                            width: 24,
                                        }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            bgcolor: '#E3E3E3',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            #{order.id}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <img
                                            src="/assets/trash.png"
                                            alt=""
                                            style={{
                                                height: 20,
                                                width: 20,
                                                marginRight: 10,
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => setIsModalVisible(true)}
                                        />
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{
                                                bgcolor: '#0c3b5c',
                                                textTransform: 'none',
                                                '&:hover': {
                                                    bgcolor: '#072a42',
                                                },
                                            }}
                                            onClick={() => handleContinueOrderClick(order)}
                                        >
                                            Continue Order
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </ListItem>
                    ))}
            </List>

            {/* Popup Dialog */}
            <Dialog
                open={isPopupOpen}
                onClose={handleClosePopup}
                maxWidth="md" // Increased the maximum width to 'lg'
                fullWidth // Ensures the dialog takes the full width of the maxWidth
            >
                <DialogTitle>Continue Order</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>Are you sure you want to continue with order #{selectedOrder?.order_number}?</Typography>

                    {/* Select Waiter */}
                    <Autocomplete
                        label="Select Waiter"
                        fullWidth
                        freeSolo
                        options={waiters}
                        value={formData.waiter}
                        getOptionLabel={(option) => option?.name || ''}
                        // onInputChange={(event, value) => handleSearch(event, 'waiter')}
                        onChange={(event, value) => handleOrderDetailChange('waiter', value)}
                        renderInput={(params) => <TextField {...params} fullWidth sx={{ p: 0 }} label="Select Waiter" variant="outlined" />}
                        filterOptions={(options, state) => options.filter((option) => `${option.name} ${option.email}`.toLowerCase().includes(state.inputValue.toLowerCase()))}
                        renderOption={(props, option) => (
                            <li {...props}>
                                <span>{option.name}</span>
                                <span style={{ color: 'gray', fontSize: '0.875rem' }}> ({option.email})</span>
                            </li>
                        )}
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Select Time */}
                        <TextField
                            label="Select Time"
                            name="time"
                            type="time"
                            value={formData.time}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                shrink: true, // Ensures the label stays visible when the input is inactive
                            }}
                        />

                        {/* Select Date */}
                        <TextField
                            label="Select Date"
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                shrink: true, // Ensures the label stays visible when the input is inactive
                            }}
                        />
                    </Box>

                    {/* Search and Filter */}
                    <Box sx={{ mb: 2, mt: 2, display: 'flex' }}>
                        <Paper
                            component="form"
                            sx={{
                                p: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                flex: 1,
                                border: '1px solid #ddd',
                                boxShadow: 'none',
                            }}
                        >
                            <InputBase sx={{ ml: 1, flex: 1 }} placeholder="Search" inputProps={{ 'aria-label': 'search tables' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
                                <SearchIcon />
                            </IconButton>
                        </Paper>
                        <FormControl sx={{ marginLeft: 1, minWidth: 200 }}>
                            {' '}
                            {/* Adjust the minWidth as needed */}
                            <InputLabel id="select-floor">Floor</InputLabel>
                            <Select labelId="select-floor" id="floor" value={formData.floor} label="Floor" onChange={(e) => handleFloorChange(e.target.value)}>
                                {floorTables.map((item, index) => (
                                    <MenuItem value={item.id} key={index}>
                                        {item.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <ToggleButtonGroup value={filterOption} exclusive onChange={handleFilterOptionChange} aria-label="filter option" size="small" sx={{ ml: 1 }}>
                            <ToggleButton
                                value="all"
                                aria-label="all"
                                sx={{
                                    textTransform: 'none',
                                    minWidth: 100,
                                    '&.Mui-selected': {
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: '#063455',
                                        },
                                    },
                                }}
                            >
                                All
                            </ToggleButton>
                            <ToggleButton
                                value="available"
                                aria-label="available"
                                sx={{
                                    textTransform: 'none',
                                    minWidth: 100,
                                    '&.Mui-selected': {
                                        backgroundColor: '#063455',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: '#063455',
                                        },
                                    },
                                }}
                            >
                                Available
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Table Selection */}
                    <Box sx={{ mb: 2 }}>
                        <RadioGroup value={formData.table} onChange={(e) => handleOrderDetailChange('table', e.target.value)}>
                            <Grid container spacing={1}>
                                {filteredTables.length > 0 &&
                                    filteredTables.map((table) => (
                                        <Grid item xs={6} key={table.id}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    bgcolor: table.id === formData.table ? '#FCF7EF' : table.available ? 'white' : '#f5f5f5',
                                                    border: table.id === formData.table ? '1px solid #A27B5C' : '1px solid #e0e0e0',
                                                    borderRadius: 1,
                                                    opacity: table.available ? 1 : 0.7,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {table.table_no}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                                            {table.capacity} person
                                                        </Typography>
                                                        {table.available ? (
                                                            <FormControlLabel
                                                                value={table.id}
                                                                control={<Radio size="small" />}
                                                                label=""
                                                                sx={{
                                                                    m: 0,
                                                                    color: '#063455',
                                                                }}
                                                            />
                                                        ) : (
                                                            <Typography variant="caption" sx={{ color: '#063455' }}>
                                                                {table.table_no.split('-')[0]} - Full
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                            </Grid>
                        </RadioGroup>
                    </Box>
                </DialogContent>
                {/* footer  */}
                <DialogActions>
                    <Button onClick={handleClosePopup} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmOrder} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
OrderSaved.layout = (page) => page;
export default OrderSaved;
