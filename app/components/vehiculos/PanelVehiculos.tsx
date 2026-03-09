/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/PanelVehiculos.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef } from 'react';
import { 
    MdDirectionsCar, MdAdd, MdClose, MdCheckCircle, MdEngineering, 
    MdOutlineFormatColorFill, MdConfirmationNumber, MdShield, MdListAlt, MdPhotoCamera 
} from 'react-icons/md';
import { FaCarSide, FaTruckPickup, FaMotorcycle } from 'react-icons/fa';

import { useVehiculos } from '../../hooks/useVehiculos';

export default function PanelVehiculos({ usuarioActivo }) {
    const { vehiculos, loading, agregarVehiculo } = useVehiculos();
    
    const ROLES_ADMIN = ['GERENTE_MKT', 'DIRECTOR', 'GERENTE_GENERAL', 'SOPORTE_GENERAL'];
    const esEncargado = ROLES_ADMIN.includes(usuarioActivo?.rol);

    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para la carga de fotografía
    const [imagenFile, setImagenFile] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        marca: '', modelo: '', anio: new Date().getFullYear(), color: '#ffffff',
        placas: '', serie: '', poliza: '', tipo_vehiculo: 'camioneta'
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Carga la vista previa en el navegador antes de subir
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagenFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagenPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Le pasamos la info y la foto
        const res = await agregarVehiculo(formData, imagenFile);
        setIsSubmitting(false);
        
        if (res.success) {
            setModalAbierto(false);
            setFormData({ marca: '', modelo: '', anio: new Date().getFullYear(), color: '#ffffff', placas: '', serie: '', poliza: '', tipo_vehiculo: 'camioneta' });
            setImagenFile(null);
            setImagenPreview(null);
        }
    };

    // Componente Inteligente: Muestra la foto real o un "Placeholder" si no hay foto
    const RenderMiniatura = ({ tipo, color, url }) => {
        if (url) {
            return (
                <div className="h-40 w-full relative overflow-hidden bg-gray-100 rounded-t-[2rem]">
                    <img src={url} alt="Vehículo" className="w-full h-full object-cover" />
                </div>
            );
        }
        
        // Si registraron un auto viejo sin foto, le mostramos el ícono gris opaco
        const style = { color: color || '#94a3b8', filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.15))' };
        return (
            <div className="h-40 flex items-center justify-center w-full relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100/50 rounded-t-[2rem]">
                <div className="relative z-10 transform scale-90 opacity-50">
                    {tipo === 'auto' || tipo === 'hatchback' ? <FaCarSide style={style} className="text-8xl" /> :
                     tipo === 'moto' ? <FaMotorcycle style={style} className="text-8xl" /> :
                     <FaTruckPickup style={style} className="text-8xl" />}
                </div>
            </div>
        );
    };

    const vehiculosFiltrados = filtroEstado === 'TODOS' 
        ? vehiculos 
        : vehiculos.filter(v => v.estado === filtroEstado);

    const stats = {
        disponibles: vehiculos.filter(v => v.estado === 'DISPONIBLE').length,
        ruta: vehiculos.filter(v => v.estado === 'EN_RUTA').length,
        taller: vehiculos.filter(v => v.estado === 'TALLER').length,
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10">
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0">
                <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                        <MdDirectionsCar className="text-blue-600 text-2xl" /> Control Vehicular
                    </h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        {esEncargado ? 'Panel de Administración de Flotilla' : 'Panel de Usuario y Bitácora'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50">
                        <button onClick={() => setFiltroEstado('TODOS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'TODOS' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Todos ({vehiculos.length})</button>
                        <button onClick={() => setFiltroEstado('DISPONIBLE')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'DISPONIBLE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-green-600'}`}>Disponibles ({stats.disponibles})</button>
                        <button onClick={() => setFiltroEstado('EN_RUTA')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'EN_RUTA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}>En Ruta ({stats.ruta})</button>
                        <button onClick={() => setFiltroEstado('TALLER')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'TALLER' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-orange-600'}`}>Taller ({stats.taller})</button>
                    </div>

                    {esEncargado && (
                        <button onClick={() => setModalAbierto(true)} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all shadow-sm active:scale-95">
                            <MdAdd className="text-lg"/> Nuevo Vehículo
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : vehiculosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <MdDirectionsCar className="text-6xl text-gray-200 mb-4"/>
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No hay vehículos registrados</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                        {vehiculosFiltrados.map(v => (
                            <div key={v.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                                
                                {/* FOTO DEL VEHÍCULO */}
                                <div className="relative">
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm border ${
                                            v.estado === 'DISPONIBLE' ? 'bg-green-50 text-green-600 border-green-200' :
                                            v.estado === 'EN_RUTA' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            'bg-orange-50 text-orange-600 border-orange-200'
                                        }`}>
                                            {v.estado.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <RenderMiniatura tipo={v.tipo_vehiculo} color={v.color} url={v.imagen_url} />
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">{v.marca} {v.modelo}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Año {v.anio}</p>
                                    
                                    <div className="bg-gray-50 rounded-2xl p-3 grid grid-cols-2 gap-3 mb-4 flex-1 border border-gray-100">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Placas</p>
                                            <p className="text-xs font-black text-gray-700">{v.placas}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Póliza Seguro</p>
                                            <p className="text-xs font-black text-gray-700 truncate">{v.poliza || 'S/N'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <button className="py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5">
                                            <MdListAlt className="text-sm"/> Bitácora
                                        </button>
                                        <button className="py-2.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5">
                                            <MdEngineering className="text-sm"/> Taller
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL DE REGISTRO */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdDirectionsCar className="text-blue-600"/> Alta de Vehículo</h3>
                            <button onClick={() => {
                                setModalAbierto(false);
                                setImagenPreview(null);
                                setImagenFile(null);
                            }} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <form id="formVehiculo" onSubmit={handleGuardar} className="space-y-6">
                                
                                {/* CAJA DE SUBIDA DE FOTO */}
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <div 
                                        onClick={() => fileInputRef.current.click()}
                                        className="w-full h-40 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden"
                                    >
                                        {imagenPreview ? (
                                            <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <MdPhotoCamera className="text-4xl text-gray-400 mb-2" />
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subir Foto del Vehículo</span>
                                                <span className="text-[10px] font-medium text-gray-400 mt-1">Formatos recomendados: JPG, PNG</span>
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        ref={fileInputRef} 
                                        onChange={handleImageChange} 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Marca</label>
                                        <input required name="marca" value={formData.marca} onChange={handleChange} placeholder="Ej. Nissan, Chevrolet" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Modelo</label>
                                        <input required name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej. NP300, Beat" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Año</label>
                                        <input required type="number" name="anio" value={formData.anio} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Tipo</label>
                                        <select name="tipo_vehiculo" value={formData.tipo_vehiculo} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 cursor-pointer">
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
                                            <input type="color" name="color" value={formData.color} onChange={handleChange} className="w-full h-8 cursor-pointer bg-transparent border-none outline-none rounded" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-5">
                                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-2">Datos Legales / Operativos</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MdConfirmationNumber/> Placas</label>
                                            <input required name="placas" value={formData.placas} onChange={handleChange} placeholder="Ej. GTO-1234" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-800 uppercase outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Niv. / Número de Serie</label>
                                            <input required name="serie" value={formData.serie} onChange={handleChange} placeholder="17 Caracteres" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 uppercase outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MdShield/> Número Póliza Seguro</label>
                                            <input name="poliza" value={formData.poliza} onChange={handleChange} placeholder="Opcional" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-white">
                            <button form="formVehiculo" type="submit" disabled={isSubmitting} className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 active:scale-95 disabled:opacity-50">
                                {isSubmitting ? 'Guardando y Subiendo Foto...' : <><MdCheckCircle className="text-xl"/> Registrar Vehículo</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}