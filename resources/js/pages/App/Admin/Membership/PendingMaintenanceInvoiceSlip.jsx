import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Drawer, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Close, Print } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import dayjs from 'dayjs';
import { toWords } from 'number-to-words';

const num = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    const n = parseFloat(String(val).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
};

const handlePrintReceipt = ({ invoice, rows, totals }) => {
    if (!invoice) return;

    const billToCategory =
        invoice?.member?.member_type?.name ||
        invoice?.member?.memberType?.name ||
        invoice?.data?.member_category ||
        invoice?.data?.category ||
        'Member';

    const invoiceData = {
        billTo: {
            name: invoice?.member?.full_name || invoice?.data?.member_name || 'N/A',
            category: billToCategory,
            membershipId: invoice?.member?.membership_no || 'N/A',
            contactNumber: invoice?.member?.mobile_number_a || 'N/A',
        },
        details: {
            printDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        },
        items: rows.map((r, idx) => ({
            srNo: r.invoice_no || idx + 1,
            description: r.description,
            startDate: r.start_date,
            endDate: r.end_date,
            invoiceAmount: r.net_amount,
            remainingAmount: r.remaining_amount,
            paidAmount: r.paid_amount,
        })),
        summary: {
            subTotal: totals.net,
            grandTotal: totals.net,
            remainingAmount: totals.remaining,
            paidAmount: totals.paid,
            remarks: invoice.remarks || '',
        },
        note: 'This is a computer-generated receipt. It does not require any signature or stamp.',
        paymentNote: 'If paid by credit card or cheque, 5% surcharge will be added to the total amount.',
        amountInWords: toWords(Math.round(totals.net)),
        sentBy: 'Admin',
    };

    const printWindow = window.open('', '_blank');

    const content = `
        <html>
        <head>
          <title>Pending Maintenance Invoice</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; }
            .container { max-width: 900px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; }
            .logo-section { display: flex; align-items: center; width: 33%; }
            .logo { height: 60px; }
            .company-info { text-align: center; width: 33%; }
            .company-name { font-size: 18px; font-weight: bold; color: #063455; margin: 0 0 5px 0; }
            .company-address { font-size: 12px; color: #555; line-height: 1.4; margin: 0; }
            .invoice-title-section { text-align: right; width: 33%; }
            .invoice-title { font-size: 18px; font-weight: bold; color: #333; margin: 0 0 5px 0; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .status-paid { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .status-unpaid { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .status-default { background-color: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }

            .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .info-column { width: 48%; }
            .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px; }
            .info-row { font-size: 13px; margin-bottom: 6px; display: flex; }
            .info-label { font-weight: bold; width: 120px; color: #333; }
            .info-value { color: #555; flex: 1; }

            .table-container { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; padding: 12px 8px; background-color: #f9f9f9; font-weight: bold; color: #333; border-bottom: 2px solid #eee; }
            td { padding: 12px 8px; border-bottom: 1px solid #eee; color: #444; }
            .text-right { text-align: right; }

            .summary-container { display: flex; justify-content: flex-end; margin-bottom: 40px; }
            .summary-box { width: 300px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
            .summary-label { font-weight: bold; color: #333; }
            .summary-grand-total { font-weight: bold; font-size: 15px; border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-top: 5px; padding: 10px 0; }

            .notes-container { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
            .notes-left { width: 60%; }
            .notes-right { width: 35%; text-align: right; }
            .note-title { font-weight: bold; margin-bottom: 5px; color: #333; }
            .amount-words { margin-top: 10px; font-weight: bold; font-style: italic; }

            @media print {
              @page { size: auto; margin: 5mm; }
              body { background-color: white; margin: 0; padding: 0; }
              .container { width: 100%; max-width: 100%; padding: 20px; margin: 0; box-shadow: none; border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-section">
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c95d02f2c4a986d4f386920c76ff57c18c81985-YeMq5tNsLWF62HBaZY1Gz1HsT7RyLX.png" alt="Logo" class="logo">
              </div>
              <div class="company-info">
                <div class="company-name">Afohs Club</div>
                <div class="company-address">PAF Falcon complex, Gulberg III,<br>Lahore, Pakistan</div>
              </div>
              <div class="invoice-title-section">
                <div class="invoice-title">INVOICE</div>
                <span class="status-badge ${invoice.status === 'paid' ? 'status-paid' : 'status-unpaid'}">
                  ${(invoice.status || 'Unpaid').replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-column">
                <div class="section-title">Bill To: ${invoiceData.billTo.membershipId}</div>
                <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${invoiceData.billTo.name}</span></div>
                <div class="info-row"><span class="info-label">Category:</span><span class="info-value">${invoiceData.billTo.category}</span></div>
                <div class="info-row"><span class="info-label">Membership #:</span><span class="info-value">${invoiceData.billTo.membershipId}</span></div>
                <div class="info-row"><span class="info-label">Contact #:</span><span class="info-value">${invoiceData.billTo.contactNumber}</span></div>
              </div>
              <div class="info-column">
                <div class="section-title">Details</div>
                <div class="info-row"><span class="info-label">Print Date:</span><span class="info-value">${invoiceData.details.printDate}</span></div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Description</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th class="text-right">Net Amount</th>
                    <th class="text-right">Remaining</th>
                    <th class="text-right">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceData.items
                      .map(
                          (item) => `
                    <tr>
                      <td>${item.srNo}</td>
                      <td>${item.description}</td>
                      <td>${item.startDate ? new Date(item.startDate).toLocaleDateString() : ''}</td>
                      <td>${item.endDate ? new Date(item.endDate).toLocaleDateString() : ''}</td>
                      <td class="text-right">${item.invoiceAmount}</td>
                      <td class="text-right">${item.remainingAmount}</td>
                      <td class="text-right">${item.paidAmount}</td>
                    </tr>
                  `,
                      )
                      .join('')}
                </tbody>
              </table>
            </div>

            <div class="summary-container">
              <div class="summary-box">
                <div class="summary-row">
                  <span class="summary-label">Subtotal</span>
                  <span>Rs ${invoiceData.summary.subTotal}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Remaining Amount</span>
                  <span>Rs ${invoiceData.summary.remainingAmount}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Paid Amount</span>
                  <span>Rs ${invoiceData.summary.paidAmount}</span>
                </div>
                <div class="summary-row summary-grand-total">
                  <span class="summary-label">Grand Total</span>
                  <span>Rs ${invoiceData.summary.grandTotal}</span>
                </div>
              </div>
            </div>

            <div class="notes-container">
              <div class="notes-left">
                <div class="note-title">Note:</div>
                <div>${invoiceData.note}</div>
                ${invoiceData.summary.remarks ? `<div style="margin-top: 10px;"><strong>Remarks:</strong> ${invoiceData.summary.remarks}</div>` : ''}
              </div>
              <div class="notes-right">
                <div class="note-title">Sent By: ${invoiceData.sentBy}</div>
                <div style="margin-top: 5px;">${invoiceData.paymentNote}</div>
                <div class="amount-words">AMOUNT IN WORDS: ${invoiceData.amountInWords}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
    `;

    if (!printWindow) return;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

const PendingMaintenanceInvoiceSlip = ({ open, onClose, invoiceId }) => {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open && invoiceId) {
            setLoading(true);
            axios
                .get(route('financial-invoice', invoiceId))
                .then((response) => {
                    setInvoice(response.data.invoice);
                })
                .catch(() => {
                    setInvoice(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, invoiceId]);

    const rows = useMemo(() => {
        if (!invoice) return [];
        const list = Array.isArray(invoice.related_invoices) && invoice.related_invoices.length > 0 ? invoice.related_invoices : [invoice];

        return list.map((inv) => {
            const netAmount = num(inv.total_price || inv.amount || 0);
            const paidAmount = num(inv.paid_amount || 0);
            const remainingAmount =
                inv.customer_charges !== null && inv.customer_charges !== undefined ? num(inv.customer_charges) : Math.max(0, netAmount - paidAmount);

            const description = inv.description || (inv.items && inv.items[0] && inv.items[0].description) || 'Maintenance Fee (Pending)';
            const startDate = inv.start_date || inv.valid_from || (inv.items && inv.items[0] && inv.items[0].start_date) || null;
            const endDate = inv.end_date || inv.valid_to || (inv.items && inv.items[0] && inv.items[0].end_date) || null;

            return {
                id: inv.id,
                invoice_no: inv.invoice_no || '-',
                description,
                start_date: startDate,
                end_date: endDate,
                net_amount: netAmount,
                paid_amount: paidAmount,
                remaining_amount: remainingAmount,
            };
        });
    }, [invoice]);

    const totals = useMemo(() => {
        const net = rows.reduce((s, r) => s + num(r.net_amount), 0);
        const paid = rows.reduce((s, r) => s + num(r.paid_amount), 0);
        const remaining = rows.reduce((s, r) => s + num(r.remaining_amount), 0);
        return { net, paid, remaining };
    }, [rows]);

    const statusLabel = String(invoice?.status || '').toUpperCase();

    return (
        <Drawer
            anchor="top"
            open={open}
            onClose={onClose}
            ModalProps={{
                keepMounted: true,
            }}
            PaperProps={{
                sx: {
                    margin: '10px auto 0',
                    width: 930,
                    borderRadius: '8px',
                },
            }}
        >
            <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
                <Paper elevation={0} sx={{ borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    <Grid container spacing={2} sx={{ mb: 4, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                        <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c95d02f2c4a986d4f386920c76ff57c18c81985-YeMq5tNsLWF62HBaZY1Gz1HsT7RyLX.png"
                                alt="Afohs Club Logo"
                                style={{ height: '60px' }}
                            />
                        </Grid>
                        <Grid item xs={4} sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#063455', fontSize: '18px' }}>
                                Afohs Club
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#555', fontSize: '12px', lineHeight: 1.4 }}>
                                PAF Falcon complex, Gulberg III,
                                <br />
                                Lahore, Pakistan
                            </Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', fontSize: '18px' }}>
                                    Invoice
                                </Typography>
                                {invoice && (
                                    <Box
                                        sx={{
                                            display: 'inline-block',
                                            mt: 0.5,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '6px',
                                            backgroundColor: '#fee2e2',
                                            color: '#991b1b',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {statusLabel}
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    </Grid>

                    {loading ? (
                        <Box sx={{ p: 4 }}>
                            <Typography>Loading...</Typography>
                        </Box>
                    ) : !invoice ? (
                        <Box sx={{ p: 4 }}>
                            <Typography>Invoice not found</Typography>
                        </Box>
                    ) : (
                        <>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Bill To
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                        <span style={{ fontWeight: 'bold' }}>Name: </span>
                                        {invoice?.member?.full_name || invoice?.data?.member_name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                        <span style={{ fontWeight: 'bold' }}>Membership #: </span>
                                        {invoice?.member?.membership_no || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                        <span style={{ fontWeight: 'bold' }}>Contact #: </span>
                                        {invoice?.member?.mobile_number_a || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Details
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                        <span style={{ fontWeight: 'bold' }}>Print Date: </span>
                                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper} elevation={0} sx={{ mb: 3 }}>
                                <Table sx={{ minWidth: 650 }} size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Invoice #</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Description</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Start Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>End Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }} align="right">
                                                Net Amount
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }} align="right">
                                                Remaining Amount
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }} align="right">
                                                Paid Amount
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rows.map((r) => (
                                            <TableRow key={r.id || r.invoice_no}>
                                                <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{r.invoice_no}</TableCell>
                                                <TableCell sx={{ fontSize: '13px', py: 1.5, textTransform: 'capitalize' }}>{r.description}</TableCell>
                                                <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{r.start_date ? dayjs(r.start_date).format('DD-MM-YYYY') : '-'}</TableCell>
                                                <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{r.end_date ? dayjs(r.end_date).format('DD-MM-YYYY') : '-'}</TableCell>
                                                <TableCell sx={{ fontSize: '13px', py: 1.5 }} align="right">
                                                    {r.net_amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '13px', py: 1.5 }} align="right">
                                                    {r.remaining_amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '13px', py: 1.5 }} align="right">
                                                    {r.paid_amount.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Grid container spacing={2} sx={{ justifyContent: 'flex-end', mb: 2 }}>
                                <Grid item xs={12} md={5}>
                                    <Paper elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2, p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                Subtotal
                                            </Typography>
                                            <Typography variant="body2">Rs {totals.net.toLocaleString()}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                Remaining Amount
                                            </Typography>
                                            <Typography variant="body2">Rs {totals.remaining.toLocaleString()}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                Paid Amount
                                            </Typography>
                                            <Typography variant="body2">Rs {totals.paid.toLocaleString()}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                Grand Total
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                Rs {totals.net.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#374151', fontWeight: 700 }}>
                                            AMOUNT IN WORDS: {toWords(Math.round(totals.net)).toUpperCase()}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid #eee', pt: 2 }}>
                                <Button
                                    variant="outlined"
                                    sx={{
                                        textTransform: 'none',
                                        borderColor: '#ddd',
                                        color: '#555',
                                        '&:hover': { borderColor: '#bbb', backgroundColor: '#f5f5f5' },
                                    }}
                                    onClick={onClose}
                                    startIcon={<Close />}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => handlePrintReceipt({ invoice, rows, totals })}
                                    variant="contained"
                                    startIcon={<Print />}
                                    sx={{
                                        textTransform: 'none',
                                        backgroundColor: '#063455',
                                        '&:hover': { backgroundColor: '#002244' },
                                    }}
                                >
                                    Print
                                </Button>
                            </Box>
                        </>
                    )}
                </Paper>
            </Container>
        </Drawer>
    );
};

export default PendingMaintenanceInvoiceSlip;
