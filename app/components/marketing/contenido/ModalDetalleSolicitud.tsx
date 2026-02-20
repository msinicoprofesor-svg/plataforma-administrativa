/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/contenido/ModalDetalleSolicitud.tsx      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { 
    MdClose, MdImage, MdDescription, MdAccessTime, MdAttachMoney, 
    MdPerson, MdSave, MdCalendarToday, MdWork 
} from "react-icons/md";

// Importamos roles para validar permisos de edición dentro del modal
import { ROLES } from '../../../config/permisos';

export default function ModalDetalleSolicitud({ isOpen, onClose, solicitud, onActualizar, usuarioActual }) {
  // Estados locales para la edición
  const [estado, setEstado] = useState('');
  const [costo, setCosto] = useState(0);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [comentarios, setComentarios] = useState('');
  
  // Detectar si el usuario puede gestionar (Creador, Gerentes)
  const rawKey = usuarioActual?.puesto || usuarioActual?.rol || '';
  const rolKey = ROLES[rawKey.toUpperCase().trim()] || 'OTRO_PERSONAL';
  const esGestor = ['CREADOR_CONTENIDO', 'GERENTE_MKT', 'GERENTE_GENERAL'].includes(rolKey);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (solicitud) {
        setEstado(solicitud.estado || 'PENDIENTE');
        setCosto(solicitud.gestion?.costo || 0);
        setFechaEntrega(solicitud.gestion?.fechaEntregaEstimada || '');
        setComentarios(solicitud.gestion?.comentariosInternos || '');
    }
  }, [solicitud]);

  if (!isOpen || !solicitud) return null;

  const specs = solicitud.especificaciones || {};
  const solicitante = solicitud.solicitante || {};

  // Función para guardar cambios
  const handleGuardar = () => {
      if (onActualizar) {
          onActualizar(
              solicitud.id, 
              { 
                  costo: Number(costo), 
                  fechaEntregaEstimada: fechaEntrega, 
                  comentariosInternos: comentarios 
              }, 
              estado, 
              usuarioActual
          );
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-gray-800">Detalles del Pedido</h3>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{solicitud.id}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm transition-all">
                <MdClose className="text-xl" />
            </button>
        </div>

        {/* BODY CON SCROLL */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
            
            {/* 1. FICHA DEL SOLICITANTE (NUEVO) */}
            <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl">
                    <MdPerson />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Solicitado por</p>
                    <p className="font-extrabold text-gray-800 text-base">{solicitante.nombre || 'Desconocido'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MdWork className="text-gray-400"/> {solicitante.rol} • {solicitante.area}
                    </p>
                </div>
            </div>

            {/* 2. INFORMACIÓN DEL PEDIDO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Columna Izq: Datos Técnicos */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 uppercase">{solicitud.categoria}</div>
                        <div className="bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 uppercase">{solicitud.tipoMaterial}</div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><MdAccessTime/> Medidas y Cantidad</p>
                        <p className="text-sm font-medium text-gray-800 border-l-4 border-gray-200 pl-3">
                            {specs.dimensiones || 'N/A'} <br/>
                            <span className="text-gray-500">Cantidad: {specs.cantidad}</span>
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><MdDescription/> Instrucciones</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            {specs.descripcion || 'Sin instrucciones específicas.'}
                        </p>
                    </div>
                </div>

                {/* Columna Der: Referencia Visual */}
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><MdImage/> Referencia Visual</p>
                    {specs.referencia ? (
                        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 h-48 flex items-center justify-center group relative">
                            <img 
                                src={specs.referencia} 
                                alt="Referencia" 
                                className="w-full h-full object-contain" 
                            />
                            <a 
                                href={specs.referencia} 
                                download={`referencia-${solicitud.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity backdrop-blur-sm"
                            >
                                Descargar Imagen
                            </a>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-2xl border-dashed border-2 border-gray-200 text-gray-400 text-xs font-bold px-4 text-center">
                            No se adjuntó imagen de referencia
                        </div>
                    )}
                </div>
            </div>

            {/* 3. PANEL DE GESTIÓN (SOLO PARA GESTORES) */}
            {esGestor && (
                <div className="mt-4 border-t-2 border-dashed border-gray-100 pt-6">
                    <h4 className="text-sm font-black text-gray-800 uppercase mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Panel de Gestión
                    </h4>
                    
                    <div className="bg-orange-50 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 border border-orange-100">
                        
                        {/* Selector de Estado */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-orange-400 uppercase">Estado del Pedido</label>
                            <select 
                                value={estado} 
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full p-2 rounded-xl border-none text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-300 outline-none"
                            >
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="EN_PROCESO">En Diseño</option>
                                <option value="IMPRENTA">En Imprenta</option>
                                <option value="ENTREGA">En Reparto</option>
                                <option value="FINALIZADO">Finalizado</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>

                        {/* Input de Costo */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-orange-400 uppercase">Costo ($)</label>
                            <div className="relative">
                                <MdAttachMoney className="absolute left-2 top-2.5 text-gray-400"/>
                                <input 
                                    type="number" 
                                    value={costo} 
                                    onChange={(e) => setCosto(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 rounded-xl border-none text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-300 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Input de Fecha */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-orange-400 uppercase">Fecha Estimada</label>
                            <div className="relative">
                                <MdCalendarToday className="absolute left-2 top-2.5 text-gray-400"/>
                                <input 
                                    type="date" 
                                    value={fechaEntrega} 
                                    onChange={(e) => setFechaEntrega(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 rounded-xl border-none text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-300 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cerrar
            </button>
            
            {esGestor && (
                <button 
                    onClick={handleGuardar} 
                    className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-black shadow-lg shadow-gray-200 flex items-center gap-2 transition-all active:scale-95"
                >
                    <MdSave className="text-lg"/> Guardar Cambios
                </button>
            )}
        </div>

      </div>
    </div>
  );
}