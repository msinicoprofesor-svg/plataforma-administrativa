/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/incidencias/PanelIncidencias.tsx (FILTRADO)   */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdAdd, MdSearch, MdCheckCircle, MdCancel, MdAccessTime, MdDelete, 
    MdPerson, MdVerifiedUser, MdTimelapse, MdEventBusy, MdOutlineThumbUp 
} from "react-icons/md";
import { useIncidencias } from '../../../hooks/useIncidencias';
import ModalIncidencia from './ModalIncidencia';
import { ROLES_LIDERES, ROLES_RRHH } from '../../../config/permisos';

export default function PanelIncidencias({ colaboradores, usuario }) {
    const { incidencias, registrarIncidencia, actualizarEstado, eliminarIncidencia } = useIncidencias();
    
    const [modalOpen, setModalOpen] = useState(false);
    const [filtro, setFiltro] = useState('');

    // --- PERMISOS ---
    const rolUsuario = usuario.rol; 
    const esRRHH = ROLES_RRHH.includes(rolUsuario);
    const esLider = ROLES_LIDERES.includes(rolUsuario);

    // --- GUARDAR ---
    const handleGuardarIncidencia = (datosDelModal) => {
        let estadoInicial = 'PENDIENTE_LIDER';
        
        if (rolUsuario === 'DIRECTOR' || rolUsuario === 'GERENTE_GENERAL') {
            estadoInicial = 'APROBADA';
        } else if (esRRHH) {
            estadoInicial = 'APROBADA'; 
        } else if (esLider) {
            estadoInicial = 'PENDIENTE_RRHH'; 
        }

        const emailRegistro = (esLider || esRRHH) ? datosDelModal.colaboradorId : usuario.email;
        const nombreRegistro = (esLider || esRRHH) ? datosDelModal.nombreColaborador : usuario.nombre;

        const nuevaIncidencia = {
            ...datosDelModal,
            colaboradorId: emailRegistro,
            nombreColaborador: nombreRegistro,
            estado: estadoInicial,
            registradoPor: usuario.nombre,
            historialAprobacion: [
                { fecha: new Date().toISOString(), accion: 'CREADA', usuario: usuario.nombre }
            ]
        };

        registrarIncidencia(nuevaIncidencia);
        setModalOpen(false);
    };

    // --- FILTROS DE VISIBILIDAD (MEJORADO POR DEPARTAMENTO) ---
    const incidenciasFiltradas = incidencias.filter(inc => {
        // 1. Filtro de Texto (Buscador)
        const coincideTexto = 
            inc.nombreColaborador?.toLowerCase().includes(filtro.toLowerCase()) ||
            inc.tipo.toLowerCase().includes(filtro.toLowerCase());

        if (!coincideTexto) return false;

        // 2. Filtro de Jerarquía y Departamento
        
        // A) Superusuarios (RRHH, Director, Gerente General): VEN TODO
        if (esRRHH || rolUsuario === 'DIRECTOR' || rolUsuario === 'GERENTE_GENERAL' || rolUsuario === 'SOPORTE_GENERAL') {
            return true;
        }

        // B) Líderes de Área (Gerentes): VEN SOLO SU EQUIPO
        if (esLider) {
            // Buscamos quién es el dueño de la incidencia en la lista de colaboradores
            const colaboradorIncidencia = colaboradores.find(c => c.email === inc.colaboradorId);
            
            // Si encontramos al colaborador, comparamos su área con la del usuario logueado
            if (colaboradorIncidencia) {
                // Normalizamos para evitar errores de mayúsculas (ej: "Marketing" vs "MARKETING")
                const areaColaborador = (colaboradorIncidencia.area || colaboradorIncidencia.departamento || '').toUpperCase();
                const areaJefe = (usuario.area || usuario.departamento || '').toUpperCase();

                // Si son del mismo departamento, el jefe la ve
                if (areaColaborador && areaColaborador === areaJefe) return true;
                
                // Excepción: Si el líder se registró su propia incidencia, también debe verla
                if (inc.colaboradorId === usuario.email) return true;

                return false; // Si es de otra área, no la ve
            }
            
            // Fallback: Si no encontramos datos del colaborador, solo mostramos si es del propio usuario
            return inc.colaboradorId === usuario.email;
        }
        
        // C) Empleado Normal: SOLO VE LO SUYO
        const incEmail = (inc.colaboradorId || '').toLowerCase().trim();
        const miEmail = (usuario.email || '').toLowerCase().trim();
        return incEmail === miEmail;
    });

    return (
        <div className="h-full flex flex-col p-6">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="relative w-full md:w-96 group">
                    <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-xl group-focus-within:text-orange-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder={esRRHH || esLider ? "Buscar en mi equipo..." : "Buscar en mis registros..."}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:shadow-md focus:border-orange-200 outline-none transition-all font-medium text-gray-700"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
                
                <button 
                    onClick={() => setModalOpen(true)}
                    className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 hover:scale-105 transition-all flex items-center gap-2 active:scale-95"
                >
                    <MdAdd className="text-xl"/> Registrar Solicitud
                </button>
            </div>

            {/* TABLA */}
            <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="hidden md:flex px-6 py-4 border-b border-gray-50 gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                    <div className="w-40">Proceso</div>
                    <div className="flex-1">Colaborador & Detalle</div>
                    <div className="w-32 text-center">Tipo</div>
                    <div className="w-32 text-center">Duración</div>
                    <div className="w-32 text-center">Acciones</div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {incidenciasFiltradas.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <MdEventBusy className="text-6xl text-gray-300 mx-auto mb-4"/>
                            <p className="font-bold text-gray-400">Sin registros visibles para ti</p>
                        </div>
                    ) : (
                        incidenciasFiltradas.map(inc => (
                            <div key={inc.id} className="group bg-white border border-gray-100 p-4 rounded-2xl hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-4">
                                
                                {/* 1. PROGRESO */}
                                <div className="w-full md:w-40 flex flex-col gap-1">
                                    <div className={`text-[10px] font-black uppercase tracking-wide text-center py-1 rounded-lg border ${
                                        inc.estado === 'APROBADA' ? 'bg-green-50 text-green-600 border-green-100' :
                                        inc.estado === 'RECHAZADA' ? 'bg-red-50 text-red-600 border-red-100' :
                                        inc.estado === 'PENDIENTE_RRHH' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}>
                                        {inc.estado.replace('_', ' ')}
                                    </div>
                                    <div className="flex items-center justify-between px-2 mt-1">
                                        <div className="flex flex-col items-center" title="Aprobación de Líder">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
                                                ['PENDIENTE_RRHH', 'APROBADA'].includes(inc.estado) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200 text-gray-300'
                                            }`}>
                                                <MdPerson/>
                                            </div>
                                        </div>
                                        <div className={`h-0.5 flex-1 mx-1 ${['APROBADA'].includes(inc.estado) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                        <div className="flex flex-col items-center" title="Validación RRHH">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
                                                inc.estado === 'APROBADA' ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-300'
                                            }`}>
                                                <MdVerifiedUser/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. INFO */}
                                <div className="flex-1 min-w-0 text-center md:text-left w-full">
                                    <h4 className="font-bold text-gray-800 text-sm">{inc.nombreColaborador}</h4>
                                    <p className="text-xs text-gray-500 italic">"{inc.motivo}"</p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${inc.goceSueldo ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            {inc.goceSueldo ? 'Con Goce ($)' : 'Sin Goce'}
                                        </span>
                                        {inc.tiempoPorTiempo && <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-100 flex items-center gap-1"><MdTimelapse/> TxT</span>}
                                        {inc.unidadMedida === 'HORAS' && <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-orange-50 text-orange-700 border-orange-100">Por Horas</span>}
                                    </div>
                                </div>

                                {/* 3. TIPO */}
                                <div className="w-full md:w-32 text-center">
                                    <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-wide">{inc.tipo}</span>
                                </div>

                                {/* 4. DURACIÓN */}
                                <div className="w-full md:w-32 text-center">
                                    <p className="text-sm font-black text-gray-700">{inc.cantidad} {inc.unidadMedida === 'HORAS' ? 'Hrs' : 'Días'}</p>
                                    <p className="text-[10px] text-gray-400">{inc.unidadMedida === 'HORAS' ? inc.fechas?.[0] : inc.fechas?.[0]}</p>
                                </div>

                                {/* 5. ACCIONES */}
                                <div className="w-full md:w-32 flex justify-center gap-2">
                                    {/* APROBACIÓN LÍDER */}
                                    {inc.estado === 'PENDIENTE_LIDER' && esLider && (
                                        <button 
                                            onClick={() => actualizarEstado(inc.id, 'PENDIENTE_RRHH')} 
                                            className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm tooltip"
                                            title="Visto Bueno"
                                        >
                                            <MdOutlineThumbUp/>
                                        </button>
                                    )}

                                    {/* APROBACIÓN RRHH */}
                                    {esRRHH && inc.estado !== 'APROBADA' && inc.estado !== 'RECHAZADA' && (
                                        <button 
                                            onClick={() => actualizarEstado(inc.id, 'APROBADA')} 
                                            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all shadow-sm ${inc.estado === 'PENDIENTE_RRHH' ? 'bg-green-500 text-white animate-pulse-slow' : 'bg-green-50 text-green-600 hover:bg-green-500 hover:text-white'}`}
                                            title="Aprobar Final"
                                        >
                                            <MdVerifiedUser/>
                                        </button>
                                    )}

                                    {/* BORRAR */}
                                    {(esRRHH || inc.colaboradorId === usuario.email) && (
                                        <button 
                                            onClick={() => eliminarIncidencia(inc.id)} 
                                            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                        >
                                            <MdDelete/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ModalIncidencia 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleGuardarIncidencia}
                colaboradores={colaboradores}
            />
        </div>
    );
}