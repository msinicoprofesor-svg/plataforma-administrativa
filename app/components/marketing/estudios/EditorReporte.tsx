/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/estudios/EditorReporte.tsx (PORTAL FIX)  */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MdArrowBack, MdPrint, MdEditNote, MdPerson
} from "react-icons/md";

// Paleta de Colores
const GRADIENTS = [
  'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
];

export default function EditorReporte({ encuesta, respuestas, onVolver, usuario }) {
  const [resumenEjecutivo, setResumenEjecutivo] = useState('');
  const [comentarios, setComentarios] = useState({}); 
  const [cargandoIA, setCargandoIA] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // --- 1. LÓGICA DE ESTADÍSTICAS ---
  const estadisticas = useMemo(() => {
      const respuestasEncuesta = respuestas.filter(r => r.encuestaId === encuesta.id);
      const total = respuestasEncuesta.length;

      const analisisPreguntas = encuesta.preguntas.map(p => {
          const conteos = {};
          respuestasEncuesta.forEach(r => {
              const valor = r.datos[p.id];
              if (!valor) return; 
              if (Array.isArray(valor)) {
                  valor.forEach(v => { conteos[v] = (conteos[v] || 0) + 1; });
              } else {
                  conteos[valor] = (conteos[valor] || 0) + 1;
              }
          });

          const datosGrafico = Object.entries(conteos)
              .map(([label, count], index) => ({ 
                  label, 
                  count: Number(count), 
                  porcentaje: total > 0 ? Math.round((Number(count) / total) * 100) : 0,
                  gradient: GRADIENTS[index % GRADIENTS.length],
                  color: ['#6366F1', '#3B82F6', '#F59E0B', '#10B981'][index % 4]
              }))
              .sort((a, b) => b.count - a.count);

          let currentDeg = 0;
          const gradientSegments = datosGrafico.map(d => {
              const deg = (d.count / total) * 360;
              const segment = `${d.color} ${currentDeg}deg ${currentDeg + deg}deg`;
              currentDeg += deg;
              return segment;
          });
          const cssConic = datosGrafico.length > 0 ? `conic-gradient(${gradientSegments.join(', ')})` : 'conic-gradient(#f3f4f6 0deg 360deg)';

          return { ...p, datosGrafico, cssConic };
      });

      return { total, analisisPreguntas };
  }, [encuesta, respuestas]);

  // --- 2. IA NARRATIVA ---
  useEffect(() => {
    const generarNarrativa = () => {
        if (estadisticas.total === 0) {
            setResumenEjecutivo("Se requieren datos para generar el análisis.");
            setCargandoIA(false);
            return;
        }

        let texto = `Informe de resultados basado en una muestra de ${estadisticas.total} encuestas realizadas en ${encuesta.comunidad?.comunidad || 'la zona'}. \n\nA continuación, se presentan los hallazgos estadísticos más relevantes:\n\n`;

        estadisticas.analisisPreguntas.forEach(p => {
            const topOption = p.datosGrafico[0];
            if (topOption) {
                if (topOption.porcentaje >= 50) {
                    texto += `• Para "${p.texto}", existe una mayoría absoluta (${topOption.porcentaje}%) que prefiere: "${topOption.label}".\n`;
                } else if (topOption.porcentaje > 30) {
                    texto += `• En cuanto a "${p.texto}", la tendencia predominante (${topOption.porcentaje}%) se inclina hacia: "${topOption.label}".\n`;
                }
            }
        });

        texto += `\nConclusión: Los datos sugieren una clara preferencia hacia las opciones mayoritarias destacadas anteriormente.`;

        setResumenEjecutivo(texto);
        setCargandoIA(false);
    };

    generarNarrativa();
  }, [estadisticas, encuesta]);

  // --- COMPONENTE INTERNO: EL CONTENIDO DEL REPORTE ---
  // Este componente se usa tanto en el Editor como en el Portal de Impresión
  const ReportContent = ({ isPrintVersion = false }) => (
    <div className={`bg-white w-full max-w-4xl min-h-[1123px] shadow-2xl p-10 md:p-16 ${isPrintVersion ? 'shadow-none w-full max-w-none p-0 m-0' : ''}`}>
        
        {/* ENCABEZADO */}
        <header className="border-b-2 border-gray-900 pb-6 mb-8 flex justify-between items-end">
            <div className="w-3/4">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 uppercase leading-tight">{encuesta.titulo}</h1>
                <p className="text-gray-500 font-medium">Reporte de Viabilidad de Mercado</p>
            </div>
            <div className="text-right w-1/4">
                <div className="mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Analista</p>
                    <p className="text-sm font-bold text-gray-800 flex items-center justify-end gap-1">
                        <MdPerson className="text-gray-400"/> {usuario?.nombre || 'Admin'}
                    </p>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Fecha</p>
                <p className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString()}</p>
            </div>
        </header>

        {/* SECCIÓN 1: RESUMEN */}
        <section className="mb-12 break-inside-avoid">
            <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-wide">1. Resumen Ejecutivo</h2>
            </div>
            
            <div className={`bg-gray-50 p-6 rounded-2xl border border-gray-100 ${isPrintVersion ? 'bg-transparent border-none p-0' : ''}`}>
                {isPrintVersion ? (
                    // VERSIÓN IMPRESA: Texto plano
                    <div className="text-gray-700 font-medium text-justify leading-relaxed whitespace-pre-wrap text-sm">
                        {resumenEjecutivo}
                    </div>
                ) : (
                    // VERSIÓN EDITOR: Textarea
                    <textarea 
                        value={resumenEjecutivo}
                        onChange={(e) => setResumenEjecutivo(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-gray-700 font-medium text-justify leading-relaxed resize-none h-64"
                        placeholder="Generando análisis..."
                    />
                )}
            </div>
        </section>

        {/* KPI GRID */}
        <section className="mb-12 grid grid-cols-3 gap-6 break-inside-avoid">
            <div className="border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Muestra</p>
                <p className="text-3xl font-black text-gray-800">{estadisticas.total}</p>
            </div>
            <div className={`border border-gray-200 rounded-xl p-4 text-center ${isPrintVersion ? 'text-black border-2 border-black' : 'bg-gray-900 text-white'}`}>
                <p className="text-[10px] font-black uppercase">Meta</p>
                <p className="text-3xl font-black">{encuesta.estrategia?.muestraObjetivo || '-'}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Avance</p>
                <p className="text-3xl font-black text-green-600">{Math.round((estadisticas.total / (encuesta.estrategia?.muestraObjetivo || 1)) * 100)}%</p>
            </div>
        </section>

        {/* SECCIÓN 2: DETALLE */}
        <section>
            <div className="flex items-center gap-2 mb-8 break-before-page">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-wide">2. Análisis Detallado</h2>
            </div>

            <div className="space-y-10">
                {estadisticas.analisisPreguntas.map((p, index) => (
                    <div key={p.id} className="break-inside-avoid page-break-auto mb-8">
                        <div className="mb-4">
                            <span className="text-xs font-bold text-gray-400 uppercase">Pregunta {index + 1}</span>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{p.texto}</h3>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* GRÁFICA */}
                            <div className="w-full md:w-1/3 shrink-0">
                                {(p.tipo === 'OPCION_MULTIPLE' || p.tipo === 'DESPLEGABLE') ? (
                                    <div className="flex flex-col items-center">
                                        <div className="relative w-32 h-32 mb-4">
                                            <div className="w-full h-full rounded-full" style={{ background: p.cssConic, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}></div>
                                            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                                                <span className="text-sm font-black text-gray-800">{p.datosGrafico[0]?.porcentaje || 0}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-2">
                                            {p.datosGrafico.map((d, i) => (
                                                <div key={i} className="flex justify-between items-start text-[10px]">
                                                    <div className="flex items-center gap-1.5 max-w-[80%]">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}></span>
                                                        <span className="font-bold text-gray-600 leading-tight text-left">{d.label}</span>
                                                    </div>
                                                    <span className="text-gray-900 font-bold">{d.porcentaje}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full space-y-3">
                                        {p.datosGrafico.map((d, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                                    <span className="max-w-[85%] leading-tight text-left">{d.label}</span>
                                                    <span>{d.count}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gray-800" style={{ width: `${d.porcentaje}%`, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* COMENTARIOS */}
                            <div className="flex-1 w-full">
                                {isPrintVersion ? (
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-2 p-4 border-l-4 border-indigo-100 bg-gray-50/50">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Nota del Analista:</p>
                                        {comentarios[p.id] || <span className="text-gray-400 italic">Sin notas adicionales.</span>}
                                    </div>
                                ) : (
                                    <>
                                        <label className="text-[10px] font-bold text-indigo-500 uppercase mb-1 block">
                                            Interpretación del Analista:
                                        </label>
                                        <textarea 
                                            className="w-full bg-indigo-50/30 border border-indigo-100 rounded-xl p-4 text-sm text-gray-700 min-h-[120px] focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                                            placeholder="Escribe tu interpretación..."
                                            value={comentarios[p.id] || ''}
                                            onChange={(e) => setComentarios({...comentarios, [p.id]: e.target.value})}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                        <hr className="border-gray-100 mt-8"/>
                    </div>
                ))}
            </div>
        </section>

        <footer className="mt-10 text-center pt-6">
            <p className="text-[10px] text-gray-400">Documento generado por Plataforma Inteligente</p>
        </footer>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-full p-4 md:p-8 flex flex-col items-center animate-fade-in">
        
        {/* BARRA DE HERRAMIENTAS (Visible en Pantalla) */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-6">
            <button onClick={onVolver} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 text-gray-600 font-bold transition-all">
                <MdArrowBack/> Volver
            </button>
            <div className="flex gap-3">
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-2">
                   {cargandoIA ? 'Analizando...' : <><MdEditNote className="text-lg"/> Modo Edición</>}
                </div>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black font-bold transition-all">
                    <MdPrint/> Imprimir PDF
                </button>
            </div>
        </div>

        {/* MODO EDICIÓN (Visible en Pantalla) */}
        <ReportContent isPrintVersion={false} />

        {/* MODO IMPRESIÓN (Portal Oculto en Pantalla / Visible al Imprimir) */}
        {mounted && createPortal(
            <div id="portal-impresion" className="hidden print:block">
                <ReportContent isPrintVersion={true} />
            </div>,
            document.body
        )}

        {/* CSS DE MAGIA OSCURA PARA OCULTAR TODO EXCEPTO EL PORTAL */}
        <style jsx global>{`
            @media print {
                /* 1. OCULTAR TODO LO QUE NO SEA EL PORTAL */
                body > *:not(#portal-impresion) {
                    display: none !important;
                }

                /* 2. REINICIAR EL BODY PARA QUE FLUYA */
                html, body {
                    height: auto !important;
                    overflow: visible !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* 3. MOSTRAR Y ESTILAR EL PORTAL */
                #portal-impresion {
                    display: block !important;
                    position: static !important; /* CLAVE: Flujo natural, no absolute */
                    width: 100% !important;
                    height: auto !important;
                    overflow: visible !important;
                }

                /* Ajustes finos */
                .page-break-auto { page-break-inside: avoid; }
                .break-inside-avoid { break-inside: avoid; }
            }
        `}</style>
    </div>
  );
}