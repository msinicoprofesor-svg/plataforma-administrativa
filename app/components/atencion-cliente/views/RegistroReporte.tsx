/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/RegistroReporte.tsx         */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdSearch, MdPerson, MdSchedule, MdInventory, 
    MdSend, MdAssignment, MdLocationOn, MdDomain, MdOutlineBolt, MdCheckCircle
} from "react-icons/md";

// Importamos los hooks para datos reales
import { useClientes } from '../../../hooks/useClientes';
import { useTickets } from '../../../hooks/useTickets';

const TIPOS_REPORTE = ['Falla de internet', 'Lentitud', 'Corte de servicio', 'Cambio de domicilio', 'Cancelación'];

const SUGERENCIAS_TEXTO = {
    'Falla de internet': ['Se reinició módem de forma remota sin éxito.', 'Cliente reporta foco rojo (LOS) encendido.', 'Posible falla masiva en la región.'],
    'Lentitud': ['Se detectan múltiples dispositivos consumiendo ancho de banda.', 'Interferencia en canal Wi-Fi.', 'Cliente requiere aumento de megas.'],
    'Corte de servicio': ['Cable de fibra exterior trozado.', 'Corte por falta de pago (aclaración).'],
    'Cambio de domicilio': ['Se validó factibilidad en nueva dirección.', 'Cliente requiere reubicación de router interno.'],
    'Cancelación': ['Cliente insatisfecho con el servicio.', 'Cambio de compañía.', 'Cambio de residencia fuera de cobertura.']
};

export default function RegistroReporte() {
    // CONEXIÓN A BASE DE DATOS
    const { clientes } = useClientes();
    const { crearTicket } = useTickets();

    // ESTADOS DEL BUSCADOR
    const [busqueda, setBusqueda] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [ticketGenerado, setTicketGenerado] = useState(false);

    // ESTADOS DEL FORMULARIO
    const [tipoReporte, setTipoReporte] = useState('');
    const [prioridad, setPrioridad] = useState('Media');
    const [descripcion, setDescripcion] = useState('');
    const [requiereVisita, setRequiereVisita] = useState(false);
    const [horarioVisita, setHorarioVisita] = useState('');
    const [requiereMaterial, setRequiereMaterial] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // BÚSQUEDA REAL EN CLIENTES
    const clientesFiltrados = busqueda.length > 2 
        ? clientes.filter(c => 
            c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
            c.contrato.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.telefono?.includes(busqueda)
          ).slice(0, 5) // Mostramos máximo 5 resultados rápidos
        : [];

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);
        setBusqueda('');
        setMostrarResultados(false);
    };

    const agregarSugerencia = (texto) => {
        setDescripcion(prev => prev ? `${prev} ${texto}` : texto);
    };

    // GUARDAR TICKET EN SUPABASE
    const handleGenerarTicket = async () => {
        if (!clienteSeleccionado || !tipoReporte) return alert("Selecciona un cliente y el tipo de reporte.");
        setIsSubmitting(true);

        const nuevoTicket = {
            cliente_id: clienteSeleccionado.id,
            tipo_reporte: tipoReporte,
            prioridad: prioridad,
            descripcion: descripcion,
            requiere_visita: requiereVisita,
            horario_preferencia: horarioVisita || 'Lo antes posible',
            marca_id: clienteSeleccionado.marca_id,
            region_id: clienteSeleccionado.region_id,
            estado: 'PENDIENTE',
            // MAGIA AQUÍ: Copiamos las coordenadas exactas del expediente del cliente al reporte
            latitud: clienteSeleccionado.latitud,
            longitud: clienteSeleccionado.longitud
        };

        const { error } = await crearTicket(nuevoTicket);
        
        setIsSubmitting(false);
        if (!error) {
            setTicketGenerado(true);
            // Limpiar todo después de 3 segundos
            setTimeout(() => {
                setClienteSeleccionado(null);
                setTipoReporte('');
                setPrioridad('Media');
                setDescripcion('');
                setRequiereVisita(false);
                setHorarioVisita('');
                setRequiereMaterial(false);
                setTicketGenerado(false);
            }, 3000);
        } else {
            alert("Error al guardar el ticket.");
        }
    };

    if (ticketGenerado) {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in text-center pb-20">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-6xl mb-6 shadow-lg shadow-green-500/20">
                    <MdCheckCircle />
                </div>
                <h2 className="text-2xl font-black text-gray-800">¡Ticket Generado con Éxito!</h2>
                <p className="text-gray-500 font-medium mt-2">El reporte ha sido enviado a la lista de activos y tablero de rutas.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
            
            {/* 1. BUSCADOR DE CLIENTES REALES */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <MdPerson className="text-blue-500 text-lg"/> 1. Identificación del Cliente
                </h3>
                
                {!clienteSeleccionado ? (
                    <div className="relative">
                        <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-xl"/>
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre, contrato o teléfono..." 
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                setMostrarResultados(true);
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-inner"
                        />
                        
                        {/* RESULTADOS DE BÚSQUEDA FLOTANTES */}
                        {mostrarResultados && busqueda.length > 2 && (
                            <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
                                {clientesFiltrados.length > 0 ? (
                                    clientesFiltrados.map(c => (
                                        <div 
                                            key={c.id} 
                                            onClick={() => seleccionarCliente(c)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{c.nombre}</p>
                                                <p className="text-[10px] text-gray-500">{c.direccion}</p>
                                            </div>
                                            <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{c.contrato}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs font-bold text-gray-400">No se encontró ningún cliente.</div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                                {clienteSeleccionado.nombre.charAt(0)}
                            </div>
                            <div>
                                <p className="text-base font-black text-blue-900">{clienteSeleccionado.nombre}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><MdDomain/> {clienteSeleccionado.marca}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><MdLocationOn/> {clienteSeleccionado.region}</span>
                                    <span>•</span>
                                    <span>Contrato: {clienteSeleccionado.contrato}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-black tracking-widest uppercase shadow-sm">
                                {clienteSeleccionado.estado}
                            </span>
                            <button onClick={() => setClienteSeleccionado(null)} className="text-[10px] text-blue-500 font-bold hover:underline">
                                Cambiar Cliente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. DETALLES DEL REPORTE */}
            <div className={`transition-all duration-500 ${clienteSeleccionado ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                    
                    {/* COLUMNA IZQUIERDA: Clasificación */}
                    <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100 bg-white">
                        <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                            <MdAssignment className="text-blue-500 text-lg"/> 2. Clasificación
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Incidencia</label>
                                <select 
                                    value={tipoReporte} 
                                    onChange={(e) => setTipoReporte(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 cursor-pointer"
                                >
                                    <option value="">Seleccione un tipo...</option>
                                    {TIPOS_REPORTE.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nivel de Prioridad</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Baja', 'Media', 'Alta', 'Crítica'].map(nivel => {
                                        const colores = {
                                            'Baja': 'hover:bg-gray-100 text-gray-600 border-gray-200 data-[active=true]:bg-gray-800 data-[active=true]:text-white data-[active=true]:border-gray-800',
                                            'Media': 'hover:bg-blue-50 text-blue-600 border-blue-200 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600',
                                            'Alta': 'hover:bg-orange-50 text-orange-600 border-orange-200 data-[active=true]:bg-orange-500 data-[active=true]:text-white data-[active=true]:border-orange-500',
                                            'Crítica': 'hover:bg-red-50 text-red-600 border-red-200 data-[active=true]:bg-red-600 data-[active=true]:text-white data-[active=true]:border-red-600'
                                        };
                                        return (
                                            <button 
                                                key={nivel} data-active={prioridad === nivel} onClick={() => setPrioridad(nivel)}
                                                className={`flex-1 min-w-[80px] py-2 px-3 border rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm ${colores[nivel]}`}
                                            >
                                                {nivel}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descripción del problema</label>
                                <textarea 
                                    value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Detalles técnicos reportados por el cliente..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-400 h-28 resize-none custom-scrollbar"
                                />
                                {tipoReporte && SUGERENCIAS_TEXTO[tipoReporte] && (
                                    <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                                        {SUGERENCIAS_TEXTO[tipoReporte].map((sug, i) => (
                                            <span 
                                                key={i} onClick={() => agregarSugerencia(sug)}
                                                className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors flex items-center gap-1"
                                            >
                                                <MdOutlineBolt/> {sug}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Logística */}
                    <div className="flex-1 p-6 md:p-8 bg-gray-50/50 flex flex-col">
                        <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                            <MdSchedule className="text-blue-500 text-lg"/> 3. Logística y Visita
                        </h3>

                        <div className="space-y-6 flex-1">
                            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">¿Requiere visita de un técnico?</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Asignar a ruta para atención en sitio.</p>
                                </div>
                                <button 
                                    onClick={() => setRequiereVisita(!requiereVisita)}
                                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${requiereVisita ? 'bg-blue-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${requiereVisita ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {requiereVisita && (
                                <div className="space-y-4 animate-slide-up pl-2 border-l-2 border-blue-500">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Disponibilidad del Cliente</label>
                                        <select 
                                            value={horarioVisita} onChange={(e) => setHorarioVisita(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-blue-400 cursor-pointer shadow-sm"
                                        >
                                            <option value="">Horario libre (Lo antes posible)</option>
                                            <option value="Por la mañana">Por la mañana (09:00 - 14:00)</option>
                                            <option value="Por la tarde">Por la tarde (14:00 - 18:00)</option>
                                            <option value="Horario fijo">Horario fijo (Agendar hora exacta)</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <MdInventory className="text-orange-500 text-2xl"/>
                                            <div>
                                                <p className="text-xs font-bold text-orange-900">Solicitud de Almacén</p>
                                                <p className="text-[10px] text-orange-700/70 mt-0.5">¿El técnico necesita equipo nuevo?</p>
                                            </div>
                                        </div>
                                        <input type="checkbox" checked={requiereMaterial} onChange={() => setRequiereMaterial(!requiereMaterial)} className="w-5 h-5 accent-orange-500 cursor-pointer" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOTÓN GENERAR */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <button 
                                onClick={handleGenerarTicket}
                                disabled={isSubmitting || !tipoReporte}
                                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2 animate-pulse">Generando...</span>
                                ) : (
                                    <><MdSend className="text-lg"/> Generar Ticket de Servicio</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}