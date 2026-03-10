/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/PanelMantenimiento.tsx                   */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdBuild, MdInventory, MdAdd, MdClose, MdCheckCircle, 
    MdSchedule, MdWarning, MdDirectionsCar, MdAttachMoney, MdSpeed,
    MdLocalGasStation, MdImage
} from 'react-icons/md';
import { useMantenimiento } from '../../hooks/useMantenimiento';
import VisorImagen from './VisorImagen'; // <--- IMPORTAMOS TU VISOR ELEGANTE

export default function PanelMantenimiento({ onClose, vehiculos }) {
    const { 
        mantenimientos, inventario, gasolina, loading, 
        registrarMantenimiento, agregarArticuloInventario, actualizarCantidadInventario 
    } = useMantenimiento();

    const [vistaActiva, setVistaActiva] = useState('servicios'); // 'servicios', 'inventario', 'combustible'
    
    // Estados Modales
    const [mostrarModalServicio, setMostrarModalServicio] = useState(false);
    const [mostrarModalInventario, setMostrarModalInventario] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketAmpliado, setTicketAmpliado] = useState(null); // Para el visor

    // Formularios
    const [formServicio, setFormServicio] = useState({
        vehiculo_id: '', tipo: 'PREVENTIVO', estado: 'COMPLETADO', 
        descripcion: '', kilometraje: '', costo: '', 
        tipo_programacion: 'FECHA', // 'FECHA' o 'KILOMETRAJE'
        fecha_programada: '', kilometraje_programado: ''
    });

    const [formInventario, setFormInventario] = useState({
        nombre: '', categoria: 'GENERAL', cantidad: 0, unidad_medida: 'Piezas'
    });

    // --- HANDLERS ---
    const handleGuardarServicio = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Construimos el payload exacto
        const payload = {
            vehiculo_id: formServicio.vehiculo_id,
            tipo: formServicio.tipo,
            estado: formServicio.estado,
            descripcion: formServicio.descripcion,
            kilometraje: parseInt(formServicio.kilometraje),
            costo: formServicio.costo ? parseFloat(formServicio.costo) : 0,
        };

        if (formServicio.estado === 'PROGRAMADO') {
            if (formServicio.tipo_programacion === 'FECHA') {
                payload.fecha_programada = formServicio.fecha_programada;
            } else {
                payload.kilometraje_programado = parseInt(formServicio.kilometraje_programado);
            }
        }

        const res = await registrarMantenimiento(payload);
        setIsSubmitting(false);
        if (res.success) {
            setMostrarModalServicio(false);
            setFormServicio({ vehiculo_id: '', tipo: 'PREVENTIVO', estado: 'COMPLETADO', descripcion: '', kilometraje: '', costo: '', tipo_programacion: 'FECHA', fecha_programada: '', kilometraje_programado: '' });
        } else {
            alert("Error al guardar: Asegúrate de tener conexión y los permisos correctos.");
        }
    };

    const handleGuardarArticulo = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await agregarArticuloInventario({
            ...formInventario,
            cantidad: parseInt(formInventario.cantidad)
        });
        setIsSubmitting(false);
        if (res.success) {
            setMostrarModalInventario(false);
            setFormInventario({ nombre: '', categoria: 'GENERAL', cantidad: 0, unidad_medida: 'Piezas' });
        }
    };

    const handleAjustarStock = async (id, cantidadActual, ajuste) => {
        const nuevaCantidad = cantidadActual + ajuste;
        if (nuevaCantidad < 0) return;
        await actualizarCantidadInventario(id, nuevaCantidad);
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '--';
        return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10">
            {/* ENCABEZADO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-5 shrink-0 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2"><MdBuild className="text-blue-600"/> Taller y Mantenimiento</h2>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Gestión de servicios, inventario y consumos</p>
                    </div>
                    <button onClick={onClose} className="bg-gray-100 text-gray-500 hover:bg-gray-200 p-2 rounded-xl transition-colors"><MdClose className="text-2xl" /></button>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                    {/* TRES PESTAÑAS */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-full md:w-auto overflow-x-auto custom-scrollbar">
                        <button onClick={() => setVistaActiva('servicios')} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all shrink-0 ${vistaActiva === 'servicios' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdBuild className="text-lg"/> Servicios
                        </button>
                        <button onClick={() => setVistaActiva('inventario')} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all shrink-0 ${vistaActiva === 'inventario' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdInventory className="text-lg"/> Inventario
                        </button>
                        <button onClick={() => setVistaActiva('combustible')} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all shrink-0 ${vistaActiva === 'combustible' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdLocalGasStation className="text-lg"/> Combustible
                        </button>
                    </div>

                    {vistaActiva === 'servicios' && <button onClick={() => setMostrarModalServicio(true)} className="w-full md:w-auto bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all shadow-sm active:scale-95 flex justify-center items-center gap-2"><MdAdd className="text-lg"/> Registrar Servicio</button>}
                    {vistaActiva === 'inventario' && <button onClick={() => setMostrarModalInventario(true)} className="w-full md:w-auto bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all shadow-sm active:scale-95 flex justify-center items-center gap-2"><MdAdd className="text-lg"/> Nuevo Artículo</button>}
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex-1 overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                {loading ? (
                    <div className="flex-1 flex justify-center items-center"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : (
                    <>
                        {/* ===================== VISTA SERVICIOS ===================== */}
                        {vistaActiva === 'servicios' && (
                            <div className="flex-1 overflow-auto custom-scrollbar p-2">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="bg-gray-50/80 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tl-2xl">Unidad</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Kilometraje</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Costo</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right rounded-tr-2xl">Estado / Programación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {mantenimientos.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-10 text-gray-400 font-bold">No hay servicios registrados.</td></tr>
                                        ) : (
                                            mantenimientos.map(mant => (
                                                <tr key={mant.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-gray-800">{mant.vehiculo?.marca} {mant.vehiculo?.modelo}</p>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase">{mant.vehiculo?.placas}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${mant.tipo === 'PREVENTIVO' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                            {mant.tipo}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4"><p className="text-xs font-medium text-gray-700 max-w-xs truncate">{mant.descripcion}</p></td>
                                                    <td className="px-6 py-4 text-center"><p className="text-xs font-black text-gray-800">{mant.kilometraje} km</p></td>
                                                    <td className="px-6 py-4 text-center"><p className="text-xs font-black text-gray-800">${mant.costo}</p></td>
                                                    <td className="px-6 py-4 text-right">
                                                        {mant.estado === 'COMPLETADO' ? (
                                                            <div><span className="inline-flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded"><MdCheckCircle/> Completado</span><p className="text-[9px] text-gray-400 mt-1">{formatearFecha(mant.created_at)}</p></div>
                                                        ) : (
                                                            <div>
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded"><MdSchedule/> Programado</span>
                                                                {mant.fecha_programada ? (
                                                                    <p className="text-[9px] font-bold text-orange-500 mt-1">Fecha: {formatearFecha(mant.fecha_programada)}</p>
                                                                ) : mant.kilometraje_programado ? (
                                                                    <p className="text-[9px] font-bold text-orange-500 mt-1">A los: {mant.kilometraje_programado} km</p>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ===================== VISTA INVENTARIO ===================== */}
                        {vistaActiva === 'inventario' && (
                            <div className="flex-1 overflow-auto custom-scrollbar p-6">
                                {inventario.length === 0 ? (
                                    <div className="text-center py-20 text-gray-400 font-bold">El inventario está vacío. Agrega tu primer artículo.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {inventario.map(item => (
                                            <div key={item.id} className="border border-gray-100 bg-white rounded-2xl p-4 shadow-sm flex flex-col hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded">{item.categoria}</span>
                                                    <div className={`w-3 h-3 rounded-full ${item.cantidad > 5 ? 'bg-green-400' : item.cantidad > 0 ? 'bg-orange-400' : 'bg-red-500'}`}></div>
                                                </div>
                                                <h3 className="text-sm font-black text-gray-800 mb-1 line-clamp-2 leading-tight">{item.nombre}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-4">{item.unidad_medida}</p>
                                                
                                                <div className="mt-auto flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                    <button onClick={() => handleAjustarStock(item.id, item.cantidad, -1)} className="w-8 h-8 flex items-center justify-center bg-white text-red-500 rounded-lg shadow-sm border border-gray-200 hover:bg-red-50 active:scale-95 font-black text-lg">-</button>
                                                    <div className="text-center"><p className="text-lg font-black text-gray-900">{item.cantidad}</p></div>
                                                    <button onClick={() => handleAjustarStock(item.id, item.cantidad, 1)} className="w-8 h-8 flex items-center justify-center bg-white text-green-600 rounded-lg shadow-sm border border-gray-200 hover:bg-green-50 active:scale-95 font-black text-lg">+</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===================== VISTA COMBUSTIBLE ===================== */}
                        {vistaActiva === 'combustible' && (
                            <div className="flex-1 overflow-auto custom-scrollbar p-2">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead className="bg-gray-50/80 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tl-2xl">Unidad</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Conductor</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Fecha</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Odómetro</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Litros / Monto</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right rounded-tr-2xl">Evidencia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {gasolina.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-10 text-gray-400 font-bold">No hay registros de carga de combustible.</td></tr>
                                        ) : (
                                            gasolina.map(gas => (
                                                <tr key={gas.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-gray-800">{gas.vehiculo?.marca} {gas.vehiculo?.modelo}</p>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase">{gas.vehiculo?.placas}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded">{gas.usuario_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <p className="text-xs font-bold text-gray-600">{formatearFecha(gas.created_at)}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-gray-600 bg-gray-100 px-2 py-1 rounded"><MdSpeed/> {gas.kilometraje_carga} km</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <p className="text-xs font-black text-gray-800">${gas.monto}</p>
                                                        {gas.litros && <p className="text-[9px] font-bold text-gray-400 uppercase">{gas.litros} Litros</p>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => setTicketAmpliado(gas.foto_ticket_url)} className="text-[10px] font-black bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1 ml-auto">
                                                            <MdImage className="text-base" /> Ver Ticket
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL: REGISTRAR SERVICIO */}
            {mostrarModalServicio && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleGuardarServicio} className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdBuild className="text-blue-600"/> Registrar Servicio</h3>
                            <button type="button" onClick={() => setMostrarModalServicio(false)} className="text-gray-400 hover:text-red-500"><MdClose className="text-xl"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Unidad Vehicular</label>
                                <select required value={formServicio.vehiculo_id} onChange={e => setFormServicio({...formServicio, vehiculo_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                    <option value="">Selecciona un vehículo...</option>
                                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placas}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Tipo</label>
                                    <select value={formServicio.tipo} onChange={e => setFormServicio({...formServicio, tipo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="PREVENTIVO">Preventivo</option><option value="CORRECTIVO">Correctivo (Falla)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Estado</label>
                                    <select value={formServicio.estado} onChange={e => setFormServicio({...formServicio, estado: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="COMPLETADO">Completado hoy</option><option value="PROGRAMADO">Programar a futuro</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* DUALIDAD DE PROGRAMACIÓN */}
                            {formServicio.estado === 'PROGRAMADO' && (
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-4">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                                            <input type="radio" name="tipoProg" value="FECHA" checked={formServicio.tipo_programacion === 'FECHA'} onChange={() => setFormServicio({...formServicio, tipo_programacion: 'FECHA'})} /> Por Fecha
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                                            <input type="radio" name="tipoProg" value="KILOMETRAJE" checked={formServicio.tipo_programacion === 'KILOMETRAJE'} onChange={() => setFormServicio({...formServicio, tipo_programacion: 'KILOMETRAJE'})} /> Por Kilometraje
                                        </label>
                                    </div>
                                    {formServicio.tipo_programacion === 'FECHA' ? (
                                        <div><label className="block text-[10px] font-black text-orange-600 uppercase mb-2">¿En qué fecha se debe realizar?</label><input type="date" required value={formServicio.fecha_programada} onChange={e => setFormServicio({...formServicio, fecha_programada: e.target.value})} className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-orange-500" /></div>
                                    ) : (
                                        <div><label className="block text-[10px] font-black text-orange-600 uppercase mb-2">¿A los cuántos KM se debe realizar?</label><input type="number" required value={formServicio.kilometraje_programado} onChange={e => setFormServicio({...formServicio, kilometraje_programado: e.target.value})} placeholder="Ej. 150000" className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-orange-500" /></div>
                                    )}
                                </div>
                            )}

                            <div><label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Descripción</label><textarea required value={formServicio.descripcion} onChange={e => setFormServicio({...formServicio, descripcion: e.target.value})} placeholder="Cambio de balatas, revisión de niveles..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 h-20 resize-none"></textarea></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Odómetro Actual (Obligatorio)</label><input type="number" required value={formServicio.kilometraje} onChange={e => setFormServicio({...formServicio, kilometraje: e.target.value})} placeholder="Ej. 125000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" /></div>
                                <div><label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Costo Total ($)</label><input type="number" value={formServicio.costo} onChange={e => setFormServicio({...formServicio, costo: e.target.value})} placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" /></div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-white">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50">{isSubmitting ? 'Guardando...' : 'Guardar Servicio'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL: NUEVO ARTÍCULO INVENTARIO (Se mantiene igual por ahora) */}
            {mostrarModalInventario && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleGuardarArticulo} className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdInventory className="text-blue-600"/> Agregar Artículo</h3>
                            <button type="button" onClick={() => setMostrarModalInventario(false)} className="text-gray-400 hover:text-red-500"><MdClose className="text-xl"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Nombre del Artículo</label><input required type="text" value={formInventario.nombre} onChange={e => setFormInventario({...formInventario, nombre: e.target.value})} placeholder="Ej. Aceite Sintético 5W-30" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" /></div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Categoría</label>
                                <select value={formInventario.categoria} onChange={e => setFormInventario({...formInventario, categoria: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                    <option value="ACEITE">Aceites y Lubricantes</option><option value="ANTICONGELANTE">Anticongelantes</option><option value="LLANTAS">Llantas</option><option value="FRENOS">Frenos / Balatas</option><option value="GENERAL">General / Accesorios</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Cantidad Inicial</label><input type="number" required value={formInventario.cantidad} onChange={e => setFormInventario({...formInventario, cantidad: e.target.value})} min="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" /></div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Unidad</label>
                                    <select value={formInventario.unidad_medida} onChange={e => setFormInventario({...formInventario, unidad_medida: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="Piezas">Piezas</option><option value="Litros">Litros</option><option value="Pares">Pares</option><option value="Kits">Kits</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-white">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50">{isSubmitting ? 'Guardando...' : 'Guardar Artículo'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIGHTBOX DEL TICKET DE COMBUSTIBLE */}
            {ticketAmpliado && (
                <VisorImagen 
                    imageUrl={ticketAmpliado} 
                    onClose={() => setTicketAmpliado(null)} 
                />
            )}
        </div>
    );
}