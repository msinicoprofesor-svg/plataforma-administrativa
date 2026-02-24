/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useTickets.js                                           */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

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
            // Traducimos los datos de Supabase a lo que entienden tus tarjetas
            const ticketsFormateados = data.map(t => ({
                id: t.id,
                folio_corto: `TKT-${t.folio_visual}`,
                cliente: t.clientes?.nombre_completo || 'Cliente Eliminado',
                zona: t.clientes?.regiones?.nombre || 'N/A',
                tipo: t.tipo_reporte,
                prioridad: t.prioridad,
                estado: t.estado,
                fecha: new Date(t.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
                visita: t.requiere_visita,
                asignadoA: t.tecnico_asignado_id || 'pendientes', // Para el Drag & Drop
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

    // Esta función es la que usará el Drag & Drop para asignar a un técnico real
    const moverTicket = async (ticketId, tecnicoId) => {
        const asignado_id = tecnicoId === 'pendientes' ? null : tecnicoId;
        const estado_nuevo = tecnicoId === 'pendientes' ? 'PENDIENTE' : 'EN_RUTA';

        const { error } = await supabase
            .from('tickets')
            .update({ tecnico_asignado_id: asignado_id, estado: estado_nuevo })
            .eq('id', ticketId);
            
        if (!error) fetchTickets();
    };

    return { tickets, loading, crearTicket, moverTicket, refetch: fetchTickets };
}