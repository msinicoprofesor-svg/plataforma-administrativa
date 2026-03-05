/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/ListaReportes.tsx           */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdViewModule, MdViewList, MdFilterList, 
    MdSchedule, MdAssignment, MdLocationOn, MdCheckCircle, MdFiberManualRecord, MdArrowForward
} from "react-icons/md";

// Importamos el hook real
import { useTickets } from '../../../hooks/useTickets';

// IMPORTAMOS EL NUEVO COMPONENTE MODAL (Regla #4)
import ModalDetallesTicket from './ModalDetallesTicket';

export default function ListaReportes() {
    // ESTADOS UI
    const [formatoVista, setFormatoVista] = useState('TARJETAS'); 
    const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS'); 
    
    // ESTADOS PARA EL MODAL DE DETALLES
    const [modalAbierto, setModalAbierto] = useState(false);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

    // Extraemos los datos reales del hook
    const { tickets, loading } = useTickets();

    // Filtramos los datos reales
    const reportesFiltrados = tickets.filter(r => 
        filtroPrioridad === 'TODAS' || r.prioridad === filtroPrioridad
    );

    const getColoresPrioridad = (prioridad) => {
        switch(prioridad) {
            case 'Crítica': return 'bg-red-50 text-red-600 border-red-200';
            case 'Alta': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'Media': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Baja': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    // Función para abrir detalles (CORRECCIÓN FUNCIONAL)
    const abrirDetalles = (ticket) => {
        setTicketSeleccionado(ticket);
        setModalAbierto(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10 h-full flex flex-col relative">
            
            {/* BARRA DE HERRAMIENTAS - DISEÑO CLEAN */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 shrink-0">
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-2xl border border-gray-200/50 w-full md:w-auto shadow-inner">
                    <MdFilterList className="text-gray-400 text-lg"/>
                    <select 
                        value={filtroPrioridad}
                        onChange={(e) => setFiltroPrioridad(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer w-full p-1"
                    >
                        <option value="TODAS">Todas las Prioridades</option>
                        <option value="Crítica">Urgencia: Crítica</option>
                        <option value="Alta">Urgencia: Alta</option>
                        <option value="Media">Urgencia: Media</option>
                        <option value="Baja">Urgencia: Baja</option>
                    </select>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-full md:w-auto justify-center shadow-inner">
                    <button onClick={() => setFormatoVista('TARJETAS')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${formatoVista === 'TARJETAS' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdViewModule className="text-lg" /> Tarjetas
                    </button>
                    <button onClick={() => setFormatoVista('LISTA')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${formatoVista === 'LISTA' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdViewList className="text-lg" /> Lista
                    </button>
                </div>
            </div>

            {/* CONTENEDOR DE REPORTES */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative px-1">
                
                {loading && (
                    <div className="absolute inset-0 bg-[#F5F7FA]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-3xl">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                )}

                {formatoVista === 'TARJETAS' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {reportesFiltrados.map(reporte => (
                            // NUEVO DISEÑO DE TARJETA ESTILO LIKE STORE
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
                                            <MdSchedule/> {reporte.fecha}
                                        </span>
                                        {reporte.visita && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
                                                <MdLocationOn/> Visita Req.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-5 mt-5 border-t border-gray-100 flex justify-between items-center">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${reporte.estado === 'RESUELTO' ? 'text-green-600' : 'text-orange-600'}`}>
                                        <MdFiberManualRecord className={`text-[8px] ${reporte.estado === 'RESUELTO' ? 'text-green-500' : 'text-orange-500'}`}/>
                                        {reporte.estado.replace('_', ' ')}
                                    </span>
                                    <button 
                                        onClick={() => abrirDetalles(reporte)} // Lógica funcional (Regla #3)
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                                    >
                                        Ver detalles <MdArrowForward/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio / Fecha</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Problema</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prioridad</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reportesFiltrados.map(reporte => (
                                    <tr key={reporte.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="py-4 px-6">
                                            <p className="text-xs font-bold text-gray-800">{reporte.folio_corto}</p>
                                            <p className="text-[10px] text-gray-400">{reporte.fecha}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-xs font-bold text-gray-700">{reporte.cliente}</p>
                                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><MdLocationOn/> {reporte.zona}</p>
                                        </td>
                                        <td className="py-4 px-6 text-xs font-bold text-gray-800">{reporte.tipo}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getColoresPrioridad(reporte.prioridad)}`}>
                                                {reporte.prioridad}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => abrirDetalles(reporte)}
                                                className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                                            >
                                                Ver Detalles
                                            </button>
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
                        <p className="text-sm font-bold">No hay reportes activos</p>
                    </div>
                )}
            </div>

            {/* COMPONENTE MODAL DE DETALLES */}
            <ModalDetallesTicket 
                isOpen={modalAbierto} 
                onClose={() => setModalAbierto(false)} 
                ticket={ticketSeleccionado} 
            />
        </div>
    );
}