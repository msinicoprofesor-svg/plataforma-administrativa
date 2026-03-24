/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/ModalHistorialInventario.tsx   */
/* -------------------------------------------------------------------------- */
'use client';
import { MdClose, MdHistory, MdArrowUpward, MdArrowDownward } from "react-icons/md";

export default function ModalHistorialInventario({ isOpen, onClose, movimientosEnriquecidos = [] }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdHistory className="text-blue-600"/> Historial de Entradas y Salidas</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Registro auditable de movimientos de stock</p>
                    </div>
                    <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {movimientosEnriquecidos.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-bold">Aún no hay movimientos registrados en tu jurisdicción.</div>
                    ) : (
                        <div className="space-y-3">
                            {movimientosEnriquecidos.map(mov => (
                                <div key={mov.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {mov.tipo === 'ENTRADA' ? <MdArrowDownward className="text-xl"/> : <MdArrowUpward className="text-xl"/>}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-800">{mov.producto?.nombre || 'Producto Eliminado'}</p>
                                            <p className="text-[10px] font-bold text-gray-500">{mov.producto?.marca || 'N/A'} • {mov.producto?.almacen || 'N/A'}</p>
                                            <p className="text-[9px] font-black text-gray-400 mt-1">RESPONSABLE: {mov.usuario || 'Sistema'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                                        <p className={`text-sm font-black ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                            {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad} unidades
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-500 mt-1 max-w-[200px] truncate">{mov.motivo}</p>
                                        <p className="text-[8px] font-black text-gray-400 uppercase mt-1 tracking-widest">{new Date(mov.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}