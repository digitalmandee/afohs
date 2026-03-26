import * as React from 'react';

const STORAGE_KEY = 'nav-profile';
const GLOBAL_STATE_KEY = '__NAV_PROFILE_STATE__';
const GLOBAL_FLAG_KEY = '__NAV_PROFILE__';

const getWindow = () => (typeof window === 'undefined' ? null : window);

const getGlobalState = () => {
    const win = getWindow();
    if (!win) return null;

    if (!win[GLOBAL_STATE_KEY]) {
        win[GLOBAL_STATE_KEY] = {
            sequence: 0,
            active: null,
        };
    }

    return win[GLOBAL_STATE_KEY];
};

export const navProfilerEnabled = () => {
    const win = getWindow();
    if (!win) return false;

    try {
        return win[GLOBAL_FLAG_KEY] === true || win.localStorage?.getItem(STORAGE_KEY) === '1';
    } catch (error) {
        return win[GLOBAL_FLAG_KEY] === true;
    }
};

const logProfileEvent = (label, payload = {}) => {
    if (!navProfilerEnabled()) {
        return;
    }

    const timestamp = Number(performance.now().toFixed(2));
    console.log(`[nav-profile] ${label}`, {
        at: timestamp,
        ...payload,
    });
};

const storeMark = (state, label, markName) => {
    if (!state.active.marks) {
        state.active.marks = {};
    }

    state.active.marks[label] = markName;
};

export const beginNavigationTrace = (source, meta = {}) => {
    if (!navProfilerEnabled()) {
        return null;
    }

    const state = getGlobalState();
    if (!state) {
        return null;
    }

    state.sequence += 1;
    state.active = {
        id: state.sequence,
        source,
        meta,
        marks: {},
        startedAt: performance.now(),
    };

    markNavigation('sidebar_click_start', {
        source,
        ...meta,
    });

    return state.active.id;
};

export const markNavigation = (label, meta = {}) => {
    if (!navProfilerEnabled()) {
        return null;
    }

    const state = getGlobalState();
    if (!state?.active) {
        return null;
    }

    const id = state.active.id;
    const markName = `nav:${id}:${label}:${Date.now()}`;
    performance.mark(markName);
    storeMark(state, label, markName);
    logProfileEvent(label, {
        navId: id,
        ...meta,
    });
    return markName;
};

export const measureNavigation = (label, startLabel, endLabel, meta = {}) => {
    if (!navProfilerEnabled()) {
        return null;
    }

    const state = getGlobalState();
    const startMark = state?.active?.marks?.[startLabel];
    const endMark = state?.active?.marks?.[endLabel];

    if (!startMark || !endMark) {
        return null;
    }

    const measureName = `nav:${state.active.id}:${label}:${Date.now()}`;
    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName, 'measure');
    const duration = entries[entries.length - 1]?.duration ?? null;

    if (duration != null) {
        logProfileEvent(`measure:${label}`, {
            navId: state.active.id,
            duration: Number(duration.toFixed(2)),
            ...meta,
        });
    }

    return duration;
};

export const scheduleNextPaint = (label = 'next_paint_ready', meta = {}, onReady) => {
    if (!navProfilerEnabled()) {
        if (typeof onReady === 'function') {
            onReady();
        }
        return;
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            markNavigation(label, meta);
            if (typeof onReady === 'function') {
                onReady();
            }
        });
    });
};

export const finalizeNavigationTrace = (meta = {}) => {
    if (!navProfilerEnabled()) {
        return null;
    }

    const state = getGlobalState();
    if (!state?.active) {
        return null;
    }

    const summary = {
        navId: state.active.id,
        source: state.active.source,
        click_to_visit_start: measureNavigation('click_to_visit_start', 'sidebar_click_start', 'inertia_visit_start', meta),
        visit_start_to_success: measureNavigation('visit_start_to_success', 'inertia_visit_start', 'inertia_navigate_success', meta),
        success_to_effects: measureNavigation('success_to_effects', 'inertia_navigate_success', 'page_effects_complete', meta),
        success_to_paint: measureNavigation('success_to_paint', 'inertia_navigate_success', 'next_paint_ready', meta),
        click_to_paint: measureNavigation('click_to_paint', 'sidebar_click_start', 'next_paint_ready', meta),
        effects_to_paint: measureNavigation('effects_to_paint', 'page_effects_complete', 'next_paint_ready', meta),
        ...meta,
    };

    console.table([summary]);
    state.active = null;
    return summary;
};

export const useRenderProfiler = (label, metaFactory) => {
    const renderCountRef = React.useRef(0);
    const mountCountRef = React.useRef(0);

    renderCountRef.current += 1;

    React.useLayoutEffect(() => {
        if (!navProfilerEnabled()) {
            return;
        }

        const meta = typeof metaFactory === 'function' ? metaFactory() : metaFactory || {};

        if (label.includes('Layout')) {
            markNavigation('layout_render_start', {
                component: label,
                renderCount: renderCountRef.current,
                ...meta,
            });
        } else if (label.includes('SideNav')) {
            markNavigation('sidebar_render_start', {
                component: label,
                renderCount: renderCountRef.current,
                ...meta,
            });
        } else if (label.startsWith('Page:')) {
            markNavigation('page_render_start', {
                component: label,
                renderCount: renderCountRef.current,
                ...meta,
            });
        }

        logProfileEvent('render', {
            component: label,
            renderCount: renderCountRef.current,
            ...meta,
        });
    });

    React.useEffect(() => {
        if (!navProfilerEnabled()) {
            return undefined;
        }

        mountCountRef.current += 1;
        const meta = typeof metaFactory === 'function' ? metaFactory() : metaFactory || {};

        logProfileEvent('mount', {
            component: label,
            mountCount: mountCountRef.current,
            ...meta,
        });

        return () => {
            logProfileEvent('unmount', {
                component: label,
                mountCount: mountCountRef.current,
                ...meta,
            });
        };
    }, [label]);
};
