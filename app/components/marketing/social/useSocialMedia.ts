/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/social/useSocialMedia.ts                 */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';

// 1. ACTUALIZACIÓN DE MARCAS
export const MARCAS = ['DMG NET', 'Intercheap', 'Fibrox MX', 'WifiCel', 'RK', 'Fundación Frenxo', 'Javak'];

// 2. ACTUALIZACIÓN DE REDES (Sin LinkedIn)
export const REDES = [
    { id: 'FACEBOOK', label: 'Facebook', color: 'bg-blue-600' },
    { id: 'INSTAGRAM', label: 'Instagram', color: 'bg-pink-600' },
    { id: 'TIKTOK', label: 'TikTok', color: 'bg-black' },
    { id: 'YOUTUBE', label: 'YouTube', color: 'bg-red-600' }
];

// Datos de prueba iniciales (Ajustados a las nuevas marcas y con campo imagen)
const DATOS_INICIALES = [
    { 
        id: '1', 
        titulo: 'Promo San Valentín', 
        marca: 'WifiCel', 
        red: 'FACEBOOK', 
        tipo: 'IMAGEN', 
        fecha: new Date().toISOString().split('T')[0], 
        estado: 'PROGRAMADO', 
        objetivo: 'Ventas', 
        imagen: null // Campo nuevo para el Paso 2
    },
    { 
        id: '2', 
        titulo: 'Reel Instalación', 
        marca: 'DMG NET', 
        red: 'INSTAGRAM', 
        tipo: 'REEL', 
        fecha: new Date().toISOString().split('T')[0], 
        estado: 'DISENO', 
        objetivo: 'Branding', 
        imagen: null 
    },
];

export function useSocialMedia() {
    // Intentamos leer de localStorage, si no hay, usamos datos iniciales
    const [posts, setPosts] = useState(() => {
        if (typeof window !== 'undefined') {
            const guardado = localStorage.getItem('social_posts');
            return guardado ? JSON.parse(guardado) : DATOS_INICIALES;
        }
        return DATOS_INICIALES;
    });

    // Guardar en localStorage cada vez que cambian los posts
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('social_posts', JSON.stringify(posts));
        }
    }, [posts]);

    const agregarPost = (post) => {
        const nuevo = { ...post, id: Date.now().toString(), estado: 'IDEA' };
        setPosts([...posts, nuevo]);
    };

    const actualizarPost = (postActualizado) => {
        setPosts(posts.map(p => p.id === postActualizado.id ? postActualizado : p));
    };

    const eliminarPost = (id) => {
        if(confirm('¿Eliminar esta publicación?')) {
            setPosts(posts.filter(p => p.id !== id));
        }
    };

    const moverPost = (id, nuevaFecha, nuevoEstado) => {
        setPosts(posts.map(p => {
            if (p.id === id) {
                return { 
                    ...p, 
                    fecha: nuevaFecha || p.fecha, 
                    estado: nuevoEstado || p.estado 
                };
            }
            return p;
        }));
    };

    return {
        posts,
        agregarPost,
        actualizarPost,
        eliminarPost,
        moverPost
    };
}