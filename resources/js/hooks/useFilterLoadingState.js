import React from 'react';

export default function useFilterLoadingState(resetDeps = []) {
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setLoading(false);
    }, resetDeps);

    const beginLoading = React.useCallback(() => {
        setLoading(true);
    }, []);

    return {
        loading,
        beginLoading,
        setLoading,
    };
}
