/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useMantenimiento.js                                     */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMantenimiento() {
    const [mantenimientos, setMantenimientos] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Traer historial de mantenimientos con los datos del vehículo (JOIN)
            const { data: mantData, error: mantError } = await supabase
                .from('vehiculos_mantenimiento')
                .select(`
                    *,
                    vehiculo:vehiculo_id (marca, modelo, placas)
                `)
                .order('created_at', { ascending: false });

            if (mantError) throw mantError;

            // 2. Traer el inventario del taller
            const { data: invData, error: invError } = await supabase
                .from('vehiculos_inventario')
                .select('*')
                .order('categoria', { ascending: true })
                .order('nombre', { ascending: true });

            if (invError) throw invError;

            setMantenimientos(mantData || []);
            setInventario(invData || []);
        } catch (error) {
            console.error("Error al cargar datos del taller:", error);
            alert("No se pudo cargar la información del taller.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Funciones de mutación
    const registrarMantenimiento = async (payload) => {
        const { error } = await supabase.from('vehiculos_mantenimiento').insert([payload]);
        if (!error) fetchData(); // Recargar datos si fue exitoso
        return { success: !error, error };
    };

    const agregarArticuloInventario = async (payload) => {
        const { error } = await supabase.from('vehiculos_inventario').insert([payload]);
        if (!error) fetchData();
        return { success: !error, error };
    };

    const actualizarCantidadInventario = async (id, nuevaCantidad) => {
        const { error } = await supabase.from('vehiculos_inventario').update({ cantidad: nuevaCantidad }).eq('id', id);
        if (!error) fetchData();
        return { success: !error, error };
    };

    return { 
        mantenimientos, 
        inventario, 
        loading, 
        refetch: fetchData, 
        registrarMantenimiento, 
        agregarArticuloInventario, 
        actualizarCantidadInventario 
    };
}