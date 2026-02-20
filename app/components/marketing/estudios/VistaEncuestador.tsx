/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/estudios/VistaEncuestador.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
  MdArrowBack, MdSave, MdLocationOn, MdCheckCircle, MdCloudQueue, MdSdStorage, MdGpsFixed, MdGpsOff 
} from "react-icons/md";

export default function VistaEncuestador({ encuesta, onAtras, onGuardarRespuesta, usuario, respuestasTotales = [] }) {
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null); 
  
  // Estado GPS
  const [coords, setCoords] = useState(null);
  const [gpsError, setGpsError] = useState(false);

  // --- 1. MOTOR DE LÓGICA CONDICIONAL (SKIP LOGIC) ---
  const visiblePreguntas = useMemo(() => {
      const visibles = [];
      let i = 0;
      const todas = encuesta.preguntas;

      while (i < todas.length) {
          const p = todas[i];
          visibles.push(p);

          // Verificamos si la respuesta actual activa un salto
          const respuestaActual = respuestas[p.id];
          let saltoActivado = null;

          if (respuestaActual && (p.tipo === 'OPCION_MULTIPLE' || p.tipo === 'DESPLEGABLE')) {
              // Buscamos la opción seleccionada para ver si tiene regla "irA"
              const opcion = p.opciones?.find(op => op.texto === respuestaActual);
              if (opcion?.irA && opcion.irA !== 'SIGUIENTE') {
                  saltoActivado = opcion.irA;
              }
          }

          if (saltoActivado === 'FIN') {
              break; // Cortamos el flujo aquí (no mostramos más preguntas)
          } else if (saltoActivado) {
              // Buscamos el índice de la pregunta destino
              // Convertimos a String para asegurar comparación (ids pueden ser number o string)
              const targetIndex = todas.findIndex(q => String(q.id) === String(saltoActivado));
              if (targetIndex > i) {
                  i = targetIndex; // Saltamos hasta esa pregunta
                  continue; // Continuamos el loop desde el nuevo índice
              }
          }

          i++; // Avanzamos normal a la siguiente
      }
      return visibles;
  }, [encuesta.preguntas, respuestas]);

  // --- 2. CÁLCULO DE PROGRESO ---
  const meta = encuesta.estrategia?.muestraObjetivo || 0;
  const avanceActual = respuestasTotales.filter(r => r.encuestaId === encuesta.id).length;
  const porcentajeAvance = meta > 0 ? Math.min(100, Math.round((avanceActual / meta) * 100)) : 0;

  // --- 3. GPS ---
  useEffect(() => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGpsError(false);
            },
            (err) => {
                console.warn("Error GPS:", err);
                setGpsError(true);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
  }, []);

  const handleChange = (preguntaId, valor) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
  };

  const handleCheckboxChange = (preguntaId, opcionTexto, checked) => {
    setRespuestas(prev => {
      const actuales = prev[preguntaId] || [];
      if (checked) return { ...prev, [preguntaId]: [...actuales, opcionTexto] };
      return { ...prev, [preguntaId]: actuales.filter(op => op !== opcionTexto) };
    });
  };

  // --- 4. GUARDADO ---
  const handleSubmit = async () => {
    // Validación: Solo validamos las preguntas VISIBLES
    const preguntasSinContestar = visiblePreguntas.filter(p => {
        const r = respuestas[p.id];
        return !r || (Array.isArray(r) && r.length === 0);
    });

    if (preguntasSinContestar.length > 0) {
        if(!confirm(`Hay ${preguntasSinContestar.length} preguntas visibles sin contestar. ¿Guardar incompleta?`)) return;
    }

    setEnviando(true);
    
    // Filtramos respuestas para no guardar datos de preguntas ocultas (limpieza)
    const respuestasLimpias = {};
    visiblePreguntas.forEach(p => {
        if (respuestas[p.id]) respuestasLimpias[p.id] = respuestas[p.id];
    });

    const resultado = await onGuardarRespuesta(encuesta.id, respuestasLimpias, usuario, coords);

    setEnviando(false);
    if (resultado.exito) {
        setMensajeExito(resultado.mensaje.includes('dispositivo') ? 'OFFLINE' : 'ONLINE');
        setTimeout(() => {
            onAtras(); 
        }, 2000);
    } else {
        alert("Error al guardar: " + resultado.mensaje);
    }
  };

  if (mensajeExito) {
      return (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in bg-green-50 rounded-[2.5rem]">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                  <MdCheckCircle className="text-6xl text-green-600"/>
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">¡Respuesta Guardada!</h2>
              <p className="text-gray-500 font-medium flex items-center gap-2">
                  {mensajeExito === 'ONLINE' ? (
                      <><MdCloudQueue className="text-blue-500"/> Subida a la nube exitosamente</>
                  ) : (
                      <><MdSdStorage className="text-orange-500"/> Guardada en dispositivo (Sin Red)</>
                  )}
              </p>
          </div>
      );
  }

  return (
    <div className="bg-white rounded-[2.5rem] h-full flex flex-col shadow-xl overflow-hidden animate-fade-in relative">
        
        {/* HEADER */}
        <div className="bg-gray-900 text-white p-6 pb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

            <div className="flex items-center gap-4 relative z-10">
                <button onClick={onAtras} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <MdArrowBack className="text-xl"/>
                </button>
                <div className="flex-1">
                    <h2 className="text-lg font-bold leading-tight">{encuesta.titulo}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MdLocationOn className="text-red-400"/> {encuesta.comunidad?.comunidad || encuesta.comunidad}
                        </span>
                        {coords ? (
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <MdGpsFixed/> GPS Activo
                            </span>
                        ) : (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                                <MdGpsOff/> Buscando GPS...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* BARRA DE META */}
        {meta > 0 && (
            <div className="mx-6 -mt-6 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 relative z-20">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progreso de Muestra</span>
                    <span className="text-sm font-black text-indigo-600">{avanceActual} / {meta}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${porcentajeAvance}%` }}></div>
                </div>
                {avanceActual >= meta && (
                    <div className="mt-2 text-center text-xs font-bold text-green-500 flex items-center justify-center gap-1 bg-green-50 py-1 rounded-lg">
                        <MdCheckCircle/> ¡Meta Estadística Alcanzada!
                    </div>
                )}
            </div>
        )}

        {/* BODY: PREGUNTAS (Renderizamos solo las visibles) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-gray-50">
            {visiblePreguntas.map((p, index) => (
                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-slide-up">
                    <div className="flex justify-between mb-2">
                        {/* Mostramos el índice real + 1, aunque podríamos mostrar el índice relativo a las visibles si quisieras */}
                        <p className="text-xs font-black text-gray-300 uppercase">Pregunta {encuesta.preguntas.findIndex(q => q.id === p.id) + 1}</p>
                        {p.tipo === 'OPCION_MULTIPLE' && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Selección Única</span>}
                    </div>
                    
                    <p className="text-lg font-bold text-gray-800 mb-4 leading-tight">{p.texto}</p>

                    {/* RENDER SEGÚN TIPO */}
                    {p.tipo === 'TEXTO_CORTO' && (
                        <input 
                            type="text" 
                            className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-200 font-medium text-gray-700 transition-all"
                            placeholder="Escribe la respuesta..."
                            value={respuestas[p.id] || ''}
                            onChange={(e) => handleChange(p.id, e.target.value)}
                        />
                    )}

                    {p.tipo === 'OPCION_MULTIPLE' && (
                        <div className="space-y-2">
                            {p.opciones.map(op => (
                                <label key={op.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${respuestas[p.id] === op.texto ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${respuestas[p.id] === op.texto ? 'border-indigo-500' : 'border-gray-300'}`}>
                                        {respuestas[p.id] === op.texto && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"/>}
                                    </div>
                                    <input 
                                        type="radio" name={`p-${p.id}`} className="hidden"
                                        value={op.texto} onChange={() => handleChange(p.id, op.texto)}
                                    />
                                    <span className="text-sm font-bold text-gray-700">{op.texto}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {p.tipo === 'CASILLAS' && (
                        <div className="space-y-2">
                            {p.opciones.map(op => {
                                const isChecked = (respuestas[p.id] || []).includes(op.texto);
                                return (
                                    <label key={op.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isChecked ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 ${isChecked ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'}`}>
                                            {isChecked && <MdCheckCircle className="text-sm"/>}
                                        </div>
                                        <input 
                                            type="checkbox" className="hidden"
                                            checked={isChecked} onChange={(e) => handleCheckboxChange(p.id, op.texto, e.target.checked)}
                                        />
                                        <span className="text-sm font-bold text-gray-700">{op.texto}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {p.tipo === 'DESPLEGABLE' && (
                        <select 
                            className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none font-bold text-gray-700 focus:ring-2 focus:ring-indigo-200"
                            value={respuestas[p.id] || ''}
                            onChange={(e) => handleChange(p.id, e.target.value)}
                        >
                            <option value="">-- Seleccionar --</option>
                            {p.opciones.map(op => <option key={op.id} value={op.texto}>{op.texto}</option>)}
                        </select>
                    )}
                </div>
            ))}
            
            {/* Mensaje si terminamos por salto */}
            {visiblePreguntas.length > 0 && 
             respuestas[visiblePreguntas[visiblePreguntas.length - 1].id] && // Si la última pregunta visible ya tiene respuesta
             encuesta.preguntas.indexOf(visiblePreguntas[visiblePreguntas.length - 1]) < encuesta.preguntas.length - 1 && // Y NO es la última real
             // Y la respuesta provoca un FIN... (lógica implicita porque no hay más preguntas visibles)
             <div className="text-center py-4 text-gray-400 italic text-sm animate-fade-in">
                Encuesta finaliza aquí según respuestas anteriores.
             </div>
            }
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-gray-100 z-10">
            <button 
                onClick={handleSubmit} disabled={enviando}
                className="w-full py-4 bg-gray-900 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {enviando ? 'Guardando...' : <><MdSave className="text-xl"/> Finalizar Encuesta</>}
            </button>
        </div>
    </div>
  );
}