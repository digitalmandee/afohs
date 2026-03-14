import { Box, Button, Paper, Typography, TextField, Select, MenuItem, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useState } from 'react';

const CancelOrder = ({ onClose, onConfirm, order }) => {
    const [remark, setRemark] = useState(order.remark || 'CANCELLED BY CUSTOMER');
    const [instructions, setInstructions] = useState(order.instructions || '');
    const [cancelType, setCancelType] = useState(order.cancelType || 'void');

    const handleConfirm = () => {
        onConfirm({
            remark,
            instructions,
            cancelType,
        });
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                top: '1px',
                left: '50%',
                transform: 'translate(-50%, 0)',
                zIndex: 1000,
                bgcolor: 'rgba(0,0,0,0.5)',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                pt: 5,
            }}
        >
            <Paper
                sx={{
                    width: '100%',
                    maxWidth: 600,
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: 3,
                }}
            >
                {/* Header */}
                <Box sx={{ p: 3, pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#121212' }}>
                        Cancel Order
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#121212',
                            fontWeight: 700,
                            fontSize: '18px',
                            mt: 1,
                        }}
                    >
                        Please provide cancellation details:
                    </Typography>
                </Box>

                {/* Form Fields */}
                <Box
                    sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    {/* Remark dropdown */}
                    <FormControl fullWidth>
                        <InputLabel>Remark</InputLabel>
                        <Select value={remark} label="Remark" onChange={(e) => setRemark(e.target.value)}>
                            <MenuItem value="CANCELLED BY CUSTOMER">CANCELLED BY CUSTOMER</MenuItem>
                            <MenuItem value="GUEST MIND CHANGE">GUEST MIND CHANGE</MenuItem>
                            <MenuItem value="FOOD COMPLAIN">FOOD COMPLAIN</MenuItem>
                            <MenuItem value="GUEST DIDN'T PICK THE CALL">GUEST DIDN'T PICK THE CALL</MenuItem>
                            <MenuItem value="GUEST DIDN'T LIKE THE FOOD">GUEST DIDN'T LIKE THE FOOD</MenuItem>
                            <MenuItem value="OTHER">OTHER</MenuItem>
                            <MenuItem value="WRONG PUNCHING">WRONG PUNCHING</MenuItem>
                            <MenuItem value="RUN OUT">RUN OUT</MenuItem>
                            <MenuItem value="DIDN'T SERVED">DIDN'T SERVED</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Instructions */}
                    <TextField label="Instructions" multiline rows={2} fullWidth value={instructions} onChange={(e) => setInstructions(e.target.value)} />

                    {/* Cancel Type */}
                    <RadioGroup row value={cancelType} onChange={(e) => setCancelType(e.target.value)}>
                        <FormControlLabel value="void" control={<Radio />} label="Void" />
                        <FormControlLabel value="return" control={<Radio />} label="Return" />
                        <FormControlLabel value="complementary" control={<Radio />} label="Complementary" />
                    </RadioGroup>
                </Box>

                {/* Action Buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 3,
                        borderTop: '1px solid #f0f0f0',
                        p: 2,
                        justifyContent: 'space-evenly',
                    }}
                >
                    <Button
                        fullWidth
                        sx={{
                            py: 1.5,
                            border: '1px solid black',
                            borderRadius: 0,
                            color: '#4b5563',
                            textTransform: 'none',
                        }}
                        onClick={onClose}
                    >
                        No
                    </Button>

                    <Button
                        fullWidth
                        sx={{
                            py: 1.5,
                            bgcolor: '#f44336',
                            color: 'white',
                            borderRadius: 0,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#e53935' },
                        }}
                        onClick={handleConfirm}
                    >
                        Confirm Cancel
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};
CancelOrder.layout = (page) => page;
export default CancelOrder;
