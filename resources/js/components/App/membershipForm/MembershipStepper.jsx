import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const MembershipStepper = ({ step, onStepClick }) => {
    const steps = [
        { number: 1, label: 'Personal Information' },
        { number: 2, label: 'Contact Information' },
        { number: 3, label: 'Membership Information' },
        { number: 4, label: 'Profession & Referral' },
        { number: 5, label: 'Card' },
        { number: 6, label: 'Family Cards' },
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                mb: 3,
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                overflowX: 'auto', // Handle overflow on small screens
            }}
        >
            {steps.map((s) => {
                const isActive = step === s.number;
                const isCompleted = step > s.number;

                return (
                    <Box
                        key={s.number}
                        onClick={() => onStepClick && onStepClick(s.number)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            opacity: isActive || isCompleted ? 1 : 0.6, // Visual cue for inactive steps
                            '&:hover': {
                                opacity: 1,
                            },
                            minWidth: 'fit-content', // Prevent squishing
                            mr: 2,
                        }}
                    >
                        <Box
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                backgroundColor: isActive || isCompleted ? '#063455' : '#e0e0e0',
                                color: isActive || isCompleted ? 'white' : '#333',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1, // Reduced margin slightly
                            }}
                        >
                            {isCompleted ? <CheckCircleIcon fontSize="small" /> : s.number}
                        </Box>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.9rem', color: isActive ? '#063455' : '#666' }}>{s.label}</Typography>
                    </Box>
                );
            })}
        </Paper>
    );
};

export default MembershipStepper;
