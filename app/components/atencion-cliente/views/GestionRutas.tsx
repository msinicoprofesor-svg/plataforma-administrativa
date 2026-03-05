/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/GestionRutas.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { 
    MdDragIndicator, MdPerson, MdLocationOn, 
    MdAutoAwesome, MdEngineering, MdAssignment, MdMap, MdCheckCircle 
} from "react-icons/md";

// Importamos los hooks para traer datos reales de Supabase
import { useTickets } from '../../../hooks/useTickets';
import { useColaboradores } from '../../../hooks/useColaboradores';

export default function GestionRutas() {
    // 1. EXTRAEMOS DATOS REALES
    const { tickets, moverTicket, loading: loadingTickets } = useTickets();
    const { colaboradoresReales, loading: loadingColabs } = useColaboradores();

    // 2. FILTRAMOS DATOS (CON PROTECCIÓN ANTI-CRASH)
    const ticketsSeguros = tickets || [];
    const colabsSeguros = colaboradoresReales || [];

    const ticketsActivos = ticketsSeguros.filter(t => t.estado !== 'RESUELTO' && t.estado !== 'CANCELADO');

    // Filtramos colaboradores protegiendo contra nulos
    let tecnicos = colabsSeguros.filter(c => {
        const rol = c?.rol || '';
        const puesto = (c?.puesto || '').toLowerCase();
        return rol === 'TECNICO' || rol === 'INSTALADOR' || puesto.includes('técnico') || puesto.includes('instalador');
    });

    // Fallback: Si no has asignado el rol a nadie aún, mostramos los primeros 3 usuarios como prueba
    if (tecnicos.length === 0 && colabsSeguros.length > 0) {
        tecnicos = colabsSeguros.slice(0, 3);
    }

    // --- LÓGICA DRAG & DROP NATIVA ---
    const handleDragStart = (e, ticketId) => {
        e.dataTransfer.setData('ticketId', ticketId);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); 
    };

    const handleDrop = async (e, columnaDestino) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('ticketId');
        await moverTicket(ticketId, columnaDestino);
    };

    const asignarConIA = () => {
        alert("¡La IA de JAVAK está analizando las rutas! (En el futuro, esto se conectará a la API de Google Maps para optimizar distancias).");
    };

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
            
            {/* PANTALLA DE CARGA */}
            {(loadingTickets || loadingColabs) && (
                <div className="absolute inset-0 bg-[#F5F7FA]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-3xl">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-gray-500 mt-3 animate-pulse">Sincronizando rutas y técnicos...</p>
                </div>
            )}

            {/* BARRA SUPERIOR E IA */}
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100 shrink-0">
                <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                        <MdMap className="text-blue-500 text-xl"/> Panel de Asignación Operativa
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">Arrastra los tickets pendientes hacia la ruta del técnico correspondiente.</p>
                </div>
                <button 
                    onClick={asignarConIA}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-fuchsia-100 hover:from-purple-200 hover:to-fuchsia-200 text-purple-700 px-5 py-3 rounded-2xl text-xs font-black transition-all shadow-sm active:scale-95 border border-purple-200"
                >
                    <MdAutoAwesome className="text-lg text-purple-600"/> Auto-Asignar por Zona
                </button>
            </div>

            {/* TABLERO KANBAN (COLUMNAS) */}
            <div className="flex-1 flex gap-5 overflow-x-auto custom-scrollbar pb-4 px-1">
                
                {/* COLUMNA 1: PENDIENTES */}
                <div 
                    className="w-80 min-w-[20rem] flex flex-col bg-gray-100/60 rounded-[2rem] border-2 border-dashed border-gray-200 p-5 transition-colors hover:bg-gray-100"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'pendientes')}
                >
                    <div className="flex items-center justify-between mb-5 px-2">
                        <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                            <MdAssignment className="text-gray-400"/> Sin Asignar
                        </h4>
                        <span className="bg-white text-gray-800 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm border border-gray-100">
                            {ticketsActivos.filter(t => !t.asignadoA || t.asignadoA === 'pendientes').length}
                        </span>
                    </div>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                        {ticketsActivos.filter(t => !t.asignadoA || t.asignadoA === 'pendientes').map(ticket => (
                            <TicketCard 
                                key={ticket.id} ticket={ticket} 
                                onDragStart={handleDragStart} getColores={getColoresPrioridad}
                            />
                        ))}
                        {ticketsActivos.filter(t => !t.asignadoA || t.asignadoA === 'pendientes').length === 0 && (
                            <div className="h-32 flex flex-col items-center justify-center text-[10px] font-bold text-gray-400 border-2 border-dashed border-gray-200/50 rounded-2xl bg-white/50">
                                <MdCheckCircle className="text-3xl mb-2 text-green-400 opacity-50"/>
                                No hay tickets pendientes
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNAS TÉCNICOS (Desde BD) */}
                {tecnicos.map(tecnico => {
                    // Protección adicional para el nombre
                    const nombreTecnico = tecnico?.nombre || 'Técnico';
                    const partesNombre = nombreTecnico.split(' ');

                    return (
                        <div 
                            key={tecnico.id}
                            className="w-80 min-w-[20rem] flex flex-col bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm transition-colors hover:border-blue-300"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, tecnico.id)}
                        >
                            {/* CABECERA DEL TÉCNICO */}
                            <div className="flex items-start gap-4 mb-5 p-4 bg-blue-50/50 rounded-[1.5rem] border border-blue-100/50">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-100 overflow-hidden">
                                    {tecnico.foto ? (
                                        <img src={tecnico.foto} alt="foto" className="w-full h-full object-cover" />
                                    ) : (
                                        <MdEngineering className="text-2xl"/>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-blue-950 leading-tight truncate" title={nombreTecnico}>
                                        {partesNombre[0]} {partesNombre[1] || ''}
                                    </h4>
                                    <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider mt-1 truncate">
                                        {tecnico?.puesto || 'Técnico'}
                                    </p>
                                </div>
                                <span className="bg-white text-blue-800 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                                    {ticketsActivos.filter(t => t.asignadoA === tecnico.id).length}
                                </span>
                            </div>

                            {/* ZONA DE SOLTADO */}
                            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 bg-gray-50/30 rounded-3xl p-3 border border-gray-50">
                                {ticketsActivos.filter(t => t.asignadoA === tecnico.id).map(ticket => (
                                    <TicketCard 
                                        key={ticket.id} ticket={ticket} 
                                        onDragStart={handleDragStart} getColores={getColoresPrioridad}
                                    />
                                ))}
                                {ticketsActivos.filter(t => t.asignadoA === tecnico.id).length === 0 && (
                                    <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-[10px] font-bold text-gray-400 border-2 border-dashed border-gray-200/60 rounded-2xl">
                                        <MdAssignment className="text-2xl mb-2 opacity-30"/>
                                        Arrastra tickets aquí
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

            </div>
        </div>
    );
}

// Subcomponente de Tarjeta Draggable
function TicketCard({ ticket, onDragStart, getColores }) {
    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, ticket.id)}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm shadow-gray-200/50 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all group relative select-none"
        >
            <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black text-gray-400 tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {ticket?.folio_corto || 'TKT-000'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm ${getColores(ticket?.prioridad)}`}>
                    {ticket?.prioridad || 'Baja'}
                </span>
            </div>
            
            <h5 className="text-xs font-black text-gray-800 mb-1.5 flex items-center gap-2">
                <MdPerson className="text-blue-500"/> {ticket?.cliente || 'Sin Cliente'}
            </h5>
            
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-50">
                <MdLocationOn className="text-green-500 text-sm shrink-0"/> 
                <span className="truncate">{ticket?.zona || 'Sin Zona'}</span>
            </div>
            
            <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white rounded-full p-1 shadow-sm border border-gray-100">
                <MdDragIndicator className="text-gray-400 text-xl"/>
            </div>
        </div>
    );
}