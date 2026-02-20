/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/estudios/ModalAnalisisIA.tsx (UNIVERSAL) */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { 
  MdAutoAwesome, MdClose, MdTrendingUp, MdWarning, MdCheckCircle, MdLightbulbOutline
} from "react-icons/md";

// Palabras clave SOLO para detectar "Salud" (Negatividad genérica), no para el análisis principal.
const NEGATIVE_FLAGS = ['malo', 'pésimo', 'no', 'nunca', 'falla', 'lento', 'caro', 'terrible', 'insatisfecho', 'baja', 'ninguno', 'peor', 'nadie'];

export default function ModalAnalisisIA({ isOpen, onClose, encuesta, respuestas }) {
  const [analizando, setAnalizando] = useState(true);
  const [resultado, setResultado] = useState(null);

  // --- MOTOR DE ANÁLISIS ESTADÍSTICO (UNIVERSAL) ---
  useEffect(() => {
    if (isOpen) {
      setAnalizando(true);
      const timer = setTimeout(() => {
        procesarEstadisticas();
        setAnalizando(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, respuestas]);

  const procesarEstadisticas = () => {
    const data = respuestas.filter(r => r.encuestaId === encuesta.id);
    const total = data.length;

    if (total === 0) {
        setResultado({ error: "Sin datos para analizar." });
        return;
    }

    // 1. Encontrar patrones dominantes (La opción más votada de cada pregunta)
    let hallazgos = [];
    let scoreNegativo = 0; // Contador de respuestas con connotación negativa
    let preguntasCerradas = 0;

    encuesta.preguntas.forEach(p => {
        // Solo analizamos preguntas donde se puede contar (Opciones)
        if (p.tipo === 'OPCION_MULTIPLE' || p.tipo === 'DESPLEGABLE' || p.tipo === 'CASILLAS') {
            preguntasCerradas++;
            const conteos = {};
            
            data.forEach(r => {
                const val = r.datos[p.id];
                if (val) {
                    const valores = Array.isArray(val) ? val : [val];
                    valores.forEach(v => {
                        conteos[v] = (conteos[v] || 0) + 1;
                        // Detección simple de salud del estudio
                        if (NEGATIVE_FLAGS.some(flag => String(v).toLowerCase().includes(flag))) {
                            scoreNegativo++;
                        }
                    });
                }
            });

            // Ordenamos para encontrar al ganador estadístico
            const opcionesOrdenadas = Object.entries(conteos).sort((a, b) => b[1] - a[1]);
            
            if (opcionesOrdenadas.length > 0) {
                const ganador = opcionesOrdenadas[0]; // [NombreOpción, Cantidad]
                const porcentaje = Math.round((ganador[1] / total) * 100);
                
                // Solo reportamos si es una mayoría significativa (>30%) para que sea relevante
                if (porcentaje > 30) {
                    hallazgos.push({
                        pregunta: p.texto,
                        opcion: ganador[0],
                        porcentaje: porcentaje
                    });
                }
            }
        }
    });

    // 2. Generar Diagnóstico Narrativo (Basado en datos, no en temas)
    let conclusion = "";
    if (hallazgos.length > 0) {
        // Ordenamos hallazgos por impacto (porcentaje más alto primero)
        hallazgos.sort((a, b) => b.porcentaje - a.porcentaje);
        const top = hallazgos[0];
        
        // Redacción universal agnóstica del tema
        conclusion = `El dato más contundente es que el ${top.porcentaje}% de la muestra coincide en elegir "${top.opcion}" para el punto: "${top.pregunta}". `;
        
        if (hallazgos.length > 1) {
            conclusion += `Asimismo, existe un consenso claro (${hallazgos[1].porcentaje}%) hacia la opción "${hallazgos[1].opcion}" en su respectiva categoría.`;
        }
    } else {
        conclusion = "Las respuestas presentan una alta dispersión. No se observa una tendencia mayoritaria clara que defina un comportamiento grupal único.";
    }

    // 3. Score de Salud (Indica si la gente está 'feliz' o 'molesta' en general)
    const factorNegativo = total > 0 && preguntasCerradas > 0 
        ? Math.round((scoreNegativo / (total * preguntasCerradas)) * 100) 
        : 0;
        
    // Base 100, restamos negatividad.
    const scoreSalud = Math.max(0, 100 - factorNegativo);

    let etiquetaSalud = "Positiva";
    let colorSalud = "text-green-600";
    
    if (scoreSalud < 60) {
        etiquetaSalud = "Crítica"; // Muchas respuestas negativas detectadas
        colorSalud = "text-red-600";
    } else if (scoreSalud < 85) {
        etiquetaSalud = "Estable"; // Mezcla de opiniones
        colorSalud = "text-yellow-600";
    }

    setResultado({
        scoreSalud,
        etiquetaSalud,
        colorSalud,
        conclusion,
        totalProcesado: total,
        hallazgos: hallazgos.slice(0, 4) // Top 4 insights
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="relative bg-gray-900 p-6 text-white overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                        <MdAutoAwesome className="text-2xl text-green-400 animate-pulse"/>
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tight">Insights IA</h3>
                        <p className="text-xs text-gray-400 font-medium">Análisis de patrones estadísticos</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <MdClose/>
                </button>
            </div>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
            {analizando ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-500 animate-pulse">Procesando datos...</p>
                </div>
            ) : resultado?.error ? (
                <div className="text-center py-10 text-gray-400">{resultado.error}</div>
            ) : (
                <div className="space-y-6 animate-slide-up">
                    
                    {/* 1. SCORE CARD */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recepción General</p>
                            <h2 className={`text-3xl font-black ${resultado.colorSalud}`}>{resultado.etiquetaSalud}</h2>
                            <p className="text-xs text-gray-400 mt-1">Índice de Aceptación: {resultado.scoreSalud}/100</p>
                        </div>
                        <div className="text-4xl">
                            {resultado.scoreSalud > 70 ? <MdCheckCircle className="text-green-500"/> : <MdWarning className="text-yellow-500"/>}
                        </div>
                    </div>

                    {/* 2. DIAGNÓSTICO NARRATIVO */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[2rem] border border-indigo-100 relative">
                        <MdLightbulbOutline className="absolute top-6 right-6 text-indigo-300 text-2xl"/>
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Interpretación Automática</h4>
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">
                            "{resultado.conclusion}"
                        </p>
                    </div>

                    {/* 3. LISTA DE HALLAZGOS */}
                    {resultado.hallazgos.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <MdTrendingUp/> Tendencias Clave
                            </h4>
                            <div className="space-y-3">
                                {resultado.hallazgos.map((h, i) => (
                                    <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
                                        <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded-lg shrink-0 h-fit">
                                            {h.porcentaje}%
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800 line-clamp-2">"{h.opcion}"</p>
                                            <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">En: {h.pregunta}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* FOOTER */}
        {!analizando && (
            <div className="p-6 bg-white border-t border-gray-100">
                <button onClick={onClose} className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg shadow-gray-200 active:scale-[0.98]">
                    Entendido
                </button>
            </div>
        )}
      </div>
    </div>
  );
}