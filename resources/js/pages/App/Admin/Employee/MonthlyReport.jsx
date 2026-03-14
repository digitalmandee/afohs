import React, { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { TextField, IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import "bootstrap/dist/css/bootstrap.min.css";
import { router } from '@inertiajs/react';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const AttendanceMonthyReport = () => {
    // const [open, setOpen] = useState(true);
    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());

    const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

    const getWeekdayIndex = (day, month, year) => {
        return new Date(year, month - 1, day).getDay(); // 0 = Sunday, 6 = Saturday
    };

    const generateAttendance = (days, month, year) => {
        let attendance = Array(days).fill("");

        let weekdayIndexes = [];
        for (let i = 1; i <= days; i++) {
            let dayOfWeek = getWeekdayIndex(i, month, year);
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                // Only consider weekdays (Monday to Friday)
                weekdayIndexes.push(i - 1);
            }
        }

        let totalWeekdays = weekdayIndexes.length;
        let presentDays = Math.floor(totalWeekdays * 0.9); // 90% Present

        let shuffledIndexes = weekdayIndexes.sort(() => 0.5 - Math.random());
        shuffledIndexes.slice(0, presentDays).forEach(idx => (attendance[idx] = "P"));
        shuffledIndexes.slice(presentDays).forEach(idx => {
            attendance[idx] = ["S", "C", "B", "M", "U"][Math.floor(Math.random() * 5)];
        });

        return attendance;
    };

    const [employees, setEmployees] = useState([
        { id: "01", name: "John Doe", attendance: generateAttendance(getDaysInMonth(month, year), month, year) },
        { id: "02", name: "Jane Doe", attendance: generateAttendance(getDaysInMonth(month, year), month, year) },
        { id: "03", name: "Mike Smith", attendance: generateAttendance(getDaysInMonth(month, year), month, year) },
    ]);

    const legend = [
        { label: "Present", color: "#6FC3AF", code: "P" },
        { label: "Sick Leave", color: "#E3BD5F", code: "S" },
        { label: "Casual Leave", color: "#469BD1", code: "C" },
        { label: "Business Leave", color: "#77C155", code: "B" },
        { label: "Maternity Leave", color: "#FF6696", code: "M" },
        { label: "Unpaid Leave", color: "#BAD53F", code: "U" },
    ];

    const calculateTotalPresent = (attendance) => attendance.filter(status => status === "P").length;

    const handleMonthChange = (event) => {
        const newMonth = parseInt(event.target.value);
        setMonth(newMonth);
        setEmployees(employees.map(emp => ({
            ...emp,
            attendance: generateAttendance(getDaysInMonth(newMonth, year), newMonth, year)
        })));
    };

    const handleYearChange = (event) => {
        const newYear = parseInt(event.target.value);
        setYear(newYear);
        setEmployees(employees.map(emp => ({
            ...emp,
            attendance: generateAttendance(getDaysInMonth(month, newYear), month, newYear)
        })));
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
                <div className="container-fluid px-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", padding: "20px" }}>
                    {/* Header */}
                    <div className="d-flex align-items-center mb-4">
                        {/* <IconButton>
                            <ArrowBack />
                        </IconButton> */}
                        <h5 className="mb-0 ms-2" style={{
                            fontWeight:500, fontSize:'30px', color:'#063455'
                        }}>Attendance Monthly Report</h5>
                    </div>

                    {/* Controls */}
                    <div className="d-flex justify-content-end gap-2">
                        <TextField
                            select
                            label="Month"
                            value={month}
                            onChange={handleMonthChange}
                            size="small"
                            SelectProps={{ native: true }}
                            style={{ backgroundColor: "white", minWidth: "120px" }}
                        >
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </TextField>

                        <TextField
                            type="number"
                            label="Year"
                            value={year}
                            onChange={handleYearChange}
                            size="small"
                            style={{ backgroundColor: "white", minWidth: "100px" }}
                        />
                    </div>

                    {/* Legend */}
                    <div className="d-flex flex-wrap gap-5 mb-4 mt-3">
                        {legend.map((item) => (
                            <div key={item.code} className="d-flex align-items-center px-3 py-1"
                                style={{ backgroundColor: item.color, borderRadius: "6px", minWidth: "fit-content", gap: "8px" }}>
                                <span style={{ fontSize: "14px" }}>{item.label}</span>
                                <span style={{ fontSize: "14px", fontWeight: "500", marginLeft: "4px" }}>{item.code}</span>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <Table bordered hover className="mb-0" style={{ minWidth: '1200px', backgroundColor: "#C5D9F0" }}>
                            <thead>
                                <tr>
                                    <th style={{ width: "60px", backgroundColor: "#C5D9F0" }}>ID</th>
                                    <th style={{ width: "150px", backgroundColor: "#C5D9F0" }}>Employee Name</th>
                                    {[...Array(getDaysInMonth(month, year))].map((_, i) => {
                                        let dayIndex = getWeekdayIndex(i + 1, month, year);
                                        return (
                                            <th key={i} className="text-center"
                                                style={{ width: "40px", padding: "8px 4px", backgroundColor: dayIndex === 0 || dayIndex === 6 ? "#C5D9F0" : "inherit" }}>
                                                <div style={{ fontSize: "14px" }}>{(i + 1).toString().padStart(2, "0")}</div>
                                                <div style={{ fontSize: "12px", color: "#6c757d" }}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]}</div>
                                            </th>
                                        );
                                    })}
                                    <th className="text-center" style={{ width: "100px", backgroundColor: "#C5D9F0" }}>Total Present</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((employee, idx) => (
                                    <tr key={idx}>
                                        <td>{employee.id}</td>
                                        <td>{employee.name}</td>
                                        {employee.attendance.map((status, i) => (
                                            <td key={i} className="text-center"
                                                style={{ backgroundColor: legend.find(item => item.code === status)?.color || "white" }}>
                                                {status}
                                            </td>
                                        ))}
                                        <td className="text-center">{calculateTotalPresent(employee.attendance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
            {/* </div> */}
        </>
    );
};

export default AttendanceMonthyReport;
