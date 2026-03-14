import AddMenu from '@/components/App/Inventory/AddMenu';
import POSLayout from "@/components/POSLayout";
import MenuFilter from '@/components/MenuFilter';
import { tenantAsset } from '@/helpers/asset';
import { router, usePage } from '@inertiajs/react';
import { Add as AddIcon, ArrowDownward as ArrowDownwardIcon, ArrowUpward as ArrowUpwardIcon, AttachMoney as AttachMoneyIcon, CheckCircle as CheckCircleIcon, Check as CheckIcon, ChevronRight as ChevronRightIcon, Close as CloseIcon, Delete as DeleteIcon, DeleteSweep as DeleteSweepIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon, Info as InfoIcon, Inventory as InventoryIcon, Search as SearchIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, Divider, Grid, IconButton, InputAdornment, Pagination, Snackbar, Switch, TextField, Tooltip, Typography } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { routeNameForContext } from '@/lib/utils';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const CoffeeShop = ({ productLists, categoriesList = [] }) => {
    const { url } = usePage();
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const categoryId = queryParams.get('category_id');

    // const [open, setOpen] = useState(true);
    const [openFilter, setOpenFilter] = useState(false);
    const [openProductDetail, setOpenProductDetail] = useState(false);
    const [openAddMenu, setOpenAddMenu] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState({
        id: '',
        menu_code: '',
        name: '',
        category: 'Coffee & Beverage',
        image: '',
        images: [],
        stock: { status: '', quantity: '' },
        price: { current: 0, original: null, discount: null, cogs: 0, profit: 0 },
        temperature: [],
        size: [],
        description: '',
        available: true,
        orderTypes: [],
        stockDetails: {
            ready: 0,
            outOfStock: 0,
            totalVariant: 0,
        },
        sales: {
            weekly: [0, 0, 0, 0, 0, 0, 0],
            byOrderType: [],
            average: 0,
        },
    });
    const [activeCategory, setActiveCategory] = useState('All Menus');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isFilterLoading, setIsFilterLoading] = useState(false);

    // Sorting states
    const [sortingOptions, setSortingOptions] = useState({
        name: null,
        price: null,
        date: null,
        purchase: null,
    });

    // Product data
    const [products, setProducts] = useState(productLists?.data || productLists || []);

    // Track if we are viewing filtered results
    const [isFiltered, setIsFiltered] = useState(false);
    const [filteredPage, setFilteredPage] = useState(1);
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);

    // Add new state variables for Stock and Update Stock modals
    const [openStockModal, setOpenStockModal] = useState(false);
    const [openUpdateStockModal, setOpenUpdateStockModal] = useState(false);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

    // Initialize products from props
    useEffect(() => {
        const data = productLists?.data || productLists || [];
        setProducts(data);
        setFilteredProducts(data);
        setIsFiltered(false); // Reset filtered state when props change (e.g. pagination)
    }, [productLists]);

    // Handle category button click
    const handleCategoryClick = (category) => {
        setActiveCategory(category);
    };

    // Handle filter modal open/close
    const handleFilterOpen = () => {
        setOpenFilter(true);
    };

    const handleFilterClose = () => {
        setOpenFilter(false);
    };

    // Handle product detail modal
    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setOpenProductDetail(true);
    };

    const handleProductDetailClose = () => {
        setOpenProductDetail(false);
    };

    // Handle Add Menu modal
    const handleAddMenuClose = () => {
        setOpenAddMenu(false);
    };

    const handleCloseStockModal = () => {
        setOpenStockModal(false);
    };

    // Add handlers for Update Stock modal
    const handleUpdateStock = () => {
        setOpenUpdateStockModal(true);
        setOpenStockModal(false);
    };

    const handleCloseUpdateStockModal = () => {
        setOpenUpdateStockModal(false);
        setOpenStockModal(true);
    };

    const handleSaveStockChanges = () => {
        setOpenUpdateStockModal(false);
        // Here you would update the product's stock data
        // For now, we'll just show a success message
    };

    // Delete Product handlers
    const handleDeleteConfirmOpen = () => {
        setOpenDeleteConfirm(true);
    };

    const handleDeleteConfirmClose = () => {
        setOpenDeleteConfirm(false);
    };

    const handleDeleteProduct = async () => {
        if (selectedProduct === null) {
            enqueueSnackbar('No product selected', { variant: 'warning' });
            return;
        }

        // Here you would delete the product from your data
        setDeleteLoading(true);
        try {
            const response = await axios.delete(route(routeNameForContext('inventory.destroy'), selectedProduct.id));
            if (response.data?.success) {
                setProducts((prev) => prev.filter((product) => product.id !== selectedProduct.id));
                setOpenDeleteConfirm(false);
                setOpenProductDetail(false);
                setShowDeleteSuccess(true);
                enqueueSnackbar('Product deleted successfully!', { variant: 'success' });
            } else {
                enqueueSnackbar('Something went wrong', { variant: 'error' });
                console.error('Error deleting product:', response.data);
            }
        } catch (error) {
            enqueueSnackbar('Something went wrong', { variant: 'error' });
            console.error('Error deleting product:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteSuccessClose = () => {
        setShowDeleteSuccess(false);
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
                <div style={{
                    backgroundColor:'#f5f5f5',
                    // height:'100vh',
                    padding: '20px'
                }}>
                    {/* Filter Section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                            sx={{
                                fontWeight: '600',
                                fontSize: '30px',
                                color: '#063455',
                            }}
                        >
                            Products/Menu
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => router.visit(route(routeNameForContext('product.create')))}
                                sx={{
                                    borderRadius: '16px',
                                    backgroundColor: '#063455',
                                    // px: 3,
                                    textTransform: 'none',
                                    height: 35,
                                    '&:hover': {
                                        backgroundColor: '#063455',
                                    },
                                }}
                            >
                                Add Product
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => router.visit(route(routeNameForContext('inventory.trashed')))}
                                sx={{
                                    borderRadius: '16px',
                                    // px: 3,
                                    textTransform: 'none',
                                    height: 35,
                                    bgcolor: 'transparent',
                                    '&:hover': {
                                        bgcolor: '#ffebee',
                                    },
                                }}
                            >
                                Deleted
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <MenuFilter
                                categories={categoriesList}
                                page={filteredPage}
                                onFiltersChange={() => setFilteredPage(1)}
                                onProductsLoaded={(response) => {
                                    if (response === null) {
                                        setFilteredProducts(productLists?.data || productLists || []);
                                        setIsFiltered(false);
                                    } else {
                                        // Handle paginated response or flat array (fallback)
                                        if (response.data) {
                                            setFilteredProducts(response.data);
                                            setFilteredTotalPages(response.last_page);
                                            // Ensure current page sync if needed, but we manage it via state
                                        } else {
                                            setFilteredProducts(response);
                                            setFilteredTotalPages(1);
                                        }
                                        setIsFiltered(true);
                                    }
                                }}
                                onLoadingChange={(loading) => setIsFilterLoading(loading)}
                            />
                        </Box>
                    </Box>

                    {/* Product Count and List */}
                    <div
                        style={{
                            background: '#ffff',
                            padding: '20px',
                            borderRadius: '10px',
                        }}
                    >
                        <div className="d-flex align-items-center mb-4">
                            <div className="d-flex align-items-center">
                                <Typography variant="h4" component="h1" fontWeight="500" sx={{ mr: 2 }}>
                                    {filteredProducts.length > 0 ? filteredProducts.length : 0}
                                </Typography>
                                <Typography variant="body1" color="#7F7F7F">
                                    Products
                                </Typography>
                                {isFilterLoading && (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                        Loading...
                                    </Typography>
                                )}
                            </div>
                        </div>

                        {/* Product List */}
                        <Box sx={{ position: 'relative', minHeight: 200 }}>
                            {isFilterLoading && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        zIndex: 10,
                                        borderRadius: 2,
                                    }}
                                >
                                    <Box sx={{ textAlign: 'center' }}>
                                        <CircularProgress size={40} sx={{ color: '#063455' }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Loading products...
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                            <Grid container spacing={2}>
                                {filteredProducts.map((product) => (
                                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                                        <Card
                                            key={product.id}
                                            sx={{
                                                height: '100%',
                                                borderRadius: 1,
                                                border: '1px solid #E3E3E3',
                                                boxShadow: 'none',
                                                cursor: 'pointer',
                                                // padding: 1,
                                                '&:hover': {
                                                    background: '#F6F6F6',
                                                },
                                            }}
                                        >
                                            <CardContent>
                                                <Grid container alignItems="center">
                                                    <Grid item xs={12}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                            <Box sx={{ width: 70, height: 70, mr: 2 }}>
                                                                <img
                                                                    src={(product.images || []).length > 0 ? tenantAsset(product.images[0]) : '/assets/dish.png'}
                                                                    alt={product.name}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '50%',
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                                                    Rs
                                                                </Typography>
                                                                <Typography variant="h6" fontWeight="500" sx={{ fontSize: '24px' }}>
                                                                    {product.base_price}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Box>
                                                            <Typography sx={{ fontSize: '18px', fontWeight: 500, color: '#121212' }}>{product.menu_code ? `${product.menu_code} - ${product.name}` : product.name}</Typography>
                                                            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#063455' }}>{product.category?.name}</Typography>
                                                        </Box>
                                                    </Grid>

                                                    <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                                        <Box>
                                                            {product.manage_stock == 1 && product.current_stock === 0 ? (
                                                                <Typography
                                                                    variant="body2"
                                                                    component="span"
                                                                    className="badge"
                                                                    sx={{
                                                                        background: '#F14C35',
                                                                    }}
                                                                >
                                                                    Out of Stock
                                                                    {/* {product.stock.status} */}
                                                                </Typography>
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Stock Available
                                                                </Typography>
                                                            )}
                                                            <Typography variant="body1" fontWeight="500" sx={{ fontSize: '18px' }}>
                                                                {product.manage_stock == 1 ? product.current_stock : ''}
                                                            </Typography>
                                                        </Box>
                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                            {(product.variants || []).length > 0
                                                                ? product.variants.map((variant, index) => {
                                                                      return (
                                                                          <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mr: 2 }}>
                                                                              <Typography variant="body2" color="text.secondary">
                                                                                  {variant.name}
                                                                              </Typography>
                                                                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                                  {variant.values.map((value, valueIndex) => (
                                                                                      <Button
                                                                                          key={valueIndex}
                                                                                          variant="outlined"
                                                                                          size="small"
                                                                                          sx={{
                                                                                              minWidth: 'unset',
                                                                                              px: 1.5,
                                                                                              borderColor: '#e0e0e0',
                                                                                              color: 'text.primary',
                                                                                          }}
                                                                                      >
                                                                                          {value.name}
                                                                                      </Button>
                                                                                  ))}
                                                                              </Box>
                                                                          </Box>
                                                                      );
                                                                  })
                                                                : '-----'}

                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <IconButton onClick={() => handleProductClick(product)}>
                                                                    <ChevronRightIcon />
                                                                </IconButton>
                                                            </Box>
                                                        </div>
                                                    </Grid>

                                                    {/* <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>

                                                </Grid> */}
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Pagination */}
                        {(isFiltered ? filteredTotalPages > 1 : productLists?.links) && (
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    count={isFiltered ? filteredTotalPages : productLists.last_page}
                                    page={isFiltered ? filteredPage : productLists.current_page}
                                    onChange={(event, value) => {
                                        if (isFiltered) {
                                            setFilteredPage(value);
                                            // Scroll to top of list?
                                            // window.scrollTo(0, 0);
                                        } else {
                                            router.get(
                                                url.split('?')[0],
                                                {
                                                    ...Object.fromEntries(queryParams),
                                                    page: value,
                                                },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }
                                    }}
                                    color="primary"
                                    shape="rounded"
                                    size="large"
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            borderRadius: '8px',
                                        },
                                        '& .Mui-selected': {
                                            backgroundColor: '#003B5C !important',
                                            color: '#fff',
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </div>

                    {/* Product Detail Modal */}
                    <Dialog
                        open={openProductDetail}
                        onClose={handleProductDetailClose}
                        fullWidth
                        maxWidth="sm"
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
                        {selectedProduct.id && (
                            <>
                                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold">
                                            {selectedProduct.menu_code ? `${selectedProduct.menu_code} - ${selectedProduct.name}` : selectedProduct.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedProduct.menu_code || selectedProduct.id} • {selectedProduct.category?.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ mr: 1 }}>
                                                Available
                                            </Typography>
                                            <Switch checked={selectedProduct.status} color="primary" size="small" />
                                        </Box>
                                        <IconButton onClick={handleProductDetailClose}>
                                            <CloseIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <DialogContent sx={{ p: 0 }}>
                                    <Box sx={{ px: 3, pb: 3 }}>
                                        {/* Product Images */}
                                        <Box sx={{ display: 'flex', gap: 2, mb: 3, overflowX: 'auto', pb: 1 }}>
                                            {(selectedProduct.images || []).map((image, index) => (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        width: 120,
                                                        height: 80,
                                                        flexShrink: 0,
                                                        borderRadius: 1,
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <img
                                                        src={image ? tenantAsset(image) : '/placeholder.svg'}
                                                        alt={`${selectedProduct.name} ${index + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                </Box>
                                            ))}
                                        </Box>

                                        {/* Product Description */}
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedProduct.description}
                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    sx={{
                                                        p: 0,
                                                        ml: 0.5,
                                                        minWidth: 'auto',
                                                        color: 'primary.main',
                                                        fontWeight: 'bold',
                                                        textTransform: 'none',
                                                    }}
                                                >
                                                    Read more
                                                </Button>
                                            </Typography>
                                        </Box>

                                        {/* Action Buttons */}
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 80,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 1,
                                                p: 1,
                                            }}
                                        >
                                            <IconButton sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }} onClick={() => router.visit(route(routeNameForContext('inventory.show'), selectedProduct.id))}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }} onClick={handleDeleteConfirmOpen}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        {/* Pricing Information */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                p: 2,
                                                alignItems: 'center',
                                            }}
                                        >
                                            {/* COGS */}
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    COGS
                                                </Typography>
                                                <Typography variant="h6" fontWeight="bold">
                                                    Rs {selectedProduct.cost_of_goods_sold}
                                                </Typography>
                                            </Box>

                                            {/* Divider */}
                                            <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: '#e0e0e0' }} />

                                            {/* Base Price Selling */}
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Base Price Selling
                                                </Typography>
                                                <Typography variant="h6" fontWeight="bold">
                                                    Rs {selectedProduct.base_price}
                                                </Typography>
                                            </Box>

                                            {/* Divider */}
                                            <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: '#e0e0e0' }} />

                                            {/* Profit Estimate */}
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Profit Estimate
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        Rs {(selectedProduct.base_price - selectedProduct.cost_of_goods_sold).toFixed(2)}
                                                    </Typography>
                                                    <Chip
                                                        label={`${Math.round(((selectedProduct.base_price - selectedProduct.cost_of_goods_sold) / selectedProduct.base_price) * 100)}%`}
                                                        size="small"
                                                        sx={{
                                                            ml: 1,
                                                            backgroundColor: '#0A2F49', // Dark blue as in image
                                                            color: 'white',
                                                            height: 20,
                                                            fontSize: '0.7rem',
                                                            px: '4px',
                                                            borderRadius: '2px',
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ mb: 3 }} />

                                        {/* Available Order Type */}
                                        <Box
                                            sx={{
                                                justifyContent: 'space-between',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                p: 2,
                                                mb: 3,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                                                Available Order Type
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {(selectedProduct.available_order_types || []).map((type) => (
                                                    <Button
                                                        key={type}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{
                                                            borderRadius: 1,
                                                            borderColor: '#e0e0e0',
                                                            color: 'text.primary',
                                                            textTransform: 'none',
                                                        }}
                                                        startIcon={type === 'Dine In' ? <CheckIcon fontSize="small" /> : null}
                                                    >
                                                        {type}
                                                    </Button>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                </DialogContent>
                            </>
                        )}
                    </Dialog>

                    {/* Add Menu Modal */}
                    <AddMenu
                        openMenu={openAddMenu}
                        onClose={handleAddMenuClose}
                        // handleAddMenu={handleAddMenu}
                        // selectedCategory={selectedCategory}
                        // setSelectedCategory={setSelectedCategory}
                        // newMenu={newMenu}
                        // setNewMenu={setNewMenu}
                        // addMenuStep={addMenuStep}
                    />

                    {/* Stock Modal */}
                    <Dialog
                        open={openStockModal}
                        onClose={handleCloseStockModal}
                        fullWidth
                        maxWidth="sm"
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
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton sx={{ mr: 2, backgroundColor: '#f5f5f5', borderRadius: '50%' }}>
                                    <InventoryIcon />
                                </IconButton>
                                <Typography variant="h5" fontWeight="bold">
                                    Stock
                                </Typography>
                            </Box>
                            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleUpdateStock} sx={{ borderRadius: 1 }}>
                                Update Stock
                            </Button>
                        </Box>

                        <DialogContent sx={{ p: 0 }}>
                            <Box sx={{ px: 3, pb: 3 }}>
                                <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                                    Product Variant
                                </Typography>

                                {/* Temperature */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body1">Temperature : 200 pcs</Typography>
                                    <ChevronRightIcon color="action" />
                                </Box>

                                {/* Size */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body1">Size : 200 pcs</Typography>
                                    <ChevronRightIcon color="action" />
                                </Box>

                                {/* Sweetness */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body1">Sweetness : 200 pcs</Typography>
                                    <ChevronRightIcon color="action" />
                                </Box>

                                {/* Milk Options */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body1">Milk Options : 200 pcs</Typography>
                                    <ChevronRightIcon color="action" />
                                </Box>

                                {/* Toppings */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        backgroundColor: '#e3f2fd',
                                    }}
                                >
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        Toppings : 130 pcs
                                    </Typography>

                                    <Box sx={{ mb: 2 }}>
                                        <Grid container sx={{ mb: 1, px: 1 }}>
                                            <Grid item xs={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Variant Name
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Additional Price
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Stock
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        <Divider sx={{ borderStyle: 'dashed' }} />

                                        <Box sx={{ py: 1, px: 1 }}>
                                            <Grid container alignItems="center">
                                                <Grid item xs={1}>
                                                    <Typography variant="body2">1.</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography variant="body2">Palm Sugar</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2">+ Rs 1.00</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2">80 pcs</Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Divider sx={{ borderStyle: 'dashed' }} />

                                        <Box sx={{ py: 1, px: 1 }}>
                                            <Grid container alignItems="center">
                                                <Grid item xs={1}>
                                                    <Typography variant="body2">2.</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography variant="body2">Boba</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2">+ Rs 2.00</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2">30 pcs</Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Divider sx={{ borderStyle: 'dashed' }} />

                                        <Box sx={{ py: 1, px: 1 }}>
                                            <Grid container alignItems="center">
                                                <Grid item xs={1}>
                                                    <Typography variant="body2">3.</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography variant="body2">Grass Jelly</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2">+ Rs 2.00</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2">20 pcs</Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Divider sx={{ borderStyle: 'dashed' }} />

                                        <Box sx={{ py: 1, px: 1 }}>
                                            <Grid container alignItems="center">
                                                <Grid item xs={1}>
                                                    <Typography variant="body2">4.</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography variant="body2">Oreo</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2">+ Rs 2.00</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="body2">32 pcs</Typography>
                                                        <Chip
                                                            label="Sold"
                                                            size="small"
                                                            sx={{
                                                                ml: 1,
                                                                backgroundColor: '#ff5722',
                                                                color: 'white',
                                                                height: 20,
                                                                fontSize: '0.7rem',
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </DialogContent>
                    </Dialog>

                    {/* Update Stock Modal */}
                    <Dialog
                        open={openUpdateStockModal}
                        onClose={handleCloseUpdateStockModal}
                        fullWidth
                        maxWidth="sm"
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
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton sx={{ mr: 2, backgroundColor: '#f5f5f5', borderRadius: '50%' }}>
                                    <InventoryIcon />
                                </IconButton>
                                <Typography variant="h5" fontWeight="bold">
                                    Update Stock
                                </Typography>
                            </Box>
                        </Box>

                        <DialogContent sx={{ p: 0 }}>
                            <Box sx={{ px: 3, pb: 3 }}>
                                <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                                    Product Variant
                                </Typography>

                                {/* Temperature */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body1">Temperature : 200 pcs</Typography>
                                    <ChevronRightIcon color="action" />
                                </Box>

                                {/* Size */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body1">Size : 200 pcs</Typography>
                                    <ChevronRightIcon color="action" />
                                </Box>

                                {/* Sweetness */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body1">Sweetness : 200 pcs</Typography>
                                    <ChevronRightIcon color="action" />
                                </Box>

                                {/* Milk Options */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="body1">Milk Options : 200 pcs</Typography>
                                    <ChevronRightIcon color="action" />
                                </Box>

                                {/* Toppings */}
                                <Box
                                    sx={{
                                        p: 3,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 2,
                                        backgroundColor: '#e3f2fd',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="body1">Toppings</Typography>
                                        <Switch checked={true} color="primary" />
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Grid container sx={{ mb: 1 }}>
                                            <Grid item xs={4}>
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
                                                    Stock
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={2}></Grid>
                                        </Grid>

                                        {/* Palm Sugar */}
                                        <Box sx={{ mb: 2 }}>
                                            <Grid container spacing={1} alignItems="center">
                                                <Grid item xs={1}>
                                                    <Typography variant="body2">1.</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <TextField fullWidth size="small" defaultValue="Palm Sugar" />
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Box sx={{ display: 'flex' }}>
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
                                                        <TextField fullWidth size="small" defaultValue="1.00" />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <TextField fullWidth size="small" defaultValue="80" />
                                                </Grid>
                                                <Grid item xs={2}>
                                                    <IconButton color="error">
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Boba */}
                                        <Box sx={{ mb: 2 }}>
                                            <Grid container spacing={1} alignItems="center">
                                                <Grid item xs={1}>
                                                    <Typography variant="body2">2.</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <TextField fullWidth size="small" defaultValue="Boba" />
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Box sx={{ display: 'flex' }}>
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
                                                        <TextField fullWidth size="small" defaultValue="2.00" />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <TextField fullWidth size="small" defaultValue="30" />
                                                </Grid>
                                                <Grid item xs={2}>
                                                    <IconButton color="error">
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Grass Jelly */}
                                        <Box sx={{ mb: 2 }}>
                                            <Grid container spacing={1} alignItems="center">
                                                <Grid item xs={1}>
                                                    <Typography variant="body2">3.</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <TextField fullWidth size="small" defaultValue="Grass Jelly" />
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Box sx={{ display: 'flex' }}>
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
                                                        <TextField fullWidth size="small" defaultValue="2.00" />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <TextField fullWidth size="small" defaultValue="20" />
                                                </Grid>
                                                <Grid item xs={2}>
                                                    <IconButton color="error">
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Oreo */}
                                        <Box sx={{ mb: 2 }}>
                                            <Grid container spacing={1} alignItems="center">
                                                <Grid item xs={1}>
                                                    <Typography variant="body2">4.</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <TextField fullWidth size="small" defaultValue="Oreo" />
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Box sx={{ display: 'flex' }}>
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
                                                        <TextField fullWidth size="small" defaultValue="2.00" />
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <TextField fullWidth size="small" defaultValue="0" />
                                                </Grid>
                                                <Grid item xs={2}>
                                                    <IconButton color="error">
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Button variant="text" startIcon={<AddIcon />} sx={{ mt: 1 }}>
                                            Add Variant
                                        </Button>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ mr: 1 }}>
                                                Multiple Choice
                                            </Typography>
                                            <Tooltip title="Allow customers to select multiple toppings">
                                                <IconButton size="small">
                                                    <InfoIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        <Switch checked={true} color="primary" size="small" />
                                    </Box>
                                </Box>
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                            <Button
                                onClick={handleCloseUpdateStockModal}
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
                                onClick={handleSaveStockChanges}
                                variant="contained"
                                sx={{
                                    backgroundColor: '#003B5C',
                                    '&:hover': {
                                        backgroundColor: '#002A41',
                                    },
                                }}
                            >
                                Save Changes
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Delete Confirmation Modal */}
                    <Dialog open={openDeleteConfirm} onClose={handleDeleteConfirmClose}>
                        <DialogContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                Delete Product
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Are you sure want to delete this product?
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                            <Button onClick={handleDeleteConfirmClose} color="primary">
                                Cancel
                            </Button>
                            <Button onClick={handleDeleteProduct} color="error" disabled={deleteLoading} loading={deleteLoading} loadingPosition="start">
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Delete Success Snackbar */}
                    <Snackbar open={showDeleteSuccess} autoHideDuration={3000} onClose={handleDeleteSuccessClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                        <Alert
                            severity="success"
                            onClose={handleDeleteSuccessClose}
                            icon={<CheckCircleIcon />}
                            sx={{
                                width: '100%',
                                backgroundColor: '#e8f5e9',
                                color: '#2e7d32',
                                '& .MuiAlert-icon': {
                                    color: '#2e7d32',
                                },
                            }}
                        >
                            <Box>
                                <Typography variant="body1" fontWeight="bold">
                                    Menu Deleted!
                                </Typography>
                                <Typography variant="body2">The menu "{selectedProduct.name}" has been deleted</Typography>
                            </Box>
                        </Alert>
                    </Snackbar>
                </div>
            {/* </div> */}
        </>
    );
}
CoffeeShop.layout = (page) => <POSLayout>{page}</POSLayout>;
export default CoffeeShop
