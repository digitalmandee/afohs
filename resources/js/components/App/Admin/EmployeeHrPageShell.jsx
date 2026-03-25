import React from 'react';
import { Box } from '@mui/material';
import AppPage from '@/components/App/ui/AppPage';

export default function EmployeeHrPageShell({ eyebrow = 'Employee HR', title, subtitle, actions, children }) {
    return (
        <Box sx={{ px: { xs: 1, md: 2 }, py: { xs: 1.5, md: 2.5 } }}>
            <AppPage eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions}>
                {children}
            </AppPage>
        </Box>
    );
}
