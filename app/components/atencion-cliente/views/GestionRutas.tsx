/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/GestionRutas.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react'; 
import { 
    MdDragIndicator, MdPerson, MdLocationOn, 
    MdAutoAwesome, MdEngineering, MdAssignment, MdMap, MdCheckCircle, MdAccessTime
} from "react-icons/md";

// Hooks
import { useTickets } from '../../../hooks/useTickets';
import { useColaboradores } from '../../../hooks/useColaboradores';
// Modal
import ModalDetallesTicket from './ModalDetallesTicket';

export default function GestionRutas() {
    // 1. DATOS REALES (Directo de la fuente, sin trucos)
    const { tickets, moverTicket, loading: loadingTickets } = useTickets();
    const { colaboradoresReales, loading: loadingColabs } = useColaboradores();

    // Estados de UI
    const [isUpdating, setIsUpdating] = useState(false); // Bloqueo profesional mientras guarda
    const [modalAbierto, setModalAbierto] = useState(false);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

    const colabsSeguros = colaboradoresReales || [];
    const ticketsActivos = tickets.filter(t => t.estado !== 'RESUELTO' && t.estado !== 'CANCELADO');

    let tecnicos = colabsSeguros.filter(c => {
        const rol = c?.rol || '';
        const puesto = (c?.puesto || '').toLowerCase();
        return rol === 'TECNICO' || rol === 'INSTALADOR' || puesto.includes('técnico') || puesto.includes('instalador');
    });

    if (tecnicos.length === 0 && colabsSeguros.length > 0) {
        tecnicos = colabsSeguros.slice(0, 3);
    }

    // --- DRAG & DROP ESTRICTO ---
    const handleDragStart = (e, ticketId) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData('text/plain', String(ticketId)); 
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move"; };
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); };

    const handleDrop = async (e, columnaDestino) => {
        e.preventDefault();
        e.stopPropagation();
        const ticketId = e.dataTransfer.getData('text/plain'); 
        
        if (ticketId) {
            // Mostramos loader, esperamos respuesta real de DB, y quitamos loader
            setIsUpdating(true);
            await moverTicket(ticketId, columnaDestino);
            setIsUpdating(false);
        }
    };

    const abrirDetalles = (ticket) => {
        setTicketSeleccionado(ticket);
        setModalAbierto(true);
    };

    const asignarConIA = () => alert("Módulo IA en desarrollo para optimización de polígonos.");

    const getColoresPrioridad = (prioridad) => {
        switch(prioridad) {
            case 'Crítica': return 'bg-red-500 text-white shadow-red-500/30';
            case 'Alta': return 'bg-orange-500 text-white shadow-orange-500/30';
            case 'Media': return 'bg-blue-500 text-white shadow-blue-500/30';
            case 'Baja': return 'bg-gray-400 text-white shadow-gray-400/30';
            default: return 'bg-gray-400 text-white';
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10 relative">
            
            {/* PANTALLA DE CARGA GLOBAL Y ACTUALIZACIÓN */}
            {(loadingTickets || loadingColabs || isUpdating) && (
                <div className="absolute inset-0 bg-[#F5F7FA]/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-3xl">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-gray-700 mt-3 animate-pulse">
                        {isUpdating ? 'Guardando cambios en el servidor...' : 'Sincronizando rutas y técnicos...'}
                    </p>
                </div>
            )}

            {/* BARRA SUPERIOR */}
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100 shrink-0">
                <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                        <MdMap className="text-blue-500 text-xl"/> Panel de Asignación Operativa
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">Arrastra los tickets para asignarlos. Los cambios se guardan permanentemente.</p>
                </div>
                <button onClick={asignarConIA} className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-fuchsia-100 hover:from-purple-200 hover:to-fuchsia-200 text-purple-700 px-5 py-3 rounded-2xl text-xs font-black transition-all shadow-sm active:scale-95 border border-purple-200">
                    <MdAutoAwesome className="text-lg text-purple-600"/> Auto-Asignar
                </button>
            </div>

            {/* TABLERO KANBAN */}
            <div className="flex-1 flex gap-5 overflow-x-auto custom-scrollbar pb-4 px-1">
                
                {/* PENDIENTES */}
                <div 
                    className="w-80 min-w-[20rem] flex flex-col bg-gray-100/60 rounded-[2rem] border-2 border-dashed border-gray-200 p-5 transition-colors hover:bg-gray-100"
                    onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={(e) => handleDrop(e, 'pendientes')}
                >
                    <div className="flex items-center justify-between mb-5 px-2">
                        <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                            <MdAssignment className="text-gray-400"/> Sin Asignar
                        </h4>
                        <span className="bg-white text-gray-800 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm border border-gray-100">
                            {ticketsActivos.filter(t => !t.asignadoA || t.asignadoA === 'pendientes').length}
                        </span>
                    </div>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 pb-2">
                        {ticketsActivos.filter(t => !t.asignadoA || t.asignadoA === 'pendientes').map(ticket => (
                            <TicketCard key={ticket.id} ticket={ticket} onDragStart={handleDragStart} getColores={getColoresPrioridad} onVerDetalles={abrirDetalles} />
                        ))}
                    </div>
                </div>

                {/* RUTAS TÉCNICOS */}
                {tecnicos.map(tecnico => {
                    const nombreTecnico = tecnico?.nombre || 'Técnico';
                    const partesNombre = nombreTecnico.split(' ');

                    return (
                        <div 
                            key={tecnico.id}
                            className="w-80 min-w-[20rem] flex flex-col bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm transition-colors hover:border-blue-300"
                            onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={(e) => handleDrop(e, tecnico.id)}
                        >
                            <div className="flex items-start gap-4 mb-5 p-4 bg-blue-50/50 rounded-[1.5rem] border border-blue-100/50">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-100 overflow-hidden">
                                    {tecnico.foto ? <img src={tecnico.foto} alt="foto" className="w-full h-full object-cover" /> : <MdEngineering className="text-2xl"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-blue-950 leading-tight truncate">{partesNombre[0]} {partesNombre[1] || ''}</h4>
                                    <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider mt-1 truncate">{tecnico?.puesto || 'Técnico'}</p>
                                </div>
                                <span className="bg-white text-blue-800 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                                    {ticketsActivos.filter(t => t.asignadoA === tecnico.id).length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 pb-2 bg-gray-50/30 rounded-3xl p-3 border border-gray-50">
                                {ticketsActivos.filter(t => t.asignadoA === tecnico.id).map(ticket => (
                                    <TicketCard key={ticket.id} ticket={ticket} onDragStart={handleDragStart} getColores={getColoresPrioridad} onVerDetalles={abrirDetalles} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL CONECTADO */}
            <ModalDetallesTicket isOpen={modalAbierto} onClose={() => setModalAbierto(false)} ticket={ticketSeleccionado} />
        </div>
    );
}

// Subcomponente de Tarjeta Draggable
function TicketCard({ ticket, onDragStart, getColores, onVerDetalles }) {
    return (
        <div 
            draggable={true} 
            onDragStart={(e) => onDragStart(e, ticket.id)}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm shadow-gray-200/50 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all group relative select-none w-full max-w-full flex flex-col"
        >
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black text-gray-400 tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate">
                    {ticket?.folio_corto || 'TKT-000'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm shrink-0 ml-2 ${getColores(ticket?.prioridad)}`}>
                    {ticket?.prioridad || 'Baja'}
                </span>
            </div>
            
            <h5 className="text-xs font-black text-gray-800 mb-1.5 flex items-center gap-2 min-w-0">
                <MdPerson className="text-blue-500 shrink-0"/> 
                <span className="truncate">{ticket?.cliente || 'Sin Cliente'}</span>
            </h5>
            
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-50 min-w-0">
                <MdLocationOn className="text-green-500 text-sm shrink-0"/> 
                <span className="truncate">{ticket?.zona || 'Sin Zona'}</span>
            </div>

            {/* BOTONES Y HORA INFERIOR */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    <MdAccessTime className="text-[11px]"/> {ticket?.fecha || 'Sin fecha'}
                </span>
                <button 
                    onClick={() => onVerDetalles(ticket)}
                    className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors z-10"
                >
                    Ver detalles
                </button>
            </div>
            
            <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white rounded-full p-1 shadow-sm border border-gray-100">
                <MdDragIndicator className="text-gray-400 text-xl"/>
            </div>
        </div>
    );
}