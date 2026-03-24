/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/MesaLogistica.tsx              */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdLocalShipping, MdCheckCircle, MdCancel, MdStore, MdOutlineInventory, MdWarning, MdHistory } from "react-icons/md";
import ModalHistorialGlobal from './ModalHistorialGlobal';

const ESTADOS_LOGISTICA = [
    { id: 'PENDIENTE', nombre: 'Pedido Pendiente', color: 'bg-orange-100 text-orange-700' },
    { id: 'COMPRADO', nombre: 'Falta Stock / Por Comprar', color: 'bg-purple-100 text-purple-700' },
    { id: 'EN_ALMACEN', nombre: 'En Almacén (Listo)', color: 'bg-teal-100 text-teal-700' },
    { id: 'EN_ENVIO', nombre: 'En Camino a Región', color: 'bg-blue-100 text-blue-700' },
    { id: 'ENTREGADO', nombre: 'Entregado al Técnico', color: 'bg-green-100 text-green-700' },
    { id: 'CANCELADO', nombre: 'Cancelado', color: 'bg-red-100 text-red-700' }
];

export default function MesaLogistica({ useData, colaboradores, usuarioActivo }) {
    const { solicitudes, inventario, actualizarEstadoSolicitud } = useData;
    const [estadoActivo, setEstadoActivo] = useState(null);
    const [mensajeEstimacion, setMensajeEstimacion] = useState('');
    const [modalHistorial, setModalHistorial] = useState(false);

    const getNombre = (id) => { const col = colaboradores.find(c => c.id === id); return col ? col.nombre : 'Usuario Desconocido'; };
    const getNombreBase = (str) => { if (!str) return ''; const lastParen = str.lastIndexOf(' ('); return lastParen !== -1 ? str.substring(0, lastParen).trim() : str.trim(); };

    const getStockGeneral = (productoIdFull) => {
        const nombreBase = getNombreBase(productoIdFull);
        const fisicos = inventario.filter(p => p.nombre === nombreBase && (p.almacen === 'ALMACÉN GENERAL' || p.almacen === 'ALMACEN GENERAL' || p.region === 'Almacén General'));
        return fisicos.reduce((acc, curr) => acc + curr.stock, 0);
    };

    const confirmarCambioEstado = async (e) => {
        e.preventDefault();
        await actualizarEstadoSolicitud(estadoActivo.solId, estadoActivo.nuevoEstado, mensajeEstimacion);
        setEstadoActivo(null);
        setMensajeEstimacion('');
    };

    const abrirModalEstado = (solId, nuevoEstado) => {
        let msg = '';
        if (nuevoEstado === 'EN_ALMACEN') msg = 'Tu pedido ya está separado en Almacén General.';
        if (nuevoEstado === 'EN_ENVIO') msg = 'El material va en camino hacia tu región.';
        if (nuevoEstado === 'COMPRADO') msg = 'El material ha sido solicitado a compras.';
        if (nuevoEstado === 'CANCELADO') msg = 'Pedido cancelado.';
        setMensajeEstimacion(msg); setEstadoActivo({ solId, nuevoEstado });
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdLocalShipping className="text-blue-600"/> Centro de Despacho (Logística)</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Autoriza, verifica stock y despacha material</p>
                </div>
                <button onClick={() => setModalHistorial(true)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-black text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 shrink-0">
                    <MdHistory className="text-lg"/> Historial Logístico
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-gray-50/30">
                {solicitudes.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No hay solicitudes activas.</div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {solicitudes.map(sol => {
                            const configEstado = ESTADOS_LOGISTICA.find(e => e.id === sol.estado) || ESTADOS_LOGISTICA[0];
                            const puedeSurtirse = sol.detalles?.every(det => getStockGeneral(det.producto_id) >= det.cantidad_solicitada);

                            return (
                                <div key={sol.id} className="border border-gray-200 rounded-3xl p-5 hover:shadow-lg transition-shadow bg-white flex flex-col gap-4">
                                    <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                        <div>
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block ${configEstado.color}`}>{configEstado.nombre}</span>
                                            <h4 className="text-sm font-black text-gray-800">{getNombre(sol.usuario_solicitante_id)}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5"><MdStore className="inline"/> Destino: {sol.destino}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-blue-800 uppercase mb-1">Motivo:</p>
                                        <p className="text-xs font-bold text-gray-600 mb-4">{sol.motivo}</p>
                                        <p className="text-[10px] font-black text-blue-800 uppercase mb-1"><MdOutlineInventory className="inline"/> Verificación de Stock General:</p>
                                        <div className="space-y-2 border-t border-gray-200 pt-2 mt-1">
                                            {sol.detalles?.map(det => {
                                                const stockDisp = getStockGeneral(det.producto_id);
                                                const faltaStock = stockDisp < det.cantidad_solicitada;
                                                return (
                                                    <div key={det.id} className="flex flex-col gap-1.5 border-b border-gray-100 pb-2">
                                                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                                            <span>{getNombreBase(det.producto_id)}</span>
                                                            <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px]">{det.cantidad_solicitada} solic.</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase">Disp. en Almacén Gral:</span>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${faltaStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{stockDisp} unidades</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {sol.estado !== 'ENTREGADO' && sol.estado !== 'CANCELADO' && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(sol.estado === 'PENDIENTE' || sol.estado === 'COMPRADO') && !puedeSurtirse && (
                                                <div className="w-full mb-1 bg-red-50 text-red-600 p-2 rounded-xl text-[10px] font-black"><MdWarning className="inline text-sm"/> Falta stock en Almacén General.</div>
                                            )}
                                            {sol.estado === 'PENDIENTE' && (
                                                <>
                                                    <button onClick={() => abrirModalEstado(sol.id, 'COMPRADO')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase ${!puedeSurtirse ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'}`}>Comprar</button>
                                                    <button onClick={() => abrirModalEstado(sol.id, 'EN_ALMACEN')} disabled={!puedeSurtirse} className={`flex-[2] py-2.5 rounded-xl text-[10px] font-black uppercase ${puedeSurtirse ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Separar en Almacén</button>
                                                </>
                                            )}
                                            {sol.estado === 'COMPRADO' && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'EN_ALMACEN')} disabled={!puedeSurtirse} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase ${puedeSurtirse ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Separar en Almacén</button>
                                            )}
                                            {(sol.estado === 'EN_ALMACEN' || (sol.estado === 'COMPRADO' && puedeSurtirse)) && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'EN_ENVIO')} className="flex-[3] py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Enviar a Región</button>
                                            )}
                                            {sol.estado === 'EN_ENVIO' && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'ENTREGADO')} className="w-full py-2.5 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase">Confirmar Entrega</button>
                                            )}
                                            {sol.estado !== 'EN_ENVIO' && (
                                                <button onClick={() => abrirModalEstado(sol.id, 'CANCELADO')} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
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
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
                    <form onSubmit={confirmarCambioEstado} className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-black text-gray-800">Actualizar Rastreo</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase">Instrucciones</label>
                            <textarea required value={mensajeEstimacion} onChange={e => setMensajeEstimacion(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold h-28 resize-none"></textarea>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button type="button" onClick={() => setEstadoActivo(null)} className="flex-1 bg-white font-black py-4 rounded-xl">Cancelar</button>
                            <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl">Confirmar</button>
                        </div>
                    </form>
                </div>
            )}
            
            <ModalHistorialGlobal isOpen={modalHistorial} onClose={() => setModalHistorial(false)} useData={useData} usuarioActivo={usuarioActivo} colaboradores={colaboradores} contextoInicial="LOGISTICA" />
        </div>
    );
}