/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/CatalogoProductos.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdSearch, MdAdd, MdClose, MdInventory2, MdWarning, MdFilterList } from "react-icons/md";

const MARCAS_DISPONIBLES = ['JAVAK (Corporativo)', 'DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel', 'Fundación Frenxo'];
const REGIONES_DISPONIBLES = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const CATEGORIAS_DISPONIBLES = ['FIBRA ÓPTICA', 'ENLACE / ANTENA', 'CCTV', 'CABLEADO', 'HERRAJES', 'REDES', 'EQUIPO', 'HERRAMIENTA', 'PAPELERIA', 'LIMPIEZA'];

// Aceptamos usuarioActivo como prop para la lógica de roles
export default function CatalogoProductos({ useData, usuarioActivo }) {
    const { inventario, agregarProducto, cargando } = useData;
    
    // --- LÓGICA DE PERMISOS (RBAC) ---
    const ROLES_ADMIN_GENERAL = ['ENCARGADO_ALMACEN', 'GERENTE_GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
    const esAdminGeneral = usuarioActivo && ROLES_ADMIN_GENERAL.includes(usuarioActivo.rol);
    const miRegion = usuarioActivo?.region || 'N/A';

    // Si es admin general ve todo. Si es regional, ve productos de su región + los productos "BASE" genéricos
    const inventarioPermitido = esAdminGeneral 
        ? inventario 
        : inventario.filter(p => p.region === miRegion || p.almacen === miRegion || p.almacen === 'CATALOGO_BASE');

    // Estados de Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroMarca, setFiltroMarca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroRegion, setFiltroRegion] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulario de Alta (SOLO PRODUCTO BASE)
    const [nuevoProd, setNuevoProd] = useState({
        nombre: '', 
        categoria: CATEGORIAS_DISPONIBLES[0], 
        minimo: 10, 
        unidad: 'pza',
        // Valores por defecto para que la BD no falle. Se actualizarán al comprar.
        marca: 'MULTI-MARCA', 
        almacen: 'CATALOGO_BASE', 
        region: 'GENERAL' 
    });

    const productosFiltrados = inventarioPermitido.filter(p => {
        const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.marca.toLowerCase().includes(busqueda.toLowerCase());
        const matchMarca = filtroMarca ? p.marca === filtroMarca : true;
        const matchCategoria = filtroCategoria ? p.categoria === filtroCategoria : true;
        const matchRegion = filtroRegion ? (p.almacen === filtroRegion.toUpperCase() || p.region === filtroRegion) : true;
        
        return matchBusqueda && matchMarca && matchCategoria && matchRegion;
    });

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await agregarProducto(nuevoProd);
        setIsSubmitting(false);
        setModalAbierto(false);
        setNuevoProd({ nombre: '', categoria: CATEGORIAS_DISPONIBLES[0], minimo: 10, unidad: 'pza', marca: 'MULTI-MARCA', almacen: 'CATALOGO_BASE', region: 'GENERAL' });
        alert("Producto Base agregado al catálogo exitosamente.");
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
                    {/* Solo el Admin General o Encargado de Almacén debería crear productos base */}
                    {esAdminGeneral && (
                        <button onClick={() => setModalAbierto(true)} className="w-full md:w-auto px-5 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-xs transition-all shadow-md shadow-gray-900/20 active:scale-95 flex items-center justify-center gap-2">
                            <MdAdd className="text-lg"/> Agregar Producto Base
                        </button>
                    )}
                </div>

                {/* FILTROS AVANZADOS */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mr-2">
                        <MdFilterList className="text-lg"/> Filtros:
                    </div>
                    {/* Si es admin regional, no necesita filtrar por región porque ya está filtrado por la suya */}
                    {esAdminGeneral && (
                        <select value={filtroRegion} onChange={e => setFiltroRegion(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                            <option value="">Todas las Regiones</option>
                            <option value="CENTRO">Centro (General)</option>
                            <optgroup label="Sedes Regionales">
                                {REGIONES_DISPONIBLES.filter(r => r !== 'Centro').map(r => <option key={r} value={r}>{r}</option>)}
                            </optgroup>
                        </select>
                    )}
                    <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                        <option value="">Todas las Marcas</option>
                        {MARCAS_DISPONIBLES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                        <option value="">Todas las Categorías</option>
                        {CATEGORIAS_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            
            {/* TABLA DE CATÁLOGO */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {cargando ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : productosFiltrados.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No se encontraron productos.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="text-[10px] text-gray-400 uppercase bg-white sticky top-0 z-10 shadow-sm">
                            <tr><th className="p-4 rounded-tl-xl">Articulo Base</th><th className="p-4">Marca</th><th className="p-4">Categoría</th><th className="p-4">Ubicación / Región</th><th className="p-4 text-center">Stock Actual</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {productosFiltrados.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-black text-gray-800 text-xs">{p.nombre}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Mínimo: {p.minimo} {p.unidad}</p>
                                    </td>
                                    <td className="p-4">
                                        {p.marca === 'MULTI-MARCA' ? <span className="text-[9px] font-bold text-gray-400 italic">Genérico</span> : <span className="text-[10px] font-black text-gray-700">{p.marca}</span>}
                                    </td>
                                    <td className="p-4"><span className="bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">{p.categoria}</span></td>
                                    <td className="p-4">
                                        {p.almacen === 'CATALOGO_BASE' ? (
                                            <span className="text-[9px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold uppercase tracking-widest">Catálogo Base</span>
                                        ) : (
                                            <>
                                                <p className="text-xs font-bold text-gray-800">{p.almacen}</p>
                                                {p.region !== 'N/A' && p.region !== 'GENERAL' && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.region}</p>}
                                            </>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-xs font-black px-3 py-1 rounded-lg border ${p.stock <= p.minimo && p.almacen !== 'CATALOGO_BASE' ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                            {p.stock} {p.unidad}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL DE ALTA DE PRODUCTO BASE (Simplificado) */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleGuardar} className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdInventory2 className="text-blue-600"/> Nuevo Producto Base</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Crear plantilla para futuras compras</p>
                            </div>
                            <button type="button" onClick={() => setModalAbierto(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Nombre genérico del Artículo *</label>
                                    <input required type="text" value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} placeholder="Ej. Cable Fibra Drop 1 Hilo (Sin marca)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>
                                
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Categoría Principal *</label>
                                    <select required value={nuevoProd.categoria} onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        {CATEGORIAS_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdWarning className="text-red-400"/> Alerta de Stock Mínimo *</label>
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
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                    <strong>Nota del Sistema:</strong> Estás creando un "Producto Base" (Catálogo). La <strong>Marca</strong> y la <strong>Región/Almacén</strong> donde se guardará físicamente se asignarán al momento de registrar un ingreso en la pestaña de <strong>Compras</strong>.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setModalAbierto(false)} disabled={isSubmitting} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-black py-4 rounded-xl transition-all shadow-sm active:scale-95">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex justify-center items-center gap-2">Crear Producto Base</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}