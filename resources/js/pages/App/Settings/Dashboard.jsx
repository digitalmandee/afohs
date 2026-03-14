import POSLayout from "@/components/POSLayout";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CategoryIcon from '@mui/icons-material/Category';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DiningIcon from '@mui/icons-material/DinnerDining';
import EditIcon from '@mui/icons-material/Edit';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LayersIcon from '@mui/icons-material/Layers';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import PrintIcon from '@mui/icons-material/Print';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SecurityIcon from '@mui/icons-material/Security';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StoreIcon from '@mui/icons-material/Store';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, List, ListItem, ListItemSecondaryAction, MenuItem, Select, Snackbar, styled, Switch, TextField, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRef, useState } from 'react';

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '4px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
    },
    '& .MuiDialogTitle-root': {
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        marginBottom: '5px',
    },
    '& .MuiDialogContent-root': {
        padding: '24px',
    },
    '& .MuiDialogActions-root': {
        padding: '16px 24px',
        borderTop: '1px solid #e0e0e0',
    },
}));

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: '#e0e0e0',
        },
        '&:hover fieldset': {
            borderColor: '#b0b0b0',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#063455',
        },
    },
});

const StyledSelect = styled(Select)({
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#e0e0e0',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#b0b0b0',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#063455',
    },
});

const SaveButton = styled(Button)({
    backgroundColor: '#063455',
    color: 'white',
    '&:hover': {
        backgroundColor: '#002244',
    },
    textTransform: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
});

const CancelButton = styled(Button)({
    color: '#666',
    '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    textTransform: 'none',
});

const PhotoButton = styled(Button)({
    padding: '2px 8px',
    minWidth: 'auto',
    textTransform: 'none',
    fontWeight: 'normal',
});

const DottedDivider = styled(Box)({
    height: '1px',
    background: 'linear-gradient(to right, #ccc 50%, transparent 50%)',
    backgroundSize: '8px 1px',
    backgroundRepeat: 'repeat-x',
    margin: '16px 0',
});

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const SettingDashboard = () => {
    // const [open, setOpen] = useState(true);
    const [activeButton, setActiveButton] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [storeImage, setStoreImage] = useState(null);
    const fileInputRef = useRef(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [tableManagementTab, setTableManagementTab] = useState('floor-data');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newPaymentType, setNewPaymentType] = useState('');
    const [newBankName, setNewBankName] = useState('');
    const [newFloorName, setNewFloorName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingPaymentType, setIsAddingPaymentType] = useState(false);
    const [isAddingBankAccount, setIsAddingBankAccount] = useState(false);
    const [isAddingFloor, setIsAddingFloor] = useState(false);

    // Store Info State
    const [storeInfo, setStoreInfo] = useState({
        name: 'Afohs club Shop',
        email: 'imaji.coffee@gmail.com',
        phone1: '892 000 000 000',
        phone2: '892 000 000 000',
        countryCode1: '+62',
        countryCode2: '+62',
        country: 'Indonesia',
        province: 'Jakarta',
        city: 'Jakarta',
        zipCode: '2093',
        fullAddress: '',
    });

    // Notification Settings
    const [notifications, setNotifications] = useState({
        outOfStockMenu: false,
        stockMinimum: false,
        selfOrder: true,
        orderFromMobileApp: false,
    });

    // Order Type Settings
    const [orderTypes, setOrderTypes] = useState({
        cashier: {
            dineIn: true,
            pickUp: false,
            delivery: true,
            takeaway: true,
            reservation: false,
        },
        selfOrder: {
            dineIn: true,
            pickUp: true,
            delivery: true,
            takeaway: true,
            reservation: true,
        },
        mobileApp: {
            dineIn: true,
            pickUp: true,
            delivery: true,
            takeaway: true,
            reservation: true,
        },
    });

    // Menu Categories
    const [categories, setCategories] = useState([
        { id: 1, name: 'Coffee & Beverage', active: true },
        { id: 2, name: 'Food & Snack', active: true },
        { id: 3, name: 'Imaji at Home', active: true },
    ]);

    // Payment Types
    const [paymentTypes, setPaymentTypes] = useState([
        { id: 1, name: 'Cash', active: true },
        { id: 2, name: 'Bank Transfer', active: true },
        { id: 3, name: 'Debit / Credit Card', active: false },
        { id: 4, name: 'QR Code', active: true },
        { id: 5, name: 'Imaji Pay', active: false },
    ]);

    // Bank Accounts
    const [bankAccounts, setBankAccounts] = useState([
        {
            id: 1,
            name: 'Sea Bank',
            accountNumber: 'BB-08543-0892 (Mr. Sahrul)',
            active: true,
        },
        {
            id: 2,
            name: 'CIMB Bank',
            accountNumber: 'BB-08543-0892 (Mr. Sahrul)',
            active: true,
        },
        {
            id: 3,
            name: 'Citibank',
            accountNumber: 'BB-08543-0892 (Mr. Sahrul)',
            active: false,
        },
    ]);

    // Floor Data
    const [floors, setFloors] = useState([
        { id: 1, name: 'Floor 1', active: true },
        { id: 2, name: 'Floor 2', active: true },
    ]);

    // Printing Devices
    const [printingDevices, setPrintingDevices] = useState([
        {
            id: 1,
            name: 'Kassen PP-203',
            location: 'Cashier',
            connected: true,
            active: true,
        },
        {
            id: 2,
            name: 'Kassen BT-P290',
            location: 'Cashier',
            connected: false,
            active: false,
        },
        {
            id: 3,
            name: 'Epson TM-T82',
            location: 'Kitchen',
            connected: true,
            active: true,
        },
    ]);

    // Form Change Handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name) {
            setStoreInfo((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setStoreImage(e.target?.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteImage = () => {
        setStoreImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleOpenModal = (modalName) => {
        setActiveModal(modalName);
        setActiveButton(modalName);
    };

    const handleCloseModal = () => {
        setActiveModal(null);
        setActiveButton(null);
        setIsAddingCategory(false);
        setIsAddingPaymentType(false);
        setIsAddingBankAccount(false);
        setIsAddingFloor(false);
        setNewCategoryName('');
        setNewPaymentType('');
        setNewBankName('');
        setNewFloorName('');
    };

    const handleSave = () => {
        setSuccessMessage(
            `${activeModal
                ?.split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')} saved successfully!`,
        );
        handleCloseModal();
    };

    const handleCloseSnackbar = () => {
        setSuccessMessage(null);
    };

    // Notification Handlers
    const handleNotificationChange = (name) => (event) => {
        setNotifications({
            ...notifications,
            [name]: event.target.checked,
        });
    };

    // Order Type Handlers
    const handleOrderTypeChange = (orderType, service) => {
        setOrderTypes((prev) => ({
            ...prev,
            [service]: {
                ...prev[service],
                [orderType]: !prev[service][orderType],
            },
        }));
    };

    // Category Handlers
    const handleCategoryActiveChange = (id) => {
        setCategories(categories.map((category) => (category.id === id ? { ...category, active: !category.active } : category)));
    };

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            setCategories([
                ...categories,
                {
                    id: categories.length + 1,
                    name: newCategoryName,
                    active: true,
                },
            ]);
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    const handleDeleteCategory = (id) => {
        setCategories(categories.filter((category) => category.id !== id));
    };

    // Payment Type Handlers
    const handlePaymentTypeActiveChange = (id) => {
        setPaymentTypes(paymentTypes.map((paymentType) => (paymentType.id === id ? { ...paymentType, active: !paymentType.active } : paymentType)));
    };

    const handleAddPaymentType = () => {
        if (newPaymentType.trim()) {
            setPaymentTypes([
                ...paymentTypes,
                {
                    id: paymentTypes.length + 1,
                    name: newPaymentType,
                    active: true,
                },
            ]);
            setNewPaymentType('');
            setIsAddingPaymentType(false);
        }
    };

    const handleDeletePaymentType = (id) => {
        setPaymentTypes(paymentTypes.filter((paymentType) => paymentType.id !== id));
    };

    // Bank Account Handlers
    const handleBankAccountActiveChange = (id) => {
        setBankAccounts(bankAccounts.map((bankAccount) => (bankAccount.id === id ? { ...bankAccount, active: !bankAccount.active } : bankAccount)));
    };

    const handleAddBankAccount = () => {
        if (newBankName.trim()) {
            setBankAccounts([
                ...bankAccounts,
                {
                    id: bankAccounts.length + 1,
                    name: newBankName,
                    accountNumber: 'BB-08543-0892 (Mr. Sahrul)',
                    active: true,
                },
            ]);
            setNewBankName('');
            setIsAddingBankAccount(false);
        }
    };

    // Floor Data Handlers
    const handleFloorActiveChange = (id) => {
        setFloors(floors.map((floor) => (floor.id === id ? { ...floor, active: !floor.active } : floor)));
    };

    const handleAddFloor = () => {
        if (newFloorName.trim()) {
            setFloors([...floors, { id: floors.length + 1, name: newFloorName, active: true }]);
            setNewFloorName('');
            setIsAddingFloor(false);
        }
    };

    // Printing Device Handlers
    const handlePrintingDeviceActiveChange = (id) => {
        setPrintingDevices(printingDevices.map((device) => (device.id === id ? { ...device, active: !device.active } : device)));
    };

    const settingsOptions = [
        { id: 'employee-data', title: 'Employee Data', icon: <PersonIcon /> },
        {
            id: 'employee-schedule',
            title: 'Employee Schedule',
            icon: <CalendarMonthIcon />,
        },
        { id: 'users-account', title: 'Users Account', icon: <SecurityIcon /> },
        { id: 'store-info', title: 'Store Info', icon: <StoreIcon /> },
        {
            id: 'notification',
            title: 'Notification',
            icon: <NotificationsIcon />,
        },
        { id: 'dine-in', title: 'Dine In', icon: <RestaurantIcon /> },
        {
            id: 'categories-menu',
            title: 'Categories Menu',
            icon: <CategoryIcon />,
        },
        { id: 'payment-type', title: 'Payment Type', icon: <PaymentIcon /> },
        {
            id: 'bank-account',
            title: 'Bank Account',
            icon: <AccountBalanceIcon />,
        },
        {
            id: 'floor-area-data',
            title: 'Floor & Area Data',
            icon: <LayersIcon />,
        },
        {
            id: 'printing-device',
            title: 'Printing Device',
            icon: <PrintIcon />,
        },
    ];

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
                <div
                    className="container mt-4"
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '20px',
                    }}
                >
                    <h1 className="mb-4">Settings</h1>

                    <Grid container spacing={2}>
                        {settingsOptions.map((option) => (
                            <Grid item xs={12} sm={6} md={4} key={option.id}>
                                <Card
                                    onClick={() => handleOpenModal(option.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        height: '120px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: activeButton === option.id ? '#b3e0ff' : 'white',
                                        border: '1px solid #e0e0e0',
                                        boxShadow: 'none',
                                        transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
                                        '&:hover': {
                                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Box sx={{ fontSize: '2rem', mb: 1 }}>{option.icon}</Box>
                                        <Typography variant="body1">{option.title}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Success Message Snackbar */}
                    <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                            {successMessage}
                        </Alert>
                    </Snackbar>

                    {/* Store Info Modal */}
                    <StyledDialog open={activeModal === 'store-info'} onClose={handleCloseModal} maxWidth="md" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                        <DialogTitle>
                            <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" component="div">
                                Store Info
                            </Typography>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', mb: 2 }}>
                                    <Box
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            backgroundColor: '#d9a78b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mr: 2,
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {storeImage ? (
                                            <img
                                                src={storeImage || '/placeholder.svg'}
                                                alt="Store logo"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <StoreIcon
                                                sx={{
                                                    fontSize: 50,
                                                    color: 'white',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: 1,
                                                mb: 1,
                                            }}
                                        >
                                            <PhotoButton variant="text" color="primary" onClick={() => fileInputRef.current?.click()}>
                                                Choose Photo
                                            </PhotoButton>
                                            <PhotoButton variant="text" color="error" onClick={handleDeleteImage} disabled={!storeImage}>
                                                Delete
                                            </PhotoButton>
                                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
                                        </Box>
                                        <Typography variant="body2" color="textSecondary">
                                            Click upload to change store logo
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            (4 MB max)
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Store Name
                                    </Typography>
                                    <StyledTextField fullWidth name="name" value={storeInfo.name} onChange={handleChange} variant="outlined" size="small" />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Email
                                    </Typography>
                                    <StyledTextField fullWidth name="email" value={storeInfo.email} onChange={handleChange} variant="outlined" size="small" />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Phone Number 1
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <FormControl sx={{ width: '30%' }}>
                                            <StyledSelect value={storeInfo.countryCode1} onChange={handleChange} name="countryCode1" displayEmpty variant="outlined" size="small" IconComponent={KeyboardArrowDownIcon}>
                                                <MenuItem value="+62">+62</MenuItem>
                                                <MenuItem value="+1">+1</MenuItem>
                                                <MenuItem value="+44">+44</MenuItem>
                                                <MenuItem value="+81">+81</MenuItem>
                                            </StyledSelect>
                                        </FormControl>
                                        <StyledTextField fullWidth name="phone1" value={storeInfo.phone1} onChange={handleChange} variant="outlined" size="small" />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Phone Number 2 (Optional)
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <FormControl sx={{ width: '30%' }}>
                                            <StyledSelect value={storeInfo.countryCode2} onChange={handleChange} name="countryCode2" displayEmpty variant="outlined" size="small" IconComponent={KeyboardArrowDownIcon}>
                                                <MenuItem value="+62">+62</MenuItem>
                                                <MenuItem value="+1">+1</MenuItem>
                                                <MenuItem value="+44">+44</MenuItem>
                                                <MenuItem value="+81">+81</MenuItem>
                                            </StyledSelect>
                                        </FormControl>
                                        <StyledTextField fullWidth name="phone2" value={storeInfo.phone2} onChange={handleChange} variant="outlined" size="small" />
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mt: 1,
                                            mb: 2,
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mr: 1 }}>
                                            Address Info
                                        </Typography>
                                        <DottedDivider sx={{ flex: 1 }} />
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Country
                                    </Typography>
                                    <FormControl fullWidth variant="outlined" size="small">
                                        <StyledSelect value={storeInfo.country} onChange={handleChange} name="country" IconComponent={KeyboardArrowDownIcon}>
                                            <MenuItem value="Indonesia">Indonesia</MenuItem>
                                            <MenuItem value="Malaysia">Malaysia</MenuItem>
                                            <MenuItem value="Singapore">Singapore</MenuItem>
                                            <MenuItem value="Thailand">Thailand</MenuItem>
                                        </StyledSelect>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Province / Street
                                    </Typography>
                                    <FormControl fullWidth variant="outlined" size="small">
                                        <StyledSelect value={storeInfo.province} onChange={handleChange} name="province" IconComponent={KeyboardArrowDownIcon}>
                                            <MenuItem value="Jakarta">Jakarta</MenuItem>
                                            <MenuItem value="Bali">Bali</MenuItem>
                                            <MenuItem value="Bandung">Bandung</MenuItem>
                                            <MenuItem value="Surabaya">Surabaya</MenuItem>
                                        </StyledSelect>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        City
                                    </Typography>
                                    <FormControl fullWidth variant="outlined" size="small">
                                        <StyledSelect value={storeInfo.city} onChange={handleChange} name="city" IconComponent={KeyboardArrowDownIcon}>
                                            <MenuItem value="Jakarta">Jakarta</MenuItem>
                                            <MenuItem value="Denpasar">Denpasar</MenuItem>
                                            <MenuItem value="Bandung">Bandung</MenuItem>
                                            <MenuItem value="Surabaya">Surabaya</MenuItem>
                                        </StyledSelect>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Zip Code / Postal Code
                                    </Typography>
                                    <StyledTextField fullWidth name="zipCode" value={storeInfo.zipCode} onChange={handleChange} variant="outlined" size="small" />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Full Address / Street
                                    </Typography>
                                    <StyledTextField fullWidth name="fullAddress" value={storeInfo.fullAddress} onChange={handleChange} variant="outlined" size="small" multiline rows={2} />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'flex-end' }}>
                            <CancelButton onClick={handleCloseModal}>Cancel</CancelButton>
                            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                        </DialogActions>
                    </StyledDialog>

                    {/* Notification Modal */}
                    <StyledDialog open={activeModal === 'notification'} onClose={handleCloseModal} maxWidth="sm" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                        <DialogTitle>
                            <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" component="div">
                                Notification
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0 }}>
                            <List sx={{ width: '100%', p: 0 }}>
                                <ListItem
                                    sx={{
                                        borderBottom: '1px solid #f0f0f0',
                                        py: 2,
                                        px: 3,
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            Out of Stock Menu
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Out of Stock notification
                                        </Typography>
                                    </Box>
                                    <ListItemSecondaryAction
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Switch edge="end" checked={notifications.outOfStockMenu} onChange={handleNotificationChange('outOfStockMenu')} color="primary" />
                                        <ChevronRightIcon sx={{ ml: 1 }} />
                                    </ListItemSecondaryAction>
                                </ListItem>

                                <ListItem
                                    sx={{
                                        borderBottom: '1px solid #f0f0f0',
                                        py: 2,
                                        px: 3,
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            Stock Minimum
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Menu stock at a minimum level
                                        </Typography>
                                    </Box>
                                    <ListItemSecondaryAction
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Switch edge="end" checked={notifications.stockMinimum} onChange={handleNotificationChange('stockMinimum')} color="primary" />
                                        <ChevronRightIcon sx={{ ml: 1 }} />
                                    </ListItemSecondaryAction>
                                </ListItem>

                                <ListItem
                                    sx={{
                                        borderBottom: '1px solid #f0f0f0',
                                        py: 2,
                                        px: 3,
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            Self Order
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Notification if there is a new order
                                        </Typography>
                                    </Box>
                                    <ListItemSecondaryAction
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Switch edge="end" checked={notifications.selfOrder} onChange={handleNotificationChange('selfOrder')} color="primary" />
                                        <ChevronRightIcon sx={{ ml: 1 }} />
                                    </ListItemSecondaryAction>
                                </ListItem>

                                <ListItem
                                    sx={{
                                        py: 2,
                                        px: 3,
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            Order From Mobile App
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Notification if there are any transactions
                                        </Typography>
                                    </Box>
                                    <ListItemSecondaryAction
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Switch edge="end" checked={notifications.orderFromMobileApp} onChange={handleNotificationChange('orderFromMobileApp')} color="primary" />
                                        <ChevronRightIcon sx={{ ml: 1 }} />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'flex-end' }}>
                            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                        </DialogActions>
                    </StyledDialog>

                    {/* Order Type Modal (Dine In) */}
                    <StyledDialog open={activeModal === 'dine-in'} onClose={handleCloseModal} maxWidth="md" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                        <DialogTitle>
                            <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" component="div">
                                Order Type
                            </Typography>
                        </DialogTitle>
                        <DialogContent>
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="cashier-content" id="cashier-header">
                                    <Typography>Cashier</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('dineIn', 'cashier')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <DiningIcon sx={{ mr: 1 }} />
                                                    <Typography>Dine In</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.cashier.dineIn ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.cashier.dineIn && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('pickUp', 'cashier')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <ShoppingBagIcon sx={{ mr: 1 }} />
                                                    <Typography>Pick Up</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.cashier.pickUp ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.cashier.pickUp && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('delivery', 'cashier')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <LocalShippingIcon sx={{ mr: 1 }} />
                                                    <Typography>Delivery</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.cashier.delivery ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.cashier.delivery && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('takeaway', 'cashier')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <TakeoutDiningIcon sx={{ mr: 1 }} />
                                                    <Typography>Takeaway</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.cashier.takeaway ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.cashier.takeaway && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('reservation', 'cashier')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <EventSeatIcon sx={{ mr: 1 }} />
                                                    <Typography>Reservation</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.cashier.reservation ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.cashier.reservation && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="self-order-content" id="self-order-header">
                                    <Typography>Self Order</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('dineIn', 'selfOrder')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <DiningIcon sx={{ mr: 1 }} />
                                                    <Typography>Dine In</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.selfOrder.dineIn ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.selfOrder.dineIn && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('pickUp', 'selfOrder')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <ShoppingBagIcon sx={{ mr: 1 }} />
                                                    <Typography>Pick Up</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.selfOrder.pickUp ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.selfOrder.pickUp && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('delivery', 'selfOrder')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <LocalShippingIcon sx={{ mr: 1 }} />
                                                    <Typography>Delivery</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.selfOrder.delivery ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.selfOrder.delivery && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('takeaway', 'selfOrder')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <TakeoutDiningIcon sx={{ mr: 1 }} />
                                                    <Typography>Takeaway</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.selfOrder.takeaway ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.selfOrder.takeaway && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('reservation', 'selfOrder')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <EventSeatIcon sx={{ mr: 1 }} />
                                                    <Typography>Reservation</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.selfOrder.reservation ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.selfOrder.reservation && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="mobile-app-content" id="mobile-app-header">
                                    <Typography>Mobile App</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('dineIn', 'mobileApp')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <DiningIcon sx={{ mr: 1 }} />
                                                    <Typography>Dine In</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.mobileApp.dineIn ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.mobileApp.dineIn && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('pickUp', 'mobileApp')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <ShoppingBagIcon sx={{ mr: 1 }} />
                                                    <Typography>Pick Up</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.mobileApp.pickUp ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.mobileApp.pickUp && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('delivery', 'mobileApp')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <LocalShippingIcon sx={{ mr: 1 }} />
                                                    <Typography>Delivery</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.mobileApp.delivery ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.mobileApp.delivery && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('takeaway', 'mobileApp')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <TakeoutDiningIcon sx={{ mr: 1 }} />
                                                    <Typography>Takeaway</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.mobileApp.takeaway ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.mobileApp.takeaway && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    border: '1px solid #d0d0d0',
                                                }}
                                                onClick={() => handleOrderTypeChange('reservation', 'mobileApp')}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <EventSeatIcon sx={{ mr: 1 }} />
                                                    <Typography>Reservation</Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        border: '1px solid #d0d0d0',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: orderTypes.mobileApp.reservation ? '#063455' : 'transparent',
                                                    }}
                                                >
                                                    {orderTypes.mobileApp.reservation && (
                                                        <CheckIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: 18,
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'flex-end' }}>
                            <CancelButton onClick={handleCloseModal}>Cancel</CancelButton>
                            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                        </DialogActions>
                    </StyledDialog>

                    {/* Categories Menu Modal */}
                    <StyledDialog open={activeModal === 'categories-menu'} onClose={handleCloseModal} maxWidth="sm" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                        <DialogTitle>
                            <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" component="div">
                                Menu Categories
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0 }}>
                            <List sx={{ width: '100%', p: 0 }}>
                                {categories.map((category) => (
                                    <ListItem
                                        key={category.id}
                                        sx={{
                                            borderBottom: '1px solid #f0f0f0',
                                            py: 2,
                                            px: 3,
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            {category.name}
                                        </Typography>
                                        <ListItemSecondaryAction
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mr: 1,
                                                }}
                                            >
                                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                                    {category.active ? 'Active' : 'Inactive'}
                                                </Typography>
                                                <Switch edge="end" checked={category.active} onChange={() => handleCategoryActiveChange(category.id)} color="primary" />
                                            </Box>
                                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteCategory(category.id)} sx={{ color: 'error.main' }}>
                                                <DeleteIcon />
                                            </IconButton>
                                            <IconButton edge="end" aria-label="edit" sx={{ color: 'primary.main' }}>
                                                <EditIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}

                                {isAddingCategory ? (
                                    <ListItem sx={{ py: 2, px: 3 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                            }}
                                        >
                                            <Typography variant="body1" sx={{ mr: 2, width: '50px' }}>
                                                Name
                                            </Typography>
                                            <StyledTextField fullWidth size="small" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Coffee" variant="outlined" />
                                            <IconButton
                                                color="primary"
                                                onClick={handleAddCategory}
                                                sx={{
                                                    ml: 1,
                                                    backgroundColor: '#063455',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#002244',
                                                    },
                                                }}
                                            >
                                                <CheckIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => {
                                                    setIsAddingCategory(false);
                                                    setNewCategoryName('');
                                                }}
                                                sx={{ ml: 1 }}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </Box>
                                    </ListItem>
                                ) : (
                                    <Button
                                        fullWidth
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsAddingCategory(true)}
                                        sx={{
                                            py: 2,
                                            borderRadius: 0,
                                            justifyContent: 'center',
                                            textTransform: 'none',
                                        }}
                                    >
                                        Add New Category
                                    </Button>
                                )}
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'flex-end' }}>
                            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                        </DialogActions>
                    </StyledDialog>

                    {/* Payment Type Modal */}
                    <StyledDialog open={activeModal === 'payment-type'} onClose={handleCloseModal} maxWidth="sm" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                        <DialogTitle>
                            <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" component="div">
                                Payment Type
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0 }}>
                            <List sx={{ width: '100%', p: 0 }}>
                                {paymentTypes.map((paymentType) => (
                                    <ListItem
                                        key={paymentType.id}
                                        sx={{
                                            borderBottom: '1px solid #f0f0f0',
                                            py: 2,
                                            px: 3,
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            {paymentType.name}
                                        </Typography>
                                        <ListItemSecondaryAction>
                                            <Switch edge="end" checked={paymentType.active} onChange={() => handlePaymentTypeActiveChange(paymentType.id)} color="primary" />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}

                                {isAddingPaymentType ? (
                                    <ListItem sx={{ py: 2, px: 3 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                            }}
                                        >
                                            <Typography variant="body1" sx={{ mr: 2, width: '50px' }}>
                                                Name
                                            </Typography>
                                            <StyledTextField fullWidth size="small" value={newPaymentType} onChange={(e) => setNewPaymentType(e.target.value)} placeholder="e.g. e-wallet" variant="outlined" />
                                            <IconButton
                                                color="primary"
                                                onClick={handleAddPaymentType}
                                                sx={{
                                                    ml: 1,
                                                    backgroundColor: '#063455',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#002244',
                                                    },
                                                }}
                                            >
                                                <CheckIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => {
                                                    setIsAddingPaymentType(false);
                                                    setNewPaymentType('');
                                                }}
                                                sx={{ ml: 1 }}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </Box>
                                    </ListItem>
                                ) : (
                                    <Button
                                        fullWidth
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsAddingPaymentType(true)}
                                        sx={{
                                            py: 2,
                                            borderRadius: 0,
                                            justifyContent: 'center',
                                            textTransform: 'none',
                                        }}
                                    >
                                        Add New Type
                                    </Button>
                                )}
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'flex-end' }}>
                            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                        </DialogActions>
                    </StyledDialog>

                    {/* Bank Account Modal */}
                    <StyledDialog open={activeModal === 'bank-account'} onClose={handleCloseModal} maxWidth="sm" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                        <DialogTitle>
                            <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" component="div">
                                Bank Account
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0 }}>
                            <List sx={{ width: '100%', p: 0 }}>
                                {bankAccounts.map((bankAccount) => (
                                    <ListItem
                                        key={bankAccount.id}
                                        sx={{
                                            borderBottom: '1px solid #f0f0f0',
                                            py: 2,
                                            px: 3,
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                {bankAccount.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {bankAccount.accountNumber}
                                            </Typography>
                                        </Box>
                                        <ListItemSecondaryAction>
                                            <Switch edge="end" checked={bankAccount.active} onChange={() => handleBankAccountActiveChange(bankAccount.id)} color="primary" />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}

                                {isAddingBankAccount ? (
                                    <Box
                                        sx={{
                                            p: 3,
                                            borderBottom: '1px solid #f0f0f0',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 2,
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ mr: 2, width: '100px' }}>
                                                Bank Name
                                            </Typography>
                                            <StyledTextField fullWidth size="small" value={newBankName} onChange={(e) => setNewBankName(e.target.value)} placeholder="e.g. Sea Bank" variant="outlined" />
                                        </Box>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 2,
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ mr: 2, width: '100px' }}>
                                                Account Number
                                            </Typography>
                                            <StyledTextField fullWidth size="small" placeholder="e.g. BB-08543-0892" variant="outlined" />
                                        </Box>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 2,
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ mr: 2, width: '100px' }}>
                                                Account Owner
                                            </Typography>
                                            <StyledTextField fullWidth size="small" placeholder="e.g. Sahrul" variant="outlined" />
                                        </Box>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <IconButton
                                                color="primary"
                                                onClick={handleAddBankAccount}
                                                sx={{
                                                    ml: 1,
                                                    backgroundColor: '#063455',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#002244',
                                                    },
                                                }}
                                            >
                                                <CheckIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => {
                                                    setIsAddingBankAccount(false);
                                                    setNewBankName('');
                                                }}
                                                sx={{ ml: 1 }}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Button
                                        fullWidth
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsAddingBankAccount(true)}
                                        sx={{
                                            py: 2,
                                            borderRadius: 0,
                                            justifyContent: 'center',
                                            textTransform: 'none',
                                        }}
                                    >
                                        Add New Bank Account
                                    </Button>
                                )}
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'flex-end' }}>
                            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                        </DialogActions>
                    </StyledDialog>

                    {/* Floor & Area Data Modal */}
                    <StyledDialog open={activeModal === 'floor-area-data'} onClose={handleCloseModal} maxWidth="sm" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                        <DialogTitle>
                            <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" component="div">
                                Table Management
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0 }}>
                            <Box sx={{ display: 'flex', mb: 3 }}>
                                <Button
                                    fullWidth
                                    variant={tableManagementTab === 'floor-data' ? 'contained' : 'outlined'}
                                    onClick={() => setTableManagementTab('floor-data')}
                                    sx={{
                                        py: 2,
                                        borderRadius: 0,
                                        backgroundColor: tableManagementTab === 'floor-data' ? '#063455' : 'transparent',
                                        color: tableManagementTab === 'floor-data' ? 'white' : 'inherit',
                                        '&:hover': {
                                            backgroundColor: tableManagementTab === 'floor-data' ? '#1a2530' : 'rgba(0,0,0,0.04)',
                                        },
                                    }}
                                >
                                    Floor Data
                                </Button>
                                <Button
                                    fullWidth
                                    variant={tableManagementTab === 'area-data' ? 'contained' : 'outlined'}
                                    onClick={() => setTableManagementTab('area-data')}
                                    sx={{
                                        py: 2,
                                        borderRadius: 0,
                                        backgroundColor: tableManagementTab === 'area-data' ? '#063455' : 'transparent',
                                        color: tableManagementTab === 'area-data' ? 'white' : 'inherit',
                                        '&:hover': {
                                            backgroundColor: tableManagementTab === 'area-data' ? '#1a2530' : 'rgba(0,0,0,0.04)',
                                        },
                                    }}
                                >
                                    Area Data
                                </Button>
                            </Box>

                            {tableManagementTab === 'floor-data' ? (
                                <Box sx={{ px: 3, pb: 3 }}>
                                    {floors.map((floor) => (
                                        <Box
                                            key={floor.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2,
                                                mb: 2,
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Typography variant="subtitle1">{floor.name}</Typography>
                                            <Switch checked={floor.active} onChange={() => handleFloorActiveChange(floor.id)} color="primary" />
                                        </Box>
                                    ))}

                                    {isAddingFloor ? (
                                        <Box
                                            sx={{
                                                p: 2,
                                                mb: 2,
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mb: 2,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mr: 2,
                                                        width: '50px',
                                                    }}
                                                >
                                                    Name
                                                </Typography>
                                                <StyledTextField fullWidth size="small" value={newFloorName} onChange={(e) => setNewFloorName(e.target.value)} placeholder="e.g. Floor 3" variant="outlined" />
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                <IconButton
                                                    color="primary"
                                                    onClick={handleAddFloor}
                                                    sx={{
                                                        ml: 1,
                                                        backgroundColor: '#063455',
                                                        color: 'white',
                                                        '&:hover': {
                                                            backgroundColor: '#002244',
                                                        },
                                                    }}
                                                >
                                                    <CheckIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => {
                                                        setIsAddingFloor(false);
                                                        setNewFloorName('');
                                                    }}
                                                    sx={{ ml: 1 }}
                                                >
                                                    <ClearIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Button
                                            fullWidth
                                            startIcon={<AddIcon />}
                                            onClick={() => setIsAddingFloor(true)}
                                            sx={{
                                                py: 2,
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                                justifyContent: 'center',
                                                textTransform: 'none',
                                            }}
                                        >
                                            Add New Floor
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="body1">Area Data content would go here.</Typography>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'flex-end' }}>
                            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                        </DialogActions>
                    </StyledDialog>

                    {/* Printing Device Modal */}
                    <StyledDialog open={activeModal === 'printing-device'} onClose={handleCloseModal} maxWidth="sm" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                        <DialogTitle>
                            <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" component="div">
                                Printing Device
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ p: 0 }}>
                            <List sx={{ width: '100%', p: 0 }}>
                                {printingDevices.map((device) => (
                                    <ListItem
                                        key={device.id}
                                        sx={{
                                            borderBottom: '1px solid #f0f0f0',
                                            py: 2,
                                            px: 3,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <PrintIcon sx={{ mr: 2 }} />
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                    {device.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {device.location}
                                                    {!device.connected && (
                                                        <Typography component="span" color="error" sx={{ ml: 1 }}>
                                                            - Not Connected
                                                        </Typography>
                                                    )}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <ListItemSecondaryAction>
                                            <Switch edge="end" checked={device.active} onChange={() => handlePrintingDeviceActiveChange(device.id)} color="primary" />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}

                                <Button
                                    fullWidth
                                    startIcon={<AddIcon />}
                                    sx={{
                                        py: 2,
                                        borderRadius: 0,
                                        justifyContent: 'center',
                                        textTransform: 'none',
                                    }}
                                >
                                    Add New Device
                                </Button>
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'flex-end' }}>
                            <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                        </DialogActions>
                    </StyledDialog>

                    {/* Other modals would be implemented similarly */}
                    {settingsOptions
                        .filter((option) => !['store-info', 'notification', 'dine-in', 'categories-menu', 'payment-type', 'bank-account', 'floor-area-data', 'printing-device'].includes(option.id))
                        .map((option) => (
                            <StyledDialog key={option.id} open={activeModal === option.id} onClose={handleCloseModal} maxWidth="md" fullWidth scroll="paper" TransitionProps={{ onEntering: undefined }}>
                                <DialogTitle>
                                    <IconButton edge="start" color="inherit" onClick={handleCloseModal} aria-label="close" sx={{ mr: 1 }}>
                                        <CloseIcon />
                                    </IconButton>
                                    <Typography variant="h6" component="div">
                                        {option.title}
                                    </Typography>
                                </DialogTitle>
                                <DialogContent>
                                    <Typography>{option.title} settings content would go here.</Typography>
                                </DialogContent>
                                <DialogActions sx={{ justifyContent: 'flex-end' }}>
                                    <CancelButton onClick={handleCloseModal}>Cancel</CancelButton>
                                    <SaveButton onClick={handleSave}>Save Changes</SaveButton>
                                </DialogActions>
                            </StyledDialog>
                        ))}
                </div>
            {/* </div> */}
        </>
    );
};
SettingDashboard.layout = (page) => <POSLayout>{page}</POSLayout>;
export default SettingDashboard;
