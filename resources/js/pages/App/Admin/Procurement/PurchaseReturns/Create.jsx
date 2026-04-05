import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Add, DeleteOutline } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import useMutationAction from '@/hooks/useMutationAction';
import { formatAmount } from '@/lib/formatting';

export default function Create({ goodsReceipts = [] }) {
    const mutation = useMutationAction();
    const [source, setSource] = React.useState(null);
    const [loadingSource, setLoadingSource] = React.useState(false);
    const [sourceError, setSourceError] = React.useState('');

    const { data, setData, post, processing, errors } = useForm({
        source_type: 'grn',
        source_id: '',
        vendor_bill_id: '',
        return_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        items: [],
    });

    const fetchGrnSource = async (goodsReceiptId) => {
        if (!goodsReceiptId) {
            setSource(null);
            setSourceError('');
            setData((prev) => ({ ...prev, source_id: '', vendor_bill_id: '', items: [] }));
            return;
        }

        setLoadingSource(true);
        setSourceError('');
        try {
            const response = await fetch(route('procurement.purchase-returns.source.grn', goodsReceiptId), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.message || 'Failed to load GRN source details.');
            }

            setSource(payload);
            setData((prev) => ({
                ...prev,
                source_type: 'grn',
                source_id: String(goodsReceiptId),
                vendor_bill_id: '',
                items: (payload.lines || [])
                    .filter((line) => Number(line.returnable_qty || 0) > 0)
                    .map((line) => ({
                        inventory_item_id: line.inventory_item_id,
                        qty_returned: '',
                        unit_cost: Number(line.default_unit_cost || 0),
                        max_qty: Number(line.returnable_qty || 0),
                        item_name: line.item_name,
                        sku: line.sku,
                        received_qty: Number(line.received_qty || 0),
                        already_returned_qty: Number(line.already_returned_qty || 0),
                    })),
            }));
        } catch (error) {
            setSource(null);
            setSourceError(error?.message || 'Failed to load GRN source details.');
            setData((prev) => ({ ...prev, source_id: String(goodsReceiptId), vendor_bill_id: '', items: [] }));
        } finally {
            setLoadingSource(false);
        }
    };

    const updateItem = (index, field, value) => {
        const next = [...data.items];
        const item = { ...next[index] };
        if (field === 'qty_returned') {
            const maxQty = Number(item.max_qty || 0);
            const numericValue = value === '' ? '' : Number(value);
            if (numericValue === '') {
                item.qty_returned = '';
            } else {
                item.qty_returned = Math.max(0, Math.min(maxQty, numericValue));
            }
        } else if (field === 'unit_cost') {
            const numericValue = value === '' ? '' : Number(value);
            item.unit_cost = numericValue === '' ? '' : Math.max(0, numericValue);
        }
        next[index] = item;
        setData('items', next);
    };

    const selectedBill = React.useMemo(
        () => (source?.vendor_bills || []).find((bill) => String(bill.id) === String(data.vendor_bill_id)),
        [data.vendor_bill_id, source?.vendor_bills],
    );

    const total = React.useMemo(
        () => data.items.reduce((sum, item) => sum + Number(item.qty_returned || 0) * Number(item.unit_cost || 0), 0),
        [data.items],
    );

    const creditPreview = React.useMemo(() => {
        if (!selectedBill) {
            return {
                appliedToBill: 0,
                unappliedCredit: total,
                warning: '',
            };
        }

        const billOutstanding = Number(selectedBill.outstanding || 0);
        const appliedToBill = Math.min(total, billOutstanding);
        const unappliedCredit = Math.max(0, total - appliedToBill);

        return {
            appliedToBill,
            unappliedCredit,
            warning: total > billOutstanding ? 'Return total exceeds selected bill outstanding. Adjust quantity or remove bill link.' : '',
        };
    }, [selectedBill, total]);

    const createReturn = (event) => {
        event.preventDefault();
        if (!data.source_id) {
            setSourceError('Please select a GRN source first.');
            return;
        }

        const payloadItems = data.items
            .filter((item) => Number(item.qty_returned || 0) > 0)
            .map((item) => ({
                inventory_item_id: item.inventory_item_id,
                qty_returned: Number(item.qty_returned),
                unit_cost: Number(item.unit_cost || 0),
            }));

        if (payloadItems.length === 0) {
            setSourceError('Enter at least one return quantity greater than zero.');
            return;
        }

        mutation.runAction({
            key: 'purchase-return-create',
            requireConfirm: true,
            confirmConfig: {
                title: 'Create Purchase Return',
                message: 'Create this purchase return from selected GRN source?',
                confirmLabel: 'Create',
                severity: 'warning',
            },
            successMessage: 'Purchase return created.',
            errorMessage: 'Failed to create purchase return.',
            action: ({ onSuccess, onError, onFinish }) => {
                post(route('procurement.purchase-returns.store'), {
                    data: {
                        ...data,
                        items: payloadItems,
                    },
                    onSuccess,
                    onError,
                    onFinish,
                });
            },
        });
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title="Create Purchase Return"
            subtitle="Select accepted GRN, verify auto-filled context, and return only eligible quantities."
            actions={[
                <Button key="back" component={Link} href={route('procurement.purchase-returns.index')} variant="outlined">
                    Back to Purchase Returns
                </Button>,
            ]}
        >
            <form onSubmit={createReturn}>
                <Stack spacing={2.25}>
                    {(sourceError || errors.source_id || errors.vendor_bill_id) ? (
                        <Alert severity="error">
                            {sourceError || errors.source_id || errors.vendor_bill_id}
                        </Alert>
                    ) : null}

                    <SurfaceCard title="Source Selection">
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    size="small"
                                    label="Source GRN"
                                    value={data.source_id}
                                    onChange={(event) => fetchGrnSource(event.target.value)}
                                    error={!!errors.source_id}
                                    helperText={errors.source_id || 'Only accepted GRNs are eligible.'}
                                    fullWidth
                                >
                                    <MenuItem value="">Select GRN</MenuItem>
                                    {goodsReceipts.map((receipt) => (
                                        <MenuItem key={receipt.id} value={receipt.id}>
                                            {receipt.grn_no} {receipt.vendor?.name ? `- ${receipt.vendor.name}` : ''}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    size="small"
                                    label="Return Date"
                                    type="date"
                                    value={data.return_date}
                                    onChange={(event) => setData('return_date', event.target.value)}
                                    error={!!errors.return_date}
                                    helperText={errors.return_date}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    size="small"
                                    label="Apply Against Vendor Bill (Optional)"
                                    value={data.vendor_bill_id}
                                    onChange={(event) => setData('vendor_bill_id', event.target.value)}
                                    disabled={!source}
                                    error={!!errors.vendor_bill_id}
                                    helperText={errors.vendor_bill_id || 'If selected, return amount is applied to bill outstanding.'}
                                    fullWidth
                                >
                                    <MenuItem value="">Unapplied Supplier Credit</MenuItem>
                                    {(source?.vendor_bills || []).map((bill) => (
                                        <MenuItem key={bill.id} value={bill.id}>
                                            {bill.bill_no} - Outstanding {formatAmount(bill.outstanding)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField size="small" label="Vendor" value={source?.vendor?.name || '-'} InputProps={{ readOnly: true }} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField size="small" label="Restaurant" value={source?.tenant?.name || 'Shared'} InputProps={{ readOnly: true }} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField size="small" label="Warehouse" value={source?.warehouse?.name || '-'} InputProps={{ readOnly: true }} fullWidth />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField size="small" label="Location" value={source?.warehouse_location?.name || '-'} InputProps={{ readOnly: true }} fullWidth />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    size="small"
                                    label="Remarks"
                                    value={data.remarks}
                                    onChange={(event) => setData('remarks', event.target.value)}
                                    error={!!errors.remarks}
                                    helperText={errors.remarks}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </SurfaceCard>

                    <SurfaceCard
                        title="Return Items"
                        subtitle={source ? `Source: ${source.grn?.grn_no || '-'} | Total: ${formatAmount(total)}` : 'Select GRN to load returnable items.'}
                    >
                        {loadingSource ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress size={26} />
                            </Box>
                        ) : null}
                        {!loadingSource && source && data.items.length === 0 ? (
                            <Alert severity="info">No returnable quantity is available for this GRN.</Alert>
                        ) : null}
                        <Stack spacing={1.5}>
                            {data.items.map((item, index) => (
                                <Box key={`${item.inventory_item_id}-${index}`} sx={{ border: '1px solid rgba(226,232,240,0.95)', borderRadius: '14px', p: 1.5 }}>
                                    <Grid container spacing={1.5} alignItems="flex-start">
                                        <Grid item xs={12} md={3.5}>
                                            <TextField
                                                size="small"
                                                label="Inventory Item"
                                                value={`${item.item_name}${item.sku ? ` (${item.sku})` : ''}`}
                                                InputProps={{ readOnly: true }}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField size="small" label="Received Qty" value={item.received_qty} InputProps={{ readOnly: true }} fullWidth />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField size="small" label="Already Returned" value={item.already_returned_qty} InputProps={{ readOnly: true }} fullWidth />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <TextField size="small" label="Max Returnable" value={item.max_qty} InputProps={{ readOnly: true }} fullWidth />
                                        </Grid>
                                        <Grid item xs={12} md={1.5}>
                                            <TextField
                                                size="small"
                                                label="Qty Returned"
                                                type="number"
                                                inputProps={{ min: 0, max: item.max_qty, step: '0.001' }}
                                                value={item.qty_returned}
                                                onChange={(event) => updateItem(index, 'qty_returned', event.target.value)}
                                                error={!!errors[`items.${index}.qty_returned`]}
                                                helperText={errors[`items.${index}.qty_returned`]}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={1.5}>
                                            <TextField
                                                size="small"
                                                label="Unit Cost"
                                                type="number"
                                                inputProps={{ min: 0, step: '0.0001' }}
                                                value={item.unit_cost}
                                                onChange={(event) => updateItem(index, 'unit_cost', event.target.value)}
                                                error={!!errors[`items.${index}.unit_cost`]}
                                                helperText={errors[`items.${index}.unit_cost`]}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={1.5}>
                                            <Typography variant="caption" color="text.secondary">
                                                Line Total
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.6, fontWeight: 700 }}>
                                                {formatAmount(Number(item.qty_returned || 0) * Number(item.unit_cost || 0))}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={0.5} sx={{ textAlign: 'right' }}>
                                            <IconButton onClick={() => updateItem(index, 'qty_returned', '')} title="Clear quantity">
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Stack>
                    </SurfaceCard>

                    <SurfaceCard title="Supplier Credit Preview">
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Return Total</Typography>
                                <Typography variant="h6">{formatAmount(total)}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Applied To Selected Bill</Typography>
                                <Typography variant="h6">{formatAmount(creditPreview.appliedToBill)}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">Unapplied Supplier Credit</Typography>
                                <Typography variant="h6">{formatAmount(creditPreview.unappliedCredit)}</Typography>
                            </Grid>
                            {creditPreview.warning ? (
                                <Grid item xs={12}>
                                    <Alert severity="warning">{creditPreview.warning}</Alert>
                                </Grid>
                            ) : null}
                        </Grid>
                    </SurfaceCard>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button component={Link} href={route('procurement.purchase-returns.index')} variant="outlined">
                            Cancel
                        </Button>
                        <AppLoadingButton
                            type="submit"
                            variant="contained"
                            loading={processing || mutation.isPending('purchase-return-create')}
                            loadingLabel="Creating..."
                            startIcon={<Add />}
                        >
                            Create Purchase Return
                        </AppLoadingButton>
                    </Box>
                </Stack>
            </form>
            <ConfirmActionDialog {...mutation.confirmDialogProps} />
        </AppPage>
    );
}
