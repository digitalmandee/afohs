export function isPosPath(pathname) {
    if (!pathname) return false;
    return pathname === '/pos' || pathname.startsWith('/pos/');
}

export function routeNameForContext(routeName, pathname = undefined) {
    const currentPathname =
        pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');

    if (!isPosPath(currentPathname)) return routeName;
    if (routeName.startsWith('pos.')) return routeName;

    const prefixes = [
        'order.',
        'orders.',
        'rooms.',
        'products.',
        'api.',
        'reservations.',
        'tables.',
        'cake-bookings.',
        'cake-types.',
        'floor.',
        'floors.',
        'table.',
        'kitchen.',
        'transaction.',
        'pos-shifts.',
        'inventory.',
        'category.',
        'ingredients.',
        'units.',
        'manufacturers.',
        'sub-categories.',
        'product.',
        'settings',
        'setting.',
        'printer.',
        'members.',
        'customers.',
        'waiters.',
        'riders.',
        'user.',
    ];

    const shouldPrefix = prefixes.some((prefix) => routeName.startsWith(prefix));
    if (!shouldPrefix) return routeName;

    return `pos.${routeName}`;
}
