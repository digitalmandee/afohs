import {
    ArrowDownward as ArrowDownwardIcon,
    ArrowUpward as ArrowUpwardIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, DialogActions, DialogContent, IconButton, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';

const MenuFilter = ({ handleFilterClose }) => {
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [stockFilter, setStockFilter] = useState('All');

    const [sortingOptions, setSortingOptions] = useState({
        name: null,
        price: null,
        date: null,
        purchase: null,
    });

    const applyFilters = () => {
        let filtered = [...products];

        // Apply category filter
        if (categoryFilter !== 'All') {
            filtered = filtered.filter((product) => product.category === categoryFilter);
        }

        // Apply stock filter
        if (stockFilter !== 'All') {
            filtered = filtered.filter((product) =>
                stockFilter === 'Ready'
                    ? product.stock.status === 'Ready Stock'
                    : stockFilter === 'Out of Stock'
                      ? product.stock.status === 'Out of Stock'
                      : stockFilter === 'Imaji at Home'
                        ? product.category === 'Imaji at Home'
                        : true,
            );
        }

        // Apply sorting
        if (sortingOptions.name === 'ascending') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortingOptions.name === 'descending') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        }

        if (sortingOptions.price === 'ascending') {
            filtered.sort((a, b) => a.price.current - b.price.current);
        } else if (sortingOptions.price === 'descending') {
            filtered.sort((a, b) => b.price.current - a.price.current);
        }

        setFilteredProducts(filtered);
        setOpenFilter(false);
    };

    const resetFilters = () => {
        setSortingOptions({
            name: null,
            price: null,
            date: null,
            purchase: null,
        });
        setCategoryFilter('All');
        setStockFilter('All');
    };
    return (
        <>
            <Box>
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                        Menu Filter
                    </Typography>
                    <IconButton onClick={handleFilterClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ px: 3, pb: 2 }}>
                        <Accordion
                            defaultExpanded
                            sx={{
                                boxShadow: 'none',
                                '&:before': { display: 'none' },
                                border: '1px solid #e0e0e0',
                                borderRadius: '10px',
                                p: 1,
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                                <Typography fontWeight="bold" fontSize="16px">
                                    Sorting
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 0 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography>By Name</Typography>
                                    <Box>
                                        <Button
                                            variant={sortingOptions.name === 'ascending' ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={<ArrowUpwardIcon fontSize="small" />}
                                            onClick={() => toggleSorting('name', 'ascending')}
                                            sx={{
                                                mr: 1,
                                                borderRadius: 50,
                                                backgroundColor: sortingOptions.name === 'ascending' ? '#90caf9' : 'transparent',
                                                color: sortingOptions.name === 'ascending' ? 'primary.main' : 'inherit',
                                                borderColor: '#90caf9',
                                                '&:hover': {
                                                    backgroundColor: sortingOptions.name === 'ascending' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                                },
                                            }}
                                        >
                                            Ascending
                                        </Button>
                                        <Button
                                            variant={sortingOptions.name === 'descending' ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={<ArrowDownwardIcon fontSize="small" />}
                                            onClick={() => toggleSorting('name', 'descending')}
                                            sx={{
                                                borderRadius: 50,
                                                backgroundColor: sortingOptions.name === 'descending' ? '#90caf9' : 'transparent',
                                                color: sortingOptions.name === 'descending' ? 'primary.main' : 'inherit',
                                                borderColor: '#90caf9',
                                                '&:hover': {
                                                    backgroundColor: sortingOptions.name === 'descending' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                                },
                                            }}
                                        >
                                            Descending
                                        </Button>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography>By Price</Typography>
                                    <Box>
                                        <Button
                                            variant={sortingOptions.price === 'ascending' ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={<ArrowUpwardIcon fontSize="small" />}
                                            onClick={() => toggleSorting('price', 'ascending')}
                                            sx={{
                                                mr: 1,
                                                borderRadius: 50,
                                                backgroundColor: sortingOptions.price === 'ascending' ? '#90caf9' : 'transparent',
                                                color: sortingOptions.price === 'ascending' ? 'primary.main' : 'inherit',
                                                borderColor: '#90caf9',
                                                '&:hover': {
                                                    backgroundColor: sortingOptions.price === 'ascending' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                                },
                                            }}
                                        >
                                            Ascending
                                        </Button>
                                        <Button
                                            variant={sortingOptions.price === 'descending' ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={<ArrowDownwardIcon fontSize="small" />}
                                            onClick={() => toggleSorting('price', 'descending')}
                                            sx={{
                                                borderRadius: 50,
                                                backgroundColor: sortingOptions.price === 'descending' ? '#90caf9' : 'transparent',
                                                color: sortingOptions.price === 'descending' ? 'primary.main' : 'inherit',
                                                borderColor: '#90caf9',
                                                '&:hover': {
                                                    backgroundColor: sortingOptions.price === 'descending' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                                },
                                            }}
                                        >
                                            Descending
                                        </Button>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography>By Date</Typography>
                                    <Box>
                                        <Button
                                            variant={sortingOptions.date === 'ascending' ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={<ArrowUpwardIcon fontSize="small" />}
                                            onClick={() => toggleSorting('date', 'ascending')}
                                            sx={{
                                                mr: 1,
                                                borderRadius: 50,
                                                backgroundColor: sortingOptions.date === 'ascending' ? '#90caf9' : 'transparent',
                                                color: sortingOptions.date === 'ascending' ? 'primary.main' : 'inherit',
                                                borderColor: '#90caf9',
                                                '&:hover': {
                                                    backgroundColor: sortingOptions.date === 'ascending' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                                },
                                            }}
                                        >
                                            Ascending
                                        </Button>
                                        <Button
                                            variant={sortingOptions.date === 'descending' ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={<ArrowDownwardIcon fontSize="small" />}
                                            onClick={() => toggleSorting('date', 'descending')}
                                            sx={{
                                                borderRadius: 50,
                                                backgroundColor: sortingOptions.date === 'descending' ? '#90caf9' : 'transparent',
                                                color: sortingOptions.date === 'descending' ? 'primary.main' : 'inherit',
                                                borderColor: '#90caf9',
                                                '&:hover': {
                                                    backgroundColor: sortingOptions.date === 'descending' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                                },
                                            }}
                                        >
                                            Descending
                                        </Button>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography>By Purchase</Typography>
                                    <Box>
                                        <Button
                                            variant={sortingOptions.purchase === 'best' ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={sortingOptions.purchase === 'best' ? <CheckIcon fontSize="small" /> : null}
                                            onClick={() => toggleSorting('purchase', 'best')}
                                            sx={{
                                                mr: 1,
                                                borderRadius: 50,
                                                backgroundColor: sortingOptions.purchase === 'best' ? '#90caf9' : 'transparent',
                                                color: sortingOptions.purchase === 'best' ? 'primary.main' : 'inherit',
                                                borderColor: '#90caf9',
                                                '&:hover': {
                                                    backgroundColor: sortingOptions.purchase === 'best' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                                },
                                            }}
                                        >
                                            Best Seller
                                        </Button>
                                        <Button
                                            variant={sortingOptions.purchase === 'less' ? 'contained' : 'outlined'}
                                            size="small"
                                            startIcon={sortingOptions.purchase === 'less' ? <CheckIcon fontSize="small" /> : null}
                                            onClick={() => toggleSorting('purchase', 'less')}
                                            sx={{
                                                borderRadius: 50,
                                                backgroundColor: sortingOptions.purchase === 'less' ? '#90caf9' : 'transparent',
                                                color: sortingOptions.purchase === 'less' ? 'primary.main' : 'inherit',
                                                borderColor: '#90caf9',
                                                '&:hover': {
                                                    backgroundColor: sortingOptions.purchase === 'less' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                                },
                                            }}
                                        >
                                            Less Desirable
                                        </Button>
                                    </Box>
                                </Box>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                boxShadow: 'none',
                                '&:before': { display: 'none' },
                                border: '1px solid #e0e0e0',
                                borderRadius: '10px',
                                p: 1,
                                mb: 2,
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                                <Typography variant="h6" fontWeight="bold" fontSize="16px">
                                    Categories
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 0 }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Button
                                        variant={categoryFilter === 'All' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setCategoryFilter('All')}
                                        sx={{
                                            borderRadius: 50,
                                            backgroundColor: categoryFilter === 'All' ? '#003B5C' : 'transparent',
                                            color: categoryFilter === 'All' ? 'white' : 'inherit',
                                            '&:hover': {
                                                backgroundColor: categoryFilter === 'All' ? '#003B5C' : 'rgba(0, 59, 92, 0.04)',
                                            },
                                        }}
                                    >
                                        All
                                    </Button>
                                    <Button
                                        variant={categoryFilter === 'Coffee & Beverage' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setCategoryFilter('Coffee & Beverage')}
                                        sx={{
                                            borderRadius: 50,
                                            backgroundColor: categoryFilter === 'Coffee & Beverage' ? '#90caf9' : 'transparent',
                                            color: categoryFilter === 'Coffee & Beverage' ? 'primary.main' : 'inherit',
                                            borderColor: '#90caf9',
                                            '&:hover': {
                                                backgroundColor: categoryFilter === 'Coffee & Beverage' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                            },
                                        }}
                                    >
                                        Coffee & Beverage
                                    </Button>
                                    <Button
                                        variant={categoryFilter === 'Food & Snack' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setCategoryFilter('Food & Snack')}
                                        sx={{
                                            borderRadius: 50,
                                            backgroundColor: categoryFilter === 'Food & Snack' ? '#90caf9' : 'transparent',
                                            color: categoryFilter === 'Food & Snack' ? 'primary.main' : 'inherit',
                                            borderColor: '#90caf9',
                                            '&:hover': {
                                                backgroundColor: categoryFilter === 'Food & Snack' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                            },
                                        }}
                                    >
                                        Food & Snack
                                    </Button>
                                    <Button
                                        variant={categoryFilter === 'Imaji at Home' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setCategoryFilter('Imaji at Home')}
                                        sx={{
                                            borderRadius: 50,
                                            backgroundColor: categoryFilter === 'Imaji at Home' ? '#90caf9' : 'transparent',
                                            color: categoryFilter === 'Imaji at Home' ? 'primary.main' : 'inherit',
                                            borderColor: '#90caf9',
                                            '&:hover': {
                                                backgroundColor: categoryFilter === 'Imaji at Home' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                            },
                                        }}
                                    >
                                        Imaji at Home
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion
                            sx={{
                                boxShadow: 'none',
                                '&:before': { display: 'none' },
                                border: '1px solid #e0e0e0',
                                borderRadius: '10px',
                                p: 1,
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                                <Typography fontWeight="bold" fontSize="16px">
                                    Stock
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 0 }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Button
                                        variant={stockFilter === 'All' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setStockFilter('All')}
                                        sx={{
                                            borderRadius: 50,
                                            backgroundColor: stockFilter === 'All' ? '#003B5C' : 'transparent',
                                            color: stockFilter === 'All' ? 'white' : 'inherit',
                                            '&:hover': {
                                                backgroundColor: stockFilter === 'All' ? '#003B5C' : 'rgba(0, 59, 92, 0.04)',
                                            },
                                        }}
                                    >
                                        All
                                    </Button>
                                    <Button
                                        variant={stockFilter === 'Ready' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setStockFilter('Ready')}
                                        sx={{
                                            borderRadius: 50,
                                            backgroundColor: stockFilter === 'Ready' ? '#90caf9' : 'transparent',
                                            color: stockFilter === 'Ready' ? 'primary.main' : 'inherit',
                                            borderColor: '#90caf9',
                                            '&:hover': {
                                                backgroundColor: stockFilter === 'Ready' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                            },
                                        }}
                                    >
                                        Ready
                                    </Button>
                                    <Button
                                        variant={stockFilter === 'Out of Stock' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setStockFilter('Out of Stock')}
                                        sx={{
                                            borderRadius: 50,
                                            backgroundColor: stockFilter === 'Out of Stock' ? '#90caf9' : 'transparent',
                                            color: stockFilter === 'Out of Stock' ? 'primary.main' : 'inherit',
                                            borderColor: '#90caf9',
                                            '&:hover': {
                                                backgroundColor: stockFilter === 'Out of Stock' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                            },
                                        }}
                                    >
                                        Out of Stock
                                    </Button>
                                    <Button
                                        variant={stockFilter === 'Imaji at Home' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => setStockFilter('Imaji at Home')}
                                        sx={{
                                            borderRadius: 50,
                                            backgroundColor: stockFilter === 'Imaji at Home' ? '#90caf9' : 'transparent',
                                            color: stockFilter === 'Imaji at Home' ? 'primary.main' : 'inherit',
                                            borderColor: '#90caf9',
                                            '&:hover': {
                                                backgroundColor: stockFilter === 'Imaji at Home' ? '#90caf9' : 'rgba(144, 202, 249, 0.08)',
                                            },
                                        }}
                                    >
                                        Imaji at Home
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    <Button
                        onClick={handleFilterClose}
                        sx={{
                            color: 'text.primary',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Box>
                        <Button
                            onClick={resetFilters}
                            variant="outlined"
                            sx={{
                                mr: 1,
                                borderColor: '#e0e0e0',
                                color: 'text.primary',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    borderColor: '#d5d5d5',
                                },
                            }}
                        >
                            Reset Filter
                        </Button>
                        <Button
                            onClick={applyFilters}
                            variant="contained"
                            sx={{
                                backgroundColor: '#003B5C',
                                '&:hover': {
                                    backgroundColor: '#002A41',
                                },
                            }}
                        >
                            Apply Filters
                        </Button>
                    </Box>
                </DialogActions>
            </Box>
        </>
    );
};
MenuFilter.layout = (page) => page;
export default MenuFilter;
