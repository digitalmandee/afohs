import SideNav from '@/components/App/SideBar/SideNav';
import { router, useForm } from '@inertiajs/react';
import { Add as AddIcon, Close as CloseIcon, EventSeat as EventSeatIcon, FormatBold as FormatBoldIcon, FormatItalic as FormatItalicIcon, FormatListBulleted, FormatListNumbered, InsertEmoticon as InsertEmoticonIcon, Link as LinkIcon, LocalMall as LocalMallIcon, LocalShipping as LocalShippingIcon, ShoppingBag as ShoppingBagIcon, Delete as DeleteIcon } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, Divider, Grid, IconButton, InputAdornment, MenuItem, Paper, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronDown } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { routeNameForContext } from '@/lib/utils';
import POSLayout from "@/components/POSLayout";


const AddProduct = ({ product, id }) => {
    const [open, setOpen] = useState(true);
    const { data, setData, submit, processing, errors, reset, transform } = useForm(
        id
            ? {
                  id: product.id,
                  name: product.name || '',
                  // Auto-generate menu_code if missing for existing items effectively
                  menu_code: product.menu_code || String(product.id),
                  category_id: product.category_id || '',
                  sub_category_id: product.sub_category_id || '',
                  manufacturer_id: product.manufacturer_id || '',
                  unit_id: product.unit_id || '',
                  item_type: product.item_type || 'finished_product',
                  is_salable: product.is_salable ?? true,
                  is_purchasable: product.is_purchasable ?? true,
                  is_returnable: product.is_returnable ?? true,
                  is_taxable: product.is_taxable ?? false,
                  current_stock: product.current_stock || 0,
                  minimal_stock: product.minimal_stock || 0,
                  manage_stock: product.manage_stock ?? false,
                  notify_when_out_of_stock: product.notify_when_out_of_stock ?? false,
                  available_order_types: product.available_order_types || [],
                  cost_of_goods_sold: product.cost_of_goods_sold || '',
                  base_price: product.base_price || '',
                  profit: product.profit || '0.00',
                  is_discountable: product.is_discountable ?? true,
                  max_discount: product.max_discount || '',
                  max_discount_type: product.max_discount_type || 'percentage',
                  variants: product.variants || [],
                  description: product.description || '',
                  images: product.images || [],
              }
            : {
                  name: '',
                  menu_code: '',
                  category_id: '',
                  sub_category_id: '',
                  manufacturer_id: '',
                  unit_id: '',
                  item_type: 'finished_product',
                  is_salable: true,
                  is_purchasable: true,
                  is_returnable: true,
                  is_taxable: false,
                  current_stock: '',
                  minimal_stock: '',
                  manage_stock: false,
                  notify_when_out_of_stock: false,
                  available_order_types: [],
                  cost_of_goods_sold: '',
                  base_price: '',
                  profit: '0.00',
                  is_discountable: true,
                  max_discount: '',
                  max_discount_type: 'percentage',
                  variants: [
                      {
                          name: 'Size',
                          active: false,
                          type: 'multiple',
                          items: [
                              { name: 'Small', additional_price: 0, stock: 0 },
                              { name: 'Medium', additional_price: 0, stock: 0 },
                              { name: 'Large', additional_price: 0, stock: 0 },
                          ],
                          newItem: { name: '', additional_price: '', stock: '' },
                      },
                  ],
                  description: '',
                  images: [],
              },
    );

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [units, setUnits] = useState([]);
    const [addMenuStep, setAddMenuStep] = useState(1);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]); // For existing images from server
    const [deletedImages, setDeletedImages] = useState([]); // Track deleted images

    // Ingredients state
    const [ingredients, setIngredients] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    // Removed old discount formData/tempFormData - now using is_discountable toggle in main data
    const fileInputRef = useRef(null);
    const [fieldErrors, setFieldErrors] = useState({}); // State to store field-specific errors

    const orderTypes = [
        { value: 'dineIn', label: 'Dine In', icon: EventSeatIcon },
        { value: 'pickUp', label: 'Pick Up', icon: LocalMallIcon },
        { value: 'delivery', label: 'Delivery', icon: LocalShippingIcon },
        { value: 'takeaway', label: 'Takeaway', icon: ShoppingBagIcon },
        { value: 'reservation', label: 'Reservation', icon: EventSeatIcon },
    ];

    // Menu Steps
    const handleNextStep = () => {
        if (addMenuStep === 1) {
            const validationErrors = getMenuValidationErrors(data);
            if (validationErrors.length > 0) {
                // Map errors to fields
                const newFieldErrors = {};
                validationErrors.forEach((error) => {
                    if (error.includes('Name')) newFieldErrors.name = error;
                    if (error.includes('Category')) newFieldErrors.category_id = error;
                    if (error.includes('Current stock')) newFieldErrors.current_stock = error;
                    if (error.includes('Minimal stock')) newFieldErrors.minimal_stock = error;
                    if (error.includes('order type')) newFieldErrors.available_order_types = error;
                    if (error.includes('COGS')) newFieldErrors.cost_of_goods_sold = error;
                    if (error.includes('Base price')) newFieldErrors.base_price = error;
                    if (error.includes('Profit')) newFieldErrors.profit = error;
                });
                setFieldErrors(newFieldErrors);
                enqueueSnackbar('Please fix the errors before proceeding', { variant: 'error' });
                return;
            }
            if (data.manage_stock && hasConfiguredActiveVariants(data.variants)) {
                setFieldErrors((prev) => ({
                    ...prev,
                    variants: 'Warehouse-managed products cannot use variant-level stock yet.',
                }));
                enqueueSnackbar('Warehouse-managed products cannot use variant stock yet.', { variant: 'error' });
                return;
            }
            setFieldErrors({}); // Clear errors if validation passes
        }
        setAddMenuStep(addMenuStep + 1);
    };

    const getMenuValidationErrors = (menu) => {
        const errors = [];
        if (!menu.name.trim()) errors.push('Name is required');
        if (!menu.category_id) errors.push('Category is required');
        if (menu.manage_stock) {
            if (menu.current_stock !== '' && menu.current_stock !== null && isNaN(menu.current_stock)) errors.push('Current stock must be a valid number');
            if (menu.minimal_stock !== '' && menu.minimal_stock !== null && isNaN(menu.minimal_stock)) errors.push('Minimal stock must be a valid number');
        }
        if (!menu.available_order_types || menu.available_order_types.length === 0) errors.push('At least one order type must be selected');
        if (menu.cost_of_goods_sold === '' || menu.cost_of_goods_sold === null || isNaN(menu.cost_of_goods_sold)) errors.push('COGS must be a valid number');
        if (menu.base_price === '' || menu.base_price === null || isNaN(menu.base_price)) errors.push('Base price must be a valid number');
        // Profit is calculated, usually fine, but good to check
        // if (!menu.profit || isNaN(menu.profit)) errors.push('Profit must be a valid number');
        return errors;
    };

    const handlePreviousStep = () => {
        setAddMenuStep(addMenuStep - 1);
        setFieldErrors({}); // Clear errors when going back
    };

    const normalizeInt = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        const n = Number.parseInt(String(value), 10);
        return Number.isNaN(n) ? 0 : n;
    };

    const hasConfiguredActiveVariants = (variants = []) => variants.some((variant) => variant?.active && Array.isArray(variant.items) && variant.items.some((item) => item?.name));

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for the field when user starts typing
        setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleManageStockToggle = (checked) => {
        setData((prev) => ({
            ...prev,
            manage_stock: checked,
            ...(checked
                ? {}
                : {
                      current_stock: 0,
                      minimal_stock: 0,
                      notify_when_out_of_stock: false,
                  }),
        }));
        setFieldErrors((prev) => ({
            ...prev,
            current_stock: '',
            minimal_stock: '',
        }));
    };

    const openDiscountDialog = () => {
        setTempFormData(formData);
    };

    const handleOrderTypeToggle = (type) => {
        setData((prev) => ({
            ...prev,
            available_order_types: prev.available_order_types.includes(type) ? prev.available_order_types.filter((t) => t !== type) : [...prev.available_order_types, type],
        }));
        setFieldErrors((prev) => ({ ...prev, available_order_types: '' }));
    };

    const handleSelectAll = () => {
        setData((prev) => {
            const allSelected = orderTypes.every((opt) => prev.available_order_types.includes(opt.value));
            return {
                ...prev,
                available_order_types: allSelected ? [] : orderTypes.map((opt) => opt.value),
            };
        });
        setFieldErrors((prev) => ({ ...prev, available_order_types: '' }));
    };

    // Handle variant changes
    const handleVariantToggle = (name) => {
        setData((prev) => {
            const updatedVariants = prev.variants.map((variant) => (variant.name === name ? { ...variant, active: !variant.active } : variant));
            return { ...prev, variants: updatedVariants };
        });
    };

    const handleVariantNameChange = (variantIndex, value) => {
        setData((prev) => {
            const variants = [...prev.variants];
            variants[variantIndex].name = value;
            return { ...prev, variants };
        });
    };

    const updateVariantItem = (variantIndex, itemIndex, field, value) => {
        setData((prev) => {
            const variants = [...prev.variants];
            const items = [...variants[variantIndex].items];
            items[itemIndex] = { ...items[itemIndex], [field]: value };
            variants[variantIndex].items = items;
            return { ...prev, variants };
        });
    };

    const updateNewVariantField = (variantIndex, field, value) => {
        setData((prev) => {
            const variants = [...prev.variants];
            const newItem = { ...(variants[variantIndex].newItem || {}) };
            newItem[field] = value;
            variants[variantIndex].newItem = newItem;
            return { ...prev, variants };
        });
    };

    const addVariantItem = (variantIndex) => {
        setData((prev) => {
            const variants = [...prev.variants];
            const newItem = variants[variantIndex].newItem;
            if (!newItem?.name) return prev;
            variants[variantIndex].items = [
                ...(variants[variantIndex].items || []),
                {
                    name: newItem.name,
                    additional_price: parseFloat(newItem.additional_price) || 0,
                    stock: parseInt(newItem.stock) || 0,
                },
            ];
            variants[variantIndex].newItem = { name: '', additional_price: '', stock: '' };
            return { ...prev, variants };
        });
    };

    const removeVariantItem = (variantIndex, itemIndex) => {
        setData((prev) => {
            const variants = [...prev.variants];
            variants[variantIndex].items = variants[variantIndex].items.filter((_, idx) => idx !== itemIndex);
            return { ...prev, variants };
        });
    };

    const handleAddNewVariant = () => {
        setData((prev) => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    name: 'New Variant',
                    type: 'multiple',
                    active: true,
                    items: [],
                    newItem: { name: '', additional_price: '', stock: '' },
                },
            ],
        }));
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

    // Handle existing image deletion
    const handleDeleteExistingImage = (imageUrl) => {
        setExistingImages((prev) => prev.filter((img) => img !== imageUrl));

        // Convert full URL back to path for backend (remove origin, keep the full path but remove leading slash if present matching DB)
        const imagePath = imageUrl.replace(window.location.origin, '').replace(/^\/+/, '');
        setDeletedImages((prev) => [...prev, imagePath]);
    };

    // Handle new uploaded image deletion
    const handleDeleteUploadedImage = (index) => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index));
        setData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // Ingredient functions
    const loadIngredients = async () => {
        try {
            const response = await axios.get(route(routeNameForContext('api.ingredients')));
            setIngredients(response.data);
        } catch (error) {
            console.error('Error loading ingredients:', error);
        }
    };

    const addIngredient = (ingredient) => {
        if (!selectedIngredients.find((ing) => ing.id === ingredient.id)) {
            setSelectedIngredients([
                ...selectedIngredients,
                {
                    id: ingredient.id,
                    name: ingredient.name,
                    unit: ingredient.unit,
                    remaining_quantity: ingredient.remaining_quantity,
                    quantity_used: 0,
                    cost: ingredient.cost_per_unit || 0,
                    balance_source: ingredient.balance_source || (ingredient.inventory_product_id ? 'warehouse' : 'legacy'),
                },
            ]);
        }
    };

    const removeIngredient = (ingredientId) => {
        setSelectedIngredients(selectedIngredients.filter((ing) => ing.id !== ingredientId));
    };

    const updateIngredientQuantity = (ingredientId, field, value) => {
        setSelectedIngredients(selectedIngredients.map((ing) => (ing.id === ingredientId ? { ...ing, [field]: parseFloat(value) || 0 } : ing)));
    };

    const calculateTotalIngredientCost = () => {
        if (!selectedIngredients || selectedIngredients.length === 0) {
            return 0;
        }
        return selectedIngredients.reduce((total, ing) => {
            const cost = parseFloat(ing.cost) || 0;
            return total + cost;
        }, 0);
    };

    // Save new menu
    const handleSaveMenu = () => {
        transform((data) => ({
            ...data,
            deleted_images: deletedImages, // Include deleted images for backend processing
            manage_stock: Boolean(data.manage_stock),
            current_stock: data.manage_stock ? 0 : normalizeInt(data.current_stock),
            minimal_stock: data.manage_stock ? normalizeInt(data.minimal_stock) : 0,
            notify_when_out_of_stock: data.manage_stock ? Boolean(data.notify_when_out_of_stock) : false,
            ingredients: selectedIngredients.map((ing) => ({
                id: ing.id,
                quantity_used: ing.quantity_used,
                cost: ing.cost,
            })),
        }));
        const isEdit = Boolean(id);
        const routeName = isEdit ? 'inventory.update' : 'inventory.store';
        const url = isEdit ? route(routeNameForContext(routeName), { id }) : route(routeNameForContext(routeName));
        submit(isEdit ? 'put' : 'post', url, {
            onSuccess: () => {
                enqueueSnackbar(id ? 'Product updated successfully' : 'Product added successfully', { variant: 'success' });
                reset();
                setUploadedImages([]);
                setExistingImages([]);
                setDeletedImages([]);
                router.visit(route(routeNameForContext('inventory.index')));
            },
            onError: (errors) => {
                console.log(errors);
                enqueueSnackbar('Something went wrong', { variant: 'error' });
            },
        });
    };

    // Calculate profit when cost_of_goods_sold or base_price changes
    useEffect(() => {
        if (data.cost_of_goods_sold && data.base_price) {
            const cogs = Number.parseFloat(data.cost_of_goods_sold);
            const basePrice = Number.parseFloat(data.base_price);
            if (!isNaN(cogs) && !isNaN(basePrice)) {
                const profit = (basePrice - cogs).toFixed(2);
                setData((prev) => ({
                    ...prev,
                    profit,
                }));
            }
        }
    }, [data.cost_of_goods_sold, data.base_price]);

    const fetchCategories = () => {
        axios.get(route(routeNameForContext('inventory.categories'))).then((response) => {
            setCategories(response.data.categories);
        });
    };

    const fetchManufacturers = () => {
        axios.get(route(routeNameForContext('api.manufacturers.list'))).then((response) => {
            setManufacturers(response.data.manufacturers);
        });
    };

    const fetchUnits = () => {
        axios.get(route(routeNameForContext('api.units.list'))).then((response) => {
            setUnits(response.data.units);
        });
    };

    const fetchSubCategories = (categoryId) => {
        if (!categoryId) {
            setSubCategories([]);
            return;
        }
        axios.get(route(routeNameForContext('api.sub-categories.by-category'), categoryId)).then((response) => {
            setSubCategories(response.data.subCategories);
        });
    };

    useEffect(() => {
        if (data.category_id) {
            fetchSubCategories(data.category_id);
        } else {
            setSubCategories([]);
        }
    }, [data.category_id]);

    useEffect(() => {
        fetchCategories();
        fetchManufacturers();
        loadIngredients();

        // Load existing images when editing
        if (id && product && product.images) {
            // Images already have full paths from FileHelper
            const imageUrls = product.images.map((image) => {
                if (image.startsWith('http')) return image;
                // Ensure leading slash for relative paths before prepending origin
                const path = image.startsWith('/') ? image : `/${image}`;
                return `${window.location.origin}${path}`;
            });
            setExistingImages(imageUrls);
        }

        // Load existing ingredients when editing
        if (id && product?.ingredients) {
            setSelectedIngredients(
                product.ingredients.map((ing) => ({
                    id: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    remaining_quantity: ing.remaining_quantity,
                    quantity_used: ing.pivot?.quantity_used || 0,
                    cost: ing.pivot?.cost || ing.cost_per_unit || 0,
                    balance_source: ing.balance_source || (ing.inventory_product_id ? 'warehouse' : 'legacy'),
                })),
            );
        }
    }, [id, product]);

    useEffect(() => {
        fetchCategories();
        fetchManufacturers();
        fetchUnits();
    }, []);

    // Render
    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} /> */}
            <Box
                sx={{
                    p:2,
                    minHeight:'100vh',
                    bgcolor:'#f5f5f5'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <ArrowBackIcon 
                    sx={{ color: '#063455', cursor: 'pointer' }} 
                    onClick={() => router.visit(route(routeNameForContext('inventory.index')))} 
                    />
                    <Typography
                        sx={{
                            fontSize: '30px',
                            color: '#063455',
                            fontWeight:'700',
                            marginLeft: 3,
                        }}
                    >
                        {id ? 'Edit Menu' : 'Add Menu'}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        width: '80%',
                        margin: '0 auto',
                    }}
                >
                    <DialogContent sx={{ p: 0 }}>
                        {/* Step Indicators */}
                        <Box sx={{ px: 3, mb: 3, py: 1.5, display: 'flex', alignItems: 'center', bgcolor: '#F0F0F0' }}>
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
                                    Ingredients
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1, mx: 2, height: 1, backgroundColor: '#e0e0e0' }} />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: '50%',
                                        backgroundColor: addMenuStep === 3 ? '#003B5C' : '#e0e0e0',
                                        color: addMenuStep === 3 ? 'white' : 'text.secondary',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 1,
                                    }}
                                >
                                    3
                                </Box>
                                <Typography variant="body2" fontWeight="bold" color={addMenuStep === 3 ? 'text.primary' : 'text.secondary'}>
                                    Descriptions & Images
                                </Typography>
                            </Box>
                        </Box>

                        {/* Step 1: General Information */}
                        {addMenuStep === 1 && (
                            <Box sx={{ px: 3, pb: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Product Name
                                        </Typography>
                                        <TextField required fullWidth placeholder="Cappucino" name="name" value={data.name} onChange={handleInputChange} variant="outlined" size="small" error={!!fieldErrors.name} helperText={fieldErrors.name} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Item Code{' '}
                                            <Typography component="span" color="text.secondary" fontSize="12px">
                                                (Auto-generated, editable)
                                            </Typography>
                                        </Typography>
                                        <TextField fullWidth placeholder="e.g. 101" name="menu_code" value={data.menu_code} onChange={handleInputChange} variant="outlined" size="small" helperText={!id ? 'Will be auto-generated if left empty' : ''} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Categories
                                        </Typography>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            options={categories || []}
                                            getOptionLabel={(option) => option.name || ''}
                                            value={categories?.find((cat) => cat.id === data.category_id) || null}
                                            onChange={(event, newValue) => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    category_id: newValue ? newValue.id : '',
                                                    sub_category_id: '', // Reset sub-category on category change
                                                }));
                                                setFieldErrors((prev) => ({ ...prev, category_id: '' }));
                                            }}
                                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                                            renderInput={(params) => <TextField {...params} placeholder="Search or select category" variant="outlined" error={!!fieldErrors.category_id} helperText={fieldErrors.category_id} />}
                                            ListboxProps={{
                                                style: { maxHeight: 200 },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Sub Category
                                        </Typography>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            options={subCategories || []}
                                            getOptionLabel={(option) => option.name || ''}
                                            value={subCategories?.find((sub) => sub.id === data.sub_category_id) || null}
                                            disabled={!data.category_id}
                                            onChange={(event, newValue) => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    sub_category_id: newValue ? newValue.id : '',
                                                }));
                                            }}
                                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                                            renderInput={(params) => <TextField {...params} placeholder={data.category_id ? 'Select sub category' : 'Select main category first'} variant="outlined" />}
                                            ListboxProps={{
                                                style: { maxHeight: 200 },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Manufacturer (Optional)
                                        </Typography>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            options={manufacturers || []}
                                            getOptionLabel={(option) => option.name || ''}
                                            value={manufacturers?.find((m) => m.id === data.manufacturer_id) || null}
                                            onChange={(event, newValue) => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    manufacturer_id: newValue ? newValue.id : '',
                                                }));
                                            }}
                                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                                            renderInput={(params) => <TextField {...params} placeholder="Select manufacturer" variant="outlined" />}
                                            ListboxProps={{
                                                style: { maxHeight: 200 },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Unit (Optional)
                                        </Typography>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            options={units || []}
                                            getOptionLabel={(option) => option.name || ''}
                                            value={units?.find((u) => u.id === data.unit_id) || null}
                                            onChange={(event, newValue) => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    unit_id: newValue ? newValue.id : '',
                                                }));
                                            }}
                                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                                            renderInput={(params) => <TextField {...params} placeholder="Select unit" variant="outlined" />}
                                            ListboxProps={{
                                                style: { maxHeight: 200 },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Item Type
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            {['finished_product', 'raw_material'].map((type) => (
                                                <Button key={type} variant={data.item_type === type ? 'contained' : 'outlined'} onClick={() => setData('item_type', type)} sx={{ textTransform: 'capitalize' }}>
                                                    {type.replace('_', ' ')}
                                                </Button>
                                            ))}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Switch checked={Boolean(data.manage_stock)} onChange={(e) => handleManageStockToggle(e.target.checked)} color="primary" />
                                            <Box sx={{ ml: 1 }}>
                                                <Typography variant="body1" sx={{ color: '#121212', fontSize: '14px', fontWeight: 500 }}>
                                                    Manage Stock
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Enable to track stock levels and prevent sales when out of stock
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    {Boolean(data.manage_stock) && (
                                        <>
                                            <Grid item xs={12}>
                                                <Alert severity="info">
                                                    Warehouse-managed stock is updated through opening balance, goods receipt, adjustment, and transfer. Direct product stock entry is disabled here.
                                                </Alert>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                                    Minimal Stock
                                                </Typography>
                                                <Box>
                                                    <Box sx={{ display: 'flex' }}>
                                                        <TextField fullWidth placeholder="10" name="minimal_stock" value={data.minimal_stock} onChange={handleInputChange} variant="outlined" size="small" type="number" error={!!fieldErrors.minimal_stock} />
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
                                                                borderColor: fieldErrors.minimal_stock ? 'error.main' : '#e0e0e0', // Highlight border if error
                                                            }}
                                                        >
                                                            <Typography variant="body2">Pcs</Typography>
                                                        </Box>
                                                    </Box>
                                                    {fieldErrors.minimal_stock && (
                                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                                            {fieldErrors.minimal_stock}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Grid>
                                        </>
                                    )}
                                    <Grid item xs={12} container spacing={2}>
                                        {[
                                            { label: 'Salable', field: 'is_salable' },
                                            { label: 'Purchasable', field: 'is_purchasable' },
                                            { label: 'Returnable', field: 'is_returnable' },
                                            { label: 'Taxable', field: 'is_taxable' },
                                        ].map(({ label, field }) => (
                                            <Grid item xs={6} md={3} key={field}>
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <Typography variant="body2">{label}</Typography>
                                                    <Switch checked={!!data[field]} onChange={(e) => setData(field, e.target.checked)} color="primary" size="small" />
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box
                                            sx={{
                                                p: 2,
                                                border: '1px solid #063455',
                                                borderRadius: 1,
                                                backgroundColor: '#D0E2F2',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box sx={{ mr: 2 }}>
                                                        <img src="/placeholder.svg" alt="Discountable" style={{ width: 40, height: 40 }} />
                                                    </Box>
                                                    <Box>
                                                        <Typography
                                                            variant="body1"
                                                            fontWeight="medium"
                                                            sx={{
                                                                color: '#121212',
                                                                fontSize: '16px',
                                                            }}
                                                        >
                                                            Discountable Item
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Allow discount on this item during order
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Switch checked={data.is_discountable !== false} onChange={() => setData((prev) => ({ ...prev, is_discountable: prev.is_discountable === false ? true : false }))} color="primary" />
                                            </Box>

                                            {data.is_discountable !== false && (
                                                <Box sx={{ display: 'flex', gap: 2, mt: 1, pl: 7 }}>
                                                    <TextField
                                                        label="Max Discount"
                                                        type="number"
                                                        value={data.max_discount || ''}
                                                        onChange={(e) => setData('max_discount', e.target.value)}
                                                        size="small"
                                                        sx={{ width: '150px' }}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">{data.max_discount_type === 'percentage' ? '%' : 'Rs'}</InputAdornment>,
                                                        }}
                                                    />
                                                    <TextField select label="Type" value={data.max_discount_type || 'percentage'} onChange={(e) => setData('max_discount_type', e.target.value)} size="small" sx={{ width: '150px' }}>
                                                        <MenuItem value="percentage">Percentage</MenuItem>
                                                        <MenuItem value="amount">Fixed Amount</MenuItem>
                                                    </TextField>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box
                                            sx={{
                                                p: 2,
                                                border: '1px solid #063455',
                                                borderRadius: 1,
                                                backgroundColor: '#D0E2F2',
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
                                                    <Typography
                                                        variant="body1"
                                                        fontWeight="medium"
                                                        sx={{
                                                            color: '#121212',
                                                            fontSize: '16px',
                                                        }}
                                                    >
                                                        Out of Stock Menu
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Out of Stock notification
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Switch checked={data.notify_when_out_of_stock} onChange={() => setData((prev) => ({ ...prev, notify_when_out_of_stock: !prev.notify_when_out_of_stock }))} color="primary" />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography
                                                variant="body1"
                                                fontWeight="medium"
                                                sx={{
                                                    color: '#121212',
                                                    fontSize: '14px',
                                                }}
                                            >
                                                Select Order Type
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ mr: 1, color: '#121212', fontSize: '14px' }}>
                                                    Select All
                                                </Typography>
                                                <Switch checked={orderTypes.every((opt) => data.available_order_types.includes(opt.value))} onChange={handleSelectAll} color="primary" size="small" />
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                            {orderTypes.map((item, index) => {
                                                const isSelected = data.available_order_types.includes(item.value);
                                                return (
                                                    <Button
                                                        key={index}
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
                                        {fieldErrors.available_order_types && (
                                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                                {fieldErrors.available_order_types}
                                            </Typography>
                                        )}
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Cost Of Goods Sold (COGS)
                                        </Typography>
                                        <Box>
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
                                                        borderColor: fieldErrors.cost_of_goods_sold ? 'error.main' : '#e0e0e0', // Highlight border if error
                                                    }}
                                                >
                                                    <Typography variant="body2">Rs</Typography>
                                                </Box>
                                                <TextField fullWidth placeholder="3.00" name="cost_of_goods_sold" value={data.cost_of_goods_sold} onChange={handleInputChange} variant="outlined" size="small" type="number" inputProps={{ step: '0.01' }} error={!!fieldErrors.cost_of_goods_sold} />
                                            </Box>
                                            {fieldErrors.cost_of_goods_sold && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                                    {fieldErrors.cost_of_goods_sold}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Base Price Selling
                                        </Typography>
                                        <Box>
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
                                                        borderColor: fieldErrors.base_price ? 'error.main' : '#e0e0e0', // Highlight border if error
                                                    }}
                                                >
                                                    <Typography variant="body2">Rs</Typography>
                                                </Box>
                                                <TextField fullWidth placeholder="4.00" name="base_price" value={data.base_price} onChange={handleInputChange} variant="outlined" size="small" type="number" inputProps={{ step: '0.01' }} error={!!fieldErrors.base_price} />
                                            </Box>
                                            {fieldErrors.base_price && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                                    {fieldErrors.base_price}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="body1" sx={{ mb: 1, color: '#121212', fontSize: '14px' }}>
                                            Profit Estimate
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="h6" fontWeight="bold">
                                                Rs {data.profit}
                                            </Typography>
                                        </Box>
                                        {fieldErrors.profit && (
                                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                                {fieldErrors.profit}
                                            </Typography>
                                        )}
                                    </Grid>

                                    {/* Product Variant */}
                                    <Grid item xs={12}>
                                        {errors.variants && (
                                            <Alert severity="error" sx={{ mb: 2 }}>
                                                {errors.variants}
                                            </Alert>
                                        )}
                                        {Boolean(data.manage_stock) && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                Warehouse-managed products cannot use variant-level stock yet. Keep variants for pricing only, or disable stock management until warehouse-backed variants are added.
                                            </Alert>
                                        )}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography
                                                variant="h6"
                                                fontWeight="medium"
                                                sx={{
                                                    color: '#121212',
                                                    fontSize: '16px',
                                                }}
                                            >
                                                Product Variant
                                            </Typography>
                                        </Box>

                                        {data.variants.map((variant, variantIndex) => (
                                            <Box key={variant.name} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    {variant.active ? (
                                                        <TextField size="small" value={variant.name} onChange={(e) => handleVariantNameChange(variantIndex, e.target.value)} sx={{ fontWeight: 'bold' }} />
                                                    ) : (
                                                        <Typography variant="body1" fontWeight="bold">
                                                            {variant.name}
                                                        </Typography>
                                                    )}
                                                    <Switch checked={!!variant.active} onChange={() => handleVariantToggle(variant.name)} color="primary" size="small" />
                                                </Box>

                                                {variant.active && (
                                                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        <Grid container sx={{ mb: 1 }}>
                                                            <Grid item xs={5}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Variant Name
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Additional Price
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={3}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {data.manage_stock ? 'Stock (Unsupported)' : 'Stock'}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>

                                                        {variant.items.map((item, itemIndex) => (
                                                            <Grid container sx={{ mb: 1 }} key={itemIndex}>
                                                                <Grid item xs={5}>
                                                                    {variant.type === 'single' ? <Typography>{item.name}</Typography> : <TextField size="small" placeholder="Variant Name" value={item.name} onChange={(e) => updateVariantItem(variantIndex, itemIndex, 'name', e.target.value)} sx={{ flex: 1, mr: 1 }} />}
                                                                </Grid>
                                                                <Grid item xs={3}>
                                                                    <TextField size="small" type="number" placeholder="Price" value={item.additional_price} inputProps={{ min: 0 }} onChange={(e) => updateVariantItem(variantIndex, itemIndex, 'additional_price', e.target.value)} sx={{ width: 130, mr: 1 }} />
                                                                </Grid>
                                                                <Grid item xs={3}>
                                                                    <TextField size="small" type="number" placeholder="Stock" value={item.stock} inputProps={{ min: 0 }} onChange={(e) => updateVariantItem(variantIndex, itemIndex, 'stock', e.target.value)} sx={{ width: 130, mr: 1 }} disabled={Boolean(data.manage_stock)} />
                                                                </Grid>
                                                                <Grid item xs={1}>
                                                                    <IconButton size="small" onClick={() => removeVariantItem(variantIndex, itemIndex)} color="error">
                                                                        <CloseIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Grid>
                                                            </Grid>
                                                        ))}

                                                        {variant.type === 'multiple' && (
                                                            <>
                                                                <Grid container sx={{ mb: 1 }}>
                                                                    <Grid item xs={5}>
                                                                        <TextField placeholder="e.g. Oreo" size="small" value={variant.newItem?.name || ''} onChange={(e) => updateNewVariantField(variantIndex, 'name', e.target.value)} sx={{ flex: 1, mr: 1 }} />
                                                                    </Grid>
                                                                    <Grid item xs={3}>
                                                                        <Box sx={{ display: 'flex', width: 130, mr: 1 }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e0e0', borderRight: 'none', px: 1, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }}>
                                                                                <Typography variant="body2">Rs</Typography>
                                                                            </Box>
                                                                            <TextField type="number" placeholder="10" size="small" value={variant.newItem?.additional_price || ''} onChange={(e) => updateNewVariantField(variantIndex, 'additional_price', e.target.value)} fullWidth inputProps={{ min: 0 }} />
                                                                        </Box>
                                                                    </Grid>
                                                                    <Grid item xs={3}>
                                                                        <TextField type="number" placeholder="0" size="small" value={variant.newItem?.stock || ''} onChange={(e) => updateNewVariantField(variantIndex, 'stock', e.target.value)} sx={{ width: 130, mr: 1 }} inputProps={{ min: 0 }} disabled={Boolean(data.manage_stock)} />
                                                                    </Grid>
                                                                    <Grid item xs={1}>
                                                                        <IconButton size="small" onClick={() => addVariantItem(variantIndex)} color="primary">
                                                                            <AddIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Grid>
                                                                </Grid>
                                                                <Button variant="text" startIcon={<AddIcon />} onClick={() => addVariantItem(variantIndex)} sx={{ mt: 1 }} disabled={Boolean(data.manage_stock)}>
                                                                    Add Variant Item
                                                                </Button>
                                                            </>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        ))}

                                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddNewVariant} sx={{ mt: 2 }}>
                                            Add New Variant
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Step 2: Ingredients */}
                        {addMenuStep === 2 && (
                            <Box sx={{ px: 3, pb: 3 }}>
                                <Typography variant="h6" sx={{ mb: 3, color: '#121212' }}>
                                    Ingredients Management
                                </Typography>

                                {/* Header */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body1" sx={{ color: '#121212', fontSize: '14px' }}>
                                        Select recipe ingredients. Linked ingredients deduct warehouse-managed raw-material stock during POS orders.
                                    </Typography>
                                </Box>

                                {/* Add Ingredient */}
                                <Box sx={{ mb: 3 }}>
                                    <Autocomplete
                                        options={ingredients.filter((ing) => !selectedIngredients.find((sel) => sel.id === ing.id))}
                                        getOptionLabel={(option) => `${option.name} (${option.remaining_quantity} ${option.unit}, ${option.balance_source === 'warehouse' ? 'warehouse' : 'legacy'}) - Rs ${option.cost_per_unit || 0}`}
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                                addIngredient(newValue);
                                            }
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Add Ingredient" placeholder="Search and select ingredients..." size="small" />}
                                    />
                                </Box>

                                {/* Selected Ingredients Table */}
                                {selectedIngredients.length > 0 && (
                                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        <strong>Ingredient</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Available</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Quantity Used</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Cost (PKR)</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Quantity Per Unit</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Actions</strong>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedIngredients.map((ingredient) => {
                                                    return (
                                                        <TableRow key={ingredient.id}>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <span>{ingredient.name}</span>
                                                                    <Chip
                                                                        size="small"
                                                                        label={ingredient.balance_source === 'warehouse' ? 'Warehouse' : 'Legacy'}
                                                                        color={ingredient.balance_source === 'warehouse' ? 'info' : 'default'}
                                                                    />
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                {ingredient.remaining_quantity} {ingredient.unit}
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField size="small" type="number" value={ingredient.quantity_used} onChange={(e) => updateIngredientQuantity(ingredient.id, 'quantity_used', e.target.value)} inputProps={{ min: 0, step: 0.01 }} sx={{ width: '100px' }} />
                                                                <Typography variant="caption" sx={{ ml: 1 }}>
                                                                    {ingredient.unit}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField size="small" type="number" value={ingredient.cost} onChange={(e) => updateIngredientQuantity(ingredient.id, 'cost', e.target.value)} inputProps={{ min: 0, step: 0.01 }} sx={{ width: '100px' }} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {ingredient.quantity_used} {ingredient.unit}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <IconButton size="small" color="error" onClick={() => removeIngredient(ingredient.id)}>
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                <TableRow>
                                                    <TableCell colSpan={3}>
                                                        <strong>Total Ingredient Cost:</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>Rs {(calculateTotalIngredientCost() || 0).toFixed(2)}</strong>
                                                    </TableCell>
                                                    <TableCell colSpan={2}></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                {selectedIngredients.length === 0 && <Alert severity="info">No ingredients selected. Add ingredients to track usage and costs.</Alert>}
                            </Box>
                        )}

                        {/* Step 3: Descriptions and Image */}
                        {addMenuStep === 3 && (
                            <Box sx={{ px: 3, pb: 3 }}>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    Menu Image
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                                    {/* Display existing images */}
                                    {existingImages.map((image, index) => (
                                        <Box
                                            key={`existing-${index}`}
                                            sx={{
                                                position: 'relative',
                                                width: 80,
                                                height: 80,
                                                borderRadius: 1,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <img
                                                src={image}
                                                alt={`Existing ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteExistingImage(image)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 2,
                                                    right: 2,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    },
                                                }}
                                            >
                                                <CloseIcon fontSize="small" color="error" />
                                            </IconButton>
                                        </Box>
                                    ))}

                                    {/* Display newly uploaded images */}
                                    {uploadedImages.map((image, index) => (
                                        <Box
                                            key={`new-${index}`}
                                            sx={{
                                                position: 'relative',
                                                width: 80,
                                                height: 80,
                                                borderRadius: 1,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <img
                                                src={image}
                                                alt={`New ${index + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteUploadedImage(index)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 2,
                                                    right: 2,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    },
                                                }}
                                            >
                                                <CloseIcon fontSize="small" color="error" />
                                            </IconButton>
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
                                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} accept="image/*" multiple />
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
                                        {(data.description || '').length} / 500
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ p: 3, justifyContent: 'flex-end' }}>
                        {addMenuStep === 1 ? (
                            <>
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
                        ) : addMenuStep === 2 ? (
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
                </Box>
            </Box>
        </>
    );
};
AddProduct.layout = (page) => <POSLayout>{page}</POSLayout>;
export default AddProduct;
