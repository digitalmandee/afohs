import React from 'react';
import { Grid } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function DateField({ label, value, onChange, fullWidth = true }) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label={label}
                format="DD/MM/YYYY"
                value={value ? dayjs(value) : null}
                onChange={(nextValue) => onChange(nextValue ? nextValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                    textField: {
                        size: 'small',
                        fullWidth,
                    },
                }}
            />
        </LocalizationProvider>
    );
}

export default function DateRangeFilterFields({
    startLabel = 'From',
    endLabel = 'To',
    startValue = '',
    endValue = '',
    onStartChange,
    onEndChange,
    startGrid = { xs: 12, md: 2 },
    endGrid = { xs: 12, md: 2 },
}) {
    return (
        <>
            <Grid item {...startGrid}>
                <DateField label={startLabel} value={startValue} onChange={onStartChange} />
            </Grid>
            <Grid item {...endGrid}>
                <DateField label={endLabel} value={endValue} onChange={onEndChange} />
            </Grid>
        </>
    );
}
