/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/social/VistaLista.tsx (RESPONSIVE)       */
/* -------------------------------------------------------------------------- */
'use client';
import { MdEdit, MdImage } from "react-icons/md";
import { REDES } from './useSocialMedia';

const ESTADOS_LABEL = {
    'IDEA': { label: 'Idea', class: 'bg-yellow-100 text-yellow-700' },
    'DISENO': { label: 'Diseño', class: 'bg-purple-100 text-purple-700' },
    'APROBACION': { label: 'Revisión', class: 'bg-blue-100 text-blue-700' },
    'PROGRAMADO': { label: 'Programado', class: 'bg-indigo-100 text-indigo-700' },
    'PUBLICADO': { label: 'Publicado', class: 'bg-green-100 text-green-700' },
};

export default function VistaLista({ posts, onEditar }) {
  // Ordenar por fecha descendente
  const postsOrdenados = [...posts].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
        
        {/* --- VISTA DE ESCRITORIO (TABLA) --- */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Estado</th>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Fecha</th>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Red / Marca</th>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Contenido</th>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">Objetivo</th>
                        <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider w-20"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {postsOrdenados.map(post => {
                        const redData = REDES.find(r => r.id === post.red);
                        const estadoData = ESTADOS_LABEL[post.estado] || { label: post.estado, class: 'bg-gray-100' };

                        return (
                            <tr key={post.id} className="hover:bg-indigo-50/30 transition-colors group">
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${estadoData.class}`}>
                                        {estadoData.label}
                                    </span>
                                </td>
                                <td className="p-4 text-sm font-bold text-gray-600">
                                    {new Date(post.fecha).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${redData?.color}`}></div>
                                            <span className="text-xs font-bold text-gray-800">{redData?.label}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 uppercase font-black">{post.marca}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {post.imagen && <MdImage className="text-gray-300"/>}
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm line-clamp-1">{post.titulo}</p>
                                            <p className="text-xs text-gray-400">{post.tipo}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600 truncate max-w-[150px]">
                                    {post.objetivo || '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => onEditar(post)}
                                        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* --- VISTA MÓVIL (TARJETAS) --- */}
        <div className="md:hidden divide-y divide-gray-100">
            {postsOrdenados.map(post => {
                const redData = REDES.find(r => r.id === post.red);
                const estadoData = ESTADOS_LABEL[post.estado] || { label: post.estado, class: 'bg-gray-100' };

                return (
                    <div key={post.id} onClick={() => onEditar(post)} className="p-5 active:bg-gray-50 transition-colors">
                        {/* Cabecera Tarjeta */}
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${estadoData.class}`}>
                                {estadoData.label}
                            </span>
                            <span className="text-xs font-bold text-gray-400">
                                {new Date(post.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>

                        {/* Contenido Principal */}
                        <div className="flex gap-3 mb-3">
                            {/* Barra lateral de color */}
                            <div className={`w-1 self-stretch rounded-full ${redData?.color} shrink-0`}></div>
                            
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{post.titulo}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="font-medium">{redData?.label}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="font-black text-gray-400 uppercase text-[10px]">{post.marca}</span>
                                </div>
                            </div>
                            
                            {/* Thumbnail Imagen (si existe) */}
                            {post.imagen && (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                    <img src={post.imagen} className="w-full h-full object-cover opacity-80" alt="post"/>
                                </div>
                            )}
                        </div>

                        {/* Footer Tarjeta */}
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{post.tipo}</span>
                            <button className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                                <MdEdit className="text-sm"/> Editar
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
        
        {/* ESTADO VACÍO */}
        {posts.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
                No se encontraron publicaciones.
            </div>
        )}
    </div>
  );
}