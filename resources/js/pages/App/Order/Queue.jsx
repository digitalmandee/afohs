import SideNav from '@/components/App/SideBar/SideNav';
import { router } from '@inertiajs/react';
import { Add, ArrowBack, Visibility } from '@mui/icons-material';
import { Avatar, Button, Card, CardContent, IconButton, ThemeProvider, Typography, createTheme } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';

const OrderQueue = ({ orders2 }) => {
    const [open, setOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('All Order');
    const [activeFilter, setActiveFilter] = useState('All Type');

    const tabs = ['Waiting To Payment', 'Cooking Process', 'Ready To Serve'];

    const filters = ['All Type', 'Dine In', 'Pick Up', 'Delivery', 'Takeaway', 'Reservation'];

    const orders = [
        {
            id: 'T2',
            customer: 'Qafi Latif',
            status: 'Ready to serve',
            items: [
                {
                    name: 'Cappuccino',
                    quantity: 2,
                    unitPrice: 5.0,
                    price: 10.0,
                    completed: true,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: false,
                },
            ],
            totalItems: 4,
            completedItems: 1,
            totalPrice: 47.0,
            hasVIP: true,
            orderNumber: '001',
            color: '#0C67AA',
        },
        {
            id: 'T3',
            customer: 'Hamid Indra',
            status: 'Waiting to payment',
            items: [
                {
                    name: 'Cappuccino',
                    quantity: 2,
                    unitPrice: 5.0,
                    price: 10.0,
                    completed: true,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: true,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: false,
                },
            ],
            totalItems: 4,
            completedItems: 3,
            totalPrice: 47.0,
            hasVIP: true,
            orderNumber: '001',
            color: '#0C67AA',
        },
        {
            id: 'T4',
            customer: 'Miles Esther',
            status: 'Cooking process',
            items: [
                {
                    name: 'Cappuccino',
                    quantity: 2,
                    unitPrice: 5.0,
                    price: 10.0,
                    completed: true,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: false,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: false,
                },
            ],
            totalItems: 4,
            completedItems: 1,
            totalPrice: 47.0,
            hasVIP: true,
            orderNumber: '001',
            color: '#0C67AA',
        },
        {
            id: 'DE',
            customer: 'Miles Esther',
            status: 'Cooking process',
            items: [
                {
                    name: 'Orange juice',
                    quantity: 2,
                    unitPrice: 5.0,
                    price: 10.0,
                    completed: false,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: false,
                },
            ],
            totalItems: 4,
            completedItems: 0,
            totalPrice: 10.0,
            hasVIP: false,
            orderNumber: '001',
            color: '#129BFF',
            deliveryIcon: true,
        },
        {
            id: 'PI',
            customer: 'Black Marvin',
            status: 'Cooking process',
            items: [
                {
                    name: 'Cappuccino',
                    quantity: 2,
                    unitPrice: 5.0,
                    price: 10.0,
                    completed: false,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: false,
                },
            ],
            totalItems: 4,
            completedItems: 0,
            totalPrice: 20.0,
            hasVIP: false,
            orderNumber: '001',
            color: '#22D7A6',
            pickupIcon: true,
        },
        {
            id: 'PI',
            customer: 'Wade Warren',
            status: 'Cooking process',
            items: [
                {
                    name: 'Cappuccino',
                    quantity: 2,
                    unitPrice: 5.0,
                    price: 10.0,
                    completed: false,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: false,
                },
                {
                    name: 'Soda Beverage',
                    quantity: 3,
                    unitPrice: 5.0,
                    price: 15.0,
                    completed: false,
                },
            ],
            totalItems: 4,
            completedItems: 0,
            totalPrice: 25.0,
            hasVIP: true,
            orderNumber: '001',
            color: '#22D7A6',
            pickupIcon: true,
        },
    ];

    return (
        <>
            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    // bgcolor: '#f5f7fa'
                }}
            >
                    <div
                        className="container-fluid p-0"
                        style={{
                            backgroundColor: '#f5f5f5',
                            minHeight: '100vh',
                        }}
                    >
                        {/* Header */}
                        <div className="p-3" style={{ backgroundColor: '#f5f5f5' }}>
                            <div className="d-flex align-items-center">
                                <IconButton
                                    size="small"
                                    style={{
                                        color: '#063455',
                                        width: 24,
                                        height: 24,
                                    }}
                                >
                                    <ArrowBack onClick={() => router.visit('/')} />
                                </IconButton>
                                <Typography
                                    variant="h5"
                                    className="ms-2"
                                    style={{
                                        color: '#063455',
                                        fontSize: '30px',
                                        fontWeight: 500,
                                    }}
                                >
                                    Order Queue
                                </Typography>
                            </div>

                            {/* Status Tabs */}
                            <div
                                className="d-flex mt-3 overflow-auto"
                                style={{
                                    gap: '10px',
                                    backgroundColor: '#F0F0F0',
                                    width: '100%',
                                    paddingTop: '20px',
                                    paddingBottom: '20px',
                                    paddingLeft: '20px',
                                    borderRadius: '8px',
                                    height: '80px',
                                }}
                            >
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                        setActiveTab('All Order');
                                        router.visit('/all/order');
                                    }}
                                    style={{
                                        borderRadius: '999px',
                                        textTransform: 'none',
                                        backgroundColor: activeTab === 'All Order' ? '#0A2647' : 'transparent',
                                        color: activeTab === 'All Order' ? '#FFFFFF' : '#063455',
                                        border: `1px solid #063455`,
                                        boxShadow: 'none',
                                        whiteSpace: 'nowrap',
                                        fontSize: '16px',
                                        padding: '0px 20px',
                                        fontWeight: 500,
                                    }}
                                >
                                    All Order
                                </Button>

                                {tabs.map((tab) => (
                                    <Button
                                        key={tab}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            borderRadius: '999px',
                                            textTransform: 'none',
                                            backgroundColor: activeTab === tab ? '#0A2647' : 'transparent',
                                            color: activeTab === tab ? '#FFFFFF' : '#063455',
                                            border: `1px solid #063455`,
                                            boxShadow: 'none',
                                            whiteSpace: 'nowrap',
                                            fontSize: '16px',
                                            padding: '0px 20px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {tab}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Order Count and Filters */}
                        <div
                            className="d-flex mx-3 mt-3 overflow-auto"
                            style={{
                                // gap: "10px",
                                backgroundColor: '#FFFFFF',
                                // width: "100%",
                                paddingTop: '20px',
                                paddingBottom: '20px',
                                paddingLeft: '20px',
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <div className="p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <Typography
                                            variant="h4"
                                            style={{
                                                fontSize: '34px',
                                                fontWeight: 600,
                                                color: '#000000',
                                            }}
                                        >
                                            {orders2.length}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            className="ms-1 mt-1"
                                            style={{
                                                color: '#121212',
                                                fontSize: '16px',
                                            }}
                                        >
                                            Order Queue
                                        </Typography>
                                    </div>

                                    <div className="d-flex" style={{ overflowX: 'auto' }}>
                                        {filters.map((filter, index) => (
                                            <Button
                                                key={index}
                                                variant="outlined"
                                                size="small"
                                                onClick={() => setActiveFilter(filter)}
                                                style={{
                                                    backgroundColor: activeFilter === filter ? '#37474F' : '#fff',
                                                    color: activeFilter === filter ? '#FFFFFF' : '#121212',
                                                    border: '1px solid #E0E0E0',
                                                    borderRadius: '0px',
                                                    textTransform: 'none',
                                                    fontSize: '14px',
                                                    fontWeight: activeFilter === filter ? 500 : 400,
                                                    padding: '6px 16px',
                                                    whiteSpace: 'nowrap',
                                                    minWidth: 'auto',
                                                    boxShadow: 'none',
                                                }}
                                            >
                                                {filter}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Order Cards */}
                            <div className="row g-2 p-3">
                                {orders.map((order, index) => (
                                    <div className="col-md-4" key={index}>
                                        <Card
                                            className="h-100 shadow-sm"
                                            style={{
                                                borderRadius: '8px',
                                                border: '1px solid #e0e0e0',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            }}
                                        >
                                            <CardContent className="p-3">
                                                <div className="d-flex justify-content-between mb-3">
                                                    <div className="d-flex">
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: order.color,
                                                                width: 40,
                                                                height: 40,
                                                                fontSize: '16px',
                                                                fontWeight: '500',
                                                            }}
                                                        >
                                                            {order.id}
                                                        </Avatar>
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: '#E3E3E3',
                                                                width: 40,
                                                                height: 40,
                                                                ml: 1,
                                                            }}
                                                        >
                                                            {/* <LocalDining fontSize="small" style={{ color: "#757575" }} /> */}
                                                            <img
                                                                src="/assets/food-tray.png"
                                                                alt=""
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                }}
                                                            />
                                                        </Avatar>
                                                    </div>
                                                    <div className="d-flex">
                                                        {order.id === 'T3' && (
                                                            <img
                                                                src="/assets/camera.png"
                                                                alt="Credit Card"
                                                                style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                        )}
                                                        {order.id === 'T4' && (
                                                            <img
                                                                src="/assets/camera.png"
                                                                alt="Credit Card"
                                                                style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                        )}
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            sx={{
                                                                minWidth: '40px',
                                                                height: '40px',
                                                                bgcolor: '#063455',
                                                                borderRadius: '0',
                                                                '&:hover': {
                                                                    bgcolor: '#002244',
                                                                },
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <Add fontSize="small" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <div className="d-flex align-items-center">
                                                            <Typography
                                                                variant="subtitle1"
                                                                style={{
                                                                    fontSize: '18px',
                                                                    fontWeight: 500,
                                                                    color: '#121212',
                                                                }}
                                                            >
                                                                {order.customer}
                                                            </Typography>
                                                            {order.hasVIP && (
                                                                <div
                                                                    className="ms-2"
                                                                    style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: '#FFA500',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <img
                                                                        src="/assets/Diamond.png"
                                                                        alt=""
                                                                        style={{
                                                                            width: 24,
                                                                            height: 24,
                                                                            marginLeft: 5,
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Typography
                                                            variant="body2"
                                                            style={{
                                                                fontSize: '14px',
                                                                color: '#7F7F7F',
                                                            }}
                                                        >
                                                            {order.totalItems} Items (
                                                            {order.id === 'T2' ? (
                                                                <span
                                                                    style={{
                                                                        color: '#22D7A6',
                                                                    }}
                                                                >
                                                                    1 Complete
                                                                </span>
                                                            ) : order.id === 'T3' ? (
                                                                <span
                                                                    style={{
                                                                        color: '#22D7A6',
                                                                    }}
                                                                >
                                                                    3 Complete
                                                                </span>
                                                            ) : order.id === 'T4' ? (
                                                                <span
                                                                    style={{
                                                                        color: '#22D7A6',
                                                                    }}
                                                                >
                                                                    1 Complete
                                                                </span>
                                                            ) : null}
                                                            )
                                                        </Typography>
                                                    </div>
                                                    <div className="text-end">
                                                        <Typography
                                                            variant="subtitle1"
                                                            style={{
                                                                fontWeight: 500,
                                                                fontSize: '16px',
                                                            }}
                                                        >
                                                            Rs {order.totalPrice.toFixed(2)}
                                                        </Typography>
                                                    </div>
                                                </div>

                                                {/* Order Items */}
                                                <div className="mt-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                                                            <div className="d-flex align-items-center">
                                                                <div
                                                                    className="me-2"
                                                                    style={{
                                                                        width: '8px',
                                                                        height: '8px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: item.completed ? '#4caf50' : '#bdbdbd',
                                                                    }}
                                                                ></div>
                                                                <Typography
                                                                    variant="body2"
                                                                    style={{
                                                                        fontSize: '13px',
                                                                        color: '#616161',
                                                                    }}
                                                                >
                                                                    {item.name}
                                                                </Typography>
                                                            </div>
                                                            <div
                                                                className="d-flex align-items-center"
                                                                style={{
                                                                    fontSize: '13px',
                                                                }}
                                                            >
                                                                <span className="text-muted me-4">
                                                                    {item.quantity} × Rs {item.unitPrice.toFixed(2)}
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    Rs {item.price.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {order.id === 'T2' && (
                                                        <div className="mt-1 mb-2">
                                                            <Typography
                                                                variant="body2"
                                                                style={{
                                                                    fontSize: '13px',
                                                                    color: '#2196f3',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                Show more (3)
                                                            </Typography>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Order Actions */}
                                                <div className="d-flex justify-content-between align-items-center mt-4">
                                                    <div
                                                        style={{
                                                            backgroundColor: '#E3E3E3',
                                                            padding: '4px 10px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            color: '#616161',
                                                        }}
                                                    >
                                                        #{order.orderNumber}
                                                    </div>
                                                    <div>
                                                        {order.status === 'Ready to serve' && (
                                                            <Button
                                                                variant="text"
                                                                size="small"
                                                                startIcon={<Visibility fontSize="small" />}
                                                                style={{
                                                                    backgroundColor: '#e8f5e9',
                                                                    color: '#2e7d32',
                                                                    textTransform: 'none',
                                                                    fontSize: '12px',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '4px',
                                                                }}
                                                            >
                                                                Ready to serve
                                                            </Button>
                                                        )}
                                                        {order.status === 'Waiting to payment' && (
                                                            <Button
                                                                variant="text"
                                                                size="small"
                                                                startIcon={
                                                                    <img
                                                                        src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNyZWRpdC1jYXJkIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHg9IjIiIHk9IjUiIHJ4PSIyIi8+PHBhdGggZD0iTTIgMTBoMjAiLz48L3N2Zz4="
                                                                        alt="Payment"
                                                                        style={{
                                                                            width: '16px',
                                                                            height: '16px',
                                                                            marginRight: '4px',
                                                                        }}
                                                                    />
                                                                }
                                                                style={{
                                                                    backgroundColor: '#fff8e1',
                                                                    color: '#f57c00',
                                                                    textTransform: 'none',
                                                                    fontSize: '12px',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '4px',
                                                                }}
                                                            >
                                                                Waiting to payment
                                                            </Button>
                                                        )}
                                                        {order.status === 'Cooking process' && (
                                                            <Button
                                                                variant="text"
                                                                size="small"
                                                                startIcon={
                                                                    <img
                                                                        src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNvb2tpbmctcG90Ij48cGF0aCBkPSJNMTIgMTJhOCA4IDAgMCAwIDgtOEgxMmE4IDggMCAwIDAgOCA4Ii8+PHBhdGggZD0iTTEyIDEyYTggOCAwIDAgMSA4IDhIMTJhOCA4IDAgMCAxIDgtOCIvPjxwYXRoIGQ9Ik0yMCA4YTggOCAwIDAgMC04LTgiLz48cGF0aCBkPSJNNCAxNmE0IDQgMCAwIDEgNC00aDhhNCA0IDAgMCAxIDQgNHY0SDR2LTRaIi8+PC9zdmc+"
                                                                        alt="Cooking"
                                                                        style={{
                                                                            width: '16px',
                                                                            height: '16px',
                                                                            marginRight: '4px',
                                                                        }}
                                                                    />
                                                                }
                                                                style={{
                                                                    backgroundColor: '#e1f5fe',
                                                                    color: '#0288d1',
                                                                    textTransform: 'none',
                                                                    fontSize: '12px',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '4px',
                                                                }}
                                                            >
                                                                Cooking process
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
            </div>
        </>
    );
};
OrderQueue.layout = (page) => page;
export default OrderQueue;
