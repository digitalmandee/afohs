import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Add, ArrowDownward, ArrowUpward, AttachFile, ContentCopy, Delete, Preview, Refresh } from '@mui/icons-material';
import AppPage from '@/components/App/ui/AppPage';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import { formatAmount } from '@/lib/formatting';

const VOUCHER_TYPES = ['CPV', 'CRV', 'BPV', 'BRV', 'JV'];
const CASH_METHODS = ['cash', 'cash_in_hand', 'cash_hand', 'petty_cash'];
const BANK_METHODS = ['bank', 'bank_transfer', 'online', 'cheque', 'debit_card', 'credit_card'];

const emptyLine = () => ({
    account_id: '',
    department_id: '',
    debit: '',
    credit: '',
    description: '',
    reference_type: '',
    reference_id: '',
    tax_code: '',
    tax_amount: '',
});

const emptyPaymentRow = () => ({
    payment_mode: 'direct',
    invoice_id: '',
    expense_account_id: '',
    amount: '',
    reference_no: '',
    remarks: '',
    counterparty_account_id: '',
});

const paymentLabelMap = {
    CPV: 'Cash Account',
    CRV: 'Cash Account',
    BPV: 'Bank Account',
    BRV: 'Bank Account',
};

export default function VoucherForm({
    mode = 'create',
    voucher = null,
    accounts = [],
    paymentAccounts = [],
    tenants = [],
    departments = [],
    vendors = [],
    customers = [],
    members = [],
    corporateMembers = [],
    expenseAccounts = [],
    mappingReadiness = {},
    entryModes = ['smart', 'manual'],
    canSetPaymentAccountDefault = false,
    canSetVendorCounterpartyDefault = false,
    baseCurrency = 'PKR',
}) {
    const normalizedVoucherMode = voucher?.voucher_type === 'JV'
        ? 'manual'
        : 'smart';

    const initialLines = voucher?.lines?.filter((line) => !line.is_system_generated)?.length
        ? voucher.lines.filter((line) => !line.is_system_generated).map((line) => ({
            account_id: String(line.account_id || ''),
            department_id: String(line.department_id || ''),
            debit: line.debit || '',
            credit: line.credit || '',
            description: line.description || '',
            reference_type: line.reference_type || '',
            reference_id: line.reference_id || '',
            tax_code: line.tax_code || '',
            tax_amount: line.tax_amount || '',
        }))
        : [emptyLine(), emptyLine()];

    const initialPaymentRows = (() => {
        if (Array.isArray(voucher?.payment_rows) && voucher.payment_rows.length > 0) {
            return voucher.payment_rows.map((row) => ({
                payment_mode: row?.payment_mode || 'direct',
                invoice_id: row?.invoice_id ? String(row.invoice_id) : '',
                expense_account_id: row?.expense_account_id ? String(row.expense_account_id) : '',
                amount: row?.amount ? String(row.amount) : '',
                reference_no: row?.reference_no || '',
                remarks: row?.remarks || '',
                counterparty_account_id: row?.counterparty_account_id ? String(row.counterparty_account_id) : '',
            }));
        }

        if (['CPV', 'BPV'].includes(voucher?.voucher_type || '')) {
            const inferredVendorFlow = (voucher?.payment_for || '') === 'vendor_payment' || voucher?.party_type === 'vendor';
            return [{
                payment_mode: inferredVendorFlow && voucher?.invoice_id ? 'against_invoice' : 'direct',
                invoice_id: voucher?.invoice_id ? String(voucher.invoice_id) : '',
                expense_account_id: '',
                amount: voucher?.amount ? String(voucher.amount) : '',
                reference_no: voucher?.reference_no || '',
                remarks: '',
                counterparty_account_id: '',
            }];
        }

        return [emptyPaymentRow()];
    })();

    const intentRef = React.useRef('draft');
    const { data, setData, post, put, processing, errors, transform } = useForm({
        voucher_type: voucher?.voucher_type || 'JV',
        entry_mode: normalizedVoucherMode,
        payment_for: ['CPV', 'BPV'].includes(voucher?.voucher_type || '') ? ((voucher?.payment_for || (voucher?.party_type === 'vendor' ? 'vendor_payment' : 'expense'))) : 'expense',
        payment_mode: ['CPV', 'BPV'].includes(voucher?.voucher_type || '') ? (voucher?.invoice_id ? 'against_invoice' : 'direct') : 'direct',
        party_type: voucher?.party_type || 'none',
        party_id: String(voucher?.party_id || ''),
        vendor_id: String(voucher?.party_type === 'vendor' ? (voucher?.party_id || '') : ''),
        invoice_type: voucher?.invoice_type || '',
        invoice_id: String(voucher?.invoice_id || ''),
        expense_type_id: '',
        template_id: String(voucher?.template_id || ''),
        amount: voucher?.amount || '',
        payment_rows: initialPaymentRows,
        voucher_date: voucher?.voucher_date || new Date().toISOString().slice(0, 10),
        posting_date: voucher?.posting_date || voucher?.voucher_date || new Date().toISOString().slice(0, 10),
        tenant_id: String(voucher?.tenant_id || ''),
        department_id: String(voucher?.department_id || ''),
        reference_no: voucher?.reference_no || '',
        external_reference_no: voucher?.external_reference_no || '',
        currency_code: voucher?.currency_code || baseCurrency,
        exchange_rate: voucher?.exchange_rate || '1',
        payment_account_id: String(voucher?.payment_account_id || ''),
        instrument_type: voucher?.instrument_type || '',
        instrument_no: voucher?.instrument_no || '',
        instrument_date: voucher?.instrument_date || '',
        bank_reference: voucher?.bank_reference || '',
        deposit_reference: voucher?.deposit_reference || '',
        clearing_date: voucher?.clearing_date || '',
        remarks: voucher?.remarks || '',
        set_payment_account_as_default: false,
        counterparty_account_id: '',
        set_vendor_counterparty_default: false,
        save_template: false,
        template_name: '',
        template_scope: 'user',
        attachments: [],
        lines: initialLines,
    });

    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [confirmState, setConfirmState] = React.useState({ open: false, intent: 'draft' });
    const [openInvoicesByVendor, setOpenInvoicesByVendor] = React.useState({});
    const [loadingInvoiceVendorId, setLoadingInvoiceVendorId] = React.useState('');
    const [serverPreview, setServerPreview] = React.useState(null);
    const [showAdvanced, setShowAdvanced] = React.useState(Boolean(voucher?.external_reference_no));
    const attachmentInputRef = React.useRef(null);

    const isJournalVoucher = data.voucher_type === 'JV';
    const isPaymentVoucher = ['CPV', 'BPV'].includes(data.voucher_type);
    const isReceiptVoucher = ['CRV', 'BRV'].includes(data.voucher_type);
    const isCashVoucher = ['CPV', 'CRV'].includes(data.voucher_type);
    const paymentLabel = isJournalVoucher ? '' : paymentLabelMap[data.voucher_type];
    const isManualEntry = data.entry_mode === 'manual' || isJournalVoucher;
    const isSmartMode = !isJournalVoucher && data.entry_mode === 'smart';
    const isSmartPaymentVoucher = isSmartMode && isPaymentVoucher;
    const showPaymentFor = isSmartPaymentVoucher;
    const showVendorPayee = isSmartPaymentVoucher && data.payment_for === 'vendor_payment';
    const allowedPartyTypeOptions = isPaymentVoucher
        ? [{ value: 'vendor', label: 'Vendor' }, { value: 'none', label: 'None (Expense Context)' }]
        : (isReceiptVoucher
            ? [
                { value: 'customer', label: 'Customer' },
                { value: 'member', label: 'Member' },
                { value: 'corporate_member', label: 'Corporate Member' },
            ]
            : []);
    const showParty = isSmartMode && isReceiptVoucher;
    const showInvoice = !isSmartPaymentVoucher && isSmartMode && (
        isPaymentVoucher
            ? (data.payment_mode === 'against_invoice' && data.vendor_id)
            : (data.party_type !== 'none' && data.party_id)
    );
    const showExpense = !isSmartPaymentVoucher && data.payment_for === 'expense';
    const counterpartyResolution = serverPreview?.counterparty_resolution || null;
    const requiresCounterpartySelection = !isSmartPaymentVoucher
        && data.voucher_type === 'CPV'
        && data.payment_for === 'vendor_payment'
        && Boolean(counterpartyResolution?.requires_selection);
    const counterpartyRoleLabel = counterpartyResolution?.account_role || (data.payment_mode === 'against_invoice' ? 'Payable Account' : 'Advance Account');

    const filteredPaymentAccounts = paymentAccounts.filter((account) => {
        const belongsToSelectedTenant = String(account.tenant_id || '') === String(data.tenant_id || '');
        const isSharedAccount = !account.tenant_id;
        if (!belongsToSelectedTenant && !isSharedAccount) {
            return false;
        }
        const method = String(account.payment_method || '').toLowerCase();
        if (isJournalVoucher) return false;
        if (isCashVoucher) return CASH_METHODS.includes(method);
        return BANK_METHODS.includes(method);
    });
    const defaultSmartPaymentAccount = filteredPaymentAccounts.find((account) => Boolean(Number(account.is_default || 0)));
    const selectedPaymentAccount = paymentAccounts.find((account) => String(account.id) === String(data.payment_account_id));
    const effectivePaymentAccount = isSmartMode
        ? (defaultSmartPaymentAccount || selectedPaymentAccount || null)
        : (selectedPaymentAccount || null);
    const selectedPaymentCoa = accounts.find((account) => String(account.id) === String(effectivePaymentAccount?.coa_account_id || ''));
    const selectedVendor = vendors.find((vendor) => String(vendor.id) === String(data.vendor_id));
    const selectedTenant = tenants.find((tenant) => String(tenant.id) === String(data.tenant_id));
    const isForeignCurrency = String(data.currency_code || '').toUpperCase() !== String(baseCurrency).toUpperCase();
    const smartPaymentRows = Array.isArray(data.payment_rows) ? data.payment_rows : [];
    const smartRowsTotal = smartPaymentRows.reduce((sum, row) => sum + Number(row?.amount || 0), 0);
    const selectedInvoice = React.useMemo(() => {
        if (isSmartPaymentVoucher) return null;
        if (!data.invoice_id || !data.invoice_type) return null;
        const invoiceKey = `${isPaymentVoucher ? 'vendor' : data.party_type}:${isPaymentVoucher ? data.vendor_id : data.party_id}`;
        return (openInvoicesByVendor[invoiceKey] || []).find((invoice) => (
            String(invoice.id) === String(data.invoice_id) && String(invoice.invoice_type) === String(data.invoice_type)
        )) || null;
    }, [isSmartPaymentVoucher, data.invoice_id, data.invoice_type, data.party_type, data.party_id, data.vendor_id, isPaymentVoucher, openInvoicesByVendor]);
    const firstSmartInvoice = React.useMemo(() => {
        if (!isSmartPaymentVoucher || data.payment_for !== 'vendor_payment') return null;
        const invoiceOptions = openInvoicesByVendor[String(data.vendor_id || '')] || [];
        const invoiceRow = smartPaymentRows.find((row) => row?.payment_mode === 'against_invoice' && row?.invoice_id);
        if (!invoiceRow) return null;
        return invoiceOptions.find((invoice) => String(invoice.id) === String(invoiceRow.invoice_id)) || null;
    }, [isSmartPaymentVoucher, data.payment_for, data.vendor_id, smartPaymentRows, openInvoicesByVendor]);

    const getPartyOptions = React.useMemo(() => {
        if (data.party_type === 'vendor') return vendors;
        if (data.party_type === 'customer') return customers;
        if (data.party_type === 'member') return members;
        if (data.party_type === 'corporate_member') return corporateMembers;
        return [];
    }, [data.party_type, vendors, customers, members, corporateMembers]);

    const autoNarration = React.useMemo(() => {
        const remarks = (data.remarks || '').trim();
        if (isSmartPaymentVoucher && smartPaymentRows.length > 0) {
            const channel = data.voucher_type === 'CPV' ? 'Cash' : 'Bank';
            const accountName = effectivePaymentAccount?.name || `${channel.toLowerCase()} account`;
            const total = smartRowsTotal;
            let sentence = `${channel} payment voucher of ${formatAmount(total)} via ${accountName}`;
            if (data.payment_for === 'vendor_payment') {
                const vendorName = selectedVendor?.name || 'vendor';
                sentence = firstSmartInvoice?.number
                    ? `${channel} payment to ${vendorName} against bill ${firstSmartInvoice.number} via ${accountName}`
                    : `${channel} payment to ${vendorName} via ${accountName}`;
            } else if (data.payment_for === 'expense') {
                const firstExpenseAccount = expenseAccounts.find((account) => String(account.id) === String(smartPaymentRows[0]?.expense_account_id || ''));
                sentence = firstExpenseAccount?.name
                    ? `${channel} expense payment for ${firstExpenseAccount.name} via ${accountName}`
                    : `${channel} expense payment via ${accountName}`;
            }
            return remarks ? `${sentence}. ${remarks}` : sentence;
        }

        if (data.voucher_type === 'CPV' && isSmartMode) {
            const cashAccountName = effectivePaymentAccount?.name || 'cash account';
            let sentence = `Cash payment via ${cashAccountName}`;

            if (data.payment_for === 'vendor_payment') {
                const vendorName = selectedVendor?.name || 'vendor';
                if (data.payment_mode === 'against_invoice' && selectedInvoice?.number) {
                    sentence = `Cash payment to ${vendorName} against bill ${selectedInvoice.number} via ${cashAccountName}`;
                } else {
                    sentence = `Cash payment to ${vendorName} via ${cashAccountName}`;
                }
            } else if (data.payment_for === 'expense') {
                sentence = `Cash expense payment via ${cashAccountName}`;
            }

            return remarks ? `${sentence}. ${remarks}` : sentence;
        }

        const type = data.voucher_type || 'Voucher';
        const mode = data.entry_mode === 'manual' ? 'Manual' : 'Smart';
        const parts = [type, mode];
        if (selectedInvoice?.number) {
            parts.push(`Ref: ${selectedInvoice.number}`);
        }
        if (effectivePaymentAccount?.name) {
            parts.push(`Via ${effectivePaymentAccount.name}`);
        }
        if (remarks) {
            parts.push(remarks);
        }

        return parts.join(' | ');
    }, [
        data.voucher_type,
        data.entry_mode,
        data.payment_for,
        data.payment_mode,
        data.vendor_id,
        data.party_id,
        data.remarks,
        isSmartPaymentVoucher,
        isSmartMode,
        selectedVendor?.name,
        selectedInvoice?.number,
        firstSmartInvoice?.number,
        effectivePaymentAccount?.name,
        smartRowsTotal,
        JSON.stringify(expenseAccounts),
        JSON.stringify(smartPaymentRows),
    ]);

    React.useEffect(() => {
        if (isJournalVoucher && data.entry_mode !== 'manual') {
            setData('entry_mode', 'manual');
        }
        if (!isJournalVoucher && data.entry_mode !== 'smart') {
            setData('entry_mode', 'smart');
        }
    }, [isJournalVoucher, data.entry_mode]);

    React.useEffect(() => {
        if (!isSmartMode) return;
        if (isSmartPaymentVoucher) {
            if (!['expense', 'vendor_payment'].includes(data.payment_for)) {
                setData('payment_for', 'expense');
            }
            if (data.payment_for === 'expense') {
                if (data.vendor_id) setData('vendor_id', '');
                if (data.party_type !== 'none') setData('party_type', 'none');
                if (data.party_id) setData('party_id', '');
                if ((smartPaymentRows || []).some((row) => row.payment_mode === 'against_invoice' || row.invoice_id)) {
                    setData('payment_rows', smartPaymentRows.map((row) => ({ ...row, payment_mode: 'direct', invoice_id: '' })));
                }
            } else {
                if (data.party_type !== 'vendor') setData('party_type', 'vendor');
                if (data.vendor_id && String(data.party_id) !== String(data.vendor_id)) {
                    setData('party_id', String(data.vendor_id));
                }
            }
            return;
        }

        if (isPaymentVoucher) {
            if (!['expense', 'vendor_payment'].includes(data.payment_for)) {
                setData('payment_for', 'expense');
            }
            if (!['direct', 'against_invoice'].includes(data.payment_mode)) {
                setData('payment_mode', 'direct');
            }

            if (data.payment_for === 'expense') {
                if (data.vendor_id) setData('vendor_id', '');
                if (data.party_type !== 'none') setData('party_type', 'none');
                if (data.party_id) setData('party_id', '');
                if (data.invoice_id) setData('invoice_id', '');
                if (data.invoice_type) setData('invoice_type', '');
                if (data.payment_mode === 'against_invoice') setData('payment_mode', 'direct');
                if (data.counterparty_account_id) setData('counterparty_account_id', '');
                if (data.set_vendor_counterparty_default) setData('set_vendor_counterparty_default', false);
            } else {
                if (data.party_type !== 'vendor') setData('party_type', 'vendor');
                if (data.vendor_id && String(data.party_id) !== String(data.vendor_id)) {
                    setData('party_id', String(data.vendor_id));
                }
            }
        } else if (isReceiptVoucher) {
            if (!['customer', 'member', 'corporate_member'].includes(data.party_type)) {
                setData('party_type', 'customer');
                setData('party_id', '');
            }
            if (data.expense_type_id) {
                setData('expense_type_id', '');
            }
            if (data.vendor_id) {
                setData('vendor_id', '');
            }
            if (data.payment_for !== 'expense') {
                setData('payment_for', 'expense');
            }
            if (data.payment_mode !== 'direct') {
                setData('payment_mode', 'direct');
            }
            if (data.counterparty_account_id) {
                setData('counterparty_account_id', '');
            }
            if (data.set_vendor_counterparty_default) {
                setData('set_vendor_counterparty_default', false);
            }
        }
    }, [
        isSmartMode,
        isPaymentVoucher,
        isReceiptVoucher,
        data.party_type,
        data.party_id,
        data.vendor_id,
        data.payment_for,
        data.payment_mode,
        data.invoice_id,
        data.invoice_type,
        data.counterparty_account_id,
        data.set_vendor_counterparty_default,
        isSmartPaymentVoucher,
        JSON.stringify(smartPaymentRows),
    ]);

    React.useEffect(() => {
        if (isJournalVoucher && data.payment_account_id) {
            setData('payment_account_id', '');
        }
    }, [isJournalVoucher]);

    React.useEffect(() => {
        if (isJournalVoucher) return;

        if (isSmartMode) {
            if (defaultSmartPaymentAccount) {
                const nextId = String(defaultSmartPaymentAccount.id);
                if (String(data.payment_account_id || '') !== nextId) {
                    setData('payment_account_id', nextId);
                }
            }
            return;
        }

        if (!data.payment_account_id && filteredPaymentAccounts.length === 1) {
            setData('payment_account_id', String(filteredPaymentAccounts[0].id));
        }
    }, [
        isJournalVoucher,
        isSmartMode,
        defaultSmartPaymentAccount?.id,
        data.payment_account_id,
        filteredPaymentAccounts.length,
    ]);

    React.useEffect(() => {
        if (isSmartPaymentVoucher) {
            if (data.payment_for !== 'vendor_payment' || !data.vendor_id) {
                return;
            }
            const hasAgainstInvoiceRows = (smartPaymentRows || []).some((row) => row?.payment_mode === 'against_invoice');
            if (!hasAgainstInvoiceRows) return;
            const vendorId = String(data.vendor_id);
            if (openInvoicesByVendor[vendorId]) return;
            setLoadingInvoiceVendorId(vendorId);
            fetch(`${route('accounting.vouchers.open-invoices')}?party_type=vendor&party_id=${encodeURIComponent(vendorId)}`)
                .then((response) => response.json())
                .then((json) => {
                    setOpenInvoicesByVendor((prev) => ({ ...prev, [vendorId]: json.data || [] }));
                })
                .catch(() => {
                    setOpenInvoicesByVendor((prev) => ({ ...prev, [vendorId]: [] }));
                })
                .finally(() => setLoadingInvoiceVendorId((prev) => (prev === vendorId ? '' : prev)));
            return;
        }

        if (!showInvoice) {
            setData('invoice_id', '');
            setData('invoice_type', '');
            return;
        }

        const partyType = isPaymentVoucher ? 'vendor' : data.party_type;
        const partyId = isPaymentVoucher ? data.vendor_id : data.party_id;
        const key = `${partyType}:${partyId}`;
        if (openInvoicesByVendor[key]) {
            return;
        }
        setLoadingInvoiceVendorId(key);
        fetch(`${route('accounting.vouchers.open-invoices')}?party_type=${encodeURIComponent(partyType)}&party_id=${encodeURIComponent(partyId)}`)
            .then((response) => response.json())
            .then((json) => {
                setOpenInvoicesByVendor((prev) => ({ ...prev, [key]: json.data || [] }));
            })
            .catch(() => setOpenInvoicesByVendor((prev) => ({ ...prev, [key]: [] })))
            .finally(() => setLoadingInvoiceVendorId((prev) => (prev === key ? '' : prev)));
    }, [showInvoice, data.party_type, data.party_id, data.vendor_id, data.payment_for, isPaymentVoucher, isSmartPaymentVoucher, JSON.stringify(smartPaymentRows)]);

    React.useEffect(() => {
        const controller = new AbortController();
        const shouldSkip = !data.voucher_type || !data.voucher_date || !data.posting_date || !data.tenant_id || (!isJournalVoucher && !data.payment_account_id);
        if (shouldSkip) {
            setServerPreview(null);
            return () => controller.abort();
        }

        const timeout = setTimeout(() => {
            fetch(route('accounting.vouchers.preview'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ ...data, intent: 'draft' }),
                signal: controller.signal,
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('preview failed');
                    }
                    return response.json();
                })
                .then((json) => setServerPreview(json?.data || null))
                .catch(() => setServerPreview(null));
        }, 250);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [
        data.voucher_type,
        data.entry_mode,
        data.payment_for,
        data.payment_mode,
        data.party_type,
        data.party_id,
        data.vendor_id,
        data.invoice_type,
        data.invoice_id,
        data.expense_type_id,
        data.counterparty_account_id,
        data.set_vendor_counterparty_default,
        data.amount,
        data.voucher_date,
        data.posting_date,
        data.tenant_id,
        data.department_id,
        data.payment_account_id,
        data.currency_code,
        data.exchange_rate,
        data.remarks,
        JSON.stringify(data.payment_rows),
        JSON.stringify(data.lines),
        isJournalVoucher,
    ]);

    const fallbackPreviewLines = buildPreviewLines({
        data,
        accounts,
        selectedPaymentCoa,
        selectedInvoice,
        expenseAccounts,
        selectedVendor,
        isManualEntry,
        lines: data.lines,
    });
    const previewLines = (serverPreview?.effective_lines || fallbackPreviewLines).map((line) => ({
        ...line,
        account_label: line.account_label || accountLabel(accounts, line.account_id),
    }));

    const totals = (serverPreview?.totals || previewLines.reduce((acc, line) => {
        acc.debit += Number(line.debit || 0);
        acc.credit += Number(line.credit || 0);
        return acc;
    }, { debit: 0, credit: 0 }));
    const difference = Math.abs(totals.debit - totals.credit);
    const lineWarnings = buildWarnings({
        data,
        selectedInvoice,
        difference,
        baseCurrency,
        selectedPaymentAccount: effectivePaymentAccount,
        isManualEntry,
        isReceiptVoucher,
        mappingReadiness,
    });

    const canPost = (() => {
        if (!data.voucher_date || !data.posting_date || !data.tenant_id) return false;
        if (!isJournalVoucher && !data.payment_account_id) return false;
        if (isManualEntry) return difference < 0.0001 && previewLines.length >= 2;
        if (isSmartPaymentVoucher) {
            if (!Array.isArray(data.payment_rows) || data.payment_rows.length === 0) return false;
            if (smartRowsTotal <= 0) return false;
        } else if (!data.amount || Number(data.amount) <= 0) {
            return false;
        }
        if (!isSmartMode) return false;
        if ((data.invoice_type && !data.invoice_id) || (data.invoice_id && !data.invoice_type)) return false;

        if (isPaymentVoucher) {
            if (isSmartPaymentVoucher) {
                for (const row of data.payment_rows) {
                    if (Number(row?.amount || 0) <= 0) return false;
                    if (data.payment_for === 'expense' && !row?.expense_account_id) return false;
                    if (data.payment_for === 'vendor_payment' && row.payment_mode === 'against_invoice' && !row.invoice_id) return false;
                }
                if (data.payment_for === 'vendor_payment' && !data.vendor_id) return false;
            } else {
                if (!['expense', 'vendor_payment'].includes(data.payment_for)) return false;
                if (data.payment_for === 'vendor_payment' && !data.vendor_id) return false;
                if (data.payment_mode === 'against_invoice' && !data.invoice_id) return false;
                if (requiresCounterpartySelection && !data.counterparty_account_id) return false;
            }
        }
        if (showParty && data.party_type !== 'none' && !data.party_id) return false;
        if (isReceiptVoucher && (!data.party_type || data.party_type === 'none' || !data.party_id)) return false;
        if (!isSmartPaymentVoucher && !data.expense_type_id && !data.invoice_id && !data.party_id && !data.vendor_id) return false;
        return true;
    })();

    const addLine = () => setData('lines', [...data.lines, emptyLine()]);
    const duplicateLine = (index) => setData('lines', [...data.lines.slice(0, index + 1), { ...data.lines[index] }, ...data.lines.slice(index + 1)]);
    const removeLine = (index) => {
        if (data.lines.length <= 2) return;
        setData('lines', data.lines.filter((_, i) => i !== index));
    };
    const moveLine = (index, direction) => {
        const next = [...data.lines];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setData('lines', next);
    };
    const updateLine = (index, key, value) => {
        const next = data.lines.map((line, i) => (i === index ? { ...line, [key]: value } : line));
        setData('lines', next);
    };

    const addPaymentRow = () => setData('payment_rows', [...smartPaymentRows, emptyPaymentRow()]);
    const removePaymentRow = (index) => {
        const next = smartPaymentRows.filter((_, i) => i !== index);
        setData('payment_rows', next.length ? next : [emptyPaymentRow()]);
    };
    const updatePaymentRow = (index, patch) => {
        const next = smartPaymentRows.map((row, i) => {
            if (i !== index) return row;
            return { ...row, ...patch };
        });
        setData('payment_rows', next);
    };
    const invoiceOptionsForVendor = () => openInvoicesByVendor[String(data.vendor_id || '')] || [];

    const loadLastDefaults = async () => {
        try {
            const response = await fetch(`${route('accounting.vouchers.last-defaults')}?entry_mode=${encodeURIComponent(data.entry_mode)}&voucher_type=${encodeURIComponent(data.voucher_type)}`);
            const json = await response.json();
            if (!json.data) return;
            Object.entries(json.data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'entry_mode') {
                        setData('entry_mode', String(value).toLowerCase() === 'manual' ? 'manual' : 'smart');
                        return;
                    }
                    setData(key, typeof value === 'number' ? String(value) : value);
                }
            });
        } catch (error) {
            // best-effort load
        }
    };

    const focusNextField = (event) => {
        if (event.key !== 'Enter') return;
        const form = event.currentTarget.form;
        if (!form) return;
        const elements = Array.from(form.querySelectorAll('input, textarea')).filter((el) => !el.disabled && el.type !== 'hidden');
        const currentIndex = elements.indexOf(event.currentTarget);
        if (currentIndex >= 0 && elements[currentIndex + 1]) {
            event.preventDefault();
            elements[currentIndex + 1].focus();
        }
    };

    const submitForm = (intent) => {
        intentRef.current = intent;
        transform((current) => ({ ...current, intent }));
        const url = mode === 'edit' ? route('accounting.vouchers.update', voucher.id) : route('accounting.vouchers.store');
        const method = mode === 'edit' ? put : post;
        method(url, {
            forceFormData: true,
            onSuccess: () => setConfirmState({ open: false, intent: 'draft' }),
            onError: () => setConfirmState((current) => ({ ...current, open: false })),
        });
    };

    const renderVoucherActions = ({ top = false } = {}) => (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1.25,
                flexWrap: 'wrap',
                mb: top ? 1.5 : 0,
                mt: top ? 0 : 0.5,
            }}
        >
            <Button variant="outlined" startIcon={<Preview />} onClick={() => setPreviewOpen(true)}>
                Preview
            </Button>
            <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" href={route('accounting.vouchers.index')}>Cancel</Button>
                {mode === 'edit' && voucher?.status !== 'posted' ? (
                    <Button color="warning" variant="outlined" onClick={() => setConfirmState({ open: true, intent: 'cancel' })}>
                        Cancel Voucher
                    </Button>
                ) : null}
                <AppLoadingButton variant="outlined" loading={processing && intentRef.current === 'draft'} onClick={() => submitForm('draft')}>
                    Save Draft
                </AppLoadingButton>
                <AppLoadingButton
                    variant="outlined"
                    loading={processing && intentRef.current === 'submit'}
                    onClick={() => setConfirmState({ open: true, intent: 'submit' })}
                    disabled={!canPost}
                    sx={{
                        '&.Mui-disabled': {
                            color: 'rgba(15, 23, 42, 0.48)',
                            borderColor: 'rgba(15, 23, 42, 0.18)',
                        },
                    }}
                >
                    Submit for Approval
                </AppLoadingButton>
                <AppLoadingButton
                    variant="contained"
                    loading={processing && intentRef.current === 'post'}
                    onClick={() => setConfirmState({ open: true, intent: 'post' })}
                    disabled={!canPost}
                    sx={{
                        color: '#fff !important',
                        '& .MuiButton-label': { color: '#fff !important' },
                        '&.Mui-disabled': {
                            color: 'rgba(255, 255, 255, 0.72) !important',
                        },
                    }}
                >
                    Post Voucher
                </AppLoadingButton>
            </Stack>
        </Box>
    );

    return (
        <AppPage
            eyebrow="Accounting"
            title={mode === 'edit' ? `Edit ${voucher?.voucher_no || 'Voucher'}` : 'Create Intelligent Voucher'}
            subtitle="Entity-led accounting workflow with system-generated entries."
            actions={[
                <Chip key="status" label={`Status: ${voucher?.status || 'draft'}`} color={voucher?.status === 'posted' ? 'success' : voucher?.status === 'submitted' ? 'warning' : 'default'} />,
                <Chip key="number" label={`Voucher No: ${voucher?.voucher_no || 'Auto on save'}`} variant="outlined" />,
            ]}
        >
            <form onSubmit={(e) => e.preventDefault()}>
                {renderVoucherActions({ top: true })}
                <SurfaceCard title="Voucher Header">
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Chip size="small" label={`Mode: ${isJournalVoucher ? 'Manual' : 'Smart'}`} />
                        <Button size="small" variant="text" onClick={() => setShowAdvanced((prev) => !prev)}>
                            {showAdvanced ? 'Hide Advanced' : 'More Options'}
                        </Button>
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Voucher Type" value={data.voucher_type} onChange={(e) => setData('voucher_type', e.target.value)} fullWidth size="small" disabled={mode === 'edit'}>
                                {VOUCHER_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField type="date" label="Voucher Date" value={data.voucher_date} onChange={(e) => setData('voucher_date', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} onKeyDown={focusNextField} error={!!errors.voucher_date} helperText={errors.voucher_date} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField type="date" label="Posting Date" value={data.posting_date} onChange={(e) => setData('posting_date', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} onKeyDown={focusNextField} error={!!errors.posting_date} helperText={errors.posting_date} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select label="Branch / Business Unit" value={data.tenant_id} onChange={(e) => setData('tenant_id', e.target.value)} fullWidth size="small" error={!!errors.tenant_id} helperText={errors.tenant_id}>
                                {tenants.map((tenant) => <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>)}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <TextField select label="Cost Center" value={data.department_id} onChange={(e) => setData('department_id', e.target.value)} fullWidth size="small" error={!!errors.department_id} helperText={errors.department_id}>
                                <MenuItem value="">None</MenuItem>
                                {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField label="Reference No" value={data.reference_no} onChange={(e) => setData('reference_no', e.target.value)} fullWidth size="small" onKeyDown={focusNextField} error={!!errors.reference_no} helperText={errors.reference_no} />
                        </Grid>
                        {showAdvanced ? (
                            <Grid item xs={12} md={2}>
                                <TextField label="External Ref No" value={data.external_reference_no} onChange={(e) => setData('external_reference_no', e.target.value)} fullWidth size="small" onKeyDown={focusNextField} error={!!errors.external_reference_no} helperText={errors.external_reference_no} />
                            </Grid>
                        ) : null}
                        {(showAdvanced || isForeignCurrency || isManualEntry) ? (
                            <Grid item xs={12} md={2}>
                                <TextField label="Currency" value={data.currency_code} onChange={(e) => setData('currency_code', e.target.value.toUpperCase())} fullWidth size="small" onKeyDown={focusNextField} />
                            </Grid>
                        ) : null}
                        {isForeignCurrency ? (
                            <Grid item xs={12} md={2}>
                                <TextField type="number" label="Exchange Rate" value={data.exchange_rate} onChange={(e) => setData('exchange_rate', e.target.value)} fullWidth size="small" inputProps={{ min: 0, step: '0.000001' }} error={!!errors.exchange_rate} helperText={errors.exchange_rate} />
                            </Grid>
                        ) : null}

                        {!isJournalVoucher ? (
                            <Grid item xs={12} md={showParty || showVendorPayee ? 4 : 6}>
                                {isSmartMode ? (
                                    defaultSmartPaymentAccount ? (
                                        <TextField
                                            label={paymentLabel}
                                            value={defaultSmartPaymentAccount?.name || ''}
                                            fullWidth
                                            size="small"
                                            InputProps={{ readOnly: true }}
                                            error={!!errors.payment_account_id}
                                            helperText={errors.payment_account_id || `Recommended for ${selectedTenant?.name || 'selected branch'}.`}
                                        />
                                    ) : (
                                        <TextField
                                            select
                                            label={paymentLabel}
                                            value={data.payment_account_id}
                                            onChange={(e) => setData('payment_account_id', e.target.value)}
                                            fullWidth
                                            size="small"
                                            error={!!errors.payment_account_id}
                                            helperText={errors.payment_account_id || `No default configured for ${selectedTenant?.name || 'this branch'}.`}
                                        >
                                            <MenuItem value="">Select account</MenuItem>
                                            {filteredPaymentAccounts.map((account) => (
                                                <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    )
                                ) : (
                                    <TextField
                                        select
                                        label={paymentLabel}
                                        value={data.payment_account_id}
                                        onChange={(e) => setData('payment_account_id', e.target.value)}
                                        fullWidth
                                        size="small"
                                        error={!!errors.payment_account_id}
                                        helperText={errors.payment_account_id || (filteredPaymentAccounts.length === 0 ? `No valid ${paymentLabel?.toLowerCase()} configured.` : `${paymentLabel} is required.`)}
                                    >
                                        {filteredPaymentAccounts.map((account) => (
                                            <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            </Grid>
                        ) : null}

                        {showPaymentFor ? (
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    label="Payment For"
                                    value={data.payment_for}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setData('payment_for', next);
                                        setData('invoice_id', '');
                                        setData('invoice_type', '');
                                        if (next === 'expense') {
                                            setData('vendor_id', '');
                                            setData('party_type', 'none');
                                            setData('party_id', '');
                                            setData('payment_mode', 'direct');
                                        } else {
                                            setData('party_type', 'vendor');
                                        }
                                    }}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="expense">Expense</MenuItem>
                                    <MenuItem value="vendor_payment">Vendor Payment</MenuItem>
                                </TextField>
                            </Grid>
                        ) : null}

                        {showVendorPayee ? (
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    options={vendors}
                                    size="small"
                                    value={vendors.find((option) => String(option.id) === String(data.vendor_id)) || null}
                                    onChange={(_, value) => {
                                        const id = value ? String(value.id) : '';
                                        setData('vendor_id', id);
                                        setData('party_type', id ? 'vendor' : 'none');
                                        setData('party_id', id);
                                        setData('invoice_id', '');
                                        setData('invoice_type', '');
                                        setData('counterparty_account_id', '');
                                        setData('set_vendor_counterparty_default', false);
                                    }}
                                    getOptionLabel={(option) => option.name || ''}
                                    renderInput={(params) => <TextField {...params} label="Vendor / Payee" error={!!errors.vendor_id} helperText={errors.vendor_id} />}
                                />
                            </Grid>
                        ) : null}

                        {showPaymentFor ? (
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    label="Payment Mode"
                                    value={data.payment_mode}
                                    onChange={(e) => {
                                        const modeValue = e.target.value;
                                        setData('payment_mode', modeValue);
                                        setData('invoice_id', '');
                                        setData('invoice_type', '');
                                        setData('counterparty_account_id', '');
                                        setData('set_vendor_counterparty_default', false);
                                    }}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="direct">Direct</MenuItem>
                                    <MenuItem value="against_invoice" disabled={data.payment_for !== 'vendor_payment'}>
                                        Against Invoice
                                    </MenuItem>
                                </TextField>
                            </Grid>
                        ) : null}

                        {showParty ? (
                            <>
                                <Grid item xs={12} md={2}>
                                    <TextField select label="Party Type" value={data.party_type} onChange={(e) => {
                                        setData('party_type', e.target.value);
                                        setData('party_id', '');
                                        setData('invoice_id', '');
                                        setData('invoice_type', '');
                                    }} fullWidth size="small" error={!!errors.party_type} helperText={errors.party_type}>
                                        {allowedPartyTypeOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Autocomplete
                                        options={getPartyOptions}
                                        size="small"
                                        value={getPartyOptions.find((option) => String(option.id) === String(data.party_id)) || null}
                                        onChange={(_, value) => {
                                            setData('party_id', value ? String(value.id) : '');
                                            setData('invoice_id', '');
                                            setData('invoice_type', '');
                                        }}
                                        getOptionLabel={(option) => option.name || ''}
                                        renderInput={(params) => <TextField {...params} label="Party" error={!!errors.party_id} helperText={errors.party_id} />}
                                    />
                                </Grid>
                            </>
                        ) : null}

                        {showInvoice ? (
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label={(loadingInvoiceVendorId === `${isPaymentVoucher ? 'vendor' : data.party_type}:${isPaymentVoucher ? data.vendor_id : data.party_id}`) ? 'Loading invoices...' : (isPaymentVoucher ? 'Against Invoice' : 'Against Invoice (Optional)')}
                                    value={data.invoice_id ? `${data.invoice_type}:${data.invoice_id}` : ''}
                                    onChange={(e) => {
                                        const [invoiceType, invoiceId] = String(e.target.value).split(':');
                                        setData('invoice_type', invoiceType || '');
                                        setData('invoice_id', invoiceId || '');
                                    }}
                                    fullWidth
                                    size="small"
                                    error={!!errors.invoice_id}
                                    helperText={errors.invoice_id}
                                >
                                    <MenuItem value="">Select invoice</MenuItem>
                                    {(openInvoicesByVendor[`${isPaymentVoucher ? 'vendor' : data.party_type}:${isPaymentVoucher ? data.vendor_id : data.party_id}`] || []).map((invoice) => (
                                        <MenuItem key={`${invoice.invoice_type}:${invoice.id}`} value={`${invoice.invoice_type}:${invoice.id}`}>
                                            {invoice.number} | Outstanding {formatAmount(invoice.outstanding)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        ) : null}

                        {isSmartPaymentVoucher ? (
                            <Grid item xs={12}>
                                <SurfaceCard lowChrome title="Payment Rows" subtitle={data.payment_for === 'vendor_payment' ? 'Split vendor payments across rows.' : 'Add expense rows with account and amount.'}>
                                    {data.payment_for === 'expense' && expenseAccounts.length === 0 ? (
                                        <Alert
                                            severity="warning"
                                            sx={{ mb: 1.5 }}
                                            action={
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" variant="outlined" href={route('accounting.coa.index')}>
                                                        Chart of Accounts
                                                    </Button>
                                                    <Button size="small" variant="outlined" href={route('accounting.vouchers.mappings.index')}>
                                                        Voucher Mappings
                                                    </Button>
                                                </Stack>
                                            }
                                        >
                                            No active postable expense accounts are configured. Create expense accounts in Chart of Accounts with type `expense`, then review defaults in Voucher Mappings.
                                        </Alert>
                                    ) : null}
                                    <AdminDataTable
                                        columns={[
                                            { key: 'item', label: data.payment_for === 'vendor_payment' ? 'Vendor / Payee' : 'Expense Account', minWidth: 280 },
                                            { key: 'amount', label: 'Amount', minWidth: 160 },
                                            ...(data.payment_for === 'vendor_payment' ? [{ key: 'invoice', label: 'Invoice', minWidth: 230 }] : []),
                                            { key: 'reference', label: 'Reference', minWidth: 150 },
                                            { key: 'actions', label: 'Actions', minWidth: 90, align: 'right' },
                                        ]}
                                        rows={smartPaymentRows}
                                        pagination={null}
                                        emptyMessage="No payment rows added."
                                        renderRow={(row, index) => {
                                            const vendorOptions = invoiceOptionsForVendor();
                                            return (
                                                <TableRow key={`payment-row-${index}`}>
                                                    <TableCell>
                                                        {data.payment_for === 'expense' ? (
                                                            <TextField
                                                                select
                                                                size="small"
                                                                value={row.expense_account_id || ''}
                                                                onChange={(e) => updatePaymentRow(index, { expense_account_id: e.target.value })}
                                                                fullWidth
                                                                label="Expense Account"
                                                                error={!!errors[`payment_rows.${index}.expense_account_id`]}
                                                                helperText={errors[`payment_rows.${index}.expense_account_id`]}
                                                                disabled={expenseAccounts.length === 0}
                                                            >
                                                                <MenuItem value="">Select expense account</MenuItem>
                                                                {expenseAccounts.map((item) => (
                                                                    <MenuItem key={item.id} value={String(item.id)}>
                                                                        {item.full_code} - {item.name}
                                                                    </MenuItem>
                                                                ))}
                                                            </TextField>
                                                        ) : (
                                                            <TextField
                                                                size="small"
                                                                value={selectedVendor?.name || ''}
                                                                fullWidth
                                                                InputProps={{ readOnly: true }}
                                                                label="Vendor / Payee"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            value={row.amount || ''}
                                                            onChange={(e) => updatePaymentRow(index, { amount: e.target.value })}
                                                            fullWidth
                                                            inputProps={{ min: 0, step: '0.01' }}
                                                            error={!!errors[`payment_rows.${index}.amount`]}
                                                            helperText={errors[`payment_rows.${index}.amount`]}
                                                        />
                                                    </TableCell>
                                                    {data.payment_for === 'vendor_payment' ? (
                                                    <TableCell>
                                                        <Stack spacing={0.75}>
                                                            <TextField
                                                                select
                                                                size="small"
                                                                label="Mode"
                                                                value={row.payment_mode || 'direct'}
                                                                onChange={(e) => updatePaymentRow(index, { payment_mode: e.target.value, invoice_id: '' })}
                                                                disabled={data.payment_for !== 'vendor_payment'}
                                                            >
                                                                <MenuItem value="direct">Direct</MenuItem>
                                                                <MenuItem value="against_invoice">Against Invoice</MenuItem>
                                                            </TextField>
                                                            {data.payment_for === 'vendor_payment' && row.payment_mode === 'against_invoice' ? (
                                                                <TextField
                                                                    select
                                                                    size="small"
                                                                    value={row.invoice_id || ''}
                                                                    onChange={(e) => {
                                                                        const nextId = e.target.value;
                                                                        const selected = vendorOptions.find((opt) => String(opt.id) === String(nextId));
                                                                        updatePaymentRow(index, {
                                                                            invoice_id: nextId,
                                                                            amount: !row.amount && selected ? String(selected.outstanding || '') : row.amount,
                                                                            reference_no: !row.reference_no && selected ? (selected.number || '') : row.reference_no,
                                                                        });
                                                                    }}
                                                                    fullWidth
                                                                    label={loadingInvoiceVendorId === String(data.vendor_id || '') ? 'Loading...' : 'Against Invoice'}
                                                                    error={!!errors[`payment_rows.${index}.invoice_id`]}
                                                                    helperText={errors[`payment_rows.${index}.invoice_id`]}
                                                                >
                                                                    <MenuItem value="">Select invoice</MenuItem>
                                                                    {vendorOptions.map((invoice) => (
                                                                        <MenuItem key={`${invoice.invoice_type}:${invoice.id}`} value={String(invoice.id)}>
                                                                            {invoice.number} | {formatAmount(invoice.outstanding)}
                                                                        </MenuItem>
                                                                    ))}
                                                                </TextField>
                                                            ) : null}
                                                        </Stack>
                                                    </TableCell>
                                                    ) : null}
                                                    <TableCell>
                                                        <TextField size="small" value={row.reference_no || ''} onChange={(e) => updatePaymentRow(index, { reference_no: e.target.value })} fullWidth />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" color="error" onClick={() => removePaymentRow(index)}>
                                                            <Delete fontSize="inherit" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }}
                                    />
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25 }}>
                                        <Button variant="outlined" size="small" startIcon={<Add />} onClick={addPaymentRow}>Add Row</Button>
                                        <Chip color="primary" variant="outlined" label={`Rows Total ${formatAmount(smartRowsTotal)}`} />
                                    </Stack>
                                    {errors.payment_rows ? <Alert severity="error" sx={{ mt: 1 }}>{errors.payment_rows}</Alert> : null}
                                </SurfaceCard>
                            </Grid>
                        ) : null}

                        {!isManualEntry && !isSmartPaymentVoucher ? (
                            <Grid item xs={12} md={2}>
                                <TextField
                                    type="number"
                                    label="Amount"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: '0.01' }}
                                    InputProps={{
                                        sx: {
                                            fontWeight: 700,
                                            bgcolor: 'rgba(2, 132, 199, 0.08)',
                                        },
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        },
                                        '& .MuiOutlinedInput-root fieldset': {
                                            borderColor: 'primary.main',
                                            borderWidth: 1.5,
                                        },
                                    }}
                                    error={!!errors.amount}
                                    helperText={errors.amount}
                                />
                            </Grid>
                        ) : null}

                        <Grid item xs={12}>
                            <TextField label="Remarks / Narration" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} fullWidth multiline minRows={2} size="small" error={!!errors.remarks} helperText={errors.remarks} />
                        </Grid>

                        {isSmartMode && !defaultSmartPaymentAccount ? (
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={Boolean(data.set_payment_account_as_default)}
                                            onChange={(e) => setData('set_payment_account_as_default', e.target.checked)}
                                            disabled={!canSetPaymentAccountDefault}
                                        />
                                    }
                                    label="Set selected payment account as branch default"
                                />
                            </Grid>
                        ) : null}

                        <Grid item xs={12}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Tooltip title="Attach documents">
                                    <IconButton onClick={() => attachmentInputRef.current?.click()} size="small" sx={{ border: '1px solid rgba(15,23,42,0.16)', borderRadius: 1.5 }}>
                                        <AttachFile fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <input
                                    ref={attachmentInputRef}
                                    hidden
                                    multiple
                                    type="file"
                                    onChange={(e) => setData('attachments', Array.from(e.target.files || []))}
                                />
                                <Typography variant="caption" color="text.secondary">Attachments</Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12}>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {(data.attachments || []).map((file, index) => <Chip key={`${file.name}-${index}`} label={file.name} variant="outlined" />)}
                                {(voucher?.media || []).map((file) => (
                                    <Chip
                                        key={`existing-${file.id}`}
                                        label={file.file_name}
                                        color="success"
                                        variant="outlined"
                                        component={file.file_path ? 'a' : 'div'}
                                        clickable={!!file.file_path}
                                        href={file.file_path ? `/storage/${file.file_path}` : undefined}
                                        target={file.file_path ? '_blank' : undefined}
                                        rel={file.file_path ? 'noopener noreferrer' : undefined}
                                        onDelete={mode === 'edit' ? () => router.delete(route('accounting.vouchers.attachments.delete', { voucher: voucher.id, media: file.id }), { preserveScroll: true }) : undefined}
                                    />
                                ))}
                            </Stack>
                        </Grid>
                    </Grid>
                </SurfaceCard>

                {lineWarnings.length > 0 ? (
                    <SurfaceCard lowChrome>
                        <Stack spacing={1}>
                            {lineWarnings.map((warning) => (
                                <Alert key={warning} severity="warning">{warning}</Alert>
                            ))}
                        </Stack>
                    </SurfaceCard>
                ) : null}

                {isManualEntry ? (
                    <SurfaceCard
                        title="Voucher Lines"
                        subtitle={isJournalVoucher ? 'Manual debit and credit lines for journal entries.' : 'Manual entry mode is active for this voucher.'}
                        actions={<Button variant="outlined" size="small" startIcon={<Add />} onClick={addLine}>Add Line</Button>}
                    >
                        <Box sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'rgba(255,255,255,0.98)', borderBottom: '1px solid rgba(15,23,42,0.08)', mb: 1, py: 1 }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip label={`Debit ${formatAmount(totals.debit)}`} color="primary" variant="outlined" />
                                    <Chip label={`Credit ${formatAmount(totals.credit)}`} color="primary" variant="outlined" />
                                    <Chip label={`Difference ${formatAmount(difference)}`} color={difference < 0.0001 ? 'success' : 'error'} />
                                </Stack>
                            </Stack>
                        </Box>
                        <AdminDataTable
                            columns={[
                                { key: 'account', label: 'Account', minWidth: 260 },
                                { key: 'department', label: 'Cost Center', minWidth: 180 },
                                { key: 'debit', label: 'Debit', minWidth: 120 },
                                { key: 'credit', label: 'Credit', minWidth: 120 },
                                { key: 'description', label: 'Narration', minWidth: 220 },
                                { key: 'reference', label: 'Reference', minWidth: 180 },
                                { key: 'actions', label: 'Actions', minWidth: 140, align: 'right' },
                            ]}
                            rows={data.lines}
                            pagination={null}
                            emptyMessage="No voucher lines."
                            tableMinWidth={1320}
                            renderRow={(line, index) => (
                                <TableRow key={index}>
                                    <TableCell sx={{ minWidth: 260 }}>
                                        <Autocomplete
                                            options={accounts}
                                            size="small"
                                            value={accounts.find((account) => String(account.id) === String(line.account_id)) || null}
                                            onChange={(_, value) => updateLine(index, 'account_id', value ? String(value.id) : '')}
                                            getOptionLabel={(option) => `${option.full_code} - ${option.name}`}
                                            renderInput={(params) => <TextField {...params} placeholder="Search account" error={!!errors[`lines.${index}.account_id`]} helperText={errors[`lines.${index}.account_id`]} />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField select size="small" value={line.department_id} onChange={(e) => updateLine(index, 'department_id', e.target.value)} fullWidth>
                                            <MenuItem value="">Default</MenuItem>
                                            {departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}
                                        </TextField>
                                    </TableCell>
                                    <TableCell><TextField type="number" size="small" value={line.debit} onChange={(e) => updateLine(index, 'debit', e.target.value)} fullWidth inputProps={{ min: 0, step: '0.01' }} /></TableCell>
                                    <TableCell><TextField type="number" size="small" value={line.credit} onChange={(e) => updateLine(index, 'credit', e.target.value)} fullWidth inputProps={{ min: 0, step: '0.01' }} /></TableCell>
                                    <TableCell><TextField size="small" value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} fullWidth onKeyDown={focusNextField} /></TableCell>
                                    <TableCell>
                                        <Stack spacing={0.75}>
                                            <TextField size="small" value={line.reference_type} onChange={(e) => updateLine(index, 'reference_type', e.target.value)} fullWidth placeholder="Type" />
                                            <TextField size="small" value={line.reference_id} onChange={(e) => updateLine(index, 'reference_id', e.target.value)} fullWidth placeholder="ID" />
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => moveLine(index, -1)} disabled={index === 0}><ArrowUpward fontSize="inherit" /></IconButton>
                                        <IconButton size="small" onClick={() => moveLine(index, 1)} disabled={index === data.lines.length - 1}><ArrowDownward fontSize="inherit" /></IconButton>
                                        <IconButton size="small" onClick={() => duplicateLine(index)}><ContentCopy fontSize="inherit" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => removeLine(index)} disabled={data.lines.length <= 2}><Delete fontSize="inherit" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                        {errors.lines ? <Alert severity="error" sx={{ mt: 1 }}>{errors.lines}</Alert> : null}
                    </SurfaceCard>
                ) : (
                    <SurfaceCard title="System-Generated Entries">
                        {counterpartyResolution?.requires_selection ? (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                                {counterpartyResolution?.message || `${counterpartyRoleLabel} mapping is missing. Select an account to continue.`}
                            </Alert>
                        ) : null}
                        {!isJournalVoucher ? (
                            <Box sx={{ mt: 1.25, px: 1.25, py: 1, border: '1px solid rgba(15,23,42,0.1)', borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.6)' }}>
                                <Typography variant="caption" color="text.secondary">Narration to Post</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{autoNarration || '-'}</Typography>
                            </Box>
                        ) : null}
                        <Box sx={{ mt: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                                Posting Preview
                            </Typography>
                            {previewLines.length > 0 ? (
                                <Stack spacing={0.75}>
                                    {previewLines.map((line, index) => {
                                        const debit = Number(line.debit || 0);
                                        const credit = Number(line.credit || 0);
                                        const side = debit > 0 ? 'Counterparty' : 'Payment Account';
                                        const amount = debit > 0 ? debit : credit;

                                        return (
                                            <Box
                                                key={`generated-line-${index}`}
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: { xs: '1fr', md: '160px 1fr 160px' },
                                                    gap: 1,
                                                    px: 1.25,
                                                    py: 1,
                                                    border: '1px solid rgba(15,23,42,0.1)',
                                                    borderRadius: 1.5,
                                                    bgcolor: 'rgba(255,255,255,0.6)',
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{side}</Typography>
                                                <Typography variant="body2">{line.account_label || '-'}</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, textAlign: { xs: 'left', md: 'right' } }}>
                                                    {formatAmount(amount)}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Complete Payment For, amount, and cash account to see generated debit and credit entries.
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ mt: 1.25, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip label={`Rows ${previewLines.length}`} color="primary" variant="outlined" />
                            <Chip label={`Total ${formatAmount(Math.max(totals.debit, totals.credit))}`} color="default" variant="outlined" />
                        </Box>
                    </SurfaceCard>
                )}

                <SurfaceCard lowChrome>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                        <Typography variant="body2" color="text.secondary">Smart Defaults</Typography>
                        <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={loadLastDefaults}>Use Last Defaults</Button>
                    </Stack>
                </SurfaceCard>
                {renderVoucherActions()}
            </form>

            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Voucher Preview</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`Type: ${data.voucher_type}`} />
                            <Chip label={`Mode: ${data.entry_mode === 'manual' ? 'Manual' : 'Smart'}`} />
                            <Chip label={`Voucher Date: ${data.voucher_date || '-'}`} />
                            <Chip label={`Posting Date: ${data.posting_date || '-'}`} />
                            <Chip label={`Branch: ${tenants.find((tenant) => String(tenant.id) === String(data.tenant_id))?.name || '-'}`} />
                            {!isJournalVoucher ? <Chip label={`${paymentLabel}: ${effectivePaymentAccount?.name || '-'}`} /> : null}
                            <Chip label={`Amount: ${formatAmount(isSmartPaymentVoucher ? smartRowsTotal : (data.amount || 0))}`} />
                        </Stack>
                        {(serverPreview?.allocation_rows?.length > 0 || serverPreview?.allocation || selectedInvoice) ? (
                            <Alert severity="info">
                                {serverPreview?.allocation_rows?.length > 0
                                    ? `Invoice allocations: ${serverPreview.allocation_rows.length} row(s) selected.`
                                    : (
                                        <>
                                            Remaining {(serverPreview?.allocation?.invoice_type || selectedInvoice?.invoice_type) === 'vendor_bill' ? 'Payable' : 'Receivable'}:{' '}
                                            {formatAmount(serverPreview?.allocation?.original_outstanding ?? selectedInvoice?.outstanding ?? 0)}
                                            {serverPreview?.allocation ? ` · Allocating ${formatAmount(serverPreview.allocation.allocated_now)} · After post ${formatAmount(serverPreview.allocation.remaining_after)}` : ''}
                                        </>
                                    )}
                            </Alert>
                        ) : null}
                        <Alert severity={isManualEntry ? (difference < 0.0001 ? 'success' : 'error') : 'info'}>
                            {isManualEntry
                                ? `Debit ${formatAmount(totals.debit)} | Credit ${formatAmount(totals.credit)} | Difference ${formatAmount(difference)}`
                                : `Posting Summary | Total ${formatAmount(Math.max(totals.debit, totals.credit))} | Auto-generated from smart rows`}
                        </Alert>
                        <AdminDataTable
                            columns={isManualEntry
                                ? [
                                    { key: 'account', label: 'Account', minWidth: 300 },
                                    { key: 'description', label: 'Narration', minWidth: 260 },
                                    { key: 'debit', label: 'Debit', minWidth: 120, align: 'right' },
                                    { key: 'credit', label: 'Credit', minWidth: 120, align: 'right' },
                                ]
                                : [
                                    { key: 'effect', label: 'Posting Side', minWidth: 160 },
                                    { key: 'account', label: 'Account', minWidth: 320 },
                                    { key: 'description', label: 'Narration', minWidth: 260 },
                                    { key: 'amount', label: 'Amount', minWidth: 140, align: 'right' },
                                ]}
                            rows={previewLines}
                            pagination={null}
                            emptyMessage="No lines."
                            tableMinWidth={920}
                            renderRow={(line, index) => (
                                <TableRow key={`preview-${index}`}>
                                    {isManualEntry ? (
                                        <>
                                            <TableCell>{line.account_label}</TableCell>
                                            <TableCell>{line.description || '-'}</TableCell>
                                            <TableCell align="right">{formatAmount(line.debit)}</TableCell>
                                            <TableCell align="right">{formatAmount(line.credit)}</TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell>{Number(line.debit || 0) > 0 ? 'Counterparty' : 'Payment Account'}</TableCell>
                                            <TableCell>{line.account_label}</TableCell>
                                            <TableCell>{line.description || '-'}</TableCell>
                                            <TableCell align="right">{formatAmount(Math.max(Number(line.debit || 0), Number(line.credit || 0)))}</TableCell>
                                        </>
                                    )}
                                </TableRow>
                            )}
                        />
                    </Stack>
                </DialogContent>
            </Dialog>

            <ConfirmActionDialog
                open={confirmState.open}
                title={confirmState.intent === 'post'
                    ? 'Post voucher?'
                    : confirmState.intent === 'submit'
                        ? 'Submit voucher for approval?'
                        : 'Cancel voucher?'}
                message={confirmState.intent === 'post'
                    ? 'This will lock the voucher and create financial impact in the general ledger.'
                    : confirmState.intent === 'submit'
                        ? 'This will move the voucher to submitted status and send it into the approval workflow. No general ledger posting will happen yet.'
                        : 'This will move the voucher to cancelled status and prevent reuse.'}
                confirmLabel={confirmState.intent === 'post'
                    ? 'Post Voucher'
                    : confirmState.intent === 'submit'
                        ? 'Submit for Approval'
                        : 'Cancel Voucher'}
                severity={confirmState.intent === 'post' ? 'critical' : confirmState.intent === 'submit' ? 'warning' : 'danger'}
                loading={processing}
                onClose={() => setConfirmState({ open: false, intent: 'draft' })}
                onConfirm={() => {
                    if (confirmState.intent === 'post') {
                        submitForm('post');
                        return;
                    }
                    if (confirmState.intent === 'submit') {
                        submitForm('submit');
                        return;
                    }
                    post(route('accounting.vouchers.cancel', voucher.id));
                }}
            />
        </AppPage>
    );
}

function buildPreviewLines({ data, accounts, selectedPaymentCoa, selectedInvoice, expenseAccounts, selectedVendor, isManualEntry, lines }) {
    if (isManualEntry) {
        const userLines = (lines || [])
            .filter((line) => line.account_id || Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0 || line.description)
            .map((line) => {
                const account = accounts.find((item) => String(item.id) === String(line.account_id));
                return {
                    ...line,
                    debit: Number(line.debit || 0),
                    credit: Number(line.credit || 0),
                    account_label: account ? `${account.full_code} - ${account.name}` : (line.account_id ? `Account #${line.account_id}` : '-'),
                };
            });

        if (data.voucher_type === 'JV' || data.entry_mode === 'manual') {
            return userLines;
        }

        const amount = userLines.reduce((sum, line) => sum + Number(['CPV', 'BPV'].includes(data.voucher_type) ? line.debit : line.credit), 0);
        if (!selectedPaymentCoa || amount <= 0) return userLines;
        return [
            ...userLines,
            {
                account_label: `${selectedPaymentCoa.full_code} - ${selectedPaymentCoa.name}`,
                debit: ['CRV', 'BRV'].includes(data.voucher_type) ? amount : 0,
                credit: ['CPV', 'BPV'].includes(data.voucher_type) ? amount : 0,
                description: 'System cash/bank line',
            },
        ];
    }

    if (['CPV', 'BPV'].includes(data.voucher_type) && Array.isArray(data.payment_rows) && data.payment_rows.length > 0) {
        const paymentRows = data.payment_rows
            .filter((row) => Number(row?.amount || 0) > 0)
            .map((row, index) => {
                const resolvedCounterpartyLabel = row.counterparty_account_id
                    ? accountLabel(accounts, row.counterparty_account_id)
                    : (row.payment_mode === 'against_invoice'
                        ? `${selectedVendor?.name || 'Vendor'} payable account`
                        : `${selectedVendor?.name || 'Vendor'} advance account`);

                return {
                    account_label: data.payment_for === 'expense'
                        ? accountLabel(expenseAccounts || accounts, row.expense_account_id)
                        : resolvedCounterpartyLabel,
                    debit: Number(row.amount || 0),
                    credit: 0,
                    description: row.remarks || `Payment row ${index + 1}`,
                };
            });

        const total = paymentRows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
        if (!selectedPaymentCoa || total <= 0) {
            return paymentRows;
        }

        return [
            ...paymentRows,
            {
                account_label: `${selectedPaymentCoa.full_code} - ${selectedPaymentCoa.name}`,
                debit: 0,
                credit: total,
                description: 'Cash/Bank line',
            },
        ];
    }

    const amount = Number(data.amount || selectedInvoice?.outstanding || 0);
    const counterpartyLabel = selectedInvoice?.number ? `Mapped account for ${selectedInvoice.number}` : 'Mapped counterparty account';
    const bankLabel = selectedPaymentCoa ? `${selectedPaymentCoa.full_code} - ${selectedPaymentCoa.name}` : 'Mapped cash/bank account';
    const isPayment = ['CPV', 'BPV'].includes(data.voucher_type);
    if (amount <= 0) return [];

    return [
        {
            account_label: counterpartyLabel,
            debit: isPayment ? amount : 0,
            credit: isPayment ? 0 : amount,
            description: 'Counterparty line',
        },
        {
            account_label: bankLabel,
            debit: isPayment ? 0 : amount,
            credit: isPayment ? amount : 0,
            description: 'Cash/Bank line',
        },
    ];
}

function accountLabel(accounts, accountId) {
    const account = accounts.find((item) => String(item.id) === String(accountId));
    if (!account) {
        return accountId ? `Account #${accountId}` : '-';
    }

    return `${account.full_code} - ${account.name}`;
}

function buildWarnings({ data, selectedInvoice, difference, baseCurrency, selectedPaymentAccount, isManualEntry, isReceiptVoucher, mappingReadiness }) {
    const warnings = [];
    if (data.posting_date && data.voucher_date && data.posting_date < data.voucher_date) {
        warnings.push('Posting date is earlier than voucher date.');
    }
    if (data.voucher_type !== 'JV' && !selectedPaymentAccount) {
        warnings.push('A valid cash/bank account is required for this voucher type.');
    }
    if (String(data.currency_code || '').toUpperCase() !== String(baseCurrency).toUpperCase() && !data.exchange_rate) {
        warnings.push('Foreign currency voucher requires exchange rate.');
    }
    if (selectedInvoice && Number(data.amount || 0) > Number(selectedInvoice.outstanding || 0)) {
        warnings.push('Entered amount exceeds selected invoice outstanding.');
    }
    if (isReceiptVoucher && data.party_type !== 'none' && data.party_id && !mappingReadiness?.default_receivable_ready) {
        warnings.push('Default receivable account is not configured in Voucher Mappings. Unmapped customers or members will be blocked until finance sets it.');
    }
    if (isManualEntry && difference > 0.0001) {
        warnings.push('Voucher is currently unbalanced.');
    }
    return Array.from(new Set(warnings));
}
