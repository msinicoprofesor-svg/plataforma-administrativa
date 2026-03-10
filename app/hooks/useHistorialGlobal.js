/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useHistorialGlobal.js                                   */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useHistorialGlobal() {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistorial = async () => {
        setLoading(true);
        try {
            // Hacemos un "JOIN" nativo con Supabase para traer los datos del vehículo
            // sin tener que duplicarlos en la base de datos.
            const { data, error } = await supabase
                .from('vehiculos_bitacora')
                .select(`
                    *,
                    vehiculo:vehiculo_id (
                        marca,
                        modelo,
                        placas,
                        tipo_vehiculo
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (data) {
                setHistorial(data);
            }
        } catch (error) {
            console.error("Error al cargar historial global:", error);
            alert("No se pudo cargar el historial de auditoría.");
        } finally {
            setLoading(false);
        }
    };

    // Cargamos el historial automáticamente al invocar el hook
    useEffect(() => {
        fetchHistorial();
    }, []);

    return { historial, loading, refetchHistorial: fetchHistorial };
}