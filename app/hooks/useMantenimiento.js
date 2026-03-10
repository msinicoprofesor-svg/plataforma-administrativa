/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useMantenimiento.js                                     */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMantenimiento() {
    const [mantenimientos, setMantenimientos] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [gasolina, setGasolina] = useState([]); // <--- NUEVO ESTADO PARA TICKETS
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Traer historial de mantenimientos
            const { data: mantData, error: mantError } = await supabase
                .from('vehiculos_mantenimiento')
                .select('*, vehiculo:vehiculo_id (marca, modelo, placas)')
                .order('created_at', { ascending: false });
            if (mantError) throw mantError;

            // 2. Traer el inventario del taller
            const { data: invData, error: invError } = await supabase
                .from('vehiculos_inventario')
                .select('*')
                .order('categoria', { ascending: true })
                .order('nombre', { ascending: true });
            if (invError) throw invError;

            // 3. Traer el historial de tickets de combustible
            const { data: gasData, error: gasError } = await supabase
                .from('vehiculos_gasolina')
                .select('*, vehiculo:vehiculo_id (marca, modelo, placas)')
                .order('created_at', { ascending: false });
            if (gasError) throw gasError;

            setMantenimientos(mantData || []);
            setInventario(invData || []);
            setGasolina(gasData || []);
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

    const registrarMantenimiento = async (payload) => {
        const { error } = await supabase.from('vehiculos_mantenimiento').insert([payload]);
        if (!error) fetchData(); 
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
        gasolina, // <--- EXPORTAMOS LA GASOLINA
        loading, 
        refetch: fetchData, 
        registrarMantenimiento, 
        agregarArticuloInventario, 
        actualizarCantidadInventario 
    };
}