import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    Grid,
    Button,
    Typography,
    Box,
    Card,
    InputBase,
    CardContent,
    Paper,
    Avatar,
    Divider,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import { FilterAlt, ArrowBack } from "@mui/icons-material"
import SearchIcon from '@mui/icons-material/Search';
import { router } from '@inertiajs/react';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const AttendanceReport = () => {
    // const [open, setOpen] = useState(true);

    const employees = [
        {
            id: 20,
            name: 'John Doe',
            position: 'Designer',
            photo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.PNG-DCX6Sx2PGC9f35Hp0i4JH2AL1oxzpX.png', // Replace with actual photo URL
            stats: {
                totalLeave: 6,
                totalAttendance: 30,
                totalAbsent: 10,
                totalLet: 0
            }
        },
        {
            id: 21,
            name: 'Jane Smith',
            position: 'Developer',
            photo: 'https://randomuser.me/api/portraits/women/44.jpg',
            stats: {
                totalLeave: 4,
                totalAttendance: 32,
                totalAbsent: 8,
                totalLet: 2
            }
        },
        {
            id: 22,
            name: 'Mike Johnson',
            position: 'Project Manager',
            photo: 'https://randomuser.me/api/portraits/men/32.jpg',
            stats: {
                totalLeave: 3,
                totalAttendance: 35,
                totalAbsent: 5,
                totalLet: 1
            }
        },
        {
            id: 23,
            name: 'Micheal Dougles',
            position: 'Project Manager',
            photo: 'https://randomuser.me/api/portraits/men/32.jpg',
            stats: {
                totalLeave: 3,
                totalAttendance: 35,
                totalAbsent: 5,
                totalLet: 1
            }
        }
    ];

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
                <Box sx={{
                    px: 8,
                    py: 2
                }}>
                    {/* Header with back button and title */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            pt: 2
                        }}
                    >
                        {/* Left: Back + Title */}
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {/* <IconButton style={{ color: "#063455" }} onClick={() => window.history.back()}>
                                <ArrowBack />
                            </IconButton> */}
                            <h2
                                className="mb-0"
                                style={{
                                    color: "#063455",
                                    // fontSize: '30px',
                                    fontWeight: 600
                                }}
                            >
                                Attendance Report
                            </h2>
                        </Box>

                        {/* Right: Search + Filter */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                            {/* Search Bar */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    border: "1px solid #121212",
                                    borderRadius: "4px",
                                    width: "350px",
                                    height: '40px',
                                    padding: "4px 8px",
                                    backgroundColor: '#FFFFFF',
                                    mr: 2  // <-- Add margin to the right of search bar
                                }}
                            >
                                <SearchIcon style={{ color: "#121212", marginRight: "8px" }} />
                                <InputBase
                                    placeholder="Search employee member here"
                                    fullWidth
                                    sx={{ fontSize: "14px" }}
                                    inputProps={{ style: { padding: 0 } }}
                                />
                            </Box>

                            {/* Filter Button */}
                            <Button
                                variant="outlined"
                                startIcon={<FilterAlt />}
                                style={{
                                    border: '1px solid #063455',
                                    color: '#333',
                                    textTransform: 'none',
                                    backgroundColor: 'transparent',
                                }}
                                onClick={() => {
                                    setOpenFilter(true);
                                }}
                            >
                                Filter
                            </Button>
                        </Box>
                    </Box>

                    {/* Form Card */}
                    <div className="row">
                        {employees.map((employee, index) => (
                            <div className="col-md-4 mb-2 mt-5" key={index}>
                                <Card
                                    sx={{
                                        maxWidth: 340,
                                        height: 450,
                                        borderRadius: 3,
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                        // overflow: 'visible',
                                        position: 'relative',
                                        pb: 1
                                    }}
                                >
                                    <CardContent sx={{ p: 0 }}>
                                        {/* Profile Photo */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                mt: 2
                                            }}
                                        >
                                            <Avatar
                                                src={employee.photo}
                                                sx={{
                                                    width: 89,
                                                    height: 89,
                                                    border: '2px solid #949494',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        </Box>

                                        {/* Employee ID */}
                                        <Typography
                                            align="center"
                                            sx={{ mt: 2, fontWeight: 500, fontSize: '16px', color: '#979797' }}
                                        >
                                            Employ ID : {employee.id}
                                        </Typography>

                                        {/* Divider */}
                                        <Divider
                                            sx={{
                                                my: 2,
                                                borderStyle: 'dotted',
                                                borderColor: '#D8D8D8',
                                                borderWidth: '1px',
                                                opacity: 1, // Ensures it's not too transparent
                                            }}
                                        />

                                        {/* Name and Position */}
                                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '22px', color: '#363636' }}>
                                                {employee.name}
                                            </Typography>
                                            <Typography sx={{ color: '#3C3C3C', fontWeight: 500, fontSize: '16px' }}>
                                                {employee.position}
                                            </Typography>
                                        </Box>

                                        {/* Stats Grid */}
                                        <Grid container spacing={2} sx={{ px: 2, mb: 2 }}>
                                            {[
                                                { label: 'Total Leave', value: employee.stats.totalLeave },
                                                { label: 'Total Attendance', value: employee.stats.totalAttendance },
                                                { label: 'Total Absent', value: employee.stats.totalAbsent },
                                                { label: 'Total Let', value: employee.stats.totalLet }
                                            ].map((item, index) => (
                                                <Grid item xs={6} key={index}>
                                                    <Paper
                                                        elevation={3}
                                                        sx={{
                                                            bgcolor: '#F9F9F9',
                                                            p: 2,
                                                            textAlign: 'center',
                                                            borderRadius: 2,
                                                            height: 80,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'center',
                                                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.08)'
                                                        }}
                                                    >
                                                        <Typography sx={{color:'#000000', fontWeight:700, fontSize:'20px'}}>
                                                            {item.value}
                                                        </Typography>
                                                        <Typography sx={{color:'#717171', fontWeight:500, fontSize:'13px'}}>
                                                            {item.label}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>

                                        {/* Bottom Bar */}
                                        <Box
                                            sx={{
                                                height: 10,
                                                bgcolor: '#0a3d62',
                                                borderBottomLeftRadius: 12,
                                                borderBottomRightRadius: 12,
                                                position: 'absolute',
                                                bottom: 0,
                                                width: '100%'
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </Box>
            {/* </div> */}
        </>
    );
};

export default AttendanceReport;