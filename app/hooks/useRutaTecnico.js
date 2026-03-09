/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useRutaTecnico.js                                       */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRutaTecnico(tecnicoId) {
    const [miRuta, setMiRuta] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tecnicoId) {
            fetchMiRuta();
        }
    }, [tecnicoId]);

    const fetchMiRuta = async () => {
        setLoading(true);
        
        const hoy = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                clientes (nombre_completo, telefono, telefono_adicional, direccion, comunidad, coordenadas)
            `)
            .eq('tecnico_asignado_id', tecnicoId)
            .eq('fecha_agendada', hoy)
            .neq('estado', 'RESUELTO')
            .neq('estado', 'CANCELADO')
            .neq('estado', 'PAPELERA')
            .order('orden_ruta', { ascending: true }); // Sigue respetando el orden logístico

        if (!error && data) {
            const rutaFormateada = data.map(t => ({
                id: t.id,
                folio: `TKT-${t.folio_visual}`,
                cliente: t.clientes?.nombre_completo || 'Cliente Desconocido',
                telefonos: [t.clientes?.telefono, t.clientes?.telefono_adicional].filter(Boolean),
                direccion_texto: `${t.clientes?.direccion || ''}, ${t.clientes?.comunidad || ''}`.trim(),
                latitud: t.latitud,
                longitud: t.longitud,
                enlace_maps: t.clientes?.coordenadas || null, // <-- NUEVO: Extraemos el enlace original
                tipo_reporte: t.tipo_reporte,
                prioridad: t.prioridad,
                estado: t.estado,
                horario_preferencia: t.horario_preferencia,
                requiere_material: t.requiere_material,
                descripcion: t.descripcion,
                orden: t.orden_ruta
            }));
            setMiRuta(rutaFormateada);
        } else if (error) {
            console.error("Error al cargar la ruta del técnico:", error);
        }
        
        setLoading(false);
    };

    const actualizarEstadoEnCampo = async (ticketId, nuevoEstado, notas = '') => {
        const payload = { estado: nuevoEstado };
        if (notas) payload.notas_resolucion = notas;

        const { error } = await supabase
            .from('tickets')
            .update(payload)
            .eq('id', ticketId);

        if (!error) {
            await fetchMiRuta(); 
            return { success: true };
        } else {
            alert("Hubo un problema de conexión al actualizar el ticket.");
            return { error };
        }
    };

    return { 
        miRuta, 
        loading, 
        actualizarEstadoEnCampo, 
        refetch: fetchMiRuta 
    };
}