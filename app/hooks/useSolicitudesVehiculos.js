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
            
            // CORRECCIÓN: Usar el nombre real de tu columna en BD
            if (!esEncargado && usuarioId) {
                query = query.eq('usuario_solicitante_id', usuarioId);
            }

            const { data, error } = await query;
            
            if (error) {
                console.error("Detalle del error de BD:", error);
                alert("ERROR AL CARGAR SOLICITUDES: " + error.message);
                throw error;
            }
            
            setSolicitudes(data || []);
        } catch (error) {
            console.error("Error general:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (usuarioId) fetchData();
    }, [usuarioId, esEncargado]);

    const crearSolicitud = async (payload) => {
        const { error } = await supabase.from('vehiculos_solicitudes').insert([payload]);
        if (error) {
            console.error("Error al insertar:", error);
            alert("ERROR AL GUARDAR: " + error.message);
        } else {
            fetchData();
        }
        return { success: !error, error };
    };

    const responderSolicitud = async (id, estado, vehiculoId = null, comentarios = '', usuarioSolicitante = null) => {
        const { error } = await supabase.from('vehiculos_solicitudes').update({
            estado,
            vehiculo_asignado_id: vehiculoId,
            comentarios_admin: comentarios
        }).eq('id', id);
        
        if (error) {
            alert("ERROR AL RESPONDER: " + error.message);
            return { success: false, error };
        }

        if (estado === 'APROBADA' && vehiculoId && usuarioSolicitante) {
            const { error: errVehiculo } = await supabase.from('vehiculos').update({ 
                responsable_id: usuarioSolicitante,
                estado: 'DISPONIBLE'
            }).eq('id', vehiculoId);

            if (errVehiculo) {
                alert("ERROR AL ASIGNAR VEHÍCULO: " + errVehiculo.message);
            }
        }

        fetchData();
        return { success: true, error: null };
    };

    return { solicitudes, loading, crearSolicitud, responderSolicitud, refetch: fetchData };
}