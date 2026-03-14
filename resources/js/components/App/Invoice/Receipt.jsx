import { usePage } from '@inertiajs/react';
import { Print as PrintIcon } from '@mui/icons-material';
import { Avatar, Box, Button, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';

// Receipt component for reuse
const Receipt = ({ invoiceId = null, invoiceData = null, openModal = false, showButtons = true, closeModal, invoiceRoute, layout = 'side', containerSx, includePaymentBreakdown = true }) => {
    const isModalLayout = layout === 'modal';
    const styles = {
        receiptContainer: {
            width: invoiceRoute || isModalLayout ? '100%' : '40%',
            backgroundColor: isModalLayout ? '#fff' : '#f5f5f5',
            padding: isModalLayout ? '16px' : '20px',
            borderRight: isModalLayout ? 'none' : '1px solid #ddd',
            border: isModalLayout ? '1px solid #e0e0e0' : undefined,
            borderRadius: isModalLayout ? '12px' : undefined,
            boxShadow: isModalLayout ? '0 1px 2px rgba(0,0,0,0.06)' : undefined,
            fontFamily: 'monospace',
            fontSize: '12px',
            overflowY: isModalLayout ? 'visible' : 'auto',
            height: isModalLayout ? 'auto' : '100vh',
            maxWidth: isModalLayout ? 420 : undefined,
            marginLeft: isModalLayout ? 'auto' : undefined,
            marginRight: isModalLayout ? 'auto' : undefined,
        },
        receiptHeader: {
            textAlign: 'center',
            marginBottom: '10px',
        },
        receiptOrderId: {
            border: '1px dashed #ccc',
            padding: '10px',
            textAlign: 'center',
            marginBottom: '15px',
        },
        receiptDivider: {
            borderTop: '1px dashed #ccc',
            margin: '10px 0',
        },
        receiptFooter: {
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '11px',
        },
        receiptLogo: {
            width: '80px',
        },
        receiptRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
        },
        receiptTotal: {
            fontWeight: 'bold',
            marginTop: '10px',
            borderTop: '1px dashed #ccc',
            paddingTop: '10px',
        },
    };

    const { auth } = usePage().props;
    const user = auth.user;

    const [loading, setLoading] = useState(true);

    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        // If invoiceData is provided directly, use it (for order mode)
        if (invoiceData) {
            let member = invoiceData.member ?? null;
            let customer = invoiceData.customer ?? null;
            let employee = invoiceData.employee ?? null;

            if (!customer && !employee && member?.booking_type) {
                if (member.booking_type === 'guest') {
                    customer = member;
                    member = null;
                } else if (member.booking_type === 'employee') {
                    employee = member;
                    member = null;
                }
            }

            // Restructure the data to match expected format
            const restructuredData = {
                ...invoiceData,
                id: invoiceData.id || null,
                order_no: invoiceData.order_no || 'N/A',
                start_date: invoiceData.date ? (typeof invoiceData.date === 'string' ? invoiceData.date : new Date(invoiceData.date).toLocaleDateString()) : new Date().toLocaleDateString(),
                amount: invoiceData.price || invoiceData.amount || 0,
                discount: invoiceData.discount || 0,
                tax: invoiceData.tax || 0,
                total_price: invoiceData.total_price || 0,
                order_type: invoiceData.order_type || 'N/A',
                member,
                customer,
                employee,
                tenant: invoiceData.tenant || null,
                table: invoiceData.table || null,
                cashier: invoiceData.cashier || null,
                waiter: invoiceData.waiter || null,
                order_items: invoiceData.order_items || [],
                paid_amount: invoiceData.receipt_paid_amount ?? invoiceData.paid_amount ?? null,
                customer_changes: invoiceData.receipt_customer_changes ?? invoiceData.customer_changes ?? 0,
                advance_payment: invoiceData.advance_payment || invoiceData.advance_amount || invoiceData.down_payment || invoiceData.data?.advance_deducted || 0,
                service_charges: invoiceData.service_charges || 0,
                service_charges_percentage: invoiceData.service_charges_percentage || 0,
                bank_charges: invoiceData.bank_charges || 0,
                bank_charges_percentage: invoiceData.bank_charges_percentage || 0,
                ent_amount: invoiceData.ent_amount || invoiceData.invoice_ent_amount || invoiceData.data?.ent_amount || 0,
                cts_amount: invoiceData.cts_amount || invoiceData.invoice_cts_amount || invoiceData.data?.cts_amount || 0,
            };
            setPaymentData(restructuredData);
            setLoading(false);
        }
        // Otherwise fetch by invoiceId (for payment mode)
        else if (openModal && invoiceId) {
            setLoading(true);
            axios.get(route(invoiceRoute ? invoiceRoute : 'transaction.invoice', { invoiceId: invoiceId })).then((response) => {
                console.log('response', response.data);

                setPaymentData(response.data);
                setLoading(false);
            });
        }
    }, [openModal, invoiceId, invoiceData]); // Trigger on modal open and invoiceId change

    if (loading) {
        return (
            <Box
                sx={{
                    ...styles.receiptContainer,
                    ...(containerSx || {}),
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        ); // Display loading state until data is fetched
    }

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
        return {
            gross: round0(gross),
            discount: round0(discount),
            taxableNet: round0(taxableNet),
        };
    };

    const computedItems = computeFromItems(paymentData.order_items);
    const computedGross = computedItems.gross || round0(paymentData.amount);
    const computedDiscount = computedItems.discount || round0(paymentData.discount);
    const taxRate = Number(paymentData.tax) || 0;
    const computedTaxableNet = computedItems.taxableNet > 0 ? computedItems.taxableNet : Math.max(0, computedGross - computedDiscount);
    const computedTax = round0(computedTaxableNet * taxRate);

    const totalAmount = round0(paymentData.total_price);
    const advancePaid = round0(paymentData.advance_payment || paymentData.data?.advance_deducted || 0);
    const entAmount = round0(paymentData.ent_amount || paymentData.invoice_ent_amount || paymentData.data?.ent_amount || 0);
    const ctsAmount = round0(paymentData.cts_amount || paymentData.invoice_cts_amount || paymentData.data?.cts_amount || 0);
    const netPayable = Math.max(0, totalAmount - advancePaid - entAmount - ctsAmount);
    const paidCash = round0(paymentData.paid_amount || 0);
    const remainingDue = Math.max(0, netPayable - paidCash);
    const explicitCustomerChange = round0(paymentData.customer_changes || paymentData.data?.customer_changes || 0);
    const customerChangeAmount = explicitCustomerChange > 0 ? explicitCustomerChange : Math.max(0, paidCash - netPayable);
    const handlePrintReceipt = (data) => {
        if (!data) return;

        const printWindow = window.open('', '_blank');

        const printComputed = computeFromItems(data.order_items);
        const printGross = printComputed.gross || round0(data.amount);
        const printDiscount = printComputed.discount || round0(data.discount);
        const printTaxRate = Number(data.tax) || 0;
        const printTaxableNet = printComputed.taxableNet > 0 ? printComputed.taxableNet : Math.max(0, printGross - printDiscount);
        const printTax = round0(printTaxableNet * printTaxRate);

        const printTotalAmount = round0(data.total_price);
        const printAdvancePaid = round0(data.advance_payment || data.data?.advance_deducted || 0);
        const printEntAmount = round0(data.ent_amount || data.invoice_ent_amount || data.data?.ent_amount || 0);
        const printCtsAmount = round0(data.cts_amount || data.invoice_cts_amount || data.data?.cts_amount || 0);
        const printNetPayable = Math.max(0, printTotalAmount - printAdvancePaid - printEntAmount - printCtsAmount);
        const printPaidCash = round0(data.receipt_paid_amount ?? data.paid_amount ?? 0);
        const printRemainingDue = Math.max(0, printNetPayable - printPaidCash);
        const explicitPrintChange = round0(data.receipt_customer_changes ?? data.customer_changes ?? data.data?.customer_changes ?? 0);
        const printCustomerChange = explicitPrintChange > 0 ? explicitPrintChange : Math.max(0, printPaidCash - printNetPayable);

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
            ${includePaymentBreakdown && printEntAmount > 0 ? `<div class="row"><div>ENT</div><div>- Rs ${printEntAmount}</div></div>` : ''}
            ${includePaymentBreakdown && printCtsAmount > 0 ? `<div class="row"><div>CTS</div><div>- Rs ${printCtsAmount}</div></div>` : ''}
            <div class="row total">
              <div>Remaining Due</div>
              <div>Rs ${printRemainingDue}</div>
            </div>

            ${
                includePaymentBreakdown && printPaidCash > 0
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

    const taxAmount = () => computedTax;

    return (
        <Box sx={{ ...styles.receiptContainer, ...(containerSx || {}) }}>
            <Box sx={styles.receiptHeader}>
                <img src={'/assets/Logo.png'} style={styles.receiptLogo} />
            </Box>
            <Box sx={styles.receiptHeader}>
                <Typography variant="caption">{paymentData.start_date}</Typography>
            </Box>

            <Box sx={styles.receiptOrderId}>
                <Typography variant="caption" color="text.secondary">
                    Order Id
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                    #{paymentData.id || paymentData.order_no || 'N/A'}
                </Typography>
            </Box>

            <Box sx={styles.receiptDivider} />

            <Box sx={styles.receiptRow}>
                <Typography variant="caption" color="text.secondary">
                    Customer Name
                </Typography>
                <Typography variant="caption">{paymentData.member?.full_name || paymentData.member?.name || paymentData.customer?.name || paymentData.employee?.name || 'N/A'}</Typography>
            </Box>

            {paymentData.member && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        Member Id Card
                    </Typography>
                    <Typography variant="caption">{paymentData.member?.membership_no}</Typography>
                </Box>
            )}
            {!paymentData.member && paymentData.employee && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        Employee ID
                    </Typography>
                    <Typography variant="caption">{paymentData.employee?.employee_id || '-'}</Typography>
                </Box>
            )}
            {!paymentData.member && !paymentData.employee && paymentData.customer && (
                <>
                    <Box sx={styles.receiptRow}>
                        <Typography variant="caption" color="text.secondary">
                            Guest No
                        </Typography>
                        <Typography variant="caption">{paymentData.customer?.customer_no || '-'}</Typography>
                    </Box>
                    {paymentData.customer?.guestType?.name && (
                        <Box sx={styles.receiptRow}>
                            <Typography variant="caption" color="text.secondary">
                                Guest Type
                            </Typography>
                            <Typography variant="caption">{paymentData.customer.guestType.name}</Typography>
                        </Box>
                    )}
                </>
            )}

            <Box sx={styles.receiptRow}>
                <Typography variant="caption" color="text.secondary">
                    Order Type
                </Typography>
                <Typography variant="caption">{paymentData.order_type}</Typography>
            </Box>

            {paymentData.table && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        Table Number
                    </Typography>
                    <Typography variant="caption">{paymentData.table?.table_no}</Typography>
                </Box>
            )}
            {paymentData.tenant && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        Restaurant
                    </Typography>
                    <Typography variant="caption">{paymentData.tenant?.name}</Typography>
                </Box>
            )}

            <Box sx={styles.receiptDivider} />

            {paymentData.order_items &&
                paymentData.order_items
                    .filter((item) => item.status !== 'cancelled')
                    .map((item, index) => (
                        <Box key={index} mb={1.5}>
                            <Typography variant="caption" fontWeight="medium">
                                {item.order_item?.name || item.name}
                            </Typography>
                            <Box sx={styles.receiptRow}>
                                <Typography variant="caption" color="text.secondary">
                                    {item.order_item?.quantity || item.quantity} x Rs {item.order_item?.price || item.price}
                                </Typography>
                                <Typography variant="caption">Rs {item.order_item?.total_price || (item.order_item?.quantity || item.quantity) * (item.order_item?.price || item.price)}</Typography>
                            </Box>
                        </Box>
                    ))}

            <Box sx={styles.receiptDivider} />

            <Box sx={styles.receiptRow}>
                <Typography variant="caption" color="text.secondary">
                    Subtotal
                </Typography>
                <Typography variant="caption">Rs {computedGross}</Typography>
            </Box>

            <Box sx={styles.receiptRow}>
                <Typography variant="caption" color="text.secondary">
                    Discount
                </Typography>
                <Typography variant="caption">Rs {computedDiscount}</Typography>
            </Box>

            <Box sx={styles.receiptRow}>
                <Typography variant="caption" color="text.secondary">
                    Tax ({(paymentData.tax * 100).toFixed(0)}%)
                </Typography>
                <Typography variant="caption">Rs {taxAmount()}</Typography>
            </Box>

            {paymentData.service_charges > 0 && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        Service Charges{paymentData.service_charges_percentage > 0 ? ` (${paymentData.service_charges_percentage}%)` : ''}
                    </Typography>
                    <Typography variant="caption">Rs {paymentData.service_charges}</Typography>
                </Box>
            )}

            {paymentData.bank_charges > 0 && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        Bank Charges{paymentData.bank_charges_percentage > 0 ? ` (${paymentData.bank_charges_percentage}%)` : ''}
                    </Typography>
                    <Typography variant="caption">Rs {paymentData.bank_charges}</Typography>
                </Box>
            )}
            <Box sx={styles.receiptDivider} />
            {advancePaid > 0 && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        Advance Paid
                    </Typography>
                    <Typography variant="caption">Rs {advancePaid}</Typography>
                </Box>
            )}
            {includePaymentBreakdown && entAmount > 0 && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        ENT
                    </Typography>
                    <Typography variant="caption">Rs {entAmount}</Typography>
                </Box>
            )}
            {includePaymentBreakdown && ctsAmount > 0 && (
                <Box sx={styles.receiptRow}>
                    <Typography variant="caption" color="text.secondary">
                        CTS
                    </Typography>
                    <Typography variant="caption">Rs {ctsAmount}</Typography>
                </Box>
            )}

            <Box sx={styles.receiptRow}>
                <Typography variant="caption" color="text.secondary">
                    Remaining Due
                </Typography>
                <Typography variant="caption">Rs {remainingDue}</Typography>
            </Box>

            {includePaymentBreakdown && paidCash > 0 && (
                <>
                    <Box sx={styles.receiptRow}>
                        <Typography variant="caption" color="text.secondary">
                            Total Cash
                        </Typography>
                        <Typography variant="caption">Rs{paidCash}</Typography>
                    </Box>
                    <Box sx={styles.receiptRow}>
                        <Typography variant="caption" color="text.secondary">
                            Customer Changes
                        </Typography>
                        <Typography variant="caption">Rs{customerChangeAmount}</Typography>
                    </Box>
                </>
            )}

            <Box sx={styles.receiptTotal}>
                <Typography variant="body2" fontWeight="bold" color="#0a3d62">
                    Total Amount
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="#0a3d62">
                    Rs {totalAmount}
                </Typography>
            </Box>
            <Box sx={styles.receiptRow}>
                <Typography variant="caption" color="text.secondary">
                    Cashier
                </Typography>
                <Typography variant="caption">{paymentData.cashier ? paymentData.cashier.name : user.name}</Typography>
            </Box>

            <Box sx={styles.receiptFooter}>
                <Typography variant="caption" fontSize="0.65rem">
                    Thanks for having our passion. Drop by again. If your orders aren't still visible, you're always welcome here!
                </Typography>
            </Box>

            {showButtons && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 3,
                    }}
                >
                    <Button
                        variant="outlined"
                        onClick={closeModal}
                        sx={{
                            color: '#333',
                            borderColor: '#ddd',
                            textTransform: 'none',
                        }}
                    >
                        Close
                    </Button>
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrintReceipt(paymentData)} sx={styles.printReceiptButton}>
                        Print Receipt
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default Receipt;
