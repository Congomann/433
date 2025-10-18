import React from 'react';
import ServicesPage from './ServicesPage';

// For this version, the "Shop" page will display the same content
// as the "Services" page. This can be expanded in the future.
const ShopPage: React.FC = () => {
    return <ServicesPage />;
};

export default ShopPage;
