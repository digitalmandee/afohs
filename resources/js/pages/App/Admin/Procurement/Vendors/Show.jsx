import React from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Drawer,
    Grid,
    IconButton,
    MenuItem,
    Pagination,
    Stack,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import AddOutlined from '@mui/icons-material/AddOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import AppPage from '@/components/App/ui/AppPage';
import StatCard from '@/components/App/ui/StatCard';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import AppLoadingButton from '@/components/App/ui/AppLoadingButton';
import ConfirmActionDialog from '@/components/App/ui/ConfirmActionDialog';
import { formatAmount } from '@/lib/formatting';
import { useSnackbar } from 'notistack';

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'bills', label: 'Bills' },
    { key: 'payments', label: 'Payments' },
    { key: 'returns', label: 'Returns' },
    { key: 'advances', label: 'Advances' },
    { key: 'ledger', label: 'Ledger' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'bank_accounts', label: 'Bank Accounts' },
    { key: 'item_mappings', label: 'Item Mappings' },
];

function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB');
}

function normalizeImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    return path.startsWith('/') ? path : `/${path}`;
}

function vendorInitials(name) {
    const value = String(name || '').trim();
    if (!value) return 'VN';
    const parts = value.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'VN';
}

function Pager({ pagination, pageParam, activeTab, perPage, vendorId }) {
    if (!pagination?.last_page || pagination.last_page <= 1) {
        return null;
    }

    return (
        <Stack direction="row" justifyContent="flex-end" sx={{ pt: 1 }}>
            <Pagination
                color="primary"
                size="small"
                page={pagination.current_page || 1}
                count={pagination.last_page || 1}
                onChange={(_, page) => {
                    router.get(
                        route('procurement.vendors.show', vendorId),
                        { tab: activeTab, per_page: perPage, [pageParam]: page },
                        { preserveState: true, preserveScroll: true, replace: true },
                    );
                }}
            />
        </Stack>
    );
}

function SimpleTable({ columns, rows, emptyText = 'No records found.' }) {
    return (
        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#0a3d62' }}>
                        {columns.map((column) => (
                            <TableCell key={column.key} sx={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {column.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length}>
                                <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
                            </TableCell>
                        </TableRow>
                    ) : rows}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

const emptyContact = { id: null, name: '', email: '', phone: '', title: '', is_primary: false };
const emptyBank = { id: null, bank_name: '', account_name: '', account_number: '', iban: '', swift_code: '', is_primary: false };
const emptyMapping = {
    id: null,
    inventory_item_id: '',
    tenant_id: '',
    is_preferred: false,
    is_active: true,
    contract_price: '',
    last_purchase_price: '',
    lead_time_days: '',
    minimum_order_qty: '',
    currency: 'PKR',
};

export default function Show({
    vendor,
    profileImage = null,
    summary = {},
    activeTab = 'overview',
    perPage = 10,
    bills,
    payments,
    returns,
    advances,
    ledgerEntries,
    lookup = {},
    canEdit = true,
}) {
    const { enqueueSnackbar } = useSnackbar();
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [drawerSection, setDrawerSection] = React.useState('master');
    const [confirmMasterSave, setConfirmMasterSave] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(null);
    const [formErrors, setFormErrors] = React.useState({});
    const [imagePreview, setImagePreview] = React.useState(normalizeImageUrl(profileImage?.url));
    const [uploadingImage, setUploadingImage] = React.useState(false);
    const [removingImage, setRemovingImage] = React.useState(false);
    const imageInputRef = React.useRef(null);
    const [processing, setProcessing] = React.useState({
        contact: false,
        bank: false,
        mapping: false,
        delete: false,
    });

    const [contactForm, setContactForm] = React.useState(emptyContact);
    const [bankForm, setBankForm] = React.useState(emptyBank);
    const [mappingForm, setMappingForm] = React.useState(emptyMapping);

    const openDrawer = (section = 'master') => {
        setDrawerSection(section);
        setDrawerOpen(true);
    };

    const form = useForm({
        code: vendor?.code || '',
        name: vendor?.name || '',
        tax_id: vendor?.tax_id || '',
        phone: vendor?.phone || '',
        email: vendor?.email || '',
        address: vendor?.address || '',
        tenant_id: vendor?.tenant_id || '',
        payment_terms_days: vendor?.payment_terms_days ?? 0,
        currency: vendor?.currency || 'PKR',
        opening_balance: vendor?.opening_balance ?? 0,
        payable_account_id: vendor?.payable_account_id || '',
        advance_account_id: vendor?.advance_account_id || '',
        default_payment_account_id: vendor?.default_payment_account_id || '',
        approval_status: vendor?.approval_status || 'approved',
        status: vendor?.status || 'active',
    });

    React.useEffect(() => {
        form.setData({
            code: vendor?.code || '',
            name: vendor?.name || '',
            tax_id: vendor?.tax_id || '',
            phone: vendor?.phone || '',
            email: vendor?.email || '',
            address: vendor?.address || '',
            tenant_id: vendor?.tenant_id || '',
            payment_terms_days: vendor?.payment_terms_days ?? 0,
            currency: vendor?.currency || 'PKR',
            opening_balance: vendor?.opening_balance ?? 0,
            payable_account_id: vendor?.payable_account_id || '',
            advance_account_id: vendor?.advance_account_id || '',
            default_payment_account_id: vendor?.default_payment_account_id || '',
            approval_status: vendor?.approval_status || 'approved',
            status: vendor?.status || 'active',
        });
    }, [vendor]);

    React.useEffect(() => {
        setImagePreview(normalizeImageUrl(profileImage?.url));
    }, [profileImage]);

    const stats = [
        { key: 'ap', label: 'AP Outstanding', value: formatAmount(summary.ap_outstanding), tone: 'light' },
        { key: 'advance', label: 'Advance Credit', value: formatAmount(summary.advance_credit), tone: 'light' },
        { key: 'return', label: 'Return Credit', value: formatAmount(summary.purchase_return_credit), tone: 'light' },
        { key: 'net', label: 'Net Payable', value: formatAmount(summary.net_payable), tone: 'dark' },
    ];
    const renderTabAction = () => {
        if (!canEdit) return null;
        if (activeTab === 'contacts') {
            return (
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddOutlined />}
                    onClick={() => {
                        setContactForm(emptyContact);
                        openDrawer('contacts');
                    }}
                >
                    Add Contact
                </Button>
            );
        }
        if (activeTab === 'bank_accounts') {
            return (
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddOutlined />}
                    onClick={() => {
                        setBankForm(emptyBank);
                        openDrawer('bank');
                    }}
                >
                    Add Bank Account
                </Button>
            );
        }
        if (activeTab === 'item_mappings') {
            return (
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddOutlined />}
                    onClick={() => {
                        setMappingForm(emptyMapping);
                        openDrawer('mappings');
                    }}
                >
                    Add Item Mapping
                </Button>
            );
        }

        return (
            <Button variant="contained" size="small" startIcon={<EditOutlined />} onClick={() => openDrawer('master')}>
                Edit Vendor
            </Button>
        );
    };

    const refreshProfile = (tab = activeTab) => {
        router.get(route('procurement.vendors.show', vendor.id), { tab, per_page: perPage }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const saveMaster = () => {
        form.put(route('procurement.vendors.update', vendor.id), {
            preserveScroll: true,
            onSuccess: () => {
                enqueueSnackbar('Vendor profile updated.', { variant: 'success' });
                setDrawerOpen(false);
                setConfirmMasterSave(false);
                setFormErrors({});
                refreshProfile('overview');
            },
            onError: (errors) => {
                setFormErrors(errors || {});
                enqueueSnackbar('Please resolve highlighted errors.', { variant: 'error' });
            },
        });
    };

    const submitNested = ({ key, routeName, method, payload, onSuccess }) => {
        setProcessing((prev) => ({ ...prev, [key]: true }));
        setFormErrors({});

        router[method](routeName, payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                onSuccess?.();
                enqueueSnackbar('Saved successfully.', { variant: 'success' });
                refreshProfile(activeTab);
            },
            onError: (errors) => {
                setFormErrors(errors || {});
                enqueueSnackbar('Failed to save. Please check fields.', { variant: 'error' });
            },
            onFinish: () => {
                setProcessing((prev) => ({ ...prev, [key]: false }));
            },
        });
    };

    const saveContact = () => {
        const method = contactForm.id ? 'put' : 'post';
        const routeName = contactForm.id
            ? route('procurement.vendors.contacts.update', { vendor: vendor.id, contact: contactForm.id })
            : route('procurement.vendors.contacts.store', vendor.id);
        submitNested({
            key: 'contact',
            method,
            routeName,
            payload: {
                name: contactForm.name,
                email: contactForm.email || null,
                phone: contactForm.phone || null,
                title: contactForm.title || null,
                is_primary: !!contactForm.is_primary,
            },
            onSuccess: () => setContactForm(emptyContact),
        });
    };

    const saveBank = () => {
        const method = bankForm.id ? 'put' : 'post';
        const routeName = bankForm.id
            ? route('procurement.vendors.bank-accounts.update', { vendor: vendor.id, bankAccount: bankForm.id })
            : route('procurement.vendors.bank-accounts.store', vendor.id);
        submitNested({
            key: 'bank',
            method,
            routeName,
            payload: {
                bank_name: bankForm.bank_name,
                account_name: bankForm.account_name || null,
                account_number: bankForm.account_number || null,
                iban: bankForm.iban || null,
                swift_code: bankForm.swift_code || null,
                is_primary: !!bankForm.is_primary,
            },
            onSuccess: () => setBankForm(emptyBank),
        });
    };

    const saveMapping = () => {
        const method = mappingForm.id ? 'put' : 'post';
        const routeName = mappingForm.id
            ? route('procurement.vendors.item-mappings.update', { vendor: vendor.id, itemMapping: mappingForm.id })
            : route('procurement.vendors.item-mappings.store', vendor.id);
        submitNested({
            key: 'mapping',
            method,
            routeName,
            payload: {
                inventory_item_id: mappingForm.inventory_item_id,
                tenant_id: mappingForm.tenant_id || null,
                is_preferred: !!mappingForm.is_preferred,
                is_active: !!mappingForm.is_active,
                contract_price: mappingForm.contract_price || null,
                last_purchase_price: mappingForm.last_purchase_price || null,
                lead_time_days: mappingForm.lead_time_days || null,
                minimum_order_qty: mappingForm.minimum_order_qty || null,
                currency: mappingForm.currency || 'PKR',
            },
            onSuccess: () => setMappingForm(emptyMapping),
        });
    };

    const runDelete = () => {
        if (!confirmDelete) return;
        setProcessing((prev) => ({ ...prev, delete: true }));
        router.delete(confirmDelete.routeName, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                enqueueSnackbar('Deleted successfully.', { variant: 'success' });
                setConfirmDelete(null);
                refreshProfile(activeTab);
            },
            onError: () => enqueueSnackbar('Delete failed.', { variant: 'error' }),
            onFinish: () => setProcessing((prev) => ({ ...prev, delete: false })),
        });
    };

    const handleSelectImage = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_image', file);
        setUploadingImage(true);

        router.post(route('procurement.vendors.profile-image.upload', vendor.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                enqueueSnackbar('Profile image updated.', { variant: 'success' });
                refreshProfile(activeTab);
            },
            onError: (errors) => {
                const message = Object.values(errors || {}).flat()[0] || 'Failed to upload image.';
                enqueueSnackbar(message, { variant: 'error' });
            },
            onFinish: () => {
                setUploadingImage(false);
                if (imageInputRef.current) {
                    imageInputRef.current.value = '';
                }
            },
        });
    };

    const handleRemoveImage = () => {
        setRemovingImage(true);
        router.delete(route('procurement.vendors.profile-image.remove', vendor.id), {
            preserveScroll: true,
            onSuccess: () => {
                enqueueSnackbar('Profile image removed.', { variant: 'success' });
                refreshProfile(activeTab);
            },
            onError: () => enqueueSnackbar('Unable to remove profile image.', { variant: 'error' }),
            onFinish: () => setRemovingImage(false),
        });
    };

    return (
        <AppPage
            eyebrow="Procurement"
            title={`Vendor Profile · ${vendor?.name || '-'}`}
            subtitle="Complete vendor financial history and source-document traceability."
            actions={[
                <Button
                    key="back"
                    variant="outlined"
                    startIcon={<ArrowBackRounded />}
                    onClick={() => router.get(route('procurement.vendors.index'))}
                >
                    Back to Vendors
                </Button>,
            ]}
        >
            <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={handleSelectImage}
            />
            <SurfaceCard contentSx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} md={7}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={imagePreview || undefined}
                                    sx={{
                                        width: 86,
                                        height: 86,
                                        fontSize: 30,
                                        fontWeight: 700,
                                        bgcolor: imagePreview ? 'transparent' : '#0a3d62',
                                        color: '#fff',
                                        border: '2px solid #dbe4f0',
                                    }}
                                >
                                    {vendorInitials(vendor?.name)}
                                </Avatar>
                                {canEdit ? (
                                    <Tooltip title="Update profile image">
                                        <IconButton
                                            size="small"
                                            onClick={() => imageInputRef.current?.click()}
                                            sx={{
                                                position: 'absolute',
                                                right: -6,
                                                bottom: -6,
                                                bgcolor: '#0a3d62',
                                                color: '#fff',
                                                '&:hover': { bgcolor: '#0b4f7f' },
                                            }}
                                        >
                                            <PhotoCameraOutlined fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                ) : null}
                            </Box>

                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{vendor?.name || '-'}</Typography>
                                <Typography variant="body2" color="text.secondary">Code: {vendor?.code || '-'}</Typography>
                                <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 0.8, flexWrap: 'wrap' }}>
                                    <Chip size="small" label={`Status: ${vendor?.status || '-'}`} color={vendor?.status === 'active' ? 'success' : 'default'} />
                                    <Chip size="small" variant="outlined" label={`Approval: ${vendor?.approval_status || '-'}`} />
                                    <Chip size="small" variant="outlined" label={`Restaurant: ${vendor?.tenant?.name || 'Shared'}`} />
                                    <Chip size="small" variant="outlined" label={`Terms: ${vendor?.payment_terms_days ?? 0} days`} />
                                    <Chip size="small" variant="outlined" label={`Currency: ${vendor?.currency || '-'}`} />
                                </Stack>
                                {canEdit ? (
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        <AppLoadingButton
                                            size="small"
                                            variant="outlined"
                                            loading={uploadingImage}
                                            loadingLabel="Uploading..."
                                            startIcon={<PhotoCameraOutlined />}
                                            onClick={() => imageInputRef.current?.click()}
                                        >
                                            Upload Photo
                                        </AppLoadingButton>
                                        {imagePreview ? (
                                            <AppLoadingButton
                                                size="small"
                                                color="error"
                                                variant="text"
                                                loading={removingImage}
                                                loadingLabel="Removing..."
                                                onClick={handleRemoveImage}
                                            >
                                                Remove
                                            </AppLoadingButton>
                                        ) : null}
                                    </Stack>
                                ) : null}
                            </Box>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Grid container spacing={1}>
                            {stats.map((stat, index) => (
                                <Grid key={stat.key} item xs={12} sm={6}>
                                    <StatCard
                                        label={stat.label}
                                        value={stat.value}
                                        tone={stat.tone}
                                        compact
                                        minimal={index !== stats.length - 1}
                                        accent={index === stats.length - 1}
                                        white={index !== stats.length - 1}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                </Grid>
            </SurfaceCard>
            <Box
                sx={{
                    position: 'sticky',
                    top: 88,
                    zIndex: 2,
                    mb: 1,
                    py: 1,
                    borderTop: '1px solid #dbe4f0',
                    borderBottom: '1px solid #dbe4f0',
                    backgroundColor: '#f8fbff',
                }}
            >
                <Stack direction="row" justifyContent="flex-end" alignItems="center">
                    {renderTabAction()}
                </Stack>
            </Box>

            <SurfaceCard contentSx={{ p: 0 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, tab) => {
                        router.get(route('procurement.vendors.show', vendor.id), { tab, per_page: perPage }, {
                            preserveState: true,
                            preserveScroll: true,
                            replace: true,
                        });
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ px: 2, pt: 1 }}
                >
                    {TABS.map((tab) => (
                        <Tab key={tab.key} value={tab.key} label={tab.label} />
                    ))}
                </Tabs>
                <Divider />

                <Box sx={{ p: 2 }}>
                    {activeTab === 'overview' ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <SurfaceCard title="Identity" lowChrome contentSx={{ p: 1.5 }}>
                                    <Stack spacing={0.8}>
                                        <Typography variant="body2"><strong>Code:</strong> {vendor.code || '-'}</Typography>
                                        <Typography variant="body2"><strong>Name:</strong> {vendor.name || '-'}</Typography>
                                        <Typography variant="body2"><strong>Status:</strong> {vendor.status || '-'}</Typography>
                                        <Typography variant="body2"><strong>Approval:</strong> {vendor.approval_status || '-'}</Typography>
                                        <Typography variant="body2"><strong>Tax ID:</strong> {vendor.tax_id || '-'}</Typography>
                                        <Typography variant="body2"><strong>Restaurant:</strong> {vendor.tenant?.name || 'Shared'}</Typography>
                                        <Typography variant="body2"><strong>Terms:</strong> {vendor.payment_terms_days ?? 0} days</Typography>
                                        <Typography variant="body2"><strong>Currency:</strong> {vendor.currency || '-'}</Typography>
                                        <Typography variant="body2"><strong>Opening Balance:</strong> {formatAmount(vendor.opening_balance)}</Typography>
                                    </Stack>
                                </SurfaceCard>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <SurfaceCard title="Contact & Address" lowChrome contentSx={{ p: 1.5 }}>
                                    <Stack spacing={0.8}>
                                        <Typography variant="body2"><strong>Phone:</strong> {vendor.phone || '-'}</Typography>
                                        <Typography variant="body2"><strong>Email:</strong> {vendor.email || '-'}</Typography>
                                        <Typography variant="body2"><strong>Address:</strong> {vendor.address || '-'}</Typography>
                                    </Stack>
                                </SurfaceCard>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <SurfaceCard title="Finance Defaults & Audit" lowChrome contentSx={{ p: 1.5 }}>
                                    <Stack spacing={0.8}>
                                        <Typography variant="body2"><strong>Payable Account:</strong> {vendor.payable_account ? `${vendor.payable_account.full_code} · ${vendor.payable_account.name}` : '-'}</Typography>
                                        <Typography variant="body2"><strong>Advance Account:</strong> {vendor.advance_account ? `${vendor.advance_account.full_code} · ${vendor.advance_account.name}` : '-'}</Typography>
                                        <Typography variant="body2"><strong>Default Payment Account:</strong> {vendor.default_payment_account?.name || '-'}</Typography>
                                        <Typography variant="body2"><strong>Created:</strong> {formatDate(vendor.created_at)} {vendor.created_by?.name ? `· ${vendor.created_by.name}` : ''}</Typography>
                                        <Typography variant="body2"><strong>Updated:</strong> {formatDate(vendor.updated_at)} {vendor.updated_by?.name ? `· ${vendor.updated_by.name}` : ''}</Typography>
                                    </Stack>
                                </SurfaceCard>
                            </Grid>
                        </Grid>
                    ) : null}

                    {activeTab === 'contacts' ? (
                        <SimpleTable
                            columns={[
                                { key: 'name', label: 'Name' },
                                { key: 'title', label: 'Title' },
                                { key: 'email', label: 'Email' },
                                { key: 'phone', label: 'Phone' },
                                { key: 'primary', label: 'Primary' },
                                { key: 'actions', label: 'Actions' },
                            ]}
                            rows={(vendor.contacts || []).map((contact) => (
                                <TableRow key={contact.id} hover>
                                    <TableCell>{contact.name || '-'}</TableCell>
                                    <TableCell>{contact.title || '-'}</TableCell>
                                    <TableCell>{contact.email || '-'}</TableCell>
                                    <TableCell>{contact.phone || '-'}</TableCell>
                                    <TableCell>{contact.is_primary ? <Chip size="small" color="success" label="Yes" /> : '-'}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setContactForm({ ...emptyContact, ...contact });
                                                    openDrawer('contacts');
                                                }}
                                            >
                                                <EditOutlined fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setConfirmDelete({
                                                    routeName: route('procurement.vendors.contacts.destroy', { vendor: vendor.id, contact: contact.id }),
                                                    title: 'Delete contact?',
                                                    message: `This will remove ${contact.name || 'this contact'}.`,
                                                })}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        />
                    ) : null}

                    {activeTab === 'bank_accounts' ? (
                        <SimpleTable
                            columns={[
                                { key: 'bank', label: 'Bank' },
                                { key: 'account_name', label: 'Account Name' },
                                { key: 'account_number', label: 'Account Number' },
                                { key: 'iban', label: 'IBAN' },
                                { key: 'swift', label: 'SWIFT' },
                                { key: 'primary', label: 'Primary' },
                                { key: 'actions', label: 'Actions' },
                            ]}
                            rows={(vendor.bank_accounts || []).map((account) => (
                                <TableRow key={account.id} hover>
                                    <TableCell>{account.bank_name || '-'}</TableCell>
                                    <TableCell>{account.account_name || '-'}</TableCell>
                                    <TableCell>{account.account_number || '-'}</TableCell>
                                    <TableCell>{account.iban || '-'}</TableCell>
                                    <TableCell>{account.swift_code || '-'}</TableCell>
                                    <TableCell>{account.is_primary ? <Chip size="small" color="success" label="Yes" /> : '-'}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setBankForm({ ...emptyBank, ...account });
                                                    openDrawer('bank');
                                                }}
                                            >
                                                <EditOutlined fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setConfirmDelete({
                                                    routeName: route('procurement.vendors.bank-accounts.destroy', { vendor: vendor.id, bankAccount: account.id }),
                                                    title: 'Delete bank account?',
                                                    message: `This will remove ${account.bank_name || 'this bank account'}.`,
                                                })}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        />
                    ) : null}

                    {activeTab === 'item_mappings' ? (
                        <SimpleTable
                            columns={[
                                { key: 'item', label: 'Item' },
                                { key: 'restaurant', label: 'Restaurant' },
                                { key: 'contract', label: 'Contract Price' },
                                { key: 'last', label: 'Last Price' },
                                { key: 'lead', label: 'Lead Days' },
                                { key: 'moq', label: 'MOQ' },
                                { key: 'flags', label: 'Flags' },
                                { key: 'actions', label: 'Actions' },
                            ]}
                            rows={(vendor.item_mappings || []).map((mapping) => (
                                <TableRow key={mapping.id} hover>
                                    <TableCell>{mapping.inventory_item ? `${mapping.inventory_item.sku || '-'} · ${mapping.inventory_item.name || '-'}` : '-'}</TableCell>
                                    <TableCell>{mapping.tenant?.name || 'Shared'}</TableCell>
                                    <TableCell>{mapping.contract_price ? formatAmount(mapping.contract_price) : '-'}</TableCell>
                                    <TableCell>{mapping.last_purchase_price ? formatAmount(mapping.last_purchase_price) : '-'}</TableCell>
                                    <TableCell>{mapping.lead_time_days ?? '-'}</TableCell>
                                    <TableCell>{mapping.minimum_order_qty ?? '-'}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            {mapping.is_preferred ? <Chip size="small" color="success" label="Preferred" /> : null}
                                            <Chip size="small" color={mapping.is_active ? 'primary' : 'default'} label={mapping.is_active ? 'Active' : 'Inactive'} />
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setMappingForm({
                                                        ...emptyMapping,
                                                        ...mapping,
                                                        inventory_item_id: mapping.inventory_item_id || '',
                                                        tenant_id: mapping.tenant_id || '',
                                                    });
                                                    openDrawer('mappings');
                                                }}
                                            >
                                                <EditOutlined fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setConfirmDelete({
                                                    routeName: route('procurement.vendors.item-mappings.destroy', { vendor: vendor.id, itemMapping: mapping.id }),
                                                    title: 'Delete item mapping?',
                                                    message: 'This mapping will be removed from vendor profile.',
                                                })}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        />
                    ) : null}

                    {activeTab === 'bills' ? (
                        <>
                            <SimpleTable
                                columns={[
                                    { key: 'bill_no', label: 'Bill No' },
                                    { key: 'bill_date', label: 'Bill Date' },
                                    { key: 'due_date', label: 'Due Date' },
                                    { key: 'total', label: 'Grand Total' },
                                    { key: 'paid', label: 'Paid' },
                                    { key: 'outstanding', label: 'Outstanding' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'link', label: 'Source' },
                                ]}
                                rows={(bills?.data || []).map((bill) => {
                                    const outstanding = Math.max(0, Number(bill.grand_total || 0) - Number(bill.paid_amount || 0) - Number(bill.advance_applied_amount || 0) - Number(bill.return_applied_amount || 0));
                                    return (
                                        <TableRow key={bill.id} hover>
                                            <TableCell>{bill.bill_no || '-'}</TableCell>
                                            <TableCell>{formatDate(bill.bill_date)}</TableCell>
                                            <TableCell>{formatDate(bill.due_date)}</TableCell>
                                            <TableCell>{formatAmount(bill.grand_total)}</TableCell>
                                            <TableCell>{formatAmount(bill.paid_amount)}</TableCell>
                                            <TableCell>{formatAmount(outstanding)}</TableCell>
                                            <TableCell><Chip size="small" label={bill.status || '-'} /></TableCell>
                                            <TableCell>
                                                <Button size="small" endIcon={<OpenInNewOutlined fontSize="inherit" />} onClick={() => router.get(route('procurement.vendor-bills.index'), { vendor_id: vendor.id })}>
                                                    Open Bill
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            />
                            <Pager pagination={bills} pageParam="bills_page" activeTab={activeTab} perPage={perPage} vendorId={vendor.id} />
                        </>
                    ) : null}

                    {activeTab === 'payments' ? (
                        <>
                            <SimpleTable
                                columns={[
                                    { key: 'payment_no', label: 'Payment No' },
                                    { key: 'payment_date', label: 'Payment Date' },
                                    { key: 'method', label: 'Method' },
                                    { key: 'intent', label: 'Intent' },
                                    { key: 'account', label: 'Account' },
                                    { key: 'amount', label: 'Amount' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'link', label: 'Source' },
                                ]}
                                rows={(payments?.data || []).map((payment) => (
                                    <TableRow key={payment.id} hover>
                                        <TableCell>{payment.payment_no || payment.reference || '-'}</TableCell>
                                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                        <TableCell>{payment.method || '-'}</TableCell>
                                        <TableCell>{payment.payment_intent || '-'}</TableCell>
                                        <TableCell>{payment.payment_account?.name || '-'}</TableCell>
                                        <TableCell>{formatAmount(payment.amount)}</TableCell>
                                        <TableCell><Chip size="small" label={payment.status || '-'} /></TableCell>
                                        <TableCell>
                                            <Button size="small" endIcon={<OpenInNewOutlined fontSize="inherit" />} onClick={() => router.get(route('procurement.vendor-payments.index'), { vendor_id: vendor.id })}>
                                                Open Payment
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            />
                            <Pager pagination={payments} pageParam="payments_page" activeTab={activeTab} perPage={perPage} vendorId={vendor.id} />
                        </>
                    ) : null}

                    {activeTab === 'returns' ? (
                        <>
                            <SimpleTable
                                columns={[
                                    { key: 'return_no', label: 'Return No' },
                                    { key: 'return_date', label: 'Return Date' },
                                    { key: 'grn', label: 'GRN' },
                                    { key: 'bill', label: 'Bill' },
                                    { key: 'credit', label: 'Credit Amount' },
                                    { key: 'credit_status', label: 'Credit Status' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'link', label: 'Source' },
                                ]}
                                rows={(returns?.data || []).map((purchaseReturn) => (
                                    <TableRow key={purchaseReturn.id} hover>
                                        <TableCell>{purchaseReturn.return_no || '-'}</TableCell>
                                        <TableCell>{formatDate(purchaseReturn.return_date)}</TableCell>
                                        <TableCell>{purchaseReturn.goods_receipt?.grn_no || '-'}</TableCell>
                                        <TableCell>{purchaseReturn.vendor_bill?.bill_no || '-'}</TableCell>
                                        <TableCell>{formatAmount(purchaseReturn.vendor_credit_amount)}</TableCell>
                                        <TableCell><Chip size="small" label={purchaseReturn.credit_status || '-'} /></TableCell>
                                        <TableCell><Chip size="small" label={purchaseReturn.status || '-'} /></TableCell>
                                        <TableCell>
                                            <Button size="small" endIcon={<OpenInNewOutlined fontSize="inherit" />} onClick={() => router.get(route('procurement.purchase-returns.index'), { vendor_id: vendor.id })}>
                                                Open Return
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            />
                            <Pager pagination={returns} pageParam="returns_page" activeTab={activeTab} perPage={perPage} vendorId={vendor.id} />
                        </>
                    ) : null}

                    {activeTab === 'advances' ? (
                        <>
                            <SimpleTable
                                columns={[
                                    { key: 'advance_no', label: 'Advance No' },
                                    { key: 'advance_date', label: 'Advance Date' },
                                    { key: 'po', label: 'PO No' },
                                    { key: 'amount', label: 'Amount' },
                                    { key: 'applied', label: 'Applied' },
                                    { key: 'remaining', label: 'Remaining' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'link', label: 'Source' },
                                ]}
                                rows={(advances?.data || []).map((advance) => {
                                    const remaining = Math.max(0, Number(advance.amount || 0) - Number(advance.applied_amount || 0));
                                    return (
                                        <TableRow key={advance.id} hover>
                                            <TableCell>{advance.advance_no || '-'}</TableCell>
                                            <TableCell>{formatDate(advance.advance_date)}</TableCell>
                                            <TableCell>{advance.purchase_order?.po_no || '-'}</TableCell>
                                            <TableCell>{formatAmount(advance.amount)}</TableCell>
                                            <TableCell>{formatAmount(advance.applied_amount)}</TableCell>
                                            <TableCell>{formatAmount(remaining)}</TableCell>
                                            <TableCell><Chip size="small" label={advance.status || '-'} /></TableCell>
                                            <TableCell>
                                                <Button size="small" endIcon={<OpenInNewOutlined fontSize="inherit" />} onClick={() => router.get(route('procurement.supplier-advances.index'), { vendor_id: vendor.id })}>
                                                    Open Advance
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            />
                            <Pager pagination={advances} pageParam="advances_page" activeTab={activeTab} perPage={perPage} vendorId={vendor.id} />
                        </>
                    ) : null}

                    {activeTab === 'ledger' ? (
                        <>
                            <SimpleTable
                                columns={[
                                    { key: 'date', label: 'Date' },
                                    { key: 'type', label: 'Source' },
                                    { key: 'doc', label: 'Document No' },
                                    { key: 'debit', label: 'Debit' },
                                    { key: 'credit', label: 'Credit' },
                                    { key: 'running', label: 'Running Balance' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'link', label: 'Source' },
                                ]}
                                rows={(ledgerEntries?.data || []).map((entry, idx) => (
                                    <TableRow key={`${entry.type}-${entry.document_no}-${idx}`} hover>
                                        <TableCell>{formatDate(entry.date)}</TableCell>
                                        <TableCell>{String(entry.type || '-').replace(/_/g, ' ')}</TableCell>
                                        <TableCell>{entry.document_no || '-'}</TableCell>
                                        <TableCell>{formatAmount(entry.debit)}</TableCell>
                                        <TableCell>{formatAmount(entry.credit)}</TableCell>
                                        <TableCell>{formatAmount(entry.running_balance)}</TableCell>
                                        <TableCell><Chip size="small" label={entry.status || '-'} /></TableCell>
                                        <TableCell>
                                            {entry.link ? (
                                                <Button size="small" endIcon={<OpenInNewOutlined fontSize="inherit" />} onClick={() => router.get(entry.link)}>
                                                    Open Source
                                                </Button>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            />
                            <Pager pagination={ledgerEntries} pageParam="ledger_page" activeTab={activeTab} perPage={perPage} vendorId={vendor.id} />
                        </>
                    ) : null}
                </Box>
            </SurfaceCard>

            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', md: 620 } } }}>
                <Box sx={{ p: 2.2, borderBottom: '1px solid #e2e8f0' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {drawerSection === 'master' ? 'Edit Vendor Profile' : 'Manage Vendor Details'}
                        </Typography>
                        {drawerSection === 'master' ? (
                            <AppLoadingButton
                                variant="contained"
                                loading={form.processing}
                                loadingLabel="Saving..."
                                onClick={() => setConfirmMasterSave(true)}
                            >
                                Save Vendor
                            </AppLoadingButton>
                        ) : null}
                    </Stack>
                </Box>
                <Tabs
                    value={drawerSection}
                    onChange={(_, value) => setDrawerSection(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ px: 2, borderBottom: '1px solid #e2e8f0' }}
                >
                    <Tab value="master" label="Vendor Master" />
                    <Tab value="contacts" label="Contacts" />
                    <Tab value="bank" label="Bank Accounts" />
                    <Tab value="mappings" label="Item Mappings" />
                </Tabs>
                <Box sx={{ p: 2.2 }}>
                    {Object.keys(formErrors || {}).length > 0 ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Please resolve validation errors before saving.
                        </Alert>
                    ) : null}

                    {drawerSection === 'master' ? (
                    <>
                    <SurfaceCard title="Profile Image" lowChrome contentSx={{ p: 1.4, mb: 1.4 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                                src={imagePreview || undefined}
                                sx={{ width: 70, height: 70, bgcolor: imagePreview ? 'transparent' : '#0a3d62', fontWeight: 700 }}
                            >
                                {vendorInitials(vendor?.name)}
                            </Avatar>
                            <Stack direction="row" spacing={1}>
                                <AppLoadingButton
                                    size="small"
                                    variant="outlined"
                                    loading={uploadingImage}
                                    loadingLabel="Uploading..."
                                    startIcon={<PhotoCameraOutlined />}
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    Upload
                                </AppLoadingButton>
                                <AppLoadingButton
                                    size="small"
                                    color="error"
                                    variant="text"
                                    loading={removingImage}
                                    loadingLabel="Removing..."
                                    onClick={handleRemoveImage}
                                    disabled={!imagePreview}
                                >
                                    Remove
                                </AppLoadingButton>
                            </Stack>
                        </Stack>
                    </SurfaceCard>

                    <SurfaceCard title="Vendor Master" lowChrome contentSx={{ p: 1.4 }}>
                        <Grid container spacing={1.4}>
                            <Grid item xs={12} md={6}><TextField size="small" label="Code" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} fullWidth error={!!form.errors.code} helperText={form.errors.code} /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} fullWidth error={!!form.errors.name} helperText={form.errors.name} /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} fullWidth /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} fullWidth /></Grid>
                            <Grid item xs={12}><TextField size="small" label="Address" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} fullWidth multiline minRows={2} /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Tax ID" value={form.data.tax_id} onChange={(e) => form.setData('tax_id', e.target.value)} fullWidth /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" type="number" label="Payment Terms (Days)" value={form.data.payment_terms_days} onChange={(e) => form.setData('payment_terms_days', e.target.value)} fullWidth /></Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Restaurant" value={form.data.tenant_id} onChange={(e) => form.setData('tenant_id', e.target.value)} fullWidth>
                                    <MenuItem value="">Shared</MenuItem>
                                    {(lookup.tenants || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Currency" value={form.data.currency} onChange={(e) => form.setData('currency', e.target.value)} fullWidth /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" type="number" label="Opening Balance" value={form.data.opening_balance} onChange={(e) => form.setData('opening_balance', e.target.value)} fullWidth /></Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Payable Account" value={form.data.payable_account_id} onChange={(e) => form.setData('payable_account_id', e.target.value)} fullWidth>
                                    <MenuItem value="">None</MenuItem>
                                    {(lookup.coaAccounts || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.full_code} · {item.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Advance Account" value={form.data.advance_account_id} onChange={(e) => form.setData('advance_account_id', e.target.value)} fullWidth>
                                    <MenuItem value="">None</MenuItem>
                                    {(lookup.coaAccounts || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.full_code} · {item.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Default Payment Account" value={form.data.default_payment_account_id} onChange={(e) => form.setData('default_payment_account_id', e.target.value)} fullWidth>
                                    <MenuItem value="">None</MenuItem>
                                    {(lookup.paymentAccounts || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Approval" value={form.data.approval_status} onChange={(e) => form.setData('approval_status', e.target.value)} fullWidth>
                                    <MenuItem value="approved">Approved</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="blocked">Blocked</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Status" value={form.data.status} onChange={(e) => form.setData('status', e.target.value)} fullWidth>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </SurfaceCard>
                    </>
                    ) : null}

                    {drawerSection === 'contacts' ? (
                    <SurfaceCard title="Contact Editor" lowChrome contentSx={{ p: 1.4 }}>
                        <Grid container spacing={1.2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    size="small"
                                    label="Name"
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                                    fullWidth
                                    error={Boolean(formErrors?.name)}
                                    helperText={formErrors?.name || ''}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Title" value={contactForm.title} onChange={(e) => setContactForm((p) => ({ ...p, title: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Email" value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Phone" value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Primary Contact" value={contactForm.is_primary ? '1' : '0'} onChange={(e) => setContactForm((p) => ({ ...p, is_primary: e.target.value === '1' }))} fullWidth>
                                    <MenuItem value="0">No</MenuItem>
                                    <MenuItem value="1">Yes</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <Button size="small" variant="outlined" onClick={() => setContactForm(emptyContact)}>Clear</Button>
                                <AppLoadingButton size="small" variant="contained" loading={processing.contact} loadingLabel="Saving..." startIcon={<AddOutlined />} onClick={saveContact}>
                                    {contactForm.id ? 'Update Contact' : 'Add Contact'}
                                </AppLoadingButton>
                            </Grid>
                        </Grid>
                    </SurfaceCard>
                    ) : null}

                    {drawerSection === 'bank' ? (
                    <SurfaceCard title="Bank Account Editor" lowChrome contentSx={{ p: 1.4 }}>
                        <Grid container spacing={1.2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    size="small"
                                    label="Bank Name"
                                    value={bankForm.bank_name}
                                    onChange={(e) => setBankForm((p) => ({ ...p, bank_name: e.target.value }))}
                                    fullWidth
                                    error={Boolean(formErrors?.bank_name)}
                                    helperText={formErrors?.bank_name || ''}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Account Name" value={bankForm.account_name} onChange={(e) => setBankForm((p) => ({ ...p, account_name: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="Account Number" value={bankForm.account_number} onChange={(e) => setBankForm((p) => ({ ...p, account_number: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="IBAN" value={bankForm.iban} onChange={(e) => setBankForm((p) => ({ ...p, iban: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={6}><TextField size="small" label="SWIFT" value={bankForm.swift_code} onChange={(e) => setBankForm((p) => ({ ...p, swift_code: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Primary Account" value={bankForm.is_primary ? '1' : '0'} onChange={(e) => setBankForm((p) => ({ ...p, is_primary: e.target.value === '1' }))} fullWidth>
                                    <MenuItem value="0">No</MenuItem>
                                    <MenuItem value="1">Yes</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button size="small" variant="outlined" onClick={() => setBankForm(emptyBank)}>Clear</Button>
                                <AppLoadingButton size="small" variant="contained" loading={processing.bank} loadingLabel="Saving..." startIcon={<AddOutlined />} onClick={saveBank}>
                                    {bankForm.id ? 'Update Bank Account' : 'Add Bank Account'}
                                </AppLoadingButton>
                            </Grid>
                        </Grid>
                    </SurfaceCard>
                    ) : null}

                    {drawerSection === 'mappings' ? (
                    <SurfaceCard title="Item Mapping Editor" lowChrome contentSx={{ p: 1.4 }}>
                        <Grid container spacing={1.2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    size="small"
                                    select
                                    label="Inventory Item"
                                    value={mappingForm.inventory_item_id}
                                    onChange={(e) => setMappingForm((p) => ({ ...p, inventory_item_id: e.target.value }))}
                                    fullWidth
                                    error={Boolean(formErrors?.inventory_item_id)}
                                    helperText={formErrors?.inventory_item_id || ''}
                                >
                                    <MenuItem value="">Select Item</MenuItem>
                                    {(lookup.inventoryItems || []).map((item) => (
                                        <MenuItem key={item.id} value={item.id}>{item.sku ? `${item.sku} · ` : ''}{item.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField size="small" select label="Restaurant" value={mappingForm.tenant_id} onChange={(e) => setMappingForm((p) => ({ ...p, tenant_id: e.target.value }))} fullWidth>
                                    <MenuItem value="">Shared</MenuItem>
                                    {(lookup.tenants || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}><TextField size="small" type="number" label="Contract Price" value={mappingForm.contract_price} onChange={(e) => setMappingForm((p) => ({ ...p, contract_price: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={4}><TextField size="small" type="number" label="Last Purchase Price" value={mappingForm.last_purchase_price} onChange={(e) => setMappingForm((p) => ({ ...p, last_purchase_price: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={4}><TextField size="small" type="number" label="Lead Time Days" value={mappingForm.lead_time_days} onChange={(e) => setMappingForm((p) => ({ ...p, lead_time_days: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={4}><TextField size="small" type="number" label="MOQ" value={mappingForm.minimum_order_qty} onChange={(e) => setMappingForm((p) => ({ ...p, minimum_order_qty: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={4}><TextField size="small" label="Currency" value={mappingForm.currency} onChange={(e) => setMappingForm((p) => ({ ...p, currency: e.target.value }))} fullWidth /></Grid>
                            <Grid item xs={12} md={4}>
                                <TextField size="small" select label="Preferred" value={mappingForm.is_preferred ? '1' : '0'} onChange={(e) => setMappingForm((p) => ({ ...p, is_preferred: e.target.value === '1' }))} fullWidth>
                                    <MenuItem value="0">No</MenuItem>
                                    <MenuItem value="1">Yes</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField size="small" select label="Active" value={mappingForm.is_active ? '1' : '0'} onChange={(e) => setMappingForm((p) => ({ ...p, is_active: e.target.value === '1' }))} fullWidth>
                                    <MenuItem value="1">Active</MenuItem>
                                    <MenuItem value="0">Inactive</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button size="small" variant="outlined" onClick={() => setMappingForm(emptyMapping)}>Clear</Button>
                                <AppLoadingButton size="small" variant="contained" loading={processing.mapping} loadingLabel="Saving..." startIcon={<AddOutlined />} onClick={saveMapping}>
                                    {mappingForm.id ? 'Update Mapping' : 'Add Mapping'}
                                </AppLoadingButton>
                            </Grid>
                        </Grid>
                    </SurfaceCard>
                    ) : null}
                </Box>
            </Drawer>

            <ConfirmActionDialog
                open={confirmMasterSave}
                title="Save vendor changes?"
                message="This will update vendor master data and affect future procurement defaults."
                confirmLabel="Save Changes"
                severity="warning"
                loading={form.processing}
                onClose={() => setConfirmMasterSave(false)}
                onConfirm={saveMaster}
            />

            <ConfirmActionDialog
                open={Boolean(confirmDelete)}
                title={confirmDelete?.title || 'Confirm delete'}
                message={confirmDelete?.message || 'This action cannot be undone.'}
                confirmLabel="Delete"
                severity="danger"
                loading={processing.delete}
                onClose={() => (processing.delete ? null : setConfirmDelete(null))}
                onConfirm={runDelete}
            />
        </AppPage>
    );
}
