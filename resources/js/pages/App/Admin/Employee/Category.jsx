import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    Button,
    Card,
    CardContent,
    Typography,
    IconButton,
    Box,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { router } from '@inertiajs/react';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const LeaveCategory = () => {
    // const [open, setOpen] = useState(true);
    // Member types data
    const leaveTypes = [
        {
            title: 'Annual Leave',
            added: '10 Jun 2024',
            status: 'Published',
            description: 'Can be availed once a year'
        },
        {
            title: 'Sick Leave',
            added: '5 Jun 2024',
            status: 'Published',
            description: 'Can be availed when sick with medical certificate'
        },
        {
            title: 'Casual Leave',
            added: '1 Jun 2024',
            status: 'Draft',
            description: 'Can be availed for personal matters'
        }
    ];

    // Custom checkbox with check icon
    const CustomCheckbox = ({ label }) => (
        <div className="d-flex align-items-center mb-2">
            <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                backgroundColor: '#063455',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '8px'
            }}>
                <CheckIcon style={{ color: 'white', fontSize: '16px' }} />
            </div>
            <Typography style={{
                color: '#555',
                fontSize: '14px'
            }}>
                {label}
            </Typography>
        </div>
    );

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
                <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                    {/* Header with back button, title, and add type button */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center">
                            <ArrowBackIcon style={{
                                cursor: 'pointer',
                                marginRight: '10px',
                                color: '#555',
                                fontSize: '24px'
                            }} />
                            <Typography variant="h5" style={{
                                fontWeight: 500,
                                color: '#333',
                                fontSize: '24px'
                            }}>
                                Leave Category
                            </Typography>
                        </div>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            style={{
                                backgroundColor: '#063455',
                                textTransform: 'none',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '8px 16px',
                                fontSize: '14px'
                            }}
                        onClick={()=>router.visit('/employee/add/leave/category')}
                        >
                            Add Leave
                        </Button>
                    </div>

                    {/* Member Type Cards */}
                    <div className="row">
                        {leaveTypes.map((leaveType, index) => (
                            <div className="col-md-4 mb-4" key={index}>
                                <Card style={{
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    height: '100%',
                                    border: "1px solid #E3E3E3",
                                    borderRadius: '8px'
                                }}>
                                    <div className="p-3">
                                        {/* Card Header with Title and Menu */}
                                        <div
                                            className="d-flex justify-content-between align-items-center mb-3"
                                            style={{
                                                paddingBottom: '8px',
                                            }}
                                        >
                                            <Typography style={{
                                                fontWeight: 600,
                                                color: '#000',
                                                fontSize: '16px'
                                            }}>
                                                {leaveType.title}
                                            </Typography>
                                            <IconButton size="small">
                                                <MoreVertIcon style={{ color: '#555' }} />
                                            </IconButton>
                                        </div>

                                        {/* Added and Status Row */}
                                        <div className="d-flex justify-content-between mb-2">
                                            <div>
                                                <Typography style={{ color: '#000', fontSize: '14px', fontWeight: 500 }}>
                                                    Added
                                                </Typography>
                                                <Typography style={{ color: '#666', fontSize: '14px' }}>
                                                    {leaveType.added}
                                                </Typography>
                                            </div>
                                            <div>
                                                <Typography style={{ color: '#000', fontSize: '14px', fontWeight: 500, textAlign: 'right' }}>
                                                    Status
                                                </Typography>
                                                <Typography style={{ color: '#666', fontSize: '14px', textAlign: 'right' }}>
                                                    {leaveType.status}
                                                </Typography>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="mt-3">
                                            <Typography style={{ color: '#000', fontSize: '14px', fontWeight: 500 }}>
                                                Description
                                            </Typography>
                                            <Typography style={{ color: '#666', fontSize: '14px' }}>
                                                {leaveType.description}
                                            </Typography>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            {/* </div> */}
        </>
    );
};

export default LeaveCategory;