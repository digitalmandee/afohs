import React, { useState, useEffect } from 'react';
import { Typography, Button, createTheme, ThemeProvider, TextField, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Avatar, Box, InputAdornment, Menu, MenuItem, Tooltip, Drawer, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Autocomplete, CircularProgress, Chip } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';
import { Search, FilterAlt, Visibility, Delete } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import MembershipSuspensionDialog from './Modal';
import MembershipCancellationDialog from './CancelModal';
import MemberProfileModal from './Profile';
import MembershipCardComponent from './UserCard';
import InvoiceSlip from './Invoice';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import ActivateMembershipDialog from './ActivateMembershipDialog';
import { FaEdit } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import MembershipDashboardFilter from './MembershipDashboardFilter';
import MembershipPauseDialog from './MembershipPauseDialog';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { JSONParse } from '@/helpers/generateTemplate';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import Pagination from '@/components/Pagination';

const AllMembers = ({ members, memberTypes = [], memberCategories = [], cities = [] }) => {
    const props = usePage().props;
    const { enqueueSnackbar } = useSnackbar();
    const buildInitialFilters = React.useCallback(
        () => ({
            membership_no: props.filters?.membership_no || '',
            barcode: props.filters?.barcode || '',
            name: props.filters?.name || '',
            cnic: props.filters?.cnic || '',
            contact: props.filters?.contact || '',
            city: props.filters?.city || '',
            status: props.filters?.status || 'all',
            card_status: props.filters?.card_status || 'all',
            member_category: props.filters?.member_category || 'all',
            member_type: props.filters?.member_type || 'all',
            duration: props.filters?.duration || 'all',
            kinship_filter: props.filters?.kinship_filter || 'include',
            selected_member_id: props.filters?.selected_member_id || '',
            sort: props.filters?.sort || 'desc',
            sortBy: props.filters?.sortBy || 'id',
            per_page: props.filters?.per_page || members?.per_page || 25,
            page: 1,
        }),
        [members?.per_page, props.filters],
    );

    // Modal state
    // const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [activateModalOpen, setActivateModalOpen] = useState(false);
    const [openCardModal, setOpenCardModal] = useState(false);
    const [openFilterModal, setOpenFilterModal] = useState(false);
    const [selectMember, setSelectMember] = useState(null);
    const [deletedMemberIds, setDeletedMemberIds] = useState([]);
    const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
    const [pauseModalOpen, setPauseModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [openDocumentModal, setOpenDocumentModal] = useState(false);
    // const [anchorE2, setAnchorE2] = useState(null);
    // const [menuMember, setMenuMember] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [menuMember, setMenuMember] = useState(null);
    const [memberNameOptions, setMemberNameOptions] = useState([]);
    const [membershipNoOptions, setMembershipNoOptions] = useState([]);
    const [loadingMemberNames, setLoadingMemberNames] = useState(false);
    const [loadingMembershipNos, setLoadingMembershipNos] = useState(false);
    const [filters, setFilters] = useState(buildInitialFilters);
    const filtersRef = React.useRef(filters);
    const handleOpenMenu = (e, user) => {
        setMenuAnchor(e.currentTarget);
        setSelectedUserId(user.id);  // Track which user
        setMenuMember(user);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setSelectedUserId(null);
    };

    const handleOpenCard = () => {
        setSelectMember(menuMember);
        setOpenCardModal(true);
        handleCloseMenu();
    };

    const handleOpenInvoice = () => {
        if (
            menuMember.card_status === 'Expired' ||
            menuMember.card_status === 'Suspend'
        ) {
            // your “Send Remind” logic here if needed
            handleCloseMenu();
            return;
        }
        setSelectMember(menuMember);
        setOpenInvoiceModal(true);
        handleCloseMenu();
    };

    const handleOpenDocuments = () => {
        setSelectMember(menuMember);
        setOpenDocumentModal(true);
        handleCloseMenu();
    };

    const handleDeleteClick = (member) => {
        setMemberToDelete(member);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (memberToDelete) {
            axios
                .delete(route('membership.destroy', memberToDelete.id))
                .then(() => {
                    setDeletedMemberIds((prev) => [...prev, memberToDelete.id]);
                    setDeleteDialogOpen(false);
                    setMemberToDelete(null);
                    enqueueSnackbar('Member deleted successfully', { variant: 'success' });
                })
                .catch((error) => {
                    console.error('Error deleting member:', error);
                    enqueueSnackbar('Failed to delete member. Please try again.', { variant: 'error' });
                    setDeleteDialogOpen(false);
                });
        }
    };

    const cleanFilters = React.useCallback((nextFilters) => {
        const cleanedEntries = Object.entries(nextFilters).filter(([key, value]) => {
            if (key === 'per_page') {
                return true;
            }

            if (value === '' || value === null || value === undefined) {
                return false;
            }

            if (['status', 'card_status', 'member_category', 'member_type', 'duration'].includes(key) && value === 'all') {
                return false;
            }

            if (key === 'kinship_filter' && value === 'include') {
                return false;
            }

            if (key === 'page' && Number(value) === 1) {
                return false;
            }

            return true;
        });

        return Object.fromEntries(cleanedEntries);
    }, []);

    const submitFilters = React.useCallback(
        (nextFilters) => {
            const cleanedFilters = cleanFilters(nextFilters);
            router.get(route('membership.members'), cleanedFilters, {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            });
        },
        [cleanFilters],
    );

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    useEffect(() => {
        const nextFilters = buildInitialFilters();
        filtersRef.current = nextFilters;
        setFilters(nextFilters);
    }, [buildInitialFilters]);

    const updateFilters = React.useCallback(
        (partialFilters, { immediate = false } = {}) => {
            const nextFilters = {
                ...filtersRef.current,
                ...partialFilters,
            };

            if (!Object.prototype.hasOwnProperty.call(partialFilters, 'page')) {
                nextFilters.page = 1;
            }

            filtersRef.current = nextFilters;
            setFilters(nextFilters);

            if (immediate) {
                debouncedSubmit.cancel();
                submitFilters(nextFilters);
                return;
            }

            debouncedSubmit(nextFilters);
        },
        [debouncedSubmit, submitFilters],
    );

    const updateFilter = React.useCallback(
        (name, value, options = {}) => {
            updateFilters({ [name]: value }, options);
        },
        [updateFilters],
    );

    const resetFilters = React.useCallback(() => {
        debouncedSubmit.cancel();
        const nextFilters = {
            ...buildInitialFilters(),
            membership_no: '',
            barcode: '',
            name: '',
            cnic: '',
            contact: '',
            city: '',
            status: 'all',
            card_status: 'all',
            member_category: 'all',
            member_type: 'all',
            duration: 'all',
            kinship_filter: 'include',
            selected_member_id: '',
            page: 1,
        };

        filtersRef.current = nextFilters;
        setFilters(nextFilters);
        submitFilters(nextFilters);
    }, [buildInitialFilters, debouncedSubmit, submitFilters]);

    // Extract unique status and member type values from members
    const statusOptions = [
        { label: 'All type', value: 'all', icon: null },
        { label: 'Active', value: 'active', icon: null },
        { label: 'Suspended', value: 'suspended', icon: null },
        { label: 'Cancelled', value: 'cancelled', icon: null },
        { label: 'Absent', value: 'absent', icon: null },
    ];

    const memberTypeOptions = [{ label: 'All types', value: 'all' }].concat(
        memberTypes.map((type) => ({ label: type.name, value: type.name })),
    );

    useEffect(() => {
        if (!filters.name || filters.name.trim().length < 2) {
            setMemberNameOptions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoadingMemberNames(true);
            try {
                const response = await axios.get(route('api.members.search'), {
                    params: { query: filters.name },
                });
                setMemberNameOptions(response.data.members || []);
            } catch (error) {
                setMemberNameOptions([]);
            } finally {
                setLoadingMemberNames(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.name]);

    useEffect(() => {
        if (!filters.membership_no || filters.membership_no.trim().length < 2) {
            setMembershipNoOptions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoadingMembershipNos(true);
            try {
                const response = await axios.get(route('api.members.search'), {
                    params: { query: filters.membership_no },
                });
                setMembershipNoOptions(response.data.members || []);
            } catch (error) {
                setMembershipNoOptions([]);
            } finally {
                setLoadingMembershipNos(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.membership_no]);

    const handleAutocompleteSelect = (filterName, selectedValue, valueKey) => {
        if (typeof selectedValue === 'string') {
            updateFilters(
                {
                    [filterName]: selectedValue,
                    selected_member_id: '',
                },
                { immediate: true },
            );
            return;
        }

        updateFilters(
            {
                [filterName]: selectedValue?.[valueKey] || '',
                selected_member_id: selectedValue?.id || '',
            },
            { immediate: true },
        );
    };

    const handleApplyFilters = () => {
        debouncedSubmit.cancel();
        submitFilters(filtersRef.current);
    };

    const handleCancelMembership = () => {
        setCancelModalOpen(false);
    };

    const getAvailableStatusActions = (currentStatus) => {
        const allStatuses = ['active', 'suspended', 'cancelled', 'absent'];
        return allStatuses.filter((status) => status.toLowerCase() !== currentStatus?.toLowerCase());
    };

    const handleStatusUpdate = (memberId, newStatus) => {
        const foundMember = members.data.find((m) => m.id === memberId);
        if (foundMember) {
            foundMember.status = newStatus;
        }
    };

    const visibleMembers = members.data.filter((member) => !deletedMemberIds.includes(member.id));
    const memberColumns = [
        { key: 'membership_no', label: 'Membership No', sx: { minWidth: 150 } },
        { key: 'member', label: 'Member', sx: { minWidth: 220 } },
        { key: 'member_category', label: 'Member Category', sx: { minWidth: 160 } },
        { key: 'type', label: 'Type', sx: { minWidth: 120 } },
        { key: 'cnic', label: 'CNIC', sx: { minWidth: 150 } },
        { key: 'contact', label: 'Contact', sx: { minWidth: 150 } },
        { key: 'membership_date', label: 'Membership Date', sx: { minWidth: 150 } },
        { key: 'duration', label: 'Duration', sx: { minWidth: 120 } },
        { key: 'family_members', label: 'Family Members', sx: { minWidth: 130 } },
        { key: 'card_status', label: 'Card Status', sx: { minWidth: 120 } },
        { key: 'status', label: 'Status', sx: { minWidth: 150 } },
        { key: 'files', label: 'Files', sx: { minWidth: 90 } },
        { key: 'action', label: 'Action', sx: { minWidth: 130 } },
    ];

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <div className="container-fluid p-4 pt-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
                <AppPage
                    eyebrow="Membership"
                    title="All Members"
                    subtitle="Review and manage primary memberships with live filters, cleaner tables, and better pagination."
                    actions={[
                        <Button
                            key="deleted"
                            variant="outlined"
                            startIcon={<Delete />}
                            onClick={() => router.get(route('membership.trashed'))}
                            sx={{
                                color: '#d32f2f',
                                borderColor: '#d32f2f',
                                borderRadius: '16px',
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: '#ffebee',
                                    borderColor: '#d32f2f',
                                },
                            }}
                        >
                            Deleted Members
                        </Button>,
                    ]}
                >
                    <SurfaceCard
                        title="Live Filters"
                        subtitle="Results update automatically while you search or change any membership filter."
                        cardSx={{ borderRadius: '18px' }}
                        contentSx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}
                    >
                        <FilterToolbar
                            onReset={resetFilters}
                            actions={
                                <Button size="small" variant="contained" onClick={handleApplyFilters} sx={{ borderRadius: '12px', textTransform: 'none', backgroundColor: '#063455', '&:hover': { backgroundColor: '#052a42' } }}>
                                    Search
                                </Button>
                            }
                        >
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
                                    gap: 1.25,
                                }}
                            >
                                <Autocomplete
                                    freeSolo
                                    options={membershipNoOptions}
                                    filterOptions={(options) => options}
                                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.membership_no || '')}
                                    inputValue={filters.membership_no}
                                    onInputChange={(event, newInputValue, reason) => {
                                        if (reason === 'input' || reason === 'clear') {
                                            updateFilters({
                                                membership_no: newInputValue,
                                                selected_member_id: '',
                                            });
                                        }
                                    }}
                                    onChange={(event, newValue) => handleAutocompleteSelect('membership_no', newValue, 'membership_no')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Membership #"
                                            fullWidth
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {loadingMembershipNos ? <CircularProgress color="inherit" size={18} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.id}>
                                            <Box sx={{ width: '100%' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {option.membership_no}
                                                    </Typography>
                                                    <Chip
                                                        component="span"
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.full_name}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                />
                                <Autocomplete
                                    freeSolo
                                    options={memberNameOptions}
                                    filterOptions={(options) => options}
                                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.full_name || '')}
                                    inputValue={filters.name}
                                    onInputChange={(event, newInputValue, reason) => {
                                        if (reason === 'input' || reason === 'clear') {
                                            updateFilters({
                                                name: newInputValue,
                                                selected_member_id: '',
                                            });
                                        }
                                    }}
                                    onChange={(event, newValue) => handleAutocompleteSelect('name', newValue, 'full_name')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Name"
                                            fullWidth
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {loadingMemberNames ? <CircularProgress color="inherit" size={18} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.id}>
                                            <Box sx={{ width: '100%' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {option.full_name}
                                                    </Typography>
                                                    <Chip
                                                        component="span"
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.membership_no} | {option.mobile_number_a || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                />
                                <TextField label="Barcode" value={filters.barcode} onChange={(e) => updateFilter('barcode', e.target.value)} fullWidth />
                                <TextField label="CNIC" value={filters.cnic} onChange={(e) => updateFilter('cnic', e.target.value)} fullWidth />
                                <TextField label="Contact" value={filters.contact} onChange={(e) => updateFilter('contact', e.target.value)} fullWidth />
                                <Autocomplete
                                    freeSolo
                                    options={cities}
                                    filterOptions={(options) => options}
                                    inputValue={filters.city}
                                    onInputChange={(event, newInputValue, reason) => {
                                        if (reason === 'input' || reason === 'clear') {
                                            updateFilter('city', newInputValue);
                                        }
                                    }}
                                    onChange={(event, newValue) => handleAutocompleteSelect('city', newValue, 'label')}
                                    renderInput={(params) => <TextField {...params} label="City" fullWidth />}
                                />
                                <TextField select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value, { immediate: true })} fullWidth>
                                    {statusOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField select label="Member Type" value={filters.member_type} onChange={(e) => updateFilter('member_type', e.target.value, { immediate: true })} fullWidth>
                                    {memberTypeOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField select label="Member Category" value={filters.member_category} onChange={(e) => updateFilter('member_category', e.target.value, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All categories</MenuItem>
                                    {memberCategories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField select label="Card Status" value={filters.card_status} onChange={(e) => updateFilter('card_status', e.target.value, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All card statuses</MenuItem>
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Expired">Expired</MenuItem>
                                    <MenuItem value="Suspend">Suspend</MenuItem>
                                </TextField>
                                <TextField select label="Duration" value={filters.duration} onChange={(e) => updateFilter('duration', e.target.value, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All durations</MenuItem>
                                    <MenuItem value="lt1y">Less than 1 year</MenuItem>
                                    <MenuItem value="1to3y">1 to 3 years</MenuItem>
                                    <MenuItem value="3to5y">3 to 5 years</MenuItem>
                                    <MenuItem value="gt5y">More than 5 years</MenuItem>
                                </TextField>
                                <TextField select label="Kinship" value={filters.kinship_filter} onChange={(e) => updateFilter('kinship_filter', e.target.value, { immediate: true })} fullWidth>
                                    <MenuItem value="include">Include all</MenuItem>
                                    <MenuItem value="exclude">Primary only</MenuItem>
                                    <MenuItem value="only">Family only</MenuItem>
                                </TextField>
                            </Box>
                        </FilterToolbar>
                    </SurfaceCard>

                    <SurfaceCard title="Member Register" subtitle="Standardized membership table with current status actions and adjustable page size.">
                        <AdminDataTable
                            columns={memberColumns}
                            rows={visibleMembers}
                            pagination={members}
                            emptyMessage="No members found."
                            tableMinWidth={1540}
                            renderRow={(user) => (
                                <TableRow key={user.id} hover sx={{ '& .MuiTableCell-body': { borderBottomColor: '#edf2f7' } }}>
                                            <TableCell
                                                onClick={() => router.visit(route('membership.profile', user.id))}
                                                sx={{
                                                    color: '#000',
                                                    fontWeight: 600,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        color: '#7f7f7f', // dark text on hover
                                                        fontWeight: 600, // bold on hover
                                                    },
                                                }}
                                            >
                                                {user.membership_no || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="d-flex align-items-center">
                                                    <Avatar src={user.profile_photo?.file_path || '/placeholder.svg?height=40&width=40'} alt={user.name} style={{ marginRight: '10px' }} />
                                                    <div>
                                                        <Typography sx={{
                                                            color: '#7F7F7F',
                                                            fontWeight: 400,
                                                            fontSize: '14px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            maxWidth: '150px',  // Container for name + icon
                                                        }}>
                                                            {/* ✅ Name truncates independently */}
                                                            <div style={{
                                                                maxWidth: '110px',  // Exactly 15 chars
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                <Tooltip title={user.full_name || 'N/A'} arrow>
                                                                    <span>{user.full_name}</span>
                                                                </Tooltip>
                                                            </div>

                                                            {/* ✅ Icon stays separate */}
                                                            {user.is_document_enabled && (
                                                                <Tooltip title="Documents missing" arrow>
                                                                    <WarningAmberIcon color="warning" fontSize="small" />
                                                                </Tooltip>
                                                            )}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.member_category?.description || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.member_type?.name || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{user.cnic_no || 'N/A'}</TableCell>
                                            {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.mobile_number_a || 'N/A'}</TableCell> */}
                                            <TableCell>
                                                <Typography sx={{
                                                    color: '#7F7F7F', fontWeight: 400, fontSize: '14px', maxWidth: '120px',  // ~20 chars width
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    <Tooltip title={user.mobile_number_a || 'N/A'} arrow>
                                                        <span>{user.mobile_number_a || 'N/A'}</span>
                                                    </Tooltip>
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.membership_date ? dayjs(user.membership_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                                            {/* <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.membership_duration || 'N/A'}</TableCell> */}
                                            <TableCell>
                                                <Typography sx={{
                                                    color: '#7F7F7F', fontWeight: 400, fontSize: '14px', maxWidth: '100px',  // ~20 chars width
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    <Tooltip title={user.membership_duration || 'N/A'} arrow>
                                                        <span>{user.membership_duration || 'N/A'}</span>
                                                    </Tooltip>
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.family_members_count || 'N/A'}</TableCell>
                                            <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.card_status || 'N/A'}</TableCell>
                                            <TableCell>
                                                <PopupState variant="popover" popupId={`status-popup-${user.id}`}>
                                                    {(popupState) => (
                                                        <>
                                                            <span
                                                                style={{
                                                                    color: user.status === 'active' ? '#2e7d32' : user.status === 'suspended' ? '#FFA90B' : '#d32f2f',
                                                                    fontWeight: 'medium',
                                                                    cursor: 'pointer',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                {...bindTrigger(popupState)}
                                                            >
                                                                {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'N/A'}
                                                                {user.status === 'suspended' && (
                                                                    <img
                                                                        src="/assets/system-expired.png"
                                                                        alt=""
                                                                        style={{
                                                                            width: 25,
                                                                            height: 25,
                                                                            marginLeft: 2,
                                                                            marginBottom: 5,
                                                                        }}
                                                                    />
                                                                )}
                                                                <MdModeEdit size={18} style={{ marginLeft: '5px' }} />
                                                            </span>
                                                            <Menu {...bindMenu(popupState)}>
                                                                {getAvailableStatusActions(user.status).map((statusOption) => (
                                                                    <MenuItem
                                                                        key={statusOption}
                                                                        onClick={() => {
                                                                            popupState.close();
                                                                            setSelectMember(user);
                                                                            if (statusOption === 'suspended') setSuspensionModalOpen(true);
                                                                            else if (statusOption === 'cancelled') setCancelModalOpen(true);
                                                                            else if (statusOption === 'active') setActivateModalOpen(true);
                                                                            else if (statusOption === 'absent') setPauseModalOpen(true);
                                                                        }}
                                                                    >
                                                                        {statusOption === 'active' ? 'Activate' : statusOption}
                                                                    </MenuItem>
                                                                ))}
                                                            </Menu>
                                                        </>
                                                    )}
                                                </PopupState>
                                            </TableCell>
                                            {/* <TableCell>
                                            <Button
                                                style={{
                                                    color: '#0C67AA',
                                                    textDecoration: 'underline',
                                                    textTransform: 'none',
                                                }}
                                                onClick={() => {
                                                    setSelectMember(user);
                                                    setOpenCardModal(true);
                                                }}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            {user.card_status === 'Expired' || user.card_status === 'Suspend' ? (
                                                <Button style={{ color: '#0C67AA', textDecoration: 'underline', textTransform: 'none' }}>Send Remind</Button>
                                            ) : (
                                                <Button
                                                    style={{
                                                        color: '#0C67AA',
                                                        textDecoration: 'underline',
                                                        textTransform: 'none',
                                                    }}
                                                    onClick={() => {
                                                        setSelectMember(user);
                                                        setOpenInvoiceModal(true);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                style={{
                                                    color: '#0C67AA',
                                                    textDecoration: 'underline',
                                                    textTransform: 'none',
                                                }}
                                                onClick={() => {
                                                    setSelectMember(user);
                                                    setOpenDocumentModal(true);
                                                }}
                                            >
                                                View
                                            </Button>
                                        </TableCell> */}
                                            {/* <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleOpenMenu(e, user)}
                                            >
                                                <MoreVertIcon sx={{ color: '#063455' }} />
                                            </IconButton>
                                            <Menu
                                                anchorE2={anchorE2}
                                                open={Boolean(anchorE2)}
                                                onClose={handleCloseMenu}
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'right',
                                                }}
                                                transformOrigin={{
                                                    vertical: 'top',
                                                    horizontal: 'right',
                                                }}
                                                slotProps={{
                                                    paper: {
                                                        sx: { mt: -10, ml: -10 }, // small vertical offset
                                                    },
                                                }}
                                            >
                                                <MenuItem onClick={handleOpenCard}>Card</MenuItem>
                                                <MenuItem onClick={handleOpenInvoice}>
                                                    {menuMember &&
                                                        (menuMember.card_status === 'Expired' ||
                                                            menuMember.card_status === 'Suspend')
                                                        ? 'Send Remind'
                                                        : 'Invoice'}
                                                </MenuItem>
                                                <MenuItem onClick={handleOpenDocuments}>Documents</MenuItem>
                                            </Menu>
                                        </TableCell> */}
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleOpenMenu(e, user)}
                                                >
                                                    <MoreVertIcon sx={{ color: '#063455' }} />
                                                </IconButton>
                                                <Menu
                                                    anchorEl={menuAnchor}  // Fixed: anchorEl (not anchorE2)
                                                    open={Boolean(menuAnchor && selectedUserId === user.id)}
                                                    onClose={handleCloseMenu}
                                                    anchorOrigin={{
                                                        vertical: 'bottom',
                                                        horizontal: 'right',
                                                    }}
                                                    transformOrigin={{
                                                        vertical: 'top',
                                                        horizontal: 'right',
                                                    }}
                                                // slotProps={{
                                                //     paper: {
                                                //         sx: { mt: -5 },
                                                //     },
                                                // }}
                                                >
                                                    <MenuItem onClick={handleOpenCard}>Card</MenuItem>
                                                    <MenuItem onClick={handleOpenInvoice}>
                                                        {menuMember && (menuMember.card_status === 'Expired' || menuMember.card_status === 'Suspend')
                                                            ? 'Send Remind'
                                                            : 'Invoice'
                                                        }
                                                    </MenuItem>
                                                    <MenuItem onClick={handleOpenDocuments}>Documents</MenuItem>
                                                </Menu>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="View Profile">
                                                        <IconButton onClick={() => router.visit(route('membership.profile', user.id))} sx={{ color: '#063455' }}>
                                                            <Visibility size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Member">
                                                        <IconButton onClick={() => router.visit(route('membership.edit', user.id))} sx={{ color: '#f57c00' }}>
                                                            <FaEdit size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Member">
                                                        <IconButton onClick={() => handleDeleteClick(user)} sx={{ color: '#d32f2f' }}>
                                                            <Delete size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                            )}
                        />
                    </SurfaceCard>
                </AppPage>
                    
                {/* Modal */}
                <MembershipPauseDialog open={pauseModalOpen} onClose={() => setPauseModalOpen(false)} memberId={selectMember?.id} onSuccess={(newStatus) => handleStatusUpdate(selectMember.id, newStatus)} />
                <MembershipSuspensionDialog open={suspensionModalOpen} onClose={() => setSuspensionModalOpen(false)} memberId={selectMember?.id} onSuccess={(newStatus) => handleStatusUpdate(selectMember.id, newStatus)} />
                <MembershipCancellationDialog open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} onConfirm={handleCancelMembership} memberId={selectMember?.id} onSuccess={(newStatus) => handleStatusUpdate(selectMember.id, newStatus)} />

                <ActivateMembershipDialog open={activateModalOpen} onClose={() => setActivateModalOpen(false)} memberId={selectMember?.id} onSuccess={(newStatus) => handleStatusUpdate(selectMember.id, newStatus)} />

                <MembershipCardComponent open={openCardModal} onClose={() => setOpenCardModal(false)} member={selectMember} memberData={members} />
                <InvoiceSlip
                    open={openInvoiceModal}
                    onClose={() => {
                        setOpenInvoiceModal(false);
                        setSelectMember(null); // ✅ Clear selected member when closing
                    }}
                    invoiceNo={selectMember?.membership_invoice?.id ? null : selectMember?.id}
                    invoiceId={selectMember?.membership_invoice?.id || null}
                />

                <Drawer
                    anchor="top"
                    open={openDocumentModal}
                    onClose={() => setOpenDocumentModal(false)}
                    ModalProps={{ keepMounted: true }}
                    PaperProps={{
                        sx: {
                            margin: '20px auto 0',
                            width: 600,
                            borderRadius: '8px',
                        },
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        {/* ✅ Documents Preview */}
                        <h5 style={{ marginBottom: '10px', fontWeight: 700 }}>Attached Documents</h5>
                        {selectMember && selectMember?.documents && selectMember?.documents.length > 0 ? (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {selectMember?.documents.map((doc, index) => {
                                        const ext = doc.file_path.split('.').pop().toLowerCase();

                                        // ✅ For images
                                        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                                            return (
                                                <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                    <img src={doc.file_path} alt={`Document ${index + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }} onClick={() => window.open(doc.file_path, '_blank')} />
                                                    <p style={{ fontSize: '12px', marginTop: '5px' }}>Image</p>
                                                </div>
                                            );
                                        }

                                        // ✅ For PDF
                                        if (ext === 'pdf') {
                                            return (
                                                <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                    <img
                                                        src="/assets/pdf-icon.png" // You can use a static icon
                                                        alt="PDF"
                                                        style={{ width: '60px', cursor: 'pointer' }}
                                                        onClick={() => window.open(doc.file_path, '_blank')}
                                                    />
                                                    <p style={{ fontSize: '12px', marginTop: '5px' }}>PDF</p>
                                                </div>
                                            );
                                        }

                                        // ✅ For DOCX
                                        if (ext === 'docx' || ext === 'doc') {
                                            return (
                                                <div key={index} style={{ width: '100px', textAlign: 'center' }}>
                                                    <img
                                                        src="/assets/word-icon.png" // Use a static Word icon
                                                        alt="DOCX"
                                                        style={{ width: '60px', cursor: 'pointer' }}
                                                        onClick={() => window.open(doc.file_path, '_blank')}
                                                    />
                                                    <p style={{ fontSize: '12px', marginTop: '5px' }}>Word</p>
                                                </div>
                                            );
                                        }

                                        return null; // For unknown file types
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginTop: '20px', textAlign: 'center', color: '#7F7F7F', fontSize: '14px' }}>
                                No attached documents
                            </div>
                        )}
                    </Box>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="text" color="inherit" onClick={() => setOpenDocumentModal(false)}>
                            Close
                        </Button>
                    </Box>
                </Drawer>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
                    <DialogTitle id="alert-dialog-title">{'Confirm Deletion'}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description" style={{ color: '#D32F2F' }}>Are you sure you want to delete this member? </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)} style={{ color: '#063455', border: '1px solid #063455' }}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDelete} autoFocus style={{ color: '#D32F2F', border: '1px solid #D32F2F' }}>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
            {/* </div> */}
        </>
    );
};

export default AllMembers;
