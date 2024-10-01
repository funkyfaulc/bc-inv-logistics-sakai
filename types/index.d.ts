// bc-inv-logistics-sakai/types/index.d.ts

import React from 'react'; // Add this line to import React
import { Order, Shipment, ShipmentItem, EventItem } from './orders';

// Existing imports
import { 
    Page,
    AppBreadcrumbProps,
    Breadcrumb,
    BreadcrumbItem,
    MenuProps,
    MenuModel,
    AppSubMenuProps,
    LayoutConfig,
    LayoutState,
    AppBreadcrumbState,
    Breadcrumb as BreadcrumbAlias,
    LayoutContextProps,
    MailContextProps,
    MenuContextProps,
    ChatContextProps,
    TaskContextProps,
    AppConfigProps,
    NodeRef,
    AppTopbarRef,
    MenuModelItem,
    AppMenuItemProps,
    AppMenuItem
} from './layout';

import { 
    Demo, 
    LayoutType, 
    SortOrderType, 
    CustomEvent, 
    ChartDataState, 
    ChartOptionsState, 
    AppMailSidebarItem, 
    AppMailReplyProps, 
    AppMailProps 
} from './demo';

type ChildContainerProps = {
    children: React.ReactNode;
};

// Export existing types
export type {
    Page,
    AppBreadcrumbProps,
    Breadcrumb,
    BreadcrumbItem,
    MenuProps,
    MenuModel,
    LayoutConfig,
    LayoutState,
    BreadcrumbAlias as Breadcrumb,
    LayoutContextProps,
    MailContextProps,
    MenuContextProps,
    ChatContextProps,
    TaskContextProps,
    AppConfigProps,
    NodeRef,
    AppTopbarRef,
    AppMenuItemProps,
    ChildContainerProps,
    Demo,
    LayoutType,
    SortOrderType,
    CustomEvent,
    ChartDataState,
    ChartOptionsState,
    AppMailSidebarItem,
    AppMailReplyProps,
    AppMailProps,
    AppMenuItem,
    // Export new types
    Order,
    Shipment,
    ShipmentItem,
    EventItem
};