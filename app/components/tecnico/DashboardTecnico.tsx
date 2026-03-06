/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnico/DashboardTecnico.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import VistaMovil from './views/VistaMovil';

// NOTA: Asumimos que el login ya le pasó el ID del técnico a este componente.
// Por ahora le pondremos un ID quemado (Ej. "1") si no recibe nada, para que puedas hacer pruebas.
export default function DashboardTecnico({ tecnicoId = "1" }) {
    // Por defecto asumimos que es celular para que cargue rápido
    const [isMobile, setIsMobile] = useState(true); 

    useEffect(() => {
        // Función que mide la pantalla
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768); // Menos de 768px se considera celular
        };
        
        // Chequeo inicial
        checkScreenSize();
        
        // Escuchamos si el usuario voltea el celular o cambia el tamaño de la ventana
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Si es celular, cargamos la App Móvil
    if (isMobile) {
        return <VistaMovil tecnicoId={tecnicoId} />;
    }

    // Si es computadora, le mostramos un aviso (o a futuro, la VistaEscritorio)
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