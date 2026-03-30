const formatterCache = new Map();

function getFormatter({
  locale = 'en-US',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  useGrouping = true,
}) {
  const cacheKey = JSON.stringify({
    locale,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  });

  if (!formatterCache.has(cacheKey)) {
    formatterCache.set(
      cacheKey,
      new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping,
      }),
    );
  }

  return formatterCache.get(cacheKey);
}

function normalizeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/,/g, '').trim();
    if (sanitized === '') {
      return fallback;
    }
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function formatAmount(value, options = {}) {
  const {
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    prefix = '',
    suffix = '',
    fallback = '0.00',
  } = options;

  const numeric = normalizeNumber(value, null);
  if (numeric === null) {
    return fallback;
  }

  const formatter = getFormatter({
    locale,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return `${prefix}${formatter.format(numeric)}${suffix}`;
}

export function formatCurrency(value, options = {}) {
  return formatAmount(value, {
    prefix: 'Rs ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    fallback: 'Rs 0.00',
    ...options,
  });
}

export function formatCount(value, options = {}) {
  return formatAmount(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    fallback: '0',
    ...options,
  });
}
