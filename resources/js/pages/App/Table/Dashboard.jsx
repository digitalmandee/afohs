import Table2Icon from '@/components/App/Icons/Table2';
import POSLayout from "@/components/POSLayout";
import { KeyboardArrowDown, Settings } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import { Box, Button, FormControl, MenuItem, Modal, Select, Typography, InputLabel } from '@mui/material';
import axios from 'axios';
import update from 'immutability-helper';
import { useCallback, useEffect, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AddReservation from './Action';
import TableSetting from './Setting';
import ActiveTable from './ActiveTable';
import dayjs from 'dayjs';
import { routeNameForContext } from '@/lib/utils';

const ItemTypes = {
    TABLE: 'table',
};

// DraggableTable component
const DraggableTable = ({ data, index, moveTable, onClick, fill }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TABLE,
        item: { id: data.id, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const [, drop] = useDrop(
        () => ({
            accept: ItemTypes.TABLE,
            hover: (draggedItem) => {
                if (draggedItem.id !== data.id) {
                    moveTable(draggedItem.index, index);
                    draggedItem.index = index;
                }
            },
        }),
        [data.id, index, moveTable],
    );

    const reservationCount = data?.reservations?.length || 0;
    const orderCount = data?.orders?.length || 0;

    // Find current reservation
    const currentReservation = data?.reservations?.find((res) => res.is_current);

    const getTextColor = () => {
        if (currentReservation) return 'black'; // white text on dark reservation bg
        if (!data.is_available) return '#059669'; // green text if unavailable
        if (fill === '#cfe7ff') return '#3b82f6'; // blue
        return '#6b7280'; // gray
    };

    const getBgColor = () => {
        if (currentReservation) return '#d0ebff'; // dark bg for reservation
        if (!data.is_available) return '#d1fae5'; // light green bg for busy
        return 'white'; // default
    };

    return (
        <Box
            onClick={onClick}
            ref={(node) => drag(drop(node))}
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.02)' },
            }}
        >
            {/* Table shape */}
            <Table2Icon fillColor={getBgColor()} />

            <Box
                sx={{
                    position: 'absolute',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Table number */}
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: getTextColor() }}>
                    {data.table_no}
                </Typography>
                <Typography variant="caption" sx={{ color: getTextColor(), fontSize: '0.7rem' }}>
                    Cap: {data.capacity}
                </Typography>

                {/* Active reservation display */}
                {currentReservation && (
                    <>
                        <Typography variant="caption" sx={{ color: 'black', fontWeight: 'medium' }}>
                            #{currentReservation?.id}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: 'black' }}>
                            {currentReservation.member?.full_name || currentReservation.customer?.name}
                        </Typography>
                    </>
                )}

                {/* Booked by info (orders) */}
                {!data.is_available && !currentReservation && (
                    <>
                        <Typography variant="caption" sx={{ color: getTextColor(), fontWeight: 'medium' }}>
                            #{data.booked_by?.id}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.65rem' }}>
                            {data.booked_by?.name}
                        </Typography>
                    </>
                )}

                {/* Reservation & order counts */}
                {(reservationCount > 0 || orderCount > 0) && (
                    <Typography variant="caption" sx={{ color: '#374151', fontSize: '0.7rem', mt: 0.3 }}>
                        Res: {reservationCount} | Orders: {orderCount}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const TableManagement = ({ floorsdata, tablesData, allrestaurants, activeTenantId }) => {
    // const [open, setOpen] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState('no_floor');
    const [selectedRestaurant, setSelectedRestaurant] = useState(activeTenantId || '');
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState({
        date: today.getDate(),
        hasReservations: false,
        full_date: today.toISOString(),
    });
    const [openSettings, setOpenSettings] = useState(false);
    const [openReservation, setOpenReservation] = useState(false);
    const [openAvailableOrder, setOpenAvailableOrder] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [activefloor, setActiveFloor] = useState(null);
    const [availableCapacity, setAvailableCapacity] = useState(0);
    const [tables, setTables] = useState([]);

    const handleOpenReservation = (table) => {
        setSelectedTable(table);

        // If table has ongoing reservation/order or direct order
        // if (!table.is_available) {
        // setOpenAvailableOrder(true); // show ActiveTable
        // } else {
        setOpenReservation(true); // show AddReservation
        // }
    };

    const handleCloseReservation = () => {
        setOpenAvailableOrder(false);
        setOpenReservation(false);
        setSelectedTable(null);
    };

    const moveTable = useCallback((dragIndex, hoverIndex) => {
        setTables((prevTables) =>
            update(prevTables, {
                $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, prevTables[dragIndex]],
                ],
            }),
        );
    }, []);

    // Group tables by row
    const handleOpenSettings = () => setOpenSettings(true);
    const handleCloseSettings = () => setOpenSettings(false);

    const handleFloorChange = (event) => {
        setSelectedFloor(event.target.value);
    };

    const handleDateClick = (date) => {
        console.log('Date clicked:', date);

        setSelectedDate(date);
    };

    const generateDaysArray = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const dateObj = new Date(year, month, i + 1);
            return {
                day: weekdays[dateObj.getDay()].slice(0, 2),
                date: i + 1,
                hasReservations: false,
                full_date: dayjs(dateObj).format('YYYY-MM-DD'), // or your preferred format
            };
        });

        return days;
    };
    // Days of the week with dates and reservation indicators
    const days = generateDaysArray();

    // floorsdata is an array of objects
    const selectedDateStr = new Date(selectedDate.full_date).toISOString().split('T')[0];

    const matchedFloors = floorsdata.filter((floor) => {
        const floorDateStr = new Date(floor.created_at).toISOString().split('T')[0];
        return floorDateStr <= selectedDateStr;
    });

    useEffect(() => {
        if (selectedDate.full_date) {
            axios
                .get(route(routeNameForContext('floors.getFloors')), {
                    params: {
                        date: selectedDate.full_date,
                        floor: selectedFloor,
                        restaurant_id: selectedRestaurant,
                    },
                })
                .then((res) => {
                    setActiveFloor(res.data.floor);
                    setAvailableCapacity(res.data.total_capacity);
                });
        }
    }, [selectedDate, selectedFloor, selectedRestaurant]);

    return (
        <>
            {/* <>{floorsdata}</> */}

            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            > */}
            <Box
                sx={{
                    // height: '100vh',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 2,
                    // pt: 2,
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        // p: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: '600',
                                fontSize: '30px',
                                color: '#063455',
                            }}
                        >
                            Table Management
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {Array.isArray(allrestaurants) && allrestaurants.length > 1 && (
                            <Box sx={{ minWidth: 240 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="restaurant-label">Restaurant</InputLabel>
                                    <Select
                                        labelId="restaurant-label"
                                        value={selectedRestaurant || ''}
                                        label="Restaurant"
                                        onChange={(e) => {
                                            const restaurantId = e.target.value;
                                            setSelectedRestaurant(restaurantId);
                                            setSelectedFloor('no_floor');
                                            setActiveFloor(null);
                                            setAvailableCapacity(0);
                                            setSelectedTable(null);
                                            router.get(
                                                route(routeNameForContext('table.management')),
                                                { restaurant_id: restaurantId },
                                                { preserveScroll: true, replace: true },
                                            );
                                        }}
                                        sx={{
                                            height: 40,
                                            fontSize: "14px",
                                            color: "#063455",
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                border: "1px solid #063455",
                                                borderRadius: "16px",
                                            },
                                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                                border: "1px solid #063455",
                                            },
                                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                border: "1px solid #063455",
                                            },
                                        }}
                                    >
                                        {allrestaurants.map((item) => (
                                            <MenuItem value={item.id} key={item.id}>
                                                {item.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                        {/* <img
                                src="/assets/qbutton.png"
                                alt=""
                                style={{
                                    width: 40,
                                    height: 40,
                                }}
                            /> */}

                        <Box sx={{ minWidth: 160 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel
                                    id="dropdown-label"
                                    sx={{
                                        color: "#063455",
                                        fontSize: "14px",
                                    }}
                                >
                                    Choose floor
                                </InputLabel>

                                <Select
                                    labelId="dropdown-label"
                                    value={selectedFloor || "no_floor"}
                                    label="Choose floor"   // MUST match InputLabel text
                                    displayEmpty
                                    onChange={handleFloorChange}
                                    sx={{
                                        height: 40,
                                        fontSize: "14px",
                                        color: "#063455",

                                        "& .MuiOutlinedInput-notchedOutline": {
                                            border: "1px solid #063455",
                                            borderRadius: "16px",
                                        },

                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                            border: "1px solid #063455",
                                        },

                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            border: "1px solid #063455",
                                        },
                                    }}
                                >
                                    <MenuItem value="no_floor">Without Floor</MenuItem>

                                    {matchedFloors.map((floor) => (
                                        <MenuItem key={floor.id} value={floor.id}
                                            sx={{
                                                "&:hover": {
                                                    backgroundColor: "#063455",
                                                    color: "#fff",
                                                    borderRadius:'16px',
                                                    mx:1,
                                                    my:1
                                                },
                                            }}>
                                            {floor.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>


                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<Settings />}
                            onClick={handleOpenSettings}
                            sx={{
                                border: '1px solid #063455',
                                color: '#063455',
                                textTransform: 'none',
                                height: 40,
                                borderRadius: '16px',
                                fontSize: '14px',
                            }}
                        >
                            Table Settings
                        </Button>
                    </Box>

                    <Modal open={openSettings} onClose={handleCloseSettings}>
                        <Box
                            sx={{
                                position: 'fixed',
                                top: 5,
                                bottom: 5,
                                right: 10,
                                bgcolor: '#FFFFFF',
                                boxShadow: 24,
                                // p: 4,
                                borderRadius: 2,
                                width: 400,
                                overflowY: 'hidden', // Enables scrolling if content overflows
                            }}
                        >
                            <TableSetting floorsdata={floorsdata} tablesData={tablesData} selectedRestaurant={selectedRestaurant} onClose={handleCloseSettings} />
                        </Box>
                    </Modal>
                </Box>

                {/* Main Content */}
                <Box
                    sx={{
                        display: 'flex',
                        mt: 2,
                        flexGrow: 1,
                        justifyContent: 'center',
                        bgcolor: 'transparent',
                    }}
                >
                    {/* Left Sidebar - Calendar */}
                    <Box
                        sx={{
                            width: 115,
                            display: 'flex',
                            flexDirection: 'column',
                            pr: 2,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2,
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: '500',
                                    fontSize: '14px',
                                    color: '#121212',
                                }}
                            >
                                May 2024
                                {/* date:{selectedDate} */}
                            </Typography>
                            <KeyboardArrowDown fontSize="small" sx={{ ml: 0.5 }} />
                        </Box>

                        {days.map((day, index) => (
                            <Box
                                key={index}
                                onClick={() => handleDateClick(day)}
                                sx={{
                                    height: '120px',
                                    py: 3,
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    bgcolor: selectedDate.date === day.date ? '#B0DEFF' : '#FFFFFF',
                                    border: selectedDate.date === day.date ? '1px solid #063455' : '1px solid #E3E3E3',
                                    '&:hover': {
                                        bgcolor: selectedDate.date === day.date ? '#B0DEFF' : '#FFFFFF',
                                    },
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        color: '#7F7F7F',
                                        fontSize: '16px',
                                    }}
                                >
                                    {day.day}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontWeight: 'medium',
                                        my: 0.5,
                                        color: '#121212',
                                        fontSize: '22px',
                                    }}
                                >
                                    {day.date}
                                </Typography>
                                {day.hasReservations && (
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: '#1976d2',
                                            mx: 'auto',
                                        }}
                                    />
                                )}
                            </Box>
                        ))}
                    </Box>

                    {/* Right Content - Floor Plan */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Floor Tabs */}
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: 50,
                                zIndex: 1,
                            }}
                        >
                            {/* Floor 1 Indoor Area - White background (bottom layer) */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1.5,
                                    bgcolor: '#FFFFFF',
                                    height: 100,
                                    zIndex: -1,
                                    borderTopLeftRadius: '24px',
                                    borderTopRightRadius: '24px',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        mt: -7,
                                        width: '100%',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: '50%',
                                                bgcolor: 'transparent',
                                                // color: '#333333',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 1.5,
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                border: '1px solid #E3E3E3',
                                            }}
                                        >
                                            <img
                                                src="/assets/home-roof.png"
                                                alt=""
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#333333',
                                                fontWeight: 'medium',
                                            }}
                                        >
                                            {activefloor?.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: '#333333' }}>
                                        Available for {availableCapacity ?? 0}-Person
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        {/* Floor Plan */}
                        <DndProvider backend={HTML5Backend}>
                            <Box
                                sx={{
                                    flexGrow: 1,
                                    bgcolor: '#063455',
                                    position: 'relative',
                                    overflow: 'auto',
                                    height: '100%',
                                    minHeight: 500,
                                    zIndex: 1,
                                }}
                            >
                                {/* First row of tables */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-around',
                                        width: '100%',
                                        gap: '30px 15px',
                                    }}
                                >
                                    {activefloor && activefloor?.tables.map((table, index) => <DraggableTable index={index} data={table} moveTable={moveTable} onClick={() => handleOpenReservation(table)} />)}
                                </Box>
                            </Box>
                            <Modal open={openReservation} onClose={handleCloseReservation}>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        boxShadow: 24,
                                        p: 3,
                                        maxWidth: 600,
                                        width: '90%',
                                        maxHeight: '90vh',
                                        overflow: 'auto', // or remove if you want to hide scroll
                                    }}
                                >
                                    <AddReservation table={selectedTable} selectedDate={selectedDate} onClose={handleCloseReservation} />
                                </Box>
                            </Modal>
                            <Modal open={openAvailableOrder} onClose={handleCloseReservation}>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        boxShadow: 24,
                                        p: 3,
                                        maxWidth: 600,
                                        width: '90%',
                                        maxHeight: '90vh',
                                        overflow: 'auto',
                                    }}
                                >
                                    <ActiveTable table={selectedTable} floorName={activefloor?.name} onClose={handleCloseReservation} />
                                </Box>
                            </Modal>
                        </DndProvider>
                    </Box>
                </Box>
            </Box>
            {/* </div> */}
        </>
    );
};
TableManagement.layout = (page) => <POSLayout>{page}</POSLayout>;
export default TableManagement;
