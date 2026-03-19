/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useSolicitudesVehiculos.js                              */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSolicitudesVehiculos(usuarioId, esEncargado) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('vehiculos_solicitudes')
                .select('*, vehiculo:vehiculo_asignado_id(marca, modelo, placas)')
                .order('created_at', { ascending: false });
            
            // Si no es admin, solo traemos SUS solicitudes
            if (!esEncargado && usuarioId) {
                query = query.eq('usuario_id', usuarioId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setSolicitudes(data || []);
        } catch (error) {
            console.error("Error al cargar solicitudes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (usuarioId) fetchData();
    }, [usuarioId, esEncargado]);

    const crearSolicitud = async (payload) => {
        const { error } = await supabase.from('vehiculos_solicitudes').insert([payload]);
        if (!error) fetchData();
        return { success: !error, error };
    };

    const responderSolicitud = async (id, estado, vehiculoId = null, comentarios = '', usuarioSolicitante = null) => {
        // 1. Actualizar el estado de la solicitud
        const { error } = await supabase.from('vehiculos_solicitudes').update({
            estado,
            vehiculo_asignado_id: vehiculoId,
            comentarios_admin: comentarios
        }).eq('id', id);
        
        // 2. Si se aprueba, hacer la asignación real en la tabla de vehículos
        if (!error && estado === 'APROBADA' && vehiculoId && usuarioSolicitante) {
            await supabase.from('vehiculos').update({ 
                responsable_id: usuarioSolicitante,
                estado: 'DISPONIBLE' // Lo ponemos disponible para que el usuario haga su checklist
            }).eq('id', vehiculoId);
        }

        if (!error) fetchData();
        return { success: !error, error };
    };

    return { solicitudes, loading, crearSolicitud, responderSolicitud, refetch: fetchData };
}