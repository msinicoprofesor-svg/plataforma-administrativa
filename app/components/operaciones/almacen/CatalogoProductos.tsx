/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/CatalogoProductos.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdSearch, MdAdd, MdClose, MdInventory2 } from "react-icons/md";
import { MdSearch, MdAdd, MdClose, MdInventory2, MdWarning } from "react-icons/md";

export default function CatalogoProductos({ useData }) {
    const { inventario, agregarProducto, cargando } = useData;
    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulario de Alta
    const [nuevoProd, setNuevoProd] = useState({
        nombre: '', marca: '', categoria: 'CABLEADO', 
        almacen: 'CENTRO', region: 'N/A', 
        minimo: 10, unidad: 'pza'
    });

    const productosFiltrados = inventario.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        p.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await agregarProducto(nuevoProd);
        setIsSubmitting(false);
        setModalAbierto(false);
        setNuevoProd({ nombre: '', marca: '', categoria: 'CABLEADO', almacen: 'CENTRO', region: 'N/A', minimo: 10, unidad: 'pza' });
        alert("Producto agregado al catálogo exitosamente.");
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative">
            
            {/* BARRA DE HERRAMIENTAS */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-80">
                    <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                    <input type="text" placeholder="Buscar por nombre, marca o categoría..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 shadow-sm" />
                </div>
                <button onClick={() => setModalAbierto(true)} className="w-full md:w-auto px-5 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-xs transition-all shadow-md shadow-gray-900/20 active:scale-95 flex items-center justify-center gap-2">
                    <MdAdd className="text-lg"/> Agregar Producto Base
                </button>
            </div>
            
            {/* TABLA DE CATÁLOGO */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {cargando ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : productosFiltrados.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No se encontraron productos en el catálogo.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="text-[10px] text-gray-400 uppercase bg-white sticky top-0 z-10 shadow-sm">
                            <tr><th className="p-4 rounded-tl-xl">Articulo / Marca</th><th className="p-4">Categoría</th><th className="p-4">Ubicación Fija</th><th className="p-4 text-center">Alerta (Mín)</th><th className="p-4 text-center rounded-tr-xl">Stock Actual</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {productosFiltrados.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-black text-gray-800 text-xs">{p.nombre}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">MARCA: {p.marca}</p>
                                    </td>
                                    <td className="p-4"><span className="bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">{p.categoria}</span></td>
                                    <td className="p-4">
                                        <p className="text-xs font-bold text-gray-800">{p.almacen}</p>
                                        {p.region !== 'N/A' && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.region}</p>}
                                    </td>
                                    <td className="p-4 text-center text-xs font-black text-gray-400">{p.minimo} {p.unidad}</td>
                                    <td className="p-4 text-center">
                                        <span className={`text-xs font-black px-3 py-1 rounded-lg border ${p.stock <= p.minimo ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                            {p.stock} {p.unidad}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL DE ALTA DE PRODUCTO */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleGuardar} className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdInventory2 className="text-blue-600"/> Nuevo Producto</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Crear ficha técnica para el catálogo</p>
                            </div>
                            <button type="button" onClick={() => setModalAbierto(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Nombre / Descripción del Artículo *</label>
                                    <input required type="text" value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} placeholder="Ej. Cable Fibra Drop 1 Hilo, Tensor Tipo P..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Marca / Fabricante</label>
                                    <input type="text" value={nuevoProd.marca} onChange={e => setNuevoProd({...nuevoProd, marca: e.target.value})} placeholder="Ej. CommScope, Genérico..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Categoría *</label>
                                    <select value={nuevoProd.categoria} onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="CABLEADO">Cableado</option>
                                        <option value="HERRAJES">Herrajes</option>
                                        <option value="REDES">Equipos de Red</option>
                                        <option value="HERRAMIENTA">Herramienta</option>
                                        <option value="PAPELERIA">Papelería</option>
                                        <option value="LIMPIEZA">Limpieza</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Almacén Base *</label>
                                    <select value={nuevoProd.almacen} onChange={e => setNuevoProd({...nuevoProd, almacen: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="CENTRO">Centro (General)</option>
                                        <option value="RK">Almacén RK</option>
                                        <option value="WIFICEL">Almacén WifiCel</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Región (Opcional)</label>
                                    <input type="text" value={nuevoProd.region} onChange={e => setNuevoProd({...nuevoProd, region: e.target.value})} placeholder="Ej. Querétaro, Monterrey..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdWarning className="text-red-400"/> Stock Mínimo (Alerta) *</label>
                                    <input required type="number" min="0" value={nuevoProd.minimo} onChange={e => setNuevoProd({...nuevoProd, minimo: parseInt(e.target.value)})} className="w-full bg-white border-2 border-red-100 rounded-xl px-4 py-3 text-sm font-black text-red-600 outline-none focus:border-red-400 text-center shadow-inner" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Unidad de Medida *</label>
                                    <select value={nuevoProd.unidad} onChange={e => setNuevoProd({...nuevoProd, unidad: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="pza">Piezas (pza)</option>
                                        <option value="mts">Metros (mts)</option>
                                        <option value="caja">Cajas</option>
                                        <option value="rollo">Rollos</option>
                                        <option value="kg">Kilogramos (kg)</option>
                                        <option value="lts">Litros (lts)</option>
                                    </select>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 font-medium bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <strong>Nota:</strong> El producto se creará con stock en 0. Para agregar unidades físicas, deberás registrar un ingreso desde la pestaña de <strong>Compras</strong>.
                            </p>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setModalAbierto(false)} disabled={isSubmitting} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-black py-4 rounded-xl transition-all shadow-sm active:scale-95">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex justify-center items-center gap-2">Guardar en Catálogo</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}