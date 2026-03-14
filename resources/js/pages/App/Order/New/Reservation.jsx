import UserAutocomplete from '@/components/UserAutocomplete';
import GuestCreateModal from '@/components/GuestCreateModal';
import { useOrderStore } from '@/stores/useOrderStore';
import { router, usePage } from '@inertiajs/react';
import { routeNameForContext } from '@/lib/utils';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Box, Button, CircularProgress, ClickAwayListener, FormControl, FormControlLabel, Grid, InputAdornment, InputLabel, MenuItem, Paper, Popper, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material';
import { StaticDatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const ReservationDialog = ({ guestTypes, floorTables = [], tablesReloadKey = 0, allrestaurants, selectedRestaurant, onRestaurantChange }) => {
    // Get from props if available (for table-based navigation)
    const { selectedTable: propsTable, tenant } = usePage().props;

    const { orderDetails, weeks, selectedWeek, monthYear, setMonthYear, handleOrderDetailChange } = useOrderStore();
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const advanceAmount = Number(orderDetails.down_payment || 0);

    // Read URL params for floor, table, and date
    const urlParams = new URLSearchParams(window.location.search);
    const urlTableId = urlParams.get('table');
    const urlDate = urlParams.get('date');

    // Local floor/table selection - prefer URL params, then props
    const [selectedTableId, setSelectedTableId] = useState('');
    const [initialized, setInitialized] = useState(false);

    // Initialize floor/table/date from URL params when floorTables are loaded
    useEffect(() => {
        if (!initialized && floorTables.length > 0) {
            // Try URL params first, then props
            const tableId = urlTableId ? parseInt(urlTableId) : propsTable?.id;

            if (tableId) {
                setSelectedTableId(tableId);
            }

            // Set date from URL if available
            if (urlDate) {
                handleOrderDetailChange('date', new Date(urlDate));
            }

            setInitialized(true);
        }
    }, [floorTables, initialized, urlTableId, urlDate, propsTable]);

    const [errors, setErrors] = useState({});
    const [Form, setForm] = useState({});

    const allTables = floorTables.flatMap((floor) =>
        (floor.tables || []).map((table) => ({
            ...table,
            floor_name: floor.name,
        })),
    );

    const selectedTable = allTables.find((t) => t.id === selectedTableId) || null;

    useEffect(() => {
        if (!tablesReloadKey) return;
        setSelectedTableId('');
        setErrors((prev) => {
            if (!prev || typeof prev !== 'object') return {};
            const { table, ...rest } = prev;
            return rest;
        });
    }, [tablesReloadKey]);

    const handleTableChange = (tableId) => {
        setSelectedTableId(tableId);
    };

    // Day Labels and Open Calendar
    const [anchorEl, setAnchorEl] = useState(null);
    const dayLabels = ['Sun', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const weekDays = weeks.find((w) => w.id === selectedWeek)?.days ?? [];

    const handleClick = (event) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const handleDateChange = (newValue) => {
        setMonthYear(newValue);
        setAnchorEl(null);
    };

    const handleMemberType = (value) => {
        handleOrderDetailChange('member_type', value);
        handleOrderDetailChange('member', {});
    };

    const handleMemberSelection = (newValue) => {
        if (!newValue) {
            handleOrderDetailChange('member', {});
            return;
        }

        if (newValue.booking_type !== 'member') {
            handleOrderDetailChange('member', newValue);
            return;
        }

        const status = String(newValue.status || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');
        const reason = newValue.status_reason || newValue.reason || '';

        if (status === 'expired') {
            enqueueSnackbar(`The membership has EXPIRED!${reason ? ` Reason: ${reason}` : ''}`, { variant: 'warning' });
            handleOrderDetailChange('member', newValue);
            return;
        }

        const blocked = new Set(['absent', 'suspended', 'terminated', 'not_assign', 'not_assigned', 'cancelled', 'inactive', 'in_suspension_process']);
        if (blocked.has(status)) {
            enqueueSnackbar(`Please consult Accounts Manager in order to continue with this Order.${reason ? ` Reason: ${reason}` : ''}`, { variant: 'error' });
            handleOrderDetailChange('member', {});
            return;
        }

        handleOrderDetailChange('member', newValue);
    };

    const handleGuestCreated = (newGuest) => {
        const formattedGuest = {
            ...newGuest,
            label: `${newGuest.name} (Guest - ${newGuest.customer_no})`,
            booking_type: 'guest',
        };

        handleOrderDetailChange('member_type', `guest-${newGuest.guest_type_id}`);
        handleOrderDetailChange('member', formattedGuest);
        setShowGuestModal(false);
    };

    const openCalendar = Boolean(anchorEl); // Renamed to avoid conflict with Autocomplete 'open' state
    const id = openCalendar ? 'month-year-picker' : undefined;

    const buildReservationInvoiceHtml = ({ reservationId, tableNo }) => {
        const name = orderDetails.member?.full_name || orderDetails.member?.name || 'Customer';
        const membershipNo = orderDetails.member?.membership_no || orderDetails.member?.employee_id || orderDetails.member?.customer_no || 'N/A';
        const typeLabel =
            orderDetails.member?.booking_type === 'member'
                ? orderDetails.member?.memberType?.name || 'Member'
                : orderDetails.member?.booking_type === 'employee'
                  ? 'Employee'
                  : 'Guest';
        const contact = orderDetails.member?.mobile_number_a || orderDetails.member?.contact || orderDetails.member?.phone_no || 'N/A';
        const dateLabel = orderDetails.date ? dayjs(orderDetails.date).format('YYYY-MM-DD') : '';
        const tenantName = tenant?.name || '';

        return `
            <html>
              <head>
                <title>Reservation Invoice</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; max-width: 300px; margin: auto; }
                </style>
              </head>
              <body>
                <div style="padding: 10px; font-family: Arial;">
                  <div style="text-align: center; margin-bottom: 10px;">
                    <img src="/assets/Logo.png" alt="AFOHS Logo" style="height: 60px;" />
                    <h5 style="margin: 5px 0;">AFOHS CLUB</h5>
                    <p style="font-size: 12px;">Enjoy the Pride</p>
                    <p style="font-size: 12px;">PAF Falcon Complex</p>
                  </div>

                  <h6 style="text-align: center; margin: 10px 0;">RESERVATION ESTIMATE</h6>

                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px;">
                    <div>
                      <p style="margin: 2px 0;"><strong>Res #:</strong> ${reservationId ?? ''}</p>
                      <p style="margin: 2px 0;"><strong>Date:</strong> ${dateLabel}</p>
                      <p style="margin: 2px 0;"><strong>Time:</strong> ${orderDetails.start_time || ''} - ${orderDetails.end_time || ''}</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 2px 0;"><strong>Table:</strong> ${tableNo || 'N/A'}</p>
                      <p style="margin: 2px 0;"><strong>Covers:</strong> ${orderDetails.person_count || ''}</p>
                      <p style="margin: 2px 0;"><strong>Server:</strong> ${tenantName}</p>
                    </div>
                  </div>

                  <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; font-size: 12px; margin-bottom: 10px;">
                    <p style="margin: 2px 0;"><strong>Name:</strong> ${name}</p>
                    <p style="margin: 2px 0;"><strong>Membership #:</strong> ${membershipNo}</p>
                    <p style="margin: 2px 0;"><strong>Type:</strong> ${typeLabel}</p>
                    <p style="margin: 2px 0;"><strong>Contact:</strong> ${contact}</p>
                  </div>

                  <div style="font-size: 12px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                      <span>Advance Paid:</span>
                      <span>${Number(orderDetails.down_payment || 0)}</span>
                    </div>
                  </div>

                  <p style="font-size: 10px; text-align: center; margin-top: 20px;">Thank you for visiting AFOHS Club!</p>
                </div>
              </body>
            </html>
        `;
    };

    const handleSaveOrder = async (redirectToMenu = false) => {
        const newErrors = {};

        if (!selectedTableId) newErrors.table = 'Please select a table.';
        if (!orderDetails.member?.id) newErrors['member.id'] = 'Please select a member.';
        if (!orderDetails.date) newErrors.date = 'Please select a date.';
        if (!orderDetails.start_time) newErrors.start_time = 'Please select start time.';
        if (!orderDetails.end_time) newErrors.end_time = 'Please select end time.';

        if (orderDetails.start_time && orderDetails.end_time) {
            const start = dayjs(orderDetails.start_time, 'HH:mm');
            const end = dayjs(orderDetails.end_time, 'HH:mm');

            if (start.isSameOrAfter(end)) {
                newErrors.end_time = 'End time must be after start time.';
            }

            const isStartAvailable = availableSlots.some((slot) => start.isSameOrAfter(dayjs(slot.start, 'HH:mm')) && start.isBefore(dayjs(slot.end, 'HH:mm')));
            const isEndAvailable = availableSlots.some((slot) => end.isAfter(dayjs(slot.start, 'HH:mm')) && end.isSameOrBefore(dayjs(slot.end, 'HH:mm')));

            if (!isStartAvailable) newErrors.start_time = 'Start time is not available.';
            if (!isEndAvailable) newErrors.end_time = 'End time is not available.';
        }

        if (!orderDetails.person_count || orderDetails.person_count < 1) newErrors.person_count = 'Please enter a valid number of persons.';
        if (!orderDetails.down_payment || Number(orderDetails.down_payment) < 1) newErrors.down_payment = 'Advance payment is required (minimum Rs. 1).';
        if ((orderDetails.paymentMode || 'Cash') !== 'Cash' && !orderDetails.paymentAccount) newErrors.paymentAccount = 'Payment account / reference is required.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            enqueueSnackbar('Please fix the errors in the form.', { variant: 'error' });
            return;
        }

        let printWindow = null;
        try {
            printWindow = window.open('', '_blank');
        } catch {
            printWindow = null;
        }

        try {
            const payload = {
                ...orderDetails,
                table: selectedTableId,
            };
            const response = await axios.post(route(routeNameForContext('order.reservation'), { restaurant_id: selectedRestaurant || undefined }), payload);
            enqueueSnackbar(response.data.message || 'Order placed successfully!', { variant: 'success' });
            enqueueSnackbar(response.data.message || 'Order placed successfully!', { variant: 'success' });

            if (printWindow) {
                const reservationId = response.data.order?.id;
                const selectedTableNo = selectedTable?.table_no;
                const html = buildReservationInvoiceHtml({ reservationId, tableNo: selectedTableNo });
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }

            if (redirectToMenu) {
                // If proceeding to menu, clear validation errors but keep details (or maybe not needed if redirecting?)
                // Actually, store handled redirect. We just need to navigate.
                // Store table selection in order details before going to menu
                handleOrderDetailChange('table', selectedTableId);
                router.visit(
                    route(routeNameForContext('order.menu'), {
                        restaurant_id: selectedRestaurant || undefined,
                        reservation_id: response.data.order.id,
                        order_type: 'reservation',
                        is_new_order: true,
                    }),
                );
            } else {
                setForm({ member: null, date: '', time: '', custom_time: '', person_count: '', down_payment: '', note: '' });
                handleOrderDetailChange('member', null);
                handleOrderDetailChange('date', null);
                handleOrderDetailChange('custom_time', '');
                handleOrderDetailChange('person_count', '');
                handleOrderDetailChange('down_payment', '');
                handleOrderDetailChange('paymentMode', 'Cash');
                handleOrderDetailChange('paymentAccount', '');
                handleOrderDetailChange('price', '');
                setErrors({});
                router.visit(route(routeNameForContext('order.new')));
            }
        } catch (error) {
            if (printWindow) {
                try {
                    printWindow.close();
                } catch {}
            }
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
                enqueueSnackbar('Validation error: Please fix the form fields.', { variant: 'error' });
            } else {
                console.error('Error saving order:', error);
                enqueueSnackbar('Failed to save order. Please try again.', { variant: 'error' });
            }
        }
    };

    const isDisabled = !orderDetails.member || Object.keys(orderDetails.member).length === 0;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F10' && !isDisabled) {
                e.preventDefault(); // Optional: prevent browser behavior
                handleSaveOrder(true);
            }
            if (e.key === 'F9') {
                e.preventDefault(); // Optional: prevent browser behavior
                handleSaveOrder(false); // Default save
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDisabled, router]);

    useEffect(() => {
        if (orderDetails.date && selectedTableId) {
            const formattedDate = dayjs(orderDetails.date).format('YYYY-MM-DD');
            console.log('Fetching time slots:', { tableId: selectedTableId, date: formattedDate, originalDate: orderDetails.date });

            setSlotsLoading(true);
            axios
                .get(route(routeNameForContext('tables.available-times'), selectedTableId), {
                    params: { date: formattedDate, restaurant_id: selectedRestaurant || undefined },
                })
                .then((res) => {
                    console.log('Time slots response:', res.data);
                    setAvailableSlots(res.data);
                })
                .catch((err) => console.error('Error fetching slots:', err))
                .finally(() => setSlotsLoading(false));
        } else {
            console.log('Cannot fetch slots - missing:', { date: orderDetails.date, tableId: selectedTableId });
            setAvailableSlots([]);
        }
    }, [orderDetails.date, selectedTableId]);

    const handleStartTimeChange = (newValue) => {
        const newStart = newValue ? newValue.format('HH:mm') : '';

        // Start cannot be after End
        if (orderDetails.end_time && newStart >= orderDetails.end_time) {
            enqueueSnackbar('Start time cannot be after or equal to End time', { variant: 'error' });
            return;
        }

        // ✅ Check if Start is inside available slots
        const isValid = availableSlots.some((slot) => newStart >= slot.start && newStart < slot.end);
        if (!isValid) {
            enqueueSnackbar('Selected start time is not in available slots', { variant: 'error' });
            return;
        }

        handleOrderDetailChange('start_time', newStart);
    };

    // ✅ Handle End Time Change
    const handleEndTimeChange = (newValue) => {
        const newEnd = newValue ? newValue.format('HH:mm') : '';

        // End cannot be before Start
        if (orderDetails.start_time && newEnd <= orderDetails.start_time) {
            enqueueSnackbar('End time cannot be before or equal to Start time', { variant: 'error' });
            return;
        }

        // ✅ Check if End is inside available slots
        const isValid = availableSlots.some((slot) => newEnd > slot.start && newEnd <= slot.end);
        if (!isValid) {
            enqueueSnackbar('Selected end time is not in available slots', { variant: 'error' });
            return;
        }

        handleOrderDetailChange('end_time', newEnd);
    };

    // ✅ Disable invalid Start Times
    const disableStartTime = (time) => {
        const formattedTime = time.format('HH:mm');

        // If End is selected, disable times >= End
        if (orderDetails.end_time && formattedTime >= orderDetails.end_time) {
            return true;
        }

        // Disable if not in available slots
        return !availableSlots.some((slot) => formattedTime >= slot.start && formattedTime < slot.end);
    };

    // ✅ Disable invalid End Times
    const disableEndTime = (time) => {
        const formattedTime = time.format('HH:mm');

        // If Start is selected, disable times <= Start
        if (orderDetails.start_time && formattedTime <= orderDetails.start_time) {
            return true;
        }

        // Disable if not in available slots
        return !availableSlots.some((slot) => formattedTime > slot.start && formattedTime <= slot.end);
    };

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    width: '100%',
                    maxWidth: '900px',
                    mx: 'auto',
                    p: 2,
                    gap: 2,
                }}
            >
                <Box sx={{ flexGrow: 1 }}>
                    {/* Order ID */}
                    <Box sx={{ mb: 2 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                display: 'flex',
                                gap: 2,
                                bgcolor: '#F6F6F6',
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid #E3E3E3',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: '16px', color: '#7F7F7F' }}>
                                    Order id:
                                </Typography>
                                <Typography variant="body1" fontWeight="600" color="#063455">
                                    #{orderDetails.order_no}
                                </Typography>
                            </Box>
                            {selectedTable?.id && (
                                <>
                                    {selectedTable?.floor_name && (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: '16px', color: '#7F7F7F' }}>
                                                Floor:
                                            </Typography>
                                            <Typography variant="body1" fontWeight="600" color="#063455">
                                                {selectedTable.floor_name}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontSize: '16px', color: '#7F7F7F' }}>
                                            Table:
                                        </Typography>
                                        <Typography variant="body1" fontWeight="600" color="#063455">
                                            {selectedTable?.table_no}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Paper>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '14px', color: '#121212' }}>
                            Booking Type
                        </Typography>
                        <RadioGroup
                            row
                            value={orderDetails.member_type}
                            onChange={(e) => {
                                handleOrderDetailChange('member_type', e.target.value);
                                handleOrderDetailChange('member', {});
                                setOptions([]);
                            }}
                        >
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: '100%' }}>
                                <FormControlLabel value="0" control={<Radio />} label="Member" sx={{ border: orderDetails.member_type == '0' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '0' ? '#FCF7EF' : 'transparent' }} />
                                <FormControlLabel value="2" control={<Radio />} label="Corporate Member" sx={{ border: orderDetails.member_type == '2' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '2' ? '#FCF7EF' : 'transparent' }} />
                                <FormControlLabel value="3" control={<Radio />} label="Employee" sx={{ border: orderDetails.member_type == '3' ? '1px solid #A27B5C' : '1px solid #E3E3E3', borderRadius: 1, px: 1, m: 0, bgcolor: orderDetails.member_type == '3' ? '#FCF7EF' : 'transparent' }} />
                                {guestTypes.map((type) => (
                                    <FormControlLabel
                                        key={type.id}
                                        value={`guest-${type.id}`}
                                        control={<Radio />}
                                        label={type.name}
                                        sx={{
                                            border: orderDetails.member_type == `guest-${type.id}` ? '1px solid #A27B5C' : '1px solid #E3E3E3',
                                            borderRadius: 1,
                                            px: 1,
                                            m: 0,
                                            bgcolor: orderDetails.member_type == `guest-${type.id}` ? '#FCF7EF' : 'transparent',
                                        }}
                                    />
                                ))}
                            </Box>
                        </RadioGroup>
                    </Box>

                    {/* Table Selection */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12}>
                            {Array.isArray(allrestaurants) && allrestaurants.length > 1 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="#121212" sx={{ mb: 1 }}>
                                        Restaurant
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="restaurant-label">Restaurant</InputLabel>
                                        <Select
                                            labelId="restaurant-label"
                                            value={selectedRestaurant || ''}
                                            label="Restaurant"
                                            onChange={(e) => onRestaurantChange?.(e.target.value)}
                                            sx={{ borderRadius: 1 }}
                                        >
                                            {allrestaurants.map((item) => (
                                                <MenuItem value={item.id} key={item.id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}
                            <Typography variant="body2" color="#121212" sx={{ mb: 1 }}>
                                Select Table
                            </Typography>
                            <FormControl fullWidth size="small" error={!!errors.table}>
                                <Select value={selectedTableId || ''} onChange={(e) => handleTableChange(e.target.value)} displayEmpty sx={{ borderRadius: 1 }}>
                                    <MenuItem value="" disabled>
                                        Select Table
                                    </MenuItem>
                                    {allTables.map((table) => (
                                        <MenuItem key={table.id} value={table.id}>
                                            {table.floor_name ? `${table.floor_name} - ` : ''}Table {table.table_no}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.table && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                        {errors.table}
                                    </Typography>
                                )}
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* Customer Name Search */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '14px', color: '#121212' }}>
                            Customer Name or Scan Member Card
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ flexGrow: 1 }}>
                                <UserAutocomplete routeUri={route(routeNameForContext('api.users.global-search'))} memberType={orderDetails.member_type} value={orderDetails.member && orderDetails.member.id ? orderDetails.member : null} onChange={(newValue) => handleMemberSelection(newValue)} label="Member / Guest Name" placeholder="Search by Name, ID, or CNIC..." />
                            </Box>
                            <Button variant="contained" onClick={() => setShowGuestModal(true)} sx={{ backgroundColor: '#063455', color: '#fff', height: '40px' }}>
                                + Add
                            </Button>
                        </Box>
                    </Box>

                    {/* Customer Qty and Down Payment */}
                    <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                        <Grid item xs={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="body2" sx={{ mb: 1, fontSize: '14px', color: '#121212' }}>
                                    Customer Qty
                                </Typography>
                                <Box sx={{ display: 'flex', width: '100%' }}>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={orderDetails.person_count}
                                        onChange={(e) => handleOrderDetailChange('person_count', e.target.value)}
                                        error={!!errors.person_count}
                                        helperText={errors.person_count}
                                        sx={{
                                            width: '60%',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 0,
                                            },
                                            '& fieldset': {
                                                borderColor: '#121212',
                                            },
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            textTransform: 'none',
                                            color: '#666',
                                            bgcolor: '#EEEEEE',
                                            borderColor: '#121212',
                                            borderRadius: 0,
                                            width: '20%',
                                            borderLeft: 'none',
                                        }}
                                    >
                                        Person
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.2 }}>
                                    <Typography variant="body2" color="#121212">
                                        Advance Amount <span style={{ color: 'red' }}>*</span>
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="text"
                                    value={orderDetails.down_payment}
                                    onChange={(e) => {
                                        const next = (e.target.value || '').replace(/\D/g, '');
                                        handleOrderDetailChange('down_payment', next);

                                        if (Number(next || 0) <= 0) {
                                            handleOrderDetailChange('paymentMode', 'Cash');
                                            handleOrderDetailChange('paymentAccount', '');
                                        }
                                    }}
                                    error={!!errors.down_payment}
                                    helperText={errors.down_payment}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 0,
                                            padding: 0,
                                            alignItems: 'stretch',
                                        },
                                        '& fieldset': {
                                            borderColor: '#121212',
                                        },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment
                                                position="start"
                                                sx={{
                                                    m: 0,
                                                    height: '200%',
                                                    display: 'flex',
                                                    alignItems: 'stretch',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        bgcolor: '#EEEEEE',
                                                        border: '1px solid #121212',
                                                        borderRadius: 0,
                                                        px: 1,
                                                        py: 0.5,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        height: '200%',
                                                        marginRight: 2,
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ lineHeight: 2.2 }}>
                                                        Rs
                                                    </Typography>
                                                </Box>
                                            </InputAdornment>
                                        ),
                                        inputMode: 'numeric',
                                    }}
                                />
                            </Box>
                        </Grid>
                        {advanceAmount > 0 && (
                            <Grid item xs={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.2 }}>
                                        <Typography variant="body2" color="#121212">
                                            Payment Mode
                                        </Typography>
                                    </Box>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Payment Mode</InputLabel>
                                        <Select name="paymentMode" value={orderDetails.paymentMode || 'Cash'} onChange={(e) => handleOrderDetailChange('paymentMode', e.target.value)} label="Payment Mode">
                                            <MenuItem value="Cash">Cash</MenuItem>
                                            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                            <MenuItem value="Credit Card">Credit Card</MenuItem>
                                            <MenuItem value="Online">Online</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                        )}
                        {advanceAmount > 0 && (orderDetails.paymentMode || 'Cash') !== 'Cash' && (
                            <Grid item xs={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.2 }}>
                                        <Typography variant="body2" color="#121212">
                                            Payment Account / Reference
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="text"
                                        value={orderDetails.paymentAccount || ''}
                                        onChange={(e) => handleOrderDetailChange('paymentAccount', e.target.value)}
                                        error={!!errors.paymentAccount}
                                        helperText={errors.paymentAccount}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 0,
                                                padding: 0,
                                                alignItems: 'stretch',
                                            },
                                            '& fieldset': {
                                                borderColor: '#121212',
                                            },
                                        }}
                                    />
                                </Box>
                            </Grid>
                        )}
                        <Grid item xs={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.2 }}>
                                    <Typography variant="body2" color="#121212">
                                        Nature of Function
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="text"
                                    value={orderDetails.nature_of_function}
                                    onChange={(e) => handleOrderDetailChange('nature_of_function', e.target.value)}
                                    error={!!errors.nature_of_function}
                                    helperText={errors.nature_of_function}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 0,
                                            padding: 0,
                                            alignItems: 'stretch',
                                        },
                                        '& fieldset': {
                                            borderColor: '#121212',
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.2 }}>
                                    <Typography variant="body2" color="#121212">
                                        Theme of Function
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="text"
                                    value={orderDetails.theme_of_function}
                                    onChange={(e) => handleOrderDetailChange('theme_of_function', e.target.value)}
                                    error={!!errors.theme_of_function}
                                    helperText={errors.theme_of_function}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 0,
                                            padding: 0,
                                            alignItems: 'stretch',
                                        },
                                        '& fieldset': {
                                            borderColor: '#121212',
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.2 }}>
                                    <Typography variant="body2" color="#121212">
                                        Arrangement Detials / Special Instructions
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="text"
                                    value={orderDetails.special_request}
                                    onChange={(e) => handleOrderDetailChange('special_request', e.target.value)}
                                    error={!!errors.special_request}
                                    helperText={errors.special_request}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 0,
                                            padding: 0,
                                            alignItems: 'stretch',
                                        },
                                        '& fieldset': {
                                            borderColor: '#121212',
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Select Date */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="#121212" mb={1}>
                                Select Date
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleClick}>
                                <Typography variant="body2" color="#063455">
                                    {new Date(monthYear).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </Typography>
                                <KeyboardArrowDownIcon fontSize="small" sx={{ ml: 1 }} />
                            </Box>
                            <Popper id={id} open={openCalendar} anchorEl={anchorEl} placement="bottom-end" sx={{ zIndex: 1300 }}>
                                <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
                                    <Box sx={{ mt: 1, p: 2, bgcolor: '#fff', boxShadow: 3, borderRadius: 1 }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <StaticDatePicker
                                                views={['year', 'month']}
                                                value={dayjs(monthYear)}
                                                onChange={handleDateChange}
                                                minDate={dayjs().add(1, 'day')}
                                                maxDate={dayjs().add(5, 'year')}
                                                disablePast={true}
                                                slotProps={{
                                                    actionBar: { actions: [] }, // Hide OK/Cancel buttons
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </Box>
                                </ClickAwayListener>
                            </Popper>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#B0DEFF', p: 0.5, borderRadius: 1 }}>
                                <CalendarTodayIcon fontSize="small" sx={{ color: '#1976d2' }} />
                                <Typography variant="caption" sx={{ ml: 0.5, color: '#1976d2' }}>
                                    {weeks.find((w) => w.id === selectedWeek)?.label}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', width: '100%', border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                            {weekDays.map((day, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        p: 1,
                                        bgcolor: day && orderDetails.date?.toDateString() === day.toDateString() ? '#B0DEFF' : '#FFFFFF',
                                        color: day ? '#121212' : '#C0C0C0',
                                        cursor: day ? 'pointer' : 'not-allowed',
                                        borderRight: index < 6 ? '1px solid #063455' : '#E3E3E3',
                                    }}
                                    onClick={() => {
                                        if (day) {
                                            handleOrderDetailChange('date', day);
                                        }
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        {dayLabels[index]}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={day && orderDetails.date?.toDateString() === day.toDateString() ? 'medium' : 'normal'}>
                                        {day ? day.getDate() : ''}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                        {errors.date && (
                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                {errors.date}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="#121212" sx={{ mb: 1 }}>
                            Available Time Slots
                        </Typography>
                        <Grid container spacing={1}>
                            {slotsLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                                    <CircularProgress size={20} />
                                    <Typography variant="caption" color="text.secondary">
                                        Loading available slots...
                                    </Typography>
                                </Box>
                            ) : availableSlots.length > 0 ? (
                                availableSlots.slice(0, 4).map(
                                    (
                                        slot,
                                        index, // ✅ Only first 4 slots
                                    ) => (
                                        <Grid item xs={3} key={index}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                onClick={() => {
                                                    handleOrderDetailChange('start_time', slot.start);
                                                    handleOrderDetailChange('end_time', slot.end);
                                                }}
                                            >
                                                {slot.start} - {slot.end}
                                            </Button>
                                        </Grid>
                                    ),
                                )
                            ) : (
                                <Typography variant="caption" color="error">
                                    No available slots for this date.
                                </Typography>
                            )}
                        </Grid>
                    </Box>

                    {/* Custom Time Selection */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                            <Typography variant="body2" color="#121212" sx={{ mb: 1 }}>
                                Start Time
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                    label="Start Time"
                                    sx={{ width: '100%' }}
                                    value={orderDetails.start_time ? dayjs(orderDetails.start_time, 'HH:mm') : null}
                                    onChange={handleStartTimeChange}
                                    shouldDisableTime={disableStartTime}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            size="small"
                                            error={!!errors.start_time}
                                            helperText={errors.start_time}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <AccessTimeIcon fontSize="small" color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Grid>

                        {/* ✅ End Time */}
                        <Grid item xs={4}>
                            <Typography variant="body2" color="#121212" sx={{ mb: 1 }}>
                                End Time
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                    label="End Time"
                                    sx={{ width: '100%' }}
                                    value={orderDetails.end_time ? dayjs(orderDetails.end_time, 'HH:mm') : null}
                                    onChange={handleEndTimeChange}
                                    shouldDisableTime={disableEndTime}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            size="small"
                                            error={!!errors.end_time}
                                            helperText={errors.end_time}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <AccessTimeIcon fontSize="small" color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={4}>
                            <Typography variant="body2" color="#121212" sx={{ mb: 1 }}>
                                Total Persons
                            </Typography>
                            <Box
                                sx={{
                                    border: 'transparent',
                                    borderRadius: 1,
                                    p: 1,
                                    height: 40,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="body1" fontWeight="medium">
                                    {orderDetails.person_count} Person
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Footer Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button variant="text" sx={{ color: '#666', textTransform: 'none' }} onClick={() => router.visit(route(routeNameForContext('order.new')))}>
                            Cancel
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{
                                textTransform: 'none',
                                border: '1px solid #063455',
                                color: '#333',
                            }}
                            onClick={() => handleSaveOrder(false)}
                        >
                            Save Order (F9)
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!orderDetails.member || !orderDetails.member.id || !selectedTableId}
                            sx={{
                                textTransform: 'none',
                                bgcolor: '#063455',
                                '&:hover': { bgcolor: '#063455CC' },
                            }}
                            onClick={() => {
                                handleSaveOrder(true);
                            }}
                        >
                            Proceed to Menu (F10)
                        </Button>
                    </Box>
                </Box>
            </Box>

            <GuestCreateModal open={showGuestModal} onClose={() => setShowGuestModal(false)} onSuccess={handleGuestCreated} guestTypes={guestTypes} storeRouteName={routeNameForContext('customers.store')} memberSearchRouteName={routeNameForContext('api.users.global-search')} memberSearchParams={{ type: '0' }} />
        </>
    );
};
ReservationDialog.layout = (page) => page;
export default ReservationDialog;
