import React from 'react';
import { Box, InputAdornment, Popover, TextField } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { DateRangePicker } from 'react-date-range';
import { format, parseISO } from 'date-fns';
import { compactDateFieldSx } from '@/components/App/ui/dateFieldStyles';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const buildSelection = (from, to) => {
    const startDate = from ? parseISO(from) : new Date();
    const endDate = to ? parseISO(to) : from ? parseISO(from) : new Date();

    return {
        startDate,
        endDate,
        key: 'selection',
    };
};

const formatLabel = (from, to, placeholder) => {
    if (!from && !to) {
        return placeholder;
    }

    if (from && to) {
        return `${format(parseISO(from), 'dd/MM/yyyy')} - ${format(parseISO(to), 'dd/MM/yyyy')}`;
    }

    if (from) {
        return `${format(parseISO(from), 'dd/MM/yyyy')} -`;
    }

    return `- ${format(parseISO(to), 'dd/MM/yyyy')}`;
};

export default function CompactDateRangePicker({
    label = 'Date Range',
    from = '',
    to = '',
    onChange,
    placeholder = 'Select range',
}) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const selection = React.useMemo(() => buildSelection(from, to), [from, to]);

    const handleRangeChange = (ranges) => {
        const nextSelection = ranges.selection;
        onChange({
            from: nextSelection.startDate ? format(nextSelection.startDate, 'yyyy-MM-dd') : '',
            to: nextSelection.endDate ? format(nextSelection.endDate, 'yyyy-MM-dd') : '',
        });
    };

    return (
        <>
            <TextField
                size="small"
                fullWidth
                label={label}
                value={formatLabel(from, to, placeholder)}
                onClick={(event) => setAnchorEl(event.currentTarget)}
                InputProps={{
                    readOnly: true,
                    endAdornment: (
                        <InputAdornment position="end">
                            <CalendarToday fontSize="small" />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    ...compactDateFieldSx,
                    '& .MuiInputBase-input': {
                        cursor: 'pointer',
                        ...compactDateFieldSx['& .MuiInputBase-input'],
                    },
                }}
            />
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 36px rgba(15, 23, 42, 0.16)',
                        border: '1px solid rgba(226,232,240,0.95)',
                    },
                }}
            >
                <Box
                    sx={{
                        '& .rdrDateRangeWrapper': {
                            fontFamily: 'inherit',
                        },
                        '& .rdrMonthAndYearWrapper': {
                            px: 1.5,
                            py: 1,
                        },
                        '& .rdrMonth': {
                            width: 300,
                            px: 1,
                            pb: 1,
                        },
                        '& .rdrWeekDays, & .rdrDays': {
                            px: 0.5,
                        },
                        '& .rdrDayNumber span': {
                            fontSize: '0.85rem',
                            color: '#1f2937',
                        },
                        '& .rdrDay': {
                            height: 38,
                        },
                        '& .rdrDayToday .rdrDayNumber span:after': {
                            background: '#0c67a7',
                        },
                        '& .rdrSelected, & .rdrInRange, & .rdrStartEdge, & .rdrEndEdge': {
                            color: '#0c67a7',
                        },
                    }}
                >
                    <DateRangePicker
                        onChange={handleRangeChange}
                        ranges={[selection]}
                        moveRangeOnFirstSelection={false}
                        months={1}
                        direction="horizontal"
                        rangeColors={['#0c67a7']}
                        showDateDisplay={false}
                    />
                </Box>
            </Popover>
        </>
    );
}
