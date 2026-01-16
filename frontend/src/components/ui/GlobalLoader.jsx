import React from 'react';
import { useLoader } from '@/contexts/LoaderContext';
import { Loader2 } from 'lucide-react';

export const GlobalLoader = () => {
    const { isLoading } = useLoader();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
};
