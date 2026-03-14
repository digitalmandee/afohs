import { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { usePage, router } from '@inertiajs/react';


const EditMember = ({ memberType }) => {
    // const [open, setOpen] = useState(true);
    const [formData, setFormData] = useState({
        nameOfType: memberType.name || '',
        duration: memberType.duration || '',
        fee: memberType.fee || '',
        maintenanceFee: memberType.maintenance_fee || '',
        discountRs: memberType.discount || '',
        discountPercent: memberType.discount && memberType.fee ? ((memberType.discount / memberType.fee) * 100).toFixed(0) : '',
        discountAuthorizedBy: memberType.discount_authorized || '',
        benefit: memberType.benefit || '',
    });

    const { props } = usePage();
    const csrfToken = props._token;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'discountRs' || name === 'fee') {
            const fee = name === 'fee' ? parseFloat(value) : parseFloat(formData.fee);
            const discount = name === 'discountRs' ? parseFloat(value) : parseFloat(formData.discountRs);

            if (!isNaN(fee) && fee > 0 && !isNaN(discount)) {
                const discountPercent = ((discount / fee) * 100).toFixed(0);
                setFormData((prev) => ({ ...prev, discountPercent }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSubmit = {
            name: formData.nameOfType,
            duration: formData.duration ? parseInt(formData.duration, 10) : null,
            fee: formData.fee ? parseFloat(formData.fee) : null,
            maintenance_fee: formData.maintenanceFee ? parseFloat(formData.maintenanceFee) : null,
            discount: formData.discountRs ? parseFloat(formData.discountRs) : null,
            discount_authorized: formData.discountAuthorizedBy || null,
            benefit: formData.benefit
                ? formData.benefit
                      .split(',')
                      .map((b) => b.trim())
                      .filter((b) => b)
                : [],
        };

        try {
            console.log(route('member-types.update2', memberType.id));

            const response = await axios.post(route('member-types.update2', memberType.id), dataToSubmit);

            enqueueSnackbar('Member Type updated successfully.', { variant: 'success' });
            router.visit('/members/member-types');
        } catch (error) {
            console.error('Failed to update:', error.response?.data);
            enqueueSnackbar('Failed to update Member Type: ' + (error.response?.data?.message || error.message), { variant: 'error' });
        }
    };

    const handleBack = () => {
        router.visit('/members/member-types');
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <div
                style={{
                    // marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    // transition: 'margin-left 0.3s ease-in-out',
                    // marginTop: '5rem',
                    // backgroundColor: '#F6F6F6',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2, width: '600px' }}>
                    <IconButton onClick={handleBack} sx={{ color: '#000' }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" component="h1" sx={{ ml: 1, fontWeight: 500, color: '#333' }}>
                        Edit Membership Type
                    </Typography>
                </Box>
                <Paper sx={{ p: 3, boxShadow: 'none', border: '1px solid #e0e0e0', maxWidth: '600px', width: '100%' }}>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Name of type
                            </Typography>
                            <TextField fullWidth name="nameOfType" value={formData.nameOfType} onChange={handleInputChange} size="small" required />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Duration (months)
                            </Typography>
                            <TextField fullWidth name="duration" value={formData.duration} onChange={handleInputChange} size="small" type="number" />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Fee
                            </Typography>
                            <TextField fullWidth name="fee" value={formData.fee} onChange={handleInputChange} size="small" type="number" />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Maintenance Fee
                            </Typography>
                            <TextField fullWidth name="maintenanceFee" value={formData.maintenanceFee} onChange={handleInputChange} size="small" type="number" />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Discount (Rs)
                                </Typography>
                                <TextField fullWidth name="discountRs" value={formData.discountRs} onChange={handleInputChange} size="small" type="number" />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Discount (%)
                                </Typography>
                                <TextField fullWidth name="discountPercent" value={formData.discountPercent} onChange={handleInputChange} size="small" type="number" />
                            </Box>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Discount Authorized by
                            </Typography>
                            <TextField fullWidth name="discountAuthorizedBy" value={formData.discountAuthorizedBy} onChange={handleInputChange} size="small" />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Benefits (comma-separated)
                            </Typography>
                            <TextField fullWidth name="benefit" value={formData.benefit} onChange={handleInputChange} size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                            <Button variant="outlined" onClick={handleBack}>
                                Cancel
                            </Button>
                            <Button variant="contained" type="submit">
                                Save
                            </Button>
                        </Box>
                    </form>
                </Paper>
            </div>
        </>
    );
};

export default EditMember;
