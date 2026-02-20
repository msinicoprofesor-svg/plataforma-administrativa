/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/contenido/ListaMisSolicitudes.tsx        */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
  MdTimer, MdCheckCircle, MdCancel, MdBrush, MdPrint, MdVisibility, MdBlock, MdAttachMoney 
} from "react-icons/md";
import ModalDetalleSolicitud from './ModalDetalleSolicitud'; 

export default function ListaMisSolicitudes({ solicitudes, usuario, onCancelar }) {
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // Ordenar: Más recientes primero
  const misSolicitudes = [...solicitudes].sort((a, b) => 
    new Date(b.fechaCreacion || 0).getTime() - new Date(a.fechaCreacion || 0).getTime()
  );

  const getStatusColor = (estado) => {
    switch (estado) {
        case 'PENDIENTE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'EN_DISEÑO': 
        case 'EN_PROCESO': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'EN_IMPRENTA': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'FINALIZADO': return 'bg-green-100 text-green-700 border-green-200';
        case 'CANCELADO': return 'bg-red-50 text-red-400 border-red-100';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
        case 'PENDIENTE': return <MdTimer />;
        case 'EN_DISEÑO': 
        case 'EN_PROCESO': return <MdBrush />;
        case 'EN_IMPRENTA': return <MdPrint />;
        case 'FINALIZADO': return <MdCheckCircle />;
        case 'CANCELADO': return <MdBlock />;
        default: return <MdCancel />;
    }
  };

  const handleCancel = (id) => {
      if (window.confirm("¿Deseas CANCELAR esta solicitud? El registro se mantendrá en tu historial pero se detendrá el proceso.")) {
          if (onCancelar) {
              onCancelar(id, usuario);
          }
      }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-800 text-lg">Mis Pedidos Recientes</h3>
          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-lg text-xs font-bold">{misSolicitudes.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {misSolicitudes.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                  <p className="text-sm font-bold text-gray-400">No has realizado solicitudes aún.</p>
              </div>
          ) : (
              misSolicitudes.map((sol) => (
                  <div key={sol.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-100 transition-all group ${sol.estado === 'CANCELADO' ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-3">
                          
                          {/* Categoría */}
                          <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                              {sol.categoria}
                          </span>

                          {/* Estado */}
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(sol.estado)}`}>
                              {getStatusIcon(sol.estado)}
                              {sol.estado.replace('_', ' ')}
                          </span>
                      </div>
                      
                      {/* Descripción */}
                      <p className="text-sm font-bold text-gray-700 mb-1 truncate">
                          {sol.especificaciones?.descripcion || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                          {sol.fechaCreacion ? new Date(sol.fechaCreacion).toLocaleDateString() : ''}
                      </p>

                      {/* --- PRECIO (NUEVO) --- */}
                      {sol.gestion?.costo > 0 && (
                          <div className="mb-3 inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100">
                              <MdAttachMoney className="text-sm"/>
                              <span className="text-xs font-black">${sol.gestion.costo}</span>
                          </div>
                      )}

                      {/* --- BOTONES DE ACCIÓN --- */}
                      <div className="flex gap-2 border-t border-gray-50 pt-3 mt-1">
                          
                          {/* 1. Botón Ver Detalles (OJO) */}
                          <button 
                            onClick={() => setSolicitudSeleccionada(sol)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                              <MdVisibility className="text-lg"/> Ver
                          </button>

                          {/* 2. Botón CANCELAR (Solo visible si es PENDIENTE o EN_DISEÑO) */}
                          {['PENDIENTE', 'EN_DISEÑO', 'EN_PROCESO'].includes(sol.estado) && (
                              <button 
                                onClick={() => handleCancel(sol.id)}
                                className="w-10 flex items-center justify-center bg-orange-50 rounded-xl text-orange-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                                title="Cancelar Solicitud"
                              >
                                  <MdBlock className="text-lg"/>
                              </button>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* Modal de Detalles */}
      <ModalDetalleSolicitud 
        isOpen={!!solicitudSeleccionada}
        onClose={() => setSolicitudSeleccionada(null)}
        solicitud={solicitudSeleccionada}
      />
    </>
  );
}