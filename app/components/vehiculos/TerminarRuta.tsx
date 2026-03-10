/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/TerminarRuta.tsx                         */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef } from 'react';
import { MdCameraAlt, MdCheckCircle, MdSpeed, MdClose, MdArrowBack, MdLocationOn, MdWarning } from 'react-icons/md';
import Tesseract from 'tesseract.js';
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

export default function TerminarRuta({ vehiculoId, usuarioId, onVolver, onCompletado }) {
    const [kilometraje, setKilometraje] = useState('');
    const [odometroFile, setOdometroFile] = useState(null);
    const [huboIncidente, setHuboIncidente] = useState(null);
    const [detallesIncidente, setDetallesIncidente] = useState('');
    const [ubicacion, setUbicacion] = useState(''); // almacen, oficinas, casa
    const [loading, setLoading] = useState(false);

    // Estados OCR
    const [showOcrModal, setShowOcrModal] = useState(false);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    const [tempOcrFile, setTempOcrFile] = useState(null);
    const [tempOcrPreview, setTempOcrPreview] = useState(null);
    const [tempOcrValue, setTempOcrValue] = useState('');
    
    const ocrInputRef = useRef(null);

    const handleOCR = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setShowOcrModal(true); setIsOcrProcessing(true); setOcrProgress(0); setOcrStatus('Preparando imagen...');
        const compressedFile = await comprimirImagen(file);
        setTempOcrFile(compressedFile);
        
        const reader = new FileReader();
        reader.onloadend = () => setTempOcrPreview(reader.result);
        reader.readAsDataURL(compressedFile);

        try {
            const { data: { text } } = await Tesseract.recognize(compressedFile, 'eng', { 
                logger: (m) => { 
                    if (m.status === 'recognizing text') { setOcrStatus('Leyendo tablero...'); setOcrProgress(Math.round(m.progress * 100)); }
                } 
            });
            const soloNumeros = text.replace(/[^0-9]/g, '');
            if (soloNumeros) setTempOcrValue(soloNumeros);
        } catch (error) { console.error("Error OCR:", error); }
        setIsOcrProcessing(false); setOcrStatus('');
    };

    const handleGuardar = async () => {
        if (!kilometraje || !odometroFile) return alert("Sube la foto del kilometraje final.");
        if (huboIncidente === null) return alert("Indica si hubo algún incidente en la ruta.");
        if (huboIncidente && !detallesIncidente) return alert("Describe el incidente, por favor.");
        if (!ubicacion) return alert("Indica dónde dejarás la unidad.");

        setLoading(true);
        try {
            // 1. Subir Odómetro
            const fileExt = odometroFile.name.split('.').pop();
            const filePath = `odometros/final-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            await supabase.storage.from('vehiculos-fotos').upload(filePath, odometroFile);
            const { data: urlData } = supabase.storage.from('vehiculos-fotos').getPublicUrl(filePath);

            // 2. Guardar Bitácora de LLEGADA
            await supabase.from('vehiculos_bitacora').insert([{
                vehiculo_id: vehiculoId,
                usuario_id: usuarioId,
                tipo_registro: 'LLEGADA',
                kilometraje: parseInt(kilometraje),
                odometro_url: urlData.publicUrl,
                detalles_incidencia: huboIncidente ? detallesIncidente : 'Sin incidentes',
                ubicacion_final: ubicacion
            }]);

            // 3. Actualizar Vehículo (Si lo deja en casa, sigue asignado. Si no, se libera)
            const payloadVehiculo = { estado: 'DISPONIBLE' };
            if (ubicacion === 'almacen' || ubicacion === 'oficinas') {
                payloadVehiculo.responsable_id = null; // Se libera automáticamente
            }
            await supabase.from('vehiculos').update(payloadVehiculo).eq('id', vehiculoId);

            setLoading(false);
            onCompletado();
        } catch (error) {
            setLoading(false);
            alert("Error al terminar ruta: " + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col pb-24 font-sans animate-fade-in overflow-y-auto custom-scrollbar">
            <div className="bg-white pt-10 pb-6 px-6 rounded-b-[2rem] shadow-sm relative z-20 flex items-center gap-4 shrink-0 border-b border-gray-100">
                <button onClick={onVolver} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"><MdArrowBack className="text-xl"/></button>
                <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Cierre de Jornada</p>
                    <h1 className="text-2xl font-black text-gray-800 leading-tight">Terminar Ruta</h1>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* 1. KILOMETRAJE FINAL */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Kilometraje Final</h3>
                    {kilometraje ? (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Odómetro Final</p>
                                <p className="text-xl font-black text-blue-900">{kilometraje} km</p>
                            </div>
                            <button onClick={() => ocrInputRef.current.click()} className="text-blue-600 text-[10px] font-black uppercase underline">Modificar</button>
                        </div>
                    ) : (
                        <button onClick={() => ocrInputRef.current.click()} className="w-full py-5 bg-gray-900 text-white rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 shadow-lg shadow-gray-900/20">
                            <MdCameraAlt className="text-3xl text-blue-400"/>
                            <span className="text-[10px] font-black uppercase tracking-widest">Tomar Foto del Tablero</span>
                        </button>
                    )}
                    <input type="file" accept="image/*" capture="environment" ref={ocrInputRef} onChange={handleOCR} className="hidden" />
                </div>

                {/* 2. INCIDENTES */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">¿Hubo algún incidente en ruta?</h3>
                    <div className="flex gap-3 mb-4">
                        <button onClick={() => setHuboIncidente(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${huboIncidente === false ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}><MdCheckCircle className="text-base"/> Todo Bien</button>
                        <button onClick={() => setHuboIncidente(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${huboIncidente === true ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}><MdWarning className="text-base"/> Sí, un detalle</button>
                    </div>
                    {huboIncidente && (
                        <textarea value={detallesIncidente} onChange={(e) => setDetallesIncidente(e.target.value)} placeholder="Describe brevemente qué pasó..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-red-500 transition-colors h-24 resize-none animate-fade-in"></textarea>
                    )}
                </div>

                {/* 3. UBICACIÓN FINAL */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">¿Dónde dejarás la unidad?</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {['almacen', 'oficinas', 'casa'].map(opt => (
                            <button key={opt} onClick={() => setUbicacion(opt)} className={`py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${ubicacion === opt ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                                <MdLocationOn className={`text-2xl ${ubicacion === opt ? 'text-blue-500' : 'text-gray-300'}`}/>
                                <span className="text-[9px] font-black uppercase tracking-widest">{opt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe z-[110]">
                <button onClick={handleGuardar} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-900/20 disabled:opacity-50">
                    {loading ? 'Procesando Cierre...' : 'Cerrar Ruta y Liberar'}
                </button>
            </div>

            {/* MODAL DE CONFIRMACIÓN OCR (IDÉNTICO AL CHECKLIST) */}
            {showOcrModal && (
                <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-base font-black text-gray-800 flex items-center gap-2"><MdSpeed className="text-blue-600 text-xl"/> Odómetro Final</h3>
                            <button onClick={() => setShowOcrModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"><MdClose/></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="w-full h-32 bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200">
                                {tempOcrPreview && <img src={tempOcrPreview} className="w-full h-full object-cover" alt="Odómetro" />}
                                {isOcrProcessing && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-5"><div className="w-full h-1.5 bg-gray-700 rounded-full mb-3"><div className="h-full bg-blue-500" style={{ width: `${ocrProgress}%` }}></div></div><span className="text-[9px] font-black uppercase">{ocrStatus}</span></div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase text-center mb-2">Lectura Detectada</label>
                                <input type="number" value={tempOcrValue} onChange={(e) => setTempOcrValue(e.target.value)} disabled={isOcrProcessing} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-2xl font-black text-center text-gray-800 outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button onClick={() => { setKilometraje(tempOcrValue); setOdometroFile(tempOcrFile); setShowOcrModal(false); }} disabled={isOcrProcessing || !tempOcrValue} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl disabled:opacity-50">Confirmar Kilometraje</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}