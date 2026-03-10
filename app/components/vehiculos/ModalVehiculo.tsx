/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ModalVehiculo.tsx                        */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { MdClose, MdCheckCircle, MdPhotoCamera, MdOutlineFormatColorFill, MdConfirmationNumber, MdShield, MdCrop, MdImage } from 'react-icons/md';
import Cropper from 'react-easy-crop';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('El canvas está vacío')); return; }
      const file = new File([blob], `vehiculo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.9);
  });
}

export default function ModalVehiculo({ isOpen, onClose, onSave, isSubmitting, vehiculoAEditar, isViewOnly }) {
    const [formData, setFormData] = useState({
        marca: '', modelo: '', anio: new Date().getFullYear(), color: '#ffffff',
        placas: '', serie: '', poliza: '', tipo_vehiculo: 'camioneta'
    });

    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [imagenRecortadaURL, setImagenRecortadaURL] = useState(null); 
    const [archivoFinal, setArchivoFinal] = useState(null); 
    
    const [renders, setRenders] = useState({
        img_cenital: null, img_lateral: null, img_diagonal: null, img_cofre: null
    });

    const [coordenadas, setCoordenadas] = useState({
        llantas: [], aceite: null, anticongelante: null, frenos: null
    });
    const [hotspotActivo, setHotspotActivo] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (vehiculoAEditar && isOpen) {
            setFormData({
                id: vehiculoAEditar.id,
                marca: vehiculoAEditar.marca || '',
                modelo: vehiculoAEditar.modelo || '',
                anio: vehiculoAEditar.anio || new Date().getFullYear(),
                color: vehiculoAEditar.color || '#ffffff',
                placas: vehiculoAEditar.placas || '',
                serie: vehiculoAEditar.serie || '',
                poliza: vehiculoAEditar.poliza || '',
                tipo_vehiculo: vehiculoAEditar.tipo_vehiculo || 'camioneta'
            });
            setImagenRecortadaURL(vehiculoAEditar.imagen_url || null);
            setCoordenadas(vehiculoAEditar.coordenadas_hotspots || { llantas: [], aceite: null, anticongelante: null, frenos: null });
        } else if (!vehiculoAEditar && isOpen) {
            setFormData({ marca: '', modelo: '', anio: new Date().getFullYear(), color: '#ffffff', placas: '', serie: '', poliza: '', tipo_vehiculo: 'camioneta' });
            setImagenRecortadaURL(null);
            setCoordenadas({ llantas: [], aceite: null, anticongelante: null, frenos: null });
        }
    }, [vehiculoAEditar, isOpen]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRenderChange = (e, key) => {
        if (e.target.files && e.target.files.length > 0) {
            setRenders({ ...renders, [key]: e.target.files[0] });
        }
    };

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            let imageDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            setImageSrc(imageDataUrl);
            setImagenRecortadaURL(null); 
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const confirmarRecorte = async () => {
        try {
            const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            setArchivoFinal(croppedFile);
            setImagenRecortadaURL(URL.createObjectURL(croppedFile));
            setImageSrc(null); 
        } catch (e) {
            console.error("Error al recortar:", e);
        }
    };

    const handleClose = () => {
        setFormData({ marca: '', modelo: '', anio: new Date().getFullYear(), color: '#ffffff', placas: '', serie: '', poliza: '', tipo_vehiculo: 'camioneta' });
        setImageSrc(null); setImagenRecortadaURL(null); setArchivoFinal(null);
        setRenders({ img_cenital: null, img_lateral: null, img_diagonal: null, img_cofre: null });
        setHotspotActivo(null);
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, coordenadas_hotspots: coordenadas }, archivoFinal, renders);
    };

    const handleImageClick = (e, vista) => {
        if (!hotspotActivo || isViewOnly) return;
        
        if (vista === 'lateral' && hotspotActivo !== 'llanta') return alert("Selecciona 'Llantas' para marcar puntos en la vista lateral.");
        if (vista === 'cofre' && hotspotActivo === 'llanta') return alert("Selecciona un componente del motor para marcar en el cofre.");

        // MAGIA DE PRECISIÓN: Se calcula sobre el contenedor exacto de la imagen
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const nuevoPunto = { top: `${y.toFixed(2)}%`, left: `${x.toFixed(2)}%` };

        if (hotspotActivo === 'llanta') {
            const nuevasLlantas = coordenadas.llantas.length >= 2 ? [nuevoPunto] : [...coordenadas.llantas, nuevoPunto];
            setCoordenadas({ ...coordenadas, llantas: nuevasLlantas });
        } else {
            setCoordenadas({ ...coordenadas, [hotspotActivo]: nuevoPunto });
        }
    };

    const getRenderUrl = (key) => {
        if (renders[key]) return URL.createObjectURL(renders[key]);
        if (vehiculoAEditar && vehiculoAEditar[key]) return vehiculoAEditar[key];
        return null;
    };

    const renderLateralUrl = getRenderUrl('img_lateral');
    const renderCofreUrl = getRenderUrl('img_cofre');
    const mostrarConfigurador = renderLateralUrl || renderCofreUrl;

    if (!isOpen) return null;

    const RenderInput = ({ title, renderKey }) => {
        const tieneRenderPrevio = vehiculoAEditar && vehiculoAEditar[renderKey];
        return (
            <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{title}</label>
                <div className={`relative flex items-center justify-center border-2 border-dashed rounded-xl p-2 transition-colors ${renders[renderKey] || tieneRenderPrevio ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                    <input type="file" accept="image/png" onChange={(e) => handleRenderChange(e, renderKey)} disabled={isSubmitting || isViewOnly} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                    <div className="flex flex-col items-center pointer-events-none text-center">
                        <MdImage className={`text-xl ${renders[renderKey] || tieneRenderPrevio ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className={`text-[8px] font-bold uppercase mt-1 ${renders[renderKey] || tieneRenderPrevio ? 'text-blue-600' : 'text-gray-400'}`}>
                            {renders[renderKey] ? renders[renderKey].name : (tieneRenderPrevio ? 'Render Guardado' : 'Cargar PNG')}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const tituloModal = isViewOnly ? 'Detalles de Vehículo' : (vehiculoAEditar ? 'Editar Vehículo' : 'Alta de Vehículo');

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdPhotoCamera className="text-blue-600"/> {tituloModal}</h3>
                    <button onClick={handleClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="mb-8">
                        {imageSrc ? (
                            <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col items-center p-4 relative h-[300px]">
                                <div className="relative w-full h-full mb-4 rounded-xl overflow-hidden">
                                    <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={16 / 9} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                                </div>
                                <div className="w-full flex justify-between items-center gap-4 z-10">
                                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full accent-blue-500" />
                                    <button onClick={confirmarRecorte} type="button" className="px-5 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 whitespace-nowrap flex items-center gap-1 shadow-md"><MdCrop className="text-sm"/> Confirmar Recorte</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => !isSubmitting && !isViewOnly && fileInputRef.current.click()} className={`w-full h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center transition-colors relative overflow-hidden group ${!isSubmitting && !isViewOnly && 'cursor-pointer hover:bg-gray-100'}`}>
                                {imagenRecortadaURL ? (
                                    <>
                                        <img src={imagenRecortadaURL} alt="Preview Final" className="w-full h-full object-cover" />
                                        {!isViewOnly && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-xs font-black uppercase tracking-widest bg-black/50 px-4 py-2 rounded-xl">Cambiar Foto</span></div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <MdPhotoCamera className="text-5xl text-gray-300 mb-2 group-hover:text-blue-400 transition-colors" />
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Subir Foto Principal (Catálogo)</span>
                                    </>
                                )}
                            </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} disabled={isSubmitting || isViewOnly}/>
                    </div>

                    <form id="formVehiculo" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Marca</label><input required name="marca" value={formData.marca} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 disabled:opacity-70" disabled={isSubmitting || isViewOnly}/></div>
                            <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Modelo</label><input required name="modelo" value={formData.modelo} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 disabled:opacity-70" disabled={isSubmitting || isViewOnly}/></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Año</label><input required type="number" name="anio" value={formData.anio} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 disabled:opacity-70" disabled={isSubmitting || isViewOnly}/></div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tipo</label>
                                <select name="tipo_vehiculo" value={formData.tipo_vehiculo} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 cursor-pointer disabled:opacity-70" disabled={isSubmitting || isViewOnly}>
                                    <option value="camioneta">Camioneta</option><option value="auto">Auto Sedán</option><option value="hatchback">Hatchback</option><option value="van">Van / Furgoneta</option><option value="moto">Motocicleta</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Color Básico</label>
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 focus-within:border-blue-500 opacity-100 disabled:opacity-70"><MdOutlineFormatColorFill className="text-gray-400 text-lg ml-2"/><input type="color" name="color" value={formData.color} onChange={handleChange} className="w-full h-8 cursor-pointer bg-transparent border-none outline-none rounded disabled:cursor-not-allowed" disabled={isSubmitting || isViewOnly}/></div>
                            </div>
                        </div>

                        {/* SECCIÓN RENDERS DE 4 ÁNGULOS */}
                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                            <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Imágenes Base (Bitácora Móvil)</h4>
                            {!isViewOnly && <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-4">Sube las 4 vistas del vehículo sin fondo (PNG).</p>}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <RenderInput title="Vista Superior" renderKey="img_cenital" />
                                <RenderInput title="Vista Lateral" renderKey="img_lateral" />
                                <RenderInput title="Vista Diagonal" renderKey="img_diagonal" />
                                <RenderInput title="Vista Cofre Abierto" renderKey="img_cofre" />
                            </div>
                        </div>

                        {/* CONFIGURADOR VISUAL DE HOTSPOTS */}
                        {mostrarConfigurador && (
                            <div className="p-5 bg-orange-50/30 rounded-2xl border border-orange-200 space-y-4">
                                <div>
                                    <h4 className="text-xs font-black text-orange-900 uppercase tracking-widest mb-1">Configurador de Puntos (Hotspots)</h4>
                                    {!isViewOnly && <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-2">1. Selecciona un botón abajo.<br/>2. Haz clic sobre la imagen para colocar el punto exacto para este modelo.</p>}
                                </div>
                                
                                {!isViewOnly && (
                                    <div className="flex flex-wrap gap-2 pb-2">
                                        <button type="button" onClick={() => setHotspotActivo('llanta')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${hotspotActivo === 'llanta' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'}`}>Llantas (Máx 2)</button>
                                        <button type="button" onClick={() => setHotspotActivo('aceite')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${hotspotActivo === 'aceite' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'}`}>Aceite</button>
                                        <button type="button" onClick={() => setHotspotActivo('anticongelante')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${hotspotActivo === 'anticongelante' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'}`}>Anticongelante</button>
                                        <button type="button" onClick={() => setHotspotActivo('frenos')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${hotspotActivo === 'frenos' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'}`}>Frenos</button>
                                        <button type="button" onClick={() => setCoordenadas({ llantas: [], aceite: null, anticongelante: null, frenos: null })} className="ml-auto px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 active:scale-95">Limpiar Todo</button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {renderLateralUrl && (
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Lateral (Llantas)</span>
                                            {/* CONTENEDOR MODIFICADO PARA PRECISIÓN */}
                                            <div className={`w-full h-48 bg-white rounded-xl border-2 flex items-center justify-center overflow-hidden transition-colors ${hotspotActivo === 'llanta' && !isViewOnly ? 'border-orange-400' : 'border-gray-200'}`}>
                                                <div className={`relative h-full inline-block ${hotspotActivo === 'llanta' && !isViewOnly ? 'cursor-crosshair' : ''}`} onClick={(e) => handleImageClick(e, 'lateral')}>
                                                    <img src={renderLateralUrl} alt="Lateral" className="h-full w-auto object-contain pointer-events-none" />
                                                    {coordenadas.llantas.map((punto, i) => (
                                                        <div key={i} className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg" style={{ top: punto.top, left: punto.left }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {renderCofreUrl && (
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Cofre (Motor)</span>
                                            {/* CONTENEDOR MODIFICADO PARA PRECISIÓN */}
                                            <div className={`w-full h-48 bg-white rounded-xl border-2 flex items-center justify-center overflow-hidden transition-colors ${['aceite', 'anticongelante', 'frenos'].includes(hotspotActivo) && !isViewOnly ? 'border-orange-400' : 'border-gray-200'}`}>
                                                <div className={`relative h-full inline-block ${['aceite', 'anticongelante', 'frenos'].includes(hotspotActivo) && !isViewOnly ? 'cursor-crosshair' : ''}`} onClick={(e) => handleImageClick(e, 'cofre')}>
                                                    <img src={renderCofreUrl} alt="Cofre" className="h-full w-auto object-contain pointer-events-none" />
                                                    {coordenadas.aceite && <div className="absolute w-4 h-4 rounded-full bg-yellow-500 border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center text-[8px] text-white font-black" style={{ top: coordenadas.aceite.top, left: coordenadas.aceite.left }}>A</div>}
                                                    {coordenadas.anticongelante && <div className="absolute w-4 h-4 rounded-full bg-green-500 border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center text-[8px] text-white font-black" style={{ top: coordenadas.anticongelante.top, left: coordenadas.anticongelante.left }}>N</div>}
                                                    {coordenadas.frenos && <div className="absolute w-4 h-4 rounded-full bg-red-500 border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center text-[8px] text-white font-black" style={{ top: coordenadas.frenos.top, left: coordenadas.frenos.left }}>F</div>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-5">
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-2">Datos Legales</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MdConfirmationNumber/> Placas</label><input required name="placas" value={formData.placas} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-800 uppercase outline-none focus:border-blue-500 disabled:opacity-70" disabled={isSubmitting || isViewOnly}/></div>
                                <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Niv. / Serie</label><input required name="serie" value={formData.serie} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 uppercase outline-none focus:border-blue-500 disabled:opacity-70" disabled={isSubmitting || isViewOnly}/></div>
                                <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MdShield/> Número Póliza Seguro</label><input name="poliza" value={formData.poliza} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 disabled:opacity-70" disabled={isSubmitting || isViewOnly}/></div>
                            </div>
                        </div>
                    </form>
                </div>

                {!isViewOnly && (
                    <div className="p-6 border-t border-gray-100 bg-white shrink-0">
                        <button form="formVehiculo" type="submit" disabled={isSubmitting || (imageSrc !== null)} className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 active:scale-95 disabled:opacity-50">
                            {isSubmitting ? 'Guardando en BD...' : <><MdCheckCircle className="text-xl"/> {vehiculoAEditar ? 'Guardar Cambios' : 'Registrar Vehículo'}</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}