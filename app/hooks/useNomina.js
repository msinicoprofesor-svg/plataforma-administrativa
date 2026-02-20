/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useNomina.js (NUEVO CEREBRO CONECTADO A SUPABASE)       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useNomina() {
    const [historialNominas, setHistorialNominas] = useState([]);
    const [variables, setVariables] = useState({}); // Retardos, Comedor, etc.
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // --- MAPERS ---
    const mapNominaFromDB = (db) => ({
        id: db.id,
        fechaCierre: db.fecha_cierre,
        periodo: db.periodo,
        total: parseFloat(db.total),
        empleadosCount: db.empleados_count,
        detalles: db.detalles || [],
        estado: db.estado
    });

    const mapNominaToDB = (nom) => ({
        id: nom.id,
        fecha_cierre: nom.fechaCierre,
        periodo: nom.periodo,
        periodo_inicio: nom.periodoInicio, // Fechas separadas para filtros futuros
        periodo_fin: nom.periodoFin,
        total: nom.total,
        empleados_count: nom.empleadosCount,
        detalles: JSON.parse(JSON.stringify(nom.detalles)), // Sanitizar
        estado: 'CERRADA'
    });

    // --- 1. CARGA INICIAL (Historial + Borrador) ---
    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            try {
                // A) Cargar Historial
                const { data: hist } = await supabase
                    .from('nominas_historial')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (hist) setHistorialNominas(hist.map(mapNominaFromDB));

                // B) Cargar Borrador (Variables guardadas)
                const { data: borrador } = await supabase
                    .from('nominas_borrador')
                    .select('variables')
                    .eq('id', 'BORRADOR_ACTUAL')
                    .single();
                
                if (borrador && borrador.variables) {
                    setVariables(borrador.variables);
                }

            } catch (error) {
                console.error("Error cargando nómina:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    // --- 2. AUTOGUARDADO DE VARIABLES (Debounce manual) ---
    // Esta función guarda el estado actual en la nube para no perderlo
    const guardarBorradorEnNube = useCallback(async (nuevasVariables) => {
        try {
            await supabase.from('nominas_borrador').upsert({
                id: 'BORRADOR_ACTUAL',
                variables: JSON.parse(JSON.stringify(nuevasVariables)),
                updated_at: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error guardando borrador:", e);
        }
    }, []);

    // Función que usa el Panel para actualizar localmente y disparar el guardado
    const actualizarVariables = (nuevasVariables) => {
        setVariables(nuevasVariables);
        // Guardamos en segundo plano (sin await para no trabar la UI)
        guardarBorradorEnNube(nuevasVariables);
    };

    // --- 3. CERRAR NÓMINA ---
    const cerrarNominaBD = async (nomina) => {
        setGuardando(true);
        try {
            // 1. Guardar en Historial
            const { error } = await supabase.from('nominas_historial').insert([mapNominaToDB(nomina)]);
            if (error) throw error;

            // 2. Limpiar Borrador (Variables)
            await supabase.from('nominas_borrador').update({ variables: {} }).eq('id', 'BORRADOR_ACTUAL');
            
            // 3. Actualizar UI
            setHistorialNominas(prev => [nomina, ...prev]);
            setVariables({}); // Limpiamos local
            
            return true;
        } catch (error) {
            console.error("Error cerrando nómina:", error);
            alert("Error al cerrar nómina: " + error.message);
            return false;
        } finally {
            setGuardando(false);
        }
    };

    const borrarHistorialBD = async (id) => {
        setHistorialNominas(prev => prev.filter(n => n.id !== id));
        await supabase.from('nominas_historial').delete().eq('id', id);
    };

    return {
        historialNominas,
        variables,
        cargando,
        guardando,
        actualizarVariables, // Reemplaza al setVariables directo
        cerrarNominaBD,
        borrarHistorialBD
    };
}