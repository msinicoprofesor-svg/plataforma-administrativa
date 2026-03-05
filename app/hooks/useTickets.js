/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useTickets.js                                           */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                clientes (nombre_completo, regiones(nombre))
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const ticketsFormateados = data.map(t => ({
                id: t.id,
                folio_corto: `TKT-${t.folio_visual}`,
                cliente: t.clientes?.nombre_completo || 'Cliente Eliminado',
                zona: t.clientes?.regiones?.nombre || 'N/A',
                tipo: t.tipo_reporte,
                prioridad: t.prioridad,
                estado: t.estado,
                fecha: new Date(t.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
                // NUEVO: MEMORIA DE CALENDARIO
                fecha_agendada: t.fecha_agendada || new Date().toISOString().split('T')[0], 
                visita: t.requiere_visita,
                asignadoA: t.tecnico_asignado_id || 'pendientes',
                descripcion: t.descripcion
            }));
            setTickets(ticketsFormateados);
        }
        setLoading(false);
    };

    const crearTicket = async (datosTicket) => {
        const { error } = await supabase.from('tickets').insert([datosTicket]);
        if (!error) fetchTickets();
        return { error };
    };

    // LÓGICA DE GUARDADO DE RUTAS
    const moverTicket = async (ticketId, tecnicoId) => {
        const asignado_id = tecnicoId === 'pendientes' ? null : tecnicoId;
        const estado_nuevo = tecnicoId === 'pendientes' ? 'PENDIENTE' : 'EN_RUTA';

        const { data, error } = await supabase
            .from('tickets')
            .update({ tecnico_asignado_id: asignado_id, estado: estado_nuevo })
            .eq('id', ticketId)
            .select(); 
            
        if (error) {
            console.error("[Backend Error] Falla al actualizar Supabase:", error);
            alert(`Error de Base de Datos: ${error.message}`);
            return { error };
        }

        if (!data || data.length === 0) {
            console.warn("[Seguridad] Supabase bloqueó la actualización (0 filas). Revisa políticas RLS.");
            alert("No se guardó el cambio. Revisa que la tabla 'tickets' tenga habilitada la política RLS para 'UPDATE'.");
            return { error: 'RLS_BLOCKED' };
        }
        
        await fetchTickets();
        return { success: true };
    };

    // NUEVA FUNCIÓN: REPROGRAMAR FECHA
    const reprogramarTicket = async (ticketId, nuevaFecha) => {
        const { error } = await supabase
            .from('tickets')
            .update({ fecha_agendada: nuevaFecha }) // Actualiza la fecha de forma persistente
            .eq('id', ticketId);
            
        if (error) {
            console.error("Error al posponer:", error);
            alert("Hubo un error al posponer el ticket.");
            return { error };
        }
        
        await fetchTickets();
        return { success: true };
    };

    return { tickets, loading, crearTicket, moverTicket, reprogramarTicket, refetch: fetchTickets };
}