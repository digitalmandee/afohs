import POSLayout from '@/components/POSLayout';
import Receipt from '@/components/App/Invoice/Receipt';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, MenuItem, Select, FormControl, InputLabel, Pagination, Typography, Chip, InputAdornment, CircularProgress, IconButton, Tooltip, Dialog, DialogContent, DialogTitle, Button, Grid, Autocomplete } from '@mui/material';
import { Search } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import axios from 'axios';
import { routeNameForContext } from '@/lib/utils';
import EditOrderModal from '../Management/EditModal';
import { enqueueSnackbar } from 'notistack';
import PaymentNow from '@/components/App/Invoice/PaymentNow';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const Dashboard = ({ orders, filters, tables = [], waiters = [], cashiers = [], allrestaurants = [], canEditAfterBill = false }) => {
    const { auth } = usePage().props;
    const user = auth.user;

    const toDMY = (value) => {
        if (!value) return '';
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString('en-GB');
    };

    const toYMD = (value) => {
        if (!value) return '';
        const parts = String(value).trim().split('/');
        if (parts.length !== 3) return '';
        const [dd, mm, yyyy] = parts.map((p) => p.trim());
        if (!dd || !mm || !yyyy) return '';
        const d = Number(dd);
        const m = Number(mm);
        const y = Number(yyyy);
        if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return '';
        if (y < 1900 || y > 2100) return '';
        if (m < 1 || m > 12) return '';
        if (d < 1 || d > 31) return '';
        const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const parsed = new Date(iso);
        if (isNaN(parsed.getTime())) return '';
        return iso;
    };

    // const [open, setOpen] = useState(true);
    const [searchId, setSearchId] = useState(filters?.search_id || '');
    const [searchName, setSearchName] = useState(filters?.search_name || '');
    const [startDate, setStartDate] = useState(toDMY(filters?.start_date || ''));
    const [endDate, setEndDate] = useState(toDMY(filters?.end_date || ''));
    const [orderType, setOrderType] = useState(filters?.type || 'all');
    const [paymentStatus, setPaymentStatus] = useState(filters?.payment_status || 'all');
    const [paymentMethod, setPaymentMethod] = useState(filters?.payment_method || 'all');
    const [adjustmentType, setAdjustmentType] = useState(filters?.adjustment_type || 'all');
    const [tableId, setTableId] = useState(filters?.table_id || '');
    const [waiterId, setWaiterId] = useState(filters?.waiter_id || '');
    const [cashierId, setCashierId] = useState(filters?.cashier_id || '');
    const [isLoading, setIsLoading] = useState(false);

    // Suggestions State
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Modal state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editOrderItems, setEditOrderItems] = useState([]);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

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

    useEffect(() => {
        if (searchName) {
            fetchSuggestions(searchName, orderType);
        } else {
            setSuggestions([]);
        }
    }, [searchName, orderType]);

    const handleApply = () => {
        setIsLoading(true);
        const startDateYmd = toYMD(startDate);
        const endDateYmd = toYMD(endDate);
        router.get(
            route(routeNameForContext('order.history')),
            {
                search_id: searchId || undefined,
                search_name: searchName || undefined,
                start_date: startDateYmd || undefined,
                end_date: endDateYmd || undefined,
                type: orderType !== 'all' ? orderType : undefined,
                payment_status: paymentStatus !== 'all' ? paymentStatus : undefined,
                payment_method: paymentMethod !== 'all' ? paymentMethod : undefined,
                adjustment_type: adjustmentType !== 'all' ? adjustmentType : undefined,
                table_id: tableId || undefined,
                waiter_id: waiterId || undefined,
                cashier_id: cashierId || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handlePayNow = async (order) => {
        if (!order?.invoice_id) {
            enqueueSnackbar("Invoice isn't generated for this order.", { variant: 'warning' });
            return;
        }
        try {
            const res = await axios.get(route(routeNameForContext('transaction.invoice'), { invoiceId: order.id }));
            setSelectedInvoice(res.data);
            setPaymentModalOpen(true);
        } catch (e) {
            const msg = e?.response?.data?.message || 'Failed to load payment details';
            enqueueSnackbar(msg, { variant: 'error' });
        }
    };

    const handleReset = () => {
        setSearchId('');
        setSearchName('');
        setStartDate('');
        setEndDate('');
        setOrderType('all');
        setPaymentStatus('all');
        setPaymentMethod('all');
        setAdjustmentType('all');
        setTableId('');
        setWaiterId('');
        setCashierId('');

        setIsLoading(true);
        router.get(
            route(routeNameForContext('order.history')),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handlePageChange = (event, page) => {
        setIsLoading(true);
        router.get(
            route(routeNameForContext('order.history')),
            { ...filters, page },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const getClientName = (order) => {
        if (order.member) return order.member.full_name;
        if (order.customer) return order.customer.name;
        if (order.employee) return order.employee.name;
        return 'N/A';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'awaiting':
                return 'warning';
            case 'completed':
                return 'info';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getOrderStatusColor = (status) => {
        switch (status) {
            case 'in_progress':
                return 'info';
            case 'completed':
                return 'success';
            case 'cancelled':
            case 'refund':
                return 'error';
            case 'saved':
                return 'warning';
            default:
                return 'default';
        }
    };

    const formatOrderStatus = (status) => {
        const statuses = {
            in_progress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled',
            saved: 'Saved',
            refund: 'Refund',
        };
        return statuses[status] || status;
    };

    const formatOrderType = (type) => {
        const types = {
            dineIn: 'Dine-In',
            delivery: 'Delivery',
            takeaway: 'Takeaway',
            reservation: 'Reservation',
            room_service: 'Room Service',
        };
        return types[type] || type;
    };

    const canPrintInvoice = (order) => {
        if (!order) return false;
        if (order.status === 'in_progress') return false;
        return Boolean(order.invoice_id);
    };
    const canEditOrderBeforePayment = (order) => {
        if (!order) return false;
        if (order.status === 'cancelled' || order.status === 'refund') return false;
        const paymentStatus = String(order.payment_status || '').toLowerCase();
        const invoiceStatus = String(order.invoice_status || '').toLowerCase();
        return paymentStatus !== 'paid' && invoiceStatus !== 'paid';
    };

    const handleViewOrder = (order) => {
        // Set basic info from list first
        setSelectedOrder(order);
        setSelectedOrderDetails(null);
        setViewModalOpen(true);
        setLoadingOrderDetails(true);

        // Fetch full details
        axios
            .get(route(routeNameForContext('order.details'), { id: order.id }))
            .then((response) => {
                if (response.data) {
                    // Update selectedOrder with full details including items
                    setSelectedOrder(response.data);

                    // Also fetch invoice details if needed
                    if (response.data.invoice_id) {
                        return axios.get(route(routeNameForContext('transaction.invoice'), { invoiceId: response.data.id }));
                    }
                }
                return null;
            })
            .then((invoiceRes) => {
                if (invoiceRes && invoiceRes.data) {
                    setSelectedOrderDetails(invoiceRes.data);
                }
            })
            .catch((error) => {
                console.error('Failed to fetch order details:', error);
                enqueueSnackbar('Failed to load full order details', { variant: 'error' });
            })
            .finally(() => setLoadingOrderDetails(false));
    };

    const handleCloseModal = () => {
        setViewModalOpen(false);
        setSelectedOrder(null);
        setSelectedOrderDetails(null);
    };

    const handleOpenEdit = (order) => {
        if (!order?.id) return;
        setSelectedOrder(order);
        axios
            .get(route(routeNameForContext('order.details'), { id: order.id }))
            .then((response) => {
                const fullOrder = response?.data || order;
                setSelectedOrder(fullOrder);
                setEditOrderItems(fullOrder?.order_items || []);
                setEditModalOpen(true);
            })
            .catch(() => {
                setEditOrderItems(order?.order_items || []);
                setEditModalOpen(true);
            });
    };

    const handleCloseEdit = () => {
        setEditModalOpen(false);
        setEditOrderItems([]);
    };

    const handleSaveEdit = (status, clientMeta = null) => {
        if (!selectedOrder) return Promise.resolve(null);

        const payload = {
            updated_items: (editOrderItems || []).filter((it) => typeof it?.id === 'string' && it.id.startsWith('update-')),
            new_items: (editOrderItems || []).filter((it) => it?.id === 'new'),
            status,
        };
        if (clientMeta?.client_type && clientMeta?.client?.id) {
            payload.client_type = clientMeta.client_type;
            payload.client_id = clientMeta.client.id;
        }

        return new Promise((resolve, reject) => {
            router.post(route(routeNameForContext('orders.update'), { id: selectedOrder.id }), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    enqueueSnackbar('Order updated successfully!', { variant: 'success' });
                    handleCloseEdit();
                    router.get(route(routeNameForContext('order.history')), filters, { preserveScroll: true, preserveState: true });
                    resolve(true);
                },
                onError: (errors) => {
                    const firstMessage = Object.values(errors || {}).find((value) => typeof value === 'string' && value.trim());
                    enqueueSnackbar(firstMessage || 'Unable to update order.', { variant: 'error' });
                    reject(errors);
                },
            });
        });
    };

    useEffect(() => {
        // No longer fetching invoice details automatically on mount/open
        // It's handled inside handleViewOrder now
    }, [viewModalOpen, selectedOrder?.id]);

    // Transform order data for Receipt component
    const getReceiptData = (order) => {
        if (!order) return null;
        const computedGross = Math.round((order.order_items || []).filter((item) => item?.status !== 'cancelled').reduce((sum, item) => sum + Number(item?.order_item?.total_price || 0), 0));
        const bankChargesEnabled = Number(order.bank_charges) > 0;
        const advancePayment = Number(order.invoice_advance_payment || order.down_payment || order.invoice_advance_deducted || 0);
        const paidAmount = Number(order.receipt_paid_amount ?? order.invoice_paid_amount ?? order.paid_amount ?? 0);
        const customerChanges = Number(order.receipt_customer_changes ?? order.customer_changes ?? 0);
        return {
            id: order.id,
            order_no: order.id,
            start_date: order.start_date,
            date: order.start_date,
            amount: order.invoice_sub_total || order.amount || computedGross || order.total_price,
            discount: order.invoice_discount_amount || order.discount || 0,
            tax: order.tax || 0,
            total_price: order.total_price,
            service_charges: order.service_charges || 0,
            service_charges_percentage: order.service_charges_percentage || 0,
            bank_charges: order.bank_charges || 0,
            bank_charges_percentage: order.bank_charges_percentage || 0,
            data: {
                bank_charges_enabled: bankChargesEnabled,
                bank_charges_type: order.bank_charges_percentage > 0 ? 'percentage' : 'fixed',
                bank_charges_value: order.bank_charges_percentage > 0 ? Number(order.bank_charges_percentage) : Number(order.bank_charges),
                bank_charges_amount: Number(order.bank_charges || 0),
            },
            order_type: order.order_type,
            member: order.member,
            customer: order.customer,
            employee: order.employee,
            tenant: order.tenant,
            table: order.table,
            cashier: order.cashier,
            waiter: order.waiter,
            advance_payment: advancePayment,
            paid_amount: paidAmount,
            customer_changes: customerChanges,
            ent_amount: Number(order.invoice_ent_amount || 0),
            cts_amount: Number(order.invoice_cts_amount || 0),
            invoice_ent_amount: Number(order.invoice_ent_amount || 0),
            invoice_cts_amount: Number(order.invoice_cts_amount || 0),
            invoice_ent_reason: order.invoice_ent_reason || null,
            invoice_ent_comment: order.invoice_ent_comment || null,
            invoice_cts_comment: order.invoice_cts_comment || null,
            order_items:
                order.order_items
                    ?.filter((item) => item.status !== 'cancelled')
                    .map((item) => ({
                        order_item: item.order_item,
                        name: item.order_item?.name || 'Item',
                        quantity: item.order_item?.quantity || 1,
                        price: item.order_item?.price || 0,
                        discount_amount: item.order_item?.discount_amount || 0,
                        is_taxable: item.order_item?.is_taxable,
                        total_price: item.order_item?.total_price || (item.order_item?.quantity || 1) * (item.order_item?.price || 0),
                    })) || [],
        };
    };

    const executePrint = (data) => {
        if (!data) return;
        const round0 = (n) => Math.round(Number(n) || 0);
        const computeFromItems = (items) => {
            const rows = Array.isArray(items) ? items : [];
            let gross = 0;
            let discount = 0;
            let taxableNet = 0;
            for (const row of rows) {
                if (row?.status === 'cancelled') continue;
                const oi = row?.order_item ?? row;
                const qty = Number(oi?.quantity || 1);
                const price = Number(oi?.price || 0);
                const lineTotal = Number(oi?.total_price ?? qty * price);
                const lineDiscount = Number(oi?.discount_amount || 0);
                const net = lineTotal - lineDiscount;
                gross += lineTotal;
                discount += lineDiscount;
                const isTaxable = oi?.is_taxable === true || oi?.is_taxable === 'true' || oi?.is_taxable === 1;
                if (isTaxable) taxableNet += net;
            }
            return { gross: round0(gross), discount: round0(discount), taxableNet: round0(taxableNet) };
        };
        const printWindow = window.open('', '_blank');
        const printTotalAmount = round0(data.total_price);
        const printAdvancePaid = round0(data.advance_payment || data.data?.advance_deducted || 0);
        const printPaidCash = round0(data.receipt_paid_amount ?? data.paid_amount ?? 0);
        const isSettled = String(data.payment_status || data.invoice_status || '').toLowerCase() === 'paid' || printPaidCash > 0;
        const printEntAmount = isSettled ? round0(data.ent_amount || data.invoice_ent_amount || data.data?.ent_amount || 0) : 0;
        const printCtsAmount = isSettled ? round0(data.cts_amount || data.invoice_cts_amount || data.data?.cts_amount || 0) : 0;
        const printNetPayable = Math.max(0, printTotalAmount - printAdvancePaid - printEntAmount - printCtsAmount);
        const printRemainingDue = Math.max(0, printNetPayable - printPaidCash);
        const explicitPrintChange = round0(data.receipt_customer_changes ?? data.customer_changes ?? 0);
        const printCustomerChange = explicitPrintChange > 0 ? explicitPrintChange : Math.max(0, printPaidCash - printNetPayable);
        const computed = computeFromItems(data.order_items);
        const printGross = computed.gross || round0(data.amount);
        const printDiscount = computed.discount || round0(data.discount);
        const taxRate = Number(data.tax) || 0;
        const printTaxableNet = computed.taxableNet > 0 ? computed.taxableNet : Math.max(0, printGross - printDiscount);
        const printTax = round0(printTaxableNet * taxRate);

        const content = `
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 10px; }
              .order-id { border: 1px dashed #ccc; padding: 10px; text-align: center; margin: 15px 0; }
              .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total { font-weight: bold; margin-top: 10px; }
              .footer { text-align: center; margin-top: 20px; font-size: 11px; }
              .logo { width: 80px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div><img src='/assets/Logo.png' class="logo"/></div>
            </div>
            <div class="header">
              <div>${data.start_date || ''}</div>
            </div>

            <div class="order-id">
              <div>Order Id</div>
              <div><strong>#${data.id || data.order_no || 'N/A'}</strong></div>
            </div>

            <div class="divider"></div>

            <div class="row">
              <div>Customer Name</div>
              <div>${data.member?.full_name || data.member?.name || data.customer?.name || data.employee?.name || 'N/A'}</div>
            </div>

            ${
                data.member
                    ? `
                    <div class="row">
                        <div>Member Id Card</div>
                        <div>${data.member?.membership_no ?? '-'}</div>
                    </div>
                    `
                    : data.employee
                      ? `
                    <div class="row">
                        <div>Employee ID</div>
                        <div>${data.employee?.employee_id ?? '-'}</div>
                    </div>
                    `
                      : data.customer
                        ? `
                    <div class="row">
                        <div>Guest No</div>
                        <div>${data.customer?.customer_no ?? '-'}</div>
                    </div>
                    ${
                        data.customer?.guestType?.name || data.customer?.guest_type?.name
                            ? `
                    <div class="row">
                        <div>Guest Type</div>
                        <div>${data.customer?.guestType?.name || data.customer?.guest_type?.name}</div>
                    </div>
                    `
                            : ''
                    }
                    `
                        : ''
            }

            <div class="row">
              <div>Order Type</div>
              <div>${data.order_type}</div>
            </div>

            <div class="row">
              <div>Table Number</div>
              <div>${data.table?.table_no ?? '-'}</div>
            </div>
            <div class="row">
              <div>Restaurant</div>
              <div>${data.tenant?.name ?? '-'}</div>
            </div>

            <div class="divider"></div>

            ${(data.order_items || [])
                .filter((item) => item.status !== 'cancelled')
                .map(
                    (item) => `
              <div style="margin-bottom: 10px;">
                <div><strong>${item.order_item?.name || item.name}</strong></div>
                <div class="row">
                  <div>${item.order_item?.quantity || item.quantity} x Rs ${item.order_item?.price || item.price}</div>
                  <div>Rs ${item.order_item?.total_price || (item.order_item?.quantity || item.quantity) * (item.order_item?.price || item.price)}</div>
                </div>
              </div>
            `,
                )
                .join('')}

            <div class="divider"></div>

            <div class="row">
              <div>Subtotal</div>
              <div>Rs ${printGross}</div>
            </div>

            <div class="row">
              <div>Discount</div>
              <div>Rs ${printDiscount}</div>
            </div>

            <div class="row">
              <div>Tax (${(Number(data.tax || 0) * 100).toFixed(0)}%)</div>
              <div>Rs ${printTax}</div>
            </div>

            ${
                data.service_charges > 0
                    ? `
                <div class="row">
                  <div>Service Charges${data.service_charges_percentage > 0 ? ` (${data.service_charges_percentage}%)` : ''}</div>
                  <div>Rs ${round0(data.service_charges)}</div>
                </div>
                `
                    : ''
            }

            ${
                data.bank_charges > 0
                    ? `
                <div class="row">
                  <div>Bank Charges${data.bank_charges_percentage > 0 ? ` (${data.bank_charges_percentage}%)` : ''}</div>
                  <div>Rs ${round0(data.bank_charges)}</div>
                </div>
                `
                    : ''
            }

            <div class="divider"></div>

            <div class="row total">
              <div>Total Amount</div>
              <div>Rs ${printTotalAmount}</div>
            </div>

            ${printAdvancePaid > 0 ? `<div class="row"><div>Advance Paid</div><div>- Rs ${printAdvancePaid}</div></div>` : ''}
            ${printEntAmount > 0 ? `<div class="row"><div>ENT</div><div>- Rs ${printEntAmount}</div></div>` : ''}
            ${printCtsAmount > 0 ? `<div class="row"><div>CTS</div><div>- Rs ${printCtsAmount}</div></div>` : ''}
            <div class="row total">
              <div>Remaining Due</div>
              <div>Rs ${printRemainingDue}</div>
            </div>

            ${
                printPaidCash > 0
                    ? `
                <div class="row">
                  <div>Total Cash</div>
                  <div>Rs ${printPaidCash}</div>
                </div>
                <div class="row">
                  <div>Customer Changes</div>
                  <div>Rs ${printCustomerChange}</div>
                </div>
                `
                    : ''
            }
            <div class="row">
              <div>Cashier</div>
              <div>${data.cashier ? data.cashier.name : user.name}</div>
            </div>

            <div class="footer">
              <p>Thanks for having our passion. Drop by again. If your orders aren't still visible, you're always welcome here!</p>
            </div>

            <div class="logo">
              IMAJI Coffee.
            </div>

          </body>
        </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handlePrintReceipt = (order) => {
        if (!canPrintInvoice(order)) {
            enqueueSnackbar("Invoice isn't generated for this order.", { variant: 'warning' });
            return;
        }

        axios
            .get(route(routeNameForContext('order.details'), { id: order.id }))
            .then((response) => {
                if (response.data) {
                    const fullOrder = response.data;
                    const receiptData = getReceiptData(fullOrder);
                    executePrint(receiptData);
                }
            })
            .catch((error) => {
                console.error('Failed to fetch order details for print:', error);
                enqueueSnackbar('Failed to load order details for printing', { variant: 'error' });
            });
    };

    // MenuProps for styled dropdowns
    const menuProps = {
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
    };

    const orderHistoryPageTotals = (orders?.data || []).reduce(
        (acc, order) => {
            const round0 = (n) => Math.round(Number(n) || 0);
            const total = round0(order.total_price || 0);
            const advance = round0(order.invoice_advance_payment || order.down_payment || order.invoice_advance_deducted || 0);
            const paid = round0(order.paid_amount || 0) + advance;
            const entAmount = round0(order.invoice_ent_amount || 0);
            const ctsAmount = round0(order.invoice_cts_amount || 0);
            const balance = round0(total - paid - entAmount - ctsAmount);
            acc.amount += total;
            acc.paid += paid;
            acc.balance += balance;
            return acc;
        },
        { amount: 0, paid: 0, balance: 0 },
    );

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            {/* <Box
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
                <Typography sx={{ mb: 3, fontWeight: 700, color: '#063455', fontSize: '30px' }}>Order History</Typography>

                {/* Filters */}
                <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        {/* Unified Type Selection */}
                        <Grid item xs={12} md={2}>
                            <FormControl size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select value={orderType} onChange={(e) => setOrderType(e.target.value)} MenuProps={menuProps}>
                                    <MenuItem value="all">All Types</MenuItem>
                                    <MenuItem value="member">Member</MenuItem>
                                    <MenuItem value="corporate">Corporate</MenuItem>
                                    <MenuItem value="employee">Employee</MenuItem>
                                    <MenuItem value="guest">Guest</MenuItem>
                                    <MenuItem value="dineIn">Dine-In</MenuItem>
                                    <MenuItem value="delivery">Delivery</MenuItem>
                                    <MenuItem value="takeaway">Takeaway</MenuItem>
                                    <MenuItem value="reservation">Reservation</MenuItem>
                                    <MenuItem value="room_service">Room Service</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Search by Name with Autocomplete */}
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={suggestions}
                                getOptionLabel={(option) => option.value || option.name || option.full_name || option}
                                inputValue={searchName}
                                onInputChange={(event, newInputValue) => {
                                    setSearchName(newInputValue);
                                }}
                                loading={loadingSuggestions}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Search Name" placeholder="Customer Name..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
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
                                                {option.name || option.full_name || option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* Order ID */}
                        <Grid item xs={12} md={2}>
                            <TextField fullWidth size="small" label="Order ID" placeholder="Order ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                        </Grid>

                        {/* Start Date */}
                        <Grid item xs={12} md={2}>
                            <TextField fullWidth size="small" type="text" label="Start Date" placeholder="dd/mm/yyyy" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                        </Grid>

                        {/* End Date */}
                        <Grid item xs={12} md={2}>
                            <TextField fullWidth size="small" type="text" label="End Date" placeholder="dd/mm/yyyy" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                        </Grid>

                        {/* Status */}
                        <Grid item xs={12} md={2}>
                            <FormControl size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} displayEmpty MenuProps={menuProps}>
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="paid">Paid</MenuItem>
                                    <MenuItem value="awaiting">Awaiting</MenuItem>
                                    <MenuItem value="unpaid">Unpaid</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Payment Method */}
                        <Grid item xs={12} md={2}>
                            <FormControl size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} displayEmpty MenuProps={menuProps}>
                                    <MenuItem value="all">All Methods</MenuItem>
                                    <MenuItem value="cash">Cash</MenuItem>
                                    <MenuItem value="credit_card">Credit Card</MenuItem>
                                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                    <MenuItem value="split_payment">Split Payment</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Adjustment Type (ENT/CTS) */}
                        <Grid item xs={12} md={2}>
                            <FormControl size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)} displayEmpty MenuProps={menuProps}>
                                    <MenuItem value="all">All Adjustments</MenuItem>
                                    <MenuItem value="ent">ENT Only</MenuItem>
                                    <MenuItem value="cts">CTS Only</MenuItem>
                                    <MenuItem value="none">No Adjustments</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Table */}
                        <Grid item xs={12} md={2}>
                            <FormControl size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select value={tableId} onChange={(e) => setTableId(e.target.value)} displayEmpty MenuProps={menuProps}>
                                    <MenuItem value="">All Tables</MenuItem>
                                    {tables.map((t) => (
                                        <MenuItem key={t.id} value={t.id}>
                                            {t.table_no}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Waiter */}
                        <Grid item xs={12} md={2}>
                            <FormControl size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select value={waiterId} onChange={(e) => setWaiterId(e.target.value)} displayEmpty MenuProps={menuProps}>
                                    <MenuItem value="">All Waiters</MenuItem>
                                    {waiters.map((w) => (
                                        <MenuItem key={w.id} value={w.id}>
                                            {w.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Cashier */}
                        <Grid item xs={12} md={2}>
                            <FormControl size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}>
                                <Select value={cashierId} onChange={(e) => setCashierId(e.target.value)} displayEmpty MenuProps={menuProps}>
                                    <MenuItem value="">All Cashiers</MenuItem>
                                    {cashiers.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Action Buttons */}
                        <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: '16px', textTransform: 'none', color: '#063455', border: '1px solid #063455', px: 4 }}>
                                Reset
                            </Button>
                            <Button variant="contained" startIcon={<Search />} onClick={handleApply} sx={{ borderRadius: '16px', backgroundColor: '#063455', textTransform: 'none', px: 4 }}>
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {/* Table */}
                <TableContainer sx={{ borderRadius: '12px' }}>
                    {isLoading && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                zIndex: 10,
                            }}
                        >
                            <CircularProgress size={40} />
                        </Box>
                    )}
                    <Table>
                        <TableHead sx={{ backgroundColor: '#063455' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Order</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Date</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Membership</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Customer Type</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Order Type</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Table</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Gross</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Disc</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Tax</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Total</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Paid</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Balance</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Method</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Order Status</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Status</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>ENT</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>CTS</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Cashier</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Restaurant</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders?.data?.length > 0 ? (
                                <>
                                    {orders.data.map((order) => {
                                        const round0 = (n) => Math.round(Number(n) || 0);
                                        const gross = round0(order.invoice_sub_total ?? order.amount ?? 0);
                                        const discount = round0(order.invoice_discount_amount ?? order.discount ?? 0);
                                        const taxRate = Number(order.tax || 0);
                                        // Calculate tax based on items if invoice tax not available (approximate if items not loaded, but history loads items?)
                                        // Ideally backend should provide tax_amount. If not, we fallback.
                                        // But order.invoice_tax_amount is best.
                                        // If fallback needed, we need to know taxable items.
                                        // Since items might not be loaded in list view (optimization in backend), we rely on order.tax (amount?) or order.invoice_tax_amount.
                                        // Actually, in backend orderHistory, we REMOVED 'orderItems'. So we can't calculate per item here!
                                        // We must rely on order.tax being the AMOUNT if calculated by backend?
                                        // Backend sends 'tax' column. Is it rate or amount?
                                        // In OrderController::update, 'tax' is saved as rate?
                                        // $order->update(['tax' => $validated['tax_rate']]);
                                        // So order.tax is RATE.
                                        // We cannot calculate tax amount without items if we don't have stored tax amount.
                                        // But wait, Order model doesn't have 'tax_amount' column? It has 'tax' (rate).
                                        // And 'total_price'.
                                        // Backend doesn't store calculated tax amount on Order?
                                        // It seems we might be missing a column 'tax_amount' on orders table?
                                        // But invoice has it.
                                        // If order items are not loaded, we can't calc tax.
                                        // However, the previous code was: const taxAmount = round0(order.invoice_tax_amount ?? (gross - discount) * taxRate);
                                        // This assumes all items are taxable if invoice is missing.
                                        // Let's leave it as is for now, but if user complains about history list mismatch, it's because items aren't loaded to check is_taxable.
                                        // But wait, user said "in the order history details". Details modal LOADS items.
                                        // View Modal uses `selectedOrder` which has items.
                                        // So I should fix getReceiptData or the View Modal logic.
                                        const taxAmount = round0(order.invoice_tax_amount ?? (gross - discount) * taxRate);
                                        const total = round0(order.total_price || 0);
                                        const advance = round0(order.invoice_advance_payment || order.down_payment || order.invoice_advance_deducted || 0);
                                        const paid = round0(order.paid_amount || 0) + advance;
                                        const entAmount = round0(order.invoice_ent_amount || 0);
                                        const ctsAmount = round0(order.invoice_cts_amount || 0);
                                        const balance = round0(total - paid - entAmount - ctsAmount);

                                        // Determine Client Type
                                        let clientType = 'Guest';
                                        if (order.employee) clientType = 'Employee';
                                        else if (order.member) {
                                            clientType = order.member.member_type?.name === 'Corporate' ? 'Corporate' : 'Member';
                                        } else if (order.customer && order.customer.guest_type) {
                                            clientType = order.customer.guest_type.name || 'Guest';
                                        }

                                        // Determine ID
                                        let clientId = '-';
                                        if (order.member) clientId = order.member.membership_no;
                                        else if (order.customer) clientId = order.customer.customer_no;
                                        else if (order.employee) clientId = order.employee.employee_id;

                                        return (
                                            <TableRow key={order.id} hover>
                                                <TableCell>#{order.id}</TableCell>
                                                <TableCell>{toDMY(order.start_date)}</TableCell>
                                                <TableCell>{clientId}</TableCell>
                                                <TableCell>{getClientName(order)}</TableCell>
                                                <TableCell>{clientType}</TableCell>
                                                <TableCell>{formatOrderType(order.order_type)}</TableCell>
                                                <TableCell>{order.table?.table_no || '-'}</TableCell>
                                                <TableCell>{gross}</TableCell>
                                                <TableCell>{discount}</TableCell>
                                                <TableCell>{taxAmount}</TableCell>
                                                <TableCell>{total}</TableCell>
                                                <TableCell>{paid}</TableCell>
                                                <TableCell sx={{ color: balance > 0 ? 'red' : 'green' }}>{balance}</TableCell>
                                                <TableCell>{order.payment_method || '-'}</TableCell>
                                                <TableCell>
                                                    <Chip label={formatOrderStatus(order.status)} size="small" color={getOrderStatusColor(order.status)} />
                                                </TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const isPaid = String(order.payment_status || '').toLowerCase() === 'paid';
                                                        const canPay = !isPaid && Boolean(order.invoice_id);
                                                        return <Chip label={isPaid ? 'Paid' : 'Unpaid'} size="small" color={isPaid ? 'success' : 'warning'} clickable={canPay} onClick={canPay ? () => handlePayNow(order) : undefined} sx={canPay ? { cursor: 'pointer' } : undefined} />;
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    {order.invoice_ent_amount > 0 ? (
                                                        <Tooltip title={order.invoice_ent_reason || 'ENT Applied'}>
                                                            <Chip label={`Rs ${order.invoice_ent_amount}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }} />
                                                        </Tooltip>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {order.invoice_cts_amount > 0 ? (
                                                        <Tooltip title={order.invoice_cts_comment || 'CTS Applied'}>
                                                            <Chip label={`Rs ${order.invoice_cts_amount}`} size="small" sx={{ bgcolor: '#fff3e0', color: '#ef6c00' }} />
                                                        </Tooltip>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>{order.cashier?.name || order.user?.name || '-'}</TableCell>
                                                <TableCell>{order.tenant?.name || '-'}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Tooltip title="View Details">
                                                            <IconButton size="small" onClick={() => handleViewOrder(order)} sx={{ color: '#1976d2' }}>
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {canPrintInvoice(order) && (
                                                            <Tooltip title="Print Receipt">
                                                                <IconButton size="small" onClick={() => handlePrintReceipt(order)} sx={{ color: '#063455' }}>
                                                                    <PrintIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {(Boolean(canEditAfterBill) || canEditOrderBeforePayment(order)) && (
                                                            <Tooltip title="Edit Order">
                                                                <IconButton size="small" onClick={() => handleOpenEdit(order)} sx={{ color: '#003153' }}>
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                        <TableCell colSpan={10} sx={{ fontWeight: 700, color: '#063455' }}>
                                            Grand Total (Current Page)
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#063455' }}>{orderHistoryPageTotals.amount.toLocaleString()}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#063455' }}>{orderHistoryPageTotals.paid.toLocaleString()}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: orderHistoryPageTotals.balance > 0 ? 'error.main' : 'success.main' }}>{orderHistoryPageTotals.balance.toLocaleString()}</TableCell>
                                        <TableCell colSpan={8} />
                                    </TableRow>
                                </>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={15} align="center">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {orders?.last_page > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination count={orders.last_page} page={orders.current_page} onChange={handlePageChange} color="primary" />
                    </Box>
                )}
            </Box>

            {/* View Order Modal */}
            <Dialog
                open={viewModalOpen}
                onClose={handleCloseModal}
                maxWidth="lg"
                fullWidth
                scroll="paper"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden',
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#063455', color: '#fff' }}>
                    <Typography variant="h6">Order Details - #{selectedOrder?.id}</Typography>
                    <IconButton onClick={handleCloseModal} sx={{ color: '#fff' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent
                    sx={{
                        p: { xs: 2, md: 3 },
                        bgcolor: '#f5f5f5',
                    }}
                >
                    {selectedOrder && (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '420px 1fr' },
                                gap: { xs: 2, md: 3 },
                                alignItems: 'start',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Receipt invoiceData={getReceiptData(selectedOrder)} openModal={viewModalOpen} showButtons={false} layout="modal" includePaymentBreakdown={false} />
                            </Box>
                            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 'none' }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Order Information
                                </Typography>
                                {loadingOrderDetails && <CircularProgress size={18} sx={{ mb: 2 }} />}
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Order Type
                                        </Typography>
                                        <Typography variant="body1">{formatOrderType(selectedOrder.order_type)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Date
                                        </Typography>
                                        <Typography variant="body1">{toDMY(selectedOrder.start_date)}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Order Status
                                        </Typography>
                                        <Box>
                                            <Chip label={formatOrderStatus(selectedOrder.status)} size="small" color={getOrderStatusColor(selectedOrder.status)} />
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Payment Status
                                        </Typography>
                                        <Box>
                                            <Chip label={selectedOrder.payment_status || 'unpaid'} size="small" color={getStatusColor(selectedOrder.payment_status)} />
                                        </Box>
                                    </Box>
                                    {selectedOrder.table && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Table
                                            </Typography>
                                            <Typography variant="body1">{selectedOrder.table.table_no}</Typography>
                                        </Box>
                                    )}
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Payment Method
                                        </Typography>
                                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                            {(selectedOrderDetails?.payment_method || selectedOrder.payment_method)?.replace('_', ' ') || '-'}
                                        </Typography>
                                    </Box>
                                    {(selectedOrderDetails?.payment_meta?.payment_account?.name || Object.keys(selectedOrderDetails?.payment_meta?.split_payment_accounts || {}).length > 0) && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Payment Account
                                            </Typography>
                                            {selectedOrderDetails?.payment_method === 'split_payment' ? (
                                                <Box>
                                                    {['cash', 'credit_card', 'bank'].map((methodKey) => {
                                                        const account = selectedOrderDetails?.payment_meta?.split_payment_accounts?.[methodKey];
                                                        const amountFromReceipt = selectedOrderDetails?.payment_meta?.payment_details?.split_payment?.[methodKey];
                                                        const amountFromOrder = methodKey === 'cash' ? selectedOrderDetails?.cash_amount : methodKey === 'credit_card' ? selectedOrderDetails?.credit_card_amount : selectedOrderDetails?.bank_amount;
                                                        const amount = Number(amountFromReceipt ?? amountFromOrder ?? 0);

                                                        if (!account?.name && !amount) return null;

                                                        const label = methodKey === 'cash' ? 'Cash' : methodKey === 'credit_card' ? 'Credit Card' : 'Bank Transfer';

                                                        return (
                                                            <Typography key={methodKey} variant="body2" sx={{ fontWeight: 500 }}>
                                                                {label}: {amount ? `Rs ${amount}` : 'N/A'}
                                                                {account?.name ? ` (${account.name})` : ''}
                                                            </Typography>
                                                        );
                                                    })}
                                                </Box>
                                            ) : (
                                                <Typography variant="body1">{selectedOrderDetails?.payment_meta?.payment_account?.name}</Typography>
                                            )}
                                        </Box>
                                    )}
                                    {selectedOrder.cashier && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Cashier
                                            </Typography>
                                            <Typography variant="body1">{selectedOrder.cashier.name}</Typography>
                                        </Box>
                                    )}
                                    {selectedOrder.waiter && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Waiter
                                            </Typography>
                                            <Typography variant="body1">{selectedOrder.waiter.name}</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Service & Bank Charges Detail in Modal */}
                                {Number(selectedOrder.service_charges) > 0 && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Service Charges
                                        </Typography>
                                        <Typography variant="body1">Rs. {selectedOrder.service_charges}</Typography>
                                    </Box>
                                )}
                                {Number(selectedOrder.bank_charges) > 0 && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Bank Charges
                                        </Typography>
                                        <Typography variant="body1" color="error">
                                            Rs. {selectedOrder.bank_charges}
                                        </Typography>
                                    </Box>
                                )}
                                {Number(selectedOrder.invoice_ent_amount) > 0 && (
                                    <Box sx={{ gridColumn: 'span 2' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            ENT Details
                                        </Typography>
                                        <Typography variant="body1">Amount: Rs. {selectedOrder.invoice_ent_amount}</Typography>
                                        <Typography variant="body2" sx={{ color: '#455a64' }}>
                                            Reason: {selectedOrder.invoice_ent_reason || '-'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#455a64' }}>
                                            Comment: {selectedOrder.invoice_ent_comment || '-'}
                                        </Typography>
                                    </Box>
                                )}
                                {Number(selectedOrder.invoice_cts_amount) > 0 && (
                                    <Box sx={{ gridColumn: 'span 2' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            CTS Details
                                        </Typography>
                                        <Typography variant="body1">Amount: Rs. {selectedOrder.invoice_cts_amount}</Typography>
                                        <Typography variant="body2" sx={{ color: '#455a64' }}>
                                            Comment: {selectedOrder.invoice_cts_comment || '-'}
                                        </Typography>
                                    </Box>
                                )}

                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Order Items
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                                    <Table size="small" sx={{ minWidth: 700 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Item</TableCell>
                                                <TableCell align="right">Qty</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Discount</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell align="right">Net</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedOrder.order_items
                                                ?.filter((item) => item.status !== 'cancelled')
                                                .map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{item.order_item?.name || 'Item'}</TableCell>
                                                        <TableCell align="right">{item.order_item?.quantity || 1}</TableCell>
                                                        <TableCell align="right">Rs. {item.order_item?.price || 0}</TableCell>
                                                        <TableCell align="right">Rs. {item.order_item?.discount_amount || 0}</TableCell>
                                                        <TableCell align="right">Rs. {item.order_item?.total_price || (item.order_item?.quantity || 1) * (item.order_item?.price || 0)}</TableCell>
                                                        <TableCell align="right">Rs. {(Number(item.order_item?.total_price || (item.order_item?.quantity || 1) * (item.order_item?.price || 0)) - Number(item.order_item?.discount_amount || 0)).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {selectedOrder.order_items?.some((item) => item.status === 'cancelled') && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 1, color: '#d32f2f', fontWeight: 600 }}>
                                            Cancelled Items
                                        </Typography>
                                        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                                            <Table size="small" sx={{ minWidth: 1050 }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Item</TableCell>
                                                        <TableCell align="right">Qty</TableCell>
                                                        <TableCell align="right">Price</TableCell>
                                                        <TableCell align="right">Discount</TableCell>
                                                        <TableCell align="right">Total</TableCell>
                                                        <TableCell align="right">Net</TableCell>
                                                        <TableCell>Taxable</TableCell>
                                                        <TableCell>Discountable</TableCell>
                                                        <TableCell>Cancel Type</TableCell>
                                                        <TableCell>Remark</TableCell>
                                                        <TableCell>Instructions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {selectedOrder.order_items
                                                        ?.filter((item) => item.status === 'cancelled')
                                                        .map((item, index) => {
                                                            const qty = Number(item.order_item?.quantity || 1);
                                                            const price = Number(item.order_item?.price || 0);
                                                            const total = Number(item.order_item?.total_price || qty * price);
                                                            const disc = Number(item.order_item?.discount_amount || 0);
                                                            const net = total - disc;
                                                            const variantsText = Array.isArray(item.order_item?.variants)
                                                                ? item.order_item.variants
                                                                      .map((v) => (v?.name && v?.value ? `${v.name}: ${v.value}` : null))
                                                                      .filter(Boolean)
                                                                      .join(', ')
                                                                : '';
                                                            return (
                                                                <TableRow key={index} sx={{ '& td': { color: '#d32f2f' } }}>
                                                                    <TableCell>
                                                                        <Box>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                                {item.order_item?.name || 'Item'}
                                                                            </Typography>
                                                                            {variantsText && (
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    {variantsText}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell align="right">{qty}</TableCell>
                                                                    <TableCell align="right">Rs. {price}</TableCell>
                                                                    <TableCell align="right">Rs. {disc}</TableCell>
                                                                    <TableCell align="right">Rs. {total}</TableCell>
                                                                    <TableCell align="right">Rs. {net.toFixed(2)}</TableCell>
                                                                    <TableCell>{item.order_item?.is_taxable ? 'Yes' : 'No'}</TableCell>
                                                                    <TableCell>{item.order_item?.is_discountable ? 'Yes' : 'No'}</TableCell>
                                                                    <TableCell>{item.cancelType || '-'}</TableCell>
                                                                    <TableCell>{item.remark || '-'}</TableCell>
                                                                    <TableCell>{item.instructions || '-'}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button variant="outlined" onClick={handleCloseModal}>
                                        Close
                                    </Button>
                                    {canPrintInvoice(selectedOrder) && (
                                        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrintReceipt(selectedOrder)} sx={{ backgroundColor: '#063455' }}>
                                            Print Receipt
                                        </Button>
                                    )}
                                </Box>
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
            <EditOrderModal open={editModalOpen} allrestaurants={allrestaurants} onClose={handleCloseEdit} order={selectedOrder} orderItems={editOrderItems} setOrderItems={setEditOrderItems} onSave={(status, clientMeta) => handleSaveEdit(status, clientMeta)} onSaveAndPrint={null} allowUpdateAndPrint={false} />
            {paymentModalOpen && selectedInvoice && (
                <PaymentNow
                    invoiceData={selectedInvoice}
                    openSuccessPayment={() => {
                        setPaymentModalOpen(false);
                        setSelectedInvoice(null);
                        handleApply();
                    }}
                    openPaymentModal={paymentModalOpen}
                    handleClosePayment={() => {
                        setPaymentModalOpen(false);
                        setSelectedInvoice(null);
                        handleApply();
                    }}
                    setSelectedOrder={() => {}}
                    isLoading={false}
                    mode="payment"
                />
            )}
            {/* </Box > */}
        </>
    );
};

Dashboard.layout = (page) => <POSLayout>{page}</POSLayout>;

export default Dashboard;
