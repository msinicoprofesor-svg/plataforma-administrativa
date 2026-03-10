/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/CargarGasolina.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef } from 'react';
import { MdCameraAlt, MdArrowBack, MdLocalGasStation, MdClose, MdAttachMoney, MdSpeed } from 'react-icons/md';
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

export default function CargarGasolina({ vehiculoId, usuarioId, onVolver, onCompletado }) {
    const [monto, setMonto] = useState('');
    const [litros, setLitros] = useState('');
    const [kilometraje, setKilometraje] = useState('');
    const [ticketFile, setTicketFile] = useState(null);
    const [ticketPreview, setTicketPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const ticketInputRef = useRef(null);

    const handleTicket = async (e) => {
        const file = e.target.files[0];
        if (file) { 
            const compressedFile = await comprimirImagen(file);
            setTicketFile(compressedFile); 
            const reader = new FileReader(); 
            reader.onloadend = () => setTicketPreview(reader.result); 
            reader.readAsDataURL(compressedFile); 
        }
    };

    const handleGuardar = async () => {
        if (!monto || !kilometraje) return alert("El monto y el kilometraje actual son obligatorios.");
        if (!ticketFile) return alert("Debes subir la fotografía del ticket de carga.");

        setLoading(true);
        try {
            // 1. Subir la foto del ticket
            const fileExt = ticketFile.name.split('.').pop();
            const filePath = `tickets/gasolina-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            await supabase.storage.from('vehiculos-fotos').upload(filePath, ticketFile);
            const { data: urlData } = supabase.storage.from('vehiculos-fotos').getPublicUrl(filePath);

            // 2. Guardar registro en la BD
            await supabase.from('vehiculos_gasolina').insert([{
                vehiculo_id: vehiculoId,
                usuario_id: usuarioId,
                monto: parseFloat(monto),
                litros: litros ? parseFloat(litros) : null,
                kilometraje_carga: parseInt(kilometraje),
                foto_ticket_url: urlData.publicUrl
            }]);

            setLoading(false);
            alert("✅ Ticket de combustible registrado exitosamente.");
            onCompletado();
        } catch (error) {
            setLoading(false);
            alert("Error al registrar combustible: " + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col pb-24 font-sans animate-fade-in overflow-y-auto custom-scrollbar">
            <div className="bg-white pt-10 pb-6 px-6 rounded-b-[2rem] shadow-sm relative z-20 flex items-center gap-4 shrink-0 border-b border-gray-100">
                <button onClick={onVolver} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"><MdArrowBack className="text-xl"/></button>
                <div>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Registro de Consumo</p>
                    <h1 className="text-2xl font-black text-gray-800 leading-tight">Cargar Combustible</h1>
                </div>
            </div>

            <div className="p-5 space-y-5">
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Datos del Ticket</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Monto Pagado ($)</label>
                            <div className="relative">
                                <MdAttachMoney className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-lg font-black text-gray-800 outline-none focus:border-orange-500 transition-colors" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Litros (Opcional)</label>
                                <input type="number" value={litros} onChange={(e) => setLitros(e.target.value)} placeholder="Ej. 40.5" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-orange-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Kilometraje Actual</label>
                                <div className="relative">
                                    <MdSpeed className="absolute left-3 top-3.5 text-gray-400" />
                                    <input type="number" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} placeholder="Ej. 145000" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-orange-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Fotografía del Ticket</h3>
                    {ticketPreview ? (
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-200">
                            <img src={ticketPreview} alt="Ticket" className="w-full h-full object-contain bg-gray-50"/>
                            <button onClick={() => {setTicketFile(null); setTicketPreview(null);}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg"><MdClose/></button>
                        </div>
                    ) : (
                        <button onClick={() => ticketInputRef.current.click()} className="w-full py-8 bg-orange-50 text-orange-600 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-orange-200 active:scale-95 transition-transform hover:bg-orange-100">
                            <MdCameraAlt className="text-4xl"/>
                            <span className="text-[10px] font-black uppercase tracking-widest mt-2">Capturar Ticket (Obligatorio)</span>
                        </button>
                    )}
                    <input type="file" accept="image/*" capture="environment" ref={ticketInputRef} onChange={handleTicket} className="hidden" />
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe z-[110]">
                <button onClick={handleGuardar} disabled={loading} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-900/20 disabled:opacity-50 transition-all">
                    {loading ? 'Subiendo Ticket...' : <><MdLocalGasStation className="text-lg"/> Registrar Carga</>}
                </button>
            </div>
        </div>
    );
}