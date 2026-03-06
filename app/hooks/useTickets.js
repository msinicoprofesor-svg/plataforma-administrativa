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
                fecha_agendada: t.fecha_agendada || new Date().toISOString().split('T')[0], 
                horario_preferencia: t.horario_preferencia || 'Lo antes posible',
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

    const moverTicket = async (ticketId, tecnicoId, fechaDestino = null) => {
        const asignado_id = tecnicoId === 'pendientes' ? null : tecnicoId;
        const estado_nuevo = tecnicoId === 'pendientes' ? 'PENDIENTE' : 'EN_RUTA';

        const payload = { tecnico_asignado_id: asignado_id, estado: estado_nuevo };
        if (fechaDestino) payload.fecha_agendada = fechaDestino; 

        const { data, error } = await supabase
            .from('tickets')
            .update(payload)
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

    const reprogramarTicket = async (ticketId, nuevaFecha) => {
        const { error } = await supabase
            .from('tickets')
            .update({ fecha_agendada: nuevaFecha }) 
            .eq('id', ticketId);
            
        if (error) {
            console.error("Error al posponer:", error);
            alert("Hubo un error al posponer el ticket.");
            return { error };
        }
        
        await fetchTickets();
        return { success: true };
    };

    // --- NUEVAS FUNCIONES PARA PANEL DE REPORTES ACTIVOS ---

    const cambiarEstadoTicket = async (ticketId, nuevoEstado) => {
        const { error } = await supabase
            .from('tickets')
            .update({ estado: nuevoEstado })
            .eq('id', ticketId);
            
        if (error) {
            console.error("Error al cambiar estado:", error);
            alert("Hubo un error al actualizar el estado del reporte.");
            return { error };
        }
        
        await fetchTickets();
        return { success: true };
    };

    const enviarAPapelera = async (ticketId) => {
        const { error } = await supabase
            .from('tickets')
            .update({ estado: 'PAPELERA' })
            .eq('id', ticketId);
            
        if (error) {
            console.error("Error al eliminar (enviar a papelera):", error);
            alert("Hubo un error al enviar el reporte a la papelera.");
            return { error };
        }
        
        await fetchTickets();
        return { success: true };
    };

    return { 
        tickets, loading, crearTicket, moverTicket, reprogramarTicket, 
        cambiarEstadoTicket, enviarAPapelera, refetch: fetchTickets 
    };
}