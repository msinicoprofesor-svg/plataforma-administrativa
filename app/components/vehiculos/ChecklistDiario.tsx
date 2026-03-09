/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ChecklistDiario.tsx                      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef } from 'react';
import { 
    MdCameraAlt, MdCheckCircle, MdWarning, MdLocalGasStation, 
    MdSpeed, MdDirectionsCar, MdInfo 
} from 'react-icons/md';
import Spline from '@splinetool/react-spline';
import Tesseract from 'tesseract.js';

import { useBitacora } from '../../hooks/useBitacora';

export default function ChecklistDiario({ vehiculoId, usuarioId, onCompletado }) {
    const { guardarBitacora, loading } = useBitacora();

    // Estados del formulario
    const [kilometraje, setKilometraje] = useState('');
    const [gasolina, setGasolina] = useState('');
    const [incidencia, setIncidencia] = useState('');
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [evidenciaPreview, setEvidenciaPreview] = useState(null);

    // Checklist (Todo OK por defecto)
    const [checklist, setChecklist] = useState({
        llantas_ok: true,
        aceite_ok: true,
        anticongelante_ok: true,
        frenos_ok: true,
    });

    // Estados de la IA (OCR)
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const ocrInputRef = useRef(null);
    const evidenciaInputRef = useRef(null);

    // --- MOTOR DE INTELIGENCIA ARTIFICIAL (OCR) ---
    const handleOCR = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsOcrProcessing(true);
        try {
            // Le pasamos la foto a Tesseract para que lea los números
            const { data: { text } } = await Tesseract.recognize(file, 'eng');
            
            // Filtramos todo lo que no sea número (por si detecta letras del tablero)
            const soloNumeros = text.replace(/[^0-9]/g, '');
            if (soloNumeros) {
                setKilometraje(soloNumeros);
            } else {
                alert("La IA no pudo leer los números claramente. Por favor, ingrésalos manualmente.");
            }
        } catch (error) {
            console.error("Error en OCR:", error);
            alert("Hubo un error al procesar la imagen.");
        }
        setIsOcrProcessing(false);
    };

    // --- CARGA DE EVIDENCIA (FOTO DE DAÑOS) ---
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
            alert("El kilometraje es obligatorio.");
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
        if (res.success) {
            onCompletado(); // Avisamos a la vista principal que ya terminó
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col pb-24 font-sans animate-fade-in">
            
            {/* ENCABEZADO MÓVIL */}
            <div className="bg-gray-900 pt-10 pb-6 px-6 rounded-b-[2.5rem] shadow-xl relative z-20">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Paso Obligatorio</p>
                <h1 className="text-2xl font-black text-white leading-tight">Bitácora de<br/>Salida Vehicular</h1>
            </div>

            {/* VISOR 3D INTERACTIVO */}
            <div className="relative w-full h-64 bg-gray-200 shadow-inner overflow-hidden -mt-8 pt-8">
                {/* Cargamos un auto 3D interactivo desde Spline */}
                <div className="absolute inset-0 z-0">
                    <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
                </div>
                <div className="absolute top-10 left-4 z-10 pointer-events-none">
                    <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/10">
                        <MdDirectionsCar/> Modelo 3D Interactivo
                    </span>
                </div>
            </div>

            <div className="p-5 space-y-6 mt-2 relative z-10">
                
                {/* SECCIÓN 1: KILOMETRAJE CON IA */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <MdSpeed className="text-blue-500 text-lg"/> Odómetro
                    </h3>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <input 
                                type="number" 
                                value={kilometraje} 
                                onChange={(e) => setKilometraje(e.target.value)}
                                placeholder="Ej. 125000"
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-800 outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <button 
                            onClick={() => ocrInputRef.current.click()}
                            disabled={isOcrProcessing}
                            className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
                        >
                            {isOcrProcessing ? (
                                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            ) : (
                                <MdCameraAlt className="text-2xl"/>
                            )}
                        </button>
                        {/* Input oculto para abrir la cámara del celular */}
                        <input type="file" accept="image/*" capture="environment" ref={ocrInputRef} onChange={handleOCR} className="hidden" />
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-2 text-center">Toca la cámara para escanear el tablero con IA</p>
                </div>

                {/* SECCIÓN 2: CHECKLIST INTERACTIVO */}
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

                {/* SECCIÓN 3: GASOLINA */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <MdLocalGasStation className="text-orange-500 text-lg"/> Vale de Combustible
                    </h3>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 font-black text-gray-400">$</span>
                        <input 
                            type="number" 
                            value={gasolina} 
                            onChange={(e) => setGasolina(e.target.value)}
                            placeholder="Monto asignado hoy (Opcional)"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-8 pr-4 py-3.5 text-sm font-bold text-gray-800 outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>
                </div>

                {/* SECCIÓN 4: INCIDENCIAS Y EVIDENCIA */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <MdWarning className="text-red-500 text-lg"/> Reporte de Daños
                    </h3>
                    <textarea 
                        value={incidencia} 
                        onChange={(e) => setIncidencia(e.target.value)}
                        placeholder="Si notaste algún golpe, raspón o falla, descríbelo aquí..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-red-500 transition-colors h-24 resize-none mb-3"
                    ></textarea>

                    {evidenciaPreview ? (
                        <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200">
                            <img src={evidenciaPreview} alt="Evidencia" className="w-full h-full object-cover"/>
                            <button onClick={() => {setEvidenciaFile(null); setEvidenciaPreview(null);}} className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase">Quitar</button>
                        </div>
                    ) : (
                        <button onClick={() => evidenciaInputRef.current.click()} className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition-colors">
                            <MdCameraAlt className="text-base"/> Subir Foto de Evidencia
                        </button>
                    )}
                    <input type="file" accept="image/*" capture="environment" ref={evidenciaInputRef} onChange={handleEvidencia} className="hidden" />
                </div>

            </div>

            {/* BOTÓN FLOTANTE DE GUARDAR */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-safe z-50">
                <button 
                    onClick={handleGuardar}
                    disabled={loading || isOcrProcessing}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-900/20 disabled:opacity-50"
                >
                    {loading ? 'Sincronizando con Base de Datos...' : 'Confirmar y Arrancar'}
                </button>
            </div>

        </div>
    );
}

// Subcomponente para los botones del Checklist
function CheckItem({ label, valor, onToggle }) {
    return (
        <button 
            onClick={onToggle}
            className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-colors active:scale-95 ${
                valor ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
        >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${valor ? 'bg-green-500 shadow-sm shadow-green-500/30' : 'bg-red-500 shadow-sm shadow-red-500/30'}`}>
                {valor ? <MdCheckCircle className="text-sm"/> : <MdWarning className="text-sm"/>}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wide leading-tight ${valor ? 'text-green-800' : 'text-red-800'}`}>
                {label}
            </span>
        </button>
    );
}