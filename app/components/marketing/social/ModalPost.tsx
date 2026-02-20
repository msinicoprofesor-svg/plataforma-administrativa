/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/social/ModalPost.tsx                     */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect, useRef } from 'react';
import { MdClose, MdSave, MdDelete, MdImage, MdCloudUpload } from "react-icons/md";
import { MARCAS, REDES } from './useSocialMedia';

export default function ModalPost({ isOpen, onClose, onSave, postEditar, onDelete }) {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        titulo: '', marca: 'DMG NET', red: 'FACEBOOK', tipo: 'IMAGEN', 
        fecha: new Date().toISOString().split('T')[0], 
        objetivo: '', notas: '', imagen: null
    });

    useEffect(() => {
        if (postEditar) {
            setFormData(postEditar);
        } else {
            setFormData({
                titulo: '', marca: 'DMG NET', red: 'FACEBOOK', tipo: 'IMAGEN', 
                fecha: new Date().toISOString().split('T')[0], 
                objetivo: '', notas: '', imagen: null
            });
        }
    }, [postEditar, isOpen]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imagen: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* HEADER */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-black text-gray-800">
                        {postEditar ? 'Editar Contenido' : 'Nueva Publicación'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><MdClose/></button>
                </div>

                {/* BODY SCROLLABLE */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    
                    {/* TÍTULO */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Título / Idea</label>
                        <input 
                            type="text" required autoFocus
                            className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:border-indigo-300"
                            value={formData.titulo}
                            onChange={e => setFormData({...formData, titulo: e.target.value})}
                            placeholder="Ej. Post San Valentín"
                        />
                    </div>

                    {/* MARCA Y FECHA */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Marca</label>
                            <select 
                                className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none border border-transparent focus:bg-white focus:border-gray-200 transition-all cursor-pointer"
                                value={formData.marca}
                                onChange={e => setFormData({...formData, marca: e.target.value})}
                            >
                                {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Fecha de Publicación</label>
                            <input 
                                type="date" required
                                className="w-full p-3 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none border border-transparent focus:bg-white focus:border-gray-200 transition-all"
                                value={formData.fecha}
                                onChange={e => setFormData({...formData, fecha: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* RED SOCIAL */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Red Social</label>
                        <div className="flex gap-2 flex-wrap">
                            {REDES.map(red => (
                                <button
                                    key={red.id} type="button"
                                    onClick={() => setFormData({...formData, red: red.id})}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                        formData.red === red.id 
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-500' 
                                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {red.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SUBIR IMAGEN */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Multimedia</label>
                        <div 
                            onClick={() => fileInputRef.current.click()}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-200 transition-all group relative overflow-hidden"
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            
                            {formData.imagen ? (
                                <div className="relative w-full h-32">
                                    <img src={formData.imagen} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-bold flex items-center gap-1"><MdCloudUpload className="text-lg"/> Cambiar Imagen</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="bg-gray-100 text-gray-400 p-3 rounded-full inline-flex mb-2 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                        <MdImage className="text-2xl" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500">Haz clic para subir imagen</p>
                                    <p className="text-[10px] text-gray-400">JPG, PNG (Max 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TIPO Y OBJETIVO */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Detalles</label>
                        <div className="flex gap-2">
                            <select 
                                className="w-1/3 p-3 bg-gray-50 rounded-xl font-bold text-gray-700 text-sm outline-none border border-transparent focus:bg-white focus:border-gray-200"
                                value={formData.tipo}
                                onChange={e => setFormData({...formData, tipo: e.target.value})}
                            >
                                <option value="IMAGEN">Imagen</option>
                                <option value="REEL">Reel / Video</option>
                                <option value="CARRUSEL">Carrusel</option>
                                <option value="STORY">Historia</option>
                            </select>
                            <input 
                                type="text" 
                                className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-gray-700 text-sm outline-none border border-transparent focus:bg-white focus:border-gray-200"
                                placeholder="Objetivo (Ej. Ventas, Branding)"
                                value={formData.objetivo}
                                onChange={e => setFormData({...formData, objetivo: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* NOTAS */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Notas Internas</label>
                        <textarea 
                            className="w-full p-3 bg-gray-50 rounded-xl font-medium text-gray-600 text-sm outline-none resize-none h-20 border border-transparent focus:bg-white focus:border-gray-200 transition-all"
                            placeholder="Copy, hashtags, recordatorios..."
                            value={formData.notas}
                            onChange={e => setFormData({...formData, notas: e.target.value})}
                        />
                    </div>

                    {/* FOOTER BOTONES */}
                    <div className="pt-2 flex gap-3 sticky bottom-0 bg-white pb-2">
                        {postEditar && (
                            <button type="button" onClick={() => { onDelete(postEditar.id); onClose(); }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                                <MdDelete className="text-xl"/>
                            </button>
                        )}
                        <button type="submit" className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200">
                            <MdSave className="text-xl"/> {postEditar ? 'Guardar Cambios' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}