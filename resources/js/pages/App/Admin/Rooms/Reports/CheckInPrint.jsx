import { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

const CheckInPrint = ({ bookings = [], filters = {}, generatedAt = '' }) => {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            confirmed: 'primary',
            checked_in: 'success',
            completed: 'success',
        };
        return colors[status] || 'default';
    };

    const getGuestName = (booking) => {
        if (booking.customer) return booking.customer.name;
        if (booking.member) return booking.member.full_name;
        if (booking.corporateMember) return booking.corporateMember.full_name;
        if (booking.corporate_member) return booking.corporate_member.full_name;
        return 'Unknown';
    };

    const getMemberType = (booking) => {
        if (booking.member) return 'Member';
        if (booking.corporateMember || booking.corporate_member) return 'Corporate';
        if (booking.customer) return 'Guest';
        if (booking.employee) return 'Employee';
        return 'Unknown';
    };

    const getMembershipNo = (booking) => {
        if (booking.member) return booking.member.membership_no;
        if (booking.corporateMember) return booking.corporateMember.membership_no;
        if (booking.corporate_member) return booking.corporate_member.membership_no;
        if (booking.customer) return booking.customer.customer_no;
        if (booking.employee) return booking.employee.employee_id || booking.employee.employee_no || booking.employee.id;
        return '-';
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#fff' }}>
            <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Check-in Report
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {(filters.check_in_from || '') + (filters.check_in_to ? ` to ${filters.check_in_to}` : '')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Generated: {generatedAt}
                </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #ddd' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Member / Guest</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Membership No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Member Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Check In</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Check Out</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell>{booking.booking_no || booking.booking_number || booking.id}</TableCell>
                                <TableCell>{booking.room?.name || booking.room?.room_number || '-'}</TableCell>
                                <TableCell>{getGuestName(booking)}</TableCell>
                                <TableCell>{getMembershipNo(booking)}</TableCell>
                                <TableCell>{getMemberType(booking)}</TableCell>
                                <TableCell>{booking.check_in_date}</TableCell>
                                <TableCell>{booking.check_out_date}</TableCell>
                                <TableCell>
                                    <Chip label={booking.status} size="small" color={getStatusColor(booking.status)} variant="outlined" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Total Records: {bookings.length}
                </Typography>
            </Box>
        </Box>
    );
};

CheckInPrint.layout = (page) => page;

export default CheckInPrint;
