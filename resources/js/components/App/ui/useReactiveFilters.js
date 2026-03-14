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

    const targetUrl = React.useMemo(() => route(routeName), [routeName]);

    const visit = React.useMemo(
        () =>
            debounce((nextFilters) => {
                router.get(targetUrl, cleanFilters(nextFilters), {
                    preserveState: false,
                    preserveScroll: true,
                    replace: true,
                    only,
                });
            }, debounceMs),
        [debounceMs, only, targetUrl],
    );

    React.useEffect(() => () => visit.cancel(), [visit]);

    React.useEffect(() => {
        setFilters(Object.fromEntries(Object.entries(parsedInitialFilters).map(([key, value]) => [key, normalizeValue(value)])));
    }, [parsedInitialFilters]);

    const updateFilter = React.useCallback(
        (name, value, options = {}) => {
            const { immediate = false } = options;

            setFilters((current) => {
                const nextFilters = {
                    ...current,
                    [name]: normalizeValue(value),
                };

                if (name !== 'page') {
                    nextFilters.page = 1;
                }

                if (immediate) {
                    visit.cancel();
                    router.get(targetUrl, cleanFilters(nextFilters), {
                        preserveState: false,
                        preserveScroll: true,
                        replace: true,
                        only,
                    });
                } else {
                    visit(nextFilters);
                }

                return nextFilters;
            });
        },
        [only, routeName, visit],
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

        setFilters(nextFilters);
        router.get(targetUrl, cleanFilters(nextFilters), {
            preserveState: false,
            preserveScroll: true,
            replace: true,
            only,
        });
    }, [filters, only, targetUrl, visit]);

    return {
        filters,
        updateFilter,
        resetFilters,
    };
}
