// import SideNav from '@/components/App/SideBar/SideNav';
import { AccessTime, FilterAlt as FilterIcon } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import { Avatar, Box, Button, Drawer, FormControl, Grid, InputBase, InputLabel, List, ListItem, ListItemText, MenuItem, Pagination, Paper, Select, Typography, Autocomplete, TextField, Chip, Dialog, DialogContent, DialogTitle, DialogActions, CircularProgress } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import CancelOrder from './Cancel';
import EditOrderModal from './EditModal';
import OrderFilter from './Filter';
import { router } from '@inertiajs/react';
import { enqueueSnackbar } from 'notistack';
import debounce from 'lodash.debounce';
import axios from 'axios';
import PaymentNow from '@/components/App/Invoice/PaymentNow';
import Receipt from '@/components/App/Invoice/Receipt';
import POSLayout from '@/components/POSLayout';
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const Dashboard = ({ allrestaurants, filters, initialOrders, canEditAfterBill }) => {
    // Orders State loaded via Axios
    const [orders, setOrders] = useState(initialOrders || { data: [], current_page: 1, last_page: 1 });
    const [loading, setLoading] = useState(true);

    // const [open, setOpen] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState({});

    // Search Order State
    const [searchId, setSearchId] = useState(filters.search_id || '');
    const [searchName, setSearchName] = useState(filters.search_name || '');
    const [searchMembership, setSearchMembership] = useState(filters.search_membership || '');
    const [customerType, setCustomerType] = useState(filters.client_type || filters.customer_type || 'all');
    const [type, setType] = useState(filters.order_type || filters.type || 'all');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState(filters.tenant_id ? String(filters.tenant_id) : 'all');
    const [orderStatus, setOrderStatus] = useState(filters.order_status || 'all');
    const [time, setTime] = useState(filters.time || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Suggestions State
    const [suggestions, setSuggestions] = useState([]);
    const [membershipSuggestions, setMembershipSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Add state for category filtering
    const [activeCategory, setActiveCategory] = useState('All Menus');

    const getCustomerLabel = (order) => {
        if (order?.member) {
            const typeName = order.member?.memberType?.name;
            return typeName === 'Corporate' ? 'Corporate' : 'Member';
        }
        if (order?.employee) return 'Employee';
        if (order?.customer) return order.customer?.guestType?.name || order.customer?.guest_type?.name || 'Guest';
        return 'Guest';
    };

    const getCustomerDisplayName = (order) => {
        if (order?.member) {
            const no = order.member?.membership_no ? ` (${order.member.membership_no})` : '';
            return `${order.member?.full_name || ''}${no}`.trim();
        }
        if (order?.employee) {
            const no = order.employee?.employee_id ? ` (${order.employee.employee_id})` : '';
            return `${order.employee?.name || ''}${no}`.trim();
        }
        if (order?.customer) {
            const no = order.customer?.customer_no ? ` (${order.customer.customer_no})` : '';
            return `${order.customer?.name || ''}${no}`.trim();
        }
        return 'N/A';
    };
    const parseAmount = (value) => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        if (value === null || value === undefined || value === '') return 0;
        const parsed = parseFloat(String(value).replace(/,/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const getOrderPendingAmount = (order) => {
        const invoice = order?.invoice || {};
        const explicitDue = parseAmount(invoice.customer_charges ?? invoice.remaining_amount ?? invoice.due_amount ?? order?.customer_charges ?? order?.remaining_amount ?? order?.due_amount ?? null);
        if (explicitDue > 0) return explicitDue;
        const total = parseAmount(invoice.total_price ?? invoice.total ?? invoice.grand_total ?? order?.total_price ?? order?.amount ?? 0);
        const paid = parseAmount(invoice.paid_amount ?? order?.paid_amount ?? 0);
        const advance = parseAmount(invoice.advance_payment ?? order?.down_payment ?? order?.advance_payment ?? 0);
        return Math.max(0, total - paid - advance);
    };
    const isOrderPaymentClosed = (order) => {
        const status = String(order?.invoice?.status ?? order?.payment_status ?? '').toLowerCase();
        return ['paid', 'settled'].includes(status) && getOrderPendingAmount(order) <= 0;
    };

    const openFilter = () => setIsFilterOpen(true);
    const closeFilter = () => setIsFilterOpen(false);
    const [orderItems, setOrderItems] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [moveOrder, setMoveOrder] = useState(null);
    const [moveRestaurantId, setMoveRestaurantId] = useState('all');
    const [moveTableOption, setMoveTableOption] = useState(null);
    const [moveTableOptions, setMoveTableOptions] = useState([]);
    const [loadingMoveTables, setLoadingMoveTables] = useState(false);
    const [movingTable, setMovingTable] = useState(false);

    const handleOpenCancelModal = () => setShowCancelModal(true);
    const handleCloseCancelModal = () => {
        setSelectedCard(null);
        setShowCancelModal(false);
    };

    const handleConfirmCancel = (cancelData) => {
        const payload = {
            status: 'cancelled',
            remark: cancelData.remark,
            instructions: cancelData.instructions,
            cancelType: cancelData.cancelType,
        };

        router.post(route(routeNameForContext('orders.update'), { id: selectedCard.id }), payload, {
            preserveScroll: true,
            onSuccess: () => {
                enqueueSnackbar('Order updated successfully!', { variant: 'success' });
                setSelectedCard(null);
                setShowCancelModal(false);
            },
            onError: (errors) => {
                enqueueSnackbar('Something went wrong: ' + JSON.stringify(errors), { variant: 'error' });
            },
        });
    };

    const isMoveAllowed = (order) => {
        if (!order) return false;
        if (order.status === 'cancelled' || order.status === 'refund' || order.status === 'completed') return false;
        if (order.payment_status === 'awaiting') return false;
        if (order.invoice) return false;
        if (!order.table?.id && !order.table_id) return false;
        return true;
    };

    const fetchMoveTables = async (restaurantId) => {
        if (!restaurantId || restaurantId === 'all') {
            setMoveTableOptions([]);
            return;
        }
        setLoadingMoveTables(true);
        try {
            const res = await axios.get(route(routeNameForContext('api.floors-with-tables')), {
                params: { restaurant_id: restaurantId },
            });
            const floors = Array.isArray(res.data) ? res.data : [];
            const options = floors.flatMap((floor) => {
                const floorName = floor?.name || 'No Floor';
                const tables = Array.isArray(floor?.tables) ? floor.tables : [];
                return tables
                    .filter((t) => t?.is_available)
                    .map((t) => ({
                        id: t.id,
                        label: `${floorName} - Table ${t.table_no}`,
                    }));
            });
            setMoveTableOptions(options);
        } catch (e) {
            console.error(e);
            enqueueSnackbar('Failed to load tables', { variant: 'error' });
            setMoveTableOptions([]);
        } finally {
            setLoadingMoveTables(false);
        }
    };

    const openMoveModal = (order) => {
        setMoveOrder(order);
        const defaultRestaurantId = String(order?.tenant?.id || order?.tenant_id || '');
        setMoveRestaurantId(defaultRestaurantId || 'all');
        setMoveTableOption(null);
        setMoveModalOpen(true);
        if (defaultRestaurantId) {
            fetchMoveTables(defaultRestaurantId);
        } else {
            setMoveTableOptions([]);
        }
    };

    const closeMoveModal = () => {
        setMoveModalOpen(false);
        setMoveOrder(null);
        setMoveRestaurantId('all');
        setMoveTableOption(null);
        setMoveTableOptions([]);
    };

    const submitMoveTable = async () => {
        if (!moveOrder) return;
        if (!moveRestaurantId || moveRestaurantId === 'all') {
            enqueueSnackbar('Please select a restaurant', { variant: 'error' });
            return;
        }
        if (!moveTableOption?.id) {
            enqueueSnackbar('Please select a table', { variant: 'error' });
            return;
        }
        setMovingTable(true);
        try {
            await axios.post(route(routeNameForContext('orders.move-table'), { id: moveOrder.id }), {
                restaurant_id: moveRestaurantId,
                table_id: moveTableOption.id,
            });
            enqueueSnackbar('Order moved successfully', { variant: 'success' });
            closeMoveModal();
            fetchOrders(orders.current_page || 1);
        } catch (e) {
            const msg = e?.response?.data?.message || 'Failed to move order';
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setMovingTable(false);
        }
    };

    const onSave = (status, customerMeta = null) => {
        const updatedItems = orderItems.filter((item) => typeof item.id === 'string' && item.id.startsWith('update-'));
        const newItems = orderItems.filter((item) => item.id === 'new');

        // Exclude canceled items
        const activeItems = orderItems.filter((item) => item.status !== 'cancelled');

        const taxRate = Number(selectedCard.tax) || 0;
        const subtotal = Math.round(activeItems.reduce((sum, item) => sum + Number(item.order_item?.total_price || 0), 0));
        const discountAmount = activeItems.reduce((sum, item) => sum + Number(item.order_item?.discount_amount || 0), 0);
        const discountedSubtotal = subtotal - discountAmount;
        const taxAmount = activeItems.reduce((sum, item) => {
            const isTaxable = item.order_item?.is_taxable === true || item.order_item?.is_taxable === 'true' || item.order_item?.is_taxable === 1;
            if (!isTaxable) return sum;
            const itemNet = Number(item.order_item?.total_price || 0) - Number(item.order_item?.discount_amount || 0);
            return sum + Math.round(itemNet * taxRate);
        }, 0);
        // const taxAmount = Math.round(taxableAmount * taxRate); // Original
        const serviceCharges = Number(selectedCard.service_charges || 0);
        const bankCharges = Number(selectedCard.bank_charges || 0);
        const total = Math.round(discountedSubtotal + taxAmount + serviceCharges + bankCharges);

        const payload = {
            updated_items: updatedItems,
            new_items: newItems,
            subtotal,
            discount: discountAmount,
            tax_rate: taxRate,
            total_price: total,
            service_charges: serviceCharges,
            bank_charges: bankCharges,
            status,
        };
        if (customerMeta?.customer_type && customerMeta?.customer?.id) {
            payload.client_type = customerMeta.customer_type; // Backend expects client_type
            payload.client_id = customerMeta.customer.id; // Backend expects client_id
        }

        return new Promise((resolve, reject) => {
            router.post(route(routeNameForContext('orders.update'), { id: selectedCard.id }), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    enqueueSnackbar('Order updated successfully!', { variant: 'success' });
                    setOpenModal(false);
                    fetchOrders(orders.current_page || 1)
                        .then((res) => resolve(res))
                        .catch(() => resolve(null));
                },
                onError: (errors) => {
                    const firstMessage = Object.values(errors || {}).find((value) => typeof value === 'string' && value.trim());
                    enqueueSnackbar(firstMessage || 'Unable to update order.', { variant: 'error' });
                    reject(errors);
                },
            });
        });
    };

    const onSaveAndPrint = async (status, customerMeta = null) => {
        try {
            const res = await onSave(status, customerMeta);
            const updatedOrder = res?.data?.data?.find((o) => String(o.id) === String(selectedCard?.id));
            if (updatedOrder) {
                setSelectedCard(updatedOrder);
            }
            setBillModalOpen(true);
        } catch (_) {
            setBillModalOpen(false);
        }
    };

    // Fetch Suggestions
    const fetchSuggestions = useMemo(
        () =>
            debounce(async (query, type) => {
                if (!query) {
                    setSuggestions([]);
                    return;
                }
                setLoadingSuggestions(true);
                try {
                    const response = await axios.get(route(routeNameForContext('api.orders.search-customers')), {
                        params: { query, type },
                    });
                    setSuggestions(response.data);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                } finally {
                    setLoadingSuggestions(false);
                }
            }, 300),
        [],
    );
    // ------------- Data Fetching Logic -------------

    const fetchOrders = (page = 1) => {
        setLoading(true);
        return axios
            .get(route(routeNameForContext('order.management')), {
                params: {
                    page,
                    search_id: searchId,
                    search_name: searchName,
                    search_membership: searchMembership,
                    time: time,
                    order_type: type === 'all' ? undefined : type,
                    client_type: customerType === 'all' ? undefined : customerType,
                    order_status: orderStatus === 'all' ? undefined : orderStatus,
                    tenant_id: selectedRestaurantId === 'all' ? undefined : selectedRestaurantId,
                    start_date: startDate,
                    end_date: endDate,
                },
                headers: {
                    Accept: 'application/json', // Force JSON response
                },
            })
            .then((res) => {
                setOrders(res.data);
                setLoading(false);
                return res;
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
                enqueueSnackbar('Failed to load orders', { variant: 'error' });
                throw err;
            });
    };

    useEffect(() => {
        // Initial load
        fetchOrders();
    }, []); // Only on mount

    const handleApply = () => {
        fetchOrders(1);
    };

    const handleReset = () => {
        setSearchId('');
        setSearchName('');
        setSearchMembership('');
        setCustomerType('all');
        setType('all');
        setSelectedRestaurantId('all');
        setOrderStatus('all');
        setTime('all');
        setStartDate('');
        setEndDate('');
        setLoading(true);
        axios.get(route(routeNameForContext('order.management'))).then((res) => {
            setOrders(res.data);
            setLoading(false);
        });
    };

    const handleSuggestionFetch = useMemo(
        () =>
            debounce((inputValue, type) => {
                if (!inputValue) return;
                setLoadingSuggestions(true);
                axios
                    .get(route(routeNameForContext('api.orders.search-customers')), { params: { query: inputValue, type } })
                    .then((response) => {
                        const formatted = response.data.map((item) => ({
                            ...item,
                            label: item.name || item.full_name,
                        }));
                        if (type === 'membership') {
                            setMembershipSuggestions(formatted);
                        } else {
                            setSuggestions(formatted);
                        }
                    })
                    .catch((error) => console.error(error))
                    .finally(() => setLoadingSuggestions(false));
            }, 300),
        [],
    );

    useEffect(() => {
        if (searchName) handleSuggestionFetch(searchName, customerType);
        else setSuggestions([]);
    }, [searchName, customerType]);

    useEffect(() => {
        if (searchMembership)
            handleSuggestionFetch(searchMembership, 'all'); // Assuming membership search is for all types
        else setMembershipSuggestions([]);
    }, [searchMembership]);

    // ------------------------------------------------

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [billModalOpen, setBillModalOpen] = useState(false); // For Bill/Receipt Print
    const [selectedInvoice, setSelectedInvoice] = useState(null); // For PaymentNow

    // For Receipt Component
    const getReceiptData = (order) => {
        if (!order) return null;
        // If order has invoice attach it or map data
        // For Generate Invoice print -> show "Bill" / "Unpaid Invoice"
        return {
            id: order.id,
            order_no: order.id,
            start_date: order.start_date,
            date: order.paid_at || new Date().toISOString(),
            amount: order.amount || 0, // subtotal
            discount: order.discount || 0,
            tax: order.tax_rate || order.tax || 0,
            service_charges: order.service_charges || 0,
            service_charges_percentage: order.service_charges_percentage || 0,
            bank_charges: order.bank_charges || 0,
            bank_charges_percentage: order.bank_charges_percentage || 0,
            total_price: order.total_price, // grand total
            order_type: order.order_type,
            member: order.member,
            customer: order.customer,
            employee: order.employee,
            table: order.table,
            data: order.invoice?.data || order.data || {},
            advance_payment: order.invoice?.advance_payment || 0,
            paid_amount: order.invoice?.paid_amount || order.paid_amount || 0,
            // Items need to be mapped if structure differs
            order_items: order.order_items?.map((item) => ({
                status: item.status,
                order_item: item.order_item || item, // handle structure variations
                name: (item.order_item || item).name,
                quantity: (item.order_item || item).quantity,
                price: (item.order_item || item).price,
                total_price: (item.order_item || item).total_price,
            })),
            invoice_no: order.invoice?.invoice_no || 'DRAFT', // Show invoice no if exists
            status: order.payment_status === 'paid' ? 'Paid' : 'Unpaid',
        };
    };

    const handleGenerateInvoice = (order) => {
        axios
            .post(route(routeNameForContext('order.generate-invoice'), { id: order.id }))
            .then((response) => {
                const { invoice, order: updatedOrder } = response.data;
                enqueueSnackbar('Invoice generated successfully!', { variant: 'success' });

                // Update local state without reload
                fetchOrders(orders.current_page);

                // Show Print Modal
                setSelectedCard({ ...updatedOrder, invoice }); // Ensure updated order is selected
                setBillModalOpen(true);
            })
            .catch((error) => {
                console.error(error);
                enqueueSnackbar('Failed to generate invoice.', { variant: 'error' });
            });
    };

    const handlePayNow = (order) => {
        if (!order.invoice) {
            enqueueSnackbar('No invoice found for this order.', { variant: 'error' });
            return;
        }
        if (isOrderPaymentClosed(order)) {
            enqueueSnackbar('This order is already fully paid.', { variant: 'info' });
            return;
        }
        const invoice = order.invoice || {};
        // Prepare data for PaymentNow
        // PaymentNow expects `invoiceData` which matches FinancialInvoice structure
        // PaymentNow expects the Order object (or object with Order ID)
        const invoiceData = {
            ...order,
            invoice,
            invoice_no: invoice.invoice_no, // Attach invoice no specifically
            advance_payment: invoice.advance_payment ?? order.down_payment ?? 0,
            paid_amount: invoice.paid_amount ?? order.paid_amount ?? 0,
            customer_charges: invoice.customer_charges ?? order.customer_charges ?? null,
            remaining_amount: invoice.remaining_amount ?? order.remaining_amount ?? null,
            due_amount: invoice.due_amount ?? order.due_amount ?? null,
            payment_status: invoice.status ?? order.payment_status,
        };
        setSelectedInvoice(invoiceData);
        setPaymentModalOpen(true);
    };

    // Riders State
    const [riders, setRiders] = useState([]);
    const [assignRiderOpen, setAssignRiderOpen] = useState(false);
    const [selectedOrderForRider, setSelectedOrderForRider] = useState(null);
    const [selectedRider, setSelectedRider] = useState('');

    useEffect(() => {
        // Fetch riders on mount
        axios
            .get(route(routeNameForContext('riders.all')))
            .then((res) => {
                if (res.data.success) {
                    setRiders(res.data.riders);
                }
            })
            .catch((err) => console.error('Failed to fetch riders', err));
    }, []);

    const handleAssignRiderClick = (order) => {
        setSelectedOrderForRider(order);
        setSelectedRider(order.rider_id || ''); // Pre-select if already assigned
        setAssignRiderOpen(true);
    };

    const handleSaveRider = () => {
        if (!selectedOrderForRider) return;

        router.post(
            route(routeNameForContext('orders.update'), { id: selectedOrderForRider.id }),
            {
                rider_id: selectedRider,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    enqueueSnackbar('Rider assigned successfully!', { variant: 'success' });
                    setAssignRiderOpen(false);
                    setSelectedOrderForRider(null);
                    setSelectedRider('');
                    fetchOrders(orders.current_page); // Refresh orders
                },
                onError: () => enqueueSnackbar('Failed to assign rider.', { variant: 'error' }),
            },
        );
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        if (timeStr.match(/AM|PM/i)) return timeStr;
        const date = new Date(`2000-01-01 ${timeStr}`);
        if (isNaN(date.getTime())) return timeStr;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString('en-GB');
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            {/* <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: '#f5f5f5',
                    minHeight: '100vh',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    {/* Left - Heading */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography style={{ color: '#063455', fontSize: '30px', fontWeight: 600 }}>Order Management</Typography>
                    </Box>
                </Box>

                {/* New Filter Design */}
                <Box sx={{ mb: 3, mt: 3, boxShadow: 'none' }}>
                    <Grid container spacing={2} alignItems="center">
                        {/* Customer Type Selection */}
                        <Grid item xs={12} md={2}>
                            <FormControl
                                size="small"
                                sx={{
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                }}
                            >
                                <Select
                                    value={customerType}
                                    onChange={(e) => setCustomerType(e.target.value)}
                                    displayEmpty
                                    MenuProps={{
                                        sx: {
                                            '& .MuiPaper-root': {
                                                borderRadius: '16px',
                                                boxShadow: 'none !important',
                                                marginTop: '4px',
                                                maxHeight: '180px',
                                                overflowY: 'auto',
                                            },
                                            '& .MuiMenuItem-root': {
                                                borderRadius: '16px',
                                                '&:hover': {
                                                    backgroundColor: '#063455 !important',
                                                    color: '#fff !important',
                                                },
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    <MenuItem value="member">Member</MenuItem>
                                    <MenuItem value="corporate">Corporate</MenuItem>
                                    <MenuItem value="employee">Employee</MenuItem>
                                    <MenuItem value="guest">Guest</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Search by Name with Autocomplete */}
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                filterOptions={(x) => x}
                                options={suggestions}
                                getOptionLabel={(option) => option.value || option}
                                inputValue={searchName}
                                onInputChange={(event, newInputValue) => {
                                    setSearchName(newInputValue);
                                }}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Search Name" placeholder="Guest Name..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.membership_no || option.customer_no || option.employee_id}
                                                </Typography>
                                                {option.status && (
                                                    <Chip
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                            ml: 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.name || option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* Search by Membership Number */}
                        <Grid item xs={12} md={2}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                filterOptions={(x) => x}
                                options={membershipSuggestions}
                                getOptionLabel={(option) => option.membership_no || option.customer_no || option.value || option}
                                inputValue={searchMembership}
                                onInputChange={(event, newInputValue) => {
                                    setSearchMembership(newInputValue);
                                }}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Membership #" placeholder="Number..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.membership_no || option.customer_no || option.employee_id}
                                                </Typography>
                                                {option.status && (
                                                    <Chip
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                            ml: 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.name || option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* Search by ID */}
                        <Grid item xs={12} md={2}>
                            <TextField fullWidth size="small" label="Order ID" placeholder="Order ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                        </Grid>

                        {/* Action Buttons */}
                        <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: '16px', textTransform: 'none', color: '#063455', border: '1px solid #063455', paddingLeft: 4, paddingRight: 4 }}>
                                Reset
                            </Button>
                            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleApply} sx={{ borderRadius: '16px', backgroundColor: '#063455', textTransform: 'none', paddingLeft: 4, paddingRight: 4 }}>
                                Search
                            </Button>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                        <Grid item xs={12} md={3}>
                            <FormControl
                                size="small"
                                sx={{
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': { borderRadius: '16px' },
                                }}
                            >
                                <Select value={selectedRestaurantId} onChange={(e) => setSelectedRestaurantId(e.target.value)} displayEmpty>
                                    <MenuItem value="all">All Restaurants</MenuItem>
                                    {(allrestaurants || []).map((r) => (
                                        <MenuItem key={r.id} value={String(r.id)}>
                                            {r.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <FormControl
                                size="small"
                                sx={{
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': { borderRadius: '16px' },
                                }}
                            >
                                <Select value={type} onChange={(e) => setType(e.target.value)} displayEmpty>
                                    <MenuItem value="all">All Order Types</MenuItem>
                                    <MenuItem value="dineIn">Dine In</MenuItem>
                                    <MenuItem value="takeaway">Takeaway</MenuItem>
                                    <MenuItem value="pickUp">Pick Up</MenuItem>
                                    <MenuItem value="delivery">Delivery</MenuItem>
                                    <MenuItem value="room_service">Rooms Orders</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <FormControl
                                size="small"
                                sx={{
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': { borderRadius: '16px' },
                                }}
                            >
                                <Select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} displayEmpty>
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                    <MenuItem value="waiting_for_payment">Waiting For Payment</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                    <MenuItem value="refund">Refund</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                {/* Orders Grid */}
                {/* Add Loading Indicator */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                            Loading orders...
                        </Typography>
                    </Box>
                )}

                {!loading && (
                    <Grid
                        container
                        spacing={3}
                        sx={{
                            mt: 2,
                        }}
                    >
                        {orders.data && orders.data.length > 0 ? (
                            orders.data.map((card, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            maxWidth: 360,
                                            mx: 'auto',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            border: '1px solid #E3E3E3',
                                        }}
                                    >
                                        {/* Header - Color Logic: RED=in kitchen/pending, BLUE=completed/awaiting payment */}
                                        <Box
                                            sx={{
                                                bgcolor:
                                                    card.status === 'cancelled'
                                                        ? '#FF0000'
                                                        : card.status === 'refund'
                                                          ? '#FFA500'
                                                          : card.status === 'completed' || card.payment_status === 'awaiting'
                                                            ? '#1976D2' // BLUE - invoice generated, awaiting payment
                                                            : '#D32F2F', // RED - in kitchen / active
                                                color: '#FFFFFF',
                                                p: 2,
                                                position: 'relative',
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 500, mb: 0.5, fontSize: '18px' }}>#{card.id}</Typography>
                                            <Typography sx={{ fontWeight: 500, mb: 2, fontSize: '18px' }}>
                                                {getCustomerDisplayName(card)}
                                                <Typography component="span" variant="body2" textTransform="capitalize" sx={{ ml: 0.3, opacity: 0.8 }}>
                                                    ({card.order_type})
                                                </Typography>
                                            </Typography>
                                            {/* <Box></Box> */}
                                            <Typography sx={{ mb: 2, fontSize: '14px', opacity: 0.9 }}>
                                                Restaurant: <strong>{card.tenant?.name || 'Unknown'}</strong>
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    bgcolor: '#0066cc',
                                                    width: 'fit-content',
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 0.5,
                                                }}
                                            >
                                                <AccessTime fontSize="small" sx={{ fontSize: 16, color: '#fff', mr: 0.5 }} />
                                                <Typography variant="caption" sx={{ color: '#fff' }}>
                                                    Date: {formatDate(card.start_date)} • Time: {formatTime(card.start_time)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                                                <Typography sx={{ fontWeight: 500, mb: 1, fontSize: '18px' }}>{getCustomerLabel(card)}</Typography>
                                                <Box display="flex">
                                                    <Avatar sx={{ bgcolor: '#1976D2', width: 36, height: 36, fontSize: 14, fontWeight: 500, mr: 1 }}>{card.table?.table_no}</Avatar>
                                                    <Avatar sx={{ bgcolor: '#E3E3E3', width: 36, height: 36, color: '#666' }}>
                                                        <img
                                                            src="/assets/food-tray.png"
                                                            alt=""
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                            }}
                                                        />
                                                    </Avatar>
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* Order Items */}
                                        <List sx={{ py: 0 }}>
                                            {(expandedOrders[card.id] ? card.order_items : card.order_items.slice(0, 4)).map((item, index) => (
                                                <ListItem key={index} divider={index < card.order_items.length - 1} sx={{ py: 1, px: 2, textDecoration: item.status === 'cancelled' ? 'line-through' : 'none', opacity: item.status === 'cancelled' ? 0.6 : 1 }}>
                                                    <ListItemText
                                                        sx={{
                                                            color: '#121212',
                                                            fontWeight: 500,
                                                            fontSize: '14px',
                                                        }}
                                                        primary={item.order_item.name}
                                                    />
                                                    <Typography variant="body2" sx={{ color: '#121212', fontWeight: 500, fontSize: '14px' }}>
                                                        {item.order_item.quantity}x
                                                    </Typography>
                                                </ListItem>
                                            ))}

                                            {/* Totals Section */}
                                            <ListItem sx={{ py: 1, px: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#f5f5f5' }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    Discount:
                                                </Typography>
                                                <Typography variant="body2">{Number(card.discount || 0).toFixed(2)}</Typography>
                                            </ListItem>
                                            {Number(card.invoice?.advance_payment || card.down_payment || card.data?.advance_deducted || 0) > 0 && (
                                                <ListItem sx={{ py: 1, px: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#f5f5f5' }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        Advance:
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                                        - {Number(card.invoice?.advance_payment || card.down_payment || card.data?.advance_deducted || 0).toLocaleString()}
                                                    </Typography>
                                                </ListItem>
                                            )}
                                            <ListItem sx={{ py: 1, px: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#e0e0e0' }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    Total:
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {Math.max(0, Number(card.total_price || 0) - Number(card.invoice?.advance_payment || card.down_payment || card.data?.advance_deducted || 0)).toLocaleString()}
                                                </Typography>
                                            </ListItem>
                                            {card.waiter && (
                                                <ListItem sx={{ py: 0.5, px: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Waiter: {card.waiter.name}
                                                    </Typography>
                                                </ListItem>
                                            )}

                                            {/* Show More */}
                                            {card.order_items.length > 4 && (
                                                <ListItem
                                                    sx={{ py: 1.5, px: 2, color: '#1976d2', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setExpandedOrders((prev) => ({
                                                            ...prev,
                                                            [card.id]: !prev[card.id],
                                                        }));
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {expandedOrders[card.id] ? 'Show Less' : `Show More (${card.order_items.length - 4})`}
                                                    </Typography>
                                                </ListItem>
                                            )}
                                        </List>

                                        {/* Action Buttons */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', p: 2, gap: 1 }}>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Button
                                                    variant="outlined"
                                                    fullWidth
                                                    disabled={card.status === 'cancelled' || card.status === 'completed'} // Disable cancel if completed
                                                    sx={{ borderColor: '#003153', color: '#003153', bgcolor: card.status === 'cancelled' ? '#E3E3E3' : 'transparent', textTransform: 'none', py: 1 }}
                                                    onClick={() => {
                                                        setSelectedCard(card);
                                                        handleOpenCancelModal();
                                                    }}
                                                >
                                                    {card.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    disabled={card.status === 'cancelled' || card.status === 'refund' || (!canEditAfterBill && isOrderPaymentClosed(card))}
                                                    sx={{
                                                        px: 0,
                                                        bgcolor: '#003153',
                                                        '&:hover': { bgcolor: '#00254d' },
                                                        textTransform: 'none',
                                                        py: 1,
                                                    }}
                                                    onClick={() => {
                                                        setSelectedCard(card);
                                                        setOrderItems(card.order_items);
                                                        setOpenModal(true);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                                {/* Generate Invoice / Pay Now Buttons */}
                                                {card.status !== 'cancelled' && card.status !== 'refund' && (
                                                    <>
                                                        {!card.invoice ? (
                                                            <Button variant="contained" fullWidth color="secondary" sx={{ textTransform: 'none', px: 0, py: 1, bgcolor: '#003153', '&:hover': { bgcolor: '#00254d' } }} onClick={() => handleGenerateInvoice(card)}>
                                                                Generate Invoice
                                                            </Button>
                                                        ) : (
                                                            <Button variant="contained" fullWidth color="success" sx={{ textTransform: 'none', px: 0, py: 1, bgcolor: '#003153', '&:hover': { bgcolor: '#00254d' } }} onClick={() => handlePayNow(card)} disabled={isOrderPaymentClosed(card)}>
                                                                {isOrderPaymentClosed(card) ? 'Paid' : 'Pay Now'}
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </Box>
                                            {/* Assign Rider Button for Delivery Orders */}
                                            {card.order_type === 'delivery' && card.status !== 'cancelled' && card.status !== 'completed' && (
                                                <Button variant="outlined" fullWidth color="info" sx={{ textTransform: 'none', mt: 1 }} onClick={() => handleAssignRiderClick(card)}>
                                                    {card.rider ? `Rider: ${card.rider.name}` : 'Assign Rider'}
                                                </Button>
                                            )}
                                            {isMoveAllowed(card) && (
                                                <Button variant="outlined" fullWidth sx={{ textTransform: 'none', mt: 1, borderColor: '#003153', color: '#003153' }} onClick={() => openMoveModal(card)}>
                                                    Move
                                                </Button>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))
                        ) : (
                            <Grid item xs={12}>
                                <Typography variant="body1" sx={{ textAlign: 'center', mt: 3 }}>
                                    No orders found.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                )}

                {!loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'end', py: 4 }}>
                        <Pagination count={orders.last_page || 1} page={orders.current_page || 1} onChange={(e, page) => fetchOrders(page)} />
                    </Box>
                )}
                {showCancelModal && <CancelOrder order={selectedCard} onClose={handleCloseCancelModal} onConfirm={handleConfirmCancel} />}
                <Drawer
                    anchor="right"
                    open={isFilterOpen}
                    onClose={closeFilter}
                    PaperProps={{
                        sx: { width: 600, px: 2, top: 15, right: 15, height: 416 }, // Customize drawer width and padding
                    }}
                >
                    <OrderFilter onClose={closeFilter} />
                </Drawer>
                <EditOrderModal
                    open={openModal}
                    allrestaurants={allrestaurants}
                    onClose={() => {
                        setOpenModal(false);
                        setOrderItems([]);
                    }}
                    order={selectedCard}
                    orderItems={orderItems}
                    setOrderItems={setOrderItems}
                    onSave={(status, clientMeta) => onSave(status, clientMeta)}
                    onSaveAndPrint={(status, clientMeta) => onSaveAndPrint(status, clientMeta)}
                    allowUpdateAndPrint={Boolean(selectedCard?.invoice)}
                />

                {/* PaymentModal */}
                {paymentModalOpen && selectedInvoice && (
                    <PaymentNow
                        invoiceData={selectedInvoice}
                        openPaymentModal={paymentModalOpen}
                        handleClosePayment={() => setPaymentModalOpen(false)}
                        openSuccessPayment={() => {
                            setPaymentModalOpen(false);
                            fetchOrders(orders.current_page); /* Reload current page */
                        }}
                        setSelectedOrder={setSelectedCard}
                    />
                )}

                {/* Receipt/Bill Modal */}
                {billModalOpen && selectedCard && (
                    <Dialog open={billModalOpen} onClose={() => setBillModalOpen(false)} maxWidth="sm" fullWidth>
                        <Box sx={{ p: 2 }}>
                            <Receipt invoiceRoute={'transaction.invoice'} invoiceData={getReceiptData(selectedCard)} openModal={true} includePaymentBreakdown={false} />
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                <Button onClick={() => setBillModalOpen(false)} variant="outlined">
                                    Close
                                </Button>
                            </Box>
                        </Box>
                    </Dialog>
                )}

                {moveModalOpen && (
                    <Dialog open={moveModalOpen} onClose={closeMoveModal} maxWidth="sm" fullWidth>
                        <DialogTitle>Move Order #{moveOrder?.id}</DialogTitle>
                        <DialogContent sx={{ py: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Restaurant</InputLabel>
                                        <Select
                                            value={moveRestaurantId}
                                            label="Restaurant"
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setMoveRestaurantId(next);
                                                setMoveTableOption(null);
                                                fetchMoveTables(next);
                                            }}
                                        >
                                            <MenuItem value="all">Select restaurant</MenuItem>
                                            {(allrestaurants || []).map((r) => (
                                                <MenuItem key={r.id} value={String(r.id)}>
                                                    {r.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={moveTableOptions}
                                        value={moveTableOption}
                                        onChange={(e, v) => setMoveTableOption(v)}
                                        getOptionLabel={(o) => o?.label || ''}
                                        isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
                                        loading={loadingMoveTables}
                                        disabled={!moveRestaurantId || moveRestaurantId === 'all'}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Table"
                                                size="small"
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {loadingMoveTables ? <CircularProgress color="inherit" size={18} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button onClick={closeMoveModal} disabled={movingTable} variant="outlined">
                                Cancel
                            </Button>
                            <Button onClick={submitMoveTable} disabled={movingTable} variant="contained" sx={{ bgcolor: '#003153', '&:hover': { bgcolor: '#00254d' } }}>
                                {movingTable ? 'Moving...' : 'Move'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}

                {/* Assign Rider Dialog */}
                <Dialog open={assignRiderOpen} onClose={() => setAssignRiderOpen(false)}>
                    <DialogTitle>Assign Delivery Rider</DialogTitle>
                    <DialogContent sx={{ minWidth: 300, py: 2 }}>
                        <FormControl fullWidth margin="dense">
                            <InputLabel>Select Rider</InputLabel>
                            <Select value={selectedRider} label="Select Rider" onChange={(e) => setSelectedRider(e.target.value)}>
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {riders.map((rider) => (
                                    <MenuItem key={rider.id} value={rider.id}>
                                        {rider.name} ({rider.employee_id})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button onClick={() => setAssignRiderOpen(false)}>Cancel</Button>
                            <Button variant="contained" onClick={handleSaveRider} disabled={!selectedRider}>
                                Assign
                            </Button>
                        </Box>
                    </DialogContent>
                </Dialog>
            </Box>
            {/* </div> */}
        </>
    );
};
Dashboard.layout = (page) => <POSLayout>{page}</POSLayout>;
// Dashboard.layout = null;
export default Dashboard;
