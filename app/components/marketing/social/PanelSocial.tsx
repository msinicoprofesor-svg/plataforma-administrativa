/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/social/PanelSocial.tsx (INTEGRACIÓN FINAL) */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdAdd, MdCalendarMonth, MdViewKanban, MdList } from "react-icons/md";
import { useSocialMedia } from './useSocialMedia';
import ModalPost from './ModalPost';

// --- IMPORTACIÓN DE LAS 3 VISTAS POTENCIADAS ---
import VistaCalendario from './VistaCalendario';
import VistaKanban from './VistaKanban';
import VistaLista from './VistaLista';

export default function PanelSocial({ usuario }) {
    const { posts, agregarPost, actualizarPost, eliminarPost, moverPost } = useSocialMedia();
    
    // Estado de la vista actual
    const [vista, setVista] = useState('CALENDARIO'); 
    
    // Estados del Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [postEditando, setPostEditando] = useState(null);

    // --- MANEJADORES ---
    const handleGuardar = (post) => {
        if (postEditando) {
            actualizarPost({ ...postEditando, ...post });
        } else {
            agregarPost(post);
        }
    };

    const abrirEditar = (post) => {
        setPostEditando(post);
        setModalOpen(true);
    };

    const abrirNuevo = () => {
        setPostEditando(null);
        setModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in bg-[#F6F8FA] rounded-[2.5rem] overflow-hidden shadow-xl">
            
            {/* --- HEADER --- */}
            <div className="bg-white px-6 py-5 md:px-8 md:py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Social Media Manager</h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Planificador de Contenidos</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                    <button onClick={() => setVista('LISTA')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${vista === 'LISTA' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdList className="text-lg"/> <span className="hidden sm:inline">Lista</span>
                    </button>
                    <button onClick={() => setVista('KANBAN')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${vista === 'KANBAN' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdViewKanban className="text-lg"/> <span className="hidden sm:inline">Kanban</span>
                    </button>
                    <button onClick={() => setVista('CALENDARIO')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${vista === 'CALENDARIO' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdCalendarMonth className="text-lg"/> <span className="hidden sm:inline">Calendario</span>
                    </button>
                </div>

                <button onClick={abrirNuevo} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2 active:scale-95">
                    <MdAdd className="text-xl"/> <span className="hidden md:inline">Crear Post</span> <span className="md:hidden">Nuevo</span>
                </button>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            <div className="flex-1 overflow-hidden p-2 md:p-6 relative">
                
                {/* 1. VISTA CALENDARIO (Refinado con Grid Fijo + Panel Lateral) */}
                {vista === 'CALENDARIO' && (
                    <VistaCalendario 
                        posts={posts}
                        onMoverPost={moverPost}
                        onEditar={abrirEditar}
                    />
                )}

                {/* 2. VISTA KANBAN (Refinado con Acordeón Vertical en Móvil) */}
                {vista === 'KANBAN' && (
                    <div className="h-full overflow-y-auto custom-scrollbar md:overflow-hidden">
                        <VistaKanban 
                            posts={posts}
                            onMoverPost={moverPost}
                            onEditar={abrirEditar}
                        />
                    </div>
                )}

                {/* 3. VISTA LISTA (Refinado con Tarjetas en Móvil) */}
                {vista === 'LISTA' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <VistaLista 
                            posts={posts}
                            onEditar={abrirEditar}
                        />
                    </div>
                )}

                {/* Estado Vacío Global (Si no hay posts y no es calendario) */}
                {posts.length === 0 && vista !== 'CALENDARIO' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
                        <p className="font-bold text-lg">Tu agenda está vacía</p>
                        <p className="text-sm">¡Comienza creando tu primer post!</p>
                    </div>
                )}
            </div>

            {/* --- MODAL FLOTANTE --- */}
            <ModalPost 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleGuardar}
                onDelete={eliminarPost}
                postEditar={postEditando}
            />
        </div>
    );
}