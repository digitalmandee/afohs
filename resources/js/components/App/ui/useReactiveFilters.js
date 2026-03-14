import React from 'react';
import { router } from '@inertiajs/react';
import debounce from 'lodash.debounce';

const normalizeValue = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    return value;
};

const cleanFilters = (filters) =>
    Object.fromEntries(
        Object.entries(filters).filter(([, value]) => {
            if (value === '' || value === null || value === undefined) {
                return false;
            }

            if (Array.isArray(value) && value.length === 0) {
                return false;
            }

            return true;
        }),
    );

export default function useReactiveFilters({ routeName, initialFilters = {}, debounceMs = 350, only = undefined }) {
    const serializedInitialFilters = React.useMemo(() => JSON.stringify(initialFilters), [initialFilters]);
    const parsedInitialFilters = React.useMemo(() => JSON.parse(serializedInitialFilters), [serializedInitialFilters]);
    const [filters, setFilters] = React.useState(() =>
        Object.fromEntries(Object.entries(parsedInitialFilters).map(([key, value]) => [key, normalizeValue(value)])),
    );
    const filtersRef = React.useRef(filters);

    const resolveTargetUrl = React.useCallback(() => {
        try {
            const namedRoute = route(routeName);

            if (namedRoute && namedRoute !== 'undefined') {
                return namedRoute;
            }
        } catch (error) {
            if (typeof window !== 'undefined') {
                console.warn('[ReactiveFilters] named route lookup failed, falling back to current path', {
                    routeName,
                    error: error?.message,
                });
            }
        }

        if (typeof window !== 'undefined') {
            return window.location.pathname;
        }

        return '';
    }, [routeName]);

    const performVisit = React.useCallback(
        (nextFilters) => {
            const targetUrl = resolveTargetUrl();

            if (typeof window !== 'undefined') {
                console.debug('[ReactiveFilters] visit', {
                    routeName,
                    targetUrl,
                    filters: cleanFilters(nextFilters),
                });
            }

            router.get(targetUrl, cleanFilters(nextFilters), {
                preserveState: false,
                preserveScroll: true,
                replace: true,
                only,
            });
        },
        [only, resolveTargetUrl, routeName],
    );

    const visit = React.useMemo(
        () =>
            debounce((nextFilters) => {
                performVisit(nextFilters);
            }, debounceMs),
        [debounceMs, performVisit],
    );

    React.useEffect(() => () => visit.cancel(), [visit]);

    React.useEffect(() => {
        const nextFilters = Object.fromEntries(Object.entries(parsedInitialFilters).map(([key, value]) => [key, normalizeValue(value)]));
        filtersRef.current = nextFilters;
        setFilters(nextFilters);
    }, [parsedInitialFilters]);

    const buildNextFilters = React.useCallback((name, value) => {
        const nextFilters = {
            ...filtersRef.current,
            [name]: normalizeValue(value),
        };

        if (name !== 'page') {
            nextFilters.page = 1;
        }

        return nextFilters;
    }, []);

    const buildNextFiltersFromObject = React.useCallback((partialFilters) => {
        const normalizedPartial = Object.fromEntries(
            Object.entries(partialFilters).map(([key, value]) => [key, normalizeValue(value)]),
        );

        const nextFilters = {
            ...filtersRef.current,
            ...normalizedPartial,
        };

        if (!Object.prototype.hasOwnProperty.call(normalizedPartial, 'page')) {
            nextFilters.page = 1;
        }

        return nextFilters;
    }, []);

    const updateFilter = React.useCallback(
        (name, value, options = {}) => {
            const { immediate = false } = options;
            const nextFilters = buildNextFilters(name, value);

            filtersRef.current = nextFilters;
            setFilters(nextFilters);

            if (immediate) {
                visit.cancel();
                performVisit(nextFilters);
            } else {
                visit(nextFilters);
            }
        },
        [buildNextFilters, performVisit, visit],
    );

    const resetFilters = React.useCallback(() => {
        visit.cancel();
        const nextFilters = Object.fromEntries(
            Object.keys(filters).map((key) => {
                if (key === 'per_page') {
                    return [key, filters.per_page || 25];
                }

                if (key === 'page') {
                    return [key, 1];
                }

                return [key, ''];
            }),
        );

        filtersRef.current = nextFilters;
        setFilters(nextFilters);
        performVisit(nextFilters);
    }, [filters, performVisit, visit]);

    const updateFilters = React.useCallback(
        (partialFilters, options = {}) => {
            const { immediate = false } = options;
            const nextFilters = buildNextFiltersFromObject(partialFilters);

            filtersRef.current = nextFilters;
            setFilters(nextFilters);

            if (immediate) {
                visit.cancel();
                performVisit(nextFilters);
            } else {
                visit(nextFilters);
            }
        },
        [buildNextFiltersFromObject, performVisit, visit],
    );

    return {
        filters,
        updateFilter,
        updateFilters,
        applyFilters: performVisit,
        resetFilters,
    };
}
