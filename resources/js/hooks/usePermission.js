import { usePage } from '@inertiajs/react';

/**
 * Custom hook for permission checking
 * 
 * Usage:
 * const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, isSuperAdmin } = usePermission();
 * 
 * if (hasPermission('members.create')) {
 *     // Show create button
 * }
 */
export const usePermission = () => {
    const { auth } = usePage().props;
    
    /**
     * Check if user has a specific permission
     * @param {string} permission - Permission name (e.g., 'members.create')
     * @returns {boolean}
     */
    const hasPermission = (permission) => {
        return auth.permissions?.includes(permission) || false;
    };
    
    /**
     * Check if user has any of the specified permissions
     * @param {string[]} permissions - Array of permission names
     * @returns {boolean}
     */
    const hasAnyPermission = (permissions) => {
        return permissions.some(p => auth.permissions?.includes(p)) || false;
    };
    
    /**
     * Check if user has all of the specified permissions
     * @param {string[]} permissions - Array of permission names
     * @returns {boolean}
     */
    const hasAllPermissions = (permissions) => {
        return permissions.every(p => auth.permissions?.includes(p)) || false;
    };
    
    /**
     * Check if user has a specific role
     * @param {string} role - Role name (e.g., 'admin', 'super-admin')
     * @returns {boolean}
     */
    const hasRole = (role) => {
        return auth.roles?.includes(role) || false;
    };
    
    /**
     * Check if user has any of the specified roles
     * @param {string[]} roles - Array of role names
     * @returns {boolean}
     */
    const hasAnyRole = (roles) => {
        return roles.some(r => auth.roles?.includes(r)) || false;
    };
    
    /**
     * Check if user is super admin
     * @returns {boolean}
     */
    const isSuperAdmin = () => {
        return auth.roles?.includes('super-admin') || false;
    };
    
    /**
     * Check if user is admin or super admin
     * @returns {boolean}
     */
    const isAdmin = () => {
        return hasAnyRole(['admin', 'super-admin']);
    };
    
    /**
     * Check if user is manager, admin, or super admin
     * @returns {boolean}
     */
    const isManager = () => {
        return hasAnyRole(['manager', 'admin', 'super-admin']);
    };
    
    return {
        // Permission checks
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        
        // Role checks
        hasRole,
        hasAnyRole,
        isSuperAdmin,
        isAdmin,
        isManager,
        
        // Raw data
        permissions: auth.permissions || [],
        role: auth.role,
        roles: auth.roles || [],
        user: auth.user,
    };
};

export default usePermission;
