/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/CatalogoProductos.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MdSearch, MdAdd, MdClose, MdInventory2, MdWarning, MdFilterList } from "react-icons/md";

const MARCAS_DISPONIBLES = ['JAVAK (Corporativo)', 'DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel', 'Fundación Frenxo'];
const REGIONES_DISPONIBLES = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const CATEGORIAS_DISPONIBLES = ['FIBRA ÓPTICA', 'ENLACE / ANTENA', 'CCTV', 'CABLEADO', 'HERRAJES', 'REDES', 'EQUIPO', 'HERRAMIENTA', 'PAPELERIA', 'LIMPIEZA'];

export default function CatalogoProductos({ useData, usuarioActivo }) {
    const { inventario, agregarProducto, cargando } = useData;
    
    // --- LÓGICA DE PERMISOS (RBAC) ---
    const ROLES_ADMIN_GENERAL = ['ENCARGADO_ALMACEN', 'GERENTE_GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
    const esAdminGeneral = usuarioActivo && ROLES_ADMIN_GENERAL.includes(usuarioActivo.rol);
    const miRegion = usuarioActivo?.region || 'N/A';
    const miMarca = usuarioActivo?.marca || 'N/A';

    const [busqueda, setBusqueda] = useState('');
    const [filtroMarca, setFiltroMarca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    
    const [capsulaActiva, setCapsulaActiva] = useState('General'); 
    const [regionesExpandidas, setRegionesExpandidas] = useState(false);
    
    // ESTADOS PARA LAS FILAS EXPANDIBLES (EL BOTÓN "+")
    const [filasExpandidas, setFilasExpandidas] = useState({});
    
    const toggleFila = (id) => {
        setFilasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
        if (regionesExpandidas) {
            setTimeout(checkScroll, 100);
            setTimeout(checkScroll, 400); 
        }
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [regionesExpandidas]);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [nuevoProd, setNuevoProd] = useState({
        nombre: '', categoria: CATEGORIAS_DISPONIBLES[0], minimo: 10, unidad: 'pza',
        marca: 'MULTI-MARCA', almacen: 'CATALOGO_BASE', region: 'GENERAL' 
    });

    // --- GRUPOS DE CÁPSULAS ACTUALIZADOS ---
    const leftGroup = ['Todos', 'General'];
    const midGroup = REGIONES_DISPONIBLES; 
    const rightGroup = ['WIFICEL', 'RK', 'FIBROX', 'INTERCHEAP'];

    const isLeftActive = leftGroup.includes(capsulaActiva);
    const isMidActive = midGroup.includes(capsulaActiva);
    const coverCapsule = (isLeftActive || isMidActive) ? capsulaActiva : 'General';

    let CAPSULAS_REGIONAL = ['General'];
    if (!esAdminGeneral) {
        if (miRegion !== 'N/A') CAPSULAS_REGIONAL.push(miRegion);
        if (miMarca !== 'N/A' && rightGroup.includes(miMarca.toUpperCase())) CAPSULAS_REGIONAL.push(miMarca.toUpperCase());
        CAPSULAS_REGIONAL = [...new Set(CAPSULAS_REGIONAL)];
    }

    // --- LÓGICA DE AGRUPACIÓN (ERP MAGIA) ---
    const catalogoBase = inventario.filter(p => p.almacen === 'CATALOGO_BASE');
    const fisicos = inventario.filter(p => p.almacen !== 'CATALOGO_BASE');

    const productosAgrupados = catalogoBase.map(base => {
        let fisicosFiltrados = fisicos.filter(f => f.nombre === base.nombre);

        // 1. Filtros de barra superior
        fisicosFiltrados = fisicosFiltrados.filter(f => {
            const matchBusqueda = f.nombre.toLowerCase().includes(busqueda.toLowerCase()) || f.marca.toLowerCase().includes(busqueda.toLowerCase());
            const matchMarca = filtroMarca ? f.marca === filtroMarca : true;
            const matchCategoria = filtroCategoria ? f.categoria === filtroCategoria : true;
            return matchBusqueda && matchMarca && matchCategoria;
        });

        // 2. Filtros de Cápsulas Activas
        if (capsulaActiva !== 'Todos') {
            fisicosFiltrados = fisicosFiltrados.filter(f => {
                if (capsulaActiva === 'General') return f.almacen === 'GENERAL' || f.marca.includes('JAVAK');
                if (rightGroup.includes(capsulaActiva)) return f.almacen === capsulaActiva || f.marca.toUpperCase().includes(capsulaActiva);
                return f.region === capsulaActiva || f.almacen === capsulaActiva.toUpperCase();
            });
        }

        // 3. Filtros de Permisos Regionales
        if (!esAdminGeneral) {
            fisicosFiltrados = fisicosFiltrados.filter(f => f.region === miRegion || f.almacen === miRegion || f.marca === miMarca || f.almacen === miMarca.toUpperCase());
        }

        // 4. Sumatoria y Desglose
        const stockTotal = fisicosFiltrados.reduce((acc, curr) => acc + curr.stock, 0);
        const desglose = fisicosFiltrados.filter(f => f.stock > 0);

        const baseMatchBusqueda = base.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const baseMatchCategoria = filtroCategoria ? base.categoria === filtroCategoria : true;

        return {
            ...base,
            stockTotal,
            desglose,
            visible: (baseMatchBusqueda && baseMatchCategoria) && (capsulaActiva === 'Todos' || stockTotal > 0 || capsulaActiva === 'General')
        };
    }).filter(item => item.visible);

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await agregarProducto(nuevoProd);
        setIsSubmitting(false);
        setModalAbierto(false);
        setNuevoProd({ nombre: '', categoria: CATEGORIAS_DISPONIBLES[0], minimo: 10, unidad: 'pza', marca: 'MULTI-MARCA', almacen: 'CATALOGO_BASE', region: 'GENERAL' });
        alert("Producto Base agregado al catálogo exitosamente.");
    };

    const getShortName = (name) => {
        if(name === 'San Diego de la Unión') return 'SDU';
        if(name === 'Santa María del Río') return 'SMR';
        if(name === 'Jalpan de Serra') return 'Jalpan';
        if(name === 'INTERCHEAP') return 'Intercheap';
        if(name === 'FIBROX') return 'Fibrox';
        return name;
    };

    const handleCapsuleClick = (cap) => {
        if (!regionesExpandidas) {
            setRegionesExpandidas(true);
        } else {
            if (capsulaActiva === cap) setRegionesExpandidas(false);
            else setCapsulaActiva(cap);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative">
            
            <style>{`
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                .fade-edges {
                    -webkit-mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent);
                    mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent);
                }
            `}</style>

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

                                <button 
                                    onClick={() => scrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' })}
                                    className={`transition-all duration-300 ease-in-out flex items-center justify-center shrink-0
                                        ${regionesExpandidas && canScrollLeft ? 'w-5 opacity-100 text-gray-300 hover:text-blue-600 scale-100' : 'w-0 opacity-0 scale-50 pointer-events-none'}
                                    `}
                                >
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

                                <button 
                                    onClick={() => scrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' })}
                                    className={`transition-all duration-300 ease-in-out flex items-center justify-center shrink-0
                                        ${regionesExpandidas && canScrollRight ? 'w-5 opacity-100 text-gray-300 hover:text-blue-600 scale-100' : 'w-0 opacity-0 scale-50 pointer-events-none'}
                                    `}
                                >
                                    <span className="text-[14px]">▶</span>
                                </button>

                                <div className={`transition-all duration-500 ease-in-out bg-gray-200 hidden md:block rounded-full ${regionesExpandidas ? 'w-[2px] h-6 mx-2 opacity-100' : 'w-0 h-6 mx-0 opacity-0 border-transparent'}`}></div>

                                {rightGroup.map(cap => {
                                    const isActive = capsulaActiva === cap;
                                    let btnClass = "px-4 py-1.5 mx-0.5 rounded-full text-[11px] font-black whitespace-nowrap cursor-pointer transition-all duration-300 border ";
                                    if (isActive) btnClass += "bg-white text-blue-600 border-blue-200 shadow-sm ";
                                    else btnClass += "bg-gray-500 text-white border-transparent hover:bg-gray-600 shadow-sm ";

                                    return (
                                        <button key={cap} onClick={() => { setCapsulaActiva(cap); setRegionesExpandidas(false); }} className={btnClass}>
                                            {getShortName(cap)}
                                        </button>
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
                                        <button key={cap} onClick={() => setCapsulaActiva(cap)} className={baseStyle}>
                                            {getShortName(cap)}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {esAdminGeneral && (
                        <button onClick={() => setModalAbierto(true)} className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0">
                            <MdAdd className="text-lg"/> Agregar producto base
                        </button>
                    )}
                </div>
            </div>
            
            {/* TABLA DE CATÁLOGO (AGRUPADA Y DESPLEGABLE) */}
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
                                                {/* EL BOTÓN MÁGICO "+" */}
                                                {p.desglose.length > 0 && (
                                                    <button onClick={() => toggleFila(p.id)} className="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center font-bold transition-all shadow-sm">
                                                        {filasExpandidas[p.id] ? '-' : '+'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* LA TARJETA DESPLEGABLE CON EL DESGLOSE */}
                                    {filasExpandidas[p.id] && p.desglose.length > 0 && (
                                        <tr className="bg-blue-50/20 border-b border-blue-50">
                                            <td colSpan="5" className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4 border-l-2 border-blue-300">
                                                    {p.desglose.map((d, index) => (
                                                        <div key={`${d.id}-${index}`} className="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-700 uppercase">{d.marca}</p>
                                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">UBICACIÓN: {d.almacen} {d.region !== 'N/A' && d.region !== 'GENERAL' && `- ${d.region}`}</p>
                                                            </div>
                                                            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{d.stock} {d.unidad}</span>
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

            {/* MODAL DE ALTA DE PRODUCTO BASE */}
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