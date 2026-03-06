/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/GestionRutas.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react'; 
import { 
    MdDragIndicator, MdPerson, MdLocationOn, 
    MdAutoAwesome, MdEngineering, MdAssignment, MdMap, MdCheckCircle, MdAccessTime,
    MdEvent, MdViewColumn, MdViewTimeline, MdArrowForward, MdPinDrop
} from "react-icons/md";

import { useTickets } from '../../../hooks/useTickets';
import { useColaboradores } from '../../../hooks/useColaboradores';
import ModalDetallesTicket from './ModalDetallesTicket';

export default function GestionRutas() {
    const { tickets, moverTicket, reprogramarTicket, loading: loadingTickets } = useTickets();
    const { colaboradoresReales, loading: loadingColabs } = useColaboradores();

    const [isUpdating, setIsUpdating] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
    const [fechaFiltro, setFechaFiltro] = useState(() => new Date().toISOString().split('T')[0]);
    
    // AÑADIDA LA VISTA DE MAPA
    const [vistaActiva, setVistaActiva] = useState('TABLERO'); 

    const colabsSeguros = colaboradoresReales || [];
    
    const ticketsActivos = tickets.filter(t => t.estado !== 'RESUELTO' && t.estado !== 'CANCELADO' && t.estado !== 'PAPELERA' && t.visita === true);
    const pendientesGlobales = ticketsActivos.filter(t => !t.asignadoA || t.asignadoA === 'pendientes');
    const ticketsDelDia = ticketsActivos.filter(t => t.fecha_agendada === fechaFiltro && t.asignadoA !== 'pendientes');

    let tecnicos = colabsSeguros.filter(c => {
        const rol = c?.rol || '';
        const puesto = (c?.puesto || '').toLowerCase();
        return rol === 'TECNICO' || rol === 'INSTALADOR' || puesto.includes('técnico') || puesto.includes('instalador');
    });

    if (tecnicos.length === 0 && colabsSeguros.length > 0) {
        tecnicos = colabsSeguros.slice(0, 3);
    }

    // --- ALGORITMO ORDENADOR (RECONSTRUIDO) ---
    const ordenarRuta = (ticketsRuta) => {
        const getPesoHorario = (h) => {
            const text = (h || '').toLowerCase();
            if (text.includes('mañana') || text.includes('9am')) return 1;
            if (text.includes('tarde') || text.includes('2pm')) return 3;
            return 2; 
        };

        const getPesoPrioridad = (p) => {
            const text = (p || '').toLowerCase();
            if (text === 'crítica' || text === 'critica') return 4;
            if (text === 'alta') return 3;
            if (text === 'media') return 2;
            if (text === 'baja') return 1;
            return 0;
        };

        return [...ticketsRuta].sort((a, b) => {
            const hA = getPesoHorario(a.horario_preferencia);
            const hB = getPesoHorario(b.horario_preferencia);
            
            // 1. Horario (Mañana primero)
            if (hA !== hB) return hA - hB;
            
            // 2. Prioridad (Crítica primero)
            const pA = getPesoPrioridad(a.prioridad);
            const pB = getPesoPrioridad(b.prioridad);
            if (pA !== pB) return pB - pA;
            
            // 3. Ubicación (Agrupar por zona si tienen el mismo horario y prioridad)
            return (a.zona || '').localeCompare(b.zona || '');
        });
    };

    // --- CEREBRO AUTO-ORGANIZAR (NUEVO MOTOR LOGÍSTICO COMPLETO) ---
    const asignarConIA = async () => {
        // Ahora toma TODOS los tickets (pendientes y asignados de este día) para re-optimizar
        const ticketsAOrganizar = [...pendientesGlobales, ...ticketsDelDia];
        
        if(ticketsAOrganizar.length === 0) {
            alert("No hay tickets pendientes ni asignados en esta fecha para organizar.");
            return;
        }

        setIsUpdating(true);

        // 1. Agrupar por zona (Logística geográfica)
        const ticketsPorZona = {};
        ticketsAOrganizar.forEach(t => {
            const z = t.zona || 'Sin Zona';
            if(!ticketsPorZona[z]) ticketsPorZona[z] = [];
            ticketsPorZona[z].push(t);
        });

        // Zonas más pesadas primero
        const zonasOrdenadas = Object.keys(ticketsPorZona).sort((a,b) => ticketsPorZona[b].length - ticketsPorZona[a].length);

        // Memoria temporal de asignaciones
        let asignaciones = tecnicos.map(t => ({ id: t.id, tickets: [] }));

        // 2. Repartir zonas completas a los técnicos
        zonasOrdenadas.forEach(zona => {
            // Buscamos al técnico con menos carga actual
            asignaciones.sort((a, b) => a.tickets.length - b.tickets.length);
            asignaciones[0].tickets.push(...ticketsPorZona[zona]);
        });

        // 3. Guardar en Base de Datos (solo los que cambiaron de dueño o estaban pendientes)
        for (let tecnicoCarga of asignaciones) {
            for (let ticket of tecnicoCarga.tickets) {
                if (ticket.asignadoA !== tecnicoCarga.id) {
                    await moverTicket(ticket.id, tecnicoCarga.id, fechaFiltro);
                }
            }
        }
        
        setIsUpdating(false);
    };

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
            setIsUpdating(true);
            await moverTicket(ticketId, columnaDestino, fechaFiltro);
            setIsUpdating(false);
        }
    };

    const abrirDetalles = (ticket) => {
        setTicketSeleccionado(ticket);
        setModalAbierto(true);
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
            
            {(loadingTickets || loadingColabs || isUpdating) && (
                <div className="absolute inset-0 bg-[#F5F7FA]/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-3xl">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-gray-700 mt-3 animate-pulse">
                        {isUpdating ? 'Optimizando ubicaciones y tiempos de ruta...' : 'Sincronizando sistema...'}
                    </p>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100 shrink-0 gap-4">
                <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                        <MdMap className="text-blue-500 text-xl"/> Planificación de Rutas
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                        Mostrando tickets que <span className="text-blue-500">requieren visita</span>.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={asignarConIA} disabled={isUpdating} className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-fuchsia-100 hover:from-purple-200 hover:to-fuchsia-200 text-purple-700 px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all shadow-sm active:scale-95 border border-purple-200 disabled:opacity-50" title="Repartir por zona y horario">
                        <MdAutoAwesome className="text-lg text-purple-600"/> Auto-Organizar
                    </button>

                    <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2.5 rounded-2xl border border-blue-100 shadow-inner">
                        <MdEvent className="text-blue-500 text-lg"/>
                        <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} className="bg-transparent text-xs font-black text-blue-900 outline-none cursor-pointer" />
                    </div>

                    {/* SELECTOR DE TRES VISTAS AHORA */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 shadow-inner">
                        <button onClick={() => setVistaActiva('TABLERO')} className={`p-2 rounded-xl transition-all ${vistaActiva === 'TABLERO' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Modo Tablero (Drag & Drop)">
                            <MdViewColumn className="text-lg"/>
                        </button>
                        <button onClick={() => setVistaActiva('TIMELINE')} className={`p-2 rounded-xl transition-all ${vistaActiva === 'TIMELINE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Modo Línea de Tiempo">
                            <MdViewTimeline className="text-lg"/>
                        </button>
                        <button onClick={() => setVistaActiva('MAPA')} className={`p-2 rounded-xl transition-all ${vistaActiva === 'MAPA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`} title="Modo Mapa Geográfico">
                            <MdMap className="text-lg"/>
                        </button>
                    </div>
                </div>
            </div>

            {vistaActiva === 'TABLERO' ? (
                /* --- VISTA 1: KANBAN --- */
                <div className="flex-1 flex gap-5 overflow-x-auto custom-scrollbar pb-4 px-1">
                    <div className="w-80 min-w-[20rem] flex flex-col bg-gray-100/60 rounded-[2rem] border-2 border-dashed border-gray-200 p-5 transition-colors hover:bg-gray-100" onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={(e) => handleDrop(e, 'pendientes')}>
                        <div className="flex items-center justify-between mb-5 px-2">
                            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-2"><MdAssignment className="text-gray-400"/> Sin Asignar</h4>
                            <span className="bg-white text-gray-800 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm border border-gray-100">{pendientesGlobales.length}</span>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 pb-2">
                            {ordenarRuta(pendientesGlobales).map(ticket => (
                                <TicketCard key={ticket.id} ticket={ticket} onDragStart={handleDragStart} getColores={getColoresPrioridad} onVerDetalles={abrirDetalles} onReprogramar={reprogramarTicket} />
                            ))}
                        </div>
                    </div>

                    {tecnicos.map(tecnico => {
                        const partesNombre = (tecnico?.nombre || 'Técnico').split(' ');
                        const ticketsTecnico = ordenarRuta(ticketsDelDia.filter(t => t.asignadoA === tecnico.id));
                        return (
                            <div key={tecnico.id} className="w-80 min-w-[20rem] flex flex-col bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm transition-colors hover:border-blue-300" onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={(e) => handleDrop(e, tecnico.id)}>
                                <div className="flex items-start gap-4 mb-5 p-4 bg-blue-50/50 rounded-[1.5rem] border border-blue-100/50">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-100 overflow-hidden">
                                        {tecnico.foto ? <img src={tecnico.foto} alt="foto" className="w-full h-full object-cover" /> : <MdEngineering className="text-2xl"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-blue-950 leading-tight truncate">{partesNombre[0]} {partesNombre[1] || ''}</h4>
                                        <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider mt-1 truncate">{tecnico?.puesto || 'Técnico'}</p>
                                    </div>
                                    <span className="bg-white text-blue-800 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">{ticketsTecnico.length}</span>
                                </div>
                                <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 pb-2 bg-gray-50/30 rounded-3xl p-3 border border-gray-50">
                                    {ticketsTecnico.map(ticket => (
                                        <TicketCard key={ticket.id} ticket={ticket} onDragStart={handleDragStart} getColores={getColoresPrioridad} onVerDetalles={abrirDetalles} onReprogramar={reprogramarTicket}/>
                                    ))}
                                    {ticketsTecnico.length === 0 && (
                                        <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-[10px] font-bold text-gray-400 border-2 border-dashed border-gray-200/60 rounded-2xl">
                                            <MdAssignment className="text-2xl mb-2 opacity-30"/> Libre en esta fecha
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : vistaActiva === 'TIMELINE' ? (
                /* --- VISTA 2: LÍNEA DE TIEMPO --- */
                <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-6">
                    
                    {pendientesGlobales.length > 0 && (
                        <div className="bg-orange-50/50 p-6 rounded-[2rem] border-2 border-dashed border-orange-200/50 shadow-sm flex flex-col mb-6" onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={(e) => handleDrop(e, 'pendientes')}>
                            <div className="flex items-center gap-3 mb-2 border-b border-orange-200/30 pb-4">
                                <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center font-black shadow-inner"><MdAssignment className="text-xl"/></div>
                                <div>
                                    <h4 className="text-sm font-black text-orange-900 uppercase tracking-wide">Reportes sin asignar (Universales)</h4>
                                    <p className="text-[10px] font-bold text-orange-400 mt-0.5">Pendientes de programar en ruta o arrastrar</p>
                                </div>
                                <span className="bg-white text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-xl ml-auto border border-orange-200 shadow-sm">{pendientesGlobales.length} Pendientes</span>
                            </div>
                            
                            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-6 pt-2 items-center px-2">
                                {ordenarRuta(pendientesGlobales).map(ticket => (
                                    <div key={ticket.id} className="min-w-[260px] shrink-0">
                                        <TicketCard ticket={ticket} onDragStart={handleDragStart} getColores={getColoresPrioridad} onVerDetalles={abrirDetalles} onReprogramar={reprogramarTicket} />
                                    </div>
                                ))}
                                <div className="w-4 shrink-0"></div>
                            </div>
                        </div>
                    )}

                    {tecnicos.map(tecnico => {
                        const ticketsTecnico = ordenarRuta(ticketsDelDia.filter(t => t.asignadoA === tecnico.id));
                        if (ticketsTecnico.length === 0) return null;

                        return (
                            <div key={tecnico.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col" onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDrop={(e) => handleDrop(e, tecnico.id)}>
                                <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-4">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-sm"><MdEngineering className="text-xl"/></div>
                                    <div>
                                        <h4 className="text-sm font-black text-blue-950 uppercase tracking-wide">{tecnico.nombre}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">Línea de ruta programada</p>
                                    </div>
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1.5 rounded-xl ml-auto border border-gray-200">{ticketsTecnico.length} Paradas</span>
                                </div>

                                <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-6 pt-2 items-center px-2">
                                    {ticketsTecnico.map((ticket, index) => (
                                        <div key={ticket.id} className="flex items-center shrink-0 group">
                                            
                                            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all w-[260px] cursor-pointer relative" onClick={() => abrirDetalles(ticket)} draggable={true} onDragStart={(e) => handleDragStart(e, ticket.id)}>
                                                
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="w-6 h-6 bg-blue-600 text-white text-xs font-black flex items-center justify-center rounded-full shadow-sm z-10">
                                                        {index + 1}
                                                    </div>
                                                    <div className="bg-gray-800 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                                                        <MdAccessTime className="text-xs"/> {ticket.horario_preferencia}
                                                    </div>
                                                </div>

                                                <div className="pl-1">
                                                    <p className="text-[10px] text-gray-400 font-black mb-1.5 flex justify-between items-center">
                                                        {ticket.folio_corto}
                                                        <span className={`px-2 py-0.5 rounded shadow-sm text-[8px] ${getColoresPrioridad(ticket.prioridad)}`}>{ticket.prioridad}</span>
                                                    </p>
                                                    <p className="text-sm font-black text-gray-800 mb-2 truncate">{ticket.cliente}</p>
                                                    <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-gray-100">
                                                        <MdLocationOn className="text-green-500 text-sm shrink-0"/>
                                                        <span className="truncate">{ticket.zona}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            {index < ticketsTecnico.length - 1 && (
                                                <MdArrowForward className="mx-4 text-gray-200 text-2xl shrink-0 group-hover:text-blue-400 transition-colors"/>
                                            )}
                                        </div>
                                    ))}
                                    <div className="w-4 shrink-0"></div>
                                </div>
                            </div>
                        );
                    })}

                    {tecnicos.every(tecnico => ticketsDelDia.filter(t => t.asignadoA === tecnico.id).length === 0) && pendientesGlobales.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                            <MdViewTimeline className="text-6xl text-gray-100 mb-4"/>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No hay rutas ni reportes pendientes en esta fecha</p>
                        </div>
                    )}
                </div>
            ) : (
                /* --- VISTA 3: MAPA (NUEVA UI PROFESIONAL) --- */
                <div className="flex-1 flex flex-col md:flex-row gap-5 overflow-hidden">
                    {/* Lista lateral del mapa */}
                    <div className="w-full md:w-80 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                <MdPinDrop className="text-blue-500"/> Zonas Activas
                            </h4>
                            <p className="text-[10px] font-bold text-gray-400 mt-1">Reportes agendados para ubicación.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-gray-50/30">
                            {/* Mostrar todos los tickets del día listos para el mapa */}
                            {ordenarRuta([...pendientesGlobales, ...ticketsDelDia]).map(ticket => (
                                <div key={ticket.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-blue-300 transition-colors cursor-pointer" onClick={() => abrirDetalles(ticket)}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-gray-400 tracking-widest">{ticket.folio_corto}</span>
                                        <span className={`w-2 h-2 rounded-full ${ticket.asignadoA === 'pendientes' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></span>
                                    </div>
                                    <p className="text-xs font-black text-gray-800 truncate">{ticket.cliente}</p>
                                    <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-1"><MdLocationOn className="text-blue-500"/> {ticket.zona}</p>
                                </div>
                            ))}
                            {ticketsDelDia.length === 0 && pendientesGlobales.length === 0 && (
                                <p className="text-xs text-center font-bold text-gray-400 mt-10">No hay ubicaciones para esta fecha.</p>
                            )}
                        </div>
                    </div>

                    {/* Contenedor del Mapa (Placeholder listo para API) */}
                    <div className="flex-1 bg-gray-100 rounded-[2rem] border border-gray-200 overflow-hidden relative shadow-inner group flex items-center justify-center">
                        {/* Patrón de fondo simulando calles */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                        
                        <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl max-w-sm">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <MdMap className="text-3xl"/>
                            </div>
                            <h3 className="text-base font-black text-gray-800 mb-2">Módulo de Mapa Integrado</h3>
                            <p className="text-xs font-medium text-gray-500 mb-6">
                                La interfaz está lista. Para visualizar los puntos interactivos y trazar rutas reales de tus técnicos, se requiere conectar una clave API de <strong className="text-gray-700">Google Maps</strong> o <strong className="text-gray-700">Mapbox</strong>.
                            </p>
                            <button className="px-6 py-3 bg-gray-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95">
                                Conectar API de Mapas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalDetallesTicket isOpen={modalAbierto} onClose={() => setModalAbierto(false)} ticket={ticketSeleccionado} />
        </div>
    );
}

// Subcomponente de Tarjeta Draggable
function TicketCard({ ticket, onDragStart, getColores, onVerDetalles, onReprogramar }) {
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

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="relative overflow-hidden group/date cursor-pointer">
                    <input type="date" value={ticket?.fecha_agendada} onChange={(e) => onReprogramar(ticket.id, e.target.value)} className="absolute opacity-0 inset-0 cursor-pointer z-10" title="Agendar / Posponer ticket" />
                    <button className="flex items-center gap-1 text-[9px] font-black text-orange-500 bg-orange-50 group-hover/date:bg-orange-100 px-2 py-1.5 rounded transition-colors uppercase tracking-widest">
                        <MdEvent className="text-[11px]"/> Posponer
                    </button>
                </div>
                <button onClick={() => onVerDetalles(ticket)} className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors z-10 flex items-center gap-1">
                    <MdAccessTime/> Detalles
                </button>
            </div>
            
            <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white rounded-full p-1 shadow-sm border border-gray-100">
                <MdDragIndicator className="text-gray-400 text-xl"/>
            </div>
        </div>
    );
}