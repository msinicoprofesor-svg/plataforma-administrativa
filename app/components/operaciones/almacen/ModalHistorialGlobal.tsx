/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/ModalHistorialGlobal.tsx       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { MdClose, MdHistory, MdArrowUpward, MdArrowDownward, MdShoppingCart, MdLocalShipping, MdComputer, MdStore } from "react-icons/md";

export default function ModalHistorialGlobal({ isOpen, onClose, useData, usuarioActivo, colaboradores = [], contextoInicial = 'CATALOGO' }) {
    const { inventario, movimientos, compras, solicitudes, activos } = useData;
    const [tabActiva, setTabActiva] = useState(contextoInicial);

    // Sincronizar la pestaña si el usuario abre el modal desde otra sección
    useEffect(() => {
        if (isOpen) setTabActiva(contextoInicial);
    }, [isOpen, contextoInicial]);

    if (!isOpen) return null;

    // --- LÓGICA DE PERMISOS (RBAC) ---
    const rolNormalizado = (usuarioActivo?.rol || usuarioActivo?.puesto || '').toUpperCase().trim();
    const ROLES_ADMIN_GENERAL = ['ENCARGADO_ALMACEN', 'ENCARGADO DE ALMACÉN', 'ENCARGADO DE ALMACEN', 'GERENTE_GENERAL', 'GERENTE GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
    const esAdminGeneral = rolNormalizado !== '' && ROLES_ADMIN_GENERAL.includes(rolNormalizado);

    let miRegion = (usuarioActivo?.region && usuarioActivo.region !== 'N/A') ? usuarioActivo.region : 'Almacén General';
    if (miRegion === 'Centro') miRegion = 'Almacén General'; 
    const miMarca = usuarioActivo?.marca || 'N/A';

    const getNombreColab = (id) => {
        const col = colaboradores.find(c => c.id === id);
        return col ? col.nombre : 'Usuario Desconocido';
    };

    // --- 1. FILTRO DE MOVIMIENTOS (Entradas y Salidas de Catálogo) ---
    const movimientosEnriquecidos = movimientos.map(m => {
        const prod = inventario.find(i => i.id === m.producto_id);
        return { ...m, producto: prod };
    }).filter(m => {
        if (!m.producto) return false; 
        if (esAdminGeneral) return true; 
        return m.producto.region === miRegion || m.producto.almacen === miRegion.toUpperCase() || m.producto.marca === miMarca || m.producto.almacen === miMarca.toUpperCase();
    });

    // --- 2. FILTRO DE COMPRAS ---
    const comprasFiltradas = compras.filter(c => {
        if (esAdminGeneral) return true;
        return c.usuario_registro_id === usuarioActivo?.id; // Regionales solo ven las compras que ellos subieron
    });

    // --- 3. FILTRO DE LOGÍSTICA (Solicitudes) ---
    const solicitudesFiltradas = solicitudes.filter(s => {
        if (esAdminGeneral) return true;
        return s.destino.includes(miRegion) || s.usuario_solicitante_id === usuarioActivo?.id;
    });

    // --- 4. FILTRO DE ACTIVOS FIJOS ---
    const activosFiltrados = activos.filter(a => {
        if (esAdminGeneral) return true;
        return a.region === miRegion || a.marca === miMarca;
    });

    return (
        <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-50 rounded-[2rem] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
                
                {/* CABECERA DEL SUPER HISTORIAL */}
                <div className="bg-gray-900 text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-2"><MdHistory className="text-blue-400"/> Auditoría y Trazabilidad Global</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registro inmutable de movimientos del ERP</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-gray-800 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"><MdClose className="text-2xl"/></button>
                </div>

                {/* TABS DE NAVEGACIÓN */}
                <div className="flex bg-white border-b border-gray-200 shrink-0 overflow-x-auto custom-scrollbar hide-scroll">
                    <button onClick={() => setTabActiva('CATALOGO')} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${tabActiva === 'CATALOGO' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                        <MdStore className="text-lg"/> Catálogo y Despachos
                    </button>
                    <button onClick={() => setTabActiva('COMPRAS')} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${tabActiva === 'COMPRAS' ? 'border-purple-600 text-purple-700 bg-purple-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                        <MdShoppingCart className="text-lg"/> Ingreso Compras
                    </button>
                    <button onClick={() => setTabActiva('LOGISTICA')} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${tabActiva === 'LOGISTICA' ? 'border-green-600 text-green-700 bg-green-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                        <MdLocalShipping className="text-lg"/> Logística y Envíos
                    </button>
                    <button onClick={() => setTabActiva('ACTIVOS')} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${tabActiva === 'ACTIVOS' ? 'border-orange-600 text-orange-700 bg-orange-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                        <MdComputer className="text-lg"/> Activos Fijos
                    </button>
                </div>
                
                {/* ÁREA DE CONTENIDO DINÁMICO */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                    
                    {/* TAB: CATÁLOGO Y DESPACHOS */}
                    {tabActiva === 'CATALOGO' && (
                        movimientosEnriquecidos.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">Aún no hay movimientos registrados en tu jurisdicción.</div>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                {movimientosEnriquecidos.map(mov => (
                                    <div key={mov.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {mov.tipo === 'ENTRADA' ? <MdArrowDownward className="text-xl"/> : <MdArrowUpward className="text-xl"/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800">{mov.producto?.nombre || 'Producto Eliminado'}</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">{mov.producto?.marca || 'N/A'} • {mov.producto?.almacen || 'N/A'}</p>
                                                <p className="text-[9px] font-black text-blue-600 mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">RESPONSABLE: {mov.usuario || 'Sistema'}</p>
                                            </div>
                                        </div>
                                        <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                                            <p className={`text-lg font-black ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                                {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad} unidades
                                            </p>
                                            <p className="text-[11px] font-bold text-gray-500 mt-1 max-w-[250px] truncate">{mov.motivo}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest">{new Date(mov.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* TAB: COMPRAS */}
                    {tabActiva === 'COMPRAS' && (
                        comprasFiltradas.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">No hay registro de facturas ingresadas.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                {comprasFiltradas.map(compra => (
                                    <div key={compra.id} className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="bg-purple-100 text-purple-700 text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest">Ingreso de Mercancía</span>
                                                <h4 className="text-sm font-black text-gray-900 mt-2">{compra.proveedor}</h4>
                                            </div>
                                            <span className="text-2xl font-black text-gray-300"><MdShoppingCart/></span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                                <span>Total Artículos:</span>
                                                <span className="text-black font-black">{compra.total_articulos} piezas</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mt-2">
                                                <span>Responsable:</span>
                                                <span>{getNombreColab(compra.usuario_registro_id)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <span>Folio: #{compra.id}</span>
                                            <span>{new Date(compra.fecha_compra).toLocaleDateString('es-MX')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* TAB: LOGÍSTICA (SOLICITUDES) */}
                    {tabActiva === 'LOGISTICA' && (
                        solicitudesFiltradas.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">No hay registro de envíos ni entregas.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                {solicitudesFiltradas.map(sol => (
                                    <div key={sol.id} className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest ${sol.estado === 'ENTREGADO' ? 'bg-green-100 text-green-700' : sol.estado === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {sol.estado.replace('_', ' ')}
                                                </span>
                                                <h4 className="text-sm font-black text-gray-900 mt-2">Destino: {sol.destino}</h4>
                                            </div>
                                            <span className="text-2xl font-black text-gray-300"><MdLocalShipping/></span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-500 mb-2 truncate">Motivo: {sol.motivo}</p>
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase border-t border-gray-200 pt-2">
                                                <span>Solicitante:</span>
                                                <span className="text-blue-600 font-black">{getNombreColab(sol.usuario_solicitante_id)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <span>Req: #{sol.id.substring(0,6)}</span>
                                            <span>{new Date(sol.fecha_solicitud).toLocaleDateString('es-MX')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* TAB: ACTIVOS FIJOS */}
                    {tabActiva === 'ACTIVOS' && (
                        activosFiltrados.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">No hay registro de activos fijos asignados.</div>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                {activosFiltrados.map(act => (
                                    <div key={act.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                                                <MdComputer className="text-xl"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800">{act.nombre}</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">{act.categoria.replace('_', ' ')} • {act.marca || 'S/M'}</p>
                                                <p className="text-[10px] font-black text-gray-700 mt-1 font-mono">S/N: {act.numero_serie || 'NO REGISTRADO'}</p>
                                            </div>
                                        </div>
                                        <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${act.estado === 'ACTIVO' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                {act.estado.replace('_', ' ')}
                                            </span>
                                            <p className="text-[11px] font-bold text-gray-500 mt-2 uppercase">Resp: <span className="text-orange-600 font-black">{getNombreColab(act.responsable_id) || 'En Almacén'}</span></p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest">Ub: {act.region}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                </div>
            </div>
        </div>
    );
}