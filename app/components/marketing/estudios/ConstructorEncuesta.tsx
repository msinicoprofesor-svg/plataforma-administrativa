/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/estudios/ConstructorEncuesta.tsx         */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
  MdAdd, MdDelete, MdSave, MdClose, MdShortText, MdRadioButtonChecked, 
  MdCheckBox, MdArrowDropDownCircle, MdCalculate, MdTrackChanges, MdGroups,
  MdSettings, MdFileCopy, MdCloudDownload, MdDeleteForever, MdAltRoute, MdArrowForward
} from "react-icons/md";

const TIPOS_PREGUNTA = [
    { id: 'TEXTO_CORTO', label: 'Texto Corto', icon: <MdShortText className="text-lg"/> },
    { id: 'OPCION_MULTIPLE', label: 'Opción Múltiple', icon: <MdRadioButtonChecked className="text-lg"/> },
    { id: 'CASILLAS', label: 'Casillas', icon: <MdCheckBox className="text-lg"/> },
    { id: 'DESPLEGABLE', label: 'Desplegable', icon: <MdArrowDropDownCircle className="text-lg"/> }
];

const OBJETIVOS_ESTUDIO = [
    { id: 'APERTURA', label: 'Apertura de Zona (Greenfield)', desc: 'Evaluar viabilidad en zona nueva' },
    { id: 'COMPETENCIA', label: 'Análisis de Competencia', desc: 'Identificar debilidades de otros ISP' },
    { id: 'SATISFACCION', label: 'Satisfacción / Retención', desc: 'Medir felicidad de clientes actuales' },
    { id: 'VALIDACION', label: 'Validación de Producto', desc: 'Probar interés en nuevos planes' }
];

const NIVELES_CONFIANZA = [
    { label: '90%', valor: 1.645 },
    { label: '95% (Estándar)', valor: 1.96 },
    { label: '99% (Estricto)', valor: 2.576 }
];

export default function ConstructorEncuesta({ 
    onGuardar, onCancelar, 
    plantillas = [], onGuardarPlantilla, onEliminarPlantilla, usuario 
}) {
  // Estado General
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  // Estado Estratégico
  const [universo, setUniverso] = useState(''); 
  const [objetivo, setObjetivo] = useState('APERTURA'); 
  
  // Calculadora
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const [nivelConfianza, setNivelConfianza] = useState(1.96); 
  const [margenError, setMargenError] = useState(5); 
  const [heterogeneidad, setHeterogeneidad] = useState(50); 

  const [ubicacion, setUbicacion] = useState({
      comunidad: '', municipio: '', marca: '', region: ''
  });
  
  const [preguntas, setPreguntas] = useState([
      { id: Date.now(), texto: '', tipo: 'TEXTO_CORTO', opciones: [] }
  ]);

  const [mostrarMenuPlantillas, setMostrarMenuPlantillas] = useState(false);

  // --- CALCULADORA ---
  const muestraRecomendada = useMemo(() => {
      if (!universo || isNaN(universo) || Number(universo) <= 0) return 0;
      const N = Number(universo);
      const Z = Number(nivelConfianza);
      const p = Number(heterogeneidad) / 100;
      const e = Number(margenError) / 100;
      const numerador = N * Math.pow(Z, 2) * p * (1 - p);
      const denominador = Math.pow(e, 2) * (N - 1) + Math.pow(Z, 2) * p * (1 - p);
      return Math.ceil(numerador / denominador);
  }, [universo, nivelConfianza, margenError, heterogeneidad]);

  // --- LOGICA DE PREGUNTAS ---
  const agregarPregunta = () => {
      setPreguntas([
          ...preguntas, 
          { id: Date.now(), texto: '', tipo: 'TEXTO_CORTO', opciones: [] }
      ]);
  };

  const eliminarPregunta = (id) => {
      if (preguntas.length === 1) return; 
      setPreguntas(preguntas.filter(p => p.id !== id));
  };

  const actualizarPregunta = (id, campo, valor) => {
      setPreguntas(preguntas.map(p => 
          p.id === id ? { ...p, [campo]: valor } : p
      ));
  };

  // --- LOGICA DE OPCIONES & SALTOS (SKIP LOGIC) ---
  const agregarOpcion = (preguntaId) => {
      setPreguntas(preguntas.map(p => {
          if (p.id === preguntaId) {
              return { 
                  ...p, 
                  opciones: [...p.opciones, { id: Date.now(), texto: `Opción ${p.opciones.length + 1}`, irA: 'SIGUIENTE' }] 
              };
          }
          return p;
      }));
  };

  const actualizarOpcion = (preguntaId, opcionId, campo, valor) => {
      setPreguntas(preguntas.map(p => {
          if (p.id === preguntaId) {
              const nuevasOpciones = p.opciones.map(o => 
                  o.id === opcionId ? { ...o, [campo]: valor } : o
              );
              return { ...p, opciones: nuevasOpciones };
          }
          return p;
      }));
  };

  const eliminarOpcion = (preguntaId, opcionId) => {
      setPreguntas(preguntas.map(p => {
          if (p.id === preguntaId) {
              return { ...p, opciones: p.opciones.filter(o => o.id !== opcionId) };
          }
          return p;
      }));
  };

  // --- PLANTILLAS ---
  const cargarPlantilla = (tpl) => {
      if(confirm(`¿Cargar plantilla "${tpl.titulo}"?`)) {
          setTitulo(tpl.titulo + " (Copia)");
          setDescripcion(tpl.descripcion);
          const nuevasPreguntas = tpl.preguntas.map(p => ({
              ...p,
              id: Date.now() + Math.random(),
              opciones: p.opciones ? p.opciones.map(o => ({...o, id: Date.now() + Math.random()})) : []
          }));
          setPreguntas(nuevasPreguntas);
          setMostrarMenuPlantillas(false);
      }
  };

  const handleGuardarPlantilla = () => {
      if (!titulo.trim()) return alert("Escribe un título para la plantilla");
      onGuardarPlantilla(titulo, descripcion, preguntas);
      alert("¡Plantilla guardada con éxito!");
  };

  const handleSave = () => {
      if (!titulo.trim()) return alert("El título es obligatorio");
      if (!ubicacion.comunidad) return alert("Completa la comunidad.");
      if (preguntas.some(p => !p.texto.trim())) return alert("Completa las preguntas.");

      onGuardar({
          titulo, descripcion, comunidad: ubicacion,
          estrategia: { 
            universo: Number(universo) || 0, objetivo, muestraObjetivo: muestraRecomendada,
            parametrosEstadisticos: { confianza: nivelConfianza, margenError, heterogeneidad }
          },
          preguntas
      });
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl h-full flex flex-col animate-fade-in relative">
        
        {/* HEADER */}
        <div className="border-b border-gray-100 pb-6 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onCancelar} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 text-gray-500">
                        <MdClose className="text-xl"/>
                    </button>
                    <h2 className="text-2xl font-black text-gray-800">Nuevo Estudio</h2>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setMostrarMenuPlantillas(!mostrarMenuPlantillas)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                        <MdCloudDownload className="text-lg"/> Cargar Plantilla
                    </button>
                    {mostrarMenuPlantillas && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-slide-up">
                            <div className="p-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase">Plantillas Disponibles</div>
                            <div className="max-h-60 overflow-y-auto">
                                {plantillas.length === 0 ? <p className="p-4 text-sm text-gray-400 text-center">Sin plantillas.</p> : 
                                    plantillas.map(tpl => (
                                        <div key={tpl.id} className="p-3 hover:bg-gray-50 border-b border-gray-50 flex justify-between items-center group">
                                            <div onClick={() => cargarPlantilla(tpl)} className="cursor-pointer flex-1">
                                                <p className="text-sm font-bold text-gray-700">{tpl.titulo}</p>
                                            </div>
                                            <button onClick={() => onEliminarPlantilla(tpl.id)} className="p-1 text-gray-300 hover:text-red-500"><MdDeleteForever/></button>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mb-6">
                <input 
                    type="text" placeholder="Título del Estudio" autoFocus
                    className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 border-none focus:ring-0 px-0 outline-none"
                    value={titulo} onChange={(e) => setTitulo(e.target.value)}
                />
                <input 
                    type="text" placeholder="Descripción breve..." 
                    className="w-full text-sm text-gray-500 placeholder-gray-300 border-none focus:ring-0 px-0 outline-none mt-1"
                    value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-red-500 rounded-full"></span> Segmentación
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Comunidad" className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:border-red-400" value={ubicacion.comunidad} onChange={(e) => setUbicacion({...ubicacion, comunidad: e.target.value})} />
                        <input type="text" placeholder="Municipio" className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:border-red-400" value={ubicacion.municipio} onChange={(e) => setUbicacion({...ubicacion, municipio: e.target.value})} />
                        <input type="text" placeholder="Marca" className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:border-red-400" value={ubicacion.marca} onChange={(e) => setUbicacion({...ubicacion, marca: e.target.value})} />
                        <input type="text" placeholder="Región" className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:border-red-400" value={ubicacion.region} onChange={(e) => setUbicacion({...ubicacion, region: e.target.value})} />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                            <span className="w-1 h-4 bg-indigo-500 rounded-full"></span> Estrategia
                        </p>
                        <button onClick={() => setMostrarCalculadora(!mostrarCalculadora)} className="text-[10px] font-bold text-indigo-500 hover:underline flex items-center gap-1">
                            <MdSettings/> {mostrarCalculadora ? 'Ocultar' : 'Avanzado'}
                        </button>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                            <div className="relative">
                                <MdGroups className="absolute left-3 top-2.5 text-gray-400"/>
                                <input 
                                    type="number" placeholder="Total Viviendas" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-gray-700 outline-none focus:border-indigo-400"
                                    value={universo} onChange={(e) => setUniverso(e.target.value)}
                                />
                            </div>
                            
                            {mostrarCalculadora && (
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] text-gray-400 font-bold uppercase">Confianza (Z)</label>
                                            <select value={nivelConfianza} onChange={(e) => setNivelConfianza(Number(e.target.value))} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold">
                                                {NIVELES_CONFIANZA.map(nc => <option key={nc.valor} value={nc.valor}>{nc.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-gray-400 font-bold uppercase">Error (e)</label>
                                            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2">
                                                <input type="number" value={margenError} onChange={(e) => setMargenError(e.target.value)} className="w-full py-1 text-xs font-bold outline-none"/>
                                                <span className="text-[10px] text-gray-400 font-bold">%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-400 font-bold uppercase">Heterogeneidad (p/q)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min="10" max="90" step="10" value={heterogeneidad} onChange={(e) => setHeterogeneidad(e.target.value)} className="flex-1 h-1 bg-indigo-200 rounded-lg appearance-none cursor-pointer"/>
                                            <span className="text-[10px] font-bold text-gray-600 w-8">{heterogeneidad}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <MdTrackChanges className="absolute left-3 top-2.5 text-gray-400"/>
                                <select className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-8 py-2 text-sm font-bold text-gray-700 outline-none focus:border-indigo-400 appearance-none cursor-pointer" value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
                                    {OBJETIVOS_ESTUDIO.map(obj => <option key={obj.id} value={obj.id}>{obj.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 text-center w-32 shrink-0 flex flex-col justify-center min-h-[100px]">
                            <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Muestra Ideal</p>
                            {muestraRecomendada > 0 ? (
                                <>
                                    <span className="text-3xl font-black text-indigo-600 leading-none">{muestraRecomendada}</span>
                                    <span className="text-[9px] text-indigo-400 font-medium mt-1">Encuestas</span>
                                </>
                            ) : <MdCalculate className="text-3xl text-indigo-200 mx-auto"/>}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* BODY: LISTA DE PREGUNTAS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-20">
            {preguntas.map((p, index) => (
                <div key={p.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 relative group transition-all hover:bg-white hover:shadow-md">
                    <div className="absolute left-0 top-6 bottom-6 w-1 bg-gray-200 rounded-r-full group-hover:bg-red-500 transition-colors"></div>

                    <div className="flex gap-4 items-start mb-4 pl-4">
                        <span className="text-gray-300 font-bold mt-2 text-sm">P{index + 1}</span>
                        <div className="flex-1">
                            <input 
                                type="text" placeholder="Escribe la pregunta aquí..." 
                                className="w-full bg-transparent text-lg font-bold text-gray-800 placeholder-gray-400 border-b border-dashed border-gray-300 focus:border-red-500 outline-none pb-1 transition-colors"
                                value={p.texto} onChange={(e) => actualizarPregunta(p.id, 'texto', e.target.value)}
                            />
                        </div>
                        <div className="w-48">
                            <div className="relative">
                                <select 
                                    value={p.tipo} onChange={(e) => actualizarPregunta(p.id, 'tipo', e.target.value)}
                                    className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-xs font-bold text-gray-600 focus:border-red-500 outline-none cursor-pointer"
                                >
                                    {TIPOS_PREGUNTA.map(tipo => <option key={tipo.id} value={tipo.id}>{tipo.label}</option>)}
                                </select>
                                <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                                    {TIPOS_PREGUNTA.find(t => t.id === p.tipo)?.icon}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OPCIONES CON LOGICA DE SALTOS */}
                    {p.tipo !== 'TEXTO_CORTO' && (
                        <div className="pl-12 space-y-2">
                            {p.opciones.map((opcion, idx) => (
                                <div key={opcion.id} className="flex items-center gap-2 animate-fade-in flex-wrap">
                                    {p.tipo === 'OPCION_MULTIPLE' && <MdRadioButtonChecked className="text-gray-300"/>}
                                    {p.tipo === 'CASILLAS' && <MdCheckBox className="text-gray-300"/>}
                                    {p.tipo === 'DESPLEGABLE' && <span className="text-xs font-bold text-gray-300">{idx + 1}.</span>}
                                    
                                    <input 
                                        type="text" value={opcion.texto}
                                        onChange={(e) => actualizarOpcion(p.id, opcion.id, 'texto', e.target.value)}
                                        className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-sm text-gray-600 focus:border-red-300 outline-none min-w-[150px]"
                                    />
                                    
                                    {/* SELECTOR DE SALTO (SKIP LOGIC) - Solo para selección única */}
                                    {(p.tipo === 'OPCION_MULTIPLE' || p.tipo === 'DESPLEGABLE') && (
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                                            <MdAltRoute className="text-gray-400 text-xs"/>
                                            <select 
                                                value={opcion.irA || 'SIGUIENTE'}
                                                onChange={(e) => actualizarOpcion(p.id, opcion.id, 'irA', e.target.value)}
                                                className="bg-transparent text-[10px] font-bold text-gray-500 outline-none cursor-pointer w-24"
                                            >
                                                <option value="SIGUIENTE">Siguiente</option>
                                                {preguntas.slice(index + 1).map(pq => (
                                                    <option key={pq.id} value={pq.id}>Ir a P{preguntas.indexOf(pq) + 1}</option>
                                                ))}
                                                <option value="FIN">Finalizar Encuesta</option>
                                            </select>
                                        </div>
                                    )}

                                    <button onClick={() => eliminarOpcion(p.id, opcion.id)} className="text-gray-300 hover:text-red-400">
                                        <MdClose/>
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => agregarOpcion(p.id)} className="text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-2 px-2">
                                <MdAdd/> Agregar Opción
                            </button>
                        </div>
                    )}

                    <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => eliminarPregunta(p.id)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 hover:text-red-600">
                            <MdDelete/>
                        </button>
                    </div>
                </div>
            ))}

            <button onClick={agregarPregunta} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-red-200 hover:text-red-400 hover:bg-red-50/30 transition-all">
                <MdAdd className="text-xl"/> Agregar Pregunta
            </button>
        </div>

        {/* FOOTER */}
        <div className="pt-4 border-t border-gray-100 flex justify-between gap-3">
            <button onClick={handleGuardarPlantilla} className="px-4 py-3 rounded-xl font-bold text-indigo-500 hover:bg-indigo-50 transition-colors flex items-center gap-2">
                <MdFileCopy/> <span className="hidden md:inline">Guardar como Plantilla</span>
            </button>
            <div className="flex gap-3">
                <button onClick={onCancelar} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] transition-all flex items-center gap-2">
                    <MdSave className="text-lg"/> Guardar Encuesta
                </button>
            </div>
        </div>
    </div>
  );
}