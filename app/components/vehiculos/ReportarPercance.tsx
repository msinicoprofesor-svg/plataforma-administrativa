/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ReportarPercance.tsx                     */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef } from 'react';
import { MdCameraAlt, MdArrowBack, MdWarning, MdBuild, MdClose } from 'react-icons/md';
import { supabase } from '../../lib/supabase';

const comprimirImagen = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxWidth = 800;
                const scaleSize = img.width > maxWidth ? (maxWidth / img.width) : 1;
                canvas.width = img.width * scaleSize;
                canvas.height = img.height * scaleSize;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.7);
            };
        };
    });
};

export default function ReportarPercance({ vehiculoId, usuarioId, onVolver, onCompletado }) {
    const [gravedad, setGravedad] = useState(''); // leve, grave
    const [descripcion, setDescripcion] = useState('');
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [evidenciaPreview, setEvidenciaPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const evidenciaInputRef = useRef(null);

    const handleEvidencia = async (e) => {
        const file = e.target.files[0];
        if (file) { 
            const compressedFile = await comprimirImagen(file);
            setEvidenciaFile(compressedFile); 
            const reader = new FileReader(); 
            reader.onloadend = () => setEvidenciaPreview(reader.result); 
            reader.readAsDataURL(compressedFile); 
        }
    };

    const handleGuardar = async () => {
        if (!gravedad) return alert("Selecciona la gravedad del percance.");
        if (!descripcion) return alert("Describe brevemente lo que sucedió.");
        if (!evidenciaFile) return alert("Por favor, sube una foto como evidencia del percance.");

        setLoading(true);
        try {
            // 1. Subir Foto del Percance
            const fileExt = evidenciaFile.name.split('.').pop();
            const filePath = `incidencias/percance-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            await supabase.storage.from('vehiculos-fotos').upload(filePath, evidenciaFile);
            const { data: urlData } = supabase.storage.from('vehiculos-fotos').getPublicUrl(filePath);

            // 2. Guardar Bitácora de PERCANCE
            await supabase.from('vehiculos_bitacora').insert([{
                vehiculo_id: vehiculoId,
                usuario_id: usuarioId,
                tipo_registro: 'PERCANCE',
                detalles_incidencia: descripcion,
                gravedad_percance: gravedad,
                evidencia_url: urlData.publicUrl
            }]);

            // 3. Si es Grave, mandar al Taller automáticamente
            if (gravedad === 'grave') {
                await supabase.from('vehiculos').update({ estado: 'TALLER' }).eq('id', vehiculoId);
            }

            setLoading(false);
            alert("Percance reportado exitosamente al administrador.");
            onCompletado();
        } catch (error) {
            setLoading(false);
            alert("Error al reportar percance: " + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col pb-24 font-sans animate-fade-in overflow-y-auto custom-scrollbar">
            <div className="bg-white pt-10 pb-6 px-6 rounded-b-[2rem] shadow-sm relative z-20 flex items-center gap-4 shrink-0 border-b border-gray-100">
                <button onClick={onVolver} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"><MdArrowBack className="text-xl"/></button>
                <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Alerta de Seguridad</p>
                    <h1 className="text-2xl font-black text-gray-800 leading-tight">Reportar Percance</h1>
                </div>
            </div>

            <div className="p-5 space-y-5">
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Nivel de Gravedad</h3>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setGravedad('leve')} className={`p-4 rounded-2xl flex items-center gap-4 border text-left transition-all ${gravedad === 'leve' ? 'bg-orange-50 border-orange-400 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${gravedad === 'leve' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}><MdWarning size={20}/></div>
                            <div>
                                <h4 className={`text-sm font-black uppercase tracking-wide ${gravedad === 'leve' ? 'text-orange-700' : 'text-gray-800'}`}>Incidente Leve</h4>
                                <p className="text-[10px] font-bold text-gray-500 mt-1">Un golpe o rayón menor. El vehículo aún puede circular.</p>
                            </div>
                        </button>
                        <button onClick={() => setGravedad('grave')} className={`p-4 rounded-2xl flex items-center gap-4 border text-left transition-all ${gravedad === 'grave' ? 'bg-red-50 border-red-400 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${gravedad === 'grave' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}><MdBuild size={20}/></div>
                            <div>
                                <h4 className={`text-sm font-black uppercase tracking-wide ${gravedad === 'grave' ? 'text-red-700' : 'text-gray-800'}`}>Falla Grave / Siniestro</h4>
                                <p className="text-[10px] font-bold text-gray-500 mt-1">El vehículo no puede continuar o requiere grúa/taller.</p>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Detalles y Evidencia</h3>
                    <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe exactamente qué sucedió y qué partes se dañaron..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-red-500 transition-colors h-28 resize-none mb-4"></textarea>
                    
                    {evidenciaPreview ? (
                        <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-200">
                            <img src={evidenciaPreview} alt="Evidencia" className="w-full h-full object-cover"/>
                            <button onClick={() => {setEvidenciaFile(null); setEvidenciaPreview(null);}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg"><MdClose/></button>
                        </div>
                    ) : (
                        <button onClick={() => evidenciaInputRef.current.click()} className="w-full py-5 bg-red-50 text-red-600 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-red-200 active:scale-95 transition-transform hover:bg-red-100">
                            <MdCameraAlt className="text-3xl"/>
                            <span className="text-[10px] font-black uppercase tracking-widest">Tomar Fotografía (Obligatorio)</span>
                        </button>
                    )}
                    <input type="file" accept="image/*" capture="environment" ref={evidenciaInputRef} onChange={handleEvidencia} className="hidden" />
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe z-[110]">
                <button onClick={handleGuardar} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-red-500/30 disabled:opacity-50 transition-all">
                    {loading ? 'Enviando Alerta...' : 'Enviar Reporte de Percance'}
                </button>
            </div>
        </div>
    );
}