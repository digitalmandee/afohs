'use client';

import { tenantAsset } from '@/helpers/asset';
import { routeNameForContext } from '@/lib/utils';
import { Search } from '@mui/icons-material';
import { Avatar, Badge, Box, Button, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import VariantSelectorDialog from '../VariantSelectorDialog';

const AddItems = ({ setOrderItems, orderItems, setShowAddItem, allrestaurants, initialRestaurantId, orderType, disableRestaurantSelect = false }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(initialRestaurantId || allrestaurants[0]?.id || '');

    useEffect(() => {
        if (!disableRestaurantSelect) return;
        const next = initialRestaurantId || allrestaurants[0]?.id || '';
        if (!next) return;
        setSelectedRestaurant(next);
    }, [disableRestaurantSelect, initialRestaurantId, allrestaurants]);

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const [variantPopupOpen, setVariantPopupOpen] = useState(false);
    const [variantProduct, setVariantProduct] = useState(null);
    const [initialEditItem, setInitialEditItem] = useState(null);

    const getItemKey = (orderItem) => {
        const productId = orderItem?.id ?? '';
        const variants = Array.isArray(orderItem?.variants) ? orderItem.variants : [];
        const variantsKey = variants
            .map((v) => `${v?.id ?? ''}:${v?.value ?? ''}`)
            .sort()
            .join(',');
        return `${productId}|${variantsKey}`;
    };

    const getUnitPrice = (orderItem) => {
        const base = parseFloat(orderItem?.price) || 0;
        const variants = Array.isArray(orderItem?.variants) ? orderItem.variants : [];
        const variantsSum = variants.reduce((sum, v) => sum + (parseFloat(v?.price) || 0), 0);
        return base + variantsSum;
    };

    const getDiscountAmountForQty = (orderItem, quantity, totalPrice) => {
        const discountValue = Number(orderItem?.discount_value || 0);
        if (!discountValue || discountValue <= 0) return 0;

        const discountType = orderItem?.discount_type || 'percentage';
        const gross = Number(totalPrice || 0);
        let discountAmount = 0;
        if (discountType === 'percentage') {
            discountAmount = Math.round(gross * (discountValue / 100));
        } else {
            discountAmount = Math.round(discountValue * quantity);
        }
        if (discountAmount > gross) discountAmount = gross;
        return discountAmount;
    };

    const addOrIncrementItem = (newOrderItem) => {
        setOrderItems((prev) => {
            const key = getItemKey(newOrderItem);
            const incomingQty = Number(newOrderItem?.quantity) || 1;
            const existingIndex = prev.findIndex((row) => !row?.removed && row?.status !== 'cancelled' && getItemKey(row?.order_item) === key);
            if (existingIndex === -1) {
                const unitPrice = getUnitPrice(newOrderItem);
                const totalPrice = unitPrice * incomingQty;
                return [
                    ...prev,
                    {
                        id: 'new',
                        order_item: {
                            ...newOrderItem,
                            quantity: incomingQty,
                            total_price: totalPrice,
                            discount_amount: getDiscountAmountForQty(newOrderItem, incomingQty, totalPrice),
                        },
                        removed: false,
                    },
                ];
            }

            return prev.map((row, idx) => {
                if (idx !== existingIndex) return row;

                const currentQty = Number(row?.order_item?.quantity) || 1;
                const nextQty = currentQty + incomingQty;
                const nextId = row?.id && typeof row.id === 'number' ? `update-${row.id}` : row.id;
                const unitPrice = getUnitPrice(row?.order_item);
                const totalPrice = unitPrice * nextQty;

                return {
                    ...row,
                    id: nextId,
                    order_item: {
                        ...row.order_item,
                        quantity: nextQty,
                        total_price: totalPrice,
                        discount_amount: getDiscountAmountForQty(row.order_item, nextQty, totalPrice),
                    },
                };
            });
        });
    };

    // This would be called when user clicks a product
    const handleProductClick = (product) => {
        if (product.manage_stock && product.minimal_stock > product.current_stock - 1) return;

        if (product.variants && product.variants.length > 0) {
            setVariantProduct(product);
            setVariantPopupOpen(true);
        } else {
            const item = {
                id: product.id,
                product_id: product.id,
                name: product.name,
                price: parseFloat(product.base_price),
                total_price: parseFloat(product.base_price),
                quantity: 1,
                tenant_id: product.tenant_id,
                category: product.category?.name || '',
                variants: [],
                is_discountable: product.is_discountable !== false,
                discount_value: 0,
                discount_type: 'percentage',
                discount_amount: 0,
                is_taxable: product.is_taxable,
                max_discount: product.max_discount,
                max_discount_type: product.max_discount_type,
                manage_stock: product.manage_stock,
                current_stock: product.current_stock,
                minimal_stock: product.minimal_stock,
                menu_code: product.menu_code,
            };

            addOrIncrementItem(item);
            // handleOrderDetailChange('order_items', [...orderDetails.order_items, item]);
        }
    };

    const handleVariantConfirm = (item) => {
        if (editingItemIndex !== null) {
            setOrderItems((prev) =>
                prev.map((row, idx) => {
                    if (idx !== editingItemIndex) return row;
                    const nextId = row?.id && typeof row.id === 'number' ? `update-${row.id}` : row.id;
                    const qty = Number(item?.quantity) || 1;
                    const unitPrice = getUnitPrice(item);
                    return {
                        ...row,
                        id: nextId,
                        order_item: {
                            ...item,
                            quantity: qty,
                            total_price: unitPrice * qty,
                        },
                        removed: false,
                    };
                }),
            );
        } else {
            addOrIncrementItem(item);
        }
        setVariantPopupOpen(false);
        setVariantProduct(null);
        setEditingItemIndex(null);
    };

    useEffect(() => {
        setProducts([]);
        axios.get(route(routeNameForContext('products.categories')), { params: { tenant_id: selectedRestaurant } }).then((res) => {
            const nextCategories = res.data.categories || [];
            setCategories(nextCategories);
            setSelectedCategory((prev) => {
                if (!prev) return nextCategories[0]?.id || null;
                const exists = nextCategories.some((c) => c.id === prev);
                return exists ? prev : nextCategories[0]?.id || null;
            });
        });
    }, [selectedRestaurant]);

    useEffect(() => {
        if (!selectedCategory) {
            setProducts([]);
            return;
        }
        axios
            .get(route(routeNameForContext('products.bycategory'), { category_id: selectedCategory }), {
                params: { order_type: orderType },
            })
            .then((res) => setProducts(res.data.products));
    }, [selectedCategory]);

    return (
        <>
            <div>
                <Box
                    sx={{
                        bgcolor: '#f5f5f5',
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, px: 3 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Button variant="outlined" size="small" onClick={() => setShowAddItem(false)} sx={{ textTransform: 'none' }}>
                                Close Add Item
                            </Button>
                        </Box>

                        {!disableRestaurantSelect && (
                            <Box>
                                <FormControl fullWidth>
                                    <InputLabel id="restuarant-label">Restuarants</InputLabel>
                                    <Select labelId="restuarant-label" size="small" value={selectedRestaurant} label="Restuarants" onChange={(e) => setSelectedRestaurant(e.target.value)}>
                                        {allrestaurants.length > 0 &&
                                            allrestaurants.map((item, index) => (
                                                <MenuItem value={item.id} key={index}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </Box>

                    {variantPopupOpen && variantProduct && (
                        <VariantSelectorDialog
                            open={variantPopupOpen}
                            onClose={() => {
                                setVariantPopupOpen(false);
                                setEditingItemIndex(null);
                                setInitialEditItem(null);
                            }}
                            // product={variantProduct}
                            productId={variantProduct?.id}
                            initialItem={initialEditItem}
                            onConfirm={handleVariantConfirm}
                        />
                    )}

                    {/* <pre>{JSON.stringify(orderDetails, null, 2)}</pre> */}

                    {/* Main Content */}
                    <Box
                        sx={{
                            display: 'flex',
                            flex: 1,
                            p: 1,
                            gap: 2,
                        }}
                    >
                        {/* Left Category Sidebar */}
                        <Box
                            sx={{
                                width: '80px',
                                marginLeft: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                bgcolor: '#FFFFFF',
                                px: 1,
                                py: 2,
                                borderRadius: '12px',
                                gap: 2,
                            }}
                        >
                            {categories.length > 0 &&
                                categories.map((category, index) => (
                                    <Box
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category.id)}
                                        sx={{
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            py: 1,
                                            cursor: 'pointer',
                                            bgcolor: selectedCategory === category.id ? '#f0f7ff' : 'transparent',
                                            border: selectedCategory === category.id ? '1px solid #063455' : '1px solid #E3E3E3',
                                        }}
                                    >
                                        {/* Skip image for first item */}
                                        {category.image && (
                                            <Avatar
                                                src={tenantAsset(category.image)}
                                                alt={category.name}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    mb: 1,
                                                    bgcolor: selectedCategory === category.id ? '#e3f2fd' : '#f5f5f5',
                                                }}
                                            />
                                        )}
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '12px',
                                                color: '#121212',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {category.name}
                                        </Typography>
                                    </Box>
                                ))}
                        </Box>

                        {/* Main Content Area */}
                        <Box
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '12px',
                                bgcolor: '#FBFBFB',
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    // mb: 2,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    bgcolor: 'transparent',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mr: 1 }}>
                                        {products.length > 0 ? products.length : '0'}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        Products
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <TextField
                                        placeholder="Search"
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            width: 300,
                                            // height:44,
                                            mr: 2,
                                            borderRadius: 0,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 0,
                                                backgroundColor: '#FFFFFF',
                                                '& fieldset': {
                                                    border: '1px solid #121212',
                                                },
                                                '&:hover fieldset': {
                                                    border: '1px solid #121212',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    border: '1px solid #121212',
                                                },
                                            },
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <img
                                        src="/assets/right.png"
                                        alt=""
                                        style={{
                                            width: '39px',
                                            height: '39px',
                                        }}
                                    />
                                </Box>
                            </Paper>

                            {/* Products Grid */}
                            <Paper
                                elevation={0}
                                sx={{
                                    flex: 1,
                                    // borderRadius: 2,
                                    p: 1,
                                    overflow: 'auto',
                                    bgcolor: 'transparent',
                                }}
                            >
                                <Grid container spacing={2}>
                                    {products.length > 0 &&
                                        products.map((product, index) => (
                                            <>
                                                {/* {index === 0 && <pre>{JSON.stringify(product, null, 2)}</pre>} */}
                                                <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={product.id}>
                                                    <Paper
                                                        elevation={0}
                                                        onClick={() => handleProductClick(product)}
                                                        sx={{
                                                            p: 2,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            border: '1px solid #eee',
                                                            borderRadius: 2,
                                                            height: '100%',
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                            },
                                                        }}
                                                    >
                                                        {product.images && product.images.length > 0 && (
                                                            <Box
                                                                sx={{
                                                                    width: 80,
                                                                    height: 80,
                                                                    borderRadius: '50%',
                                                                    overflow: 'hidden',
                                                                    mb: 1.5,
                                                                }}
                                                            >
                                                                <Box
                                                                    component="img"
                                                                    src={tenantAsset(product.images[0])}
                                                                    alt={product.name}
                                                                    sx={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover',
                                                                    }}
                                                                />
                                                            </Box>
                                                        )}
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                fontWeight: 500,
                                                                mb: 0.5,
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            {product.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                            Rs {product.base_price}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            </>
                                        ))}
                                </Grid>
                            </Paper>
                        </Box>
                    </Box>
                </Box>
            </div>
        </>
    );
};

const VariantSelector = ({ product, onConfirm, onClose, initialItem = null }) => {
    const [selectedValues, setSelectedValues] = useState({});
    const [quantity, setQuantity] = useState(initialItem?.quantity || 1);

    useEffect(() => {
        if (initialItem?.variants?.length) {
            const initial = {};
            for (const v of product.variants) {
                const match = initialItem.variants.find((iv) => iv.id === v.id);
                const option = v.values.find((opt) => opt.name === match?.value);
                if (option) {
                    initial[v.name] = option;
                }
            }
            setSelectedValues(initial);
        }
    }, [initialItem, product]);

    const handleConfirm = () => {
        const selectedVariantItems = product.variants
            .filter((variant) => selectedValues[variant.name])
            .map((variant) => {
                const selected = selectedValues[variant.name];
                return {
                    id: variant.id,
                    name: variant.name,
                    price: parseFloat(selected?.additional_price || 0),
                    value: selected?.name || '',
                };
            });

        const totalVariantPrice = selectedVariantItems.reduce((acc, v) => acc + v.price, 0);
        const total_price = (parseFloat(product.base_price) + totalVariantPrice) * quantity;

        const orderItem = {
            id: product.id,
            name: product.name,
            price: parseFloat(product.base_price),
            tenant_id: product.tenant_id,
            total_price,
            quantity,
            category: product.category?.name || '',
            variants: selectedVariantItems,
        };

        onConfirm(orderItem);
    };

    return (
        <div style={popupStyle}>
            <h3>{product.name}</h3>

            {product.variants.map((variant, idx) => (
                <div key={idx}>
                    <h4>{variant.name}</h4>
                    <ul>
                        {variant.values.map((v, idx2) => (
                            <li key={idx2}>
                                <button
                                    style={{
                                        marginBottom: '10px',
                                        fontWeight: selectedValues[variant.name]?.name === v.name ? 'bold' : 'normal',
                                        opacity: v.stock === 0 ? 0.5 : 1,
                                    }}
                                    disabled={v.stock === 0}
                                    onClick={() =>
                                        setSelectedValues({
                                            ...selectedValues,
                                            [variant.name]: v,
                                        })
                                    }
                                >
                                    {v.name} (+${v.additional_price}) — Stock: {v.stock}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}

            <div style={{ marginTop: '10px' }}>
                <label>
                    Quantity:
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} style={{ marginLeft: '10px', width: '60px' }} />
                </label>
            </div>

            <div style={{ marginTop: '20px' }}>
                <button onClick={handleConfirm} disabled={Object.values(selectedValues).some((v) => !v || v.stock === 0)}>
                    {initialItem ? 'Update' : 'Add'}
                </button>
                <button onClick={onClose} style={{ marginLeft: '10px' }}>
                    Cancel
                </button>
            </div>
        </div>
    );
};
const popupStyle = {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#fff',
    padding: '20px',
    border: '1px solid #ccc',
    zIndex: 1000,
};
AddItems.layout = (page) => page;
export default AddItems;
