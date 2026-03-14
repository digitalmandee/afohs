import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    Container, Row, Col, Card, Button, Form
} from 'react-bootstrap';
import {
    ArrowBack, People, CheckCircle, Timer, Cancel,
    BarChart, EventNote, CardMembership, Fastfood, Print,
    CalendarToday
} from '@mui/icons-material';
import {
    IconButton, TextField, InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { router } from '@inertiajs/react';


const Dashboard = () => {
    // const [open, setOpen] = useState(true);
    const [date, setDate] = useState('Apr-2025');

    const kitchenData = [
        {
            title: "Beverage Kitchen",
            count: "10 item",
            icon: "/assets/beverage.png",
        },
        {
            title: "Fast Food Kitchen",
            count: "20 item",
            icon: "/assets/fast-food.png",
        },
        {
            title: "SeaFood Kitchen",
            count: "05 item",
            icon: "/assets/sea-food.png",
        },
        {
            title: "Tandoor Kitchen",
            count: "08 item",
            icon: "/assets/tandoor.png",
        },
    ];

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
                <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
                    <Container fluid>
                        {/* Header */}
                        <Row className="align-items-center mb-5">
                            <Col xs="auto">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {/* <ArrowBack style={{ color: '#555', marginRight: '15px', cursor: 'pointer' }} /> */}
                                    <h2 className="mb-0 fw-normal" style={{ margin: 0, fontWeight: 500, color: '#063455', fontSize: '30px' }}>All Kitchen Display</h2>
                                </div>
                            </Col>
                            <Col className="d-flex justify-content-end align-items-center">
                                <Button
                                    style={{
                                        backgroundColor: '#063455',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '5px',
                                        width: '200px',
                                        color: 'white',
                                    }}
                                    onClick={() => router.visit('/kitchen/category/add/new/kitchen')}
                                >
                                    <span style={{ marginRight: '5px', fontSize: '20px' }}>+</span> Add Kitchen Category
                                </Button>
                            </Col>
                        </Row>

                        {/* Metrics Cards - First Row */}
                        <Row className="gx-4">
                            {kitchenData.map((kitchen, index) => (
                                <Col md={3} key={index}>
                                    <Card className="text-center shadow-sm" style={{ border: '1px solid #A4A4A4' }}>
                                        <Card.Body style={{ padding: '5px 10px' }}>
                                            <div className="d-flex justify-content-end">
                                                <span style={{ cursor: 'pointer', color: '#063455', fontSize: '20px' }}>⋮</span>
                                            </div>
                                            <img
                                                src={kitchen.icon}
                                                alt={kitchen.title}
                                                style={{ width: 50, height: 50, marginBottom: '15px' }}
                                            />
                                            <h6 style={{ fontWeight: 600 }}>{kitchen.title}</h6>
                                            <p style={{ color: '#6c757d', fontSize: '14px' }}>{kitchen.count}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </div>
            {/* </div> */}
        </>
    );
};

export default Dashboard;
