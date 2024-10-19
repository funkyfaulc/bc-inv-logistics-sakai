// /app/hooks/useAuthRedirect.tsx
'use client'; // Mark as a client component

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { auth } from '../firebase'; // Adjust the import path as needed

export const useAuthRedirect = () => {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                router.push('/auth/login');
            }
        });

        return () => unsubscribe();
    }, [router]);
};