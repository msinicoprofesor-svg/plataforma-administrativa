/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/CatalogoProductos.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdSearch, MdAdd, MdClose, MdInventory2, MdWarning, MdFilterList } from "react-icons/md";

// LISTAS MAESTRAS DE REGLAS DE NEGOCIO
const MARCAS_DISPONIBLES = ['JAVAK (Corporativo)', 'DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel', 'Fundación Frenxo'];
const REGIONES_DISPONIBLES = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const CATEGORIAS_DISPONIBLES = ['FIBRA ÓPTICA', 'ENLACE / ANTENA', 'CCTV', 'CABLEADO', 'HERRAJES', 'REDES', 'EQUIPO', 'HERRAMIENTA', 'PAPELERIA', 'LIMPIEZA'];

export default function CatalogoProductos({ useData }) {
    const { inventario, agregarProducto, cargando } = useData;
    
    // Estados de Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroMarca, setFiltroMarca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroRegion, setFiltroRegion] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulario de Alta
    const [nuevoProd, setNuevoProd] = useState({
        nombre: '', marca: MARCAS_DISPONIBLES[0], categoria: CATEGORIAS_DISPONIBLES[0], 
        almacen: 'CENTRO', region: REGIONES_DISPONIBLES[0], 
        minimo: 10, unidad: 'pza'
    });

    // Lógica de Filtrado Compuesto
    const productosFiltrados = inventario.filter(p => {
        const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.marca.toLowerCase().includes(busqueda.toLowerCase());
        const matchMarca = filtroMarca ? p.marca === filtroMarca : true;
        const matchCategoria = filtroCategoria ? p.categoria === filtroCategoria : true;
        // La región puede coincidir con el Almacén Base o con la Región específica
        const matchRegion = filtroRegion ? (p.almacen === filtroRegion.toUpperCase() || p.region === filtroRegion) : true;
        
        return matchBusqueda && matchMarca && matchCategoria && matchRegion;
    });

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await agregarProducto(nuevoProd);
        setIsSubmitting(false);
        setModalAbierto(false);
        setNuevoProd({ nombre: '', marca: MARCAS_DISPONIBLES[0], categoria: CATEGORIAS_DISPONIBLES[0], almacen: 'CENTRO', region: REGIONES_DISPONIBLES[0], minimo: 10, unidad: 'pza' });
        alert("Producto agregado al catálogo exitosamente.");
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative">
            
            {/* BARRA DE HERRAMIENTAS Y FILTROS */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                        <input type="text" placeholder="Buscar por nombre o descripción..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 shadow-sm" />
                    </div>
                    <button onClick={() => setModalAbierto(true)} className="w-full md:w-auto px-5 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-xs transition-all shadow-md shadow-gray-900/20 active:scale-95 flex items-center justify-center gap-2">
                        <MdAdd className="text-lg"/> Agregar Producto Base
                    </button>
                </div>

                {/* FILTROS AVANZADOS */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mr-2">
                        <MdFilterList className="text-lg"/> Filtros:
                    </div>
                    <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                        <option value="">Todas las Marcas</option>
                        {MARCAS_DISPONIBLES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                        <option value="">Todas las Categorías</option>
                        {CATEGORIAS_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filtroRegion} onChange={e => setFiltroRegion(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                        <option value="">Todas las Regiones</option>
                        <option value="CENTRO">Almacén Central</option>
                        <option value="RK">Almacén RK</option>
                        <option value="WIFICEL">Almacén WifiCel</option>
                        <optgroup label="Sedes Regionales">
                            {REGIONES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </optgroup>
                    </select>
                </div>
            </div>
            
            {/* TABLA DE CATÁLOGO */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {cargando ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : productosFiltrados.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No se encontraron productos con estos filtros.</div>
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
                                        {p.region !== 'N/A' && p.region && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.region}</p>}
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
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Crear ficha técnica estandarizada</p>
                            </div>
                            <button type="button" onClick={() => setModalAbierto(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Nombre / Descripción del Artículo *</label>
                                    <input required type="text" value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} placeholder="Ej. Antena LiteBeam M5..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Marca / Empresa *</label>
                                    <select required value={nuevoProd.marca} onChange={e => setNuevoProd({...nuevoProd, marca: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        {MARCAS_DISPONIBLES.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Categoría *</label>
                                    <select required value={nuevoProd.categoria} onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        {CATEGORIAS_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Almacén Base *</label>
                                    <select required value={nuevoProd.almacen} onChange={e => setNuevoProd({...nuevoProd, almacen: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="CENTRO">Centro (General)</option>
                                        <option value="RK">Almacén RK</option>
                                        <option value="WIFICEL">Almacén WifiCel</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Región / Sede Específica *</label>
                                    <select required value={nuevoProd.region} onChange={e => setNuevoProd({...nuevoProd, region: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        {REGIONES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdWarning className="text-red-400"/> Stock Mínimo (Alerta) *</label>
                                    <input required type="number" min="0" value={nuevoProd.minimo} onChange={e => setNuevoProd({...nuevoProd, minimo: parseInt(e.target.value)})} className="w-full bg-white border-2 border-red-100 rounded-xl px-4 py-3 text-sm font-black text-red-600 outline-none focus:border-red-400 text-center shadow-inner" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Unidad de Medida *</label>
                                    <select required value={nuevoProd.unidad} onChange={e => setNuevoProd({...nuevoProd, unidad: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="pza">Piezas (pza)</option>
                                        <option value="mts">Metros (mts)</option>
                                        <option value="caja">Cajas</option>
                                        <option value="rollo">Rollos</option>
                                        <option value="kg">Kilogramos (kg)</option>
                                        <option value="lts">Litros (lts)</option>
                                    </select>
                                </div>
                            </div>
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