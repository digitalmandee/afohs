import React, { useEffect } from 'react';

const Test = () => {
    useEffect(() => {
        const channel = window.Echo.channel('orders');

        console.log('Subscribing to channel');

        channel.listen('.order.created', (e) => {
            console.log('Received new order:', e);
            // your logic here
        });

        // Connection status listeners
        window.Echo.connector.pusher.connection.bind('connected', () => {
            console.log('Connected to Pusher');
        });

        window.Echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('Disconnected from Pusher');
        });

        return () => {
            window.Echo.leaveChannel('orders');
        };
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <div>Ordre Creaed</div>
        </div>
    );
};

export default Test;
