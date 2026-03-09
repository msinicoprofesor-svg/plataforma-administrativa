/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnico/DashboardTecnico.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import VistaMovil from './views/VistaMovil';

// NUEVO: Recibimos "onOpenMenu" como llave para abrir el Sidebar
export default function DashboardTecnico({ tecnicoId = "1", onOpenMenu }) {
    const [isMobile, setIsMobile] = useState(true); 

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768); 
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    if (isMobile) {
        // PASAMOS LA LLAVE A LA VISTA MÓVIL
        return <VistaMovil tecnicoId={tecnicoId} onOpenMenu={onOpenMenu} />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner">
                📱
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">App Exclusiva para Técnicos</h2>
            <p className="text-sm font-medium text-gray-500 max-w-md">
                Esta interfaz está diseñada y optimizada para ser utilizada en campo a través de un teléfono celular. Por favor, reduce el tamaño de esta ventana o ábrela desde tu dispositivo móvil.
            </p>
        </div>
    );
}