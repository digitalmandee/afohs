import React from 'react'
import { Grid, Typography, Box, CardContent, TableCell, TableHead, TableContainer, Table, TableBody, TableRow, Button, Paper } from "@mui/material";
const SalaryDetail = () => {
    const paymentInfo = {
        method: "Bank transfer",
        accountNumber: "1234 5678 9012",
        date: "Dec 01, 2024",
        status: "Paid",
    };

    const salaryDetails = [
        { category: "Basic Salary", amount: 30000 },
        { category: "Bonus", amount: 200 },
        { category: "Deductions", amount: -100 },
        { category: "Net Salary", amount: 30000 },
    ];

    return (
        <>
            <Grid container justifyContent="center">
                <Grid item xs={12}>
                    {/* Salary Detail Section */}

                    <CardContent>
                        <Box sx={{
                            width: '100%',
                            bgcolor: '#E3E3E3',
                            height: '52px',
                            px: 2,
                            py: 1.5,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Typography sx={{
                                color: '#063455',
                                fontWeight: 700,
                                fontSize: '16px'
                            }}>
                                Salary Detail
                            </Typography>
                        </Box>
                        <TableContainer component={Paper} elevation={0} sx={{ marginTop: "1rem" }}>
                            <Table>
                                {/* Table Header */}
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#FCF7EF" }}>
                                        <TableCell sx={{ fontWeight: "bold", border: "1px solid #B0BEC5" }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: "bold", border: "1px solid #B0BEC5" }} align="left">
                                            Amount
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                {/* Table Body */}
                                <TableBody>
                                    {salaryDetails.map((row) => (
                                        <TableRow key={row.category}>
                                            <TableCell
                                                component="th"
                                                scope="row"
                                                sx={{
                                                    width: "50%",
                                                    border: "1px solid #B0BEC5",
                                                }}>
                                                {row.category}
                                            </TableCell>
                                            <TableCell align="left" sx={{ border: "1px solid #B0BEC5" }}>
                                                {row.amount.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>

                    {/* Payment Information Section */}
                    <Grid item xs={12}>
                        <CardContent>
                            <Box sx={{ mt: -2, display: 'flex', justifyContent: "flex-end", alignItems: "center" }}>
                                <Typography sx={{
                                    color: "#063455",
                                    fontWeight: 500,
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}>
                                    View all
                                </Typography>
                            </Box>
                            <Box sx={{
                                width: '100%',
                                bgcolor: '#E3E3E3',
                                height: '52px',
                                px: 2,
                                py: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                mt: 2
                            }}>
                                <Typography sx={{
                                    color: '#063455',
                                    fontWeight: 700,
                                    fontSize: '16px'
                                }}>
                                    Payment Detail
                                </Typography>
                            </Box>


                            <TableContainer
                                component={Paper}
                                elevation={0}
                                style={{
                                    marginTop: "1rem",
                                }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ backgroundColor: "#FCF7EF" }}>Payment Method</TableCell>
                                            <TableCell sx={{ backgroundColor: "#FCF7EF" }}>Bank Account</TableCell>
                                            <TableCell sx={{ backgroundColor: "#FCF7EF" }}>Payment Date</TableCell>
                                            <TableCell sx={{ backgroundColor: "#FCF7EF" }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>{paymentInfo.method}</TableCell>
                                            <TableCell>{paymentInfo.accountNumber}</TableCell>
                                            <TableCell>{paymentInfo.date}</TableCell>
                                            <TableCell>{paymentInfo.status}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Grid container justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                                <Grid item>
                                    <Button variant="outlined" sx={{ textTransform: "none" }}>
                                        Export
                                    </Button>
                                </Grid>
                                <Grid item>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            bgcolor: "#0A2647",
                                            "&:hover": {
                                                bgcolor: "#0A2647",
                                            },
                                            textTransform: "none",
                                        }}>
                                        Save
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Grid>
                </Grid>
            </Grid>
        </>
    )
}

export default SalaryDetail
