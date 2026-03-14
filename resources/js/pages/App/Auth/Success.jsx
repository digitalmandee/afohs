import React, { useState } from "react";
import { Box, Typography, Button, Paper, Container } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { router } from "@inertiajs/react";

const SuccessScreen = () => {
    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    bgcolor: "#f8fafc",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Background patterns */}
                <Box
                    sx={{
                        position: "absolute",
                        left: 0,
                        bottom: 0,
                        width: "200px",
                        height: "200px",
                        opacity: 0.1,
                        backgroundImage: `radial-gradient(circle, transparent 20%, #e2e8f0 20%, #e2e8f0 21%, transparent 21%, transparent 30%, #e2e8f0 30%, #e2e8f0 31%, transparent 31%)`,
                        backgroundSize: "60px 60px",
                        transform: "rotate(10deg)",
                        zIndex: 0,
                    }}
                />

                <Box
                    sx={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        width: "200px",
                        height: "200px",
                        opacity: 0.1,
                        backgroundImage: `radial-gradient(circle, transparent 20%, #e2e8f0 20%, #e2e8f0 21%, transparent 21%, transparent 30%, #e2e8f0 30%, #e2e8f0 31%, transparent 31%)`,
                        backgroundSize: "60px 60px",
                        transform: "rotate(10deg)",
                        zIndex: 0,
                    }}
                />

                <Container
                    maxWidth="sm"
                    sx={{ zIndex: 1, textAlign: "center", py: 4 }}
                >
                    <Box sx={{ position: "relative", mb: 4 }}>
                        {/* Success icon with green circle */}
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                bgcolor: "#10b981",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                mx: "auto",
                                boxShadow: "0 0 0 10px rgba(16, 185, 129, 0.1)",
                            }}
                        >
                            <CheckIcon sx={{ color: "white", fontSize: 40 }} />
                        </Box>

                        {/* Confetti elements */}
                        {[...Array(20)].map((_, i) => (
                            <Box
                                key={i}
                                sx={{
                                    position: "absolute",
                                    width: i % 3 === 0 ? 8 : 6,
                                    height: i % 3 === 0 ? 8 : 6,
                                    borderRadius: "50%",
                                    bgcolor:
                                        i % 5 === 0
                                            ? "#f59e0b"
                                            : i % 4 === 0
                                            ? "#3b82f6"
                                            : i % 3 === 0
                                            ? "#ef4444"
                                            : "#10b981",
                                    top: `${Math.random() * 100 - 20}%`,
                                    left: `${Math.random() * 100}%`,
                                    transform: `rotate(${
                                        Math.random() * 360
                                    }deg)`,
                                    opacity: 0.8,
                                }}
                            />
                        ))}

                        {[...Array(10)].map((_, i) => (
                            <Box
                                key={i + "line"}
                                sx={{
                                    position: "absolute",
                                    width: 2,
                                    height: 15 + Math.random() * 15,
                                    bgcolor:
                                        i % 5 === 0
                                            ? "#f59e0b"
                                            : i % 4 === 0
                                            ? "#3b82f6"
                                            : i % 3 === 0
                                            ? "#ef4444"
                                            : "#10b981",
                                    top: `${Math.random() * 100 - 30}%`,
                                    left: `${Math.random() * 100}%`,
                                    transform: `rotate(${
                                        Math.random() * 360
                                    }deg)`,
                                    borderRadius: 1,
                                    opacity: 0.8,
                                }}
                            />
                        ))}
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                        All Done!
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{ color: "#6b7280", mb: 4 }}
                    >
                        Your pin has been reset
                    </Typography>

                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            width: "300px",
                            bgcolor: "#0c4a6e",
                            color: "white",
                            py: 1.5,
                            textTransform: "none",
                            borderRadius: 0,
                            "&:hover": {
                                bgcolor: "#083654",
                            },
                        }}
                        onClick={() => router.visit("/dashboard")}
                    >
                        Sign In
                    </Button>
                </Container>
            </Box>
        </>
    );
};
SuccessScreen.layout = (page) => page;
export default SuccessScreen;
