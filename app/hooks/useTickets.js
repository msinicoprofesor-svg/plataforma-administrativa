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

    // LÓGICA PROFESIONAL DE GUARDADO CON AUDITORÍA DE ERRORES
    const moverTicket = async (ticketId, tecnicoId) => {
        const asignado_id = tecnicoId === 'pendientes' ? null : tecnicoId;
        const estado_nuevo = tecnicoId === 'pendientes' ? 'PENDIENTE' : 'EN_RUTA';

        // Intentamos actualizar y obligamos a Supabase a devolver la fila modificada (.select())
        const { data, error } = await supabase
            .from('tickets')
            .update({ tecnico_asignado_id: asignado_id, estado: estado_nuevo })
            .eq('id', ticketId)
            .select(); 
            
        // 1. Si hay error de conexión o sintaxis
        if (error) {
            console.error("[Backend Error] Falla al actualizar Supabase:", error);
            alert(`Error de Base de Datos: ${error.message}`);
            return { error };
        }

        // 2. Si Supabase responde "Éxito" pero no modificó ninguna fila (Clásico error de RLS)
        if (!data || data.length === 0) {
            console.warn("[Seguridad] Supabase bloqueó la actualización (0 filas modificadas). Revisa tus políticas RLS.");
            alert("No se guardó el cambio. Revisa que la tabla 'tickets' tenga habilitada la política RLS para 'UPDATE'.");
            return { error: 'RLS_BLOCKED' };
        }
        
        // 3. Éxito Real
        await fetchTickets();
        return { success: true };
    };

    return { tickets, loading, crearTicket, moverTicket, refetch: fetchTickets };
}