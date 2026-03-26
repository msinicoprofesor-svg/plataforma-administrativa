/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/ListaReportes.tsx           */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdViewModule, MdViewList, MdFilterList, 
    MdSchedule, MdAssignment, MdLocationOn, MdCheckCircle, 
    MdFiberManualRecord, MdArrowForward, MdDelete, MdLabelOutline,
    MdDateRange // <- NUEVO ÍCONO
} from "react-icons/md";

import { useTickets } from '../../../hooks/useTickets';

// IMPORTACIÓN DE LOS MODALES
import ModalDetallesTicket from './ModalDetallesTicket';
import ModalEscalarVisita from './ModalEscalarVisita';
import ModalResolverTicket from './ModalResolverTicket';

export default function ListaReportes() {
    // ESTADOS UI DE FILTROS
    const [formatoVista, setFormatoVista] = useState('TARJETAS'); 
    const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS'); 
    const [filtroEstado, setFiltroEstado] = useState('TODOS'); 
    
    // NUEVOS ESTADOS DE FECHA
    const [filtroPeriodo, setFiltroPeriodo] = useState('TODOS'); // 'TODOS', 'HOY', 'MES', 'PERSONALIZADO'
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    
    // ESTADOS MODALES
    const [modalAbierto, setModalAbierto] = useState(false);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
    
    const [modalEscalar, setModalEscalar] = useState({ isOpen: false, ticket: null });
    const [modalResolver, setModalResolver] = useState({ isOpen: false, ticket: null, estadoDestino: '' });

    const { 
        tickets, loading, cambiarEstadoTicket, enviarAPapelera, 
        escalarAVisita, resolverTicket 
    } = useTickets();

    // LÓGICA DE FILTRADO (FECHAS + AGRUPACIÓN INTELIGENTE)
    const reportesFiltrados = tickets.filter(r => {
        if (r.estado === 'PAPELERA') return false; 
        
        // 1. EVALUAR FECHAS
        let pasaFecha = true;
        if (filtroPeriodo !== 'TODOS') {
            const fechaObj = new Date(r.created_at || r.fecha);
            const hoy = new Date();
            
            if (filtroPeriodo === 'HOY') {
                pasaFecha = fechaObj.toDateString() === hoy.toDateString();
            } else if (filtroPeriodo === 'MES') {
                pasaFecha = fechaObj.getMonth() === hoy.getMonth() && fechaObj.getFullYear() === hoy.getFullYear();
            } else if (filtroPeriodo === 'PERSONALIZADO') {
                if (fechaInicio && fechaFin) {
                    const start = new Date(fechaInicio + 'T00:00:00');
                    const end = new Date(fechaFin + 'T23:59:59');
                    pasaFecha = fechaObj >= start && fechaObj <= end;
                }
            }
        }

        // 2. EVALUAR PRIORIDAD
        const pasaPrioridad = filtroPrioridad === 'TODAS' || r.prioridad === filtroPrioridad;
        
        // 3. EVALUAR ESTADO
        let pasaEstado = false;
        if (filtroEstado === 'TODOS') {
            pasaEstado = true;
        } else if (filtroEstado === 'RESUELTO') {
            pasaEstado = r.estado === 'RESUELTO' || r.estado === 'SOLUCIONADO';
        } else if (filtroEstado === 'EN_RUTA') {
            pasaEstado = r.estado === 'EN_RUTA' || r.estado === 'EN_PROCESO';
        } else {
            pasaEstado = r.estado === filtroEstado;
        }

        return pasaFecha && pasaPrioridad && pasaEstado;
    });

    const getColoresPrioridad = (prioridad) => {
        switch(prioridad) {
            case 'Crítica': return 'bg-red-50 text-red-600 border-red-200';
            case 'Alta': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'Media': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Baja': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const abrirDetalles = (ticket) => {
        setTicketSeleccionado(ticket);
        setModalAbierto(true);
    };

    const handleCambioEstado = (reporte, nuevoEstado) => {
        if (nuevoEstado === 'PASAR_A_VISITA') {
            setModalEscalar({ isOpen: true, ticket: reporte });
        } else if (nuevoEstado === 'RESUELTO' || nuevoEstado === 'SOLUCIONADO') {
            setModalResolver({ isOpen: true, ticket: reporte, estadoDestino: nuevoEstado });
        } else {
            cambiarEstadoTicket(reporte.id, nuevoEstado);
        }
    };

    const SelectorEstado = ({ reporte }) => {
        const esCerrado = reporte.estado === 'RESUELTO' || reporte.estado === 'SOLUCIONADO';
        
        return (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-sm transition-colors ${esCerrado ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <MdFiberManualRecord className={`text-[8px] ${esCerrado ? 'text-green-500' : 'text-orange-500'}`}/>
                <select 
                    value={reporte.estado}
                    onChange={(e) => handleCambioEstado(reporte, e.target.value)}
                    className={`text-[10px] font-black uppercase tracking-widest outline-none bg-transparent cursor-pointer appearance-none pr-2 ${esCerrado ? 'text-green-700' : 'text-orange-700'}`}
                >
                    {reporte.visita ? (
                        <>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="ASIGNADO">Asignado a técnico</option>
                            <option value="EN_RUTA">En ruta</option>
                            <option value="EN_DOMICILIO">En domicilio</option>
                            <option value="RESUELTO">Resuelto</option>
                            <option value="POSPUESTO">Pospuesto</option>
                            <option value="CANCELADO">Cancelado por cliente</option>
                        </>
                    ) : (
                        <>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="EN_PROCESO">En proceso</option>
                            <option value="SOLUCIONADO">Solucionado</option>
                            <option value="PASAR_A_VISITA">Pasar a visita</option>
                        </>
                    )}
                </select>
            </div>
        );
    };

    return (
        <div className="max-w-[95rem] mx-auto space-y-6 animate-fade-in pb-10 h-full flex flex-col relative">
            
            {/* BARRA SUPERIOR DE HERRAMIENTAS Y FILTROS */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 shrink-0">
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    
                    {/* 1. FILTRO DE FECHAS */}
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-2xl border border-gray-200/50 shadow-inner">
                        <MdDateRange className="text-gray-400 text-lg"/>
                        <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer p-1">
                            <option value="TODOS">Cualquier fecha</option>
                            <option value="HOY">Día actual (Hoy)</option>
                            <option value="MES">Este mes</option>
                            <option value="PERSONALIZADO">Periodo personalizado</option>
                        </select>
                    </div>

                    {/* INPUTS DE RANGO PERSONALIZADO */}
                    {filtroPeriodo === 'PERSONALIZADO' && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
                            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="text-xs font-bold text-gray-600 outline-none cursor-pointer bg-transparent" />
                            <span className="text-gray-300 font-bold">-</span>
                            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="text-xs font-bold text-gray-600 outline-none cursor-pointer bg-transparent" />
                        </div>
                    )}

                    {/* BOTÓN RÁPIDO: IR A HOY */}
                    <button 
                        onClick={() => setFiltroPeriodo('HOY')} 
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${filtroPeriodo === 'HOY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        Ir a Hoy
                    </button>

                    <div className="w-px h-6 bg-gray-200 hidden md:block mx-1"></div>

                    {/* 2. FILTRO DE PRIORIDAD */}
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-2xl border border-gray-200/50 shadow-inner">
                        <MdFilterList className="text-gray-400 text-lg"/>
                        <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer p-1">
                            <option value="TODAS">Todas las Prioridades</option>
                            <option value="Crítica">Crítica</option>
                            <option value="Alta">Alta</option>
                            <option value="Media">Media</option>
                            <option value="Baja">Baja</option>
                        </select>
                    </div>

                    {/* 3. FILTRO DE ESTADO */}
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-2xl border border-gray-200/50 shadow-inner">
                        <MdLabelOutline className="text-gray-400 text-lg"/>
                        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer p-1">
                            <option value="TODOS">Todos los Estados</option>
                            <option value="PENDIENTE">Pendientes</option>
                            <option value="EN_RUTA">En Ruta / Proceso</option>
                            <option value="RESUELTO">Resueltos / Solucionados</option>
                        </select>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-full xl:w-auto justify-center shadow-inner">
                    <button onClick={() => setFormatoVista('TARJETAS')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${formatoVista === 'TARJETAS' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdViewModule className="text-lg" /> Tarjetas
                    </button>
                    <button onClick={() => setFormatoVista('LISTA')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${formatoVista === 'LISTA' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdViewList className="text-lg" /> Lista
                    </button>
                </div>
            </div>

            {/* ZONA DE RESULTADOS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative px-1">
                
                {loading && (
                    <div className="absolute inset-0 bg-[#F5F7FA]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-3xl">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                )}

                {formatoVista === 'TARJETAS' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {reportesFiltrados.map(reporte => (
                            <div key={reporte.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 transition-all hover:border-blue-200 hover:-translate-y-1 relative group flex flex-col overflow-hidden">
                                <div className={`absolute top-0 left-0 h-1.5 w-full ${getColoresPrioridad(reporte.prioridad).split(' ')[0]}`}/>

                                <div className="flex justify-between items-center mb-5">
                                    <span className="text-[10px] font-black text-gray-400 tracking-widest bg-gray-50 px-2 py-1 rounded border border-gray-100">{reporte.folio_corto}</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getColoresPrioridad(reporte.prioridad)}`}>
                                        {reporte.prioridad}
                                    </span>
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="text-base font-black text-gray-900 leading-tight mb-2">{reporte.tipo}</h3>
                                    <div className="space-y-1.5 text-xs font-bold text-gray-600">
                                        <p className="flex items-center gap-2"><MdAssignment className="text-blue-400"/> {reporte.cliente}</p>
                                        <p className="flex items-center gap-2"><MdLocationOn className="text-green-400"/> {reporte.zona}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-5">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                                            <MdSchedule/> {new Date(reporte.created_at || reporte.fecha).toLocaleDateString('es-MX')}
                                        </span>
                                        {reporte.visita && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
                                                <MdLocationOn/> Visita Req.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-5 mt-5 border-t border-gray-100 flex justify-between items-center">
                                    <SelectorEstado reporte={reporte} />
                                    
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { if(window.confirm('¿Seguro que deseas enviar este reporte a la papelera?')) enviarAPapelera(reporte.id); }} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Enviar a papelera">
                                            <MdDelete className="text-base" />
                                        </button>
                                        <button onClick={() => abrirDetalles(reporte)} className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50">
                                            Detalles <MdArrowForward/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio / Fecha</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prioridad</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reportesFiltrados.map(reporte => (
                                    <tr key={reporte.id} className="hover:bg-blue-50/20 transition-colors group">
                                        <td className="py-4 px-6">
                                            <p className="text-xs font-bold text-gray-800">{reporte.folio_corto}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(reporte.created_at || reporte.fecha).toLocaleDateString('es-MX')}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-xs font-bold text-gray-700">{reporte.cliente}</p>
                                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><MdLocationOn/> {reporte.zona}</p>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getColoresPrioridad(reporte.prioridad)}`}>
                                                {reporte.prioridad}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <SelectorEstado reporte={reporte} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { if(window.confirm('¿Seguro que deseas enviar este reporte a la papelera?')) enviarAPapelera(reporte.id); }} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Enviar a papelera">
                                                    <MdDelete className="text-base" />
                                                </button>
                                                <button onClick={() => abrirDetalles(reporte)} className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                                                    Ver Detalles
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && reportesFiltrados.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
                        <MdCheckCircle className="text-5xl mb-3 opacity-20 text-green-500"/>
                        <p className="text-sm font-bold">No hay reportes que coincidan con los filtros</p>
                    </div>
                )}
            </div>

            <ModalDetallesTicket isOpen={modalAbierto} onClose={() => setModalAbierto(false)} ticket={ticketSeleccionado} />
            
            <ModalEscalarVisita isOpen={modalEscalar.isOpen} onClose={() => setModalEscalar({ isOpen: false, ticket: null })} ticket={modalEscalar.ticket} onConfirm={escalarAVisita} />

            <ModalResolverTicket 
                isOpen={modalResolver.isOpen} 
                onClose={() => setModalResolver({ isOpen: false, ticket: null, estadoDestino: '' })} 
                ticket={modalResolver.ticket} 
                onConfirm={(ticketId, notas) => resolverTicket(ticketId, notas, modalResolver.estadoDestino)} 
            />
        </div>
    );
}