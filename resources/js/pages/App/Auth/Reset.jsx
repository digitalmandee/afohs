import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Button, Paper, TextField, Link } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { router } from "@inertiajs/react";

const ResetPin = () => {
    const [code, setCode] = useState(["7", "", "", "", "", ""]);
    const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 56 });
    const inputRefs = useRef([]);

    // Handle input change
    const handleCodeChange = (index, value) => {
        if (value.length <= 1) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Move to next input if value is entered
            if (value && index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    // Handle countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { minutes: prev.minutes - 1, seconds: 59 };
                } else {
                    clearInterval(timer);
                    return { minutes: 0, seconds: 0 };
                }
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);
    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    height: "100vh",
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                    backgroundImage: `url(/assets/bgimage1.png)`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    },
                }}
            >
                {/* Left side with text */}
                <Box
                    sx={{
                        flex: 1,
                        display: { xs: "none", md: "flex" },
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        p: 4,
                        zIndex: 2,
                    }}
                >
                    {/* <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            color: "white",
                            maxWidth: "70%",
                            mb: 6,
                            fontWeight: 500,
                            lineHeight: 1.5,
                        }}
                    >
                        AFOHS Club was established in Pakistan Air Force Falcon
                        Complex. A total of 25.5 Kanal of land was demarcated by
                        Air Headquarters in PAF Falcon Complex for the
                        establishment of "Community Centre and Club".
                    </Typography> */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                        }}
                    >
                        {[1, 2, 3, 4, 5].map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    backgroundColor:
                                        index === 0
                                            ? "white"
                                            : "rgba(255, 255, 255, 0.5)",
                                }}
                            />
                        ))}
                    </Box>
                </Box>
                <Box
                    sx={{
                        width: { xs: "100%", md: "540px" },
                        display: "flex",
                        flexDirection: "column",
                        p: 1,
                        //   m: { xs: 1, md: 1 },
                        mt: { xs: 1, md: 1 },
                        mb: { xs: 1, md: 1 },
                        mr: { xs: 1, md: 1 },
                        zIndex: 1,
                    }}
                >
                    <Paper
                        elevation={4}
                        sx={{
                            borderRadius: 2,
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            backdropFilter: "blur(10px)",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                width: "100%",
                                // maxWidth: 550,
                                p: 5,
                                // bgcolor: 'white',
                                borderRadius: 1,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                                border: "1px solid #e0e0e0",
                            }}
                        >
                            {/* Logo */}
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    mb: 2,
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/assets/Logo.png"
                                    alt="AFOHS Club Logo"
                                    sx={{
                                        width: 150,
                                        height: 114,
                                    }}
                                />
                            </Box>

                            {/* Heading */}
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 500,
                                    fontSize: "30px",
                                    color: "#063455",
                                    mb: 1,
                                    textAlign: "flex-start",
                                }}
                            >
                                Verification Email
                            </Typography>

                            <Typography
                                sx={{
                                    color: "#7F7F7F",
                                    mb: 4,
                                    textAlign: "flex-start",
                                }}
                            >
                                We sent a code to{" "}
                                <Box
                                    component="span"
                                    sx={{ color: "#063455", fontWeight: 500 }}
                                >
                                    jamal@company.com
                                </Box>
                            </Typography>

                            {/* Code Entry */}
                            <Box sx={{ mb: 1 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 1,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            color: "#121212",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        Enter Code
                                    </Typography>
                                    <Typography
                                        sx={{
                                            color: "#7F7F7F",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        Code expires in:{" "}
                                        <Box
                                            component="span"
                                            sx={{ color: "#F14C35" }}
                                        >
                                            00:56
                                        </Box>
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        justifyContent: "space-between",
                                        mb: 2,
                                    }}
                                >
                                    {code.map((digit, index) => (
                                        <TextField
                                            key={index}
                                            inputRef={(el) =>
                                                (inputRefs.current[index] = el)
                                            }
                                            value={digit}
                                            onChange={(e) =>
                                                handleCodeChange(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                            variant="outlined"
                                            inputProps={{
                                                maxLength: 1,
                                                style: {
                                                    textAlign: "center",
                                                    padding: "10px",
                                                    fontSize: "1.2rem",
                                                    width: "60px",
                                                    height: "60px",
                                                    border: "1px solid #121212",
                                                },
                                            }}
                                            sx={{
                                                width: "50px",
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: 1,
                                                    borderColor: "#121212",
                                                },
                                            }}
                                        />
                                    ))}
                                </Box>

                                <Typography
                                    sx={{
                                        color: "#7F7F7F",
                                        fontSize: "0.9rem",
                                        mb: 4,
                                        textAlign: "flex-start",
                                    }}
                                >
                                    Didn't get a code?{" "}
                                    <Link
                                        href="#"
                                        sx={{
                                            color: "#063455",
                                            textDecoration: "none",
                                        }}
                                    >
                                        Click to resend
                                    </Link>
                                </Typography>
                            </Box>

                            {/* Action Buttons */}
                            <Box
                                sx={{
                                    display: "flex",
                                    width: "100%",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Button
                                    startIcon={<ArrowBackIcon />}
                                    sx={{
                                        color: "#121212",
                                        bgcolor: "#FFFFFF",
                                        width: "215px",
                                        height: "48px",
                                        textTransform: "none",
                                        borderRadius: 0,
                                        border: "1px solid #E3E3E3",
                                        px: 2,
                                        // py: 1
                                    }}
                                    onClick={() => router.visit("/forget-pin")}
                                >
                                    Change Email
                                </Button>

                                <Button
                                    variant="contained"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        bgcolor: "#0c4a6e",
                                        width: "215px",
                                        height: "46px",
                                        color: "#FFFFFF",
                                        textTransform: "none",
                                        borderRadius: 0,
                                        px: 2,
                                        // py: 1,
                                        "&:hover": {
                                            bgcolor: "#083654",
                                        },
                                    }}
                                    onClick={() => router.visit("/set/new/pin")}
                                >
                                    Verify
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </>
    );
};
ResetPin.layout = (page) => page;
export default ResetPin;
