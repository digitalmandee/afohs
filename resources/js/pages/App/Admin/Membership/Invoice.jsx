import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Drawer, Grid, Container } from '@mui/material';
import { Print, Close, Send } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toWords } from 'number-to-words';
import dayjs from 'dayjs';

const handlePrintReceipt = (invoice) => {
    if (!invoice) return;

    const hasInvoiceItems = invoice?.items && invoice.items.length > 0;
    const hasDataItems = invoice?.data?.items && invoice.data.items.length > 0;

    let itemsList = [];

    if (hasInvoiceItems) {
        itemsList = invoice.items;
    } else if (hasDataItems) {
        itemsList = invoice.data.items;
    } else if (invoice?.related_invoices && invoice.related_invoices.length > 0) {
        itemsList = invoice.related_invoices;
    } else if (invoice) {
        itemsList = [invoice];
    }

    let subTotal = 0,
        taxTotal = 0,
        overdueTotal = 0,
        additionalTotal = 0,
        grandTotal = 0,
        paidTotal = 0,
        remainingTotal = 0,
        discountTotal = 0;

    if (itemsList.length > 0) {
        if (hasInvoiceItems) {
            // New System
            subTotal = itemsList.reduce((sum, item) => {
                const qty = parseFloat(item.qty || 1) || 1;
                const rate = parseFloat(item.amount || 0) || 0;
                const base = qty * rate;
                return sum + (Number.isFinite(base) ? base : 0);
            }, 0);
            const itemsDiscountSum = itemsList.reduce((sum, item) => sum + (parseFloat(item.discount_amount) || 0), 0);
            discountTotal = Math.max(itemsDiscountSum, parseFloat(invoice.discount_amount || 0) || 0);
            taxTotal = parseFloat(invoice.tax_amount || 0);
            if (taxTotal === 0) {
                taxTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0);
            }

            grandTotal = parseFloat(invoice.total_price || 0);
            paidTotal = parseFloat(invoice.paid_amount || 0);
            remainingTotal = invoice.customer_charges !== null && invoice.customer_charges !== undefined ? parseFloat(invoice.customer_charges || 0) : Math.max(0, grandTotal - paidTotal);
            overdueTotal = parseFloat(invoice.overdue_amount || 0);
            additionalTotal = parseFloat(invoice.additional_charges || 0);
            if (additionalTotal === 0) {
                additionalTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.additional_charges) || 0), 0);
            }
        } else if (hasDataItems) {
            // Legacy Data Blob
            subTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.original_amount || item.amount) || 0), 0);
            discountTotal = itemsList.reduce((sum, item) => {
                const original = parseFloat(item.original_amount || item.amount) || 0;
                const net = parseFloat(item.amount) || 0;
                return sum + (original - net);
            }, 0);

            const itemsNetSum = itemsList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            taxTotal = parseFloat(invoice.tax_amount || 0);
            overdueTotal = parseFloat(invoice.overdue_amount || 0);
            additionalTotal = parseFloat(invoice.additional_charges || 0);
            grandTotal = itemsNetSum + taxTotal + overdueTotal + additionalTotal;

            paidTotal = parseFloat(invoice.paid_amount || 0);
            remainingTotal = parseFloat(invoice.customer_charges || 0);
        } else {
            // Legacy Multi-Invoice
            if (invoice?.related_invoices?.length > 0) {
                taxTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0);
                overdueTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.overdue_amount) || 0), 0);
                additionalTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.additional_charges) || 0), 0);
                grandTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
                paidTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.paid_amount) || 0), 0);
                remainingTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.customer_charges) || 0), 0);
            } else {
                grandTotal = parseFloat(invoice.total_price || 0);
                subTotal = parseFloat(invoice.amount || 0);
                paidTotal = parseFloat(invoice.paid_amount || 0);
                remainingTotal = parseFloat(invoice.customer_charges || 0);
            }
        }
    } else {
        grandTotal = parseFloat(invoice.total_price || 0);
        subTotal = parseFloat(invoice.amount || 0);
        paidTotal = parseFloat(invoice.paid_amount || 0);
        remainingTotal = parseFloat(invoice.customer_charges || 0);
    }

    // Map data to invoiceData for consistency with JSX
    const guestTypeName = invoice.customer?.guest_type?.name || invoice.customer?.guestType?.name || invoice.customer?.guest_type_name || null;
    const billToCategory =
        invoice.customer
            ? guestTypeName || 'Guest'
            : invoice.invoice_type === 'applied_member'
              ? 'Applied Member'
              : invoice.member
                ? invoice.member?.member_type?.name || invoice.member?.memberType?.name || 'Member'
                : invoice.corporate_member
                  ? invoice.corporate_member?.member_type?.name || invoice.corporate_member?.memberType?.name || 'Corporate Member'
                  : invoice.data?.member_category || invoice.data?.category || 'Member';

    const billToIdLabel = invoice.customer ? 'Guest #' : 'Membership #';

    const invoiceData = {
        billTo: {
            name: invoice.member?.full_name || invoice.member?.name || invoice.corporate_member?.full_name || invoice.customer?.name || invoice.data?.member_name || 'N/A',
            category: billToCategory,
            membershipId: invoice.member?.membership_no || invoice.corporate_member?.membership_no || invoice.customer?.customer_no || 'N/A',
            contactNumber: invoice.member?.mobile_number_a || invoice.corporate_member?.mobile_number_a || invoice.customer?.contact || 'N/A',
            familyMember: 'Non',
        },
        details: {
            invoiceNumber: invoice.invoice_no || 'N/A',
            issueDate: invoice.issue_date,
            paymentMethod: invoice.payment_method,
            validFrom: invoice.fee_type === 'subscription_fee' || invoice.fee_type === 'maintenance_fee' ? invoice.valid_from : null,
            validTo: invoice.fee_type === 'subscription_fee' || invoice.fee_type === 'maintenance_fee' ? invoice.valid_to : null,
        },
        items: itemsList.map((item, index) => {
            const formatFeeType = (type) => {
                if (!type) return '';
                return type
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            };

            let description = item.description;
            if (!description || description === 'undefined') {
                if (item.fee_type_formatted) description = item.fee_type_formatted;
                else if (item.fee_type) description = formatFeeType(item.fee_type);
                else if (item.invoice_type) description = formatFeeType(item.invoice_type);
                else description = 'Item';
            }
            let originalAmount = 0;
            let discount = 0;
            let netAmount = 0;
            let remainingAmount = 0;
            let paidAmount = 0;
            let discountType = null;
            let discountValue = 0;
            let taxPercentage = 0;
            let taxAmount = 0;
            let overduePercentage = 0;
            let overdueAmount = 0;
            let additionalCharges = 0;
            let extraPercentage = 0;

            if (hasInvoiceItems) {
                originalAmount = parseFloat(item.sub_total || item.amount || 0);
                discount = parseFloat(item.discount_amount || 0);
                netAmount = parseFloat(item.total || item.amount || 0);
                discountType = item.discount_type ?? null;
                discountValue = parseFloat(item.discount_value || 0);
                taxPercentage = parseFloat(item.tax_percentage || 0);
                taxAmount = parseFloat(item.tax_amount || 0);
                overduePercentage = parseFloat(item.overdue_percentage || 0);
                overdueAmount = parseFloat(item.overdue_amount || 0);
                additionalCharges = parseFloat(item.additional_charges || 0);
                extraPercentage = parseFloat(item.extra_percentage || 0);

                if (invoice.status === 'paid') {
                    paidAmount = netAmount;
                    remainingAmount = 0;
                } else {
                    paidAmount = parseFloat(item.paid_amount || 0);
                    remainingAmount = netAmount - paidAmount;
                }
            } else {
                originalAmount = parseFloat(item.original_amount || item.amount || 0);
                netAmount = parseFloat(item.amount || 0);
                discount = originalAmount && netAmount ? originalAmount - netAmount : 0;

                if (hasDataItems) {
                    if (invoice.status === 'paid') {
                        paidAmount = netAmount;
                        remainingAmount = 0;
                    } else {
                        paidAmount = 0;
                        remainingAmount = netAmount;
                    }
                } else {
                    // Multi-invoice legacy object
                    paidAmount = parseFloat(item.paid_amount || 0);
                    remainingAmount = parseFloat(item.customer_charges || 0);
                }
            }

            return {
                srNo: index + 1,
                description: description,
                startDate: item.start_date || item.startDate || null,
                endDate: item.end_date || item.endDate || null,
                subscriptionType: item.subscriptionType?.name || item.subscription_type_name || 'N/A',
                subscriptionCategory: item.subscriptionCategory?.name || item.subscription_category_name || 'N/A',
                originalAmount: originalAmount,
                discount: discount,
                discountType,
                discountValue,
                taxPercentage,
                taxAmount,
                overduePercentage,
                overdueAmount,
                additionalCharges,
                extraPercentage,
                invoiceAmount: netAmount,
                remainingAmount: remainingAmount,
                paidAmount: paidAmount,
                itemType: item.fee_type || item.invoice_type,
            };
        }),
        summary: {
            subTotal: subTotal,
            discountTotal: discountTotal,
            grandTotal: grandTotal,
            remainingAmount: remainingTotal,
            paidAmount: paidTotal,
            taxAmount: taxTotal,
            taxPercentage: invoice.tax_percentage || 0,
            overdueAmount: overdueTotal,
            overduePercentage: invoice.overdue_percentage || 0,
            additionalCharges: additionalTotal,
            remarks: invoice.remarks || '',
        },
        note: 'This is a computer-generated receipt. It does not require any signature or stamp.',
        paymentNote: 'If paid by credit card or cheque, 5% surcharge will be added to the total amount.',
        amountInWords: toWords(grandTotal),
        sentBy: 'Admin',
    };

    const num = (val) => {
        if (val === null || val === undefined || val === '') return 0;
        const n = parseFloat(String(val).replace(/,/g, ''));
        return Number.isFinite(n) ? n : 0;
    };

    const showItemDiscount = invoice.fee_type !== 'subscription_fee' && invoiceData.items.some((it) => num(it.discount) > 0);
    const showItemTax = invoiceData.items.some((it) => num(it.taxAmount) > 0);
    const showItemOverdue = invoiceData.items.some((it) => num(it.overdueAmount) > 0);
    const showItemAdditional = invoiceData.items.some((it) => num(it.additionalCharges) > 0);

    const printWindow = window.open('', '_blank');

    const content = `
        <html>
        <head>
          <title>Invoice #${invoiceData.details.invoiceNumber}</title>
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
                <div class="info-row"><span class="info-label">${billToIdLabel}:</span><span class="info-value">${invoiceData.billTo.membershipId}</span></div>
                <div class="info-row"><span class="info-label">Contact #:</span><span class="info-value">${invoiceData.billTo.contactNumber}</span></div>
              </div>
              <div class="info-column">
                <div class="section-title">Details</div>
                <div class="info-row"><span class="info-label">Invoice #:</span><span class="info-value">${invoiceData.details.invoiceNumber}</span></div>
                <div class="info-row"><span class="info-label">Issue Date:</span><span class="info-value">${new Date(invoiceData.details.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                ${invoiceData.details.paymentMethod ? `<div class="info-row"><span class="info-label">Payment Method:</span><span class="info-value">${invoiceData.details.paymentMethod.replace(/_/g, ' ').toUpperCase()}</span></div>` : ''}
                 ${invoiceData.details.validFrom ? `<div class="info-row"><span class="info-label">From:</span><span class="info-value">${new Date(invoiceData.details.validFrom).toLocaleDateString()}</span></div>` : ''}
                 ${invoiceData.details.validTo ? `<div class="info-row"><span class="info-label">To:</span><span class="info-value">${new Date(invoiceData.details.validTo).toLocaleDateString()}</span></div>` : ''}
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>SR #</th>
                    <th>Description</th>
                    ${invoice.fee_type === 'subscription_fee' ? `<th>Type</th><th>Category</th><th>Fee</th><th>Disc</th>` : ''}
                    ${showItemDiscount ? `<th>Disc</th>` : ''}
                    ${showItemAdditional ? `<th>Add. Chrgs</th>` : ''}
                    ${showItemTax ? `<th>Tax</th>` : ''}
                    ${showItemOverdue ? `<th>Overdue</th>` : ''}
                    <th>Net Amount</th>
                    <th>Remaining</th>
                    <th>Paid</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceData.items
                      .map(
                          (item) => `
                    <tr>
                      <td>${item.srNo}</td>
                      <td>${item.description}</td>
                       ${invoice.fee_type === 'subscription_fee' ? `<td>${item.subscriptionType}</td><td>${item.subscriptionCategory}</td><td>${item.originalAmount}</td><td>${item.discount}</td>` : ''}
                      ${showItemDiscount ? `<td>${num(item.discount) > 0 ? `Rs ${item.discount}` : ''}</td>` : ''}
                      ${showItemAdditional ? `<td>${num(item.additionalCharges) > 0 ? `Rs ${item.additionalCharges}` : ''}</td>` : ''}
                      ${showItemTax ? `<td>${num(item.taxAmount) > 0 ? `${item.taxPercentage}% (Rs ${item.taxAmount})` : ''}</td>` : ''}
                      ${showItemOverdue ? `<td>${num(item.overdueAmount) > 0 ? `${item.overduePercentage}% (Rs ${item.overdueAmount})` : ''}</td>` : ''}
                      <td>${item.invoiceAmount}</td>
                      <td>${item.remainingAmount}</td>
                      <td>${item.paidAmount}</td>
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
                ${
                    invoiceData.summary.discountTotal > 0
                        ? `
                <div class="summary-row">
                  <span class="summary-label">Discount</span>
                  <span style="color: #d32f2f;">- Rs ${invoiceData.summary.discountTotal}</span>
                </div>`
                        : ''
                }
                ${
                    invoiceData.summary.taxAmount > 0
                        ? `
                <div class="summary-row">
                  <span class="summary-label">Tax (${invoiceData.summary.taxPercentage}%)</span>
                  <span>Rs ${invoiceData.summary.taxAmount}</span>
                </div>`
                        : ''
                }
                 ${
                     invoiceData.summary.overdueAmount > 0
                         ? `
                <div class="summary-row">
                  <span class="summary-label">Overdue (${invoiceData.summary.overduePercentage}%)</span>
                  <span>Rs ${invoiceData.summary.overdueAmount}</span>
                </div>`
                         : ''
                 }
                 ${
                     invoiceData.summary.additionalCharges > 0
                         ? `
                <div class="summary-row">
                  <span class="summary-label">Additional Charges</span>
                  <span>Rs ${invoiceData.summary.additionalCharges}</span>
                </div>`
                         : ''
                 }
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

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

const InvoiceSlip = ({ open, onClose, invoiceNo, invoiceId = null }) => {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch invoice data
    useEffect(() => {
        if (open && (invoiceNo || invoiceId)) {
            setLoading(true);

            // If invoiceId is provided, use it directly; otherwise use member ID (invoiceNo)
            const idToUse = invoiceId || invoiceNo;

            axios
                .get(route('financial-invoice', idToUse))
                .then((response) => {
                    setInvoice(response.data.invoice);
                    console.log('InvoiceSlip response:', response.data.invoice);
                })
                .catch((error) => {
                    console.error('InvoiceSlip error:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, invoiceNo, invoiceId]);

    const hasInvoiceItems = invoice?.items && invoice.items.length > 0;
    const hasDataItems = invoice?.data?.items && invoice.data.items.length > 0;

    let itemsList = [];
    let isMultiItem = false;

    if (hasInvoiceItems) {
        itemsList = invoice.items;
        isMultiItem = true;
    } else if (hasDataItems) {
        itemsList = invoice.data.items;
        isMultiItem = true;
    } else if (invoice?.related_invoices && invoice.related_invoices.length > 0) {
        itemsList = invoice.related_invoices;
    } else if (invoice) {
        itemsList = [invoice];
    }

    let subTotal = 0,
        taxTotal = 0,
        overdueTotal = 0,
        additionalTotal = 0,
        grandTotal = 0,
        paidTotal = 0,
        remainingTotal = 0,
        discountTotal = 0;

    if (itemsList.length > 0) {
        if (hasInvoiceItems) {
            // New System: FinancialInvoiceItem models
            subTotal = itemsList.reduce((sum, item) => {
                const qty = parseFloat(item.qty || 1) || 1;
                const rate = parseFloat(item.amount || 0) || 0;
                const base = qty * rate;
                return sum + (Number.isFinite(base) ? base : 0);
            }, 0);
            const itemsDiscountSum = itemsList.reduce((sum, item) => sum + (parseFloat(item.discount_amount) || 0), 0);
            discountTotal = Math.max(itemsDiscountSum, parseFloat(invoice.discount_amount || 0) || 0);
            taxTotal = parseFloat(invoice.tax_amount || 0); // Header tax is usually sum of items tax

            // If header tax is 0 but items have tax, sum them up
            if (taxTotal === 0) {
                taxTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0);
            }

            // Using header totals if available as they are authoritative
            grandTotal = parseFloat(invoice.total_price || 0);
            paidTotal = parseFloat(invoice.paid_amount || 0);
            remainingTotal = invoice.customer_charges !== null && invoice.customer_charges !== undefined ? parseFloat(invoice.customer_charges || 0) : Math.max(0, grandTotal - paidTotal);

            overdueTotal = parseFloat(invoice.overdue_amount || 0);
            additionalTotal = parseFloat(invoice.additional_charges || 0);
            if (additionalTotal === 0) {
                additionalTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.additional_charges) || 0), 0);
            }
        } else if (hasDataItems) {
            // Legacy Data Blob
            subTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.original_amount || item.amount) || 0), 0);
            discountTotal = itemsList.reduce((sum, item) => {
                const original = parseFloat(item.original_amount || item.amount) || 0;
                const net = parseFloat(item.amount) || 0;
                return sum + (original - net);
            }, 0);

            const itemsNetSum = itemsList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            taxTotal = parseFloat(invoice.tax_amount || 0);
            overdueTotal = parseFloat(invoice.overdue_amount || 0);
            additionalTotal = parseFloat(invoice.additional_charges || 0);
            grandTotal = itemsNetSum + taxTotal + overdueTotal + additionalTotal;
            paidTotal = parseFloat(invoice.paid_amount || 0);
            remainingTotal = parseFloat(invoice.customer_charges || 0);
        } else {
            // Legacy Multi-Invoice or Single Simple Invoice
            if (invoice?.related_invoices?.length > 0) {
                // Multi invoice logic
                taxTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.tax_amount) || 0), 0);
                overdueTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.overdue_amount) || 0), 0);
                additionalTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.additional_charges) || 0), 0);
                grandTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
                paidTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.paid_amount) || 0), 0);
                remainingTotal = itemsList.reduce((sum, item) => sum + (parseFloat(item.customer_charges) || 0), 0);
            } else {
                // Fallback for single object in list
                grandTotal = parseFloat(invoice.total_price || 0);
                subTotal = parseFloat(invoice.amount || 0);
                paidTotal = parseFloat(invoice.paid_amount || 0);
                remainingTotal = parseFloat(invoice.customer_charges || 0);
            }
        }
    } else if (invoice) {
        grandTotal = parseFloat(invoice.total_price || 0);
        subTotal = parseFloat(invoice.amount || 0);
        paidTotal = parseFloat(invoice.paid_amount || 0);
        remainingTotal = parseFloat(invoice.customer_charges || 0);
    }

    const num = (val) => {
        if (val === null || val === undefined || val === '') return 0;
        const n = parseFloat(String(val).replace(/,/g, ''));
        return Number.isFinite(n) ? n : 0;
    };

    const showRowDiscount = invoice?.fee_type !== 'subscription_fee' && itemsList.some((it) => num(it.discount_amount) > 0);
    const showRowTax = itemsList.some((it) => num(it.tax_amount) > 0);
    const showRowOverdue = itemsList.some((it) => num(it.overdue_amount) > 0);
    const showRowAdditional = itemsList.some((it) => num(it.additional_charges) > 0);

    const guestTypeName = invoice?.customer?.guest_type?.name || invoice?.customer?.guestType?.name || invoice?.customer?.guest_type_name || null;
    const billToCategory =
        invoice?.customer
            ? guestTypeName || 'Guest'
            : invoice?.invoice_type === 'applied_member'
              ? 'Applied Member'
              : invoice?.member
                ? invoice.member?.member_type?.name || invoice.member?.memberType?.name || 'Member'
                : invoice?.corporate_member
                  ? invoice.corporate_member?.member_type?.name || invoice.corporate_member?.memberType?.name || 'Corporate Member'
                  : invoice?.data?.member_category || invoice?.data?.category || 'Member';

    const billToIdLabel = invoice?.customer ? 'Guest #' : 'Membership #';

    return (
        <Drawer
            anchor="top"
            open={open}
            onClose={onClose}
            ModalProps={{
                keepMounted: true, // improves performance
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
                                {invoice && (
                                    <div
                                        style={{
                                            marginTop: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            color: invoice.status === 'paid' ? '#155724' : invoice.status === 'checked_in' ? '#004085' : invoice.status === 'checked_out' ? '#0c5460' : '#721c24',
                                            backgroundColor: invoice.status === 'paid' ? '#d4edda' : invoice.status === 'checked_in' ? '#cce5ff' : invoice.status === 'checked_out' ? '#d1ecf1' : '#f8d7da',
                                            textTransform: 'uppercase',
                                            border: `1px solid ${invoice.status === 'paid' ? '#c3e6cb' : invoice.status === 'checked_in' ? '#b8daff' : invoice.status === 'checked_out' ? '#bee5eb' : '#f5c6cb'}`,
                                            padding: '2px 8px',
                                            display: 'inline-block',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {(invoice.status || 'Unpaid').replace(/_/g, ' ')}
                                    </div>
                                )}
                            </Box>
                        </Grid>
                    </Grid>

                    {loading ? (
                        'Loading...'
                    ) : invoice ? (
                        <>
                            {/* Bill To and Details Section */}
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '14px' }}>
                                        Bill To {invoice.member?.membership_no || invoice.corporate_member?.membership_no || invoice.customer?.customer_no}
                                    </Typography>
                                    <Box sx={{ ml: 0 }}>
                                        <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                            <span style={{ fontWeight: 'bold' }}>Name: </span>
                                            {invoice.member?.full_name || invoice.corporate_member?.full_name || invoice.customer?.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                            <span style={{ fontWeight: 'bold' }}>Category: </span>
                                            {billToCategory}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                            <span style={{ fontWeight: 'bold' }}>{billToIdLabel}: </span>
                                            {invoice.member?.membership_no || invoice.corporate_member?.membership_no || invoice.customer?.customer_no}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                            <span style={{ fontWeight: 'bold' }}>Contact #: </span>
                                            {invoice.member?.mobile_number_a || invoice.corporate_member?.mobile_number_a || invoice.customer?.contact}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '14px' }}>
                                        DETAILS
                                    </Typography>
                                    <Box sx={{ ml: 0 }}>
                                        <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                            <span style={{ fontWeight: 'bold' }}>Invoice #: </span>
                                            {invoice.invoice_no}
                                            {/* <pre>{JSON.stringify(invoice, null, 2)}</pre> */}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                            <span style={{ fontWeight: 'bold' }}>Issue Date: </span>
                                            {new Date(invoice.issue_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </Typography>
                                        {!!invoice.payment_method && (
                                            <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                                <span style={{ fontWeight: 'bold' }}>Payment Method: </span>
                                                {invoice.payment_method.replace(/_/g, ' ').toUpperCase()}
                                            </Typography>
                                        )}
                                        {invoice.payment_date && (
                                            <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                                <span style={{ fontWeight: 'bold' }}>Payment Date: </span>
                                                {new Date(invoice.payment_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </Typography>
                                        )}

                                        {/* Show validity dates for subscription and maintenance fees */}
                                        {(invoice.fee_type === 'subscription_fee' || invoice.fee_type === 'maintenance_fee') && (
                                            <>
                                                {invoice.valid_from && (
                                                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>From: </span>
                                                        {new Date(invoice.valid_from).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </Typography>
                                                )}
                                                {invoice.valid_to && (
                                                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>To: </span>
                                                        <span
                                                            style={{
                                                                color: new Date(invoice.valid_to) > new Date() ? '#28a745' : '#dc3545',
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {new Date(invoice.valid_to).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                    </Typography>
                                                )}
                                                {invoice.valid_from && invoice.valid_to && (
                                                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '13px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>Number of days: </span>
                                                        {dayjs(invoice.valid_to).diff(dayjs(invoice.valid_from), 'day') + 1}
                                                    </Typography>
                                                )}
                                            </>
                                        )}
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
                                            {invoice.fee_type === 'subscription_fee' && (
                                                <>
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Type</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Category</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Fee</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Disc</TableCell>
                                                </>
                                            )}
                                            {showRowDiscount && <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Disc</TableCell>}
                                            {showRowAdditional && <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Add. Chrgs</TableCell>}
                                            {showRowTax && <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Tax</TableCell>}
                                            {showRowOverdue && <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Overdue</TableCell>}
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Net Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Remaining Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', py: 1.5 }}>Paid Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {itemsList.map((item, index) => {
                                            const description = item.description || item.invoice_type;

                                            // Determine values based on source (New Model vs Legacy JSON)
                                            let originalAmount = 0;
                                            let discount = 0;
                                            let netAmount = 0;
                                            let paidAmount = 0;
                                            let remainingAmount = 0;
                                            let taxAmount = 0;
                                            let taxPercentage = 0;
                                            let overdueAmount = 0;
                                            let overduePercentage = 0;
                                            let addCharges = 0;

                                            if (hasInvoiceItems) {
                                                // New System
                                                originalAmount = parseFloat(item.sub_total || item.amount || 0);
                                                discount = parseFloat(item.discount_amount || 0);
                                                netAmount = parseFloat(item.total || item.amount || 0);
                                                taxAmount = parseFloat(item.tax_amount || 0);
                                                taxPercentage = parseFloat(item.tax_percentage || 0);
                                                overdueAmount = parseFloat(item.overdue_amount || 0);
                                                overduePercentage = parseFloat(item.overdue_percentage || 0);
                                                addCharges = parseFloat(item.additional_charges || 0);

                                                // Basic paid logic (can be refined if items have individual status)
                                                // For now assuming if header is paid, item is fully paid, unless item has paid_amount
                                                if (invoice.status === 'paid') {
                                                    paidAmount = netAmount;
                                                    remainingAmount = 0;
                                                } else {
                                                    paidAmount = parseFloat(item.paid_amount || 0);
                                                    remainingAmount = netAmount - paidAmount;
                                                }
                                            } else {
                                                // Legacy
                                                originalAmount = parseFloat(item.original_amount || item.amount || 0);
                                                netAmount = parseFloat(item.amount || 0);
                                                discount = originalAmount && netAmount ? originalAmount - netAmount : 0;

                                                if (hasDataItems) {
                                                    if (invoice.status === 'paid') {
                                                        paidAmount = netAmount;
                                                        remainingAmount = 0;
                                                    } else {
                                                        paidAmount = 0;
                                                        remainingAmount = netAmount;
                                                    }
                                                } else {
                                                    // Multi-invoice legacy object
                                                    paidAmount = parseFloat(item.paid_amount || 0);
                                                    remainingAmount = parseFloat(item.customer_charges || 0);
                                                }
                                            }

                                            return (
                                                <TableRow key={item.id || index}>
                                                    <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{index + 1}</TableCell>
                                                    <TableCell sx={{ fontSize: '13px', py: 1.5, textTransform: 'capitalize' }}>{description}</TableCell>
                                                    {invoice.fee_type === 'subscription_fee' && (
                                                        <>
                                                            <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{item.subscriptionType?.name || item.subscription_type_name || 'N/A'}</TableCell>
                                                            <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{item.subscriptionCategory?.name || item.subscription_category_name || 'N/A'}</TableCell>
                                                            <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{originalAmount}</TableCell>
                                                            <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{discount}</TableCell>
                                                        </>
                                                    )}
                                                    {showRowDiscount && <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{discount > 0 ? `Rs ${discount}` : ''}</TableCell>}
                                                    {showRowAdditional && <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{addCharges > 0 ? `Rs ${addCharges}` : ''}</TableCell>}
                                                    {showRowTax && <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{taxAmount > 0 ? `${taxPercentage}% (Rs ${taxAmount})` : ''}</TableCell>}
                                                    {showRowOverdue && <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{overdueAmount > 0 ? `${overduePercentage}% (Rs ${overdueAmount})` : ''}</TableCell>}
                                                    <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{netAmount}</TableCell>
                                                    <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{remainingAmount}</TableCell>
                                                    <TableCell sx={{ fontSize: '13px', py: 1.5 }}>{paidAmount}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Summary Section */}
                            <Grid container justifyContent="flex-end" sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Box sx={{ pt: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                Subtotal
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                Rs {subTotal}
                                            </Typography>
                                        </Box>
                                        {discountTotal > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                    Discount
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '13px', color: '#d32f2f' }}>
                                                    - Rs {discountTotal}
                                                </Typography>
                                            </Box>
                                        )}
                                        {taxTotal > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                    Tax ({invoice.tax_percentage}%)
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                    Rs {taxTotal}
                                                </Typography>
                                            </Box>
                                        )}
                                        {overdueTotal > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                    Overdue ({invoice.overdue_percentage}%)
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                    Rs {overdueTotal}
                                                </Typography>
                                            </Box>
                                        )}
                                        {additionalTotal > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                    Additional Charges
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                    Rs {additionalTotal}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                Remaining Amount
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                Rs {remainingTotal}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                Grand Total
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                Rs {grandTotal}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #eee' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                Paid Amount
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                Rs {paidTotal}
                                            </Typography>
                                        </Box>
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
                                        This is a computer-generated receipt. It does not require any signature or stamp.
                                    </Typography>
                                    {invoice.remarks && (
                                        <>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, mt: 2, fontSize: '13px' }}>
                                                Remarks:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                                {invoice.remarks}
                                            </Typography>
                                        </>
                                    )}
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '13px' }}>
                                            Admin
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                        If paid by credit card or cheque, 5% surcharge will be added to the total amount.
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5, textTransform: 'uppercase', fontSize: '13px' }}>
                                        AMOUNT IN WORDS: {toWords(grandTotal)}
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
                                <Button
                                    onClick={() => handlePrintReceipt(invoice)}
                                    variant="contained"
                                    startIcon={<Print />}
                                    sx={{
                                        textTransform: 'none',
                                        backgroundColor: '#063455',
                                        '&:hover': {
                                            backgroundColor: '#002244',
                                        },
                                    }}
                                >
                                    Print
                                </Button>
                            </Box>
                        </>
                    ) : (
                        ''
                    )}
                </Paper>
            </Container>
        </Drawer>
    );
};

export default InvoiceSlip;
