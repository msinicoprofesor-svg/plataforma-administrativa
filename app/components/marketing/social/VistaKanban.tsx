/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/social/VistaKanban.tsx (SCROLL NATIVO)   */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdAdd, MdLightbulbOutline, MdPalette, MdVisibility, 
    MdCalendarToday, MdCheckCircle, MdDragIndicator, MdImage 
} from "react-icons/md";
import { REDES } from './useSocialMedia';

// Configuración de Columnas
const COLUMNAS = [
    { id: 'IDEA', titulo: 'Ideas', icono: <MdLightbulbOutline/>, color: 'bg-yellow-500' },
    { id: 'DISENO', titulo: 'Diseño', icono: <MdPalette/>, color: 'bg-purple-500' },
    { id: 'APROBACION', titulo: 'Revisión', icono: <MdVisibility/>, color: 'bg-blue-500' },
    { id: 'PROGRAMADO', titulo: 'Programado', icono: <MdCalendarToday/>, color: 'bg-indigo-600' },
    { id: 'PUBLICADO', titulo: 'Publicado', icono: <MdCheckCircle/>, color: 'bg-green-500' }
];

export default function VistaKanban({ posts, onMoverPost, onEditar }) {
    // Estado para controlar qué columna está expandida
    const [columnaActiva, setColumnaActiva] = useState('IDEA');

    // --- DRAG & DROP ---
    const handleDragStart = (e, postId) => {
        e.dataTransfer.setData('postId', postId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, nuevoEstado) => {
        e.preventDefault();
        const postId = e.dataTransfer.getData('postId');
        if (postId) {
            onMoverPost(postId, null, nuevoEstado);
            setColumnaActiva(nuevoEstado);
        }
    };

    return (
        // CONTENEDOR PRINCIPAL
        // Móvil: h-auto (Crece infinitamente)
        // Desktop: h-full (Se ajusta a la pantalla) + overflow-hidden (Scroll interno)
        <div className="flex flex-col md:flex-row gap-3 p-1 h-auto md:h-full md:overflow-hidden">
            {COLUMNAS.map(col => {
                const postsColumna = posts.filter(p => p.estado === col.id);
                const esActiva = columnaActiva === col.id;

                return (
                    <div 
                        key={col.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                        onClick={() => !esActiva && setColumnaActiva(col.id)}
                        className={`
                            transition-all duration-500 ease-in-out rounded-2xl border border-gray-100 flex shadow-sm
                            ${esActiva 
                                // ACTIVA: 
                                // Móvil: h-auto (Deja que los items estiren la caja)
                                // Desktop: flex-1 h-full (Ocupa el espacio restante y fija la altura)
                                ? 'bg-gray-50 flex-col h-auto md:h-full md:flex-1' 
                                // INACTIVA:
                                // Móvil: h-16 (Tira compacta)
                                // Desktop: w-20 h-full (Tira vertical)
                                : 'h-16 shrink-0 bg-white hover:bg-gray-50 cursor-pointer flex-row items-center md:flex-col md:h-full md:w-20' 
                            }
                        `}
                    >
                        {/* HEADER DE COLUMNA */}
                        <div className={`
                            flex gap-3 
                            ${esActiva 
                                ? 'p-4 flex-row items-center w-full shrink-0' 
                                : 'w-full h-full p-0 md:pt-8 flex-row md:flex-col items-center md:justify-start justify-between px-4'
                            }
                        `}>
                            
                            {/* GRUPO ICONO + TITULO */}
                            <div className={`flex items-center gap-3 ${esActiva ? 'flex-row' : 'flex-row md:flex-col'}`}>
                                {/* Icono */}
                                <div className={`p-2 rounded-xl text-white shadow-md text-lg shrink-0 ${col.color}`}>
                                    {col.icono}
                                </div>
                                
                                {/* Título */}
                                {esActiva ? (
                                    <div className="flex-1 animate-fade-in">
                                        <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">{col.titulo}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold">{postsColumna.length} tareas</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Título Móvil (Horizontal) */}
                                        <span className="md:hidden text-xs font-black text-gray-600 uppercase tracking-wide">{col.titulo}</span>
                                        
                                        {/* Título Escritorio (Vertical) */}
                                        <div style={{ writingMode: 'vertical-rl' }} className="hidden md:flex rotate-180 items-center justify-center py-4">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{col.titulo}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Contador Flotante (Solo visible colapsado) */}
                            {!esActiva && (
                                <div className="bg-gray-100 text-gray-600 font-black text-xs w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 md:mt-auto md:mb-4">
                                    {postsColumna.length}
                                </div>
                            )}
                        </div>

                        {/* LISTA DE TAREAS (Solo visible si está expandida) */}
                        {esActiva && (
                            // CONTENEDOR DE ITEMS
                            // Móvil: Sin overflow-y (El scroll es de la página completa)
                            // Desktop: flex-1 + overflow-y-auto (Scroll interno confinado)
                            <div className="w-full px-4 pb-4 space-y-3 animate-fade-in md:flex-1 md:overflow-y-auto custom-scrollbar">
                                {postsColumna.map(post => {
                                    const redData = REDES.find(r => r.id === post.red);
                                    return (
                                        <div 
                                            key={post.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, post.id)}
                                            onClick={(e) => { e.stopPropagation(); onEditar(post); }}
                                            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden flex gap-3"
                                        >
                                            {/* Línea de color de la red */}
                                            <div className={`w-1 self-stretch rounded-full ${redData?.color || 'bg-gray-300'} shrink-0`}></div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{post.marca}</span>
                                                    {post.imagen && <MdImage className="text-gray-300"/>}
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-800 leading-tight mb-2 line-clamp-2">{post.titulo}</h4>
                                                
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {new Date(post.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                    <MdDragIndicator className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm"/>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {postsColumna.length === 0 && (
                                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-300 text-xs font-bold gap-2">
                                        <MdAdd className="text-2xl opacity-50"/>
                                        <span>Arrastra aquí</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}