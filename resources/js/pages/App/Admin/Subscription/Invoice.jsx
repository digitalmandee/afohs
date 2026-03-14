import React from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Drawer, Grid, Container } from '@mui/material';
import { Print, Close, Send } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import PrintIcon from '@mui/icons-material/Print';

const handlePrintReceipt = (data) => {
    if (!data) return;

    const invoiceData = data
        ? {
              billTo: {
                  name: data.invoiceable?.name || data.member?.full_name || data.customer?.name || `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim() || 'N/A',
                  category: data.invoice_type === 'applied_member' ? 'Applied Member' : data.subscription_type || 'Member',
                  membershipId: data.member_id || data.invoiceable_id || 'N/A',
                  contactNumber: data.invoiceable?.phone_number || data.member?.mobile_number_a || data.user?.phone_number || 'N/A',
                  city: data.invoiceable?.address || data.userDetail?.currentCity || 'N/A',
                  familyMember: data.userDetail?.family_member || 'Non',
              },
              details: {
                  invoiceNumber: data.invoice_no || data.invoice_id || 'N/A',
                  issueDate: data.issue_date ? new Date(data.issue_date).toLocaleDateString() : data.start_date ? new Date(data.start_date).toLocaleDateString() : 'N/A',
                  paymentMethod: (data.payment_method || 'N/A').replace(/_/g, ' '),
              },
              items: [
                  {
                      srNo: 1,
                      description: data.subscription_type || 'Invoice Charges',
                      invoiceAmount: data.amount || data.category?.subscription_fee || 0,
                      remainingAmount: data.remaining_amount || 0,
                      paidAmount: data.paid_amount || data.amount || data.category?.subscription_fee || 0,
                  },
              ],
              summary: {
                  grandTotal: data.amount || data.category?.subscription_fee || 0,
                  remainingAmount: data.remaining_amount || 0,
                  paidAmount: data.paid_amount || data.amount || data.category?.subscription_fee || 0,
                  taxAmount: data.tax_amount || 0,
                  taxPercentage: data.tax_percentage || 0,
                  overdueAmount: data.overdue_amount || 0,
                  overduePercentage: data.overdue_percentage || 0,
                  remarks: data.remarks || '',
              },
              note: 'This is the computer generated receipt. It does not require any signature or stamp.',
              paymentNote: 'If paid by credit card or cheque, 5% sub charges will be added to the total amount.',
              amountInWords: data.amount_in_words || 'N/A',
              sentBy: data.sent_by || 'Admin',
          }
        : {
              billTo: {
                  name: 'N/A',
                  category: 'Member',
                  membershipId: 'N/A',
                  contactNumber: 'N/A',
                  city: 'N/A',
                  familyMember: 'Non',
              },
              details: {
                  invoiceNumber: 'N/A',
                  issueDate: 'N/A',
                  paymentMethod: 'N/A',
              },
              items: [
                  {
                      srNo: 1,
                      description: 'N/A',
                      invoiceAmount: 0,
                      remainingAmount: 0,
                      paidAmount: 0,
                  },
              ],
              summary: {
                  grandTotal: 0,
                  remainingAmount: 0,
                  paidAmount: 0,
                  taxAmount: 0,
                  taxPercentage: 0,
                  overdueAmount: 0,
                  overduePercentage: 0,
                  remarks: '',
              },
              note: 'This is the computer generated receipt. It does not require any signature or stamp.',
              paymentNote: 'If paid by credit card or cheque, 5% sub charges will be added to the total amount.',
              amountInWords: 'N/A',
              sentBy: 'Admin',
          };

    const printWindow = window.open('', '_blank');

    const content = `
        <html>
          <head>
            <title>Invoice</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 930px; margin: 0 auto; }
              .container { margin-top: 16px; margin-bottom: 32px; }
              .paper { border-radius: 4px; position: relative; overflow: hidden; }
              .grid-container { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
              .grid-item { flex: 1; min-width: 0; }
              .grid-item-left { flex: 0 0 33.33%; display: flex; align-items: center; }
              .grid-item-center { flex: 0 0 33.33%; text-align: center; }
              .grid-item-right { flex: 0 0 33.33%; display: flex; justify-content: flex-end; align-items: center; }
              .logo { height: 60px; }
              .typography-h6 { font-size: 18px; font-weight: bold; }
              .typography-body2 { font-size: 12px; color: #555; line-height: 1.4; }
              .typography-body2-bold { font-size: 13px; font-weight: bold; }
              .grid-container-details { display: flex; gap: 16px; margin-bottom: 32px; }
              .grid-item-half { flex: 0 0 50%; }
              .subtitle1 { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
              .table-container { margin-bottom: 24px; }
              .table { width: 100%; border-collapse: collapse; font-size: 13px; }
              .table-head { background-color: #f9f9f9; }
              .table-cell { padding: 12px; font-weight: bold; }
              .table-body-cell { padding: 12px; }
              .summary-container { display: flex; justify-content: flex-end; margin-bottom: 24px; }
              .summary-box { width: 33.33%; padding-top: 8px; }
              .summary-row { display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #eee; }
              .notes-container { display: flex; gap: 16px; margin-bottom: 24px; }
              .notes-item { flex: 0 0 50%; }
              .amount-in-words { font-size: 13px; font-weight: bold; margin-top: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="paper">
                <!-- Header -->
                <div class="grid-container">
                  <div class="grid-item-left">
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c95d02f2c4a986d4f386920c76ff57c18c81985-YeMq5tNsLWF62HBaZY1Gz1HsT7RyLX.png" alt="Afohs Club Logo" class="logo"/>
                  </div>
                  <div class="grid-item-center">
                    <div class="typography-h6" style="color: #063455;">Afohs Club</div>
                    <div class="typography-body2">
                      PAF Falcon complex, Gulberg III,<br />
                      Lahore, Pakistan
                    </div>
                  </div>
                  <div class="grid-item-right">
                    <div style="text-align: right;">
                        <div class="typography-h6" style="color: #333;">Invoice</div>
                        <div style="
                            margin-top: 4px;
                            font-size: 14px;
                            font-weight: bold;
                            color: ${data.status === 'paid' ? '#155724' : data.status === 'checked_in' ? '#004085' : data.status === 'checked_out' ? '#0c5460' : '#721c24'};
                            background-color: ${data.status === 'paid' ? '#d4edda' : data.status === 'checked_in' ? '#cce5ff' : data.status === 'checked_out' ? '#d1ecf1' : '#f8d7da'};
                            text-transform: uppercase;
                            border: 1px solid ${data.status === 'paid' ? '#c3e6cb' : data.status === 'checked_in' ? '#b8daff' : data.status === 'checked_out' ? '#bee5eb' : '#f5c6cb'};
                            padding: 2px 8px;
                            display: inline-block;
                            border-radius: 4px;
                        ">
                            ${(data.status || 'Unpaid').replace(/_/g, ' ')}
                        </div>
                    </div>
                  </div>
                </div>

                <!-- Bill To and Details Section -->
                <div class="grid-container-details">
                  <div class="grid-item-half">
                    <div class="subtitle1">Bill To</div>
                    <div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">Name : </span>${invoiceData.billTo.name}
                      </div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">Category : </span>${invoiceData.billTo.category}
                      </div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">Membership # : </span>${invoiceData.billTo.membershipId}
                      </div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">Contact # : </span>${invoiceData.billTo.contactNumber}
                      </div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">City : </span>${invoiceData.billTo.city}
                      </div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">Family Member : </span>${invoiceData.billTo.familyMember}
                      </div>
                    </div>
                  </div>
                  <div class="grid-item-half">
                    <div class="subtitle1">DETAILS</div>
                    <div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">Invoice # : </span>${invoiceData.details.invoiceNumber}
                      </div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">Issue Date : </span>${invoiceData.details.issueDate}
                      </div>
                      <div class="typography-body2" style="margin-bottom: 4px;">
                        <span style="font-weight: bold;">Payment Method : </span>${invoiceData.details.paymentMethod}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Invoice Table -->
                <div class="table-container">
                  <table class="table">
                    <thead class="table-head">
                      <tr>
                        <th class="table-cell">SR #</th>
                        <th class="table-cell">Description</th>
                        <th class="table-cell">Invoice Amount</th>
                        <th class="table-cell">Remaining Amount</th>
                        <th class="table-cell">Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${invoiceData.items
                          .map(
                              (item) => `
                        <tr>
                          <td class="table-body-cell">${item.srNo}</td>
                          <td class="table-body-cell">${item.description}</td>
                          <td class="table-body-cell">${item.invoiceAmount}</td>
                          <td class="table-body-cell">${item.remainingAmount}</td>
                          <td class="table-body-cell">${item.paidAmount}</td>
                        </tr>
                      `,
                          )
                          .join('')}
                    </tbody>
                  </table>
                </div>

                <!-- Summary Section -->
                <div class="summary-container">
                  <div class="summary-box">
                    <div class="summary-row">
                      <span class="typography-body2-bold">Grand Total</span>
                      <span class="typography-body2">Rs ${invoiceData.summary.grandTotal.toFixed(0)}</span>
                    </div>
                    <div class="summary-row">
                      <span class="typography-body2-bold">Remaining Amount</span>
                      <span class="typography-body2">Rs ${invoiceData.summary.remainingAmount.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                      <span class="typography-body2">Rs ${invoiceData.summary.paidAmount}</span>
                    </div>
                    ${
                        invoiceData.summary.taxAmount > 0
                            ? `
                    <div class="summary-row">
                      <span class="typography-body2-bold">Tax (${invoiceData.summary.taxPercentage}%)</span>
                      <span class="typography-body2">Rs ${invoiceData.summary.taxAmount}</span>
                    </div>`
                            : ''
                    }
                    ${
                        invoiceData.summary.overdueAmount > 0
                            ? `
                    <div class="summary-row">
                      <span class="typography-body2-bold">Overdue (${invoiceData.summary.overduePercentage}%)</span>
                      <span class="typography-body2">Rs ${invoiceData.summary.overdueAmount}</span>
                    </div>`
                            : ''
                    }
                  </div>
                </div>

                <!-- Notes Section -->
                <div class="notes-container">
                  <div class="notes-item">
                    <div class="typography-body2-bold" style="margin-bottom: 4px;">Note:</div>
                    <div class="typography-body2">${invoiceData.note}</div>
                    ${
                        invoiceData.summary.remarks
                            ? `
                    <div class="typography-body2-bold" style="margin-top: 8px; margin-bottom: 4px;">Remarks:</div>
                    <div class="typography-body2">${invoiceData.summary.remarks}</div>
                    `
                            : ''
                    }
                    <div style="margin-top: 16px;">
                      <div class="typography-body2-bold" style="margin-bottom: 4px;">Send By : ${invoiceData.sentBy}</div>
                    </div>
                  </div>
                  <div class="notes-item">
                    <div class="typography-body2">${invoiceData.paymentNote}</div>
                    <div class="amount-in-words">AMOUNT IN WORDS : ${invoiceData.amountInWords}</div>
                  </div>
                </div>
              </div>
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

const InvoiceSlip = ({ open, onClose, data }) => {
    const invoiceData = data
        ? {
              billTo: {
                  name: data.invoiceable?.name || data.member?.full_name || data.customer?.name || `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim() || 'N/A',
                  category: data.invoice_type === 'applied_member' ? 'Applied Member' : data.subscription_type || 'Member',
                  membershipId: data.member_id || data.invoiceable_id || 'N/A',
                  contactNumber: data.invoiceable?.phone_number || data.member?.mobile_number_a || data.user?.phone_number || 'N/A',
                  city: data.invoiceable?.address || data.userDetail?.currentCity || 'N/A',
                  familyMember: data.userDetail?.family_member || 'Non',
              },
              details: {
                  invoiceNumber: data.invoice_no || data.invoice_id || 'N/A',
                  issueDate: data.issue_date ? new Date(data.issue_date).toLocaleDateString() : data.start_date ? new Date(data.start_date).toLocaleDateString() : 'N/A',
                  paymentMethod: (data.payment_method || 'N/A').replace(/_/g, ' '),
              },
              items: [
                  {
                      srNo: 1,
                      description: data.subscription_type || 'Invoice Charges',
                      invoiceAmount: data.amount || data.category?.subscription_fee || 0,
                      remainingAmount: data.remaining_amount || 0,
                      paidAmount: data.paid_amount || data.amount || data.category?.subscription_fee || 0,
                  },
              ],
              summary: {
                  grandTotal: data.amount || data.category?.subscription_fee || 0,
                  remainingAmount: data.remaining_amount || 0,
                  paidAmount: data.paid_amount || data.amount || data.category?.subscription_fee || 0,
                  taxAmount: data.tax_amount || 0,
                  taxPercentage: data.tax_percentage || 0,
                  overdueAmount: data.overdue_amount || 0,
                  overduePercentage: data.overdue_percentage || 0,
                  remarks: data.remarks || '',
              },
              note: 'This is the computer generated receipt. It does not require any signature or stamp.',
              paymentNote: 'If paid by credit card or cheque, 5% sub charges will be added to the total amount.',
              amountInWords: data.amount_in_words || 'N/A',
              sentBy: data.sent_by || 'Admin',
          }
        : {
              billTo: {
                  name: 'N/A',
                  category: 'Member',
                  membershipId: 'N/A',
                  contactNumber: 'N/A',
                  city: 'N/A',
                  familyMember: 'Non',
              },
              details: {
                  invoiceNumber: 'N/A',
                  issueDate: 'N/A',
                  paymentMethod: 'N/A',
              },
              items: [
                  {
                      srNo: 1,
                      description: 'N/A',
                      invoiceAmount: 0,
                      remainingAmount: 0,
                      paidAmount: 0,
                  },
              ],
              summary: {
                  grandTotal: 0,
                  remainingAmount: 0,
                  paidAmount: 0,
                  taxAmount: 0,
                  taxPercentage: 0,
                  overdueAmount: 0,
                  overduePercentage: 0,
                  remarks: '',
              },
              note: 'This is the computer generated receipt. It does not require any signature or stamp.',
              paymentNote: 'If paid by credit card or cheque, 5% sub charges will be added to the total amount.',
              amountInWords: 'N/A',
              sentBy: 'Admin',
          };

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
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: '4px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <Grid container spacing={2} sx={{ mb: 4, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                        <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
                            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c95d02f2c4a986d4f386920c76ff57c18c81985-YeMq5tNsLWF62HBaZY1Gz1HsT7RyLX.png" alt="Afohs Club Logo" style={{ height: '60px' }} />
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
                                {data && (
                                    <div
                                        style={{
                                            marginTop: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            color: data.status === 'paid' ? '#155724' : data.status === 'checked_in' ? '#004085' : data.status === 'checked_out' ? '#0c5460' : '#721c24',
                                            backgroundColor: data.status === 'paid' ? '#d4edda' : data.status === 'checked_in' ? '#cce5ff' : data.status === 'checked_out' ? '#d1ecf1' : '#f8d7da',
                                            textTransform: 'uppercase',
                                            border: `1px solid ${data.status === 'paid' ? '#c3e6cb' : data.status === 'checked_in' ? '#b8daff' : data.status === 'checked_out' ? '#bee5eb' : '#f5c6cb'}`,
                                            padding: '2px 8px',
                                            display: 'inline-block',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {(data.status || 'Unpaid').replace(/_/g, ' ')}
                                    </div>
                                )}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Bill To and Details Section */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={6}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '14px' }}>
                                Bill To
                            </Typography>
                            <Box sx={{ ml: 0 }}>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Name : </span>
                                    {invoiceData.billTo.name}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Category : </span>
                                    {invoiceData.billTo.category}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Membership # : </span>
                                    {invoiceData.billTo.membershipId}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Contact # : </span>
                                    {invoiceData.billTo.contactNumber}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>City : </span>
                                    {invoiceData.billTo.city}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Family Member : </span>
                                    {invoiceData.billTo.familyMember}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '14px' }}>
                                DETAILS
                            </Typography>
                            <Box sx={{ ml: 0 }}>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Invoice # : </span>
                                    {invoiceData.details.invoiceNumber}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Issue Date : </span>
                                    {invoiceData.details.issueDate}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Payment Method : </span>
                                    {invoiceData.details.paymentMethod}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Invoice Table */}
                    <TableContainer component={Paper} elevation={0} sx={{ mb: 3 }}>
                        <Table sx={{ minWidth: 650 }} size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>SR #</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Invoice Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Remaining Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Paid Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoiceData.items.map((item) => (
                                    <TableRow key={item.srNo}>
                                        <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{item.srNo}</TableCell>
                                        <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{item.description}</TableCell>
                                        <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{item.invoiceAmount}</TableCell>
                                        <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{item.remainingAmount}</TableCell>
                                        <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{item.paidAmount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Summary Section */}
                    <Grid container justifyContent="flex-end" sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ pt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                        Grand Total
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                        Rs {invoiceData.summary.grandTotal.toFixed(0)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                        Remaining Amount
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                        Rs {invoiceData.summary.remainingAmount.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                        Paid Amount
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                        Rs {invoiceData.summary.paidAmount}
                                    </Typography>
                                </Box>
                                {invoiceData.summary.taxAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                            Tax ({invoiceData.summary.taxPercentage}%)
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                            Rs {invoiceData.summary.taxAmount}
                                        </Typography>
                                    </Box>
                                )}
                                {invoiceData.summary.overdueAmount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                            Overdue ({invoiceData.summary.overduePercentage}%)
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                            Rs {invoiceData.summary.overdueAmount}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Notes Section */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '13px' }}>
                                Note:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                {invoiceData.note}
                            </Typography>
                            {invoiceData.summary.remarks && (
                                <>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, mt: 2, fontSize: '13px' }}>
                                        Remarks:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                        {invoiceData.summary.remarks}
                                    </Typography>
                                </>
                            )}
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '13px' }}>
                                    Send By : {invoiceData.sentBy}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                {invoiceData.paymentNote}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5, fontSize: '13px' }}>
                                AMOUNT IN WORDS : {invoiceData.amountInWords}
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Action Buttons */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                            borderTop: '1px solid #eee',
                            pt: 2,
                        }}
                    >
                        <Button
                            variant="outlined"
                            sx={{
                                textTransform: 'none',
                                borderColor: '#ddd',
                                color: '#555',
                                '&:hover': {
                                    borderColor: '#bbb',
                                    backgroundColor: '#f5f5f5',
                                },
                            }}
                            onClick={onClose}
                        >
                            Close
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{
                                textTransform: 'none',
                                borderColor: '#ddd',
                                color: '#555',
                                '&:hover': {
                                    borderColor: '#bbb',
                                    backgroundColor: '#f5f5f5',
                                },
                            }}
                        >
                            Send Remind
                        </Button>
                        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrintReceipt(data)}>
                            Print
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Drawer>
    );
};

export default InvoiceSlip;
