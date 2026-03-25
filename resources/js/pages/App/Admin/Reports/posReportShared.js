export const formatReportCurrency = (amount) => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
}).format(Number(amount || 0)).replace('PKR', 'Rs');

export const normalizeStringArray = (value) => {
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }
    if (!value) {
        return [];
    }

    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

export const normalizeIntArray = (value) => normalizeStringArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
