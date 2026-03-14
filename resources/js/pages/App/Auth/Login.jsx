import EmployeeSignIn from '@/components/App/Auth/EmployeeSignIn';
import SignIn from '@/components/App/Auth/SignIn';
import AppAuthLayout from '@/layouts/app/app-auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const Login = ({ routes }) => {
    const [activeTab, setActiveTab] = useState('signin');
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        employee_id: '',
        password: ['', '', '', ''],
    });

    return (
        <>
            <Head title="SignIn" />

            <AppAuthLayout>
                {/* Active Page */}
                {activeTab === 'signin' ? (
                    <SignIn setActiveTab={setActiveTab} data={data} setData={setData} post={post} processing={processing} errors={errors} routes={routes} />
                ) : (
                    <EmployeeSignIn setActiveTab={setActiveTab} data={data} setData={setData} post={post} processing={processing} errors={errors} transform={transform} routes={routes} />
                )}
            </AppAuthLayout>
        </>
    );
};
Login.layout = (page) => page;
export default Login;
