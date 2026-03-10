/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ChecklistDiario.tsx                      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef, useEffect } from 'react';
import { 
    MdCameraAlt, MdCheckCircle, MdWarning, MdLocalGasStation, 
    MdSpeed, MdClose, MdMenu
} from 'react-icons/md';
import Tesseract from 'tesseract.js';

import { useBitacora } from '../../hooks/useBitacora';
import { supabase } from '../../lib/supabase';

const PLACEHOLDER_CAR = 'https://xtfuxscqymvunbppknyr.supabase.co/storage/v1/object/public/vehiculos-fotos/vehiculos/placeholder-car-diag.png';

// --- MOTOR 1: COMPRESIÓN NORMAL PARA GUARDAR EN BASE DE DATOS ---
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
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.7);
            };
        };
    });
};

// --- MOTOR 2: FILTRO BLANCO/NEGRO Y ALTO CONTRASTE (EXCLUSIVO PARA LA IA) ---
const preprocesarImagenOCR = (file) => {
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
                
                // Magia: Aplicamos filtro CSS nativo en el Canvas para resaltar los números
                ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };
        };
    });
};

export default function ChecklistDiario({ vehiculoId, usuarioId, onCompletado }) {
    const { guardarBitacora, loading } = useBitacora();

    const [vehiculo, setVehiculo] = useState(null);
    const [kilometraje, setKilometraje] = useState('');
    const [gasolina, setGasolina] = useState('');
    const [incidencia, setIncidencia] = useState('');
    
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [evidenciaPreview, setEvidenciaPreview] = useState(null);
    const [odometroFile, setOdometroFile] = useState(null); 

    const [checklist, setChecklist] = useState({ llantas: null, aceite: null, anticongelante: null, frenos: null });
    const [pasoActivo, setPasoActivo] = useState('cenital'); 

    const [showOcrModal, setShowOcrModal] = useState(false);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    const [tempOcrFile, setTempOcrFile] = useState(null);
    const [tempOcrPreview, setTempOcrPreview] = useState(null);
    const [tempOcrValue, setTempOcrValue] = useState('');
    
    const ocrInputRef = useRef(null);
    const evidenciaInputRef = useRef(null);

    const todoRevisado = Object.values(checklist).every(val => val !== null);
    
    useEffect(() => {
        const fetchVehiculo = async () => {
            const { data } = await supabase.from('vehiculos').select('*').eq('id', vehiculoId).single();
            if (data) setVehiculo(data);
        };
        fetchVehiculo();
    }, [vehiculoId]);

    const handleOCR = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setShowOcrModal(true);
        setIsOcrProcessing(true);
        setOcrProgress(0);
        setOcrStatus('Preparando imagen...');

        // 1. Comprimimos normal para guardar en BD
        const compressedFile = await comprimirImagen(file);
        setTempOcrFile(compressedFile);
        
        const reader = new FileReader();
        reader.onloadend = () => setTempOcrPreview(reader.result);
        reader.readAsDataURL(compressedFile);

        // 2. Preprocesamos en Blanco/Negro y Alto Contraste para ayudar a la IA
        setOcrStatus('Aplicando filtros...');
        const bwBlob = await preprocesarImagenOCR(file);

        // 3. Mandamos la foto optimizada al cerebro de Tesseract
        try {
            const { data: { text } } = await Tesseract.recognize(bwBlob, 'eng', { 
                logger: (m) => { 
                    if (m.status === 'recognizing text') { 
                        setOcrStatus('Leyendo tablero...'); 
                        setOcrProgress(Math.round(m.progress * 100)); 
                    } else if (m.status === 'loading tesseract core') {
                        setOcrStatus('Iniciando IA...');
                    }
                } 
            });
            const soloNumeros = text.replace(/[^0-9]/g, '');
            if (soloNumeros) setTempOcrValue(soloNumeros);
        } catch (error) { 
            console.error("Error OCR:", error); 
        }
        
        setIsOcrProcessing(false); 
        setOcrStatus('');
    };

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

    const marcarPaso = (campo, estado) => {
        setChecklist({ ...checklist, [campo]: estado });
    };

    const handleGuardar = async () => {
        if (!kilometraje || !odometroFile) { alert("Es obligatorio capturar la foto del kilometraje actual."); return; }
        if (!todoRevisado) { alert("Debes revisar todos los puntos físicos."); return; }

        const datos = {
            vehiculo_id: vehiculoId, usuario_id: usuarioId,
            kilometraje: parseInt(kilometraje), gasolina_asignada: gasolina ? parseFloat(gasolina) : 0,
            llantas_ok: checklist.llantas, aceite_ok: checklist.aceite,
            anticongelante_ok: checklist.anticongelante, frenos_ok: checklist.frenos,
            detalles_incidencia: incidencia
        };

        const res = await guardarBitacora(datos, evidenciaFile, odometroFile);
        if (res.success) onCompletado();
    };

    const getVistaActiva = () => {
        if (todoRevisado) return 'diagonal';
        if (pasoActivo === 'llantas') return 'lateral';
        if (pasoActivo === 'aceite' || pasoActivo === 'anticongelante' || pasoActivo === 'frenos') return 'cofre';
        return 'cenital';
    };

    const vista = getVistaActiva();
    const coordenadas = vehiculo?.coordenadas_hotspots || {};
    const imgStyle = "absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-in-out drop-shadow-2xl";
    const hayFallas = Object.values(checklist).includes(false);

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col pb-24 font-sans animate-fade-in overflow-y-auto overflow-x-hidden custom-scrollbar">
            
            <div className="bg-white pt-10 pb-4 px-6 rounded-b-[2rem] shadow-sm relative z-20 flex justify-between items-center border-b border-gray-100 shrink-0">
                <div>
                    <h1 className="text-xl font-black text-blue-600 leading-tight flex items-center gap-2">
                        {vehiculo?.marca} {vehiculo?.modelo}
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        AÑO {vehiculo?.anio} - {vehiculo?.placas}
                    </p>
                    <span className="bg-blue-500 text-white text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest shadow-sm shadow-blue-500/30">
                        {todoRevisado ? 'Inspección Completa' : `Paso ${Object.values(checklist).filter(v => v!==null).length + 1} de 4`}
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    {vehiculo?.imagen_url && (
                        <div className="w-20 h-12 relative flex-shrink-0 bg-white rounded-xl">
                            <img src={vehiculo.imagen_url} alt="Miniatura" className="w-full h-full object-contain" />
                        </div>
                    )}
                    <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors border border-gray-100">
                        <MdMenu className="text-xl" />
                    </button>
                </div>
            </div>

            <div className="relative w-full h-64 mt-4 flex items-center justify-center overflow-hidden shrink-0">
                <img src={vehiculo?.img_cenital || PLACEHOLDER_CAR} className={`${imgStyle} ${vista === 'cenital' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} alt="Cenital" />
                <img src={vehiculo?.img_lateral || PLACEHOLDER_CAR} className={`${imgStyle} ${vista === 'lateral' ? 'opacity-100 scale-110 translate-x-3' : 'opacity-0 translate-x-10 scale-95'}`} alt="Lateral" />
                <img src={vehiculo?.img_diagonal || PLACEHOLDER_CAR} className={`${imgStyle} ${vista === 'diagonal' ? 'opacity-100 scale-110' : 'opacity-0 -translate-x-10 scale-95'}`} alt="Diagonal" />
                <img src={vehiculo?.img_cofre || PLACEHOLDER_CAR} className={`${imgStyle} ${vista === 'cofre' ? 'opacity-100 scale-110' : 'opacity-0 translate-y-0 scale-95'}`} alt="Cofre" />

                {vista === 'lateral' && coordenadas.llantas && coordenadas.llantas.map((punto, i) => (
                    <Hotspot key={`llanta-${i}`} top={punto.top} left={punto.left} status={checklist.llantas} />
                ))}
                {vista === 'cofre' && (
                    <>
                        {pasoActivo === 'aceite' && coordenadas.aceite && <Hotspot top={coordenadas.aceite.top} left={coordenadas.aceite.left} status={checklist.aceite} />}
                        {pasoActivo === 'anticongelante' && coordenadas.anticongelante && <Hotspot top={coordenadas.anticongelante.top} left={coordenadas.anticongelante.left} status={checklist.anticongelante} />}
                        {pasoActivo === 'frenos' && coordenadas.frenos && <Hotspot top={coordenadas.frenos.top} left={coordenadas.frenos.left} status={checklist.frenos} />}
                    </>
                )}

                {todoRevisado && (
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] z-20 flex items-center justify-center animate-fade-in">
                        {hayFallas ? (
                            <div className="p-4 bg-red-50 rounded-full border border-red-200 text-red-500 shadow-xl shadow-red-500/30 animate-scale-pop"><MdWarning size={60} /></div>
                        ) : (
                            <div className="p-4 bg-green-50 rounded-full border border-green-200 text-green-500 shadow-xl shadow-green-500/30 animate-scale-pop"><MdCheckCircle size={60} /></div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-5 space-y-5 relative z-10 -mt-2">
                
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-5">Inspección de Puntos Críticos</h3>
                    <div className="space-y-3">
                        <CheckPaso label="Llantas y Presión" estado={checklist.llantas} activo={pasoActivo === 'llantas'} onClick={() => setPasoActivo('llantas')} onSeleccionar={(val) => marcarPaso('llantas', val)} />
                        <CheckPaso label="Nivel de Aceite" estado={checklist.aceite} activo={pasoActivo === 'aceite'} onClick={() => setPasoActivo('aceite')} onSeleccionar={(val) => marcarPaso('aceite', val)} />
                        <CheckPaso label="Anticongelante" estado={checklist.anticongelante} activo={pasoActivo === 'anticongelante'} onClick={() => setPasoActivo('anticongelante')} onSeleccionar={(val) => marcarPaso('anticongelante', val)} />
                        <CheckPaso label="Líquido de Frenos" estado={checklist.frenos} activo={pasoActivo === 'frenos'} onClick={() => setPasoActivo('frenos')} onSeleccionar={(val) => marcarPaso('frenos', val)} />
                    </div>
                </div>

                {/* MODIFICADO: SECCIÓN DE OBSERVACIONES GENERALES (SIEMPRE VISIBLE) */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest text-center mb-4">Observaciones y Evidencia</h3>
                    <textarea 
                        value={incidencia} 
                        onChange={(e) => setIncidencia(e.target.value)} 
                        placeholder="Ej. El auto está sucio, tiene un rayón en la puerta, falta un tapete..." 
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 transition-colors h-24 resize-none mb-3"
                    ></textarea>
                    {evidenciaPreview ? (
                        <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200">
                            <img src={evidenciaPreview} alt="Evidencia" className="w-full h-full object-cover"/>
                            <button onClick={() => {setEvidenciaFile(null); setEvidenciaPreview(null);}} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg"><MdClose/></button>
                        </div>
                    ) : (
                        <button onClick={() => evidenciaInputRef.current.click()} className="w-full py-3.5 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-gray-200 hover:bg-gray-100"><MdCameraAlt className="text-base"/> Subir foto (Opcional)</button>
                    )}
                    <input type="file" accept="image/*" capture="environment" ref={evidenciaInputRef} onChange={handleEvidencia} className="hidden" />
                </div>

                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Kilometraje Actual</h3>
                    {kilometraje ? (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Odómetro Confirmado</p>
                                <p className="text-xl font-black text-blue-900">{kilometraje} km</p>
                            </div>
                            <button onClick={() => ocrInputRef.current.click()} className="text-blue-600 hover:text-blue-800 text-[10px] font-black uppercase underline">Modificar</button>
                        </div>
                    ) : (
                        <button onClick={() => ocrInputRef.current.click()} className="w-full py-5 bg-gray-900 text-white rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-gray-900/20">
                            <MdCameraAlt className="text-3xl text-blue-400"/>
                            <span className="text-[10px] font-black uppercase tracking-widest">Tomar Foto del Tablero</span>
                        </button>
                    )}
                    <input type="file" accept="image/*" capture="environment" ref={ocrInputRef} onChange={handleOCR} className="hidden" />
                </div>

                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Vale de Combustible</h3>
                    <div className="relative flex justify-center">
                        <span className="absolute left-4 top-3.5 font-black text-gray-400">$</span>
                        <input type="number" value={gasolina} onChange={(e) => setGasolina(e.target.value)} placeholder="Monto asignado hoy (Opcional)" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-orange-500 transition-colors text-center" />
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe z-[110]">
                <button 
                    onClick={handleGuardar} 
                    disabled={loading || !todoRevisado || !kilometraje} 
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-900/20 disabled:opacity-50 transition-all"
                >
                    {loading ? 'Sincronizando...' : (todoRevisado && kilometraje ? 'Confirmar y Arrancar' : 'Completa todos los pasos')}
                </button>
            </div>

            {/* MODAL DE CONFIRMACIÓN OCR */}
            {showOcrModal && (
                <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-base font-black text-gray-800 flex items-center gap-2"><MdSpeed className="text-blue-600 text-xl"/> Odómetro</h3>
                            <button onClick={() => setShowOcrModal(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="w-full h-32 bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200">
                                {tempOcrPreview && <img src={tempOcrPreview} className="w-full h-full object-cover" alt="Odómetro" />}
                                {isOcrProcessing && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-5 animate-fade-in">
                                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-3"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-center">{ocrStatus}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 text-center">Kilometraje Detectado</label>
                                <input type="number" value={tempOcrValue} onChange={(e) => setTempOcrValue(e.target.value)} disabled={isOcrProcessing} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-2xl font-black text-center text-gray-800 outline-none focus:border-blue-500 transition-colors disabled:opacity-50" placeholder="Ej. 125000" />
                                {!isOcrProcessing && <p className="text-[9px] font-bold text-orange-500 text-center mt-2 uppercase">Modifica el número si la IA se equivocó.</p>}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-white shrink-0">
                            <button onClick={() => { setKilometraje(tempOcrValue); setOdometroFile(tempOcrFile); setShowOcrModal(false); }} disabled={isOcrProcessing || !tempOcrValue} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50">
                                <MdCheckCircle className="text-xl"/> Confirmar Kilometraje
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CheckPaso({ label, estado, activo, onClick, onSeleccionar }) {
    return (
        <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${activo ? 'bg-gray-50 border-gray-200 shadow-inner' : 'bg-white border-transparent hover:border-gray-100'}`}>
            <button onClick={onClick} className="w-full p-4 flex items-center justify-between text-left">
                <span className={`text-xs font-black uppercase tracking-widest ${activo ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                {estado === true && <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md shadow-green-500/30"><MdCheckCircle className="text-sm"/></div>}
                {estado === false && <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/30"><MdWarning className="text-sm"/></div>}
                {estado === null && <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>}
            </button>
            {activo && (
                <div className="px-4 pb-4 flex gap-3 animate-fade-in">
                    <button onClick={() => onSeleccionar(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${estado === true ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-white border border-gray-200 text-gray-500 hover:bg-green-50'}`}>
                        <MdCheckCircle className="text-base"/> Todo Bien
                    </button>
                    <button onClick={() => onSeleccionar(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${estado === false ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white border border-gray-200 text-gray-500 hover:bg-red-50'}`}>
                        <MdWarning className="text-base"/> Falla
                    </button>
                </div>
            )}
        </div>
    );
}

function Hotspot({ top, left, status }) {
    const colorClass = status === null ? 'bg-blue-400' : (status ? 'bg-green-500' : 'bg-red-500');
    const shadowClass = status === null ? 'shadow-blue-500/50' : (status ? 'shadow-green-500/50' : 'shadow-red-500/50');
    return (
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 animate-fade-in" style={{ top, left }}>
            <div className={`relative w-4 h-4 rounded-full ${colorClass} border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.3)] ${shadowClass} transition-colors duration-500`}>
                <div className={`absolute inset-0 rounded-full ${colorClass} animate-ping opacity-75`}></div>
            </div>
        </div>
    );
}