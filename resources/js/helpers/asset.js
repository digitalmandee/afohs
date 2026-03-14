import { router } from '@inertiajs/react';

export const tenantAsset = (path) => {
    const base = router.page?.props?.tenantAssetBase ?? '';
    return `${base}${path}`;
};
