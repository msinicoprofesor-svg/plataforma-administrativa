/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/solicitudes/BandejaAprobacion.tsx        */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdAssignment, MdClose, MdCheckCircle, MdCancel, MdOutlineDateRange, 
    MdHourglassEmpty, MdAccessTime, MdLocationOn, MdDirectionsCar 
} from 'react-icons/md';
import { FaUserCircle, FaCarSide, FaMotorcycle, FaTruckPickup } from 'react-icons/fa';
import { useSolicitudesVehiculos } from '../../../hooks/useSolicitudesVehiculos';

export default function BandejaAprobacion({ usuarioActivo, colaboradores = [], vehiculos = [] }) {
    // Al pasar true, el hook sabe que debe traer TODAS las solicitudes (Vista Admin)
    const { solicitudes, loading, responderSolicitud } = useSolicitudesVehiculos(usuarioActivo?.id, true);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [solicitudAProcesar, setSolicitudAProcesar] = useState(null); 
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');
    const [comentariosAdmin, setComentariosAdmin] = useState('');

    const vehiculosDisponibles = vehiculos.filter(v => v.estado === 'DISPONIBLE' && !v.responsable_id);

    // --- DICCIONARIO DE RESPUESTAS RÁPIDAS ---
    const sugerenciasAprobado = ["Aprobado. Pasa por las llaves a recepción.", "Unidad autorizada y lista en estacionamiento.", "Aprobado con tanque lleno, favor de reponer."];
    const sugerenciasRechazado = ["Rechazado. Alta demanda de unidades hoy.", "Rechazado. La unidad solicitada está en taller.", "Rechazado. Actividad no requiere vehículo de flotilla."];

    const getDatosColaborador = (id) => {
        const col = colaboradores.find(c => c.id === id);
        return col || { nombre: 'Usuario Desconocido', puesto: 'Sin Puesto', departamento: 'N/A', foto: null };
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '--';
        return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    };

    const renderizarPeriodo = (sol) => {
        const inicio = formatearFecha(sol.fecha_solicitud);
        if (sol.tipo_duracion === 'HORAS') return `${inicio} • ${sol.hora_inicio} a ${sol.hora_fin}`;
        if (sol.tipo_duracion === 'DIA') return `${inicio} (Todo el día)`;
        return `${inicio} al ${formatearFecha(sol.fecha_fin)}`;
    };

    const handleAprobar = async (e) => {
        e.preventDefault();
        if (!vehiculoSeleccionado) return alert("Debes seleccionar un vehículo del carrusel para aprobar.");
        
        setIsSubmitting(true);
        const res = await responderSolicitud(solicitudAProcesar.id, 'APROBADA', vehiculoSeleccionado, comentariosAdmin, solicitudAProcesar.usuario_solicitante_id);
        setIsSubmitting(false);
        
        if (res.success) cerrarModal();
    };

    const handleRechazar = async () => {
        if (!comentariosAdmin) return alert("Por favor escribe o selecciona un motivo de rechazo en los comentarios.");
        
        setIsSubmitting(true);
        const res = await responderSolicitud(solicitudAProcesar.id, 'RECHAZADA', null, comentariosAdmin, solicitudAProcesar.usuario_solicitante_id);
        setIsSubmitting(false);
        
        if (res.success) cerrarModal();
    };

    const cerrarModal = () => {
        setSolicitudAProcesar(null);
        setVehiculoSeleccionado('');
        setComentariosAdmin('');
    };

    const RenderMiniatura = ({ tipo, color, url }) => {
        if (url) return <img src={url} alt="Auto" className="w-full h-full object-contain p-2" />;
        const style = { color: color || '#94a3b8' };
        return (
            <div className="h-full flex items-center justify-center opacity-50 scale-75">
                {tipo === 'moto' ? <FaMotorcycle style={style} className="text-6xl"/> : tipo === 'pickup' ? <FaTruckPickup style={style} className="text-6xl"/> : <FaCarSide style={style} className="text-6xl"/>}
            </div>
        );
    };

    const RenderEtiquetaEstado = ({ estado }) => {
        if (estado === 'APROBADA') return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-md"><MdCheckCircle/> Aprobada</span>;
        if (estado === 'RECHAZADA') return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-1 rounded-md"><MdCancel/> Rechazada</span>;
        return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase px-2 py-1 rounded-md animate-pulse"><MdHourglassEmpty/> Pendiente</span>;
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden max-w-5xl mx-auto relative">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Bandeja de Entrada General</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>
                ) : solicitudes.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No hay solicitudes pendientes en toda la empresa.</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {solicitudes.map(sol => {
                            const solicitante = getDatosColaborador(sol.usuario_solicitante_id);
                            
                            return (
                                <div key={sol.id} className={`border rounded-2xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col justify-between gap-4 ${sol.estado === 'PENDIENTE' ? 'border-purple-200 shadow-sm' : 'border-gray-100'}`}>
                                    
                                    {/* CABECERA DE LA TARJETA: DATOS DEL USUARIO */}
                                    <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                            {solicitante.foto ? <img src={solicitante.foto} className="w-full h-full object-cover"/> : <FaUserCircle className="text-gray-400 w-full h-full p-1"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-gray-800 truncate">{solicitante.nombre}</h4>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{solicitante.puesto} • {solicitante.departamento || solicitante.region || 'Matriz'}</p>
                                        </div>
                                        <RenderEtiquetaEstado estado={sol.estado} />
                                    </div>

                                    {/* CUERPO DE LA TARJETA: LA SOLICITUD */}
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md flex items-center gap-1 w-fit">
                                            {sol.tipo_duracion === 'HORAS' ? <MdAccessTime/> : <MdOutlineDateRange/>} 
                                            {renderizarPeriodo(sol)}
                                        </span>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div><p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1"><MdLocationOn/> Destino</p><p className="text-xs font-bold text-gray-800 truncate">{sol.destino}</p></div>
                                            <div><p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1"><MdAssignment/> Motivo</p><p className="text-xs font-bold text-gray-800 truncate">{sol.motivo}</p></div>
                                        </div>
                                    </div>
                                    
                                    {/* PIE DE TARJETA: ACCIONES O RESULTADO */}
                                    <div className="mt-2">
                                        {sol.estado === 'PENDIENTE' ? (
                                            <button onClick={() => setSolicitudAProcesar(sol)} className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-xs transition-all shadow-md shadow-gray-900/20 active:scale-95 flex items-center justify-center gap-2">
                                                <MdCheckCircle className="text-base"/> Evaluar Petición
                                            </button>
                                        ) : (
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                                                {sol.estado === 'APROBADA' && <p className="font-black text-green-700 mb-1">🚗 Asignado: <span className="text-gray-800">{sol.vehiculo?.marca} {sol.vehiculo?.modelo} ({sol.vehiculo?.placas})</span></p>}
                                                {sol.comentarios_admin && <p className="text-gray-500 line-clamp-2"><strong>Nota:</strong> {sol.comentarios_admin}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* MODAL MAGISTRAL DE EVALUACIÓN (CARRUSEL Y RESPUESTAS RÁPIDAS) */}
            {/* ========================================================= */}
            {solicitudAProcesar && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleAprobar} className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        
                        {/* CABECERA MODAL */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdAssignment className="text-purple-600"/> Evaluar Solicitud</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Revisa disponibilidad y asigna unidad</p>
                            </div>
                            <button type="button" onClick={cerrarModal} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                        </div>
                        
                        {/* CUERPO MODAL CON SCROLL */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            
                            {/* 1. RESUMEN DEL SOLICITANTE Y VIAJE */}
                            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <div className="w-14 h-14 rounded-full bg-white overflow-hidden shrink-0 border-2 border-purple-200 shadow-sm">
                                    {getDatosColaborador(solicitudAProcesar.usuario_solicitante_id).foto ? <img src={getDatosColaborador(solicitudAProcesar.usuario_solicitante_id).foto} className="w-full h-full object-cover"/> : <FaUserCircle className="text-gray-300 w-full h-full p-1"/>}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-base font-black text-gray-900">{getDatosColaborador(solicitudAProcesar.usuario_solicitante_id).nombre}</h4>
                                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">{getDatosColaborador(solicitudAProcesar.usuario_solicitante_id).puesto}</p>
                                    <div className="text-xs text-gray-600 space-y-0.5">
                                        <p><strong>🕒 Periodo:</strong> {renderizarPeriodo(solicitudAProcesar)}</p>
                                        <p><strong>📍 Destino:</strong> {solicitudAProcesar.destino}</p>
                                        <p><strong>📋 Motivo:</strong> {solicitudAProcesar.motivo}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. CARRUSEL HORIZONTAL DE VEHÍCULOS */}
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase">Selecciona el Vehículo a Asignar</label>
                                    <span className="text-[9px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">{vehiculosDisponibles.length} Disponibles</span>
                                </div>
                                
                                {vehiculosDisponibles.length === 0 ? (
                                    <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center font-bold text-sm border border-red-100">No hay vehículos disponibles. Debes rechazar la solicitud.</div>
                                ) : (
                                    <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
                                        {vehiculosDisponibles.map(v => (
                                            <div 
                                                key={v.id} 
                                                onClick={() => setVehiculoSeleccionado(v.id)}
                                                className={`w-40 shrink-0 snap-center rounded-2xl border-2 transition-all cursor-pointer flex flex-col overflow-hidden ${vehiculoSeleccionado === v.id ? 'border-green-500 bg-green-50/30 shadow-md transform scale-[1.02]' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                                            >
                                                <div className="h-24 bg-gray-50 border-b border-gray-100 relative">
                                                    {vehiculoSeleccionado === v.id && <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5 z-10 shadow-sm"><MdCheckCircle className="text-sm"/></div>}
                                                    <RenderMiniatura tipo={v.tipo_vehiculo} color={v.color} url={v.imagen_url} />
                                                </div>
                                                <div className="p-3 text-center">
                                                    <h4 className="text-[11px] font-black text-gray-800 leading-tight">{v.marca} {v.modelo}</h4>
                                                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-1 tracking-widest">{v.placas}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* 3. COMENTARIOS INTELIGENTES */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Comentarios para el solicitante</label>
                                
                                {/* BOTONERA RÁPIDA */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {vehiculoSeleccionado ? (
                                        sugerenciasAprobado.map((sug, i) => <button key={i} type="button" onClick={() => setComentariosAdmin(sug)} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 rounded-lg text-[9px] font-black tracking-wide transition-colors">{sug}</button>)
                                    ) : (
                                        sugerenciasRechazado.map((sug, i) => <button key={i} type="button" onClick={() => setComentariosAdmin(sug)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-lg text-[9px] font-black tracking-wide transition-colors">{sug}</button>)
                                    )}
                                </div>

                                <textarea value={comentariosAdmin} onChange={e => setComentariosAdmin(e.target.value)} placeholder="Instrucciones de entrega, nivel de gasolina o motivo de rechazo..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 h-20 resize-none shadow-inner"></textarea>
                            </div>
                        </div>

                        {/* ACCIONES FINALES */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3 shrink-0">
                            <button type="button" onClick={handleRechazar} disabled={isSubmitting} className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-black py-4 rounded-xl transition-all shadow-sm active:scale-95 flex justify-center items-center gap-2"><MdCancel className="text-lg"/> Rechazar Solicitud</button>
                            <button type="submit" disabled={isSubmitting || !vehiculoSeleccionado} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-green-500/30 active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100"><MdDirectionsCar className="text-lg"/> Aprobar y Asignar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}