import { useState } from "react"
import { Container, Row, Card, Col, Button } from "react-bootstrap"
import { ArrowBack, AccessTime, Settings, GetApp, Description, ChevronLeft, ChevronRight } from "@mui/icons-material"
import "bootstrap/dist/css/bootstrap.min.css"
import { router } from '@inertiajs/react';


const RunPayrollDashboard = () => {
    // const [open, setOpen] = useState(true);
    const [startMonthIndex, setStartMonthIndex] = useState(0)

    const generateTimelineData = () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const data = [];

        for (let i = 0; i < 12; i++) {
            const date = new Date(currentYear, currentMonth + i, 1);

            const year = date.getFullYear();
            const monthIndex = date.getMonth();
            const monthName = date.toLocaleString('default', { month: 'short' }); // "Sep"
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

            // Change full month name to short name here
            const period = `${monthName} 1 - ${monthName} ${daysInMonth}`;

            const status = (i === 0) ? "Current" : "Pending";

            data.push({
                month: `${monthName}-${year}`,
                period,
                status
            });
        }

        return data;
    };

    const [timelineData, setTimelineData] = useState(generateTimelineData());

    const metricsData = [
        { title: "Total Employs", value: "34" },
        { title: "Total CTC", value: "34" },
        { title: "Payable Days", value: "34" },
        { title: "Total Gross Salary", value: "34" },
        { title: "Total Net Salary", value: "34,00" },
        { title: "Total Deduction", value: "34,00" },
    ]

    const statusCards = [
        { title: "Salary Revisions", status: "Pending" },
        { title: "Holed Employ", status: "Pending" },
        { title: "Deduction", status: "Pending" },
        { title: "Text Calculation", status: "Pending" },
        { title: "Leaves", status: "Pending" },
        { title: "Cheque", status: "Pending" },
    ]

    const handlePrevMonth = () => {
        setStartMonthIndex((prev) => (prev > 0 ? prev - 1 : prev))
    }

    const handleNextMonth = () => {
        setStartMonthIndex((prev) => (prev < timelineData.length - 4 ? prev + 1 : prev))
    }

    const visibleMonths = timelineData.slice(startMonthIndex, startMonthIndex + 5)
    const cardRoutes = {
        "Salary Revisions": "/employee/payroll/salary/revision",
        "Holed Employ": "/employee/payroll/holed/salary",
        "Deduction": "/employee/payroll/deduction/list",
        "Leaves": "/employee/payroll/leaves/list",
        "Cheque": "/employee/payroll/cheque/list",
    };


    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
                <Container fluid className="py-4 px-4 bg-light min-vh-100">
                    <div className="mb-4">
                        <h5 className="mb-0 d-flex align-items-center" style={{
                            color: '#063455',
                            fontWeight: 600,
                            // fontSize: '30px'
                        }}>
                            <ArrowBack style={{ marginRight: "10px", cursor: "pointer", color:'#063455' }} />
                            Run Payroll Dashboard
                        </h5>
                    </div>

                    <Card className="border-0 shadow-sm mb-4" style={{
                        backgroundColor: '#FFFFFF'
                    }}>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-1" style={{
                                marginTop: -5
                            }}>
                                <h6 className="mb-0" style={{
                                    color: '#121212',
                                    fontWeight: 700,
                                    fontSize: '20px'
                                }}>Activity</h6>
                                <Button variant="none" style={{
                                    color: '#063455',
                                    fontWeight: 500,
                                    fontSize: '16px'
                                }}>
                                    View All
                                </Button>
                            </div>

                            <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                                {/* Text div */}
                                <div style={{ flex: "1", display: "flex", alignItems: "center" }}>
                                    <p
                                        className="text-muted mb-0"
                                        style={{ fontSize: "14px", width: "430px", padding: "8px", borderRadius: "8px", border: '1px solid #DDDDDD', flexShrink: 0 }}
                                    >
                                        The chosen period's payroll has not yet been processed
                                    </p>
                                </div>

                                {/* Slider div */}
                                <div className="d-flex align-items-center flex-grow-1">
                                    <Button
                                        variant="link"
                                        className="text-decoration-none p-0"
                                        onClick={handlePrevMonth}
                                        disabled={startMonthIndex === 0}
                                    >
                                        <ChevronLeft style={{ color: startMonthIndex === 0 ? "#dee2e6" : "#6c757d" }} />
                                    </Button>

                                    <div className="d-flex justify-content-between" style={{ width: "100%", overflow: "hidden" }}>
                                        {visibleMonths.map((item, index) => (
                                            <div
                                                key={startMonthIndex + index}
                                                className="text-center rounded mx-1"
                                                style={{
                                                    flex: "1",
                                                    // height:'95px',
                                                    minWidth: "90px",
                                                    background: "#ffffff",
                                                    padding: "10px",
                                                    border: item.status === "Current" ? "1px solid #063455" : "1px solid #A5A5A5",
                                                    // borderColor:  ? "#063455" : "",
                                                }}
                                            >
                                                <div className="fw-bold mb-1" style={{ fontSize: "14px" }}>
                                                    {item.month}
                                                </div>
                                                <div className="text-muted small mb-2" style={{ fontSize: "12px" }}>
                                                    {item.period}
                                                </div>
                                                <div
                                                    className={`small px-3 py-1 rounded-pill ${item.status === "Current"
                                                        ? "text-white"
                                                        : item.status === "Completed"
                                                            ? "bg-light text-muted"
                                                            : "bg-light text-muted"
                                                        }`}
                                                    style={{ fontSize: "12px", backgroundColor: item.status === "Current" ? "#0D2B4E" : "" }}
                                                >
                                                    {item.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        variant="link"
                                        className="text-decoration-none p-0"
                                        onClick={handleNextMonth}
                                        disabled={startMonthIndex >= timelineData.length - 3}
                                    >
                                        <ChevronRight style={{ color: startMonthIndex >= timelineData.length - 4 ? "#dee2e6" : "#6c757d" }} />
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
                        {/* First Card - Total Employee and CTC */}
                        <div
                            style={{
                                backgroundColor: '#002b49',
                                color: 'white',
                                padding: '20px 24px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '400px', // or use a responsive value like '100%' with maxWidth
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '40px', width: '100%' }}>
                                {/* Left Section */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 400, color: '#FFFFFF', marginBottom: '4px' }}>Total Employee</div>
                                    <div style={{ fontSize: '34px', fontWeight: 500, color: '#FFFFFF' }}>100</div>
                                </div>

                                {/* Divider */}
                                <div
                                    style={{
                                        height: '50px',
                                        width: '1px',
                                        backgroundColor: '#bba68e',
                                    }}
                                ></div>

                                {/* Right Section */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 400, color: '#FFFFFF', marginBottom: '4px' }}>Total CTC</div>
                                    <div style={{ fontSize: '34px', fontWeight: 500, color: '#FFFFFF' }}>Rs 5,102.00</div>
                                </div>
                            </div>
                        </div>

                        {/* Second Card - Total Gross Salary */}
                        <div style={{
                            backgroundColor: '#063455',
                            color: 'white',
                            padding: '16px',
                            borderRadius: '4px',
                            width: '33%',
                            height: '166px'
                        }}>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{
                                    backgroundColor: '#202728',
                                    borderRadius: '50%',
                                    width: '46px',
                                    height: '46px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img src="/assets/wallet.png" alt="" style={{
                                        height: 22,
                                        width: 22
                                    }} />
                                </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#C6C6C6', fontWeight: 400, marginBottom: '4px' }}>Total Gross Salary</div>
                            <div style={{ fontSize: '20px', fontWeight: 500, color: '#FFFFFF' }}>380,0736</div>
                        </div>

                        {/* Third Card - Total Deduction */}
                        <div style={{
                            backgroundColor: '#063455',
                            color: 'white',
                            padding: '16px',
                            borderRadius: '4px',
                            width: '33%',
                            height: '166px'
                        }}>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{
                                    backgroundColor: '#202728',
                                    borderRadius: '50%',
                                    width: '46px',
                                    height: '46px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img src="/assets/ctc.png" alt="" style={{
                                        height: 22,
                                        width: 22
                                    }} />
                                </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#C6C6C6', fontWeight: 400, marginBottom: '4px' }}>Total Deduction</div>
                            <div style={{ fontSize: '20px', fontWeight: 500, color: '#FFFFFF' }}>500,8475</div>
                        </div>
                    </div>

                    <Row className="g-4 mb-4" style={{
                        backgroundColor: '#FFFFFF', marginTop: '1rem', marginLeft: '1px',
                        marginRight: '1px',
                    }}>
                        {statusCards.map((card, index) => (
                            <Col md={4} key={index}>
                                <Card
                                    className="border-1"
                                    onClick={() => {
                                        const route = cardRoutes[card.title];
                                        if (route) {
                                            router.visit(route);
                                        }
                                    }}
                                    style={{
                                        cursor: cardRoutes[card.title] ? "pointer" : "default"
                                    }}
                                >
                                    <Card.Body className="d-flex justify-content-between align-items-center p-4">
                                        <div>
                                            <div className="mb-1" style={{ fontSize: "14px" }}>
                                                {card.title}
                                            </div>
                                            <div className="text-muted small" style={{ fontSize: "12px" }}>
                                                {card.status}
                                            </div>
                                        </div>
                                        <AccessTime style={{ color: "#6c757d", fontSize: "20px" }} />
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                        <div className="text-end mb-4">
                            <Button
                                style={{
                                    backgroundColor: "#0A2647",
                                    borderColor: "#0A2647",
                                    fontSize: "14px",
                                }}
                            >
                                Initialize Payroll
                            </Button>
                        </div>
                    </Row>


                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="d-flex justify-content-between align-items-center p-4">
                                    <div style={{ fontSize: "14px" }}>Configuration Payroll Period</div>
                                    <Settings style={{ color: "#6c757d", fontSize: "20px" }} />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="d-flex justify-content-between align-items-center p-4">
                                    <div style={{ fontSize: "14px" }}>Generate Payslips</div>
                                    <GetApp style={{ color: "#6c757d", fontSize: "20px" }} />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="d-flex justify-content-between align-items-center p-4">
                                    <div style={{ fontSize: "14px" }}>View Payroll Summary</div>
                                    <div>
                                        <Description style={{ color: "#6c757d", fontSize: "20px", marginRight: "8px" }} />
                                        <GetApp style={{ color: "#6c757d", fontSize: "20px" }} />
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            {/* </div> */}
        </>
    )
}

export default RunPayrollDashboard

