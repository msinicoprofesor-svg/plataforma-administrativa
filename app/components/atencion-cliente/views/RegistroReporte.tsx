/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/RegistroReporte.tsx         */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdSearch, MdPerson, MdWarning, MdSchedule, MdInventory, 
    MdSend, MdAssignment, MdLocationOn, MdDomain, MdOutlineBolt
} from "react-icons/md";

const TIPOS_REPORTE = ['Falla de internet', 'Lentitud', 'Corte de servicio', 'Cambio de domicilio', 'Cancelación'];

const SUGERENCIAS_TEXTO = {
    'Falla de internet': ['Se reinició módem de forma remota sin éxito.', 'Cliente reporta foco rojo (LOS) encendido.', 'Posible falla masiva en la región.'],
    'Lentitud': ['Se detectan múltiples dispositivos consumiendo ancho de banda.', 'Interferencia en canal Wi-Fi.', 'Cliente requiere aumento de megas.'],
    'Corte de servicio': ['Cable de fibra exterior trozado.', 'Corte por falta de pago (aclaración).'],
    'Cambio de domicilio': ['Se validó factibilidad en nueva dirección.', 'Cliente requiere reubicación de router interno.'],
    'Cancelación': ['Cliente insatisfecho con el servicio.', 'Cambio de compañía.', 'Cambio de residencia fuera de cobertura.']
};

export default function RegistroReporte() {
    // ESTADOS DEL BUSCADOR
    const [busqueda, setBusqueda] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

    // ESTADOS DEL FORMULARIO
    const [tipoReporte, setTipoReporte] = useState('');
    const [prioridad, setPrioridad] = useState('Media');
    const [descripcion, setDescripcion] = useState('');
    const [requiereVisita, setRequiereVisita] = useState(false);
    const [horarioVisita, setHorarioVisita] = useState('');
    const [requiereMaterial, setRequiereMaterial] = useState(false);

    // MOCK: Simulación de búsqueda de cliente
    const simularBusqueda = (e) => {
        setBusqueda(e.target.value);
        if (e.target.value.length > 3) {
            setClienteSeleccionado({
                id: 'CL-88901',
                nombre: 'Roberto Gómez Bolaños',
                contrato: '10045-DMG',
                direccion: 'Calle Falsa 123, Col. Centro',
                marca: 'DMG',
                region: 'San Diego de la Unión',
                estado: 'ACTIVO'
            });
        } else {
            setClienteSeleccionado(null);
        }
    };

    const agregarSugerencia = (texto) => {
        setDescripcion(prev => prev ? `${prev} ${texto}` : texto);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
            
            {/* 1. BUSCADOR DE CLIENTES */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <MdPerson className="text-blue-500 text-lg"/> 1. Identificación del Cliente
                </h3>
                
                <div className="relative">
                    <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-xl"/>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, contrato o teléfono..." 
                        value={busqueda}
                        onChange={simularBusqueda}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all shadow-inner"
                    />
                </div>

                {clienteSeleccionado && (
                    <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up">
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
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-black tracking-widest uppercase shadow-sm">
                            {clienteSeleccionado.estado}
                        </span>
                    </div>
                )}
            </div>

            {/* 2. DETALLES DEL REPORTE (Solo visible si hay cliente) */}
            <div className={`transition-all duration-500 ${clienteSeleccionado ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                    
                    {/* COLUMNA IZQUIERDA: Clasificación */}
                    <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100 bg-white">
                        <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                            <MdAssignment className="text-blue-500 text-lg"/> 2. Clasificación
                        </h3>

                        <div className="space-y-6">
                            {/* TIPO DE REPORTE */}
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

                            {/* PRIORIDAD */}
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
                                                key={nivel}
                                                data-active={prioridad === nivel}
                                                onClick={() => setPrioridad(nivel)}
                                                className={`flex-1 min-w-[80px] py-2 px-3 border rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm ${colores[nivel]}`}
                                            >
                                                {nivel}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* DESCRIPCIÓN Y SUGERENCIAS */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descripción del problema</label>
                                <textarea 
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Detalles técnicos reportados por el cliente..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-blue-400 h-28 resize-none custom-scrollbar"
                                />
                                {tipoReporte && SUGERENCIAS_TEXTO[tipoReporte] && (
                                    <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                                        {SUGERENCIAS_TEXTO[tipoReporte].map((sug, i) => (
                                            <span 
                                                key={i} 
                                                onClick={() => agregarSugerencia(sug)}
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
                    <div className="flex-1 p-6 md:p-8 bg-gray-50/50">
                        <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                            <MdSchedule className="text-blue-500 text-lg"/> 3. Logística y Visita
                        </h3>

                        <div className="space-y-6">
                            {/* SWITCH VISITA */}
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

                            {/* OPCIONES DE VISITA (Condicional) */}
                            {requiereVisita && (
                                <div className="space-y-4 animate-slide-up pl-2 border-l-2 border-blue-500">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Disponibilidad del Cliente</label>
                                        <select 
                                            value={horarioVisita}
                                            onChange={(e) => setHorarioVisita(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-blue-400 cursor-pointer shadow-sm"
                                        >
                                            <option value="">Horario libre (Lo antes posible)</option>
                                            <option value="manana">Por la mañana (09:00 - 14:00)</option>
                                            <option value="tarde">Por la tarde (14:00 - 18:00)</option>
                                            <option value="fijo">Horario fijo (Agendar hora exacta)</option>
                                        </select>
                                    </div>

                                    {/* SWITCH MATERIAL */}
                                    <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <MdInventory className="text-orange-500 text-2xl"/>
                                            <div>
                                                <p className="text-xs font-bold text-orange-900">Solicitud de Almacén</p>
                                                <p className="text-[10px] text-orange-700/70 mt-0.5">¿El técnico necesita equipo nuevo?</p>
                                            </div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={requiereMaterial} 
                                            onChange={() => setRequiereMaterial(!requiereMaterial)}
                                            className="w-5 h-5 accent-orange-500 cursor-pointer"
                                        />
                                    </div>
                                    {requiereMaterial && (
                                        <p className="text-[10px] font-bold text-orange-600 animate-fade-in">
                                            * Al generar el ticket, se creará un vale en el módulo de Almacén.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* BOTÓN GENERAR */}
                        <div className="mt-10 pt-6 border-t border-gray-200">
                            <button className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                <MdSend className="text-lg"/> Generar Ticket de Servicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}