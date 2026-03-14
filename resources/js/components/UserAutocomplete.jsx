import { Autocomplete, Box, Chip, CircularProgress, TextField, Typography } from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * A reusable autocomplete component for searching Members, Guests, and Employees.
 * Matches the design pattern from RoomBooking.jsx.
 *
 * @param {Object} props
 * @param {string} props.memberType - The type of user to search for (0=member, 2=corporate, 3=employee, guest-X=guest type)
 * @param {Object} props.value - The currently selected value
 * @param {Function} props.onChange - Callback when a value is selected
 * @param {string} [props.label] - Label for the text field
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.helperText] - Helper text to display
 */
const UserAutocomplete = ({ memberType, value, onChange, label = 'Customer Name', placeholder = 'Search...', error, helperText, routeUri, ...rest }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const activeRequestIdRef = useRef(0);
    const abortControllerRef = useRef(null);

    const doSearch = useCallback(
        async (query) => {
            const trimmedQuery = (query || '').trim();
            if (!trimmedQuery) {
                setOptions([]);
                setLoading(false);
                return;
            }

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const requestId = ++activeRequestIdRef.current;
            setLoading(true);

            try {
                const response = await axios.get(routeUri || route('admin.api.search-users'), {
                    params: {
                        q: trimmedQuery,
                        type: memberType,
                    },
                    signal: controller.signal,
                });
                if (requestId !== activeRequestIdRef.current) return;
                setOptions(response.data.results || []);
            } catch (err) {
                if (requestId !== activeRequestIdRef.current) return;
                if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
                console.error('Error fetching users:', err);
                setOptions([]);
            } finally {
                if (requestId !== activeRequestIdRef.current) return;
                setLoading(false);
            }
        },
        [memberType, routeUri],
    );

    const debouncedSearch = useMemo(() => debounce((query) => doSearch(query), 300), [doSearch]);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [debouncedSearch]);

    useEffect(() => {
        setOptions([]);
        debouncedSearch.cancel();
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setLoading(false);
    }, [memberType]);

    useEffect(() => {
        if (!value) {
            setInputValue('');
            return;
        }
        setInputValue(value.label || value.name || '');
    }, [value?.id]);

    const getStatusChipStyles = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'active') {
            return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
        } else if (s === 'suspended' || s === 'inactive') {
            return { backgroundColor: '#fff3e0', color: '#ef6c00' };
        }
        return { backgroundColor: '#ffebee', color: '#c62828' };
    };

    const renderOption = (props, option) => {
        const isEmployee = option.booking_type === 'employee';
        const isMember = option.booking_type === 'member';

        return (
            <li {...props} key={option.id}>
                <Box sx={{ width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight="bold">
                            {option.membership_no || option.customer_no || option.employee_id}
                        </Typography>
                        {option.status && (
                            <Chip
                                label={option.status}
                                size="small"
                                sx={{
                                    height: '20px',
                                    fontSize: '10px',
                                    ...getStatusChipStyles(option.status),
                                    textTransform: 'capitalize',
                                    ml: 1,
                                }}
                            />
                        )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        {option.name}
                    </Typography>
                    {isEmployee && (option.department_name || option.subdepartment_name || option.company) && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '10px' }}>
                            {[option.department_name, option.subdepartment_name, option.company].filter(Boolean).join(' • ')}
                        </Typography>
                    )}
                </Box>
            </li>
        );
    };

    return (
        <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            openOnFocus
            isOptionEqualToValue={(option, val) => option.id === val?.id}
            getOptionLabel={(option) => option.label || option.name || ''}
            options={options}
            filterOptions={(x) => x}
            loading={loading}
            value={value || null}
            inputValue={inputValue}
            onInputChange={(event, newInputValue, reason) => {
                setInputValue(newInputValue);
                if (reason === 'input') {
                    if (newInputValue && newInputValue.trim()) {
                        setOpen(true);
                    }
                    debouncedSearch(newInputValue);
                }
                if (!newInputValue || !newInputValue.trim()) {
                    debouncedSearch.cancel();
                    if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                    }
                    setLoading(false);
                    setOptions([]);
                }
            }}
            onChange={(event, newValue) => {
                onChange(newValue);
                setInputValue(newValue ? newValue.label || newValue.name || '' : '');
                setOpen(false);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    error={!!error}
                    helperText={helperText || error}
                    size="small"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
            renderOption={renderOption}
            {...rest}
        />
    );
};

export default UserAutocomplete;
