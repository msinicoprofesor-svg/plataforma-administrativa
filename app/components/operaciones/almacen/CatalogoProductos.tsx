/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/CatalogoProductos.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MdSearch, MdAdd, MdClose, MdInventory2, MdWarning, MdFilterList, MdHistory, MdArrowUpward, MdArrowDownward, MdAddShoppingCart, MdShoppingCart } from "react-icons/md";
import ModalDespacho from './ModalDespacho'; // IMPORTAMOS EL PUNTO DE VENTA

const MARCAS_DISPONIBLES = ['JAVAK (Corporativo)', 'DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel', 'Fundación Frenxo'];
const REGIONES_DISPONIBLES = ['Almacén General', 'Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const CATEGORIAS_DISPONIBLES = ['FIBRA ÓPTICA', 'ENLACE / ANTENA', 'CCTV', 'CABLEADO', 'HERRAJES', 'REDES', 'EQUIPO', 'HERRAMIENTA', 'PAPELERIA', 'LIMPIEZA'];

export default function CatalogoProductos({ useData, usuarioActivo, colaboradores = [] }) {
    const { inventario, agregarProducto, movimientos, cargando } = useData;
    
    // --- LÓGICA DE PERMISOS (RBAC) ---
    const rolNormalizado = (usuarioActivo?.rol || usuarioActivo?.puesto || '').toUpperCase().trim();
    const ROLES_ADMIN_GENERAL = ['ENCARGADO_ALMACEN', 'ENCARGADO DE ALMACÉN', 'ENCARGADO DE ALMACEN', 'GERENTE_GENERAL', 'GERENTE GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
    const esAdminGeneral = rolNormalizado !== '' && ROLES_ADMIN_GENERAL.includes(rolNormalizado);

    let miRegion = (usuarioActivo?.region && usuarioActivo.region !== 'N/A') ? usuarioActivo.region : 'Almacén General';
    if (miRegion === 'Centro') miRegion = 'Almacén General'; 
    const miMarca = usuarioActivo?.marca || 'N/A';

    const [busqueda, setBusqueda] = useState('');
    const [filtroMarca, setFiltroMarca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    
    const [capsulaActiva, setCapsulaActiva] = useState('General'); 
    const [regionesExpandidas, setRegionesExpandidas] = useState(false);
    const [filasExpandidas, setFilasExpandidas] = useState({});
    
    // ESTADOS PARA MODALES Y CARRITO (PUNTO DE VENTA)
    const [modalAbierto, setModalAbierto] = useState(false); 
    const [modalHistorial, setModalHistorial] = useState(false); 
    const [modalDespachoAbierto, setModalDespachoAbierto] = useState(false);
    const [carrito, setCarrito] = useState([]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleFila = (id) => setFilasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));

    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2); 
        }
    };

    useEffect(() => {
        if (regionesExpandidas) { setTimeout(checkScroll, 100); setTimeout(checkScroll, 400); }
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [regionesExpandidas]);

    const [nuevoProd, setNuevoProd] = useState({
        nombre: '', categoria: CATEGORIAS_DISPONIBLES[0], minimo: 10, unidad: 'pza',
        marca: 'MULTI-MARCA', almacen: 'CATALOGO_BASE', region: 'GENERAL' 
    });

    const leftGroup = ['Todos', 'General'];
    const midGroup = REGIONES_DISPONIBLES.filter(r => r !== 'Almacén General'); 
    const rightGroup = ['WIFICEL', 'RK', 'FIBROX', 'INTERCHEAP'];

    const isLeftActive = leftGroup.includes(capsulaActiva);
    const isMidActive = midGroup.includes(capsulaActiva);
    const coverCapsule = (isLeftActive || isMidActive) ? capsulaActiva : 'General';

    let CAPSULAS_REGIONAL = ['General'];
    if (!esAdminGeneral) {
        if (miRegion !== 'N/A' && miRegion !== 'Almacén General') CAPSULAS_REGIONAL.push(miRegion);
        if (miMarca !== 'N/A' && rightGroup.includes(miMarca.toUpperCase())) CAPSULAS_REGIONAL.push(miMarca.toUpperCase());
        CAPSULAS_REGIONAL = [...new Set(CAPSULAS_REGIONAL)];
    }

    const catalogoBase = inventario.filter(p => p.almacen === 'CATALOGO_BASE');
    const fisicos = inventario.filter(p => p.almacen !== 'CATALOGO_BASE');

    const productosAgrupados = catalogoBase.map(base => {
        let fisicosFiltrados = fisicos.filter(f => f.nombre === base.nombre);

        fisicosFiltrados = fisicosFiltrados.filter(f => {
            const matchBusqueda = f.nombre.toLowerCase().includes(busqueda.toLowerCase()) || f.marca.toLowerCase().includes(busqueda.toLowerCase());
            const matchMarca = filtroMarca ? f.marca === filtroMarca : true;
            const matchCategoria = filtroCategoria ? f.categoria === filtroCategoria : true;
            return matchBusqueda && matchMarca && matchCategoria;
        });

        if (capsulaActiva !== 'Todos') {
            fisicosFiltrados = fisicosFiltrados.filter(f => {
                if (capsulaActiva === 'General') return f.almacen === 'ALMACÉN GENERAL' || f.almacen === 'ALMACEN GENERAL' || f.region === 'Almacén General';
                if (rightGroup.includes(capsulaActiva)) return f.almacen === capsulaActiva || f.marca.toUpperCase().includes(capsulaActiva);
                return f.region === capsulaActiva || f.almacen === capsulaActiva.toUpperCase();
            });
        }

        if (!esAdminGeneral) {
            fisicosFiltrados = fisicosFiltrados.filter(f => f.region === miRegion || f.almacen === miRegion.toUpperCase() || f.marca === miMarca || f.almacen === miMarca.toUpperCase());
        }

        const stockTotal = fisicosFiltrados.reduce((acc, curr) => acc + curr.stock, 0);
        const desglose = fisicosFiltrados.filter(f => f.stock > 0);

        const baseMatchBusqueda = base.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const baseMatchCategoria = filtroCategoria ? base.categoria === filtroCategoria : true;

        return {
            ...base, stockTotal, desglose,
            visible: (baseMatchBusqueda && baseMatchCategoria) && (capsulaActiva === 'Todos' || stockTotal > 0 || capsulaActiva === 'General')
        };
    }).filter(item => item.visible);

    const handleGuardarProductoBase = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await agregarProducto(nuevoProd);
        setIsSubmitting(false);
        setModalAbierto(false);
        setNuevoProd({ nombre: '', categoria: CATEGORIAS_DISPONIBLES[0], minimo: 10, unidad: 'pza', marca: 'MULTI-MARCA', almacen: 'CATALOGO_BASE', region: 'GENERAL' });
        alert("Producto Base agregado al catálogo exitosamente.");
    };

    // --- LÓGICA DE AÑADIR AL CARRITO (PUNTO DE VENTA) ---
    const handleAgregarCarrito = (productoFisico) => {
        if (productoFisico.stock <= 0) return alert("No hay stock disponible.");
        setCarrito(prev => {
            const existe = prev.find(item => item.producto.id === productoFisico.id);
            if (existe) {
                if (existe.cantidad >= productoFisico.stock) {
                    alert(`Solo hay ${productoFisico.stock} unidades de este producto disponibles.`);
                    return prev;
                }
                return prev.map(item => item.producto.id === productoFisico.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { producto: productoFisico, cantidad: 1 }];
        });
    };

    // --- PREPARAR HISTORIAL ---
    const movimientosEnriquecidos = movimientos.map(m => {
        const prod = inventario.find(i => i.id === m.producto_id);
        return { ...m, producto: prod };
    }).filter(m => {
        if (!m.producto) return false; 
        if (esAdminGeneral) return true; 
        return m.producto.region === miRegion || m.producto.almacen === miRegion.toUpperCase() || m.producto.marca === miMarca || m.producto.almacen === miMarca.toUpperCase();
    });

    const getShortName = (name) => {
        if(name === 'San Diego de la Unión') return 'SDU';
        if(name === 'Santa María del Río') return 'SMR';
        if(name === 'Jalpan de Serra') return 'Jalpan';
        if(name === 'INTERCHEAP') return 'Intercheap';
        if(name === 'FIBROX') return 'Fibrox';
        return name;
    };

    const handleCapsuleClick = (cap) => {
        if (!regionesExpandidas) setRegionesExpandidas(true);
        else {
            if (capsulaActiva === cap) setRegionesExpandidas(false);
            else setCapsulaActiva(cap);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative">
            
            <style>{`
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                .fade-edges { mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent); }
            `}</style>

            {/* BOTÓN FLOTANTE DEL CARRITO (PUNTO DE VENTA) */}
            {carrito.length > 0 && (
                <button 
                    onClick={() => setModalDespachoAbierto(true)}
                    className="absolute bottom-8 right-8 z-[100] bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 transition-transform hover:scale-105 animate-fade-in"
                >
                    <div className="relative">
                        <MdShoppingCart className="text-2xl" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900">
                            {carrito.reduce((acc, c) => acc + c.cantidad, 0)}
                        </span>
                    </div>
                    <span className="font-black text-sm hidden md:inline">Despachar</span>
                </button>
            )}

            <div className="p-5 border-b border-gray-100 bg-white shrink-0 flex flex-col gap-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <MdFilterList className="text-lg"/> Filtros:
                        </span>
                        <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-full px-4 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                            <option value="">Todas las marcas</option>
                            {MARCAS_DISPONIBLES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-full px-4 py-2 outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                            <option value="">Todas las categorías</option>
                            {CATEGORIAS_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="relative w-full md:w-80">
                        <MdSearch className="absolute left-4 top-2.5 text-gray-400 text-lg" />
                        <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-blue-500 shadow-sm" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 overflow-hidden w-full">
                    <div className="flex overflow-hidden w-full md:w-auto items-center p-1">
                        
                        {esAdminGeneral ? (
                            <div className="flex items-center">
                                {leftGroup.map(cap => {
                                    const isActive = capsulaActiva === cap;
                                    const isCover = !regionesExpandidas && coverCapsule === cap;
                                    const isVisible = regionesExpandidas || isCover;

                                    let btnClass = "transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap rounded-full text-[11px] font-black flex items-center justify-center shrink-0 border ";
                                    if (!isVisible) btnClass += "max-w-0 opacity-0 px-0 py-0 mx-0 border-transparent ";
                                    else {
                                        btnClass += "max-w-[150px] opacity-100 px-4 py-1.5 mx-0.5 ";
                                        if (isActive) btnClass += "bg-white text-blue-600 border-blue-200 shadow-sm ";
                                        else if (isCover) btnClass += "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 shadow-sm ";
                                        else btnClass += "bg-transparent text-gray-500 border-transparent hover:bg-gray-100 ";
                                    }

                                    return (
                                        <button key={cap} onClick={() => handleCapsuleClick(cap)} className={btnClass}>
                                            {cap} {isCover && <span className="text-[8px] ml-1.5 opacity-80">◀▶</span>}
                                        </button>
                                    )
                                })}

                                <button onClick={() => scrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' })} className={`transition-all duration-300 ease-in-out flex items-center justify-center shrink-0 ${regionesExpandidas && canScrollLeft ? 'w-5 opacity-100 text-gray-300 hover:text-blue-600 scale-100' : 'w-0 opacity-0 scale-50 pointer-events-none'}`}>
                                    <span className="text-[14px]">◀</span>
                                </button>

                                <div className={`transition-all duration-500 ease-in-out flex items-center overflow-hidden ${regionesExpandidas ? 'max-w-[280px] opacity-100' : (isMidActive ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0')}`}>
                                    <div ref={scrollRef} onScroll={checkScroll} className={`flex items-center overflow-x-auto hide-scroll scroll-smooth w-full py-1 ${regionesExpandidas ? 'fade-edges' : ''}`}>
                                        {midGroup.map(cap => {
                                            const isActive = capsulaActiva === cap;
                                            const isCover = !regionesExpandidas && coverCapsule === cap;
                                            const isVisible = regionesExpandidas || isCover;

                                            let btnClass = "transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap rounded-full text-[11px] font-black flex items-center justify-center shrink-0 border ";
                                            if (!isVisible) btnClass += "max-w-0 opacity-0 px-0 py-0 mx-0 border-transparent ";
                                            else {
                                                btnClass += "max-w-[150px] opacity-100 px-4 py-1.5 mx-0.5 ";
                                                if (isActive) btnClass += "bg-white text-blue-600 border-blue-200 shadow-sm ";
                                                else btnClass += "bg-transparent text-gray-500 border-transparent hover:bg-gray-100 ";
                                            }

                                            return (
                                                <button key={cap} onClick={() => handleCapsuleClick(cap)} className={btnClass}>
                                                    {getShortName(cap)} {isCover && <span className="text-[8px] ml-1.5 opacity-80">◀▶</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <button onClick={() => scrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' })} className={`transition-all duration-300 ease-in-out flex items-center justify-center shrink-0 ${regionesExpandidas && canScrollRight ? 'w-5 opacity-100 text-gray-300 hover:text-blue-600 scale-100' : 'w-0 opacity-0 scale-50 pointer-events-none'}`}>
                                    <span className="text-[14px]">▶</span>
                                </button>

                                <div className={`transition-all duration-500 ease-in-out bg-gray-200 hidden md:block rounded-full ${regionesExpandidas ? 'w-[2px] h-6 mx-2 opacity-100' : 'w-0 h-6 mx-0 opacity-0 border-transparent'}`}></div>

                                {rightGroup.map(cap => {
                                    const isActive = capsulaActiva === cap;
                                    let btnClass = "px-4 py-1.5 mx-0.5 rounded-full text-[11px] font-black whitespace-nowrap cursor-pointer transition-all duration-300 border ";
                                    if (isActive) btnClass += "bg-white text-blue-600 border-blue-200 shadow-sm ";
                                    else btnClass += "bg-gray-500 text-white border-transparent hover:bg-gray-600 shadow-sm ";

                                    return (
                                        <button key={cap} onClick={() => { setCapsulaActiva(cap); setRegionesExpandidas(false); }} className={btnClass}>{getShortName(cap)}</button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                {CAPSULAS_REGIONAL.map(cap => {
                                    const isDark = rightGroup.includes(cap);
                                    const isActive = capsulaActiva === cap;
                                    let baseStyle = `px-4 py-1.5 mx-0.5 rounded-full text-[11px] font-black whitespace-nowrap cursor-pointer transition-all duration-300 `;
                                    if (isActive) baseStyle += 'bg-white text-blue-600 border border-blue-200 shadow-sm';
                                    else if (isDark) baseStyle += 'bg-gray-500 text-white hover:bg-gray-600 shadow-sm border border-transparent';
                                    else baseStyle += 'bg-transparent text-gray-500 hover:bg-gray-100 border border-transparent';

                                    return (
                                        <button key={cap} onClick={() => setCapsulaActiva(cap)} className={baseStyle}>{getShortName(cap)}</button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex w-full md:w-auto gap-3">
                        <button onClick={() => setModalHistorial(true)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-black text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 shrink-0">
                            <MdHistory className="text-lg"/> Historial
                        </button>
                        {esAdminGeneral && (
                            <button onClick={() => setModalAbierto(true)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0">
                                <MdAdd className="text-lg"/> Producto base
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* TABLA DE CATÁLOGO */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {cargando ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : productosAgrupados.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No se encontraron productos en esta cápsula.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="text-[9px] text-gray-400 uppercase bg-white sticky top-0 z-10 shadow-sm">
                            <tr><th className="p-4 rounded-tl-xl font-black tracking-widest">Articulo Base</th><th className="p-4 font-black tracking-widest">Marca / Propiedad</th><th className="p-4 font-black tracking-widest">Categoría</th><th className="p-4 font-black tracking-widest">Ubicación Global</th><th className="p-4 text-center font-black tracking-widest rounded-tr-xl">Stock Consolidado</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {productosAgrupados.map(p => (
                                <React.Fragment key={p.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-black text-gray-800 text-xs">{p.nombre}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Mínimo: {p.minimo} {p.unidad}</p>
                                        </td>
                                        <td className="p-4">
                                            {capsulaActiva === 'Todos' ? (
                                                <span className="text-[9px] font-bold text-gray-400 italic">Múltiples Marcas</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-700">{p.desglose.length > 0 ? p.desglose[0].marca : 'N/A'}</span>
                                            )}
                                        </td>
                                        <td className="p-4"><span className="bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">{p.categoria}</span></td>
                                        <td className="p-4">
                                            {capsulaActiva === 'Todos' ? (
                                                <span className="text-[9px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold uppercase tracking-widest">Global</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-700">{capsulaActiva}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`text-xs font-black px-3 py-1 rounded-lg border ${p.stockTotal <= p.minimo ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                    {p.stockTotal} {p.unidad}
                                                </span>
                                                {p.desglose.length > 0 && (
                                                    <button onClick={() => toggleFila(p.id)} className="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center font-bold transition-all shadow-sm">
                                                        {filasExpandidas[p.id] ? '-' : '+'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {filasExpandidas[p.id] && p.desglose.length > 0 && (
                                        <tr className="bg-blue-50/20 border-b border-blue-50">
                                            <td colSpan="5" className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4 border-l-2 border-blue-300">
                                                    {p.desglose.map((d, index) => (
                                                        <div key={`${d.id}-${index}`} className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100 shadow-sm animate-fade-in group">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-700 uppercase">{d.marca}</p>
                                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                                    UBICACIÓN: {d.almacen} {d.region !== 'N/A' && d.region !== 'Almacén General' && `- ${d.region}`}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{d.stock} {d.unidad}</span>
                                                                
                                                                {/* BOTÓN DE AÑADIR AL CARRITO (PUNTO DE VENTA) */}
                                                                <button onClick={() => handleAgregarCarrito(d)} className="w-6 h-6 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-sm opacity-100 md:opacity-0 group-hover:opacity-100" title="Añadir al Carrito">
                                                                    <MdAddShoppingCart className="text-sm"/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL 1: ALTA DE PRODUCTO BASE */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleGuardarProductoBase} className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
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
                                        <option value="pza">Piezas (pza)</option><option value="mts">Metros (mts)</option><option value="caja">Cajas</option><option value="rollo">Rollos</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setModalAbierto(false)} disabled={isSubmitting} className="flex-1 bg-white border border-gray-200 text-gray-600 font-black py-4 rounded-xl">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl">Crear Producto Base</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL 2: HISTORIAL DE MOVIMIENTOS */}
            {modalHistorial && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdHistory className="text-blue-600"/> Historial de Entradas y Salidas</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Registro auditable de movimientos de stock</p>
                            </div>
                            <button type="button" onClick={() => setModalHistorial(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
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
                                                    <p className="text-xs font-black text-gray-800">{mov.producto.nombre}</p>
                                                    <p className="text-[10px] font-bold text-gray-500">{mov.producto.marca} • {mov.producto.almacen}</p>
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
            )}

            {/* MODAL 3: EL PUNTO DE VENTA (Despacho Rápido) */}
            <ModalDespacho 
                isOpen={modalDespachoAbierto} 
                onClose={() => setModalDespachoAbierto(false)} 
                useData={useData} 
                usuarioActivo={usuarioActivo} 
                colaboradores={colaboradores} 
                carrito={carrito} 
                setCarrito={setCarrito} 
            />
        </div>
    );
}