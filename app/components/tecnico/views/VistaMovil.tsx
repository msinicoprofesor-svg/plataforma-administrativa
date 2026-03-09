/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnico/views/VistaMovil.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdPhone, MdMap, MdCheckCircle, MdAccessTime, MdWarning, 
    MdDirectionsCar, MdHomeRepairService, MdLocationOn, MdCheck 
} from "react-icons/md";

// Importamos el cerebro que creamos exclusivamente para ellos
import { useRutaTecnico } from '../../../hooks/useRutaTecnico';

export default function VistaMovil({ tecnicoId }) {
    const { miRuta, loading, actualizarEstadoEnCampo } = useRutaTecnico(tecnicoId);
    
    // Estados para el Modal de Cierre de Ticket
    const [ticketCerrando, setTicketCerrando] = useState(null);
    const [notasCierre, setNotasCierre] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getColoresPrioridad = (prioridad) => {
        switch(prioridad) {
            case 'Crítica': return 'bg-red-500 text-white shadow-red-500/30';
            case 'Alta': return 'bg-orange-500 text-white shadow-orange-500/30';
            case 'Media': return 'bg-blue-500 text-white shadow-blue-500/30';
            case 'Baja': return 'bg-gray-400 text-white shadow-gray-400/30';
            default: return 'bg-gray-400 text-white';
        }
    };

    const abrirNavegacion = (lat, lng, direccion) => {
        if (lat && lng) {
            // Abre Google Maps con el pin exacto
            window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
        } else {
            // Si no hay coordenadas, busca la dirección por texto
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`, '_blank');
        }
    };

    const llamarCliente = (telefono) => {
        if (telefono) window.open(`tel:${telefono}`, '_self');
    };

    const cambiarEstado = async (ticketId, nuevoEstado) => {
        await actualizarEstadoEnCampo(ticketId, nuevoEstado);
    };

    const finalizarTrabajo = async () => {
        setIsSubmitting(true);
        await actualizarEstadoEnCampo(ticketCerrando.id, 'RESUELTO', notasCierre);
        setIsSubmitting(false);
        setTicketCerrando(null);
        setNotasCierre('');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pb-20">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-black text-gray-500 animate-pulse uppercase tracking-widest">Sincronizando Ruta...</p>
            </div>
        );
    }

    if (miRuta.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center pb-20">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">
                    <MdCheckCircle />
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">¡Ruta Completada!</h2>
                <p className="text-sm font-medium text-gray-500">
                    No tienes tickets pendientes asignados para el día de hoy. Excelente trabajo.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 pb-24">
            {/* HEADER MÓVIL */}
            <div className="bg-white px-5 py-6 rounded-b-[2rem] shadow-sm sticky top-0 z-20 border-b border-gray-200">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Tu hoja de ruta</p>
                <div className="flex justify-between items-end">
                    <h1 className="text-2xl font-black text-gray-900 leading-none">Mi Ruta Hoy</h1>
                    <span className="bg-gray-900 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                        {miRuta.length} Paradas
                    </span>
                </div>
            </div>

            {/* LISTA DE TICKETS (TARJETAS) */}
            <div className="p-4 space-y-5 mt-2">
                {miRuta.map((ticket, index) => (
                    <div key={ticket.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden relative">
                        
                        {/* ALERTA DE ALMACÉN */}
                        {ticket.requiere_material && (
                            <div className="bg-orange-500 text-white text-[10px] font-black px-4 py-2 flex items-center gap-2 uppercase tracking-widest">
                                <MdWarning className="text-base"/> Parada en almacén requerida
                            </div>
                        )}

                        <div className="p-5">
                            {/* ENCABEZADO DE LA TARJETA */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/30">
                                        {ticket.orden || index + 1}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ticket.folio}</p>
                                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm mt-1 inline-block ${getColoresPrioridad(ticket.prioridad)}`}>
                                            {ticket.prioridad}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black">
                                    <MdAccessTime className="text-sm"/> {ticket.horario_preferencia}
                                </div>
                            </div>

                            {/* DATOS DEL CLIENTE Y PROBLEMA */}
                            <h3 className="text-xl font-black text-gray-800 leading-tight mb-2">{ticket.cliente}</h3>
                            <p className="text-xs font-bold text-gray-500 flex items-start gap-1.5 mb-4">
                                <MdLocationOn className="text-blue-500 text-base shrink-0 mt-0.5"/> 
                                {ticket.direccion_texto}
                            </p>

                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-5">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Reporte:</p>
                                <p className="text-sm font-bold text-gray-800">{ticket.tipo_reporte}</p>
                                {ticket.descripcion && (
                                    <p className="text-xs font-medium text-gray-600 mt-2 italic">"{ticket.descripcion}"</p>
                                )}
                            </div>

                            {/* BOTONES DE ACCIÓN (Maps y Llamadas) */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button 
                                    onClick={() => abrirNavegacion(ticket.latitud, ticket.longitud, ticket.direccion_texto)}
                                    className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-3 rounded-2xl transition-colors active:scale-95"
                                >
                                    <MdMap className="text-2xl text-green-600"/>
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Navegar</span>
                                </button>

                                {ticket.telefonos.length > 0 ? (
                                    <button 
                                        onClick={() => llamarCliente(ticket.telefonos[0])}
                                        className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-3 rounded-2xl transition-colors active:scale-95"
                                    >
                                        <MdPhone className="text-2xl text-blue-600"/>
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Llamar</span>
                                    </button>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 border border-gray-100 py-3 rounded-2xl opacity-50">
                                        <MdPhone className="text-2xl text-gray-400"/>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin Teléfono</span>
                                    </div>
                                )}
                            </div>

                            {/* FLUJO DE ESTADOS (Botones Inteligentes) */}
                            <div className="pt-5 border-t border-gray-100">
                                {ticket.estado === 'PENDIENTE' && (
                                    <button onClick={() => cambiarEstado(ticket.id, 'EN_RUTA')} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md">
                                        <MdDirectionsCar className="text-xl"/> Voy en Camino
                                    </button>
                                )}

                                {ticket.estado === 'EN_RUTA' && (
                                    <button onClick={() => cambiarEstado(ticket.id, 'EN_DOMICILIO')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-blue-500/30">
                                        <MdLocationOn className="text-xl"/> Llegué al Domicilio
                                    </button>
                                )}

                                {ticket.estado === 'EN_DOMICILIO' && (
                                    <button onClick={() => setTicketCerrando(ticket)} className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-green-500/30">
                                        <MdCheckCircle className="text-xl"/> Finalizar Trabajo
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE CIERRE DE TICKET (PANTALLA COMPLETA) */}
            {ticketCerrando && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
                    <div className="p-5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><MdHomeRepairService className="text-blue-600"/> Reporte de Cierre</h3>
                        <button onClick={() => setTicketCerrando(null)} className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-3 py-2 bg-white rounded-xl border border-gray-200">Cancelar</button>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="mb-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente Atendido</p>
                            <p className="text-base font-black text-gray-800">{ticketCerrando.cliente}</p>
                        </div>

                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Notas de Resolución (Obligatorio)</label>
                        <textarea 
                            value={notasCierre} 
                            onChange={(e) => setNotasCierre(e.target.value)}
                            placeholder="Ej. Se cambió conector dañado y se ajustó potencia. Cliente firma de conformidad..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all h-40 resize-none"
                        ></textarea>
                    </div>

                    <div className="p-5 border-t border-gray-100 bg-white pb-safe">
                        <button 
                            onClick={finalizarTrabajo}
                            disabled={notasCierre.length < 5 || isSubmitting}
                            className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Cerrando Ticket...' : <><MdCheck className="text-2xl"/> Confirmar y Cerrar</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}