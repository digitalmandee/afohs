export function formatReportAmount(value, digits = 2) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(Number(value || 0));
}

export function formatReportCount(value) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

export function openReportPrint(routeName, filters = {}) {
    const url = route(routeName, sanitizeFilters(filters));
    window.open(url, '_blank', 'noopener,noreferrer');
}

export function downloadReportPdf(routeName, filters = {}) {
    window.location.href = route(routeName, sanitizeFilters(filters));
}

export function downloadReportCsv(routeName, filters = {}) {
    window.location.href = route(routeName, {
        ...sanitizeFilters(filters),
        export: 'csv',
    });
}

export function sanitizeFilters(filters = {}) {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
}
