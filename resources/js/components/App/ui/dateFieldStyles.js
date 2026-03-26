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
    maxWidth: 296,
    mx: 'auto',
    '& .MuiPickersCalendarHeader-root': {
        mt: 0,
        mb: 0.25,
        px: 0.25,
        minHeight: 36,
    },
    '& .MuiPickersCalendarHeader-label': {
        fontSize: '0.96rem',
        fontWeight: 700,
        color: '#1f2937',
    },
    '& .MuiPickersArrowSwitcher-root .MuiIconButton-root': {
        padding: 0.5,
    },
    '& .MuiPickersArrowSwitcher-root .MuiSvgIcon-root': {
        fontSize: '1.1rem',
    },
    '& .MuiDayCalendar-header': {
        justifyContent: 'space-between',
        mx: 0.25,
    },
    '& .MuiDayCalendar-weekContainer': {
        justifyContent: 'space-between',
        mx: 0.25,
    },
    '& .MuiDayCalendar-weekDayLabel': {
        width: 32,
        fontSize: '0.72rem',
        color: '#8a94a6',
    },
    '& .MuiPickersDay-root': {
        width: 32,
        height: 32,
        margin: '0 1px',
        fontSize: '0.84rem',
        borderRadius: '9px',
        fontWeight: 600,
    },
};
