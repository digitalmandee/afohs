import { Box, Grid, InputAdornment, Paper, TextField, Typography } from '@mui/material';

const AmountForm = () => {
    return (
        <Paper
            sx={{
                width: '100%',
                maxWidth: 600,
                mx: 'auto',
                mt: 2,
                p: 3,
                borderRadius: 1,
            }}
        >
            {/* Customer #1 */}
            <Box sx={{ mb: 5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Customer #1
                </Typography>
                <Grid
                    container
                    spacing={2}
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start', // optional
                    }}
                >
                    <Grid item xs={6}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Customer Name
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="e.g. Andy"
                            size="small"
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                },
                            }}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Input Amount
                        </Typography>
                        <TextField
                            fullWidth
                            defaultValue="26.32"
                            size="small"
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography variant="body2">Rs</Typography>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* Customer #2 */}
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Customer #2
                </Typography>

                <Grid
                    container
                    spacing={2}
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start', // optional
                    }}
                >
                    <Grid item xs={6}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Customer Name
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="e.g. Andy"
                            size="small"
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                },
                            }}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Input Amount
                        </Typography>
                        <TextField
                            fullWidth
                            defaultValue="26.32"
                            size="small"
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography variant="body2">Rs</Typography>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};
AmountForm.layout = (page) => page;
export default AmountForm;
