/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        {
            label: 'Pages',
            icon: 'pi pi-fw pi-briefcase',
            to: '/pages',
            items: [
                {
                    label: 'Products',
                    icon: 'pi pi-fw pi-box',
                    to: '/products'
                },
                {
                    label: 'Orders',
                    icon: 'pi pi-fw pi-truck',
                    to: '/orders'
                },

                {
                    label: 'EOM Inventory',
                    icon: 'pi pi-fw pi-chart-line',
                    to: '/reporting/'
                }
            ]
        }
    ];

    console.log('Raw Menu Model:', model);

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model
                    .filter((item) => {
                        if (!item || !item.label) {
                            console.warn('Invalid menu item detected:', item);
                            return false; // Exclude invalid items
                        }
                        return true; // Valid items
                    })
                    .map((item, i) => (
                        <AppMenuitem item={item} root={true} index={i} key={item.label || `item-${i}`} />
                    ))}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
