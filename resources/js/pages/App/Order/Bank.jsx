import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, Chip, FormControl, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { useState } from 'react';

const BankScreen = () => {
    const [selectedBank, setSelectedBank] = useState('Sea Bank');

    const banks = ['Sea Bank', 'CNBC Bank', 'Citibank', 'OCBC NISP'];

    const handleBankChange = (bank) => {
        setSelectedBank(bank);
    };

    return (
        <Paper
            elevation={1}
            sx={{
                width: '100%',
                maxWidth: 500,
                mx: 'auto',
                p: 3,
                borderRadius: 1,
            }}
        >
            {/* Bank Selection */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1.5 }}>
                    Choose Bank Store
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {banks.map((bank) => (
                        <Chip
                            key={bank}
                            label={bank}
                            onClick={() => handleBankChange(bank)}
                            sx={{
                                bgcolor: selectedBank === bank ? '#0c4a6e' : '#f0f0f0',
                                color: selectedBank === bank ? 'white' : '#333',
                                borderRadius: 1,
                                py: 0.5,
                                '&:hover': {
                                    bgcolor: selectedBank === bank ? '#0c4a6e' : '#e0e0e0',
                                },
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Account Number */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Customer Account Number
                </Typography>
                <TextField
                    fullWidth
                    defaultValue="SB-08543-6982"
                    size="small"
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                        },
                    }}
                />
            </Box>

            {/* Account Name */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Customer Account Name
                </Typography>
                <TextField
                    fullWidth
                    defaultValue="Mr. Jamal"
                    size="small"
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                        },
                    }}
                />
            </Box>

            {/* Account Bank */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Customer Account Bank
                </Typography>
                <FormControl fullWidth>
                    <Select
                        value={selectedBank}
                        onChange={(e) => handleBankChange(e.target.value)}
                        size="small"
                        IconComponent={KeyboardArrowDownIcon}
                        sx={{
                            borderRadius: 1,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(0, 0, 0, 0.23)',
                            },
                        }}
                    >
                        {banks.map((bank) => (
                            <MenuItem key={bank} value={bank}>
                                {bank}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Notes */}
            <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Notes
                </Typography>
                <TextField
                    fullWidth
                    placeholder="e.g. lunch at [muji] coffee"
                    size="small"
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                        },
                    }}
                />
            </Box>
        </Paper>
    );
};
BankScreen.layout = (page) => page;
export default BankScreen;
