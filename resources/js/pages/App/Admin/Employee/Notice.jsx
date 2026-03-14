import React from 'react'
import { Grid, Typography, Box, TableCell, TableHead, TableContainer, Table, TableBody, TableRow, Paper } from "@mui/material";
const NoticeDetail = () => {

    const noticeInfo = [
        {
            method: "Policy Update – Remote Work",
            date: "2024-12-15",
            status: "Active",
        },
        {
            method: "Holiday Schedule Announcement",
            date: "2024-11-20",
            status: "Archived",
        },
        {
            method: "Team Meeting Reminder",
            date: "2024-10-05",
            status: "Active",
        },
        {
            method: "System Maintenance Notice",
            date: "2024-09-18",
            status: "Resolved",
        },
    ];

    return (
        <>
            <Grid container justifyContent="center">
                <Grid item xs={12} sx={{
                    px: 2
                }}>
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
                            Notes
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
                                    <TableCell sx={{ backgroundColor: "#FCF7EF", fontWeight: 500, fontSize: '16px' }}>Notice</TableCell>
                                    <TableCell sx={{ backgroundColor: "#FCF7EF", fontWeight: 500, fontSize: '16px' }}>Date</TableCell>
                                    <TableCell sx={{ backgroundColor: "#FCF7EF", fontWeight: 500, fontSize: '16px' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {noticeInfo.map((notice) => (
                                    <TableRow key={notice.id}>
                                        <TableCell>{notice.method}</TableCell>
                                        <TableCell>{notice.date}</TableCell>
                                        <TableCell>{notice.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </>
    )
}

export default NoticeDetail
