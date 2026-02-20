/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/estudios/PanelEstudios.tsx               */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
  MdAdd, MdCloudUpload, MdWifiOff, MdPoll, MdTrendingUp, MdDelete, MdLocationOn 
} from "react-icons/md";

// Importamos el Cerebro y los Componentes Hijos
import { useEstudiosMercado } from '../../../hooks/useEstudiosMercado';
import ConstructorEncuesta from './ConstructorEncuesta';
import VistaEncuestador from './VistaEncuestador';
import DashboardResultados from './DashboardResultados';

import { tienePermiso } from '../../../config/permisos';

export default function PanelEstudios({ usuario }) {
  // --- 1. CONECTAMOS EL CEREBRO ---
  const { 
    encuestas, respuestas, 
    plantillas, guardarPlantilla, eliminarPlantilla, // <--- NUEVAS FUNCIONES IMPORTADAS
    crearEncuesta, eliminarEncuesta, guardarRespuesta, 
    colaOffline, isOnline, intentarSincronizar, isSyncing 
  } = useEstudiosMercado();

  // --- 2. ESTADOS DE NAVEGACIÓN ---
  const [vista, setVista] = useState('LISTA'); // LISTA, CREAR, RESPONDER, RESULTADOS
  const [encuestaActiva, setEncuestaActiva] = useState(null); 

  // --- 3. LOGICA DE PERMISOS ---
  const rawKey = usuario?.puesto || usuario?.rol || '';
  const rolUpper = rawKey.toUpperCase();
  
  const puedeGestionar = 
      tienePermiso(usuario, 'marketing_total') || 
      rolUpper.includes('GERENTE') || 
      rolUpper.includes('DIRECTOR') || 
      rolUpper.includes('ADMIN') ||
      rolUpper.includes('JEFE');

  // --- HANDLERS ---
  const handleGuardarNueva = (datos) => {
      // Nota: Ahora el Constructor decide si llama a crearEncuesta o guardarPlantilla
      // Pero mantenemos este handler como wrapper principal
      crearEncuesta(datos.titulo, datos.descripcion, datos.comunidad, datos.preguntas, usuario, datos.estrategia);
      setVista('LISTA');
  };

  const handleIniciarEncuesta = (encuesta) => {
      setEncuestaActiva(encuesta);
      setVista('RESPONDER');
  };

  const handleVerResultados = (encuesta) => {
      setEncuestaActiva(encuesta);
      setVista('RESULTADOS');
  };

  const handleGuardarRespuesta = async (encuestaId, respuestasData, user, coords) => {
      const resultado = await guardarRespuesta(encuestaId, respuestasData, user, coords);
      return resultado;
  };

  // --- VISTAS INTERNAS ---
  
  // A) VISTA CREAR (AHORA CON PODERES DE PLANTILLA)
  if (vista === 'CREAR') {
      return (
          <ConstructorEncuesta 
            onGuardar={handleGuardarNueva} // Guardar como encuesta real
            onCancelar={() => setVista('LISTA')}
            
            // PROPS DE PLANTILLAS
            plantillas={plantillas}
            onGuardarPlantilla={guardarPlantilla}
            onEliminarPlantilla={eliminarPlantilla}
            usuario={usuario} // Para saber quién crea la plantilla
          />
      );
  }

  // B) VISTA RESPONDER
  if (vista === 'RESPONDER' && encuestaActiva) {
      return (
          <VistaEncuestador 
            encuesta={encuestaActiva} 
            usuario={usuario}
            respuestasTotales={respuestas} 
            onAtras={() => { setEncuestaActiva(null); setVista('LISTA'); }}
            onGuardarRespuesta={handleGuardarRespuesta}
          />
      );
  }

  // C) VISTA RESULTADOS (CONEXIÓN DE USUARIO AGREGADA)
  if (vista === 'RESULTADOS' && encuestaActiva) {
      return (
          <DashboardResultados 
            encuesta={encuestaActiva}
            respuestas={respuestas}
            onAtras={() => { setEncuestaActiva(null); setVista('LISTA'); }}
            usuario={usuario} // <--- ¡AQUÍ ESTÁ LA MODIFICACIÓN CLAVE! 🔑
          />
      );
  }

  // D) VISTA PRINCIPAL
  return (
    <div className="h-full flex flex-col animate-fade-in">
        
        {/* HEADER DEL PANEL */}
        <div className="flex justify-between items-center mb-8 px-2">
            <div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Estudios de Mercado</h2>
                <p className="text-sm text-gray-400 font-medium mt-1">Gestión de encuestas y análisis de campo</p>
            </div>

            <div className="flex items-center gap-3">
                {/* Indicador de Sincronización */}
                {colaOffline.length > 0 && (
                    <button 
                        onClick={intentarSincronizar}
                        disabled={!isOnline || isSyncing}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${isOnline ? 'bg-orange-500 text-white animate-pulse hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        {isSyncing ? 'Sincronizando...' : (
                            <>{isOnline ? <MdCloudUpload className="text-lg"/> : <MdWifiOff className="text-lg"/>} {colaOffline.length} Pendientes</>
                        )}
                    </button>
                )}

                {/* Botón Crear */}
                {puedeGestionar && (
                    <button 
                        onClick={() => setVista('CREAR')}
                        className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold shadow-xl hover:bg-black hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <MdAdd className="text-xl"/> Nuevo Estudio
                    </button>
                )}
            </div>
        </div>

        {/* GRID DE ENCUESTAS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
            {encuestas.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50/50">
                    <MdPoll className="text-6xl text-gray-300 mb-4"/>
                    <p className="text-gray-400 font-bold">No hay estudios activos.</p>
                    {puedeGestionar && <p className="text-xs text-gray-400 mt-2">Crea uno nuevo o usa una plantilla.</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pr-2">
                    {encuestas.map((encuesta) => (
                        <div key={encuesta.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                            
                            {/* Decoración de fondo */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            {/* Info Principal */}
                            <div className="mb-6 relative z-10">
                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase mb-3">
                                    <MdLocationOn className="text-red-400"/> 
                                    {typeof encuesta.comunidad === 'object' ? encuesta.comunidad.comunidad : encuesta.comunidad}
                                </span>
                                <h3 className="text-xl font-extrabold text-gray-800 leading-tight mb-2">{encuesta.titulo}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2">{encuesta.descripcion || 'Sin descripción'}</p>
                                
                                {/* Indicador de Meta */}
                                {encuesta.estrategia?.muestraObjetivo > 0 && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                            <span>Meta Muestra</span>
                                            <span>{encuesta.estrategia.muestraObjetivo} encuestas</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-indigo-500 h-full rounded-full" 
                                                style={{ width: `${Math.min(100, (respuestas.filter(r => r.encuestaId === encuesta.id).length / encuesta.estrategia.muestraObjetivo) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                                <button 
                                    onClick={() => handleIniciarEncuesta(encuesta)}
                                    className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-md shadow-red-200 flex items-center justify-center gap-2"
                                >
                                    <MdPoll className="text-lg"/> Responder
                                </button>
                                
                                <button 
                                    onClick={() => handleVerResultados(encuesta)}
                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors"
                                    title="Ver Estadísticas"
                                >
                                    <MdTrendingUp className="text-lg"/>
                                </button>
                                
                                {puedeGestionar && (
                                    <button 
                                        onClick={() => eliminarEncuesta(encuesta.id)}
                                        className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
                                        title="Eliminar Estudio"
                                    >
                                        <MdDelete className="text-lg"/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}