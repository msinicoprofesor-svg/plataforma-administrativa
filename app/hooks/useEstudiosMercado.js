/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useEstudiosMercado.js (MIGRACIÓN FINAL A SUPABASE)      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const KEYS = {
  COLA_OFFLINE: 'market_sync_queue_v2', // Única clave local que conservamos para el modo sin conexión
};

export function useEstudiosMercado() {
  const [encuestas, setEncuestas] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [colaOffline, setColaOffline] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cargando, setCargando] = useState(true);

  // --- TRADUCTORES SEGUROS ---
  const mapPlantillaToDB = (p) => ({
      id: p.id, titulo: p.titulo, descripcion: p.descripcion, fecha_creacion: p.fechaCreacion,
      preguntas: p.preguntas ? JSON.parse(JSON.stringify(p.preguntas)) : []
  });

  const mapEncuestaToDB = (e) => ({
      id: e.id, titulo: e.titulo, descripcion: e.descripcion, estado: e.estado,
      fecha_creacion: e.fechaCreacion, creador: e.creador,
      ubicacion: e.ubicacion ? JSON.parse(JSON.stringify(e.ubicacion)) : {},
      estrategia: e.estrategia ? JSON.parse(JSON.stringify(e.estrategia)) : {},
      preguntas: e.preguntas ? JSON.parse(JSON.stringify(e.preguntas)) : []
  });

  const mapRespuestaToDB = (r) => ({
      id: r.id, encuesta_id: r.encuestaId,
      datos: r.datos ? JSON.parse(JSON.stringify(r.datos)) : {},
      metadata: r.metadata ? JSON.parse(JSON.stringify(r.metadata)) : {}
  });

  // --- 1. CARGA INICIAL Y MONITOREO DE RED ---
  useEffect(() => {
    const cargarDatosSupabase = async () => {
        setCargando(true);
        try {
            // Cargar las 3 tablas en paralelo
            const [resPlantillas, resEncuestas, resRespuestas] = await Promise.all([
                supabase.from('estudios_plantillas').select('*').order('created_at', { ascending: false }),
                supabase.from('estudios_encuestas').select('*').order('created_at', { ascending: false }),
                supabase.from('estudios_respuestas').select('*').order('created_at', { ascending: false })
            ]);

            if (resPlantillas.data) {
                setPlantillas(resPlantillas.data.map(db => ({
                    id: db.id, titulo: db.titulo, descripcion: db.descripcion, 
                    fechaCreacion: db.fecha_creacion, preguntas: db.preguntas || []
                })));
            }

            if (resEncuestas.data) {
                setEncuestas(resEncuestas.data.map(db => ({
                    id: db.id, titulo: db.titulo, descripcion: db.descripcion, estado: db.estado,
                    fechaCreacion: db.fecha_creacion, creador: db.creador,
                    ubicacion: db.ubicacion || {}, comunidad: db.ubicacion?.comunidad || '',
                    estrategia: db.estrategia || {}, preguntas: db.preguntas || []
                })));
            }

            if (resRespuestas.data) {
                setRespuestas(resRespuestas.data.map(db => ({
                    id: db.id, encuestaId: db.encuesta_id, datos: db.datos || {}, metadata: db.metadata || {}
                })));
            }
        } catch (e) {
            console.error("Error cargando base de datos:", e);
        } finally {
            setCargando(false);
        }
    };

    cargarDatosSupabase();

    // Cargar cola offline almacenada localmente
    const cola = JSON.parse(localStorage.getItem(KEYS.COLA_OFFLINE)) || [];
    setColaOffline(cola);

    // Detectores de Internet
    if (typeof window !== 'undefined') {
      setIsOnline(window.navigator.onLine);
      const handleOnline = () => { setIsOnline(true); intentarSincronizar(); };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const persistirCola = (data) => {
    localStorage.setItem(KEYS.COLA_OFFLINE, JSON.stringify(data));
  };

  // --- 2. GESTIÓN DE PLANTILLAS ---
  const guardarPlantilla = async (titulo, descripcion, preguntas) => {
    const nuevaPlantilla = { id: `TPL-${Date.now()}`, titulo, descripcion, preguntas, fechaCreacion: new Date().toISOString() };
    setPlantillas(prev => [nuevaPlantilla, ...prev]);
    await supabase.from('estudios_plantillas').insert([mapPlantillaToDB(nuevaPlantilla)]);
    return true;
  };

  const eliminarPlantilla = async (id) => {
    if(!window.confirm("¿Eliminar esta plantilla?")) return;
    setPlantillas(prev => prev.filter(t => t.id !== id));
    await supabase.from('estudios_plantillas').delete().eq('id', id);
  };

  // --- 3. GESTIÓN DE ENCUESTAS ---
  const crearEncuesta = async (titulo, descripcion, datosUbicacion, preguntas, creador, estrategia = {}) => {
    const nuevaEncuesta = {
      id: `SURVEY-${Date.now()}`, titulo, descripcion,
      ubicacion: datosUbicacion, comunidad: datosUbicacion.comunidad,
      estrategia, preguntas, estado: 'ACTIVA',
      fechaCreacion: new Date().toISOString(), creador: creador.nombre
    };

    setEncuestas(prev => [nuevaEncuesta, ...prev]);
    await supabase.from('estudios_encuestas').insert([mapEncuestaToDB(nuevaEncuesta)]);
    return true;
  };

  const cerrarEncuesta = async (id) => {
    setEncuestas(prev => prev.map(e => e.id === id ? { ...e, estado: 'CERRADA' } : e));
    await supabase.from('estudios_encuestas').update({ estado: 'CERRADA' }).eq('id', id);
  };

  const eliminarEncuesta = async (id) => {
    if(!window.confirm("¿Eliminar encuesta y todas sus respuestas?")) return;
    setEncuestas(prev => prev.filter(e => e.id !== id));
    setRespuestas(prev => prev.filter(r => r.encuestaId !== id));
    
    // Al eliminar la encuesta, Supabase o el código limpiará las respuestas
    await supabase.from('estudios_encuestas').delete().eq('id', id);
    await supabase.from('estudios_respuestas').delete().eq('encuesta_id', id);
  };

  // --- 4. CAPTURA DE RESPUESTAS (HÍBRIDA) ---
  const guardarRespuesta = async (encuestaId, datosRespuestas, encuestador, coordenadas = null) => {
    const nuevaRespuesta = {
      id: `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      encuestaId,
      datos: datosRespuestas, 
      metadata: {
        fecha: new Date().toISOString(), encuestador: encuestador.nombre,
        ubicacion: coordenadas, modo: isOnline ? 'ONLINE_DIRECTO' : 'OFFLINE_SYNC'
      }
    };

    if (isOnline) {
      setRespuestas(prev => [nuevaRespuesta, ...prev]);
      await supabase.from('estudios_respuestas').insert([mapRespuestaToDB(nuevaRespuesta)]);
      return { exito: true, mensaje: 'Respuesta subida exitosamente ☁️' };
    } else {
      const nuevaCola = [...colaOffline, nuevaRespuesta];
      setColaOffline(nuevaCola);
      persistirCola(nuevaCola);
      return { exito: true, mensaje: 'Sin conexión. Guardado en dispositivo 💾' };
    }
  };

  // --- 5. SINCRONIZACIÓN AUTOMÁTICA ---
  const intentarSincronizar = async () => {
    const colaActual = JSON.parse(localStorage.getItem(KEYS.COLA_OFFLINE)) || [];
    if (colaActual.length === 0) return; 

    setIsSyncing(true);
    try {
      // Mandar todas las respuestas pendientes a Supabase de golpe
      const payload = colaActual.map(mapRespuestaToDB);
      const { error } = await supabase.from('estudios_respuestas').insert(payload);
      
      if (!error) {
          // Si fue exitoso, agregamos a la UI y vaciamos la cola
          setRespuestas(prev => [...colaActual, ...prev]);
          setColaOffline([]); 
          persistirCola([]);
          console.log(`✅ Sincronizados ${colaActual.length} registros pendientes en la nube.`);
      } else {
          console.error("Fallo al sincronizar con Supabase:", error);
      }
    } catch (error) {
      console.error("Error al sincronizar:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    encuestas, respuestas, plantillas, colaOffline, isOnline, isSyncing, cargando,
    crearEncuesta, guardarPlantilla, eliminarPlantilla, cerrarEncuesta,
    eliminarEncuesta, guardarRespuesta, intentarSincronizar 
  };
}