import { Head } from '@inertiajs/react';
import CreateTransaction from '@/components/App/Transactions/Create';

export default function TransactionCreate({ subscriptionTypes = [], subscriptionCategories = [], membershipCharges = [], maintenanceCharges = [], subscriptionCharges = [], otherCharges = [], financialChargeTypes = [], invoice = null }) {
    return (
        <>
            <Head title="Create Transaction" />

            <div
                style={{
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                }}
            >
                <CreateTransaction subscriptionTypes={subscriptionTypes} subscriptionCategories={subscriptionCategories} allowedFeeTypes={['subscription_fee']} membershipCharges={membershipCharges} maintenanceCharges={maintenanceCharges} subscriptionCharges={subscriptionCharges} otherCharges={otherCharges} financialChargeTypes={financialChargeTypes} invoice={invoice} />
            </div>
        </>
    );
}
