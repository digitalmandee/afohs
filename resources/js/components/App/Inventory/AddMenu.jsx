import { useForm } from '@inertiajs/react';
import {
    Add as AddIcon,
    Close as CloseIcon,
    EventSeat as EventSeatIcon,
    FormatBold as FormatBoldIcon,
    FormatItalic as FormatItalicIcon,
    FormatListBulleted,
    FormatListNumbered,
    InsertEmoticon as InsertEmoticonIcon,
    Link as LinkIcon,
    LocalMall as LocalMallIcon,
    LocalShipping as LocalShippingIcon,
    ShoppingBag as ShoppingBagIcon,
} from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, Divider, Grid, IconButton, MenuItem, Switch, TextField, Typography } from '@mui/material';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { routeNameForContext } from '@/lib/utils';

const AddMenu = ({ openMenu, onClose }) => {
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        name: '',
        menu_code: '',
        category: '',
        currentStock: '',
        minimalStock: '',
        outOfStock: false,
        orderTypes: [],
        cogs: '',
        basePrice: '',
        profit: '0.00',
        variants: {},
        description: '',
        images: [],
    });

    const [categories, setCategories] = useState([]);
    const [addMenuStep, setAddMenuStep] = useState(1);
    const [uploadedImages, setUploadedImages] = useState([]);
    const fileInputRef = useRef(null);

    // Snackbar

    const productVariants = [{ name: 'Size', type: 'multiple', values: ['Small', 'Medium', 'Large'] }];

    const orderTypes = [
        { value: 'dineIn', label: 'Dine In', icon: EventSeatIcon },
        { value: 'pickUp', label: 'Pick Up', icon: LocalMallIcon },
        { value: 'delivery', label: 'Delivery', icon: LocalShippingIcon },
        { value: 'takeaway', label: 'Takeaway', icon: ShoppingBagIcon },
        { value: 'reservation', label: 'Reservation', icon: EventSeatIcon },
    ];

    // Menu Steps
    const handleNextStep = () => {
        const validationErrors = getMenuValidationErrors(data);

        if (validationErrors.length > 0) {
            validationErrors.map((error, index) => enqueueSnackbar(error, { variant: 'error' }));

            return;
        }

        setAddMenuStep(2);
    };

    const getMenuValidationErrors = (menu) => {
        const errors = [];

        if (!menu.name.trim()) errors.push('Name is required');
        if (!menu.menu_code.trim()) errors.push('Menu code is required');
        if (!menu.category) errors.push('Category is required');
        if (!menu.currentStock || isNaN(menu.currentStock)) errors.push('Current stock must be a valid number');
        if (!menu.minimalStock || isNaN(menu.minimalStock)) errors.push('Minimal stock must be a valid number');
        if (!menu.orderTypes || menu.orderTypes.length === 0) errors.push('At least one order type must be selected');
        if (!menu.cogs || isNaN(menu.cogs)) errors.push('COGS must be a valid number');
        if (!menu.basePrice || isNaN(menu.basePrice)) errors.push('Base price must be a valid number');
        if (!menu.profit || isNaN(menu.profit)) errors.push('Profit must be a valid number');

        return errors;
    };

    const handlePreviousStep = () => {
        setAddMenuStep(1);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleOrderTypeToggle = (type) => {
        setData((prev) => ({
            ...prev,
            orderTypes: prev.orderTypes.includes(type) ? prev.orderTypes.filter((t) => t !== type) : [...prev.orderTypes, type],
        }));
    };

    const handleSelectAll = () => {
        setData((prev) => {
            const allSelected = orderTypes.every((opt) => prev.orderTypes.includes(opt.value));

            return {
                ...prev,
                orderTypes: allSelected ? [] : orderTypes.map((opt) => opt.value),
            };
        });
    };

    // Handle variant changes
    const handleVariantToggle = (variantName) => {
        setData((prev) => {
            const existing = prev.variants[variantName];
            const isActive = existing?.active;

            // Get the variant from the initial `productVariants` list to map values into items.
            const variant = productVariants.find((v) => v.name === variantName);

            // If `variant` is found in `productVariants`
            if (!variant) return prev;

            const newItems = variant.values.map((value) => ({ name: value, price: 0, stock: 0 })); // For "multiple" type, keep `items` empty initially.

            return {
                ...prev,
                variants: {
                    ...prev.variants,
                    [variantName]: {
                        active: !isActive,
                        type: variant.type,
                        items: newItems, // New items for active variant
                        newItem: { name: '', price: '', stock: '' }, // Clear form for new item
                    },
                },
            };
        });
    };

    const handleNewVariantItemChange = (variantName, field, value) => {
        setData((prev) => ({
            ...prev,
            variants: {
                ...prev.variants,
                [variantName]: {
                    ...prev.variants[variantName],
                    newItem: {
                        ...prev.variants[variantName].newItem,
                        [field]: value,
                    },
                },
            },
        }));
    };

    const handleAddVariantItem = (variantName) => {
        setData((prev) => {
            const variant = prev.variants[variantName];
            const { name, price, stock } = variant.newItem;

            if (!name || price === '' || stock === '') return prev; // Avoid empty entries

            return {
                ...prev,
                variants: {
                    ...prev.variants,
                    [variantName]: {
                        ...variant,
                        items: [...variant.items, { name, price, stock }],
                        newItem: { name: '', price: '', stock: '' }, // Clear form
                    },
                },
            };
        });
    };

    const handleRemoveVariantItem = (variantName, index) => {
        setData((prev) => {
            const updatedItems = [...prev.variants[variantName].items];
            updatedItems.splice(index, 1);

            return {
                ...prev,
                variants: {
                    ...prev.variants,
                    [variantName]: {
                        ...prev.variants[variantName],
                        items: updatedItems,
                    },
                },
            };
        });
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setData((prev) => ({
                ...prev,
                images: [...prev.images, ...files],
            }));
            const newImages = files.map((file) => URL.createObjectURL(file));
            setUploadedImages((prev) => [...prev, ...newImages]);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Save new menu
    const handleSaveMenu = () => {
        post(route(routeNameForContext('inventory.store')), {
            onSuccess: (data) => {
                enqueueSnackbar('Product added successfully', { variant: 'success' });
                reset();
                setUploadedImages([]);
                setOpenAddMenu(false);
                setShowConfirmation(true);
            },
            onError: (errors) => {
                enqueueSnackbar('Something went wrong', { variant: 'error' });
            },
        });
    };

    // Calculate profit when cogs or basePrice changes
    useEffect(() => {
        if (data.cogs && data.basePrice) {
            const cogs = Number.parseFloat(data.cogs);
            const basePrice = Number.parseFloat(data.basePrice);
            if (!isNaN(cogs) && !isNaN(basePrice)) {
                const profit = (basePrice - cogs).toFixed(2);
                setData((prev) => ({
                    ...prev,
                    profit,
                }));
            }
        }
    }, [data.cogs, data.basePrice]);

    useEffect(() => {
        axios.get(route(routeNameForContext('inventory.categories'))).then((response) => {
            setCategories(response.data.categories);
        });
    }, []);

    // Render
    return (
        <>
            <Dialog
                open={openMenu}
                onClose={onClose}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 1,
                        m: 0,
                        position: 'fixed',
                        right: 0,
                        top: 0,
                        height: '100%',
                        maxHeight: '100%',
                    },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{fontWeight:'700', fontSize:'30px', color:'#063455'}}>
                        Add Menu
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 0 }}>
                    {/* Step Indicators */}
                    <Box sx={{ px: 3, mb: 3, display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                sx={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    backgroundColor: '#003B5C',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1,
                                }}
                            >
                                1
                            </Box>
                            <Typography variant="body2" fontWeight="bold" color={addMenuStep === 1 ? 'text.primary' : 'text.secondary'}>
                                General Information
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, mx: 2, height: 1, backgroundColor: '#e0e0e0' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                sx={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    backgroundColor: addMenuStep === 2 ? '#003B5C' : '#e0e0e0',
                                    color: addMenuStep === 2 ? 'white' : 'text.secondary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1,
                                }}
                            >
                                2
                            </Box>
                            <Typography variant="body2" fontWeight="bold" color={addMenuStep === 2 ? 'text.primary' : 'text.secondary'}>
                                Descriptions and Image
                            </Typography>
                        </Box>
                    </Box>

                    {/* Step 1: General Information */}
                    {addMenuStep === 1 && (
                        <Box sx={{ px: 3, pb: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Product Name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="Cappucino"
                                        name="name"
                                        value={data.name}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Menu Id (Optional)
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="e.g. A001"
                                        name="menu_code"
                                        value={data.menu_code}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Categories
                                    </Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        placeholder="Choose category"
                                        name="category"
                                        value={data.category}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        size="small"
                                        SelectProps={{
                                            displayEmpty: true,
                                        }}
                                    >
                                        <MenuItem value="">Choose category</MenuItem>
                                        {categories?.length > 0 &&
                                            categories.map(({ id, name }) => (
                                                <MenuItem key={id} value={id}>
                                                    {name}
                                                </MenuItem>
                                            ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Current Ready Stock
                                    </Typography>
                                    <Box sx={{ display: 'flex' }}>
                                        <TextField
                                            fullWidth
                                            placeholder="10"
                                            name="currentStock"
                                            value={data.currentStock}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            size="small"
                                            type="number"
                                        />
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #e0e0e0',
                                                borderLeft: 'none',
                                                px: 2,
                                                borderTopRightRadius: 4,
                                                borderBottomRightRadius: 4,
                                            }}
                                        >
                                            <Typography variant="body2">Pcs</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Minimal Stock
                                    </Typography>
                                    <Box sx={{ display: 'flex' }}>
                                        <TextField
                                            fullWidth
                                            placeholder="10"
                                            name="minimalStock"
                                            value={data.minimalStock}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            size="small"
                                            type="number"
                                        />
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #e0e0e0',
                                                borderLeft: 'none',
                                                px: 2,
                                                borderTopRightRadius: 4,
                                                borderBottomRightRadius: 4,
                                            }}
                                        >
                                            <Typography variant="body2">Pcs</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            backgroundColor: '#f5f5f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ mr: 2 }}>
                                                <img src="/placeholder.svg" alt="Out of Stock" style={{ width: 40, height: 40 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="body1" fontWeight="bold">
                                                    Out of Stock Menu
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Out of Stock notification
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Switch
                                            checked={data.outOfStock}
                                            onChange={() => setData((prev) => ({ ...prev, outOfStock: !prev.outOfStock }))}
                                            color="primary"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="body1" fontWeight="bold">
                                            Select Order Type
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ mr: 1 }}>
                                                Select All
                                            </Typography>
                                            <Switch
                                                checked={orderTypes.every((opt) => data.orderTypes.includes(opt.value))}
                                                onChange={handleSelectAll}
                                                color="primary"
                                                size="small"
                                            />
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {orderTypes.map((item, index) => {
                                            const isSelected = data.orderTypes.includes(item.value);
                                            return (
                                                <Button
                                                    variant={isSelected ? 'contained' : 'outlined'}
                                                    onClick={() => handleOrderTypeToggle(item.value)}
                                                    sx={{
                                                        flex: 1,
                                                        py: 2,
                                                        borderRadius: 1,
                                                        backgroundColor: isSelected ? '#003B5C' : 'transparent',
                                                        '&:hover': {
                                                            backgroundColor: isSelected ? '#003B5C' : 'rgba(0, 59, 92, 0.04)',
                                                        },
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        {item.icon && <item.icon sx={{ mb: 1 }} />}
                                                        <Typography variant="body2">{item.label}</Typography>
                                                    </Box>
                                                </Button>
                                            );
                                        })}
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Cost Of Goods Sold (COGS)
                                    </Typography>
                                    <Box sx={{ display: 'flex' }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #e0e0e0',
                                                borderRight: 'none',
                                                px: 2,
                                                borderTopLeftRadius: 4,
                                                borderBottomLeftRadius: 4,
                                            }}
                                        >
                                            <Typography variant="body2">Rs</Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            placeholder="3.00"
                                            name="cogs"
                                            value={data.cogs}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            size="small"
                                            type="number"
                                            inputProps={{ step: '0.01' }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Base Price Selling
                                    </Typography>
                                    <Box sx={{ display: 'flex' }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #e0e0e0',
                                                borderRight: 'none',
                                                px: 2,
                                                borderTopLeftRadius: 4,
                                                borderBottomLeftRadius: 4,
                                            }}
                                        >
                                            <Typography variant="body2">Rs</Typography>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            placeholder="4.00"
                                            name="basePrice"
                                            value={data.basePrice}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            size="small"
                                            type="number"
                                            inputProps={{ step: '0.01' }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Profit Estimate
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Rs {data.profit}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Product Variant */}
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Product Variant
                                        </Typography>
                                    </Box>

                                    <pre>{JSON.stringify(data.variants, null, 2)}</pre>

                                    {productVariants.map((item) => (
                                        <Box key={item.name} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {item.name}
                                                </Typography>
                                                <Switch
                                                    checked={!!data.variants[item.name]?.active}
                                                    onChange={() => handleVariantToggle(item.name)}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>

                                            {/* Render if active */}
                                            {data.variants[item.name]?.active && (
                                                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {/* Loop through the items for both single and multiple variant types */}
                                                    {data.variants[item.name]?.items?.map((topping, index) => (
                                                        <Box
                                                            key={index}
                                                            sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}
                                                        >
                                                            {/* Name field (editable for multiple, not editable for single) */}
                                                            {item.type === 'single' ? (
                                                                <Typography sx={{ flex: 1, mr: 1 }}>{topping.name}</Typography>
                                                            ) : (
                                                                <TextField
                                                                    size="small"
                                                                    placeholder="Variant Name"
                                                                    value={topping.name}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        setData((prev) => {
                                                                            const items = [...prev.variants[item.name].items];
                                                                            items[index].name = value;
                                                                            return {
                                                                                ...prev,
                                                                                variants: {
                                                                                    ...prev.variants,
                                                                                    [item.name]: {
                                                                                        ...prev.variants[item.name],
                                                                                        items,
                                                                                    },
                                                                                },
                                                                            };
                                                                        });
                                                                    }}
                                                                    sx={{ flex: 1, mr: 1 }}
                                                                />
                                                            )}
                                                            {/* Price field */}
                                                            <TextField
                                                                size="small"
                                                                placeholder="Price"
                                                                type="number"
                                                                inputProps={{ min: 0 }}
                                                                value={topping.price}
                                                                onChange={(e) => {
                                                                    let value = parseFloat(e.target.value);
                                                                    value = isNaN(value) ? '' : Math.max(0, value); // enforce minimum 0

                                                                    setData((prev) => {
                                                                        const items = [...prev.variants[item.name].items];
                                                                        items[index].price = value;
                                                                        return {
                                                                            ...prev,
                                                                            variants: {
                                                                                ...prev.variants,
                                                                                [item.name]: {
                                                                                    ...prev.variants[item.name],
                                                                                    items,
                                                                                },
                                                                            },
                                                                        };
                                                                    });
                                                                }}
                                                                sx={{ width: 120, mr: 1 }}
                                                            />

                                                            <TextField
                                                                size="small"
                                                                placeholder="Stock"
                                                                type="number"
                                                                inputProps={{ min: 0 }}
                                                                value={topping.stock}
                                                                onChange={(e) => {
                                                                    let value = parseInt(e.target.value);
                                                                    value = isNaN(value) ? '' : Math.max(0, value); // enforce minimum 0

                                                                    setData((prev) => {
                                                                        const items = [...prev.variants[item.name].items];
                                                                        items[index].stock = value;
                                                                        return {
                                                                            ...prev,
                                                                            variants: {
                                                                                ...prev.variants,
                                                                                [item.name]: {
                                                                                    ...prev.variants[item.name],
                                                                                    items,
                                                                                },
                                                                            },
                                                                        };
                                                                    });
                                                                }}
                                                                sx={{ width: 80, mr: 1 }}
                                                            />

                                                            <IconButton
                                                                size="small"
                                                                sx={{ width: 40 }}
                                                                onClick={() => handleRemoveVariantItem(item.name, index)}
                                                                color="error"
                                                            >
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    ))}

                                                    {/* Add new variant item for both single and multiple */}
                                                    {item.type === 'multiple' && (
                                                        <>
                                                            <Box
                                                                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}
                                                            >
                                                                <TextField
                                                                    placeholder="e.g. Oreo"
                                                                    size="small"
                                                                    value={data.variants[item.name]?.newItem?.name || ''}
                                                                    onChange={(e) => handleNewVariantItemChange(item.name, 'name', e.target.value)}
                                                                    sx={{ flex: 1, mr: 1 }}
                                                                />
                                                                <Box sx={{ display: 'flex', width: 120, mr: 1 }}>
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            border: '1px solid #e0e0e0',
                                                                            borderRight: 'none',
                                                                            px: 1,
                                                                            borderTopLeftRadius: 4,
                                                                            borderBottomLeftRadius: 4,
                                                                        }}
                                                                    >
                                                                        <Typography variant="body2">Rs</Typography>
                                                                    </Box>
                                                                    <TextField
                                                                        type="number"
                                                                        placeholder="10"
                                                                        size="small"
                                                                        value={data.variants[item.name]?.newItem?.price || ''}
                                                                        onChange={(e) =>
                                                                            handleNewVariantItemChange(item.name, 'price', e.target.value)
                                                                        }
                                                                        fullWidth
                                                                        inputProps={{
                                                                            min: 0,
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <TextField
                                                                    type="number"
                                                                    placeholder="0"
                                                                    size="small"
                                                                    value={data.variants[item.name]?.newItem?.stock || ''}
                                                                    onChange={(e) => handleNewVariantItemChange(item.name, 'stock', e.target.value)}
                                                                    sx={{ width: 80, mr: 1 }}
                                                                    inputProps={{
                                                                        min: 0,
                                                                    }}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{ width: 40 }}
                                                                    onClick={() => handleAddVariantItem(item.name)}
                                                                    color="primary"
                                                                >
                                                                    <AddIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>

                                                            {/* Button to add new item */}
                                                            <Button
                                                                variant="text"
                                                                startIcon={<AddIcon />}
                                                                onClick={() => handleAddVariantItem(item.name)}
                                                                sx={{ mt: 1 }}
                                                            >
                                                                Add Variant
                                                            </Button>
                                                        </>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    ))}
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Step 2: Descriptions and Image */}
                    {addMenuStep === 2 && (
                        <Box sx={{ px: 3, pb: 3 }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Menu Image
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                                {uploadedImages.length > 0 &&
                                    uploadedImages.map((image, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 1,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <img
                                                src={image || '/placeholder.svg'}
                                                alt={`Uploaded ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        </Box>
                                    ))}

                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 1,
                                        border: '1px dashed #90caf9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: '#e3f2fd',
                                    }}
                                    onClick={triggerFileInput}
                                >
                                    <AddIcon sx={{ color: '#90caf9' }} />
                                </Box>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    multiple
                                />
                            </Box>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Descriptions
                            </Typography>
                            <Box
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    mb: 1,
                                }}
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={5}
                                    placeholder="e.g An all-time favorite blend with citrus fruit character, caramel flavors, and a pleasant faintly floral aroma."
                                    name="description"
                                    value={data.description}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            border: 'none',
                                        },
                                    }}
                                />
                                <Divider />
                                <Box sx={{ display: 'flex', p: 1 }}>
                                    <IconButton size="small">
                                        <InsertEmoticonIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small">
                                        <FormatBoldIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small">
                                        <FormatItalicIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small">
                                        <FormatListBulleted fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small">
                                        <FormatListNumbered fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small">
                                        <LinkIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Maximum 500 characters
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {data.description.length} / 500
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    {addMenuStep === 1 ? (
                        <>
                            <Button
                                onClick={onClose}
                                sx={{
                                    color: 'text.primary',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleNextStep}
                                variant="contained"
                                sx={{
                                    backgroundColor: '#003B5C',
                                    '&:hover': {
                                        backgroundColor: '#002A41',
                                    },
                                }}
                            >
                                Next
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={handlePreviousStep}
                                sx={{
                                    color: 'text.primary',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={handleSaveMenu}
                                variant="contained"
                                sx={{
                                    backgroundColor: '#003B5C',
                                    '&:hover': {
                                        backgroundColor: '#002A41',
                                    },
                                }}
                                disabled={processing}
                                loading={processing}
                                loadingPosition="start"
                            >
                                Save
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AddMenu;
