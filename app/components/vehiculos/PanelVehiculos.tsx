/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/PanelVehiculos.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdDirectionsCar, MdAdd, MdEngineering, MdListAlt, MdCheckCircle } from 'react-icons/md';
import { FaCarSide, FaTruckPickup, FaMotorcycle } from 'react-icons/fa';

import { useVehiculos } from '../../hooks/useVehiculos';
import ModalVehiculo from './ModalVehiculo';
import ChecklistDiario from './ChecklistDiario'; // <-- IMPORTAMOS LA MAGIA

export default function PanelVehiculos({ usuarioActivo }) {
    const { vehiculos, loading, agregarVehiculo } = useVehiculos();
    
    // Validamos el rol
    const ROLES_ADMIN = ['GERENTE_MKT', 'DIRECTOR', 'GERENTE_GENERAL', 'SOPORTE_GENERAL'];
    const esEncargado = ROLES_ADMIN.includes(usuarioActivo?.rol);

    // Estados del Panel Admin
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para el Portal de Conductor (Usuarios Normales)
    const [modoChecklist, setModoChecklist] = useState(false);
    const [checklistTerminado, setChecklistTerminado] = useState(false);

    // Conectamos el Modal externo con la base de datos
    const handleGuardar = async (formData, archivoFinal) => {
        setIsSubmitting(true);
        const res = await agregarVehiculo(formData, archivoFinal);
        setIsSubmitting(false);
        if (res.success) {
            setModalAbierto(false);
        }
    };

    const RenderMiniatura = ({ tipo, color, url }) => {
        if (url) {
            return (
                <div className="h-40 w-full relative overflow-hidden bg-white rounded-t-[2rem] flex items-center justify-center border-b border-gray-50">
                    <img src={url} alt="Vehículo" className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-500" />
                </div>
            );
        }
        
        const style = { color: color || '#94a3b8', filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.15))' };
        return (
            <div className="h-40 flex items-center justify-center w-full relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100/50 rounded-t-[2rem]">
                <div className="relative z-10 transform scale-90 opacity-50">
                    {tipo === 'auto' || tipo === 'hatchback' ? <FaCarSide style={style} className="text-8xl" /> :
                     tipo === 'moto' ? <FaMotorcycle style={style} className="text-8xl" /> :
                     tipo === 'van' ? <FaTruckPickup style={style} className="text-8xl" /> :
                     <FaTruckPickup style={style} className="text-8xl" />}
                </div>
            </div>
        );
    };

    // --- VISTA 1: PORTAL DE CONDUCTOR (USUARIOS NO ADMINISTRADORES) ---
    if (!esEncargado) {
        // Si ya le dio "Iniciar", mostramos el componente pesado (3D y Cámara)
        if (modoChecklist) {
            return (
                <ChecklistDiario 
                    vehiculoId={vehiculos[0]?.id || "sin-asignar"} // Por ahora usa el primero que encuentre
                    usuarioId={usuarioActivo?.id} 
                    onCompletado={() => {
                        setModoChecklist(false);
                        setChecklistTerminado(true);
                    }} 
                />
            );
        }

        // Pantalla de Bienvenida al Conductor
        return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in pb-10 px-4 text-center">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">
                    <MdDirectionsCar />
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">Portal de Conductor</h2>
                
                {checklistTerminado ? (
                    <div className="bg-green-50 text-green-700 p-8 rounded-[2rem] max-w-md border border-green-200 mt-4 shadow-sm animate-slide-up">
                        <MdCheckCircle className="text-6xl mx-auto mb-4 text-green-500" />
                        <h3 className="font-black text-xl mb-2">¡Todo listo para arrancar!</h3>
                        <p className="text-sm font-medium">Tu bitácora de salida ha sido registrada en el sistema. Conduce con precaución.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm font-medium text-gray-500 max-w-md mb-8">
                            Antes de arrancar o solicitar un vehículo, por políticas de la empresa es obligatorio llenar la bitácora de revisión diaria.
                        </p>
                        <button 
                            onClick={() => setModoChecklist(true)} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
                        >
                            <MdListAlt className="text-xl"/> Iniciar Checklist Diario
                        </button>
                    </>
                )}
            </div>
        );
    }

    // --- VISTA 2: PANEL DE ADMINISTRACIÓN (ENCARGADOS) ---
    const vehiculosFiltrados = filtroEstado === 'TODOS' 
        ? vehiculos : vehiculos.filter(v => v.estado === filtroEstado);

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
                        Panel de Administración de Flotilla
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50">
                        <button onClick={() => setFiltroEstado('TODOS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'TODOS' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Todos ({vehiculos.length})</button>
                        <button onClick={() => setFiltroEstado('DISPONIBLE')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'DISPONIBLE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-green-600'}`}>Disponibles ({stats.disponibles})</button>
                        <button onClick={() => setFiltroEstado('EN_RUTA')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'EN_RUTA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}>En Ruta ({stats.ruta})</button>
                        <button onClick={() => setFiltroEstado('TALLER')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'TALLER' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-orange-600'}`}>Taller ({stats.taller})</button>
                    </div>

                    <button onClick={() => setModalAbierto(true)} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all shadow-sm active:scale-95">
                        <MdAdd className="text-lg"/> Nuevo Vehículo
                    </button>
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

            <ModalVehiculo 
                isOpen={modalAbierto} 
                onClose={() => setModalAbierto(false)} 
                onSave={handleGuardar} 
                isSubmitting={isSubmitting} 
            />
        </div>
    );
}