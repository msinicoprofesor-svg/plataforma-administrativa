/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/estudios/DashboardResultados.tsx         */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
  MdArrowBack, MdAccessTime, MdPeople, MdTrendingUp, MdPostAdd, MdAutoAwesome 
} from "react-icons/md";

// Importamos el Modal de IA
import ModalAnalisisIA from './ModalAnalisisIA';

// Importamos el Editor (que ahora recibe 'usuario')
import EditorReporte from './EditorReporte'; 

// Paleta de Colores
const GRADIENTS = [
  'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
];

// ⚠️ NOTA: Agregamos 'usuario' a las props
export default function DashboardResultados({ encuesta, respuestas, onAtras, usuario }) {
  const [showIA, setShowIA] = useState(false); // Estado para el Modal IA
  const [modoEditor, setModoEditor] = useState(false); // Estado para el Editor de Reportes

  // --- PROCESAMIENTO DE DATOS ---
  const estadisticas = useMemo(() => {
      const respuestasEncuesta = respuestas.filter(r => r.encuestaId === encuesta.id);
      const total = respuestasEncuesta.length;
      const hoy = new Date().toLocaleDateString();
      const respuestasHoy = respuestasEncuesta.filter(r => new Date(r.metadata?.fecha).toLocaleDateString() === hoy).length;

      const analisisPreguntas = encuesta.preguntas.map(p => {
          const conteos = {};
          let totalValidas = 0;

          respuestasEncuesta.forEach(r => {
              const valor = r.datos[p.id];
              if (!valor) return; 

              if (Array.isArray(valor)) {
                  valor.forEach(v => { conteos[v] = (conteos[v] || 0) + 1; });
                  totalValidas++;
              } else {
                  conteos[valor] = (conteos[valor] || 0) + 1;
                  totalValidas++;
              }
          });

          const datosGrafico = Object.entries(conteos)
              .map(([label, count], index) => ({ 
                  label, 
                  count: Number(count), 
                  porcentaje: total > 0 ? Math.round((Number(count) / total) * 100) : 0,
                  gradient: GRADIENTS[index % GRADIENTS.length],
              }))
              .sort((a, b) => b.count - a.count);

          let currentDeg = 0;
          const gradientSegments = datosGrafico.map(d => {
              const deg = (d.count / total) * 360;
              const color = d.gradient.includes('#6366F1') ? '#6366F1' : 
                            d.gradient.includes('#3B82F6') ? '#3B82F6' :
                            d.gradient.includes('#F59E0B') ? '#F59E0B' : '#10B981';
              const segment = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
              currentDeg += deg;
              return segment;
          });
          
          const cssConic = datosGrafico.length > 0 
              ? `conic-gradient(${gradientSegments.join(', ')})`
              : 'conic-gradient(#f3f4f6 0deg 360deg)';

          return { ...p, datosGrafico, cssConic, totalValidas };
      });

      return { total, respuestasHoy, analisisPreguntas };
  }, [encuesta, respuestas]);

  // --- MODO EDITOR (AHORA CONECTADO CON USUARIO) ---
  if (modoEditor) {
      return (
          <EditorReporte 
              encuesta={encuesta} 
              respuestas={respuestas} 
              onVolver={() => setModoEditor(false)} 
              usuario={usuario} // <--- ¡AQUÍ ESTÁ LA CONEXIÓN!
          />
      );
  }

  return (
    <>
        <div className="bg-[#F6F8FA] rounded-[2.5rem] h-full flex flex-col shadow-2xl overflow-hidden animate-fade-in font-sans">
            
            {/* HEADER */}
            <div className="bg-white/80 backdrop-blur-md px-8 py-6 flex justify-between items-center sticky top-0 z-20 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={onAtras} className="p-3 bg-white rounded-2xl text-gray-400 hover:text-gray-800 hover:shadow-lg transition-all border border-gray-50">
                        <MdArrowBack className="text-xl"/>
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">{encuesta.titulo}</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Dashboard de Resultados</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* BOTÓN IA */}
                    <button 
                        onClick={() => setShowIA(true)}
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5"
                    >
                        <MdAutoAwesome className="text-lg animate-pulse"/> Insights IA
                    </button>

                    {/* BOTÓN REDACTAR INFORME */}
                    <button 
                        onClick={() => setModoEditor(true)}
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all"
                    >
                        <MdPostAdd className="text-lg"/> Redactar Informe
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Muestra Total</p>
                            <h3 className="text-3xl font-black text-gray-800">{estadisticas.total}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-2xl shadow-sm">
                            <MdPeople/>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Meta Objetiva</p>
                            <h3 className="text-3xl font-black text-gray-800">{encuesta.estrategia?.muestraObjetivo || 'N/A'}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 text-2xl shadow-sm">
                            <MdAccessTime/>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col justify-center">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Completado</p>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (estadisticas.total / (encuesta.estrategia?.muestraObjetivo || 1)) * 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                    {estadisticas.analisisPreguntas.map((p, index) => (
                        <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-50">
                            
                            <div className="mb-6">
                                <h3 className="text-lg font-extrabold text-gray-800 leading-tight">{p.texto}</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Pregunta {index + 1}</p>
                            </div>

                            {(p.tipo === 'OPCION_MULTIPLE' || p.tipo === 'DESPLEGABLE') && (
                                <div className="flex flex-col sm:flex-row items-center gap-10">
                                    <div className="relative w-40 h-40 shrink-0">
                                        <div className="w-full h-full rounded-full" style={{ background: p.cssConic }}></div>
                                        <div className="absolute inset-5 bg-white rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                                            <span className="text-2xl font-black text-gray-800">{p.datosGrafico.length > 0 ? p.datosGrafico[0].porcentaje : 0}%</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full space-y-2">
                                        {p.datosGrafico.map((d, i) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ background: d.gradient }}></span>
                                                    <span className="text-xs font-bold text-gray-600">{d.label}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-800">{d.count} ({d.porcentaje}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {p.tipo === 'CASILLAS' && (
                                <div className="space-y-3">
                                    {p.datosGrafico.map((d, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span>{d.label}</span>
                                                <span>{d.porcentaje}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${d.porcentaje}%`, background: d.gradient }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {p.tipo === 'TEXTO_CORTO' && (
                                <div className="flex flex-wrap gap-2">
                                    {p.datosGrafico.slice(0, 10).map((d, i) => (
                                        <span key={i} className="bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-xs text-gray-600">
                                            {d.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* MODAL IA RESTAURADO */}
        <ModalAnalisisIA 
            isOpen={showIA} 
            onClose={() => setShowIA(false)} 
            encuesta={encuesta} 
            respuestas={respuestas} 
        />
    </>
  );
}