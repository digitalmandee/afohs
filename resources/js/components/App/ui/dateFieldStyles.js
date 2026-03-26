export const compactDateFieldSx = {
    width: '100%',
    '& .MuiInputLabel-root': {
        fontSize: '0.88rem',
        fontWeight: 600,
        color: '#6b7280',
    },
    '& .MuiOutlinedInput-root': {
        minHeight: 42,
        borderRadius: '12px',
        backgroundColor: '#fff',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(203,213,225,0.92)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148,163,184,0.92)',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(12,103,167,0.55)',
            borderWidth: 1.5,
        },
    },
    '& .MuiInputBase-input': {
        fontSize: '0.94rem',
        paddingTop: '10px',
        paddingBottom: '10px',
    },
    '& .MuiSvgIcon-root': {
        fontSize: '1.1rem',
        color: '#52606d',
    },
};

export const compactDateTextFieldProps = {
    size: 'small',
    fullWidth: true,
};

export const compactDateActionBar = {
    actions: ['clear', 'today', 'accept'],
};

export const compactCalendarSx = {
    width: '100%',
    maxWidth: 320,
    mx: 'auto',
    '& .MuiPickersCalendarHeader-root': {
        mt: 0,
        mb: 0.5,
        px: 0.5,
    },
    '& .MuiPickersCalendarHeader-label': {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#1f2937',
    },
    '& .MuiDayCalendar-header': {
        justifyContent: 'space-between',
        mx: 0.5,
    },
    '& .MuiDayCalendar-weekContainer': {
        justifyContent: 'space-between',
        mx: 0.5,
    },
    '& .MuiDayCalendar-weekDayLabel': {
        width: 34,
        fontSize: '0.76rem',
        color: '#8a94a6',
    },
    '& .MuiPickersDay-root': {
        width: 34,
        height: 34,
        margin: '0 1px',
        fontSize: '0.9rem',
        borderRadius: '10px',
        fontWeight: 600,
    },
};
