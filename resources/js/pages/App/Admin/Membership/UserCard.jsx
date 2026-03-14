import React from 'react';
import { Box, Card, CardContent, Divider, Typography, Avatar, Button, Grid, styled, Drawer } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

const MembershipCard = styled(Card)(() => ({
    width: '100%',
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 12,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    // maxWidth: 560,
    // width: '100%',
    // margin: '0 auto',   // center the card horizontally
    // borderRadius: 12,
    // boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
    // overflow: 'hidden',
}));

const MembershipFooter = styled(Box)(() => ({
    backgroundColor: '#0a3d62',
    color: 'white',
    padding: 10,
    textAlign: 'center',
}));

const formatExpiryDate = (date) => {
    if (!date) return 'N/A';
    const formats = ['DD-MM-YYYY', 'YYYY-MM-DD'];
    let d = dayjs(date, formats, true);
    if (!d.isValid()) d = dayjs(date); // Fallback
    return d.isValid() ? d.format('MM/YY') : 'N/A';
};

export const handlePrintMembershipCard = (member) => {
    if (!member) return;

    const printWindow = window.open('', '_blank');

    const content = `
<!doctype html>
<html>
<head>
    <title>Membership Card</title>
    <style>
        body {
            font-family: Inter, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            background-color: #f5f5f5;
        }

        .membership-card {
            width: 330px;
            border: 1px solid #e3e3e3;
            border-radius: 12px;
            box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
            background-color: white;
            overflow: hidden;
            padding-top: 10px;
        }

        .content {
            padding: 10px 0;
        }

        .row {
            display: flex;
            width: 100%;
        }

        .col {
            width: 33.33%;
            display: flex;
            flex-direction: column;
        }

        /* LEFT COLUMN - Perfect MUI replica */
        .left {
            padding-left: 15px;
            padding-top: 30px;
            align-items: flex-start;
        }

        .avatar-wrapper {
            width: 70px;
            height: 70px;
            border: 2px solid #063455;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .avatar-img {
            width: 100%;
            height: 100%;
        }

        .name {
            font-size: 10px;
            font-weight: 700;
            color: #000;
            margin-top: 5px;
            text-transform: capitalize;
        }

        /* CENTER COLUMN - Perfect MUI replica */
        .center {
            align-items: center;
            justify-content: center;
        }

        .logo {
        margin-top:-10px;
            height: 100px;
        }

        .label {
            margin-top: 15px;
            font-size: 10px;
            font-weight: 700;
            padding-left: 10px;
            color: #000;
            white-space: nowrap;
        }

        .value-no {
            font-size: 10px;
            font-weight: 800;
            color: #000;
            padding-left: 10px;
            padding-top: 2px
        }

        /* RIGHT COLUMN - Perfect MUI replica */
        .right {
            padding-right: 15px;
            padding-top: 40px;
            align-items: flex-end;
        }

        .qr-wrapper {
            width: 45px;
            height: 45px;
            border: 2px solid #000;
            border-radius: 4px;
            padding: 4px;
            background-color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .qr-img {
            width: 100%;
            height: 100%;
        }

        .label-month-year {
    margin-top: 4px;
    font-size: 6px;
    font-weight: 900;
    color: #000;
    margin-top: 5px
}

.valid-row-box {
    display: flex;
    justify-content: space-between;
  align-items: center;   /* 🔥 KEY FIX */
  gap: 10px;
  margin-top: 6px;
}


.label-valid-until {
   display: flex;   /* 🔥 shrink to content */
    flex-direction: column;
    font-size: 10px;
    font-weight: 800;
    color: #000;
    line-height: 1;
    margin-top: 0;
    padding: 0;
}

.label-valid-until span {
    margin-top: 0;
    padding-top: 0;
}

.value {
    font-size: 14px;
    font-weight: 800;
    color: #000;
}

        .footer {
            background-color: #063455;
            color: white;
            padding: 5px;
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            text-transform: Uppercase;
        }

        .footer.supplementary {
    background-color: transparent;
    color: black;
    position: relative;
}

/* Horizontal line above footer */
.footer.supplementary::before {
    content: "";
    position: absolute;
    top: 0;
    left: 5px;        /* margin from left */
    right: 5px;       /* margin from right */
    height: 2px;
    background-color: #063455;
}

        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .membership-card {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="membership-card">
        <div class="content">
            <div class="row">
                <!-- LEFT COLUMN -->
                <div class="col left">
                    <div class="avatar-wrapper">
                        <img class="avatar-img" src="${member?.profile_photo?.file_path || '/placeholder.svg'}" alt="Member Photo" />
                    </div>
                    <div class="name">${member?.full_name || 'N/A'}</div>
                </div>

                <!-- CENTER COLUMN -->
                <div class="col center">
                    <img src="/assets/Logo.png" class="logo" alt="AFOHS CLUB" />
                    <div class="label">Membership No</div>
                    <div class="value-no">${member?.membership_no || 'N/A'}</div>
                </div>

                <!-- RIGHT COLUMN -->
                <div class="col right">
                 <div class="qr-wrapper">
                        <img class="qr-img" src="/${member?.qr_code || ''}" alt="QR Code" />
                 </div>
                   <div class="label-month-year">
                   MONTH/YEAR
                   </div>
                    <div class="valid-row-box">
                      <div class="label-valid-until">
                        <span>Valid</span>
                        <span>Until</span>
                       </div>
                       <div class="value">
                          ${formatExpiryDate(member?.card_expiry_date)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer ${member?.parent_id ? 'supplementary' : ''}">
    ${member?.parent_id
            ? 'Supplementary Member'
            : member?.corporate_company_id || member?.is_corporate
                ? 'Corporate Member'
                : 'Primary Member'}
</div>
    </div>
</body>
</html>
`;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};

export const MembershipCardContent = ({ member, id }) => {
    return (
        <MembershipCard id={id}>
            <CardContent sx={{ py: 2 }}>
                <Grid container spacing={0} sx={{ width: '100%', m: 0 }}>
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pt: 5.8 }}>
                            {/* <Avatar src={member?.profile_photo?.file_path} alt="Member Photo" sx={{
                                width: 100, height: 100, borderRadius: 1, border: '1px solid #0a3d62', objectFit: 'cover', objectPosition: 'center', p: "4px", bgcolor:'#BDBDBD'
                            }} variant="square" /> */}
                            <Box
                                sx={{
                                    width: '140px',
                                    height: '140px',
                                    border: '2px solid #063455',
                                    borderRadius: 1,
                                    // p: '4px',
                                    // bgcolor: '#BDBDBD',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={member?.profile_photo?.file_path}
                                    alt="Member Photo"
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </Box>
                            <Typography sx={{ fontSize: '16px', fontWeight: 600, textTransform: 'capitalize', pt: 0.5 }} color="#000">
                                {member?.full_name || 'N/A'}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <img src="/assets/Logo.png" alt="AFOHS CLUB" style={{ height: 150 }} />
                            </Box>
                            <Typography sx={{ fontSize: '16px', fontWeight: 600, pt: 5, pl: 2, whiteSpace: 'nowrap', color: '#000' }}>
                                Membership No
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold" color="#000" sx={{ ml: 3 }}>
                                {member?.membership_no || 'N/A'}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pt: 11, pr: 0.1 }}>
                            <Box
                                sx={{
                                    width: '90px',
                                    height: '90px',
                                    border: '2px solid #000',
                                    borderRadius: 1,
                                    p: '4px',
                                    bgcolor: '#fff',
                                }}
                            >
                                <img src={'/' + member?.qr_code} alt="QR Code" style={{ width: "100%", height: "100%" }} />
                            </Box>
                            <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: '#000', pt: 1 }}>
                                MONTH/YEAR
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Typography
                                    sx={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        pt: 0.1,
                                        color: '#000',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    VALID<br />
                                    UNTIL
                                </Typography>
                                <Typography sx={{fontWeight:800, fontSize:'16px', color:'#000', marginTop:1}}>
                                    {formatExpiryDate(member?.card_expiry_date)}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
            {/* <MembershipFooter>
                <Typography variant="h6" fontWeight="medium" sx={{ textTransform: 'uppercase' }}>
                    {member?.parent_id ? 'Supplementary Member' : member?.corporate_company_id || member?.is_corporate ? 'Corporate Member' : 'Primary Member'}
                </Typography>
            </MembershipFooter> */}
            <>
                {member?.parent_id && (
                    <Divider
                        sx={{
                            borderColor: '#063455',
                            borderBottomWidth: '5px',
                            opacity: 1,
                            width: 'calc(100% - 20px)',
                            mx: 'auto',
                            mb: 1,
                        }}
                    />
                )}

                <MembershipFooter
                    sx={{
                        backgroundColor: member?.parent_id ? 'transparent' : '#063455',
                        color: member?.parent_id ? 'black' : 'white',
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight="small"
                        sx={{ textTransform: 'uppercase' }}
                    >
                        {member?.parent_id
                            ? 'Supplementary Member'
                            : member?.corporate_company_id || member?.is_corporate
                                ? 'Corporate Member'
                                : 'Primary Member'}
                    </Typography>
                </MembershipFooter>
            </>
        </MembershipCard>
    );
};

const MembershipCardComponent = ({ open, onClose, member }) => {
    const handleDownload = async () => {
        const element = document.getElementById('membership-card-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true, // Enable CORS for images
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Membership_Card_${member?.membership_no || 'card'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading card:', error);
        }
    };

    return (
        <Drawer
            anchor="top"
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
                sx: {
                    margin: '20px auto 0',
                    width: 600,
                    // height:900,
                    borderRadius: '8px',
                    // bgcolor:'#000'
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <MembershipCardContent member={member} id="membership-card-content" />
            </Box>

            {member?.is_document_enabled && (
                <Typography display="flex" justifyContent="center" alignItems="center" variant="caption" color="error">
                    Document is Missing
                </Typography>
            )}

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="text" color="inherit" onClick={onClose}>
                    Close
                </Button>
                <Button variant="text" color="primary" disabled={member?.card_status !== 'Expired' && member?.card_status !== 'Suspend'}>
                    Send Remind
                </Button>
                <Button onClick={() => handlePrintMembershipCard(member)} variant="contained" disabled={member?.is_document_enabled} startIcon={<PrintIcon />} sx={{ bgcolor: '#0a3d62', '&:hover': { bgcolor: '#0c2461' } }}>
                    Print
                </Button>
                <Button onClick={handleDownload} variant="contained" disabled={member?.is_document_enabled} startIcon={<DownloadIcon />} sx={{ bgcolor: '#0a3d62', '&:hover': { bgcolor: '#0c2461' } }}>
                    Download
                </Button>
            </Box>
        </Drawer>
    );
};

export default MembershipCardComponent;
