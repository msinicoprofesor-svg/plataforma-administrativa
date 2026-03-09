/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ModalVehiculo.tsx                        */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useCallback, useRef } from 'react';
import { MdClose, MdCheckCircle, MdPhotoCamera, MdOutlineFormatColorFill, MdConfirmationNumber, MdShield, MdCrop } from 'react-icons/md';
import Cropper from 'react-easy-crop';

// --- MOTOR MATEMÁTICO DE RECORTE ---
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

  ctx.drawImage(
    image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('El canvas está vacío')); return; }
      // Convertimos el recorte a un archivo físico para Supabase
      const file = new File([blob], `vehiculo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.9);
  });
}

export default function ModalVehiculo({ isOpen, onClose, onSave, isSubmitting }) {
    const [formData, setFormData] = useState({
        marca: '', modelo: '', anio: new Date().getFullYear(), color: '#ffffff',
        placas: '', serie: '', poliza: '', tipo_vehiculo: 'camioneta'
    });

    // Estados del Editor de Imagen
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [imagenRecortadaURL, setImagenRecortadaURL] = useState(null); // Preview final
    const [archivoFinal, setArchivoFinal] = useState(null); // Archivo a subir
    
    const fileInputRef = useRef(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // 1. El usuario selecciona la foto de su computadora/celular
    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            let imageDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            setImageSrc(imageDataUrl);
            setImagenRecortadaURL(null); // Resetea si elige otra foto
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // 2. El usuario confirma el recorte
    const confirmarRecorte = async () => {
        try {
            const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            setArchivoFinal(croppedFile);
            setImagenRecortadaURL(URL.createObjectURL(croppedFile));
            setImageSrc(null); // Cerramos el editor
        } catch (e) {
            console.error("Error al recortar:", e);
        }
    };

    // 3. Limpiamos y cerramos
    const handleClose = () => {
        setFormData({ marca: '', modelo: '', anio: new Date().getFullYear(), color: '#ffffff', placas: '', serie: '', poliza: '', tipo_vehiculo: 'camioneta' });
        setImageSrc(null);
        setImagenRecortadaURL(null);
        setArchivoFinal(null);
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, archivoFinal);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <MdPhotoCamera className="text-blue-600"/> Alta de Vehículo
                    </h3>
                    <button onClick={handleClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors">
                        <MdClose className="text-xl"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* ZONA DE FOTOGRAFÍA Y EDICIÓN */}
                    <div className="mb-8">
                        {imageSrc ? (
                            // MODO EDICIÓN (CROPPER)
                            <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col items-center p-4 relative h-[300px]">
                                <div className="relative w-full h-full mb-4 rounded-xl overflow-hidden">
                                    <Cropper
                                        image={imageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={16 / 9} // Formato panorámico para autos
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>
                                <div className="w-full flex justify-between items-center gap-4 z-10">
                                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full accent-blue-500" />
                                    <button onClick={confirmarRecorte} type="button" className="px-5 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 whitespace-nowrap flex items-center gap-1 shadow-md">
                                        <MdCrop className="text-sm"/> Confirmar Recorte
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // MODO VISTA PREVIA O SELECCIÓN
                            <div 
                                onClick={() => !isSubmitting && fileInputRef.current.click()}
                                className={`w-full h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center transition-colors relative overflow-hidden group ${!isSubmitting && 'cursor-pointer hover:bg-gray-100'}`}
                            >
                                {imagenRecortadaURL ? (
                                    <>
                                        <img src={imagenRecortadaURL} alt="Preview Final" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-black uppercase tracking-widest bg-black/50 px-4 py-2 rounded-xl">Cambiar Foto</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <MdPhotoCamera className="text-5xl text-gray-300 mb-2 group-hover:text-blue-400 transition-colors" />
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Subir Foto Real</span>
                                        <span className="text-[10px] font-medium text-gray-400 mt-1">Formato 16:9 recomendado</span>
                                    </>
                                )}
                            </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} disabled={isSubmitting}/>
                    </div>

                    <form id="formVehiculo" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Marca</label>
                                <input required name="marca" value={formData.marca} onChange={handleChange} placeholder="Ej. Nissan, Chevrolet" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" disabled={isSubmitting}/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Modelo</label>
                                <input required name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej. NP300, Beat" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" disabled={isSubmitting}/>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Año</label>
                                <input required type="number" name="anio" value={formData.anio} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" disabled={isSubmitting}/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tipo</label>
                                <select name="tipo_vehiculo" value={formData.tipo_vehiculo} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 cursor-pointer" disabled={isSubmitting}>
                                    <option value="camioneta">Camioneta</option>
                                    <option value="auto">Auto Sedán</option>
                                    <option value="hatchback">Hatchback</option>
                                    <option value="van">Van / Furgoneta</option>
                                    <option value="moto">Motocicleta</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Color Básico</label>
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 focus-within:border-blue-500 transition-colors">
                                    <MdOutlineFormatColorFill className="text-gray-400 text-lg ml-2"/>
                                    <input type="color" name="color" value={formData.color} onChange={handleChange} className="w-full h-8 cursor-pointer bg-transparent border-none outline-none rounded" disabled={isSubmitting}/>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-5">
                            <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-2">Datos Legales / Operativos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MdConfirmationNumber/> Placas</label>
                                    <input required name="placas" value={formData.placas} onChange={handleChange} placeholder="Ej. GTO-1234" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-800 uppercase outline-none focus:border-blue-500" disabled={isSubmitting}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Niv. / Número de Serie</label>
                                    <input required name="serie" value={formData.serie} onChange={handleChange} placeholder="17 Caracteres" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 uppercase outline-none focus:border-blue-500" disabled={isSubmitting}/>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MdShield/> Número Póliza Seguro</label>
                                    <input name="poliza" value={formData.poliza} onChange={handleChange} placeholder="Opcional" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" disabled={isSubmitting}/>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-white shrink-0">
                    <button form="formVehiculo" type="submit" disabled={isSubmitting || imageSrc !== null} className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 active:scale-95 disabled:opacity-50">
                        {isSubmitting ? 'Guardando y Subiendo Foto...' : <><MdCheckCircle className="text-xl"/> Registrar Vehículo</>}
                    </button>
                </div>
            </div>
        </div>
    );
}