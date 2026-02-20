/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useIncidencias.js (MIGRADO A SUPABASE + JSON DETALLES)  */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useIncidencias = () => {
    const [incidencias, setIncidencias] = useState([]);
    const [cargando, setCargando] = useState(true);

    // --- MAPERS: Traductores Híbridos (Columnas + JSON) ---
    const mapFromDB = (db) => {
        // Recuperamos la info compleja del JSON o usamos valores por defecto
        const detalles = db.detalles || {};
        
        return {
            id: db.id,
            colaboradorId: db.colaborador_id,
            nombreColaborador: db.nombre_colaborador,
            tipo: db.tipo,
            estado: db.estado,
            
            // Datos Planos (Compatibilidad)
            fechaInicio: db.fecha_inicio,
            fechaFin: db.fecha_fin,
            dias: db.dias,
            goceSueldo: db.goce_sueldo,
            motivo: db.motivo,
            fechaRegistro: db.fecha_registro,

            // Datos Complejos (Recuperados del JSON)
            unidadMedida: detalles.unidadMedida || 'DIAS',
            tiempoPorTiempo: detalles.tiempoPorTiempo || false,
            sinGoce: detalles.sinGoce || !db.goce_sueldo,
            fechas: detalles.fechas || [db.fecha_inicio], // Array de días seleccionados
            cantidad: detalles.cantidad || db.dias,
            detalleHoras: detalles.detalleHoras || null,
            registradoPor: detalles.registradoPor || 'Sistema'
        };
    };

    const mapToDB = (inc) => {
        // Calculamos fechas inicio/fin para consultas SQL rápidas
        let fecha_inicio = null;
        let fecha_fin = null;

        if (inc.fechas && inc.fechas.length > 0) {
            // Ordenamos fechas para encontrar rango
            const fechasOrdenadas = [...inc.fechas].sort();
            fecha_inicio = fechasOrdenadas[0];
            fecha_fin = fechasOrdenadas[fechasOrdenadas.length - 1];
        }

        return {
            id: inc.id,
            colaborador_id: inc.colaboradorId,
            nombre_colaborador: inc.nombreColaborador,
            tipo: inc.tipo,
            estado: inc.estado || 'PENDIENTE',
            
            // Columnas Clave para Filtros
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin,
            dias: Number(inc.cantidad) || 0,
            goce_sueldo: inc.goceSueldo,
            motivo: inc.motivo,
            fecha_registro: inc.fechaRegistro || new Date().toISOString(),

            // AQUÍ GUARDAMOS TODO EL OBJETO COMPLEJO
            detalles: {
                unidadMedida: inc.unidadMedida,
                tiempoPorTiempo: inc.tiempoPorTiempo,
                sinGoce: inc.sinGoce,
                fechas: inc.fechas,
                cantidad: inc.cantidad,
                detalleHoras: inc.detalleHoras,
                registradoPor: inc.registradoPor,
                historialAprobacion: inc.historialAprobacion
            }
        };
    };

    // --- CARGA INICIAL ---
    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            try {
                const { data, error } = await supabase
                    .from('incidencias')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) setIncidencias(data.map(mapFromDB));
            } catch (error) {
                console.error("Error cargando incidencias:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    // --- ACCIONES CRUD ---

    const registrarIncidencia = async (datos) => {
        const nuevaIncidencia = {
            ...datos,
            id: `INC-${Date.now()}`,
            fechaRegistro: new Date().toISOString()
        };

        // 1. UI Inmediata
        setIncidencias(prev => [nuevaIncidencia, ...prev]);

        // 2. BD Supabase
        try {
            const { error } = await supabase
                .from('incidencias')
                .insert([mapToDB(nuevaIncidencia)]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error al registrar incidencia:", error);
            // Opcional: Revertir estado si falla
            return false;
        }
    };

    const actualizarEstado = async (id, nuevoEstado) => {
        setIncidencias(prev => prev.map(inc => 
            inc.id === id ? { ...inc, estado: nuevoEstado } : inc
        ));

        try {
            const { error } = await supabase
                .from('incidencias')
                .update({ estado: nuevoEstado })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error("Error actualizando estado:", error);
        }
    };

    const eliminarIncidencia = async (id) => {
        if (confirm('¿Estás seguro de eliminar este registro?')) {
            setIncidencias(prev => prev.filter(i => i.id !== id));
            try {
                await supabase.from('incidencias').delete().eq('id', id);
            } catch (error) {
                console.error("Error eliminando:", error);
            }
        }
    };

    const obtenerIncidenciasPorMes = (mes, anio) => {
        return incidencias.filter(inc => {
            if (!inc.fechaInicio) return false;
            const fecha = new Date(inc.fechaInicio);
            return fecha.getMonth() === mes && fecha.getFullYear() === anio;
        });
    };

    return {
        incidencias,
        cargando,
        registrarIncidencia,
        actualizarEstado,
        eliminarIncidencia,
        obtenerIncidenciasPorMes
    };
};