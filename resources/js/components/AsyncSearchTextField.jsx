import React, { useState, useEffect, useRef } from 'react';
import { TextField, Paper, MenuItem, CircularProgress, Box, Typography, Chip } from '@mui/material';
import axios from 'axios';

const AsyncSearchTextField = ({
    label,
    name,
    value,
    onChange,
    endpoint,
    queryParam = 'q', // key to send query like ?q=ali
    params = {},
    placeholder = '',
    fullWidth = true,
    disabled = false,
    debounceTime = 300,
    size = 'medium',
    resultFormat = (item) => `${item.label}`,
    resultsKey = 'results',
    renderItem = null, // Custom render function for dropdown items
}) => {
    const [inputValue, setInputValue] = useState(value?.label || '');
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const debounceTimer = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (value && value.label !== inputValue) {
            setInputValue(value.label || '');
        } else if (!value) {
            setInputValue('');
        }
    }, [value]);

    const fetchResults = async (query) => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        try {
            setLoading(true);
            const url = route(endpoint, { ...params, [queryParam]: query });

            const res = await axios.get(url);
            console.log(res.data);

            setSuggestions(res.data[resultsKey] || []);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const query = e.target.value;
        setInputValue(query);
        onChange({ target: { name, value: null } }); // Clear value on typing

        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchResults(query);
            setOpen(true);
        }, debounceTime);
    };

    const handleSelect = (item) => {
        const displayValue = resultFormat(item);
        setInputValue(displayValue);
        onChange({ target: { name, value: item } });
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <TextField
                label={label}
                name={name}
                size={size}
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                fullWidth={fullWidth}
                disabled={disabled}
                onFocus={() => {
                    if (inputValue) setOpen(true);
                }}
            />
            {loading && (
                <div style={{ position: 'absolute', right: 10, top: 18 }}>
                    <CircularProgress size={18} />
                </div>
            )}
            {open && suggestions.length > 0 && (
                <Paper
                    style={{
                        position: 'absolute',
                        zIndex: 20,
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        maxHeight: 200,
                        overflowY: 'auto',
                    }}
                >
                    {suggestions.map((item) => (
                        <MenuItem key={item.id} onClick={() => handleSelect(item)} sx={{ py: 1 }}>
                            {renderItem ? renderItem(item) : resultFormat(item)}
                        </MenuItem>
                    ))}
                </Paper>
            )}
        </div>
    );
};

export default AsyncSearchTextField;
