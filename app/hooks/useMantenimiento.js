/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useMantenimiento.js                                     */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMantenimiento() {
    const [mantenimientos, setMantenimientos] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [gasolina, setGasolina] = useState([]);
    const [historialUso, setHistorialUso] = useState([]); // Historial de trazabilidad
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: mantData } = await supabase.from('vehiculos_mantenimiento').select('*, vehiculo:vehiculo_id (marca, modelo, placas)').order('created_at', { ascending: false });
            
            // Traemos el inventario CON sus respectivos lotes de compra
            const { data: invData } = await supabase.from('vehiculos_inventario').select(`
                *,
                lotes:vehiculos_inventario_lotes(*)
            `).order('categoria', { ascending: true }).order('nombre', { ascending: true });

            const { data: gasData } = await supabase.from('vehiculos_gasolina').select('*, vehiculo:vehiculo_id (marca, modelo, placas)').order('created_at', { ascending: false });

            // Traemos el registro exacto de en qué auto se usó cada refacción
            const { data: usoData } = await supabase.from('vehiculos_inventario_uso').select(`
                *,
                lote:lote_id (marca, articulo:articulo_id(nombre, categoria)),
                vehiculo:vehiculo_id (marca, modelo, placas)
            `).order('fecha_uso', { ascending: false });

            setMantenimientos(mantData || []);
            setInventario(invData || []);
            setGasolina(gasData || []);
            setHistorialUso(usoData || []);
        } catch (error) {
            console.error("Error al cargar datos del taller:", error);
            alert("No se pudo cargar la información del taller.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

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

    // NUEVO: AGREGAR LOTE (Entrada de Almacén)
    const agregarLote = async (payload) => {
        const { error } = await supabase.from('vehiculos_inventario_lotes').insert([payload]);
        if (!error) {
            const { data: art } = await supabase.from('vehiculos_inventario').select('cantidad').eq('id', payload.articulo_id).single();
            await supabase.from('vehiculos_inventario').update({ cantidad: art.cantidad + parseInt(payload.cantidad_comprada) }).eq('id', payload.articulo_id);
            fetchData();
        }
        return { success: !error, error };
    };

    // NUEVO: REGISTRAR USO DE PIEZA (Salida de Almacén)
    const registrarUsoPieza = async (payload) => {
        const { error } = await supabase.from('vehiculos_inventario_uso').insert([{
            lote_id: payload.lote_id,
            vehiculo_id: payload.vehiculo_id,
            cantidad_usada: payload.cantidad_usada
        }]);
        
        if (!error) {
            const { data: lote } = await supabase.from('vehiculos_inventario_lotes').select('cantidad_disponible, articulo_id').eq('id', payload.lote_id).single();
            await supabase.from('vehiculos_inventario_lotes').update({ cantidad_disponible: lote.cantidad_disponible - payload.cantidad_usada }).eq('id', payload.lote_id);
            
            const { data: art } = await supabase.from('vehiculos_inventario').select('cantidad').eq('id', lote.articulo_id).single();
            await supabase.from('vehiculos_inventario').update({ cantidad: art.cantidad - payload.cantidad_usada }).eq('id', lote.articulo_id);
            
            fetchData();
        }
        return { success: !error, error };
    };

    return { 
        mantenimientos, inventario, gasolina, historialUso, loading, 
        refetch: fetchData, registrarMantenimiento, agregarArticuloInventario, 
        agregarLote, registrarUsoPieza 
    };
}