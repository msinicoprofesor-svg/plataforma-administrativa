/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/PanelVehiculos.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdDirectionsCar, MdAdd, MdEngineering, MdListAlt, MdCheckCircle, MdPersonAdd, MdPersonOff, MdLockOutline, MdClose, MdSearch } from 'react-icons/md';
import { FaCarSide, FaTruckPickup, FaMotorcycle, FaUserCircle } from 'react-icons/fa';

import { useVehiculos } from '../../hooks/useVehiculos';
import ModalVehiculo from './ModalVehiculo';
import ChecklistDiario from './ChecklistDiario';

export default function PanelVehiculos({ usuarioActivo, colaboradores = [] }) {
    const { vehiculos, loading, agregarVehiculo, asignarVehiculo } = useVehiculos();
    
    const ROLES_ADMIN = ['GERENTE_MKT', 'DIRECTOR', 'GERENTE_GENERAL', 'SOPORTE_GENERAL'];
    const esEncargado = ROLES_ADMIN.includes(usuarioActivo?.rol);

    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados del conductor
    const [modoChecklist, setModoChecklist] = useState(false);
    const [checklistTerminado, setChecklistTerminado] = useState(false);

    // Estados para la asignación corporativa
    const [vehiculoAAsignar, setVehiculoAAsignar] = useState(null);
    const [busquedaAsignacion, setBusquedaAsignacion] = useState('');

    const handleGuardar = async (formData, archivoFinal) => {
        setIsSubmitting(true);
        const res = await agregarVehiculo(formData, archivoFinal);
        setIsSubmitting(false);
        if (res.success) setModalAbierto(false);
    };

    const confirmarAsignacion = async (vehiculoId, colaboradorId) => {
        setIsSubmitting(true);
        const res = await asignarVehiculo(vehiculoId, colaboradorId);
        setIsSubmitting(false);
        if (res.success) setVehiculoAAsignar(null);
    };

    const liberarVehiculo = async (vehiculoId) => {
        if(confirm("¿Estás seguro de liberar este vehículo? Quedará disponible para asignación.")){
            await asignarVehiculo(vehiculoId, null);
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
                     tipo === 'moto' ? <FaMotorcycle style={style} className="text-8xl" /> : <FaTruckPickup style={style} className="text-8xl" />}
                </div>
            </div>
        );
    };

    if (!esEncargado) {
        const miVehiculo = vehiculos.find(v => v.responsable_id === usuarioActivo?.id);

        if (modoChecklist && miVehiculo) {
            return <ChecklistDiario vehiculoId={miVehiculo.id} usuarioId={usuarioActivo?.id} onCompletado={() => { setModoChecklist(false); setChecklistTerminado(true); }} />;
        }

        return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in pb-10 px-4 text-center">
                {!miVehiculo ? (
                    <>
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner"><MdLockOutline /></div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Sin Vehículo Asignado</h2>
                        <p className="text-sm font-medium text-gray-500 max-w-md mb-8">No tienes ninguna unidad asignada para la ruta de hoy. Por favor, solicita a tu encargado de flotilla que te asigne un vehículo en el sistema.</p>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner"><MdDirectionsCar /></div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Tu Unidad: {miVehiculo.marca} {miVehiculo.modelo}</h2>
                        {checklistTerminado ? (
                            <div className="bg-green-50 text-green-700 p-8 rounded-[2rem] max-w-md border border-green-200 mt-4 shadow-sm animate-slide-up">
                                <MdCheckCircle className="text-6xl mx-auto mb-4 text-green-500" />
                                <h3 className="font-black text-xl mb-2">¡Todo listo para arrancar!</h3>
                                <p className="text-sm font-medium">Tu bitácora de salida ha sido registrada en el sistema. Conduce con precaución.</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gray-500 max-w-md mb-8">Antes de arrancar la ruta con la unidad <strong className="text-gray-800">{miVehiculo.placas}</strong>, por políticas de la empresa es obligatorio llenar la bitácora de revisión diaria.</p>
                                <button onClick={() => setModoChecklist(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-500/30 active:scale-95 transition-all"><MdListAlt className="text-xl"/> Iniciar Checklist Diario</button>
                            </>
                        )}
                    </>
                )}
            </div>
        );
    }

    const vehiculosFiltrados = filtroEstado === 'TODOS' ? vehiculos : vehiculos.filter(v => v.estado === filtroEstado);
    const stats = {
        disponibles: vehiculos.filter(v => v.estado === 'DISPONIBLE').length,
        ruta: vehiculos.filter(v => v.estado === 'EN_RUTA').length,
        taller: vehiculos.filter(v => v.estado === 'TALLER').length,
    };

    // Filtramos los colaboradores para el buscador del modal
    const colaboradoresBusqueda = colaboradores.filter(c => 
        c.nombre.toLowerCase().includes(busquedaAsignacion.toLowerCase()) || 
        c.puesto?.toLowerCase().includes(busquedaAsignacion.toLowerCase()) ||
        c.id?.toLowerCase().includes(busquedaAsignacion.toLowerCase())
    ).slice(0, 15); // Mostramos máximo 15 para no saturar la vista

    // Función para obtener el nombre del responsable actual
    const getNombreResponsable = (id) => {
        const col = colaboradores.find(c => c.id === id);
        return col ? col.nombre : 'Usuario Desconocido';
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0">
                <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide"><MdDirectionsCar className="text-blue-600 text-2xl" /> Control Vehicular</h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Panel de Administración de Flotilla</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50">
                        <button onClick={() => setFiltroEstado('TODOS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'TODOS' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Todos ({vehiculos.length})</button>
                        <button onClick={() => setFiltroEstado('DISPONIBLE')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'DISPONIBLE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-green-600'}`}>Disponibles ({stats.disponibles})</button>
                        <button onClick={() => setFiltroEstado('EN_RUTA')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'EN_RUTA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}>En Ruta ({stats.ruta})</button>
                        <button onClick={() => setFiltroEstado('TALLER')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtroEstado === 'TALLER' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-orange-600'}`}>Taller ({stats.taller})</button>
                    </div>
                    <button onClick={() => setModalAbierto(true)} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all shadow-sm active:scale-95"><MdAdd className="text-lg"/> Nuevo Vehículo</button>
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
                                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm border ${v.estado === 'DISPONIBLE' ? 'bg-green-50 text-green-600 border-green-200' : v.estado === 'EN_RUTA' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                            {v.estado.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <RenderMiniatura tipo={v.tipo_vehiculo} color={v.color} url={v.imagen_url} />
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-black text-gray-900 leading-tight">{v.marca} {v.modelo}</h3>
                                        {v.responsable_id ? (
                                            <span className="bg-blue-100 text-blue-700 text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-widest flex items-center gap-1"><MdPersonAdd/> Asignado</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-500 text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-widest flex items-center gap-1"><MdPersonOff/> Libre</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Año {v.anio}</p>
                                    
                                    <div className="bg-gray-50 rounded-2xl p-3 mb-4 flex-1 border border-gray-100">
                                        {v.responsable_id ? (
                                            <div>
                                                <p className="text-[9px] font-bold text-blue-500 uppercase mb-1">Conductor Actual</p>
                                                <p className="text-xs font-black text-gray-800 truncate">{getNombreResponsable(v.responsable_id)}</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><p className="text-[9px] font-bold text-gray-400 uppercase">Placas</p><p className="text-xs font-black text-gray-700">{v.placas}</p></div>
                                                <div><p className="text-[9px] font-bold text-gray-400 uppercase">Póliza</p><p className="text-xs font-black text-gray-700 truncate">{v.poliza || 'S/N'}</p></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        {v.responsable_id ? (
                                            <button onClick={() => liberarVehiculo(v.id)} className="py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border border-red-100">
                                                Liberar Auto
                                            </button>
                                        ) : (
                                            <button onClick={() => { setVehiculoAAsignar(v); setBusquedaAsignacion(''); }} className="py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border border-blue-100">
                                                Asignar Auto
                                            </button>
                                        )}
                                        <button className="py-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border border-gray-200">
                                            <MdListAlt className="text-sm"/> Bitácora
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <ModalVehiculo isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSave={handleGuardar} isSubmitting={isSubmitting} />

            {/* MODAL DE ASIGNACIÓN CORPORATIVA */}
            {vehiculoAAsignar && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">Asignar Vehículo</h3>
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">{vehiculoAAsignar.marca} {vehiculoAAsignar.modelo} • {vehiculoAAsignar.placas}</p>
                            </div>
                            <button onClick={() => setVehiculoAAsignar(null)} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                        </div>

                        <div className="p-4 border-b border-gray-100 bg-white">
                            <div className="relative">
                                <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                <input 
                                    type="text" 
                                    value={busquedaAsignacion}
                                    onChange={(e) => setBusquedaAsignacion(e.target.value)}
                                    placeholder="Buscar por nombre, puesto o ID..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-gray-50">
                            {colaboradoresBusqueda.length > 0 ? (
                                colaboradoresBusqueda.map(col => (
                                    <button 
                                        key={col.id}
                                        onClick={() => confirmarAsignacion(vehiculoAAsignar.id, col.id)}
                                        disabled={isSubmitting}
                                        className="w-full flex items-center gap-4 p-4 hover:bg-white rounded-2xl transition-all active:scale-95 text-left border border-transparent hover:border-gray-200 mb-1 disabled:opacity-50"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                                            {col.foto ? <img src={col.foto} alt="Foto" className="w-full h-full object-cover"/> : <FaUserCircle className="text-2xl" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-gray-800 truncate">{col.nombre}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{col.puesto || 'Sin Puesto'} • ID: {col.id}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><MdAdd /></div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No se encontraron colaboradores</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}