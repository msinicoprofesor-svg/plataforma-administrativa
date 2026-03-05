/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/ModalDetallesTicket.tsx    */
/* -------------------------------------------------------------------------- */
'use client';
import { 
    MdClose, MdAssignment, MdPerson, MdLocationOn, 
    MdSchedule, MdFiberManualRecord, MdDomain 
} from "react-icons/md";

export default function ModalDetallesTicket({ isOpen, onClose, ticket }) {
    if (!isOpen || !ticket) return null;

    const getColoresPrioridad = (prioridad) => {
        switch(prioridad) {
            case 'Crítica': return 'bg-red-100 text-red-700 border-red-200';
            case 'Alta': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Media': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Baja': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col animate-slide-up overflow-hidden border border-gray-100">
                
                {/* HEADER MODAL */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                {ticket.folio_corto}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getColoresPrioridad(ticket.prioridad)}`}>
                                Urgencia: {ticket.prioridad}
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mt-2 flex items-center gap-2">
                             <MdAssignment className="text-blue-500"/> {ticket.tipo}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-2.5 rounded-full">
                        <MdClose className="text-xl"/>
                    </button>
                </div>

                {/* BODY MODAL SCROLLABLE (2 Columnas) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-gray-50/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* COLUMNA 1: CLIENTE Y UBICACIÓN */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MdPerson className="text-blue-500 text-base"/> Datos del Cliente
                            </h4>
                            <p className="text-lg font-black text-gray-800">{ticket.cliente}</p>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mt-1.5">
                                <MdDomain className="text-blue-400"/> {ticket.marca || 'JAVAK'}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MdLocationOn className="text-green-500 text-base"/> Ubicación de Instalación
                            </h4>
                            <div className="flex items-start gap-2">
                                <MdLocationOn className="text-gray-400 text-lg mt-0.5 shrink-0"/>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{ticket.zona}</p>
                                    <p className="text-xs text-gray-500 mt-1">Aquí irá la dirección completa de la base de datos (Calle, Número, Comunidad, etc.).</p>
                                </div>
                            </div>
                            {/* TODO: Agregar botón para abrir coordenadas en Google Maps si existen */}
                        </div>
                    </div>

                    {/* COLUMNA 2: DETALLES DEL REPORTE Y LOGÍSTICA */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MdSchedule className="text-orange-500 text-base"/> Logística y Horarios
                            </h4>
                            <div className="space-y-3 text-sm">
                                <p className="font-medium text-gray-600">Fecha de reporte: <span className="font-bold text-gray-800">{ticket.fecha}</span></p>
                                <p className="font-medium text-gray-600">Visita requerida: 
                                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase ${ticket.visita ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {ticket.visita ? 'SÍ (Agendar Técnico)' : 'NO (Soporte Remoto)'}
                                    </span>
                                </p>
                                <p className="font-medium text-gray-600">Horario de preferencia: <span className="font-bold text-gray-800">{ticket.horario_preferencia || 'Lo antes posible'}</span></p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MdAssignment className="text-blue-500 text-base"/> Descripción del Problema
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px]">
                                <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {ticket.descripcion || 'Sin descripción técnica disponible.'}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* FOOTER MODAL */}
                <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex justify-between items-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                        ticket.estado === 'RESUELTO' ? 'bg-green-50 text-green-700 border-green-100' :
                        ticket.estado === 'EN_RUTA' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-orange-50 text-orange-700 border-orange-100'
                    }`}>
                        <MdFiberManualRecord className={`text-[10px] ${ticket.estado === 'RESUELTO' ? 'text-green-500' : 'text-orange-500'}`}/>
                        Estado: {ticket.estado.replace('_', ' ')}
                    </div>
                    <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                        Cerrar Detalles
                    </button>
                </div>

            </div>
        </div>
    );
}