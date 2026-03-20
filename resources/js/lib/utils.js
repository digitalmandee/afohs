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
        'printers.',
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

export function safeRoute(routeName, params = undefined, absolute = true, meta = undefined) {
    if (!routeName || typeof route !== 'function') {
        console.warn('navigation.route.unresolved', { routeName, params, ...meta });
        return null;
    }

    try {
        return route(routeName, params, absolute);
    } catch (error) {
        console.warn('navigation.route.unresolved', {
            routeName,
            params,
            ...meta,
            error: error?.message || 'unknown',
        });
        return null;
    }
}

export function safeRouteForContext(routeName, pathname = undefined, params = undefined, absolute = true, meta = undefined) {
    const resolvedRouteName = routeNameForContext(routeName, pathname);
    return safeRoute(resolvedRouteName, params, absolute, {
        source_pathname: pathname,
        requested_route_name: routeName,
        resolved_route_name: resolvedRouteName,
        ...meta,
    });
}
