/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/ModalHistorialGlobal.tsx       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { MdClose, MdHistory, MdArrowUpward, MdArrowDownward, MdShoppingCart, MdLocalShipping, MdComputer, MdStore, MdDateRange, MdReceipt, MdImage } from "react-icons/md";

export default function ModalHistorialGlobal({ isOpen, onClose, useData, usuarioActivo, colaboradores = [], contextoInicial = 'CATALOGO' }) {
    const { inventario, movimientos, compras, solicitudes, activos } = useData;
    const [tabActiva, setTabActiva] = useState(contextoInicial);
    
    // --- NUEVO: ESTADO PARA FILTRO DE FECHAS ---
    const [filtroFecha, setFiltroFecha] = useState('TODO'); // 'HOY', '7_DIAS', '30_DIAS', 'TODO'
    
    // ESTADO PARA SUB-MODAL DE DETALLES DE COMPRA
    const [compraViendoDetalle, setCompraViendoDetalle] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setTabActiva(contextoInicial);
            setFiltroFecha('TODO');
        }
    }, [isOpen, contextoInicial]);

    if (!isOpen) return null;

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

    // --- FUNCIÓN DE FILTRADO POR FECHA ---
    const cumpleFiltroFecha = (fechaISO) => {
        if (filtroFecha === 'TODO' || !fechaISO) return true;
        const fechaObj = new Date(fechaISO);
        const hoy = new Date();
        const diffDias = (hoy - fechaObj) / (1000 * 60 * 60 * 24);

        if (filtroFecha === 'HOY') return fechaObj.toDateString() === hoy.toDateString();
        if (filtroFecha === '7_DIAS') return diffDias <= 7;
        if (filtroFecha === '30_DIAS') return diffDias <= 30;
        return true;
    };

    // --- APLICANDO FILTROS A LA DATA ---
    const movimientosEnriquecidos = movimientos.map(m => {
        const prod = inventario.find(i => i.id === m.producto_id);
        return { ...m, producto: prod };
    }).filter(m => {
        if (!cumpleFiltroFecha(m.fecha || m.created_at)) return false;
        if (!m.producto) return false; 
        if (esAdminGeneral) return true; 
        return m.producto.region === miRegion || m.producto.almacen === miRegion.toUpperCase() || m.producto.marca === miMarca || m.producto.almacen === miMarca.toUpperCase();
    });

    const comprasFiltradas = compras.filter(c => {
        if (!cumpleFiltroFecha(c.fecha_compra || c.created_at)) return false;
        if (esAdminGeneral) return true;
        return c.usuario_registro_id === usuarioActivo?.id;
    });

    const solicitudesFiltradas = solicitudes.filter(s => {
        if (!cumpleFiltroFecha(s.fecha_solicitud || s.created_at)) return false;
        if (esAdminGeneral) return true;
        return s.destino.includes(miRegion) || s.usuario_solicitante_id === usuarioActivo?.id;
    });

    const activosFiltrados = activos.filter(a => {
        if (!cumpleFiltroFecha(a.fecha_asignacion || a.created_at)) return false;
        if (esAdminGeneral) return true;
        return a.region === miRegion || a.marca === miMarca;
    });

    return (
        <div className="fixed inset-0 bg-black/70 z-[400] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-50 rounded-[2rem] w-full max-w-6xl h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in relative">
                
                <div className="bg-gray-900 text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-2"><MdHistory className="text-blue-400"/> Auditoría y Trazabilidad Global</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registro inmutable de movimientos del ERP</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-gray-800 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"><MdClose className="text-2xl"/></button>
                </div>

                <div className="flex bg-white border-b border-gray-200 shrink-0 overflow-x-auto custom-scrollbar hide-scroll">
                    <button onClick={() => setTabActiva('CATALOGO')} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${tabActiva === 'CATALOGO' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><MdStore className="text-lg"/> Catálogo y Despachos</button>
                    <button onClick={() => setTabActiva('COMPRAS')} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${tabActiva === 'COMPRAS' ? 'border-purple-600 text-purple-700 bg-purple-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><MdShoppingCart className="text-lg"/> Ingreso Compras</button>
                    <button onClick={() => setTabActiva('LOGISTICA')} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${tabActiva === 'LOGISTICA' ? 'border-green-600 text-green-700 bg-green-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><MdLocalShipping className="text-lg"/> Logística y Envíos</button>
                    <button onClick={() => setTabActiva('ACTIVOS')} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-4 transition-colors ${tabActiva === 'ACTIVOS' ? 'border-orange-600 text-orange-700 bg-orange-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}><MdComputer className="text-lg"/> Activos Fijos</button>
                </div>

                {/* BARRA DE FILTRO DE FECHAS (UI ELEGANTE) */}
                <div className="bg-white border-b border-gray-100 p-3 flex flex-wrap items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 ml-2"><MdDateRange className="text-lg"/> Periodo:</span>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setFiltroFecha('HOY')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${filtroFecha === 'HOY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hoy</button>
                        <button onClick={() => setFiltroFecha('7_DIAS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${filtroFecha === '7_DIAS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Últimos 7 Días</button>
                        <button onClick={() => setFiltroFecha('30_DIAS')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${filtroFecha === '30_DIAS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Últimos 30 Días</button>
                        <button onClick={() => setFiltroFecha('TODO')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${filtroFecha === 'TODO' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Historial Completo</button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                    
                    {tabActiva === 'CATALOGO' && (
                        movimientosEnriquecidos.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">No hay movimientos en este periodo.</div>
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
                                            <p className="text-[11px] font-bold text-gray-500 mt-1 max-w-[250px] truncate" title={mov.motivo}>{mov.motivo}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest">{new Date(mov.fecha || mov.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {tabActiva === 'COMPRAS' && (
                        comprasFiltradas.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">No hay registro de compras en este periodo.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                                {comprasFiltradas.map(compra => (
                                    <div key={compra.id} className="bg-white p-5 rounded-3xl border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                                        
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900">{compra.proveedor}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date(compra.fecha_compra || compra.created_at).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                            </div>
                                            <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                                <MdShoppingCart className="text-xl"/>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-1 mb-4">
                                            <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase mb-2 border-b border-gray-200 pb-2">
                                                <span>Artículos ({compra.total_articulos})</span>
                                                <span>Cant.</span>
                                            </div>
                                            <ul className="space-y-2">
                                                {compra.detalles && compra.detalles.length > 0 ? (
                                                    compra.detalles.slice(0, 3).map((d, i) => (
                                                        <li key={i} className="flex justify-between text-xs font-bold text-gray-700">
                                                            <span className="truncate pr-2">{d.nombre} <span className="text-[9px] text-gray-400 font-medium">({d.marca})</span></span>
                                                            <span className="shrink-0 bg-white border border-gray-200 px-1.5 py-0.5 rounded">{d.cantidad}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-xs text-gray-400 italic">Detalles no registrados (Compra antigua).</li>
                                                )}
                                                {compra.detalles && compra.detalles.length > 3 && (
                                                    <li className="text-[10px] font-bold text-blue-500 italic mt-1">+ {compra.detalles.length - 3} artículos más...</li>
                                                )}
                                            </ul>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">Por: {getNombreColab(compra.usuario_registro_id).split(' ')[0]}</span>
                                            <button onClick={() => setCompraViendoDetalle(compra)} className="px-4 py-2 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-1 shadow-sm">
                                                <MdReceipt className="text-sm"/> Ver Detalles
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {tabActiva === 'LOGISTICA' && (
                        solicitudesFiltradas.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">No hay registro de envíos en este periodo.</div>
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
                                            <span>{new Date(sol.fecha_solicitud || sol.created_at).toLocaleDateString('es-MX')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {tabActiva === 'ACTIVOS' && (
                        activosFiltrados.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">No hay registro de activos fijos en este periodo.</div>
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

                {/* SUB-MODAL DE DETALLE DE COMPRA Y FACTURA */}
                {compraViendoDetalle && (
                    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                                <div>
                                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdReceipt className="text-purple-600"/> Detalle de Factura: {compraViendoDetalle.proveedor}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Folio Interno: {compraViendoDetalle.id}</p>
                                </div>
                                <button onClick={() => setCompraViendoDetalle(null)} className="w-8 h-8 bg-white hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-colors shadow-sm"><MdClose className="text-xl"/></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Artículos Ingresados</h4>
                                    {compraViendoDetalle.detalles && compraViendoDetalle.detalles.length > 0 ? (
                                        <div className="space-y-2">
                                            {compraViendoDetalle.detalles.map((d, i) => (
                                                <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs font-black text-gray-800">{d.nombre}</p>
                                                        <p className="text-[9px] font-bold text-gray-500 uppercase">{d.marca} • Destino: {d.region}</p>
                                                    </div>
                                                    <span className="bg-purple-100 text-purple-700 text-xs font-black px-2 py-1 rounded">{d.cantidad}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-gray-400">Detalle de artículos no disponible.</p>
                                    )}
                                </div>

                                <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6 flex flex-col">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Comprobante (Factura / Ticket)</h4>
                                    <div className="flex-1 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group min-h-[250px]">
                                        {compraViendoDetalle.factura_url ? (
                                            compraViendoDetalle.factura_url.startsWith('data:image') || compraViendoDetalle.factura_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                                                <img src={compraViendoDetalle.factura_url} className="max-w-full max-h-full object-contain" alt="Factura" />
                                            ) : (
                                                <iframe src={compraViendoDetalle.factura_url} className="w-full h-full border-0" title="PDF Factura"></iframe>
                                            )
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <MdImage className="text-5xl mx-auto mb-2 opacity-50"/>
                                                <p className="text-xs font-bold uppercase">Sin comprobante adjunto</p>
                                            </div>
                                        )}
                                        {compraViendoDetalle.factura_url && (
                                            <a href={compraViendoDetalle.factura_url} download={`Factura_${compraViendoDetalle.proveedor}.pdf`} className="absolute bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">Descargar</a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}