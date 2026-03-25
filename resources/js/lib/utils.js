export function isPosPath(pathname) {
    if (!pathname) return false;
    return pathname === '/pos' || pathname.startsWith('/pos/');
}

export function isAdminInventoryPath(pathname) {
    if (!pathname) return false;
    return pathname === '/admin/inventory' || pathname.startsWith('/admin/inventory/');
}

export function routeNameForContext(routeName, pathname = undefined) {
    const currentPathname =
        pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');

    if (isAdminInventoryPath(currentPathname)) {
        const adminInventoryRouteMap = {
            'inventory.index': 'inventory.items.index',
            'inventory.create': 'inventory.items.create',
            'inventory.store': 'inventory.items.store',
            'inventory.show': 'inventory.items.show',
            'inventory.update': 'inventory.items.update',
            'inventory.destroy': 'inventory.items.destroy',
            'inventory.category': 'inventory.item-categories.index',
            'inventory.category.store': 'inventory.item-categories.store',
            'inventory.categories': 'inventory.item-categories.options',
            'category.update': 'inventory.item-categories.update',
            'category.destroy': 'inventory.item-categories.destroy',
            'category.trashed': 'inventory.item-categories.trashed',
            'category.restore': 'inventory.item-categories.restore',
            'category.force-delete': 'inventory.item-categories.force-delete',
            'ingredients.index': 'inventory.ingredients.index',
            'ingredients.create': 'inventory.ingredients.create',
            'ingredients.store': 'inventory.ingredients.store',
            'ingredients.show': 'inventory.ingredients.show',
            'ingredients.edit': 'inventory.ingredients.edit',
            'ingredients.update': 'inventory.ingredients.update',
            'ingredients.destroy': 'inventory.ingredients.destroy',
            'ingredients.add-stock.form': 'inventory.ingredients.add-stock.form',
            'ingredients.add-stock': 'inventory.ingredients.add-stock',
            'units.index': 'inventory.units.index',
            'units.store': 'inventory.units.store',
            'units.update': 'inventory.units.update',
            'units.destroy': 'inventory.units.destroy',
            'units.trashed': 'inventory.units.trashed',
            'units.restore': 'inventory.units.restore',
            'units.force-delete': 'inventory.units.force-delete',
            'manufacturers.index': 'inventory.manufacturers.index',
            'manufacturers.store': 'inventory.manufacturers.store',
            'manufacturers.update': 'inventory.manufacturers.update',
            'manufacturers.destroy': 'inventory.manufacturers.destroy',
            'manufacturers.trashed': 'inventory.manufacturers.trashed',
            'manufacturers.restore': 'inventory.manufacturers.restore',
            'manufacturers.force-delete': 'inventory.manufacturers.force-delete',
            'sub-categories.index': 'inventory.sub-categories.index',
            'sub-categories.store': 'inventory.sub-categories.store',
            'sub-categories.update': 'inventory.sub-categories.update',
            'sub-categories.destroy': 'inventory.sub-categories.destroy',
            'sub-categories.trashed': 'inventory.sub-categories.trashed',
            'sub-categories.restore': 'inventory.sub-categories.restore',
            'sub-categories.force-delete': 'inventory.sub-categories.force-delete',
            'products.index': 'pos.products.index',
        };

        return adminInventoryRouteMap[routeName] || routeName;
    }

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
