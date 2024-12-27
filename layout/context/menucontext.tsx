import React, { useState, createContext, useEffect } from 'react';
import { ChildContainerProps, MenuContextProps } from '@/types';

export const MenuContext = createContext<MenuContextProps>({
    activeMenu: null,
    setActiveMenu: () => {}
});

export const MenuProvider = ({ children }: ChildContainerProps) => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const value = {
        activeMenu,
        setActiveMenu
    };

    if (!isClient) {
        return null;
    }

    return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};
