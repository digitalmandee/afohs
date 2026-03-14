import React, { useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Drawer,
    IconButton,
    Menu,
    MenuItem,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { Add, CreditCard, Delete, People, Visibility, WarningAmber } from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { FaEdit } from 'react-icons/fa';
import { MdModeEdit, MdOutlineAccountBalance } from 'react-icons/md';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import AppPage from '@/components/App/ui/AppPage';
import StatCard from '@/components/App/ui/StatCard';
import DataTableCard from '@/components/App/ui/DataTableCard';
import MembershipSuspensionDialog from './Modal';
import MembershipCancellationDialog from './CancelModal';
import MembershipCardComponent from './UserCard';
import InvoiceSlip from './Invoice';
import ActivateMembershipDialog from './ActivateMembershipDialog';
import MembershipPauseDialog from './MembershipPauseDialog';

const tableColumns = [
    { key: 'membership_no', label: 'Membership No', sx: { whiteSpace: 'nowrap' } },
    { key: 'member', label: 'Member' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type' },
    { key: 'cnic', label: 'CNIC' },
    { key: 'contact', label: 'Contact' },
    { key: 'membership_date', label: 'Membership Date', sx: { whiteSpace: 'nowrap' } },
    { key: 'duration', label: 'Duration' },
    { key: 'family_members', label: 'Family Members', sx: { whiteSpace: 'nowrap' } },
    { key: 'card_status', label: 'Card Status', sx: { whiteSpace: 'nowrap' } },
    { key: 'status', label: 'Status' },
    { key: 'files', label: 'Files' },
    { key: 'actions', label: 'Actions' },
];

const corporateColumns = [
    { key: 'membership_no', label: 'Membership No', sx: { whiteSpace: 'nowrap' } },
    { key: 'member', label: 'Member' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type' },
    { key: 'cnic', label: 'CNIC' },
    { key: 'contact', label: 'Contact' },
    { key: 'membership_date', label: 'Membership Date', sx: { whiteSpace: 'nowrap' } },
    { key: 'card_status', label: 'Card Status', sx: { whiteSpace: 'nowrap' } },
    { key: 'status', label: 'Status' },
    { key: 'card', label: 'Card' },
    { key: 'actions', label: 'Actions' },
];

const textCellSx = {
    color: '#64748b',
    fontSize: '0.88rem',
    fontWeight: 500,
    py: 1.15,
};

const ellipsisSx = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

const formatStatusColor = (status) => {
    if (status === 'active') return '#15803d';
    if (status === 'suspended') return '#d97706';
    return '#dc2626';
};

export default function MembershipDashboard({
    members = [],
    corporateMembers = [],
    total_members,
    total_payment,
    total_corporate_members,
    total_corporate_payment,
}) {
    const { enqueueSnackbar } = useSnackbar();
    const [memberTab, setMemberTab] = useState(0);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [menuMember, setMenuMember] = useState(null);
    const [selectMember, setSelectMember] = useState(null);
    const [openCardModal, setOpenCardModal] = useState(false);
    const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
    const [openDocumentModal, setOpenDocumentModal] = useState(false);
    const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [activateModalOpen, setActivateModalOpen] = useState(false);
    const [pauseModalOpen, setPauseModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [filteredMembers, setFilteredMembers] = useState(members);
    const [filteredCorporateMembers] = useState(corporateMembers);
    const [primaryPage, setPrimaryPage] = useState(0);
    const [primaryRowsPerPage, setPrimaryRowsPerPage] = useState(10);
    const [corporatePage, setCorporatePage] = useState(0);
    const [corporateRowsPerPage, setCorporateRowsPerPage] = useState(10);

    const summaryCards = useMemo(
        () => [
            {
                label: 'Primary Members',
                value: (total_members ?? 0).toLocaleString(),
                caption: 'Active member base',
                icon: <People />,
            },
            {
                label: 'Membership Collections',
                value: (total_payment ?? 0).toLocaleString(),
                caption: 'Total receipts captured',
                icon: <CreditCard />,
            },
            {
                label: 'Corporate Members',
                value: (total_corporate_members ?? 0).toLocaleString(),
                caption: `${(total_corporate_payment ?? 0).toLocaleString()} corporate collections`,
                icon: <MdOutlineAccountBalance />,
            },
        ],
        [total_corporate_members, total_corporate_payment, total_members, total_payment],
    );

    const handleOpenMenu = (event, user) => {
        setMenuAnchor(event.currentTarget);
        setSelectedUserId(user.id);
        setMenuMember(user);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setSelectedUserId(null);
        setMenuMember(null);
    };

    const handleOpenCard = () => {
        setSelectMember(menuMember);
        setOpenCardModal(true);
        handleCloseMenu();
    };

    const handleOpenInvoice = () => {
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
        if (!memberToDelete) return;

        axios
            .delete(route('membership.destroy', memberToDelete.id))
            .then(() => {
                setFilteredMembers((prev) => prev.filter((member) => member.id !== memberToDelete.id));
                setDeleteDialogOpen(false);
                setMemberToDelete(null);
                enqueueSnackbar('Member deleted successfully', { variant: 'success' });
            })
            .catch((error) => {
                console.error('Error deleting member:', error);
                enqueueSnackbar('Failed to delete member. Please try again.', { variant: 'error' });
                setDeleteDialogOpen(false);
            });
    };

    const getAvailableStatusActions = (currentStatus) => {
        const allStatuses = ['active', 'suspended', 'cancelled', 'absent'];
        return allStatuses.filter((status) => status.toLowerCase() !== currentStatus?.toLowerCase());
    };

    const handleStatusUpdate = (memberId, newStatus) => {
        const foundMember = filteredMembers.find((member) => member.id === memberId);
        if (foundMember) {
            foundMember.status = newStatus;
            setFilteredMembers([...filteredMembers]);
        }
    };

    const renderMemberIdentity = (user) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 220 }}>
            <Avatar src={user.profile_photo?.file_path || '/placeholder.svg?height=40&width=40'} alt={user.full_name} sx={{ width: 42, height: 42 }} />
            <Box sx={{ minWidth: 0 }}>
                <Tooltip title={user.full_name || 'N/A'} arrow>
                    <Typography sx={{ ...textCellSx, ...ellipsisSx, color: '#475569', fontWeight: 600, maxWidth: 170 }}>
                        {user.full_name || 'N/A'}
                    </Typography>
                </Tooltip>
                <Tooltip title={user.personal_email || 'N/A'} arrow>
                    <Typography sx={{ ...textCellSx, ...ellipsisSx, fontSize: '0.8rem', pt: 0, maxWidth: 180 }}>
                        {user.personal_email || 'N/A'}
                    </Typography>
                </Tooltip>
            </Box>
            {user.is_document_enabled ? (
                <Tooltip title="Documents missing" arrow>
                    <WarningAmber sx={{ color: '#f59e0b', fontSize: '1rem' }} />
                </Tooltip>
            ) : null}
        </Box>
    );

    const renderPrimaryRow = (user) => (
        <TableRow key={user.id}>
            <TableCell sx={{ ...textCellSx, color: '#0f172a', fontWeight: 700 }}>
                <Tooltip title={user.membership_no || 'N/A'} arrow>
                    <Box component="span" onClick={() => router.visit(route('membership.profile', user.id))} sx={{ cursor: 'pointer' }}>
                        {user.membership_no || 'N/A'}
                    </Box>
                </Tooltip>
            </TableCell>
            <TableCell>{renderMemberIdentity(user)}</TableCell>
            <TableCell sx={textCellSx}>{user.member_category?.description || 'N/A'}</TableCell>
            <TableCell sx={textCellSx}>{user.member_type?.name || 'N/A'}</TableCell>
            <TableCell sx={{ ...textCellSx, whiteSpace: 'nowrap' }}>{user.cnic_no || 'N/A'}</TableCell>
            <TableCell sx={textCellSx}>
                <Tooltip title={user.mobile_number_a || 'N/A'} arrow>
                    <Box component="span">{user.mobile_number_a || 'N/A'}</Box>
                </Tooltip>
            </TableCell>
            <TableCell sx={textCellSx}>{user.membership_date ? dayjs(user.membership_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
            <TableCell sx={{ ...textCellSx, ...ellipsisSx, maxWidth: 110 }}>
                <Tooltip title={user.membership_duration || 'N/A'} arrow>
                    <Box component="span">{user.membership_duration || 'N/A'}</Box>
                </Tooltip>
            </TableCell>
            <TableCell sx={textCellSx}>{user.family_members_count || 'N/A'}</TableCell>
            <TableCell sx={textCellSx}>{user.card_status || 'N/A'}</TableCell>
            <TableCell>
                <PopupState variant="popover" popupId={`status-popup-${user.id}`}>
                    {(popupState) => (
                        <>
                            <Box
                                component="span"
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.4,
                                    color: formatStatusColor(user.status),
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.84rem',
                                }}
                                {...bindTrigger(popupState)}
                            >
                                {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'N/A'}
                                <MdModeEdit size={16} />
                            </Box>
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
            <TableCell>
                <IconButton size="small" onClick={(event) => handleOpenMenu(event, user)}>
                    <MoreVertIcon sx={{ color: '#063455' }} />
                </IconButton>
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor && selectedUserId === user.id)}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem onClick={handleOpenCard}>Card</MenuItem>
                    <MenuItem onClick={handleOpenInvoice}>
                        {menuMember && (menuMember.card_status === 'Expired' || menuMember.card_status === 'Suspend') ? 'Send Remind' : 'Invoice'}
                    </MenuItem>
                    <MenuItem onClick={handleOpenDocuments}>Documents</MenuItem>
                </Menu>
            </TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', gap: 0.4 }}>
                    <Tooltip title="View Profile">
                        <IconButton onClick={() => router.visit(route('membership.profile', user.id))} sx={{ color: '#063455' }}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Member">
                        <IconButton onClick={() => router.visit(route('membership.edit', user.id))} sx={{ color: '#d97706' }}>
                            <FaEdit size={15} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Member">
                        <IconButton onClick={() => handleDeleteClick(user)} sx={{ color: '#dc2626' }}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );

    const renderCorporateRow = (user) => (
        <TableRow key={user.id}>
            <TableCell sx={{ ...textCellSx, color: '#0f172a', fontWeight: 700 }}>
                <Tooltip title={user.membership_no || 'N/A'} arrow>
                    <Box component="span" onClick={() => router.visit(route('corporate-membership.profile', user.id))} sx={{ cursor: 'pointer' }}>
                        {user.membership_no || 'N/A'}
                    </Box>
                </Tooltip>
            </TableCell>
            <TableCell>{renderMemberIdentity(user)}</TableCell>
            <TableCell sx={textCellSx}>{user.member_category?.description || 'N/A'}</TableCell>
            <TableCell sx={textCellSx}>
                <Chip label="Corporate" size="small" sx={{ bgcolor: 'rgba(12,103,167,0.12)', color: '#0a3d62', fontWeight: 700 }} />
            </TableCell>
            <TableCell sx={{ ...textCellSx, whiteSpace: 'nowrap' }}>{user.cnic_no || 'N/A'}</TableCell>
            <TableCell sx={textCellSx}>{user.mobile_number_a || 'N/A'}</TableCell>
            <TableCell sx={textCellSx}>{user.membership_date ? dayjs(user.membership_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
            <TableCell sx={textCellSx}>{user.card_status || 'N/A'}</TableCell>
            <TableCell sx={{ ...textCellSx, color: formatStatusColor(user.status), fontWeight: 700 }}>
                {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'N/A'}
            </TableCell>
            <TableCell>
                <Button
                    variant="outlined"
                    size="small"
                    sx={{ minHeight: 34, px: 1.5 }}
                    onClick={() => {
                        setSelectMember({ ...user, is_corporate: true });
                        setOpenCardModal(true);
                    }}
                >
                    View
                </Button>
            </TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', gap: 0.4 }}>
                    <Tooltip title="Edit Member">
                        <IconButton onClick={() => router.visit(route('corporate-membership.edit', user.id))} sx={{ color: '#d97706' }}>
                            <FaEdit size={15} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="View Profile">
                        <IconButton onClick={() => router.visit(route('corporate-membership.profile', user.id))} sx={{ color: '#063455' }}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );

    return (
        <>
            <AppPage
                eyebrow="Membership"
                title="Membership Dashboard"
                subtitle="Track membership growth, collections, and the latest member activity from one compact workspace."
                actions={[
                    <Button key="add-member" variant="contained" startIcon={<Add />} onClick={() => router.visit(route('membership.add'))}>
                        Add Member
                    </Button>,
                    <Button key="add-corporate" variant="outlined" startIcon={<Add />} onClick={() => router.visit(route('corporate-membership.add'))}>
                        Corporate Member
                    </Button>,
                ]}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                        gap: 2,
                    }}
                >
                    {summaryCards.map((card) => (
                        <StatCard key={card.label} label={card.label} value={card.value} caption={card.caption} icon={card.icon} tone="dark" />
                    ))}
                </Box>

                <DataTableCard
                    tabs={[{ label: 'Primary Members' }, { label: 'Corporate Members' }]}
                    activeTab={memberTab}
                    onTabChange={(event, value) => setMemberTab(value)}
                    columns={memberTab === 0 ? tableColumns : corporateColumns}
                    rows={memberTab === 0 ? filteredMembers : filteredCorporateMembers}
                    renderRow={memberTab === 0 ? renderPrimaryRow : renderCorporateRow}
                    page={memberTab === 0 ? primaryPage : corporatePage}
                    rowsPerPage={memberTab === 0 ? primaryRowsPerPage : corporateRowsPerPage}
                    onPageChange={(event, newPage) => {
                        if (memberTab === 0) setPrimaryPage(newPage);
                        else setCorporatePage(newPage);
                    }}
                    onRowsPerPageChange={(event) => {
                        const nextValue = parseInt(event.target.value, 10);
                        if (memberTab === 0) {
                            setPrimaryRowsPerPage(nextValue);
                            setPrimaryPage(0);
                        } else {
                            setCorporateRowsPerPage(nextValue);
                            setCorporatePage(0);
                        }
                    }}
                    emptyMessage={memberTab === 0 ? 'No primary members found.' : 'No corporate members found.'}
                />
            </AppPage>

            <MembershipPauseDialog open={pauseModalOpen} onClose={() => setPauseModalOpen(false)} memberId={selectMember?.id} onSuccess={(newStatus) => handleStatusUpdate(selectMember.id, newStatus)} />
            <MembershipSuspensionDialog open={suspensionModalOpen} onClose={() => setSuspensionModalOpen(false)} memberId={selectMember?.id} onSuccess={(newStatus) => handleStatusUpdate(selectMember.id, newStatus)} />
            <MembershipCancellationDialog open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} onConfirm={() => setCancelModalOpen(false)} memberId={selectMember?.id} onSuccess={(newStatus) => handleStatusUpdate(selectMember.id, newStatus)} />
            <ActivateMembershipDialog open={activateModalOpen} onClose={() => setActivateModalOpen(false)} memberId={selectMember?.id} onSuccess={(newStatus) => handleStatusUpdate(selectMember.id, newStatus)} />

            <MembershipCardComponent open={openCardModal} onClose={() => setOpenCardModal(false)} member={selectMember} memberData={members} />
            <InvoiceSlip
                open={openInvoiceModal}
                onClose={() => {
                    setOpenInvoiceModal(false);
                    setSelectMember(null);
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
                        borderRadius: '16px',
                    },
                }}
            >
                <Box sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Attached Documents
                    </Typography>
                    {selectMember?.documents?.length ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {selectMember.documents.map((doc, index) => {
                                const ext = doc.file_path.split('.').pop().toLowerCase();

                                if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                                    return (
                                        <Box key={index} sx={{ width: 100, textAlign: 'center' }}>
                                            <img
                                                src={doc.file_path}
                                                alt={`Document ${index + 1}`}
                                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                                                onClick={() => window.open(doc.file_path, '_blank')}
                                            />
                                            <Typography variant="caption" sx={{ mt: 0.75, display: 'block' }}>
                                                Image
                                            </Typography>
                                        </Box>
                                    );
                                }

                                if (ext === 'pdf') {
                                    return (
                                        <Box key={index} sx={{ width: 100, textAlign: 'center' }}>
                                            <img src="/assets/pdf-icon.png" alt="PDF" style={{ width: 60, cursor: 'pointer' }} onClick={() => window.open(doc.file_path, '_blank')} />
                                            <Typography variant="caption" sx={{ mt: 0.75, display: 'block' }}>
                                                PDF
                                            </Typography>
                                        </Box>
                                    );
                                }

                                if (ext === 'docx' || ext === 'doc') {
                                    return (
                                        <Box key={index} sx={{ width: 100, textAlign: 'center' }}>
                                            <img src="/assets/word-icon.png" alt="DOCX" style={{ width: 60, cursor: 'pointer' }} onClick={() => window.open(doc.file_path, '_blank')} />
                                            <Typography variant="caption" sx={{ mt: 0.75, display: 'block' }}>
                                                Word
                                            </Typography>
                                        </Box>
                                    );
                                }

                                return null;
                            })}
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
                            No attached documents
                        </Typography>
                    )}
                </Box>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={() => setOpenDocumentModal(false)}>
                        Close
                    </Button>
                </Box>
            </Drawer>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#dc2626' }}>
                        Are you sure you want to delete this member?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="error" variant="outlined" onClick={confirmDelete} autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
