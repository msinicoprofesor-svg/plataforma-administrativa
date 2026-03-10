/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/VisorImagen.tsx                          */
/* -------------------------------------------------------------------------- */
'use client';
import { useEffect } from 'react';
import { MdClose } from 'react-icons/md';

export default function VisorImagen({ imageUrl, onClose }) {
    // Accesibilidad: Cerrar con la tecla Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
            onClick={onClose}
        >
            {/* Botón de Cerrar Flotante (Estilo Glassmorphism) */}
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-lg transition-colors border border-white/20 z-10 shadow-lg"
                title="Cerrar (Esc)"
            >
                <MdClose className="text-2xl" />
            </button>

            {/* Contenedor de la Imagen */}
            <div 
                className="relative flex justify-center items-center cursor-auto animate-scale-pop"
                onClick={(e) => e.stopPropagation()} // Evita cerrar si hacen clic sobre la foto misma
            >
                <img 
                    src={imageUrl} 
                    alt="Evidencia Ampliada" 
                    className="max-w-[95vw] max-h-[85vh] md:max-w-[85vw] md:max-h-[90vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                />
            </div>
        </div>
    );
}