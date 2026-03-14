import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { routeNameForContext } from '@/lib/utils';
import { enqueueSnackbar } from 'notistack';

const VariantSelectorDialog = ({ open, onClose, productId, initialItem, onConfirm, minQuantity = 1 }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedValues, setSelectedValues] = useState({});
    const [quantity, setQuantity] = useState(initialItem?.quantity || 1);
    const [remarks, setRemarks] = useState(initialItem?.remarks || ''); // ✅ New state for remarks

    useEffect(() => {
        const resolvedMinQty = Number(minQuantity) > 0 ? Number(minQuantity) : 1;
        const baseQty = Number(initialItem?.quantity);
        const nextQty = Number.isFinite(baseQty) && baseQty > 0 ? baseQty : resolvedMinQty;
        setQuantity(Math.max(nextQty, resolvedMinQty));
        setRemarks(initialItem?.remarks || '');
    }, [initialItem, open, minQuantity]);

    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
            setLoading(true);
            try {
                const response = await axios.get(route(routeNameForContext('product.single'), { id: productId }));
                setProduct(response.data.product);
            } catch (error) {
                console.error('Error loading product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    useEffect(() => {
        if (initialItem?.variants?.length && product?.variants?.length) {
            const initial = {};
            for (const v of product.variants) {
                const match = initialItem.variants.find((iv) => iv.id === v.id);
                const option = v.values.find((opt) => opt.name === match?.value);
                if (option) initial[v.name] = option;
            }
            setSelectedValues(initial);
        }
    }, [initialItem, product]);

    const handleSelect = (variantName, value) => {
        setSelectedValues((prev) => ({
            ...prev,
            [variantName]: value,
        }));
    };

    const handleConfirm = () => {
        const resolvedMinQty = Number(minQuantity) > 0 ? Number(minQuantity) : 1;
        const safeQty = Number(quantity) > 0 ? Number(quantity) : resolvedMinQty;
        if (safeQty < resolvedMinQty) {
            enqueueSnackbar('Quantity decrease is not allowed. Use cancellation process.', { variant: 'warning' });
            return;
        }
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
        const total_price = (parseFloat(product.base_price) + totalVariantPrice) * safeQty;

        const orderItem = {
            id: product.id,
            product_id: product.id,
            name: product.name,
            price: parseFloat(product.base_price),
            tenant_id: product.tenant_id,
            total_price,
            quantity: safeQty,
            category: product.category?.name || '',
            variants: selectedVariantItems,
            remarks, // ✅ Include remarks
            is_discountable: product.is_discountable !== false,
            discount_value: initialItem?.discount_value ?? 0,
            discount_type: initialItem?.discount_type ?? 'percentage',
            discount_amount: initialItem?.discount_amount ?? 0,
            is_taxable: product.is_taxable,
            max_discount: product.max_discount,
            max_discount_type: product.max_discount_type,
            menu_code: product.menu_code,
            manage_stock: product.manage_stock,
            current_stock: product.current_stock,
            minimal_stock: product.minimal_stock,
        };

        onConfirm(orderItem);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            {loading || !product ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <DialogTitle>Customize {product.name}</DialogTitle>
                    <DialogContent dividers>
                        {product.variants.map((variant) => (
                            <Box key={variant.id} mb={2}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    {variant.name}
                                </Typography>
                                <ToggleButtonGroup
                                    exclusive
                                    value={selectedValues[variant.name]?.name || ''}
                                    onChange={(_, valueName) => {
                                        const selected = variant.values.find((v) => v.name === valueName);
                                        if (selected && (!product.manage_stock || selected.stock !== 0)) {
                                            handleSelect(variant.name, selected);
                                        }
                                    }}
                                    size="small"
                                >
                                    {variant.values.map((v) => (
                                        <ToggleButton key={v.name} value={v.name} disabled={product.manage_stock && v.stock === 0}>
                                            {v.name} (R<span style={{ textTransform: 'lowercase' }}>s </span> +{v.additional_price})
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </Box>
                        ))}

                        <Box mt={2}>
                            <TextField
                                label="Quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                    const rawValue = e.target.value;
                                    if (rawValue === '') {
                                        setQuantity('');
                                        return;
                                    }
                                    const nextQty = parseInt(rawValue, 10);
                                    if (!Number.isFinite(nextQty)) return;
                                    const resolvedMinQty = Number(minQuantity) > 0 ? Number(minQuantity) : 1;
                                    if (nextQty < resolvedMinQty) {
                                        enqueueSnackbar('Quantity decrease is not allowed. Use cancellation process.', { variant: 'warning' });
                                        setQuantity(resolvedMinQty);
                                        return;
                                    }
                                    setQuantity(nextQty);
                                }}
                                onBlur={() => {
                                    const resolvedMinQty = Number(minQuantity) > 0 ? Number(minQuantity) : 1;
                                    const nextQty = Number(quantity);
                                    if (!Number.isFinite(nextQty) || nextQty < resolvedMinQty) {
                                        setQuantity(resolvedMinQty);
                                    }
                                }}
                                inputProps={{ min: Number(minQuantity) > 0 ? Number(minQuantity) : 1 }}
                                fullWidth
                            />
                        </Box>

                        <Box mt={2}>
                            {' '}
                            {/* ✅ Remarks input field */}
                            <TextField label="Remarks" multiline minRows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth />
                        </Box>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button variant="contained" disabled={Object.values(selectedValues).some((v) => !v || (product.manage_stock && v.stock === 0))} onClick={handleConfirm}>
                            {initialItem ? 'Update' : 'Add'}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};
VariantSelectorDialog.layout = (page) => page;
export default VariantSelectorDialog;
