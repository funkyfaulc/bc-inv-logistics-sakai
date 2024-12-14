// /app/(full-page)/layout.tsx
'use client';

import AppConfig from '../../layout/AppConfig';
import React from 'react';
import { useAuthRedirect } from '../hooks/useAuthRedirect'; // Import the redirect hook

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    useAuthRedirect(); // Use the hook to handle authentication and redirection

    return (
        <React.Fragment>
            {children}
            <AppConfig simple />
        </React.Fragment>
    );
}
