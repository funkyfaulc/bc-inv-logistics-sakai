'use client';
import React, { useEffect, useContext, Suspense } from 'react';
import { Ripple } from 'primereact/ripple';
import { classNames } from 'primereact/utils';
import { CSSTransition } from 'react-transition-group';
import { MenuContext } from './context/menucontext';
import { AppMenuItemProps } from '@/types';
import { usePathname, useSearchParams } from 'next/navigation';

const AppMenuitem = (props: AppMenuItemProps) => {
    return (
        <Suspense fallback={<div>Loading Menu...</div>}>
            <ActualMenuitem {...props} />
        </Suspense>
    );
};

const ActualMenuitem = (props: AppMenuItemProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { activeMenu, setActiveMenu } = useContext(MenuContext);

    const item = props.item;
    if (!item) {
        console.warn('Menu item is undefined or null', props);
        return null;
    }

    const key = props.parentKey ? `${props.parentKey}-${props.index}` : String(props.index);
    const active = activeMenu === key || (key && activeMenu?.startsWith(key));
    const isActiveRoute = item.to ? pathname === item.to : false;

    const itemClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (item.disabled) {
            event.preventDefault();
            return;
        }
        if (item.command) {
            item.command({ originalEvent: event, item });
        }
        setActiveMenu(active ? null : key);
    };

    const subMenu = item.items && (
        <CSSTransition
            timeout={{ enter: 1000, exit: 450 }}
            classNames="layout-submenu"
            in={Boolean(props.root || active)}
            key={item.label || 'unknown'}
        >
            <ul>
                {item.items.map((child, i) => {
                    if (!child || !child.label) {
                        console.warn('Invalid nested menu item:', child);
                        return null; // Skip invalid nested items
                    }
                    return <AppMenuitem item={child} index={i} parentKey={key} key={child.label || `child-${i}`} />;
                })}
            </ul>
        </CSSTransition>
    );

    return (
        <li className={classNames({ 'layout-root-menuitem': props.root, 'active-menuitem': active })}>
            <a href={item.to || '#'} onClick={(e) => itemClick(e)} className="p-ripple">
                {item.icon && <i className={classNames('layout-menuitem-icon', item.icon)} />}
                <span>{item.label || ''}</span>
                {item.items && <i className="pi pi-fw pi-angle-down layout-submenu-toggler"></i>}
                <Ripple />
            </a>
            {subMenu}
        </li>
    );
};

export default AppMenuitem;