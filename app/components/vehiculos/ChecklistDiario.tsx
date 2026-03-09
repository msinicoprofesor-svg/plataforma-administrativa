/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ChecklistDiario.tsx                      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef } from 'react';
import { 
    MdCameraAlt, MdCheckCircle, MdWarning, MdLocalGasStation, 
    MdSpeed, MdDirectionsCar 
} from 'react-icons/md';
import Tesseract from 'tesseract.js';

import { useBitacora } from '../../hooks/useBitacora';

export default function ChecklistDiario({ vehiculoId, usuarioId, onCompletado }) {
    const { guardarBitacora, loading } = useBitacora();

    const [kilometraje, setKilometraje] = useState('');
    const [gasolina, setGasolina] = useState('');
    const [incidencia, setIncidencia] = useState('');
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [evidenciaPreview, setEvidenciaPreview] = useState(null);

    const [checklist, setChecklist] = useState({
        llantas_ok: true,
        aceite_ok: true,
        anticongelante_ok: true,
        frenos_ok: true,
    });

    // --- ESTADOS INTELIGENTES DE LA IA (OCR) ---
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    
    const ocrInputRef = useRef(null);
    const evidenciaInputRef = useRef(null);

    const handleOCR = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsOcrProcessing(true);
        setOcrProgress(0);
        setOcrStatus('Iniciando Motor IA...');

        try {
            // IA con medidor de progreso en tiempo real
            const { data: { text } } = await Tesseract.recognize(file, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setOcrStatus('Escaneando Tablero...');
                        setOcrProgress(Math.round(m.progress * 100));
                    } else if (m.status === 'loading tesseract core') {
                        setOcrStatus('Cargando Red Neuronal...');
                    }
                }
            });
            
            const soloNumeros = text.replace(/[^0-9]/g, '');
            if (soloNumeros) {
                setKilometraje(soloNumeros);
            } else {
                alert("La cámara no logró enfocar los números. Por favor, ingrésalos manualmente.");
            }
        } catch (error) {
            console.error("Error en OCR:", error);
            alert("Hubo un error al procesar la imagen del odómetro.");
        }
        
        setIsOcrProcessing(false);
        setOcrStatus('');
        setOcrProgress(0);
    };

    const handleEvidencia = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEvidenciaFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setEvidenciaPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const toggleCheck = (campo) => {
        setChecklist({ ...checklist, [campo]: !checklist[campo] });
    };

    const handleGuardar = async () => {
        if (!kilometraje) {
            alert("Por favor, ingresa o escanea el kilometraje actual.");
            return;
        }

        const datos = {
            vehiculo_id: vehiculoId,
            usuario_id: usuarioId,
            kilometraje: parseInt(kilometraje),
            gasolina_asignada: gasolina ? parseFloat(gasolina) : 0,
            ...checklist,
            detalles_incidencia: incidencia
        };

        const res = await guardarBitacora(datos, evidenciaFile);
        if (res.success) onCompletado();
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col pb-24 font-sans animate-fade-in">
            
            <div className="bg-gray-900 pt-10 pb-6 px-6 rounded-b-[2.5rem] shadow-xl relative z-20">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Paso Obligatorio</p>
                <h1 className="text-2xl font-black text-white leading-tight">Bitácora de<br/>Salida Vehicular</h1>
            </div>

            {/* VISOR ESTILO TESLA (MAPA 2D INTERACTIVO) */}
            <div className="relative w-full h-80 bg-slate-900 shadow-inner overflow-hidden -mt-8 pt-12 flex items-center justify-center">
                
                {/* Cuadrícula de fondo tecnológico */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                
                <div className="relative w-32 h-64 z-10">
                    {/* Silueta vectorial del vehículo ultra-ligera */}
                    <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-2xl opacity-90" xmlns="http://www.w3.org/2000/svg">
                        <rect x="20" y="20" width="160" height="360" rx="40" fill="#1e293b" stroke="#334155" strokeWidth="6"/>
                        <rect x="35" y="100" width="130" height="80" rx="15" fill="#0f172a" />
                        <rect x="35" y="200" width="130" height="120" rx="15" fill="#0f172a" />
                        {/* Luces frontales y traseras */}
                        <path d="M 30 25 L 60 25 M 140 25 L 170 25" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
                        <path d="M 30 375 L 60 375 M 140 375 L 170 375" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                    
                    {/* Puntos de Luz (Hotspots Interactivos) */}
                    <Hotspot top="15%" left="50%" label="Motor / Aceite" status={checklist.aceite_ok} onClick={() => toggleCheck('aceite_ok')} />
                    <Hotspot top="18%" left="30%" label="Anticongelante" status={checklist.anticongelante_ok} onClick={() => toggleCheck('anticongelante_ok')} />
                    <Hotspot top="45%" left="50%" label="Frenos" status={checklist.frenos_ok} onClick={() => toggleCheck('frenos_ok')} />
                    <Hotspot top="25%" left="5%" label="Llanta DI" status={checklist.llantas_ok} onClick={() => toggleCheck('llantas_ok')} />
                    <Hotspot top="25%" left="95%" label="Llanta DD" status={checklist.llantas_ok} onClick={() => toggleCheck('llantas_ok')} />
                    <Hotspot top="75%" left="5%" label="Llanta TI" status={checklist.llantas_ok} onClick={() => toggleCheck('llantas_ok')} />
                    <Hotspot top="75%" left="95%" label="Llanta TD" status={checklist.llantas_ok} onClick={() => toggleCheck('llantas_ok')} />
                </div>

                <div className="absolute top-12 left-4 z-10 pointer-events-none">
                    <span className="bg-blue-500/20 backdrop-blur-md text-blue-300 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-blue-500/30">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> Sistema Diagnóstico Activo
                    </span>
                </div>
            </div>

            <div className="p-5 space-y-6 mt-2 relative z-10">
                
                {/* ODÓMETRO CON IA VISUAL */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <MdSpeed className="text-blue-500 text-lg"/> Odómetro (Kilometraje)
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                            <input 
                                type="number" 
                                value={kilometraje} 
                                onChange={(e) => setKilometraje(e.target.value)}
                                placeholder="Ej. 125000"
                                disabled={isOcrProcessing}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-800 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                            />
                        </div>
                        <button 
                            onClick={() => ocrInputRef.current.click()}
                            disabled={isOcrProcessing}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${isOcrProcessing ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                            <MdCameraAlt className="text-2xl"/>
                        </button>
                        <input type="file" accept="image/*" capture="environment" ref={ocrInputRef} onChange={handleOCR} className="hidden" />
                    </div>

                    {/* BARRA DE PROGRESO DE LA INTELIGENCIA ARTIFICIAL */}
                    {isOcrProcessing ? (
                        <div className="mt-4 animate-fade-in">
                            <div className="flex justify-between text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5">
                                <span>{ocrStatus}</span>
                                <span>{ocrProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-blue-50 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full" style={{ width: `${ocrProgress}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[9px] font-bold text-gray-400 text-center">Toca la cámara para escanear los números con IA</p>
                    )}
                </div>

                {/* CHECKLIST FÍSICO (VINCULADO AL MAPA 2D) */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <MdCheckCircle className="text-green-500 text-lg"/> Checklist Físico
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <CheckItem label="Llantas y Presión" valor={checklist.llantas_ok} onToggle={() => toggleCheck('llantas_ok')} />
                        <CheckItem label="Nivel de Aceite" valor={checklist.aceite_ok} onToggle={() => toggleCheck('aceite_ok')} />
                        <CheckItem label="Anticongelante" valor={checklist.anticongelante_ok} onToggle={() => toggleCheck('anticongelante_ok')} />
                        <CheckItem label="Líquido de Frenos" valor={checklist.frenos_ok} onToggle={() => toggleCheck('frenos_ok')} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4"><MdLocalGasStation className="text-orange-500 text-lg"/> Vale de Combustible</h3>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 font-black text-gray-400">$</span>
                        <input type="number" value={gasolina} onChange={(e) => setGasolina(e.target.value)} placeholder="Monto asignado hoy (Opcional)" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-8 pr-4 py-3.5 text-sm font-bold text-gray-800 outline-none focus:border-orange-500 transition-colors" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4"><MdWarning className="text-red-500 text-lg"/> Reporte de Daños</h3>
                    <textarea value={incidencia} onChange={(e) => setIncidencia(e.target.value)} placeholder="Si notaste algún golpe, raspón o falla, descríbelo aquí..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-red-500 transition-colors h-24 resize-none mb-3"></textarea>
                    {evidenciaPreview ? (
                        <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200">
                            <img src={evidenciaPreview} alt="Evidencia" className="w-full h-full object-cover"/>
                            <button onClick={() => {setEvidenciaFile(null); setEvidenciaPreview(null);}} className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase">Quitar</button>
                        </div>
                    ) : (
                        <button onClick={() => evidenciaInputRef.current.click()} className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition-colors"><MdCameraAlt className="text-base"/> Subir Foto de Evidencia</button>
                    )}
                    <input type="file" accept="image/*" capture="environment" ref={evidenciaInputRef} onChange={handleEvidencia} className="hidden" />
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-safe z-50">
                <button onClick={handleGuardar} disabled={loading || isOcrProcessing} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-900/20 disabled:opacity-50">
                    {loading ? 'Sincronizando con Base de Datos...' : 'Confirmar y Arrancar'}
                </button>
            </div>
        </div>
    );
}

// Subcomponente: Puntos de Luz (Hotspots) para el Mapa Estilo Tesla
function Hotspot({ top, left, label, status, onClick }) {
    return (
        <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group cursor-pointer"
            style={{ top, left }}
            onClick={onClick}
        >
            <div className={`relative w-4 h-4 rounded-full ${status ? 'bg-blue-400' : 'bg-red-500'} border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-colors`}>
                <div className={`absolute inset-0 rounded-full ${status ? 'bg-blue-400' : 'bg-red-500'} animate-ping opacity-75`}></div>
            </div>
            {/* Solo se muestra el texto en escritorio (hover) para no saturar la pantalla del celular */}
            <span className="hidden md:block absolute top-6 text-[8px] font-black text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                {label}
            </span>
        </div>
    );
}

// Subcomponente: Botones del Checklist
function CheckItem({ label, valor, onToggle }) {
    return (
        <button onClick={onToggle} className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-colors active:scale-95 ${valor ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${valor ? 'bg-green-500 shadow-sm shadow-green-500/30' : 'bg-red-500 shadow-sm shadow-red-500/30'}`}>
                {valor ? <MdCheckCircle className="text-sm"/> : <MdWarning className="text-sm"/>}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wide leading-tight ${valor ? 'text-green-800' : 'text-red-800'}`}>{label}</span>
        </button>
    );
}