/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ImportarInteracciones.tsx (MATCH POR FB PERFIL)    */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
  MdHistory, MdCheckCircle, MdWarning, MdContentPaste, MdClose, 
  MdDeleteForever, MdSearch, MdAddCircle, MdCloudUpload, MdExpandMore, 
  MdDateRange 
} from "react-icons/md";
import { FaThumbsUp, FaCommentDots, FaGem } from "react-icons/fa";

const PUNTOS_POR_MARCA = {
  'WIFICEL': 5, 
  'JAVAK': 5, 
  'FIBROX': 4, 
  'INTERCHEAP': 3, 
  'DMG': 2,
  'FRENXO': 3
};

// Función para normalizar texto (Quita acentos, emojis y caracteres raros como Č -> c)
const normalizar = (texto) => {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9\s]/g, "")     // Quitar emojis y símbolos raros
    .trim();
};

export default function ImportarInteracciones({ colaboradores, historial, onProcesar, onEliminarHistorial }) {
  // --- ESTADOS GLOBALES ---
  const [activeTab, setActiveTab] = useState('reacciones'); 
  const [marca, setMarca] = useState('WIFICEL');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  // --- ESTADOS: IMPORTACIÓN DE TEXTO ---
  const [textoInput, setTextoInput] = useState('');
  const [previewData, setPreviewData] = useState(null);

  // --- ESTADOS: PUNTOS EXTRA (MANUAL) ---
  const [busquedaExtra, setBusquedaExtra] = useState('');
  const [seleccionados, setSeleccionados] = useState([]); 
  const [motivo, setMotivo] = useState('Participación');
  const [otroMotivo, setOtroMotivo] = useState('');
  const [puntosGlobales, setPuntosGlobales] = useState(10); 

  // --- ESTADOS: HISTORIAL LATERAL ---
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // --- 1. PROCESAMIENTO DE TEXTO ---
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextoInput(text);
    } catch (err) {
      alert('Tu navegador no permite pegado automático. Usa Ctrl+V en el cuadro.');
    }
  };

  const procesarLineas = (texto, tipoAnalisis) => {
    const lineas = texto.split('\n');
    const resultados = { encontrados: [], noEncontrados: [] };
    const noEncontradosSet = new Set(); 

    for (let i = 0; i < lineas.length; i++) {
      let linea = lineas[i].trim();
      if (!linea) continue;

      let nombreExtraid = '';
      let interaccionExtraida = tipoAnalisis === 'reacciones' ? 'Reacción' : 'Comentario';

      // --- ESTRATEGIA DE PARSEO (EXTRACCIÓN) ---
      if (linea.includes('\t')) {
          const columnas = linea.split('\t');
          
          if (tipoAnalisis === 'reacciones') {
              // Reacciones: Col 2 es el Nombre
              if (columnas.length >= 3) {
                  nombreExtraid = columnas[2].replace(/^"|"$/g, '').trim(); 
              }
              if (columnas.length >= 5) {
                  const tipoRaw = columnas[4].replace(/^"|"$/g, '').trim();
                  if (tipoRaw && tipoRaw.length > 2) interaccionExtraida = tipoRaw;
              }
          } 
          else if (tipoAnalisis === 'comentarios') {
              // Comentarios: Col 3 es el Autor
              if (columnas.length >= 4) {
                  nombreExtraid = columnas[3].replace(/^"|"$/g, '').trim();
              }
              if (columnas.length >= 5) {
                  let contenido = columnas[4].replace(/^"|"$/g, '').trim();
                  if (contenido.startsWith('http') || contenido.startsWith('=IMAGE')) contenido = 'Imagen/Sticker';
                  interaccionExtraida = contenido.substring(0, 30);
              }
          }
      } else {
          // Fallback lista simple
          nombreExtraid = linea.replace(/^"|"$/g, '').trim();
      }

      // --- LIMPIEZA ---
      if (nombreExtraid.length < 2) continue;
      // Ignorar basura técnica y encabezados
      const ignorar = ['NOMBRE DEL PERFIL', 'USER ID', 'DATE', 'CANNOT_REQUEST', '=IMAGE', 'HTTP', 'AUTHOR', 'CONTENT', 'AVATAR', 'ID'];
      if (ignorar.some(k => nombreExtraid.toUpperCase() === k || nombreExtraid.toUpperCase().includes(k + "\t"))) continue;
      if (/^\d+$/.test(nombreExtraid)) continue; // Ignorar si es solo números

      // --- MATCHING INTELIGENTE (FACEBOOK VS BASE DE DATOS) ---
      const nombreBusqueda = normalizar(nombreExtraid);

      const match = colaboradores.find(c => {
          // 1. Comparar con PERFIL DE FACEBOOK (Prioridad Alta)
          if (c.facebook) {
              const fbDB = normalizar(c.facebook);
              if (fbDB === nombreBusqueda) return true; // Coincidencia exacta
              if (nombreBusqueda.includes(fbDB) && fbDB.length > 3) return true; // Texto contiene FB
              if (fbDB.includes(nombreBusqueda) && nombreBusqueda.length > 3) return true; // FB contiene Texto
          }

          // 2. Comparar con NOMBRE REAL (Respaldo)
          const nombreDB = normalizar(c.nombre);
          if (nombreDB === nombreBusqueda) return true;
          if (nombreBusqueda.includes(nombreDB)) return true;
          
          return false;
      });

      if (match) {
        const yaExiste = resultados.encontrados.find(e => e.colaboradorId === match.id);
        if (!yaExiste) {
            resultados.encontrados.push({
                colaboradorId: match.id, 
                nombre: match.nombre, // Nombre real para el sistema
                usuarioFb: nombreExtraid, // Nombre detectado en FB para referencia
                interaccion: interaccionExtraida, 
                puntosGanados: PUNTOS_POR_MARCA[marca] || 5
            });
        }
      } else {
        if (!nombreExtraid.startsWith('http') && !nombreExtraid.startsWith('=')) {
            noEncontradosSet.add(nombreExtraid);
        }
      }
    }

    resultados.noEncontrados = Array.from(noEncontradosSet);
    return resultados;
  };

  const analizarTexto = () => {
    if (!textoInput.trim()) return alert("El campo está vacío.");
    const resultados = procesarLineas(textoInput, activeTab);
    setPreviewData(resultados);
  };

  const confirmarCargaMasiva = () => {
    if (!previewData || previewData.encontrados.length === 0) return;
    
    const evento = {
      id: `IMP-${Date.now()}`,
      fecha, 
      marca, 
      tipo: activeTab.toUpperCase(), 
      totalPuntos: previewData.encontrados.reduce((acc, curr) => acc + curr.puntosGanados, 0),
      detalles: previewData.encontrados, 
      cantidad: previewData.encontrados.length
    };

    onProcesar(evento); 
    
    alert("¡Puntos asignados correctamente!");
    setPreviewData(null);
    setTextoInput('');
  };

  // --- 2. PUNTOS EXTRA (MANUAL) ---
  const agregarASeleccion = (colaborador) => {
    if (seleccionados.find(s => s.id === colaborador.id)) return; 
    setSeleccionados([...seleccionados, { ...colaborador, puntosAsignados: puntosGlobales }]);
    setBusquedaExtra(''); 
  };
  const quitarDeSeleccion = (id) => setSeleccionados(seleccionados.filter(s => s.id !== id));
  const cambiarPuntosIndividual = (id, nuevosPuntos) => setSeleccionados(seleccionados.map(s => s.id === id ? { ...s, puntosAsignados: Number(nuevosPuntos) } : s));
  const aplicarPuntosATodos = () => setSeleccionados(seleccionados.map(s => ({ ...s, puntosAsignados: puntosGlobales })));
  
  const guardarPuntosExtra = () => {
    if (seleccionados.length === 0) return alert("Selecciona al menos un colaborador.");
    const motivoFinal = motivo === 'Otro' ? otroMotivo : motivo;
    if (!motivoFinal.trim()) return alert("Debes especificar el motivo.");

    const detalles = seleccionados.map(s => ({
        colaboradorId: s.id, nombre: s.nombre, usuarioFb: 'N/A', 
        interaccion: motivoFinal, puntosGanados: s.puntosAsignados
    }));

    const evento = {
      id: `EXTRA-${Date.now()}`,
      fecha, marca, tipo: 'PUNTOS_EXTRA',
      totalPuntos: seleccionados.reduce((acc, curr) => acc + curr.puntosAsignados, 0),
      detalles: detalles, cantidad: seleccionados.length
    };

    onProcesar(evento);
    alert("¡Puntos Extra asignados!");
    setSeleccionados([]); setOtroMotivo(''); setMotivo('Participación');
  };

  const resultadosBusqueda = useMemo(() => {
      if (busquedaExtra.length < 2) return [];
      return colaboradores.filter(c => c.nombre.toLowerCase().includes(busquedaExtra.toLowerCase()) && !seleccionados.find(s => s.id === c.id)).slice(0, 5);
  }, [busquedaExtra, colaboradores, seleccionados]);

  // --- 3. HISTORIAL ---
  const handleDeleteItem = (e, id) => {
    e.stopPropagation();
    if (window.confirm("⚠️ ¿Eliminar este registro y REVERTIR los puntos sumados?")) onEliminarHistorial(id);
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-6 rounded-[2rem] shadow-sm">
        <div className="w-full md:w-auto">
            <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
               <MdCloudUpload className="text-[#DA291C]" /> Importar Puntos
            </h2>
            <p className="text-sm text-gray-400 font-medium">Carga masiva de interacciones</p>
        </div>
        <button onClick={() => setShowHistory(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all font-bold shadow-sm">
          <MdHistory className="text-xl" /> Historial
        </button>
      </div>

      {/* TABS TIPO */}
      <div className="bg-gray-100 p-1.5 rounded-[2rem] md:rounded-full mb-8 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max md:w-full">
            {['reacciones', 'comentarios', 'puntos_extra'].map((tab) => {
                const isActive = activeTab === tab;
                let Icon = FaThumbsUp;
                if(tab === 'comentarios') Icon = FaCommentDots;
                if(tab === 'puntos_extra') Icon = FaGem;

                return (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`py-3 px-6 text-sm font-bold flex items-center justify-center gap-2 rounded-full transition-all whitespace-nowrap flex-1
                        ${isActive 
                            ? 'bg-white text-gray-900 shadow-md' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <Icon className="text-lg" />
                        <span className="capitalize">{tab.replace('_', ' ')}</span>
                    </button>
                )
            })}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="bg-white rounded-[2.5rem] shadow-sm p-6 md:p-10 min-h-[500px] transition-all relative">
        
        {(activeTab === 'reacciones' || activeTab === 'comentarios') && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Marca</label>
                <div className="relative">
                    <select value={marca} onChange={(e) => setMarca(e.target.value)} className="appearance-none w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-100 text-gray-800 font-bold cursor-pointer">
                    {Object.keys(PUNTOS_POR_MARCA).map(m => <option key={m} value={m}>{m} ({PUNTOS_POR_MARCA[m]} pts)</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><MdExpandMore className="text-2xl" /></div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Fecha Publicación</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-100 text-gray-800 font-bold [color-scheme:light]" />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">{activeTab === 'reacciones' ? 'Pegar Lista' : 'Pegar Comentarios'}</label>
              <textarea rows={8} value={textoInput} onChange={(e) => setTextoInput(e.target.value)} placeholder={activeTab === 'reacciones' ? 'Pegar tabla de reacciones...' : 'Pegar tabla de comentarios...'} className="w-full p-6 bg-gray-50 rounded-3xl border-none outline-none font-mono text-sm text-gray-700 resize-none focus:ring-2 focus:ring-blue-100 transition-all custom-scrollbar" />
              <button onClick={handlePaste} className="absolute top-10 right-4 p-3 bg-white rounded-xl text-gray-400 hover:text-blue-600 shadow-sm hover:shadow-md transition-all"><MdContentPaste className="text-xl" /></button>
            </div>
            
            <button onClick={analizarTexto} className={`w-full py-4 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all text-lg text-white ${activeTab === 'reacciones' ? 'bg-blue-600 shadow-blue-200' : 'bg-purple-600 shadow-purple-200'}`}>
                Analizar {activeTab}
            </button>
          </div>
        )}

        {/* VISTA 2: PUNTOS EXTRA */}
        {activeTab === 'puntos_extra' && (
           <div className="space-y-8 animate-fade-in">
              <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50">
                 <h3 className="text-emerald-800 font-extrabold text-lg mb-6 flex items-center gap-2"><MdAddCircle /> Seleccionar Colaboradores</h3>
                 
                 <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                    <div className="flex-1 w-full relative">
                        <label className="block text-xs font-bold text-emerald-600/70 mb-2 uppercase">Buscar</label>
                        <div className="relative">
                            <MdSearch className="absolute left-4 top-3.5 text-emerald-400 text-xl" />
                            <input type="text" value={busquedaExtra} onChange={(e) => setBusquedaExtra(e.target.value)} placeholder="Nombre del colaborador..." className="w-full pl-12 pr-4 py-3 border-none bg-white rounded-2xl outline-none focus:ring-2 focus:ring-emerald-200 text-gray-700 font-medium shadow-sm" />
                        </div>
                        {resultadosBusqueda.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-2xl mt-2 p-2 z-10 animate-fade-in">
                                {resultadosBusqueda.map(c => (
                                    <div key={c.id} onClick={() => agregarASeleccion(c)} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer rounded-xl flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-400">
                                            {c.foto ? <img src={c.foto} className="w-full h-full object-cover" /> : c.nombre.charAt(0)}
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">{c.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="w-full md:w-40">
                        <label className="block text-xs font-bold text-emerald-600/70 mb-2 uppercase">Puntos Globales</label>
                        <input type="number" value={puntosGlobales} onChange={(e) => setPuntosGlobales(e.target.value)} className="w-full px-4 py-3 border-none bg-white rounded-2xl outline-none focus:ring-2 focus:ring-emerald-200 text-center font-bold text-emerald-600 shadow-sm" />
                    </div>
                    <button onClick={aplicarPuntosATodos} className="w-full md:w-auto px-6 py-3 bg-emerald-100 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-200 text-sm whitespace-nowrap transition-colors">Aplicar a todos</button>
                 </div>

                 {seleccionados.length > 0 ? (
                     <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                         <div className="overflow-x-auto">
                             <table className="w-full text-sm">
                                 <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-xs"><tr><th className="px-6 py-3 text-left">Colaborador</th><th className="px-4 py-3 text-center w-32">Puntos</th><th className="px-4 py-3 text-right w-16"></th></tr></thead>
                                 <tbody className="divide-y divide-gray-50">
                                     {seleccionados.map((s) => (
                                         <tr key={s.id} className="group hover:bg-gray-50/50">
                                             <td className="px-6 py-3 font-bold text-gray-700 flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                     {s.foto ? <img src={s.foto} className="w-full h-full object-cover"/> : s.nombre.charAt(0)}
                                                 </div>
                                                 <span className="truncate max-w-[150px]">{s.nombre}</span>
                                             </td>
                                             <td className="px-4 py-3 text-center">
                                                 <input type="number" value={s.puntosAsignados} onChange={(e) => cambiarPuntosIndividual(s.id, e.target.value)} className="w-20 px-2 py-1 bg-gray-50 rounded-lg text-center outline-none font-bold text-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
                                             </td>
                                             <td className="px-4 py-3 text-right">
                                                 <button onClick={() => quitarDeSeleccion(s.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"><MdClose className="text-lg" /></button>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     </div>
                 ) : <div className="text-center py-12 text-gray-400 border-2 border-dashed border-emerald-100 rounded-3xl bg-white/50">Busca colaboradores arriba para comenzar.</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Marca</label>
                    <div className="relative">
                        <select value={marca} onChange={(e) => setMarca(e.target.value)} className="appearance-none w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 cursor-pointer">
                            {Object.keys(PUNTOS_POR_MARCA).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><MdExpandMore className="text-2xl" /></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Fecha</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 [color-scheme:light]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Motivo</label>
                    <div className="relative">
                        <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="appearance-none w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 cursor-pointer">
                            <option value="Participación">Participación</option>
                            <option value="Recomendación">Recomendación</option>
                            <option value="Compartido">Compartido</option>
                            <option value="Otro">Otro (Escribir manual)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><MdExpandMore className="text-2xl" /></div>
                    </div>
                  </div>
              </div>

              {motivo === 'Otro' && (
                  <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Especifique Motivo</label>
                      <input type="text" value={otroMotivo} onChange={(e) => setOtroMotivo(e.target.value)} placeholder="Ej: Empleado del Mes" className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 focus:ring-2 focus:ring-emerald-100" />
                  </div>
              )}

              <button onClick={guardarPuntosExtra} disabled={seleccionados.length === 0} className={`w-full py-4 font-extrabold rounded-2xl shadow-lg transition-all text-lg text-white flex items-center justify-center gap-2 ${seleccionados.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 hover:scale-[1.01]' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}>
                  <FaGem /> Confirmar y Asignar
              </button>
           </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {previewData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-2xl font-extrabold text-gray-800">Confirmar Carga</h3>
              <p className="text-gray-500 font-medium mt-1">{marca} • {previewData.encontrados.length} colaboradores detectados</p>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {previewData.encontrados.length > 0 ? (
                <table className="w-full text-sm text-left mb-8">
                    <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs rounded-xl">
                        <tr><th className="px-4 py-3 rounded-l-xl">Colaborador</th><th className="px-4 py-3">Usuario FB</th><th className="px-4 py-3 rounded-r-xl">Pts</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {previewData.encontrados.map((item, idx) => (
                            <tr key={idx}><td className="px-4 py-3 font-bold text-gray-800">{item.nombre}</td><td className="px-4 py-3 text-gray-500">{item.usuarioFb}</td><td className="px-4 py-3 font-bold text-green-600">+{item.puntosGanados}</td></tr>
                        ))}
                    </tbody>
                </table>
              ) : <div className="text-center py-10 bg-gray-50 rounded-2xl text-gray-400 font-bold">No se encontraron coincidencias válidas.</div>}
              
              {previewData.noEncontrados.length > 0 && (
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                  <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2"><MdWarning className="text-xl"/> No encontrados ({previewData.noEncontrados.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewData.noEncontrados.slice(0, 15).map((n, i) => <span key={i} className="px-3 py-1 bg-white border border-orange-200 rounded-lg text-xs text-orange-700 font-bold shadow-sm">{n}</span>)}
                    {previewData.noEncontrados.length > 15 && <span className="text-xs text-orange-600 pt-1 font-bold">...y más.</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button onClick={() => setPreviewData(null)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                <button onClick={confirmarCargaMasiva} disabled={previewData.encontrados.length === 0} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none">Confirmar Carga</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR HISTORIAL */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end backdrop-blur-sm transition-opacity" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><MdHistory /> Historial</h2>
              <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><MdClose className="text-xl" /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4 custom-scrollbar">
              {/* Filtrar historial: mostrar solo REACCIONES, COMENTARIOS, PUNTOS_EXTRA */}
              {historial && historial.filter(h => ['REACCIONES', 'COMENTARIOS', 'PUNTOS_EXTRA'].includes(h.tipo)).length > 0 ? (
                historial.filter(h => ['REACCIONES', 'COMENTARIOS', 'PUNTOS_EXTRA'].includes(h.tipo)).map((evento) => (
                  <div key={evento.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group relative"
                    onClick={() => setSelectedHistoryItem(selectedHistoryItem?.id === evento.id ? null : evento)}>
                    <button onClick={(e) => handleDeleteItem(e, evento.id)} className="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full" title="Borrar registro"><MdDeleteForever className="text-xl" /></button>
                    <div className="pr-8">
                      <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">{evento.fecha}</span>
                      <h4 className="font-extrabold text-gray-800 text-lg mt-2 mb-1">{evento.marca}</h4> 
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                          <span className="capitalize bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-xs font-bold">{evento.tipo.replace('_', ' ')}</span>
                          {/* PROTECCIÓN: Usamos || [] por si detalles no existe */}
                          <span>• {evento.cantidad || (evento.detalles || []).length} personas</span>
                      </div>
                    </div>
                    {/* Desglose al hacer clic (CON PROTECCIÓN AÑADIDA) */}
                    {selectedHistoryItem?.id === evento.id && (
                      <div className="mt-5 pt-4 border-t border-gray-100 animate-fade-in">
                        <ul className="space-y-2">
                            {/* PROTECCIÓN ADICIONAL: .slice() seguro */}
                            {(evento.detalles || []).slice(0, 10).map((det, i) => (
                                <li key={i} className="text-xs flex justify-between items-center text-gray-600 bg-gray-50 px-3 py-2 rounded-lg font-medium">
                                    <span>{det.nombre}</span>
                                    <span className="text-green-600 font-extrabold">+{det.puntosGanados} pts</span>
                                </li>
                            ))}
                            {(evento.detalles?.length || 0) > 10 && <li className="text-xs text-center text-gray-400 italic">...y {(evento.detalles.length - 10)} más</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : <div className="flex flex-col items-center justify-center h-64 text-gray-400 font-medium">No hay historial reciente.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}