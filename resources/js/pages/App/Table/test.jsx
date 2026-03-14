import TableIcon from '@/components/App/Icons/BTable';
import Table2Icon from '@/components/App/Icons/CTable';
import Table1Icon from '@/components/App/Icons/Table1';
import SideNav from '@/components/App/SideBar/SideNav';
import { KeyboardArrowDown, Settings } from '@mui/icons-material';
import { Box, Button, FormControl, InputLabel, MenuItem, Modal, Select, Typography } from '@mui/material';
import update from 'immutability-helper';
import { useCallback, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import TableSetting from './Setting';

const ItemTypes = {
    TABLE: 'table',
};

// DraggableTable component
const DraggableTable = ({ id, tableNumber, width, height, tableIcon: TableComponent, fill, reservation, index, moveTable, onClick }) => {
    // Set up drag functionality
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TABLE,
        item: { id, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    // Set up drop functionality
    const [, drop] = useDrop(
        () => ({
            accept: ItemTypes.TABLE,
            hover: (draggedItem) => {
                if (draggedItem.id !== id) {
                    moveTable(draggedItem.index, index);
                    // Update the index in the dragged item to reflect its new position
                    draggedItem.index = index;
                }
            },
        }),
        [id, index, moveTable],
    );

    // Determine text color based on reservation status
    const getTextColor = () => {
        if (fill === '#d1fae5') return '#059669';
        if (fill === '#cfe7ff') return '#3b82f6';
        return '#6b7280';
    };

    return (
        <Box
            onClick={onClick}
            ref={(node) => drag(drop(node))}
            sx={{
                width,
                height,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'scale(1.02)',
                },
            }}
        >
            <TableComponent
                style={{
                    width: '100%',
                    height: '100%',
                    bgcolor: fill,
                }}
            />
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
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: getTextColor() }}>
                    {tableNumber}
                </Typography>
                {reservation && (
                    <>
                        <Typography variant="caption" sx={{ color: getTextColor(), fontWeight: 'medium' }}>
                            #{reservation.id}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.65rem' }}>
                            {reservation.customer}
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
};

const drawerWidthOpen = 240;
const drawerWidthClosed = 110;

const TableManagement = ({ floorsdata, tablesData }) => {
    const [open, setOpen] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(1);
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today.getDate());
    const [openSettings, setOpenSettings] = useState(false);
    const [openReservation, setOpenReservation] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [tables, setTables] = useState([
        // First row
        {
            id: '1',
            tableNumber: 'T12',
            width: 130,
            height: 120,
            tableIcon: Table1Icon,
            fill: 'white',
        },
        {
            id: '2',
            tableNumber: 'T13',
            width: 130,
            height: 120,
            tableIcon: Table1Icon,
            fill: 'white',
        },
        {
            id: '3',
            tableNumber: 'T14',
            width: 130,
            height: 120,
            tableIcon: Table1Icon,
            fill: '#cfe7ff',
            reservation: {
                id: 'RSV002',
                customer: 'Hanna Rose',
            },
        },
        {
            id: '4',
            tableNumber: 'T15',
            width: 130,
            height: 120,
            tableIcon: Table1Icon,
            fill: 'white',
        },
        {
            id: '5',
            tableNumber: 'T16',
            width: 220,
            height: 120,
            tableIcon: TableIcon,
            fill: '#cfe7ff',
            reservation: {
                id: 'RSV012',
                customer: 'Ahman Maulana',
            },
        },
        // Second row
        {
            id: '6',
            tableNumber: 'T17',
            width: 230,
            height: 120,
            tableIcon: Table2Icon,
            fill: 'white',
            row: 2,
        },
        {
            id: '7',
            tableNumber: 'T18',
            width: 230,
            height: 120,
            tableIcon: Table2Icon,
            fill: 'white',
            row: 2,
        },
        {
            id: '8',
            tableNumber: 'T19',
            width: 230,
            height: 120,
            tableIcon: Table2Icon,
            fill: '#d1fae5',
            reservation: {
                id: 'RSV003',
                customer: 'John Doe',
            },
            row: 2,
        },
        // Third row
        {
            id: '9',
            tableNumber: 'T20',
            width: 230,
            height: 120,
            tableIcon: Table2Icon,
            fill: 'white',
            row: 3,
        },
        {
            id: '10',
            tableNumber: 'T21',
            width: 230,
            height: 120,
            tableIcon: Table2Icon,
            fill: 'white',
            row: 3,
        },
        {
            id: '11',
            tableNumber: 'T22',
            width: 230,
            height: 120,
            tableIcon: Table2Icon,
            fill: '#d1fae5',
            reservation: {
                id: 'RSV004',
                customer: 'Jane Smith',
            },
            row: 3,
        },
    ]);

    const handleOpenReservation = (table) => {
        setSelectedTable(table);
        setOpenReservation(true);
    };

    const handleCloseReservation = () => {
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
    const firstRowTables = tables.slice(0, 5);
    const secondRowTables = tables.slice(5, 8);
    const thirdRowTables = tables.slice(8, 11);

    const handleOpenSettings = () => setOpenSettings(true);
    const handleCloseSettings = () => setOpenSettings(false);

    const handleFloorChange = (event, newValue) => {
        setSelectedFloor(newValue);
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
    };

    const generateDaysArray = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed (0 = Jan)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const dateObj = new Date(year, month, i + 1);
            return {
                day: weekdays[dateObj.getDay()].slice(0, 2), // e.g., 'Su', 'Mo', 'Tu'
                date: i + 1,
                hasReservations: false, // default value
                full_date: dateObj.toISOString(),
            };
        });

        return days;
    };

    // Days of the week with dates and reservation indicators
    const days = generateDaysArray();

    // const days = [

    // Floor options
    const floors = [
        { id: 0, name: 'Floor 1', area: 'Indoor Area', capacity: '62-Person' },
        { id: 1, name: 'Floor 1', area: 'Outdoor Area', capacity: '62-Person' },
        { id: 2, name: 'Floor 2', area: 'Indoor Area', capacity: '50-Person' },
    ];

    const [selectedValue, setSelectedValue] = useState('');

    const handleChange = (event) => {
        setSelectedValue(event.target.value);
    };

    // selectedDate is like "2", convert to number for comparison
    const selectedDay = parseInt(selectedDate, 10);

    // floorsdata is an array of objects from backend
    // const matchedFloors = floorsdata.filter((floor) => {
    //     const floorDate = new Date(floor.created_at);
    //     const day = floorDate.getDate(); // Extract day from date
    //     return day === selectedDay;
    // });
    const matchedFloors = floorsdata.filter((floor) => {
        const floorDate = new Date(floor.created_at).getDate();
        return floorDate === selectedDay;
    });

    return (
        <>
            {/* <>{floorsdata}</> */}

            <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                }}
            >
                <Box
                    sx={{
                        height: '100vh',
                        bgcolor: '#F6F6F6',
                        display: 'flex',
                        flexDirection: 'column',
                        px: 3,
                        pt: 2,
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
                            <img
                                src="/assets/qbutton.png"
                                alt=""
                                style={{
                                    width: 40,
                                    height: 40,
                                }}
                            />

                            <Box sx={{ minWidth: 160 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel
                                        id="dropdown-label"
                                        sx={{
                                            color: '#063455',
                                            fontSize: '14px',
                                        }}
                                    >
                                        Choose floor
                                    </InputLabel>
                                    <Select
                                        labelId="dropdown-label"
                                        value={selectedValue}
                                        label="Choose Option"
                                        onChange={handleChange}
                                        sx={{
                                            border: '1px solid #063455',
                                            color: '#063455',
                                            textTransform: 'none',
                                            height: 40,
                                            borderRadius: '0',
                                            fontSize: '14px',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                border: '1px solid #063455',
                                            },
                                        }}
                                    >
                                        {floorsdata.map((floor) => (
                                            <MenuItem key={floor.id} value={floor.id}>
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
                                    borderRadius: '0',
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
                                <TableSetting floorsdata={floorsdata} tablesData={tablesData} />
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
                                    {/* May 2024 */}
                                    date:{selectedDate}
                                </Typography>
                                <KeyboardArrowDown fontSize="small" sx={{ ml: 0.5 }} />
                            </Box>

                            {days.map((day, index) => (
                                <Box
                                    key={index}
                                    onClick={() => handleDateClick(day.date)}
                                    sx={{
                                        height: '120px',
                                        py: 3,
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        bgcolor: selectedDate === day.date ? '#B0DEFF' : '#FFFFFF',
                                        border: selectedDate === day.date ? '1px solid #063455' : '1px solid #E3E3E3',
                                        '&:hover': {
                                            bgcolor: selectedDate === day.date ? '#B0DEFF' : '#FFFFFF',
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
                                                Floor 1 • Indoor Area
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ color: '#333333' }}>
                                            Available for 62-Person
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box>
                                {matchedFloors.length > 0 ? (
                                    matchedFloors.map((floor, index) => {
                                        // Get tables for the current floor
                                        const floorTables = tablesData.filter((table) => table.floor_id === floor.id);

                                        return (
                                            <div key={index} className="mb-6 rounded border p-4 shadow">
                                                <h3 className="text-lg font-bold">Floor: {floor.name}</h3>
                                                <h4 className="text-sm">Area: {floor.area}</h4>
                                                <p className="text-sm text-gray-500">Created At: {new Date(floor.created_at).toLocaleString()}</p>

                                                {/* Table list */}
                                                {floorTables.length > 0 ? (
                                                    <div className="mt-4 space-y-2">
                                                        {floorTables.map((table, tIndex) => (
                                                            <div key={tIndex} className="rounded border bg-gray-100 p-2">
                                                                <p>
                                                                    <strong>Table Name:</strong> {table.name}
                                                                </p>
                                                                <p>
                                                                    <strong>Capacity:</strong> {table.capacity}
                                                                </p>
                                                                {/* Add more table info if needed */}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="mt-2 text-gray-400 italic">No tables for this floor.</p>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500 italic">No matching floors for selected date: {selectedDate}</p>
                                )}
                            </Box>
                            {/* Floor Plan */}
                        </Box>
                    </Box>
                </Box>
            </div>
        </>
    );
};
TableManagement.layout = (page) => page;
export default TableManagement;
