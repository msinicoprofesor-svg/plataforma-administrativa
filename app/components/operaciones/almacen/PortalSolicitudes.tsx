/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/PortalSolicitudes.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdAddBox, MdSend, MdHistory, MdHourglassEmpty, MdCheckCircle, MdLocalShipping, MdCancel, MdStore, MdLightbulbOutline } from "react-icons/md";

const UBICACIONES_FISICAS = [
    'Centro (Almacén General)', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 
    'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río',
    'WifiCel', 'RK', 'Fibrox MX', 'Intercheap'
];

const SUGERENCIAS_MOTIVO = [
    "Instalación de cliente nuevo",
    "Mantenimiento correctivo (Falla)",
    "Stock de seguridad para la región",
    "Reemplazo de equipo dañado",
    "Proyecto de expansión de red"
];

export default function PortalSolicitudes({ useData, usuarioActivo }) {
    const { inventario, solicitudes, crearSolicitud, cargando } = useData;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulario
    const [form, setForm] = useState({ productoId: '', cantidad: 1, destino: '', motivo: '' });

    const misSolicitudes = solicitudes.filter(s => s.usuario_solicitante_id === usuarioActivo?.id);

    const handleSugerencia = (texto) => {
        setForm(prev => ({ ...prev, motivo: prev.motivo ? `${prev.motivo} - ${texto}` : texto }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const productoSeleccionado = inventario.find(p => p.id === form.productoId);
        if (!productoSeleccionado) return alert("Selecciona un producto válido del catálogo.");
        if (form.cantidad < 1) return alert("La cantidad debe ser al menos 1.");

        setIsSubmitting(true);
        
        const payload = {
            usuario_solicitante_id: usuarioActivo.id,
            destino: form.destino,
            motivo: form.motivo
        };
        
        const detalles = [{
            producto_id: `${productoSeleccionado.nombre} (${productoSeleccionado.marca})`, 
            cantidad_solicitada: form.cantidad
        }];

        const res = await crearSolicitud(payload, detalles);
        setIsSubmitting(false);

        if (res.success) {
            alert("📦 Solicitud de material enviada exitosamente al almacén.");
            setForm({ productoId: '', cantidad: 1, destino: '', motivo: '' });
        } else {
            alert("Error al enviar la solicitud. Intenta de nuevo.");
        }
    };

    // Rastreador visual estilo MercadoLibre
    const RenderRastreador = ({ estado, comentarios }) => {
        const pasos = ['PENDIENTE', 'COMPRADO', 'EN_ALMACEN', 'EN_ENVIO', 'ENTREGADO'];
        let pasoActual = pasos.indexOf(estado);
        if (estado === 'CANCELADO') pasoActual = -1;

        return (
            <div className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                {estado === 'CANCELADO' ? (
                    <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase"><MdCancel className="text-lg"/> Pedido Cancelado</div>
                ) : (
                    <>
                        <div className="flex justify-between items-center relative mb-2">
                            {/* Línea de fondo */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full transform -translate-y-1/2"></div>
                            {/* Línea de progreso */}
                            <div className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 rounded-full transform -translate-y-1/2 transition-all duration-500" style={{ width: `${(pasoActual / (pasos.length - 1)) * 100}%` }}></div>
                            
                            {pasos.map((paso, index) => (
                                <div key={paso} className={`w-4 h-4 rounded-full border-2 ${index <= pasoActual ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'} transition-all duration-500`}></div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase">
                            <span>Pendiente</span>
                            <span>Comprado</span>
                            <span>En Almacén</span>
                            <span>En Camino</span>
                            <span className={estado === 'ENTREGADO' ? 'text-green-600' : ''}>Entregado</span>
                        </div>
                    </>
                )}
                {/* Estimación de Entrega */}
                {comentarios && estado !== 'CANCELADO' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-2 items-start">
                        <MdLocalShipping className="text-blue-600 text-lg shrink-0 mt-0.5"/>
                        <div>
                            <p className="text-[10px] font-black text-blue-800 uppercase">Aviso de Logística:</p>
                            <p className="text-xs font-bold text-blue-900 mt-0.5">{comentarios}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col xl:flex-row gap-6 animate-fade-in pb-10">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="xl:w-[45%] bg-white p-6 rounded-3xl shadow-sm border border-gray-100 shrink-0 overflow-y-auto custom-scrollbar">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3 flex items-center gap-2"><MdAddBox className="text-blue-600"/> Nuevo Pedido de Material</h3>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-blue-800 uppercase mb-2 ml-1">Selecciona el Material</label>
                            <select required value={form.productoId} onChange={e => setForm({...form, productoId: e.target.value})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 shadow-sm">
                                <option value="">Buscar en el catálogo disponible...</option>
                                {inventario.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.marca}) - Stock: {p.stock}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-blue-800 uppercase mb-2 ml-1">Cantidad Requerida</label>
                            <input required type="number" min="1" value={form.cantidad} onChange={e => setForm({...form, cantidad: parseInt(e.target.value)})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-black text-gray-800 outline-none focus:border-blue-500 shadow-sm text-center" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdStore/> Destino de Entrega *</label>
                        <select required value={form.destino} onChange={e => setForm({...form, destino: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 cursor-pointer">
                            <option value="">Selecciona la ubicación destino...</option>
                            {UBICACIONES_FISICAS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdLightbulbOutline className="text-yellow-500"/> Sugerencias de Justificación</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {SUGERENCIAS_MOTIVO.map(sug => (
                                <button type="button" key={sug} onClick={() => handleSugerencia(sug)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95">
                                    {sug}
                                </button>
                            ))}
                        </div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Motivo / Justificación Final *</label>
                        <textarea required value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} placeholder="Detalla el uso que se le dará al material..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 h-24 resize-none"></textarea>
                    </div>
                    
                    <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-gray-900/20 disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 mt-4">
                        <MdSend className="text-lg"/> Enviar Solicitud al Almacén
                    </button>
                </form>
            </div>

            {/* COLUMNA DERECHA: RASTREO Y PESTAÑAS */}
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><MdHistory className="text-gray-400"/> Rastreo de Mis Pedidos</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    {cargando ? (
                        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                    ) : misSolicitudes.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-bold">Aún no has solicitado ningún material o herramienta.</div>
                    ) : (
                        <div className="space-y-4">
                            {misSolicitudes.map(sol => (
                                <div key={sol.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido #{sol.id.split('-')[1] || sol.id.substring(0,6)}</p>
                                            <h4 className="text-sm font-black text-gray-800 mt-1">Destino: {sol.destino}</h4>
                                        </div>
                                    </div>
                                    
                                    <RenderRastreador estado={sol.estado} comentarios={sol.comentarios_admin} />

                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <ul className="space-y-1">
                                            {sol.detalles?.map(det => (
                                                <li key={det.id} className="text-xs font-bold text-gray-700 flex justify-between border-b border-gray-100 pb-1">
                                                    <span>{det.producto_id}</span>
                                                    <span className="bg-white px-2 py-0.5 rounded shadow-sm text-[10px] font-black text-blue-600 border border-blue-100">{det.cantidad_solicitada} unid.</span>
                                                </li>
                                            ))}
                                        </ul>
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