/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/GestionRutas.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdDragIndicator, MdPerson, MdLocationOn, MdAccessTime, 
    MdAutoAwesome, MdEngineering, MdAssignment 
} from "react-icons/md";

// DATOS MOCK
const TICKETS_INICIALES = [
    { id: 'TKT-1001', cliente: 'Roberto Gómez', zona: 'Centro', prioridad: 'Crítica', estado: 'Pendiente', asignadoA: 'pendientes' },
    { id: 'TKT-1002', cliente: 'Florinda Meza', zona: 'San Diego', prioridad: 'Media', estado: 'Pendiente', asignadoA: 'pendientes' },
    { id: 'TKT-1004', cliente: 'María Antonieta', zona: 'Centro', prioridad: 'Alta', estado: 'Pendiente', asignadoA: 'pendientes' },
    { id: 'TKT-1005', cliente: 'Rubén Aguirre', zona: 'Michoacán', prioridad: 'Baja', estado: 'Pendiente', asignadoA: 'pendientes' },
];

const TECNICOS = [
    { id: 'tec_1', nombre: 'Juan Pérez', vehiculo: 'CrossFox 2008 (Centro)' },
    { id: 'tec_2', nombre: 'Carlos López', vehiculo: 'Avanza 2015 (San Diego)' },
];

export default function GestionRutas() {
    const [tickets, setTickets] = useState(TICKETS_INICIALES);

    // --- LÓGICA DRAG & DROP NATIVA ---
    const handleDragStart = (e, ticketId) => {
        e.dataTransfer.setData('ticketId', ticketId);
        // Efecto visual al arrastrar
        setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necesario para permitir el "Drop"
    };

    const handleDrop = (e, columnaDestino) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('ticketId');
        
        setTickets(prevTickets => 
            prevTickets.map(ticket => {
                if (ticket.id === ticketId) {
                    return { ...ticket, asignadoA: columnaDestino };
                }
                return ticket;
            })
        );
    };

    // Función de "Inteligencia Artificial" simulada
    const asignarConIA = () => {
        setTickets(prev => prev.map(t => {
            if (t.zona === 'Centro') return { ...t, asignadoA: 'tec_1' };
            if (t.zona === 'San Diego' || t.zona === 'Michoacán') return { ...t, asignadoA: 'tec_2' };
            return t;
        }));
    };

    const getColoresPrioridad = (prioridad) => {
        switch(prioridad) {
            case 'Crítica': return 'bg-red-500 text-white';
            case 'Alta': return 'bg-orange-500 text-white';
            case 'Media': return 'bg-blue-500 text-white';
            case 'Baja': return 'bg-gray-400 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10">
            
            {/* BARRA SUPERIOR E IA */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200 shrink-0">
                <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                        <MdMap className="text-blue-500 text-lg hidden"/> Panel de Asignación
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Arrastra los tickets a la ruta del técnico correspondiente.</p>
                </div>
                <button 
                    onClick={asignarConIA}
                    className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95"
                >
                    <MdAutoAwesome className="text-base text-purple-600"/> Auto-Asignar por Zona
                </button>
            </div>

            {/* TABLERO KANBAN (COLUMNAS) */}
            <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-4">
                
                {/* COLUMNA 1: PENDIENTES */}
                <div 
                    className="w-80 min-w-[20rem] flex flex-col bg-gray-100/50 rounded-3xl border-2 border-dashed border-gray-200 p-4"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'pendientes')}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                            <MdAssignment/> Sin Asignar
                        </h4>
                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {tickets.filter(t => t.asignadoA === 'pendientes').length}
                        </span>
                    </div>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                        {tickets.filter(t => t.asignadoA === 'pendientes').map(ticket => (
                            <TicketCard 
                                key={ticket.id} ticket={ticket} 
                                onDragStart={handleDragStart} onDragEnd={handleDragEnd} getColores={getColoresPrioridad}
                            />
                        ))}
                    </div>
                </div>

                {/* COLUMNAS TÉCNICOS */}
                {TECNICOS.map(tecnico => (
                    <div 
                        key={tecnico.id}
                        className="w-80 min-w-[20rem] flex flex-col bg-white rounded-3xl border border-gray-200 p-4 shadow-sm"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, tecnico.id)}
                    >
                        <div className="flex items-start gap-3 mb-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                <MdEngineering className="text-xl"/>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-blue-900 leading-tight">{tecnico.nombre}</h4>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{tecnico.vehiculo}</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 bg-gray-50/50 rounded-2xl p-2 border border-gray-100/50">
                            {tickets.filter(t => t.asignadoA === tecnico.id).map(ticket => (
                                <TicketCard 
                                    key={ticket.id} ticket={ticket} 
                                    onDragStart={handleDragStart} onDragEnd={handleDragEnd} getColores={getColoresPrioridad}
                                />
                            ))}
                            {tickets.filter(t => t.asignadoA === tecnico.id).length === 0 && (
                                <div className="h-full flex items-center justify-center text-[10px] font-bold text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                    Arrastra tickets aquí
                                </div>
                            )}
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}

// Subcomponente de Tarjeta Draggable
function TicketCard({ ticket, onDragStart, onDragEnd, getColores }) {
    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, ticket.id)}
            onDragEnd={onDragEnd}
            className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors group relative"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-gray-400 tracking-widest">{ticket.id}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getColores(ticket.prioridad)}`}>
                    {ticket.prioridad}
                </span>
            </div>
            <h5 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                <MdPerson className="text-gray-400"/> {ticket.cliente}
            </h5>
            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                <MdLocationOn className="text-blue-500"/> {ticket.zona}
            </div>
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MdDragIndicator className="text-gray-300 text-xl"/>
            </div>
        </div>
    );
}