import React from 'react';
import { Box, Card, CardActionArea, Chip, Stack, Typography } from '@mui/material';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import BalanceRoundedIcon from '@mui/icons-material/BalanceRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import MoveDownRoundedIcon from '@mui/icons-material/MoveDownRounded';
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded';

const iconMap = {
    balance: BalanceRoundedIcon,
    sheet: DescriptionRoundedIcon,
    profit: TrendingUpRoundedIcon,
    statements: SummarizeRoundedIcon,
    ledger: FactCheckRoundedIcon,
    accounts: AccountTreeRoundedIcon,
    payables: AccountBalanceWalletRoundedIcon,
    expenses: RequestQuoteRoundedIcon,
    daybook: AssessmentRoundedIcon,
    cash: AttachMoneyRoundedIcon,
    bank: AccountBalanceWalletRoundedIcon,
    voucher: ReceiptLongRoundedIcon,
    aging: HistoryEduRoundedIcon,
    requisition: DescriptionRoundedIcon,
    bill: ReceiptLongRoundedIcon,
    payment: PaymentsRoundedIcon,
    advance: PaymentsRoundedIcon,
    po: DescriptionRoundedIcon,
    documents: InventoryRoundedIcon,
    valuation: AssessmentRoundedIcon,
    operations: Inventory2RoundedIcon,
    audit: FactCheckRoundedIcon,
    grn: MoveDownRoundedIcon,
    returns: ReceiptLongRoundedIcon,
    delivery: LocalShippingRoundedIcon,
    default: WarehouseRoundedIcon,
};

export default function ReportHubCard({ title, description, badge, iconKey, onClick, disabled = false }) {
    const Icon = iconMap[iconKey] || iconMap.default;

    return (
        <Card
            sx={{
                height: '100%',
                border: '1px solid rgba(6, 52, 85, 0.12)',
                borderRadius: 3,
                boxShadow: '0 5px 20px rgba(15, 23, 42, 0.06)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,250,255,0.96) 100%)',
                overflow: 'hidden',
            }}
        >
            <CardActionArea
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                sx={{
                    height: '100%',
                    p: 2,
                    alignItems: 'stretch',
                    '&:hover': {
                        backgroundColor: 'rgba(12, 103, 167, 0.05)',
                    },
                    '&.Mui-focusVisible': {
                        outline: '2px solid #0c67a7',
                        outlineOffset: '-2px',
                    },
                }}
            >
                <Stack spacing={1.4} sx={{ height: '100%' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: 'rgba(6,52,85,0.09)',
                                color: '#063455',
                            }}
                        >
                            <Icon fontSize="small" />
                        </Box>
                        {badge ? <Chip size="small" label={badge} sx={{ fontWeight: 700, bgcolor: 'rgba(12,103,167,0.10)', color: '#063455' }} /> : null}
                    </Stack>

                    <Box sx={{ minHeight: 70 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.25 }}>
                            {title}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary', lineHeight: 1.35 }}>
                            {description || 'Open report'}
                        </Typography>
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
                        <Typography variant="caption" sx={{ color: '#0c67a7', fontWeight: 700 }}>
                            Open Report
                        </Typography>
                        <ArrowOutwardRoundedIcon sx={{ fontSize: 18, color: '#0c67a7' }} />
                    </Stack>
                </Stack>
            </CardActionArea>
        </Card>
    );
}
