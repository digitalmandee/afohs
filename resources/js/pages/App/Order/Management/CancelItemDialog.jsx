import { Box, Button, Dialog, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

const CancelItemDialog = ({ open, onClose, onConfirm, item }) => {
    const [quantity, setQuantity] = useState('1');
    const [remark, setRemark] = useState('CANCELLED BY CUSTOMER');
    const [instructions, setInstructions] = useState('');
    const [cancelType, setCancelType] = useState('void');

    useEffect(() => {
        if (open && item) {
            setQuantity(String(item.order_item.quantity));
            setRemark('CANCELLED BY CUSTOMER');
            setInstructions('');
            setCancelType('void');
        }
    }, [open, item]);

    const handleConfirm = () => {
        const numericQty = parseInt(quantity, 10);
        const maxQty = Number(item?.order_item?.quantity || 1);
        const safeQty = Number.isFinite(numericQty) ? Math.max(1, Math.min(numericQty, maxQty)) : 1;
        onConfirm({
            quantity: safeQty,
            remark,
            instructions,
            cancelType,
        });
    };

    if (!item) return null;

    const maxQty = item.order_item.quantity;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Cancel Item: {item.order_item.name}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Quantity Input */}
                    <TextField
                        label="Quantity to Cancel"
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                            const rawValue = e.target.value;
                            if (rawValue === '') {
                                setQuantity('');
                                return;
                            }
                            if (/^\d+$/.test(rawValue)) {
                                const val = parseInt(rawValue, 10);
                                if (val > 0 && val <= maxQty) {
                                    setQuantity(rawValue);
                                }
                            }
                        }}
                        onBlur={() => {
                            const numericQty = parseInt(quantity, 10);
                            const safeQty = Number.isFinite(numericQty) ? Math.max(1, Math.min(numericQty, maxQty)) : 1;
                            setQuantity(String(safeQty));
                        }}
                        inputProps={{ min: 1, max: maxQty }}
                        helperText={`Max: ${maxQty}`}
                        fullWidth
                    />

                    {/* Remark Dropdown */}
                    <FormControl fullWidth>
                        <InputLabel>Reason</InputLabel>
                        <Select value={remark} label="Reason" onChange={(e) => setRemark(e.target.value)}>
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
                    <TextField label="Additional Remarks" multiline rows={2} fullWidth value={instructions} onChange={(e) => setInstructions(e.target.value)} />

                    {/* Cancel Type */}
                    <FormControl component="fieldset">
                        <Typography variant="caption" color="text.secondary">
                            Cancel Type
                        </Typography>
                        <RadioGroup row value={cancelType} onChange={(e) => setCancelType(e.target.value)}>
                            <FormControlLabel value="void" control={<Radio size="small" />} label="Void" />
                            <FormControlLabel value="return" control={<Radio size="small" />} label="Return" />
                            <FormControlLabel value="complementary" control={<Radio size="small" />} label="Comp." />
                        </RadioGroup>
                    </FormControl>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                        <Button onClick={onClose} variant="outlined" color="inherit">
                            Back
                        </Button>
                        <Button onClick={handleConfirm} variant="contained" color="error">
                            Confirm Cancel
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default CancelItemDialog;
