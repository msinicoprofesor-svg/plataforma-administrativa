/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useSolicitudesContenido.js (FECHAS CORREGIDAS)          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSolicitudesContenido() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const mapFromDB = (db) => ({
      id: db.id,
      fechaCreacion: db.fecha_creacion,
      horaCreacion: db.hora_creacion,
      usuarioId: db.usuario_id,
      email: db.email,
      categoria: db.categoria,
      tipoMaterial: db.tipo_material,
      estado: db.estado,
      solicitante: db.solicitante || {},
      especificaciones: db.especificaciones || {},
      gestion: db.gestion || {},
      bitacora: db.bitacora || []
  });

  const mapToDB = (sol) => ({
      id: sol.id,
      fecha_creacion: sol.fechaCreacion || null,
      hora_creacion: sol.horaCreacion || null,
      usuario_id: sol.usuarioId || null,
      email: sol.email || null,
      categoria: sol.categoria || null,
      tipo_material: sol.tipoMaterial || null,
      estado: sol.estado || 'PENDIENTE',
      solicitante: sol.solicitante ? JSON.parse(JSON.stringify(sol.solicitante)) : {},
      especificaciones: sol.especificaciones ? JSON.parse(JSON.stringify(sol.especificaciones)) : {},
      gestion: sol.gestion ? JSON.parse(JSON.stringify(sol.gestion)) : {},
      bitacora: sol.bitacora ? JSON.parse(JSON.stringify(sol.bitacora)) : []
  });

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const { data, error } = await supabase
            .from('solicitudes_contenido')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        if (data) setSolicitudes(data.map(mapFromDB));
      } catch (e) {
        console.error("Error cargando solicitudes desde BD:", e);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const crearSolicitud = async (datosFormulario, usuarioSolicitante) => {
    if (!usuarioSolicitante) {
        alert("Error: No se detectó al usuario solicitante");
        return false;
    }

    const hoy = new Date(); // Obtenemos la fecha actual
    
    const nuevaSolicitud = {
      id: `SOL-${Date.now()}`,
      // USAMOS EL FORMATO UNIVERSAL (YYYY-MM-DD) Y (HH:MM:SS) PARA EVITAR ERRORES DE IDIOMA
      fechaCreacion: hoy.toISOString().split('T')[0], 
      horaCreacion: hoy.toTimeString().split(' ')[0], 
      
      usuarioId: usuarioSolicitante.id || 'N/A', 
      email: usuarioSolicitante.email || 'N/A',
      
      solicitante: {
        id: usuarioSolicitante.id || 'N/A',
        nombre: usuarioSolicitante.nombre || 'Desconocido',
        rol: usuarioSolicitante.rol || 'N/A',
        area: usuarioSolicitante.departamento || usuarioSolicitante.area || 'General' 
      },

      categoria: datosFormulario.categoria || 'N/A',
      tipoMaterial: datosFormulario.tipoMaterial || 'N/A',
      especificaciones: {
        dimensiones: datosFormulario.dimensiones || '',
        cantidad: datosFormulario.cantidad || 1,
        descripcion: datosFormulario.descripcion || '',
        referencia: datosFormulario.referencia || null,
        folioNotas: datosFormulario.folioNotas || ''
      },

      estado: 'PENDIENTE', 
      
      gestion: {
        costo: 0,
        fechaEntregaEstimada: '',
        linkDisenoFinal: '',
        comentariosInternos: ''
      },

      bitacora: [{ fecha: hoy.toISOString(), mensaje: 'Solicitud creada', usuario: usuarioSolicitante.nombre || 'Sistema' }]
    };

    setSolicitudes(prev => [nuevaSolicitud, ...prev]);

    try {
        const payload = mapToDB(nuevaSolicitud);
        const { error } = await supabase.from('solicitudes_contenido').insert([payload]);
        
        if (error) {
            console.error("ERROR SUPABASE DETALLADO:", JSON.stringify(error, null, 2));
            alert(`Error al guardar en BD:\n${error.message}`);
            setSolicitudes(prev => prev.filter(s => s.id !== nuevaSolicitud.id));
            return false;
        }
        return true;
    } catch (error) {
        alert("Error de conexión: " + error.message);
        return false;
    }
  };

  const actualizarSolicitud = async (idSolicitud, nuevosDatosGestion, nuevoEstado, usuarioAutor) => {
    let solicitudActualizada = null;

    setSolicitudes(prev => prev.map(sol => {
      if (sol.id === idSolicitud) {
        const cambioEstado = sol.estado !== nuevoEstado;
        const nuevaBitacora = [...sol.bitacora];
        
        if (cambioEstado) {
          nuevaBitacora.unshift({
            fecha: new Date().toISOString(),
            mensaje: `Estado cambiado a: ${nuevoEstado}`,
            usuario: usuarioAutor?.nombre || 'Sistema'
          });
        }

        solicitudActualizada = {
          ...sol,
          estado: nuevoEstado,
          gestion: { ...sol.gestion, ...nuevosDatosGestion },
          bitacora: nuevaBitacora
        };
        return solicitudActualizada;
      }
      return sol;
    }));

    if (solicitudActualizada) {
        await supabase.from('solicitudes_contenido')
            .update({ 
                estado: solicitudActualizada.estado,
                gestion: solicitudActualizada.gestion,
                bitacora: solicitudActualizada.bitacora
            }).eq('id', idSolicitud);
    }
  };

  const cancelarSolicitud = async (idSolicitud, usuarioAutor) => {
    let solicitudCancelada = null;

    setSolicitudes(prev => prev.map(sol => {
      if (sol.id === idSolicitud) {
        const esCancelable = ['PENDIENTE', 'EN_PROCESO', 'EN_DISENO'].includes(sol.estado);
        if (esCancelable) {
            solicitudCancelada = {
                ...sol,
                estado: 'CANCELADO',
                bitacora: [
                    { fecha: new Date().toISOString(), mensaje: 'Solicitud cancelada por el usuario', usuario: usuarioAutor?.nombre || 'Usuario' },
                    ...sol.bitacora
                ]
            };
            return solicitudCancelada;
        }
      }
      return sol;
    }));

    if (solicitudCancelada) {
        await supabase.from('solicitudes_contenido')
            .update({ 
                estado: solicitudCancelada.estado,
                bitacora: solicitudCancelada.bitacora
            }).eq('id', idSolicitud);
    }
  };

  const eliminarSolicitud = async (idSolicitud) => {
    setSolicitudes(prev => prev.filter(s => s.id !== idSolicitud));
    await supabase.from('solicitudes_contenido').delete().eq('id', idSolicitud);
  };

  return { solicitudes, cargando, crearSolicitud, actualizarSolicitud, cancelarSolicitud, eliminarSolicitud };
}