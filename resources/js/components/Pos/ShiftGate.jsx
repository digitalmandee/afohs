import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StartShiftModal from './StartShiftModal';
import { routeNameForContext } from '@/lib/utils';

/**
 * A wrapper component that enforces an active POS shift.
 * If no shift is active, it blocks the children and shows the StartShiftModal.
 * Once a shift is active, it renders the children.
 */
const ShiftGate = ({ children }) => {
    const [hasShift, setHasShift] = useState(false);
    // Determine initial check state: we don't know yet, so maybe loading?
    // But to keep it simple, we default to "false" and check immediately.
    // If we want to avoid a flash of modal, we might need a "loading" state.
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const checkShift = async () => {
            try {
                // We use the existing status endpoint
                const response = await axios.get(route(routeNameForContext('pos-shifts.status')));
                if (response.data.has_active_shift) {
                    setHasShift(true);
                    setModalOpen(false);
                } else {
                    setHasShift(false);
                    setModalOpen(true);
                }
            } catch (error) {
                console.error('Failed to check shift status', error);
                // If check fails, defaulting to blocking is safer
                setHasShift(false);
                setModalOpen(true);
            } finally {
                setLoading(false);
            }
        };

        checkShift();
    }, []);

    const handleShiftSuccess = (shift) => {
        setHasShift(true);
        setModalOpen(false);
        // We don't necessarily need to reload, just unblock the UI
    };

    // While loading, we can show a spinner or nothing.
    // Showing nothing might be better than a partial UI that gets blocked.
    if (loading) {
        return <div className="p-4 text-center">Checking shift status...</div>;
    }

    // If we have a shift, render children transparently
    if (hasShift) {
        return <>{children}</>;
    }

    // If no shift, show the modal.
    // Note: We effectively "block" the underlying UI by NOT rendering children
    // OR we render children but covered by the modal (if modal is blockage enough).
    // The user requested "blocking", so not rendering children is safer to prevent interaction.
    // However, if the page structure depends on the layout (like SideNav), we might want to render layout?
    // But this component wraps the critical content.
    return (
        <>
            <StartShiftModal open={modalOpen} onSuccess={handleShiftSuccess} />
            {/* Optionally render blocked content with blur or hidden, or just a placeholder */}
            <div style={{ opacity: 0.1, pointerEvents: 'none', height: '100vh', overflow: 'hidden' }}>{children}</div>
        </>
    );
};

export default ShiftGate;
