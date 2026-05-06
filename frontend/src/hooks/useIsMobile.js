import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current device is mobile based on screen width.
 * Uses a threshold of 768px (standard md breakpoint).
 */
export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
};
