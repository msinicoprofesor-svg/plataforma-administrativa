/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ChecklistDiario.tsx                      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef, useEffect } from 'react';
import { 
    MdCameraAlt, MdCheckCircle, MdWarning, MdLocalGasStation, 
    MdSpeed, MdMenu, MdClose
} from 'react-icons/md';
import Tesseract from 'tesseract.js';

import { useBitacora } from '../../hooks/useBitacora';
import { supabase } from '../../lib/supabase'; // Para traer las imágenes del vehículo

export default function ChecklistDiario({ vehiculoId, usuarioId, onCompletado }) {
    const { guardarBitacora, loading } = useBitacora();

    // Datos del vehículo actual
    const [vehiculo, setVehiculo] = useState(null);

    const [kilometraje, setKilometraje] = useState('');
    const [gasolina, setGasolina] = useState('');
    const [incidencia, setIncidencia] = useState('');
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [evidenciaPreview, setEvidenciaPreview] = useState(null);

    // Estado del checklist (null = no revisado, true = OK, false = Falla)
    const [checklist, setChecklist] = useState({
        llantas: null, aceite: null, anticongelante: null, frenos: null,
    });

    // MÁQUINA DE ESTADOS VISUALES
    const [pasoActivo, setPasoActivo] = useState('cenital'); // cenital, llantas, aceite, anticongelante, frenos

    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    
    const ocrInputRef = useRef(null);
    const evidenciaInputRef = useRef(null);

    useEffect(() => {
        // Traemos las imágenes y datos del vehículo
        const fetchVehiculo = async () => {
            const { data } = await supabase.from('vehiculos').select('*').eq('id', vehiculoId).single();
            if (data) setVehiculo(data);
        };
        fetchVehiculo();
    }, [vehiculoId]);

    const handleOCR = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsOcrProcessing(true);
        setOcrProgress(0);
        setOcrStatus('Iniciando IA...');

        try {
            const { data: { text } } = await Tesseract.recognize(file, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setOcrStatus('Escaneando Tablero...');
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                }
            });
            const soloNumeros = text.replace(/[^0-9]/g, '');
            if (soloNumeros) setKilometraje(soloNumeros);
            else alert("No se detectaron números. Ingrésalos manualmente.");
        } catch (error) {
            alert("Error al procesar la imagen.");
        }
        setIsOcrProcessing(false);
        setOcrStatus('');
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

    const marcarPaso = (campo, estado) => {
        setChecklist({ ...checklist, [campo]: estado });
        // Si hay una falla, limpiamos la incidencia para que el usuario la escriba
        if (!estado && incidencia === '') setIncidencia('');
    };

    const handleGuardar = async () => {
        if (!kilometraje) { alert("Ingresa el kilometraje actual."); return; }
        
        // Validamos que todo esté revisado
        const faltan = Object.values(checklist).some(val => val === null);
        if (faltan) { alert("Debes revisar todos los puntos del checklist físico."); return; }

        const datos = {
            vehiculo_id: vehiculoId, usuario_id: usuarioId,
            kilometraje: parseInt(kilometraje), gasolina_asignada: gasolina ? parseFloat(gasolina) : 0,
            llantas_ok: checklist.llantas, aceite_ok: checklist.aceite,
            anticongelante_ok: checklist.anticongelante, frenos_ok: checklist.frenos,
            detalles_incidencia: incidencia
        };

        const res = await guardarBitacora(datos, evidenciaFile);
        if (res.success) onCompletado();
    };

    // DETERMINAR QUÉ IMAGEN Y ÁNGULO MOSTRAR SEGÚN EL PASO ACTIVO
    const getVistaActiva = () => {
        if (pasoActivo === 'llantas') return 'lateral';
        if (pasoActivo === 'aceite' || pasoActivo === 'anticongelante') return 'cofre';
        if (pasoActivo === 'frenos') return 'diagonal';
        return 'cenital';
    };

    const vista = getVistaActiva();

    // ESTILOS DE TRANSICIÓN PARA LAS IMÁGENES
    const imgStyle = "absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-in-out drop-shadow-2xl";

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col pb-24 font-sans animate-fade-in relative overflow-x-hidden">
            
            {/* ENCABEZADO ESTILO FIGMA */}
            <div className="bg-white pt-10 pb-4 px-6 rounded-b-[2rem] shadow-sm relative z-20 flex justify-between items-center border-b border-gray-100">
                <div>
                    <h1 className="text-xl font-black text-blue-600 leading-tight flex items-center gap-2">
                        {vehiculo?.marca} {vehiculo?.modelo}
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        AÑO {vehiculo?.anio} - {vehiculo?.placas}
                    </p>
                    <span className="bg-blue-500 text-white text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest shadow-sm shadow-blue-500/30">
                        Inspección Diaria
                    </span>
                </div>
                <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                    <MdMenu className="text-xl" />
                </button>
            </div>

            {/* VISOR VEHICULAR INTERACTIVO (MÁQUINA DE ESTADOS) */}
            <div className="relative w-full h-56 mt-4 flex items-center justify-center overflow-hidden">
                {/* Auto Base (Cenital) */}
                <img src={vehiculo?.img_cenital || '/placeholder-car.png'} className={`${imgStyle} ${vista === 'cenital' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} alt="Cenital" />
                
                {/* Auto Lateral (Llantas) */}
                <img src={vehiculo?.img_lateral || '/placeholder-car.png'} className={`${imgStyle} ${vista === 'lateral' ? 'opacity-100 scale-110' : 'opacity-0 translate-x-10 scale-95'}`} alt="Lateral" />
                
                {/* Auto Diagonal (Frenos) */}
                <img src={vehiculo?.img_diagonal || '/placeholder-car.png'} className={`${imgStyle} ${vista === 'diagonal' ? 'opacity-100 scale-110' : 'opacity-0 -translate-x-10 scale-95'}`} alt="Diagonal" />
                
                {/* Auto Cofre (Motor / Zoom Efect) */}
                <img src={vehiculo?.img_cofre || '/placeholder-car.png'} className={`${imgStyle} ${vista === 'cofre' ? 'opacity-100 scale-125 translate-y-6' : 'opacity-0 translate-y-0 scale-100'}`} alt="Cofre" />

                {/* HOTSPOTS DINÁMICOS (LUCES) */}
                {vista === 'lateral' && (
                    <>
                        <Hotspot top="70%" left="25%" status={checklist.llantas} />
                        <Hotspot top="70%" left="75%" status={checklist.llantas} />
                    </>
                )}
                {vista === 'cofre' && (
                    <Hotspot top="45%" left="50%" status={pasoActivo === 'aceite' ? checklist.aceite : checklist.anticongelante} />
                )}
                {vista === 'diagonal' && (
                    <Hotspot top="60%" left="30%" status={checklist.frenos} />
                )}
            </div>

            <div className="p-5 space-y-5 relative z-10 -mt-2">
                
                {/* CHECKLIST FÍSICO ESTILO ACORDEÓN */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-5">
                        Checklist Físico
                    </h3>
                    
                    <div className="space-y-3">
                        <CheckPaso 
                            label="Llantas y Presión" estado={checklist.llantas} activo={pasoActivo === 'llantas'}
                            onClick={() => setPasoActivo('llantas')} onSeleccionar={(val) => marcarPaso('llantas', val)}
                        />
                        <CheckPaso 
                            label="Nivel de Aceite" estado={checklist.aceite} activo={pasoActivo === 'aceite'}
                            onClick={() => setPasoActivo('aceite')} onSeleccionar={(val) => marcarPaso('aceite', val)}
                        />
                        <CheckPaso 
                            label="Anticongelante" estado={checklist.anticongelante} activo={pasoActivo === 'anticongelante'}
                            onClick={() => setPasoActivo('anticongelante')} onSeleccionar={(val) => marcarPaso('anticongelante', val)}
                        />
                        <CheckPaso 
                            label="Líquido de Frenos" estado={checklist.frenos} activo={pasoActivo === 'frenos'}
                            onClick={() => setPasoActivo('frenos')} onSeleccionar={(val) => marcarPaso('frenos', val)}
                        />
                    </div>
                </div>

                {/* REPORTE DE DAÑOS (Solo aparece si hay alguna falla) */}
                {Object.values(checklist).includes(false) && (
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-red-100 animate-slide-up">
                        <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest text-center mb-4">Reporte de Daños</h3>
                        <textarea value={incidencia} onChange={(e) => setIncidencia(e.target.value)} placeholder="Describe la falla encontrada..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-red-500 transition-colors h-24 resize-none mb-3"></textarea>
                        {evidenciaPreview ? (
                            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200">
                                <img src={evidenciaPreview} alt="Evidencia" className="w-full h-full object-cover"/>
                                <button onClick={() => {setEvidenciaFile(null); setEvidenciaPreview(null);}} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg"><MdClose/></button>
                            </div>
                        ) : (
                            <button onClick={() => evidenciaInputRef.current.click()} className="w-full py-3.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"><MdCameraAlt className="text-base"/> Subir foto de evidencia</button>
                        )}
                        <input type="file" accept="image/*" capture="environment" ref={evidenciaInputRef} onChange={handleEvidencia} className="hidden" />
                    </div>
                )}

                {/* ODÓMETRO CON IA */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Kilometraje</h3>
                    <div className="flex items-center gap-3">
                        <input type="number" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} placeholder="Ej. 125000" disabled={isOcrProcessing} className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-lg font-black text-center text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                        <button onClick={() => ocrInputRef.current.click()} disabled={isOcrProcessing} className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-transform"><MdCameraAlt className="text-xl"/></button>
                        <input type="file" accept="image/*" capture="environment" ref={ocrInputRef} onChange={handleOCR} className="hidden" />
                    </div>
                    {isOcrProcessing && (
                        <div className="mt-3 animate-fade-in"><div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div></div><p className="text-[8px] font-black text-blue-500 uppercase text-center mt-1.5">{ocrStatus}</p></div>
                    )}
                </div>

                {/* VALE DE COMBUSTIBLE */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest text-center mb-4">Vale de Combustible</h3>
                    <div className="relative flex justify-center">
                        <span className="absolute left-4 top-3.5 font-black text-gray-400">$</span>
                        <input type="number" value={gasolina} onChange={(e) => setGasolina(e.target.value)} placeholder="Monto asignado hoy (Opcional)" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-orange-500 transition-colors text-center" />
                    </div>
                </div>
            </div>

            {/* BOTÓN INFERIOR */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe z-50">
                <button onClick={handleGuardar} disabled={loading || isOcrProcessing} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-900/20 disabled:opacity-50 transition-all">
                    {loading ? 'Sincronizando...' : 'Confirmar y Arrancar'}
                </button>
            </div>
        </div>
    );
}

// SUBCOMPONENTE: ACORDEÓN DE PASOS ESTILO FIGMA
function CheckPaso({ label, estado, activo, onClick, onSeleccionar }) {
    return (
        <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${activo ? 'bg-gray-50 border-gray-200 shadow-inner' : 'bg-white border-transparent hover:border-gray-100'}`}>
            <button onClick={onClick} className="w-full p-4 flex items-center justify-between text-left">
                <span className={`text-xs font-black uppercase tracking-widest ${activo ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                {estado === true && <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md shadow-green-500/30"><MdCheckCircle className="text-sm"/></div>}
                {estado === false && <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/30"><MdWarning className="text-sm"/></div>}
                {estado === null && <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>}
            </button>
            
            {/* Opciones que se despliegan si está activo */}
            {activo && (
                <div className="px-4 pb-4 flex gap-3 animate-fade-in">
                    <button onClick={() => onSeleccionar(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${estado === true ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-white border border-gray-200 text-gray-500 hover:bg-green-50'}`}>
                        <MdCheckCircle className="text-base"/> Todo Bien
                    </button>
                    <button onClick={() => onSeleccionar(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${estado === false ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white border border-gray-200 text-gray-500 hover:bg-red-50'}`}>
                        <MdWarning className="text-base"/> Falla
                    </button>
                </div>
            )}
        </div>
    );
}

// SUBCOMPONENTE: PUNTOS DE LUZ (HOTSPOTS)
function Hotspot({ top, left, status }) {
    // Si status es null (no revisado), brilla en azul. Si es true (OK) en verde, si es false (Error) en rojo.
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