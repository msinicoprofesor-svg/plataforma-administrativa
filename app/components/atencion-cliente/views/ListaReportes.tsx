/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/ListaReportes.tsx           */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdViewModule, MdViewList, MdFilterList, MdWarning, 
    MdSchedule, MdAssignment, MdLocationOn, MdCheckCircle 
} from "react-icons/md";

// MOCK DE DATOS (Simulación de reportes vivos)
const REPORTES_MOCK = [
    { id: 'TKT-1001', cliente: 'Roberto Gómez Bolaños', tipo: 'Falla de internet', prioridad: 'Crítica', estado: 'Pendiente', fecha: 'Hoy, 10:30 AM', visita: true },
    { id: 'TKT-1002', cliente: 'Florinda Meza', tipo: 'Cambio de domicilio', prioridad: 'Media', estado: 'En Ruta', fecha: 'Hoy, 09:15 AM', visita: true },
    { id: 'TKT-1003', cliente: 'Carlos Villagrán', tipo: 'Lentitud', prioridad: 'Baja', estado: 'Resuelto', fecha: 'Ayer, 16:45 PM', visita: false },
    { id: 'TKT-1004', cliente: 'María Antonieta de las Nieves', tipo: 'Corte de servicio', prioridad: 'Alta', estado: 'Pendiente', fecha: 'Hoy, 11:00 AM', visita: true },
];

export default function ListaReportes() {
    const [formatoVista, setFormatoVista] = useState('TARJETAS'); // TARJETAS o LISTA
    const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS'); // TODAS, Baja, Media, Alta, Crítica

    const reportesFiltrados = REPORTES_MOCK.filter(r => 
        filtroPrioridad === 'TODAS' || r.prioridad === filtroPrioridad
    );

    const getColoresPrioridad = (prioridad) => {
        switch(prioridad) {
            case 'Crítica': return 'bg-red-50 text-red-600 border-red-200 shadow-red-500/10';
            case 'Alta': return 'bg-orange-50 text-orange-600 border-orange-200 shadow-orange-500/10';
            case 'Media': return 'bg-blue-50 text-blue-600 border-blue-200 shadow-blue-500/10';
            case 'Baja': return 'bg-gray-50 text-gray-600 border-gray-200 shadow-gray-500/10';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10 h-full flex flex-col">
            
            {/* BARRA DE HERRAMIENTAS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 shrink-0">
                
                {/* FILTRO PRIORIDAD */}
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 w-full md:w-auto">
                    <MdFilterList className="text-gray-400"/>
                    <select 
                        value={filtroPrioridad}
                        onChange={(e) => setFiltroPrioridad(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer w-full"
                    >
                        <option value="TODAS">Todas las Prioridades</option>
                        <option value="Crítica">Urgencia: Crítica</option>
                        <option value="Alta">Urgencia: Alta</option>
                        <option value="Media">Urgencia: Media</option>
                        <option value="Baja">Urgencia: Baja</option>
                    </select>
                </div>

                {/* SWITCH DE VISTA */}
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full md:w-auto justify-center">
                    <button 
                        onClick={() => setFormatoVista('TARJETAS')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${formatoVista === 'TARJETAS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <MdViewModule className="text-base" /> Tarjetas
                    </button>
                    <button 
                        onClick={() => setFormatoVista('LISTA')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${formatoVista === 'LISTA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <MdViewList className="text-base" /> Lista
                    </button>
                </div>
            </div>

            {/* CONTENEDOR DE REPORTES */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {formatoVista === 'TARJETAS' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reportesFiltrados.map(reporte => (
                            <div key={reporte.id} className={`p-5 rounded-3xl border shadow-md transition-transform hover:-translate-y-1 bg-white relative overflow-hidden group`}>
                                {/* Etiqueta Prioridad superior */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${getColoresPrioridad(reporte.prioridad).split(' ')[0]}`}></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-gray-400 tracking-widest">{reporte.id}</span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getColoresPrioridad(reporte.prioridad)}`}>
                                        {reporte.prioridad}
                                    </span>
                                </div>
                                
                                <h3 className="text-sm font-black text-gray-800 mb-1">{reporte.tipo}</h3>
                                <p className="text-xs font-bold text-gray-500 mb-4 flex items-center gap-1"><MdAssignment className="text-gray-400"/> {reporte.cliente}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-5">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                        <MdSchedule/> {reporte.fecha}
                                    </span>
                                    {reporte.visita && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                            <MdLocationOn/> Visita Req.
                                        </span>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${reporte.estado === 'Resuelto' ? 'text-green-500' : 'text-orange-500'}`}>
                                        • {reporte.estado}
                                    </span>
                                    <button className="text-[10px] font-bold text-blue-600 hover:underline">Ver detalles</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio / Fecha</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Problema</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prioridad</th>
                                    <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reportesFiltrados.map(reporte => (
                                    <tr key={reporte.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <p className="text-xs font-bold text-gray-800">{reporte.id}</p>
                                            <p className="text-[10px] text-gray-400">{reporte.fecha}</p>
                                        </td>
                                        <td className="py-3 px-4 text-xs font-bold text-gray-600">{reporte.cliente}</td>
                                        <td className="py-3 px-4 text-xs font-bold text-gray-800">{reporte.tipo}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${getColoresPrioridad(reporte.prioridad)}`}>
                                                {reporte.prioridad}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`text-[10px] font-black uppercase ${reporte.estado === 'Resuelto' ? 'text-green-500' : 'text-orange-500'}`}>
                                                {reporte.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {reportesFiltrados.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <MdCheckCircle className="text-4xl mb-2 opacity-20 text-green-500"/>
                        <p className="text-xs font-bold">No hay reportes activos con esta prioridad</p>
                    </div>
                )}
            </div>
        </div>
    );
}