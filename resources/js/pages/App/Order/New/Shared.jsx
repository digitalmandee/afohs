import React from 'react';
import {
    Box,
    Button,
    FormControlLabel,
    Paper,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export function OrderSurface({ children, sx = {} }) {
    return (
        <Paper
            elevation={0}
            sx={{
                border: '1px solid rgba(203, 213, 225, 0.88)',
                borderRadius: '16px',
                background: '#fff',
                boxShadow: '0 8px 18px rgba(15, 23, 42, 0.035)',
                ...sx,
            }}
        >
            {children}
        </Paper>
    );
}

export function OrderMetaStrip({ label = 'Order ID', value, secondaryLabel, secondaryValue }) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 0.9,
                px: 1.35,
                py: 1,
                borderRadius: '12px',
                bgcolor: '#f8fafc',
                border: '1px solid rgba(226, 232, 240, 0.92)',
            }}
        >
            <Stack direction="row" spacing={0.85} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography sx={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '0.94rem', color: '#063455', letterSpacing: '-0.01em' }}>
                    {value}
                </Typography>
            </Stack>
            {secondaryLabel && secondaryValue ? (
                <Stack direction="row" spacing={0.8} alignItems="center" useFlexGap flexWrap="wrap">
                    <Typography sx={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {secondaryLabel}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#102a43' }}>
                        {secondaryValue}
                    </Typography>
                </Stack>
            ) : null}
        </Box>
    );
}

export function OrderSection({ title, subtitle = '', children }) {
    return (
        <Box sx={{ px: { xs: 1.5, md: 1.8 }, py: { xs: 1.05, md: 1.2 } }}>
            {title ? (
                <Box sx={{ mb: 0.95 }}>
                    <Typography sx={{ fontSize: '0.94rem', fontWeight: 800, color: '#102a43', letterSpacing: '-0.01em' }}>
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography sx={{ mt: 0.25, fontSize: '0.79rem', color: '#64748b', lineHeight: 1.4 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
            ) : null}
            {children}
        </Box>
    );
}

export function OrderMemberTypeSelector({ guestTypes = [], value, onChange }) {
    return (
        <RadioGroup
            row
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            sx={{ gap: 0.75, display: 'flex', flexWrap: 'wrap' }}
        >
            <FormControlLabel value="0" control={<Radio size="small" />} label="Member" sx={memberTypeChipSx(value === '0')} />
            <FormControlLabel value="2" control={<Radio size="small" />} label="Corporate Member" sx={memberTypeChipSx(value === '2')} />
            <FormControlLabel value="3" control={<Radio size="small" />} label="Employee" sx={memberTypeChipSx(value === '3')} />
            {guestTypes.map((type) => (
                <FormControlLabel
                    key={type.id}
                    value={`guest-${type.id}`}
                    control={<Radio size="small" />}
                    label={type.name}
                    sx={memberTypeChipSx(value === `guest-${type.id}`)}
                />
            ))}
        </RadioGroup>
    );
}

export function OrderActionFooter({
    primaryLabel = 'Choose Menu',
    onPrimary,
    primaryDisabled = false,
    secondaryLabel = 'Cancel',
    onSecondary = undefined,
}) {
    return (
        <Box
            sx={{
                position: { md: 'sticky' },
                bottom: 0,
                mt: 0.5,
                px: { xs: 1.5, md: 1.8 },
                py: 0.95,
                borderTop: '1px solid rgba(226, 232, 240, 0.9)',
                bgcolor: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                zIndex: 2,
            }}
        >
            <Button
                onClick={onSecondary}
                sx={{
                    color: '#64748b',
                    textTransform: 'none',
                    fontWeight: 700,
                    minWidth: 72,
                }}
            >
                {secondaryLabel}
            </Button>
            <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                disabled={primaryDisabled}
                onClick={onPrimary}
                sx={{
                    px: 1.65,
                    minHeight: 38,
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: '10px',
                    boxShadow: '0 8px 14px rgba(6, 52, 85, 0.14)',
                    bgcolor: '#0c3b5c',
                    '&:hover': {
                        bgcolor: '#072a42',
                    },
                }}
            >
                {primaryLabel}
            </Button>
        </Box>
    );
}

function memberTypeChipSx(active) {
    return {
        border: active ? '1px solid #A27B5C' : '1px solid #d9e2ec',
        borderRadius: '999px',
        px: 0.75,
        py: 0.05,
        m: 0,
        bgcolor: active ? '#FCF7EF' : '#fff',
        '& .MuiFormControlLabel-label': {
            fontSize: '0.84rem',
            fontWeight: 600,
            color: '#243b53',
        },
        '& .MuiRadio-root': {
            p: 0.6,
        },
    };
}
