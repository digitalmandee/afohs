import { Close as CloseIcon, Home as HomeIcon, Print as PrintIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import { Avatar, Box, Button, Chip, Dialog, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { routeNameForContext } from '@/lib/utils';

const OrderDetail = ({ invoiceId, openModal, closeModal, handleOpenTrackOrder }) => {
    const [loading, setLoading] = useState(true);

    const [paymentData, setPaymentData] = useState(null);
    const splitPaymentLabels = { cash: 'Cash', credit_card: 'Credit Card', bank: 'Bank Transfer' };

    useEffect(() => {
        if (openModal && invoiceId) {
            setLoading(true);
            axios.get(route(routeNameForContext('transaction.invoice'), { invoiceId: invoiceId })).then((response) => {
                setPaymentData(response.data);
                setLoading(false);
            });
        }
    }, [openModal, invoiceId]); // Trigger on modal open and invoiceId change

    // if (loading) {
    //     return <div>Loading...</div>; // Display loading state until data is fetched
    // }

    const handlePrintOrderDetail = () => {
        const printWindow = window.open('', '_blank');

        const content = `
          <html>
            <head>
              <title>Order Detail</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .order-id { font-weight: bold; margin-bottom: 10px; }
                .customer-info { margin-bottom: 15px; }
                .item { margin-bottom: 10px; }
                .item-name { font-weight: bold; }
                .item-variant { color: #666; font-size: 12px; }
                .summary { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
                .total { font-weight: bold; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>Order Detail</h2>
                <div class="order-id">Order ID: #${paymentData.id}</div>
              </div>

              <div class="customer-info">
                <p><strong>Customer:</strong> ${paymentData.member?.full_name || paymentData.customer?.name}</p>
                ${paymentData.table ? `<p><strong>Table:</strong> ${paymentData.table?.table_no}</p>` : ''}
                <p><strong>Date:</strong> ${paymentData.start_date}</p>
                <p><strong>Cashier:</strong> ${paymentData.cashier?.name || 'N/A'}</p>
              </div>

              <h3>Items</h3>
              ${paymentData.order_items
                  .map(
                      (item) => `
                <div class="item">
                  <div class="item-name">${item.order_item.name} (${item.order_item.quantity} x Rs ${item.order_item.price})</div>
                  ${item.order_item.variants.length > 0 ? `<div class="item-variant">Variant: ${item.order_item.variants.map((v) => v.value).join(', ')}</div>` : ''}
                  <div>Rs ${item.order_item.total_price}</div>
                </div>
              `,
                  )
                  .join('')}

              <div class="summary">
                <p>Subtotal: Rs ${paymentData.amount}</p>
                <p>Discount: Rs 0.00</p>
                <p>Tax (12%): Rs ${(paymentData.amount * 0.12).toFixed(2)}</p>
                ${
                    paymentData.data?.bank_charges_amount > 0
                        ? `
                        <p>Bank Charges (${paymentData.data.bank_charges_type === 'percentage' ? paymentData.data.bank_charges_value + '%' : 'Fixed'}): Rs ${paymentData.data.bank_charges_amount}</p>
                    `
                        : ''
                }
                <p class="total">Total: Rs ${paymentData.total_price}</p>
              </div>

              <div class="payment">
                <p><strong>Payment Method:</strong> ${paymentData.payment_method}</p>
                <p><strong>Amount Paid:</strong> Rs ${paymentData.paid_amount}</p>
                <p><strong>Change:</strong> Rs ${paymentData.paid_amount - paymentData.total_price}</p>
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

    return (
        <Dialog
            open={openModal}
            onClose={closeModal}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                style: {
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    margin: 0,
                    height: '100vh',
                    maxHeight: '100vh',
                    overflow: 'auto',
                    borderRadius: 0,
                },
            }}
        >
            {loading ? (
                <LinearProgress />
            ) : (
                <Box sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" fontWeight="bold">
                            Order Detail
                        </Typography>
                        <IconButton onClick={closeModal} edge="end">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Customer Info */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                            Customer Name
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                            <Avatar
                                sx={{
                                    bgcolor: '#f5f5f5',
                                    color: '#333',
                                    width: 36,
                                    height: 36,
                                    mr: 1,
                                }}
                            >
                                {paymentData.member ? paymentData.member?.full_name.charAt(0) : paymentData.customer?.name.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="medium">
                                {paymentData.member ? `${paymentData.member?.full_name} (${paymentData.member?.membership_no})` : `${paymentData.customer?.name}`}
                            </Typography>
                            {/* {orderDetail.isVIP && (
                            <Box component="span" ml={1} display="inline-block" width={16} height={16} borderRadius="50%" bgcolor="#ffc107" />
                        )} */}
                            <Box ml="auto" display="flex" alignItems="center" gap={1}>
                                <Avatar
                                    sx={{
                                        bgcolor: '#0a3d62',
                                        color: 'white',
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    {paymentData.table?.table_no}
                                </Avatar>
                                <IconButton size="small" sx={{ border: '1px solid #e0e0e0' }}>
                                    <HomeIcon />
                                </IconButton>
                                <IconButton size="small" sx={{ border: '1px solid #e0e0e0' }}>
                                    <RoomServiceIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>

                    {/* Order Info Grid */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">
                                Order Date
                            </Typography>
                            <Typography variant="body2" mt={0.5}>
                                {paymentData.start_date}
                            </Typography>
                        </Grid>
                        {paymentData.cashier && (
                            <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">
                                    Cashier
                                </Typography>
                                <Box display="flex" alignItems="center" mt={0.5}>
                                    <Avatar
                                        src={paymentData.cashier?.profile_photo}
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            mr: 1,
                                        }}
                                    />
                                    <Typography variant="body2">{paymentData.cashier?.name}</Typography>
                                </Box>
                            </Grid>
                        )}
                        {/* <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                            Working Time
                        </Typography>
                        <Typography variant="body2" mt={0.5}>
                            {orderDetail.workingTime}
                        </Typography>
                    </Grid> */}
                    </Grid>

                    {/* Order ID */}
                    <Box sx={{ mb: 3 }}>
                        <Chip
                            label={`Order Id : #${paymentData.id}`}
                            sx={{
                                backgroundColor: '#f5f5f5',
                                color: '#333',
                                fontWeight: 500,
                                borderRadius: '4px',
                            }}
                        />
                    </Box>

                    {/* Order Items */}
                    <Box sx={{ mb: 3 }}>
                        {paymentData.order_items.map((item, index) => (
                            <Box key={index} display="flex" alignItems="center" mb={2}>
                                {item.order_item.image && (
                                    <img
                                        src={item.order_item.image || '/placeholder.svg'}
                                        alt={item.order_item.name}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: 8,
                                            objectFit: 'cover',
                                        }}
                                    />
                                )}
                                <Box ml={2} flex={1}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {item.order_item.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {item.order_item.category}
                                    </Typography>
                                    {item.order_item.variants && item.order_item.variants.length > 0 && (
                                        <Typography variant="caption" color="text.secondary">
                                            Variant: {item.order_item.variants.map((v) => v.value).join(', ')}
                                        </Typography>
                                    )}
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="caption" color="text.secondary">
                                        Qty: {item.order_item.quantity} x Rs {item.order_item.price}
                                    </Typography>
                                    <Typography variant="subtitle2" fontWeight="bold" display="block">
                                        Rs {item.order_item.total_price}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Order Summary */}
                    <Box sx={{ mb: 3 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                                Subtotal
                            </Typography>
                            <Typography variant="body2">Rs {paymentData.amount}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                                Discount
                            </Typography>
                            <Typography variant="body2" color="#4caf50">
                                Rs 0% (0)
                            </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                                Tax 12%
                            </Typography>
                            <Typography variant="body2">Rs {(paymentData.amount * 0.12).toFixed(2)}</Typography>
                        </Box>

                        {/* Bank Charges */}
                        {paymentData.data?.bank_charges_amount > 0 && (
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">
                                    Bank Charges ({paymentData.data.bank_charges_type === 'percentage' ? paymentData.data.bank_charges_value + '%' : 'Fixed'})
                                </Typography>
                                <Typography variant="body2">Rs {paymentData.data.bank_charges_amount}</Typography>
                            </Box>
                        )}
                        <Box display="flex" justifyContent="space-between" mt={2}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Total
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Rs {paymentData.total_price}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Payment Info */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            p: 2,
                            bgcolor: '#f9f9f9',
                            borderRadius: 1,
                            mb: 3,
                        }}
                    >
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Payment
                            </Typography>
                            <Box display="flex" alignItems="center" mt={0.5}>
                                <ReceiptIcon fontSize="small" sx={{ mr: 1, color: '#0a3d62' }} />
                                <Typography variant="body2" fontWeight="medium">
                                    {paymentData.payment_method || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Cash Total
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" mt={0.5}>
                                Rs {paymentData.paid_amount || 'N/A'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Customer Change
                            </Typography>
                            <Typography variant="body2" fontWeight="medium" mt={0.5}>
                                Rs {paymentData.paid_amount - paymentData.total_price}
                            </Typography>
                        </Box>
                    </Box>

                    {(paymentData?.payment_meta?.payment_account?.name || Object.keys(paymentData?.payment_meta?.split_payment_accounts || {}).length > 0) && (
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: '#f9f9f9',
                                borderRadius: 1,
                                mb: 3,
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Payment Account
                            </Typography>

                            {paymentData?.payment_method === 'split_payment' ? (
                                <Box sx={{ mt: 0.5 }}>
                                    {['cash', 'credit_card', 'bank'].map((methodKey) => {
                                        const account = paymentData?.payment_meta?.split_payment_accounts?.[methodKey];
                                        const amountFromReceipt = paymentData?.payment_meta?.payment_details?.split_payment?.[methodKey];
                                        const amountFromOrder =
                                            methodKey === 'cash'
                                                ? paymentData?.cash_amount
                                                : methodKey === 'credit_card'
                                                  ? paymentData?.credit_card_amount
                                                  : paymentData?.bank_amount;
                                        const amount = Number(amountFromReceipt ?? amountFromOrder ?? 0);

                                        if (!account?.name && !amount) return null;

                                        return (
                                            <Typography key={methodKey} variant="body2" fontWeight="medium" sx={{ mt: 0.25 }}>
                                                {splitPaymentLabels[methodKey]}: {amount ? `Rs ${amount}` : 'N/A'}
                                                {account?.name ? ` (${account.name})` : ''}
                                            </Typography>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
                                    {paymentData?.payment_meta?.payment_account?.name}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Action Buttons */}
                    <Box display="flex" justifyContent="space-between" mt={3}>
                        <Button
                            variant="outlined"
                            onClick={handleOpenTrackOrder}
                            sx={{
                                color: '#333',
                                borderColor: '#ddd',
                                textTransform: 'none',
                            }}
                        >
                            Track Order
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={handlePrintOrderDetail}
                            sx={{
                                backgroundColor: '#0a3d62',
                                color: 'white',
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: '#083352',
                                },
                            }}
                        >
                            Print Receipt
                        </Button>
                    </Box>
                </Box>
            )}
        </Dialog>
    );
};

export default OrderDetail;
