'use client';

import SideNav from '@/components/App/SideBar/SideNav';
import {
    Close as CloseIcon,
    DirectionsCar as DeliveryIcon,
    LocalDining as DiningIcon,
    FilterAlt as FilterIcon,
    Print as PrintIcon,
} from '@mui/icons-material';
import {
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Typography,
} from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const OrderManagement = () => {
    const [open, setOpen] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('All Order');

    // Filter states
    const [datePeriod, setDatePeriod] = useState('');
    const [fromDate, setFromDate] = useState('Jan 01, 2024');
    const [toDate, setToDate] = useState('August 01, 2024');
    const [statusFilters, setStatusFilters] = useState(['All']);
    const [orderTypeFilters, setOrderTypeFilters] = useState(['All']);

    const handleFilterOpen = () => {
        setFilterOpen(true);
    };

    const handleFilterClose = () => {
        setFilterOpen(false);
    };

    // Modify the handleTabChange function to filter orders
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleDatePeriodChange = (period) => {
        setDatePeriod(period);
    };

    const handleStatusFilterChange = (status) => {
        if (status === 'All') {
            setStatusFilters(['All']);
        } else {
            const newFilters = statusFilters.includes('All')
                ? [status]
                : statusFilters.includes(status)
                  ? statusFilters.filter((s) => s !== status)
                  : [...statusFilters, status];

            setStatusFilters(newFilters.length ? newFilters : ['All']);
        }
    };

    const handleOrderTypeFilterChange = (type) => {
        if (type === 'All') {
            setOrderTypeFilters(['All']);
        } else {
            const newFilters = orderTypeFilters.includes('All')
                ? [type]
                : orderTypeFilters.includes(type)
                  ? orderTypeFilters.filter((t) => t !== type)
                  : [...orderTypeFilters, type];

            setOrderTypeFilters(newFilters.length ? newFilters : ['All']);
        }
    };

    const resetFilters = () => {
        setDatePeriod('');
        setFromDate('Jan 01, 2024');
        setToDate('August 01, 2024');
        setStatusFilters(['All']);
        setOrderTypeFilters(['All']);
    };

    const applyFilters = () => {
        // Apply filter logic here
        handleFilterClose();
    };

    // Sample order data
    const orders = [
        {
            id: '#009',
            table: 'T9',
            time: '00:04',
            items: [
                {
                    name: 'Cappucino',
                    quantity: 2,
                    checked: false,
                    details: { temperature: 'Ice', size: 'Large', sugar: 'Normal', topping: 'Boba' },
                },
                { name: 'Soda Beverage', quantity: 3, checked: false },
                { name: 'French Toast Sugar', quantity: 3, checked: false },
                { name: 'Chocolate Croissant', quantity: 2, checked: false },
            ],
            status: 'New Order',
        },
        {
            id: '#008',
            table: 'T1',
            time: '02:02',
            items: [
                {
                    name: 'Cappucino',
                    quantity: 1,
                    checked: false,
                    details: { temperature: 'Ice', size: 'Regular', sugar: 'No' },
                },
                { name: 'Sandwich vegan', quantity: 1, checked: false },
            ],
            status: 'New Order',
            action: 'Start',
        },
        {
            id: '#008',
            table: 'P1',
            time: '00:04',
            items: [
                { name: 'Eggs Benedict Burger', quantity: 1, checked: false },
                { name: 'Seafood Lunch', quantity: 3, checked: false },
            ],
            status: 'New Order',
            action: 'Start',
        },
        {
            id: '#006',
            table: 'T8',
            time: '08:10',
            items: [
                {
                    name: 'Ristretto Bianco',
                    quantity: 3,
                    checked: true,
                    details: { temperature: 'Hot', size: 'Medium', sugar: 'Normal' },
                },
                { name: 'Buttermilk waffle', quantity: 1, checked: false },
                { name: 'French Toast Sugar', quantity: 1, checked: false },
                { name: 'Chocolate Croissant', quantity: 1, checked: false },
            ],
            status: 'Process',
            action: 'Finish',
        },
        {
            id: '#005',
            table: 'T4',
            time: '08:15',
            items: [
                {
                    name: 'Ristretto Bianco',
                    quantity: 3,
                    checked: true,
                    details: { temperature: 'Hot', size: 'Medium', sugar: 'Normal' },
                },
                { name: 'Buttermilk waffle', quantity: 1, checked: true },
                { name: 'French Toast Sugar', quantity: 1, checked: true },
                { name: 'Chocolate Croissant', quantity: 1, checked: false },
            ],
            status: 'Process',
        },
        {
            id: '#001',
            table: 'T12',
            time: '12:02',
            items: [
                {
                    name: 'Vegan Iced Latte',
                    quantity: 1,
                    checked: true,
                    details: { temperature: 'Ice', size: 'Large', sugar: 'No' },
                },
                { name: 'Sandwich vegan', quantity: 2, checked: true },
            ],
            status: 'Done',
            action: 'Print Receipt',
        },
        {
            id: '#002',
            table: 'DE',
            time: '12:02',
            items: [
                {
                    name: 'Orange Juice',
                    quantity: 1,
                    checked: true,
                    details: { temperature: 'Ice', size: 'Large', sugar: 'No' },
                },
                { name: 'Eggs Benedict Burger', quantity: 2, checked: true },
            ],
            status: 'Done',
            action: 'Print Receipt',
        },
        {
            id: '#001',
            table: 'T2',
            time: '02:02',
            items: [
                {
                    name: 'Cappucino',
                    quantity: 2,
                    checked: true,
                    details: { refund: { reason: 'Incorrect Order', amount: '$4.00' } },
                },
                { name: 'Soda Beverage', quantity: 3, checked: true },
                { name: 'French Toast Sugar', quantity: 3, checked: true },
                { name: 'Chocolate Croissant', quantity: 2, checked: false },
            ],
            status: 'Refund',
            showMore: true,
            action: 'Refund',
        },
        {
            id: '#001',
            table: 'T12',
            time: '12:02',
            items: [
                {
                    name: 'Vegan Iced Latte',
                    quantity: 1,
                    checked: true,
                    details: { temperature: 'Ice', size: 'Large', sugar: 'No' },
                },
                { name: 'Sandwich vegan', quantity: 2, checked: true },
            ],
            status: 'Done',
            action: 'Print Receipt',
        },
        {
            id: '#001',
            table: 'T2',
            time: '12:02',
            items: [
                {
                    name: 'Vegan Iced Latte',
                    quantity: 1,
                    checked: true,
                    details: { temperature: 'Ice', size: 'Large', sugar: 'No' },
                },
                { name: 'Sandwich vegan', quantity: 2, checked: true },
            ],
            status: 'Done',
            action: 'Print Receipt',
        },
        {
            id: '#001',
            table: 'T2',
            time: '02:02',
            items: [
                {
                    name: 'Cappucino',
                    quantity: 2,
                    checked: true,
                    details: { refund: { reason: 'Customer Change Mind', amount: '$10.00' } },
                },
                { name: 'Soda Beverage', quantity: 3, checked: true },
                { name: 'French Toast Sugar', quantity: 3, checked: true },
                { name: 'Chocolate Croissant', quantity: 2, checked: false },
            ],
            status: 'Refund',
            showMore: true,
            action: 'Refund',
        },
    ];

    // Filter tabs
    const tabs = [
        { id: 'All Order', count: null },
        { id: 'New Order', count: 3 },
        { id: 'Process', count: 3 },
        { id: 'Done', count: 3 },
        { id: 'Refund', count: 3 },
    ];

    // Date period options
    const datePeriods = ['Yesterday', 'Last Week', 'Last Month', 'Last 3 Month', 'Last Year', 'Custom Date'];

    // Status filter options
    const statusOptions = ['All', 'New Order', 'Refund', 'Process', 'Done'];

    // Order type filter options
    const orderTypeOptions = ['All', 'Dine', 'Pickup', 'Delivery', 'Takeaway', 'Reservation'];

    // Filter orders based on active tab
    const filteredOrders = orders.filter((order) => {
        if (activeTab === 'All Order') {
            return true;
        } else {
            return order.status === activeTab;
        }
    });

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
                <div className="container-fluid p-3">
                    {/* Header with tabs and filter */}
                    <div
                        className="d-flex justify-content-between align-items-center mb-3 p-3"
                        style={{ backgroundColor: '#eeeeee', borderRadius: '10px' }}
                    >
                        <div className="d-flex">
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'contained' : 'outlined'}
                                    style={{
                                        marginRight: '10px',
                                        borderRadius: '20px',
                                        backgroundColor: activeTab === tab.id ? '#063455' : 'white',
                                        color: activeTab === tab.id ? 'white' : '#063455',
                                        textTransform: 'none',
                                        padding: '6px 16px',
                                        border: '1px solid #063455',
                                    }}
                                    onClick={() => handleTabChange(tab.id)}
                                >
                                    {tab.id} {tab.count !== null && `(${tab.count})`}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={handleFilterOpen}
                            style={{
                                borderRadius: '0px',
                                color: '#063455',
                                border: '1px solid #063455',
                                textTransform: 'none',
                            }}
                        >
                            Filter
                        </Button>
                    </div>

                    {/* Order cards grid */}
                    <div className="row m-1 p-2" style={{ backgroundColor: '#fbfbfb', borderRadius: '10px' }}>
                        {filteredOrders.map((order, index) => (
                            <div key={index} className="col-md-3 mb-3">
                                <Paper elevation={1} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                    {/* Order header */}
                                    <div
                                        style={{
                                            backgroundColor:
                                                order.status === 'Done'
                                                    ? '#4CAF50'
                                                    : order.status === 'Process'
                                                      ? '#1565C0'
                                                      : order.status === 'New Order'
                                                        ? '#063455'
                                                        : '#00BCD4',
                                            color: 'white',
                                            padding: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div>
                                            <Typography variant="h6" style={{ fontWeight: 'bold' }}>
                                                {order.id}
                                            </Typography>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="body2">{order.time}</Typography>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div
                                                style={{
                                                    backgroundColor: order.table.startsWith('T')
                                                        ? '#1976D2'
                                                        : order.table === 'DE'
                                                          ? '#2E7D32'
                                                          : order.table === 'P1'
                                                            ? '#0D47A1'
                                                            : '#1976D2',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginRight: '8px',
                                                }}
                                            >
                                                <Typography variant="body2">{order.table}</Typography>
                                            </div>
                                            <IconButton size="small" style={{ color: 'white' }}>
                                                {order.table === 'DE' ? <DeliveryIcon /> : <DiningIcon />}
                                            </IconButton>
                                        </div>
                                    </div>

                                    {/* Order items */}
                                    <div style={{ padding: '12px' }}>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} style={{ marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body1">{item.name}</Typography>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="body2" style={{ marginRight: '8px' }}>
                                                            {item.quantity}x
                                                        </Typography>
                                                        <Checkbox
                                                            checked={item.checked}
                                                            size="small"
                                                            style={{
                                                                color: item.checked ? '#1976D2' : undefined,
                                                                padding: '2px',
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Item details if available */}
                                                {item.details && !item.details.refund && (
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            fontSize: '12px',
                                                            color: '#666',
                                                            marginTop: '4px',
                                                        }}
                                                    >
                                                        {Object.entries(item.details).map(([key, value]) => (
                                                            <React.Fragment key={key}>
                                                                <div>{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                                                                <div style={{ textAlign: 'right' }}>{value}</div>
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Refund details if available */}
                                                {item.details && item.details.refund && (
                                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <div>Reason</div>
                                                            <div>{item.details.refund.reason}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <div>Refund Amount</div>
                                                            <div>{item.details.refund.amount}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Show more button */}
                                        {order.showMore && (
                                            <Button
                                                variant="text"
                                                size="small"
                                                style={{ color: '#666', textTransform: 'none', padding: '0', fontSize: '12px' }}
                                            >
                                                Show More (2)
                                            </Button>
                                        )}
                                    </div>

                                    {/* Order actions */}
                                    <div
                                        style={{
                                            borderTop: '1px solid #eee',
                                            padding: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <IconButton size="small">
                                            <PrintIcon fontSize="small" />
                                        </IconButton>

                                        {order.action === 'Start' && (
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                style={{
                                                    marginLeft: '8px',
                                                    backgroundColor: '#063455',
                                                    textTransform: 'none',
                                                }}
                                            >
                                                Start
                                            </Button>
                                        )}

                                        {order.action === 'Finish' && (
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                style={{
                                                    marginLeft: '8px',
                                                    backgroundColor: '#1976D2',
                                                    textTransform: 'none',
                                                }}
                                            >
                                                Finish
                                            </Button>
                                        )}

                                        {order.action === 'Print Receipt' && (
                                            <Button
                                                variant="text"
                                                startIcon={<PrintIcon />}
                                                style={{
                                                    marginLeft: '8px',
                                                    color: '#333',
                                                    textTransform: 'none',
                                                }}
                                            >
                                                Print Receipt
                                            </Button>
                                        )}

                                        {order.action === 'Refund' && (
                                            <div style={{ display: 'flex', marginLeft: '8px' }}>
                                                <Button
                                                    variant="outlined"
                                                    style={{
                                                        marginRight: '4px',
                                                        textTransform: 'none',
                                                        borderColor: '#e0e0e0',
                                                        color: '#333',
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    style={{
                                                        backgroundColor: '#00BCD4',
                                                        textTransform: 'none',
                                                        color: 'white',
                                                    }}
                                                >
                                                    Refund
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Paper>
                            </div>
                        ))}
                    </div>

                    <Dialog
                        open={filterOpen}
                        onClose={handleFilterClose}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{
                            style: {
                                borderRadius: '10px',
                                position: 'fixed',
                                right: '0px',
                                margin: 0,
                                width: '400px',
                                maxHeight: '100vh',
                                overflowY: 'auto',
                            },
                        }}
                    >
                        <DialogTitle
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 24px 12px',
                            }}
                        >
                            <Typography variant="h6" style={{ fontWeight: 600 }}>
                                Menu Filter
                            </Typography>
                            <IconButton onClick={handleFilterClose} size="small">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent style={{ padding: '0 24px' }}>
                            {/* Date Period */}
                            <div style={{ marginBottom: '24px' }}>
                                <Typography variant="subtitle2" style={{ marginBottom: '12px' }}>
                                    Date Period
                                </Typography>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {datePeriods.slice(0, 5).map((period) => (
                                        <Chip
                                            key={period}
                                            label={period}
                                            onClick={() => handleDatePeriodChange(period)}
                                            variant={datePeriod === period ? 'filled' : 'outlined'}
                                            style={{
                                                backgroundColor: datePeriod === period ? '#1976D2' : '#E3F2FD',
                                                color: datePeriod === period ? 'white' : '#1976D2',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                            }}
                                        />
                                    ))}
                                    <Chip
                                        label="Custom Date"
                                        onClick={() => handleDatePeriodChange('Custom Date')}
                                        variant={datePeriod === 'Custom Date' ? 'filled' : 'outlined'}
                                        style={{
                                            backgroundColor: datePeriod === 'Custom Date' ? '#063455' : 'transparent',
                                            color: datePeriod === 'Custom Date' ? 'white' : '#063455',
                                            borderRadius: '16px',
                                            border: '1px solid #063455',
                                            fontSize: '13px',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Date Range */}
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ flex: 1 }}>
                                    <Typography variant="body2" style={{ marginBottom: '8px' }}>
                                        From
                                    </Typography>
                                    <FormControl fullWidth variant="outlined" size="small">
                                        <Select value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ borderRadius: '6px' }}>
                                            <MenuItem value="Jan 01, 2024">Jan 01, 2024</MenuItem>
                                            <MenuItem value="Feb 01, 2024">Feb 01, 2024</MenuItem>
                                            <MenuItem value="Mar 01, 2024">Mar 01, 2024</MenuItem>
                                        </Select>
                                    </FormControl>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Typography variant="body2" style={{ marginBottom: '8px' }}>
                                        To
                                    </Typography>
                                    <FormControl fullWidth variant="outlined" size="small">
                                        <Select value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ borderRadius: '6px' }}>
                                            <MenuItem value="August 01, 2024">August 01, 2024</MenuItem>
                                            <MenuItem value="July 01, 2024">July 01, 2024</MenuItem>
                                            <MenuItem value="June 01, 2024">June 01, 2024</MenuItem>
                                        </Select>
                                    </FormControl>
                                </div>
                            </div>

                            {/* Status */}
                            <div style={{ marginBottom: '24px' }}>
                                <Typography variant="subtitle2" style={{ marginBottom: '12px' }}>
                                    Status
                                </Typography>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {statusOptions.map((status) => (
                                        <Chip
                                            key={status}
                                            label={status}
                                            onClick={() => handleStatusFilterChange(status)}
                                            variant={statusFilters.includes(status) ? 'filled' : 'outlined'}
                                            style={{
                                                backgroundColor: statusFilters.includes(status)
                                                    ? status === 'All'
                                                        ? '#063455'
                                                        : status === 'New Order'
                                                          ? '#1976D2'
                                                          : '#E3F2FD'
                                                    : 'transparent',
                                                color: statusFilters.includes(status)
                                                    ? status === 'All' || status === 'New Order'
                                                        ? 'white'
                                                        : '#1976D2'
                                                    : 'inherit',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Order Type */}
                            <div style={{ marginBottom: '24px' }}>
                                <Typography variant="subtitle2" style={{ marginBottom: '12px' }}>
                                    Order Type
                                </Typography>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {orderTypeOptions.map((type) => (
                                        <Chip
                                            key={type}
                                            label={type}
                                            onClick={() => handleOrderTypeFilterChange(type)}
                                            variant={orderTypeFilters.includes(type) ? 'filled' : 'outlined'}
                                            style={{
                                                backgroundColor: orderTypeFilters.includes(type)
                                                    ? type === 'All'
                                                        ? '#063455'
                                                        : '#E3F2FD'
                                                    : 'transparent',
                                                color: orderTypeFilters.includes(type) ? (type === 'All' ? 'white' : '#1976D2') : 'inherit',
                                                borderRadius: '16px',
                                                fontSize: '13px',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </DialogContent>

                        <DialogActions style={{ padding: '16px 24px', justifyContent: 'space-between' }}>
                            <Button onClick={handleFilterClose} style={{ color: '#666', textTransform: 'none' }}>
                                Cancel
                            </Button>
                            <div>
                                <Button
                                    onClick={resetFilters}
                                    variant="outlined"
                                    style={{
                                        marginRight: '8px',
                                        textTransform: 'none',
                                        borderColor: '#e0e0e0',
                                    }}
                                >
                                    Reset Filter
                                </Button>
                                <Button
                                    onClick={applyFilters}
                                    variant="contained"
                                    style={{
                                        backgroundColor: '#063455',
                                        color: '#fff',
                                        textTransform: 'none',
                                    }}
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </>
    );
};
OrderManagement.layout = (page) => page;
export default OrderManagement;
