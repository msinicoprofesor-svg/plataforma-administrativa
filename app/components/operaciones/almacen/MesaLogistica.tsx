/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/MesaLogistica.tsx              */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdLocalShipping, MdCheckCircle, MdCancel, MdStore, MdOutlineInventory, MdWarning } from "react-icons/md";

const ESTADOS_LOGISTICA = [
    { id: 'PENDIENTE', nombre: 'Pedido Pendiente', color: 'bg-orange-100 text-orange-700' },
    { id: 'COMPRADO', nombre: 'Falta Stock / Por Comprar', color: 'bg-purple-100 text-purple-700' },
    { id: 'EN_ALMACEN', nombre: 'En Almacén (Listo)', color: 'bg-teal-100 text-teal-700' },
    { id: 'EN_ENVIO', nombre: 'En Camino a Región', color: 'bg-blue-100 text-blue-700' },
    { id: 'ENTREGADO', nombre: 'Entregado al Técnico', color: 'bg-green-100 text-green-700' },
    { id: 'CANCELADO', nombre: 'Cancelado', color: 'bg-red-100 text-red-700' }
];

export default function MesaLogistica({ useData, colaboradores }) {
    const { solicitudes, inventario, actualizarEstadoSolicitud } = useData;
    const [estadoActivo, setEstadoActivo] = useState(null);
    const [mensajeEstimacion, setMensajeEstimacion] = useState('');

    const getNombre = (id) => {
        const col = colaboradores.find(c => c.id === id);
        return col ? col.nombre : 'Usuario Desconocido';
    };

    // MOTOR INTELIGENTE: Verifica la disponibilidad real en el Almacén General
    const getStockGeneral = (nombreProducto) => {
        const fisicosCentro = inventario.filter(p => 
            p.nombre === nombreProducto && 
            (p.almacen === 'CENTRO' || p.region === 'Centro')
        );
        return fisicosCentro.reduce((acc, curr) => acc + curr.stock, 0);
    };

    const confirmarCambioEstado = async (e) => {
        e.preventDefault();
        await actualizarEstadoSolicitud(estadoActivo.solId, estadoActivo.nuevoEstado, mensajeEstimacion);
        setEstadoActivo(null);
        setMensajeEstimacion('');
    };

    const abrirModalEstado = (solId, nuevoEstado) => {
        let msgPredefinido = '';
        if (nuevoEstado === 'EN_ALMACEN') msgPredefinido = 'Tu pedido ya está separado en Almacén General. Puedes pasar a recogerlo.';
        if (nuevoEstado === 'EN_ENVIO') msgPredefinido = 'El material va en camino hacia tu región.';
        if (nuevoEstado === 'COMPRADO') msgPredefinido = 'No contamos con stock suficiente. El material ha sido solicitado a compras.';
        if (nuevoEstado === 'CANCELADO') msgPredefinido = 'Pedido cancelado por falta de justificación o material no aprobado.';
        
        setMensajeEstimacion(msgPredefinido);
        setEstadoActivo({ solId, nuevoEstado });
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdLocalShipping className="text-blue-600"/> Centro de Despacho (Logística)</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Autoriza, verifica stock y despacha material</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-gray-50/30">
                {solicitudes.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No hay solicitudes de material activas.</div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {solicitudes.map(sol => {
                            const configEstado = ESTADOS_LOGISTICA.find(e => e.id === sol.estado) || ESTADOS_LOGISTICA[0];
                            
                            // Validamos si TODO el pedido tiene stock suficiente
                            const puedeSurtirse = sol.detalles?.every(det => getStockGeneral(det.producto_id) >= det.cantidad_solicitada);

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
                                        
                                        <p className="text-[10px] font-black text-blue-800 uppercase mb-1 flex items-center gap-1"><MdOutlineInventory/> Verificación de Stock General:</p>
                                        <div className="space-y-2 border-t border-gray-200 pt-2 mt-1">
                                            {sol.detalles?.map(det => {
                                                const stockDisp = getStockGeneral(det.producto_id);
                                                const faltaStock = stockDisp < det.cantidad_solicitada;

                                                return (
                                                    <div key={det.id} className="flex flex-col gap-1.5 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                                            <span className="truncate pr-2">{det.producto_id}</span>
                                                            <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-black text-[10px] shrink-0">{det.cantidad_solicitada} solicitados</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Disp. en Almacén Gral:</span>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${faltaStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                                {stockDisp} unidades
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* CONTROLES DE ESTADO (FLUJO LOGÍSTICO INTELIGENTE) */}
                                    {sol.estado !== 'ENTREGADO' && sol.estado !== 'CANCELADO' && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            
                                            {/* Alerta de bloqueo por stock */}
                                            {(sol.estado === 'PENDIENTE' || sol.estado === 'COMPRADO') && !puedeSurtirse && (
                                                <div className="w-full mb-1 bg-red-50 text-red-600 p-2 rounded-xl text-[10px] font-black flex items-center gap-1 border border-red-100">
                                                    <MdWarning className="text-sm"/> Falta stock para despachar. Requiere compra.
                                                </div>
                                            )}

                                            {sol.estado === 'PENDIENTE' && (
                                                <>
                                                    <button onClick={() => abrirModalEstado(sol.id, 'COMPRADO')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider ${!puedeSurtirse ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'}`}>Marcar Compra</button>
                                                    <button onClick={() => abrirModalEstado(sol.id, 'EN_ALMACEN')} disabled={!puedeSurtirse} className={`flex-[2] py-2.5 rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider ${puedeSurtirse ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Separar en Almacén</button>
                                                </>
                                            )}
                                            
                                            {sol.estado === 'COMPRADO' && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'EN_ALMACEN')} disabled={!puedeSurtirse} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider ${puedeSurtirse ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Separar en Almacén</button>
                                            )}

                                            {(sol.estado === 'EN_ALMACEN' || (sol.estado === 'COMPRADO' && puedeSurtirse)) && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'EN_ENVIO')} className="flex-[3] py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider flex justify-center items-center gap-1"><MdLocalShipping className="text-sm"/> Enviar a Región</button>
                                            )}
                                            
                                            {sol.estado === 'EN_ENVIO' && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'ENTREGADO')} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white shadow-md rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider flex justify-center items-center gap-1"><MdCheckCircle className="text-sm"/> Confirmar Entrega</button>
                                            )}
                                            
                                            {sol.estado !== 'EN_ENVIO' && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'CANCELADO')} className="flex-1 py-2.5 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-xl text-[10px] font-black transition-colors uppercase tracking-wider">Cancelar</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
                                    <strong>Importante:</strong> Al confirmar, el sistema descontará automáticamente el stock del Almacén General y lo transferirá a la región destino.
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button type="button" onClick={() => setEstadoActivo(null)} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-black py-4 rounded-xl transition-all shadow-sm active:scale-95">Cerrar</button>
                            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex justify-center items-center gap-2">Confirmar Estado</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}