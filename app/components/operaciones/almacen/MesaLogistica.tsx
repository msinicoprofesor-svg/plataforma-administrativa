/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/MesaLogistica.tsx              */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdLocalShipping, MdCheckCircle, MdCancel, MdHourglassEmpty, MdStore, MdOutlineInventory } from "react-icons/md";

const ESTADOS_LOGISTICA = [
    { id: 'PENDIENTE', nombre: 'Pedido Pendiente', color: 'bg-orange-100 text-orange-700' },
    { id: 'COMPRADO', nombre: 'Comprado / En Tránsito a Gral', color: 'bg-purple-100 text-purple-700' },
    { id: 'EN_ALMACEN', nombre: 'En Almacén (Listo para recoger)', color: 'bg-teal-100 text-teal-700' },
    { id: 'EN_ENVIO', nombre: 'En Camino a Región', color: 'bg-blue-100 text-blue-700' },
    { id: 'ENTREGADO', nombre: 'Entregado al Técnico/Región', color: 'bg-green-100 text-green-700' },
    { id: 'CANCELADO', nombre: 'Cancelado', color: 'bg-red-100 text-red-700' }
];

export default function MesaLogistica({ useData, colaboradores }) {
    const { solicitudes, actualizarEstadoSolicitud } = useData;
    const [estadoActivo, setEstadoActivo] = useState(null); // Modal de cambio de estado
    const [mensajeEstimacion, setMensajeEstimacion] = useState('');

    const getNombre = (id) => {
        const col = colaboradores.find(c => c.id === id);
        return col ? col.nombre : 'Usuario Desconocido';
    };

    const confirmarCambioEstado = async (e) => {
        e.preventDefault();
        // 1. Actualiza el estado y el mensaje (que el usuario verá en su rastreador)
        await actualizarEstadoSolicitud(estadoActivo.solId, estadoActivo.nuevoEstado, mensajeEstimacion);
        
        // Cierra el modal
        setEstadoActivo(null);
        setMensajeEstimacion('');
    };

    const abrirModalEstado = (solId, nuevoEstado) => {
        let msgPredefinido = '';
        if (nuevoEstado === 'EN_ALMACEN') msgPredefinido = 'Tu pedido ya está separado en Almacén General. Puedes pasar a recogerlo de 9:00am a 6:00pm.';
        if (nuevoEstado === 'EN_ENVIO') msgPredefinido = 'El material va en camino hacia tu región. Llega el día de hoy antes de las 4:00pm.';
        if (nuevoEstado === 'COMPRADO') msgPredefinido = 'No teníamos stock. Ya fue comprado y estamos esperando que llegue al Almacén General.';
        if (nuevoEstado === 'CANCELADO') msgPredefinido = 'Pedido cancelado por falta de justificación o material no aprobado.';
        
        setMensajeEstimacion(msgPredefinido);
        setEstadoActivo({ solId, nuevoEstado });
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdLocalShipping className="text-blue-600"/> Centro de Despacho (Logística)</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Autoriza, despacha stock y notifica tiempos de entrega</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-gray-50/30">
                {solicitudes.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No hay solicitudes de material activas.</div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {solicitudes.map(sol => {
                            const configEstado = ESTADOS_LOGISTICA.find(e => e.id === sol.estado) || ESTADOS_LOGISTICA[0];
                            
                            return (
                                <div key={sol.id} className="border border-gray-200 rounded-3xl p-5 hover:shadow-lg transition-shadow bg-white flex flex-col gap-4">
                                    <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                        <div>
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block ${configEstado.color}`}>
                                                {configEstado.nombre}
                                            </span>
                                            <h4 className="text-sm font-black text-gray-800">{getNombre(sol.usuario_solicitante_id)}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1"><MdStore/> Destino: {sol.destino}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-blue-800 uppercase mb-1">Motivo del Pedido:</p>
                                        <p className="text-xs font-bold text-gray-600 mb-4">{sol.motivo}</p>
                                        
                                        <p className="text-[10px] font-black text-blue-800 uppercase mb-1 flex items-center gap-1"><MdOutlineInventory/> Material a Despachar:</p>
                                        <div className="space-y-1 border-t border-gray-200 pt-2">
                                            {sol.detalles?.map(det => (
                                                <div key={det.id} className="text-xs font-bold text-gray-700 flex justify-between">
                                                    <span className="truncate pr-4">{det.producto_id}</span>
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black text-[10px] shrink-0">{det.cantidad_solicitada} unid.</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CONTROLES DE ESTADO (FLUJO LOGÍSTICO) */}
                                    {sol.estado !== 'ENTREGADO' && sol.estado !== 'CANCELADO' && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                            {sol.estado === 'PENDIENTE' && (
                                                <>
                                                    <button onClick={() => abrirModalEstado(sol.id, 'COMPRADO')} className="py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider">Comprar</button>
                                                    <button onClick={() => abrirModalEstado(sol.id, 'EN_ALMACEN')} className="py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider col-span-2">Separar en Almacén</button>
                                                </>
                                            )}
                                            {(sol.estado === 'EN_ALMACEN' || sol.estado === 'COMPRADO') && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'EN_ENVIO')} className="col-span-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider flex justify-center items-center gap-1"><MdLocalShipping className="text-sm"/> Enviar a Región</button>
                                            )}
                                            {sol.estado === 'EN_ENVIO' && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'ENTREGADO')} className="col-span-3 py-2.5 bg-green-500 hover:bg-green-600 text-white shadow-md rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider flex justify-center items-center gap-1"><MdCheckCircle className="text-sm"/> Confirmar Entrega</button>
                                            )}
                                            
                                            <button onClick={() => abrirModalEstado(sol.id, 'CANCELADO')} className="py-2.5 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider">Cancelar</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL DE ESTIMACIÓN DE TIEMPO / MENSAJE (ESTILO MERCADOLIBRE) */}
            {estadoActivo && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={confirmarCambioEstado} className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800">Actualizar Rastreo</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Notifica al técnico sobre su pedido</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1">
                                    <MdLocalShipping className="text-blue-500"/> Tiempo de Entrega o Instrucciones
                                </label>
                                <textarea required value={mensajeEstimacion} onChange={e => setMensajeEstimacion(e.target.value)} placeholder="Ej. Pasa a recoger hoy a las 4pm..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-500 h-28 resize-none"></textarea>
                            </div>
                            
                            {estadoActivo.nuevoEstado === 'EN_ENVIO' && (
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 font-medium">
                                    <strong>Importante:</strong> Al confirmar, el stock deberá moverse físicamente desde el Almacén General hacia la región destino elegida por el técnico.
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button type="button" onClick={() => setEstadoActivo(null)} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-black py-4 rounded-xl transition-all shadow-sm active:scale-95">Cancelar</button>
                            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex justify-center items-center gap-2">Confirmar Estado</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}