/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/contenido/TableroGestion.tsx             */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
  MdEdit, MdSave, MdClose, MdAttachMoney, MdImage, MdVisibility, MdDeleteOutline 
} from "react-icons/md";

// Importamos el Modal de Detalles (Debe estar en la misma carpeta)
import ModalDetalleSolicitud from './ModalDetalleSolicitud';

const ESTADOS_GESTION = [
    { id: 'PENDIENTE', label: 'Pendiente' },
    { id: 'EN_PROCESO', label: 'En Diseño' },
    { id: 'IMPRENTA', label: 'En Imprenta' },
    { id: 'ENTREGA', label: 'En Reparto' },
    { id: 'FINALIZADO', label: 'Finalizado' },
    { id: 'CANCELADO', label: 'Cancelado' }
];

// NOTA: Agregamos 'onEliminar' a los props recibidos
export default function TableroGestion({ solicitudes, onActualizar, onEliminar, usuarioActual }) {
  const [editando, setEditando] = useState(null); // ID de la solicitud en edición
  const [datosEdicion, setDatosEdicion] = useState({});
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null); // Para el Modal

  const iniciarEdicion = (sol) => {
      setEditando(sol.id);
      setDatosEdicion({
          estado: sol.estado,
          costo: sol.gestion?.costo || 0,
          fechaEntregaEstimada: sol.gestion?.fechaEntregaEstimada || '',
          linkDisenoFinal: sol.gestion?.linkDisenoFinal || ''
      });
  };

  const guardarCambios = () => {
      onActualizar(editando, {
          costo: Number(datosEdicion.costo),
          fechaEntregaEstimada: datosEdicion.fechaEntregaEstimada,
          linkDisenoFinal: datosEdicion.linkDisenoFinal
      }, datosEdicion.estado, usuarioActual);
      
      setEditando(null);
  };

  const handleDelete = (id) => {
      if (window.confirm("¿Estás seguro de eliminar esta solicitud del sistema?")) {
          onEliminar(id);
      }
  };

  return (
    <>
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-extrabold text-gray-800">Gestión de Contenido</h2>
                    <p className="text-sm text-gray-400">Solicitudes pendientes de diseño/imprenta</p>
                </div>
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-xl text-xs font-bold">
                    {solicitudes.filter(s => s.estado === 'PENDIENTE').length} Nuevas
                </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold sticky top-0 z-10">
                        <tr>
                            <th className="p-4 rounded-tl-xl">Solicitante</th>
                            <th className="p-4">Detalles</th>
                            <th className="p-4">Gestión (Estado / Fecha / Costo)</th>
                            <th className="p-4 rounded-tr-xl text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {solicitudes.map((sol) => (
                            <tr key={sol.id} className="hover:bg-gray-50/50 transition-colors">
                                {/* COLUMNA 1: SOLICITANTE */}
                                <td className="p-4 align-top">
                                    <p className="font-bold text-gray-800">{sol.solicitante?.nombre || 'Sin Nombre'}</p>
                                    <p className="text-xs text-gray-400">{sol.solicitante?.rol || 'N/A'}</p>
                                    <p className="text-[10px] text-gray-300 mt-1">
                                        {sol.fechaCreacion ? new Date(sol.fechaCreacion).toLocaleDateString() : ''}
                                    </p>
                                </td>
                                
                                {/* COLUMNA 2: DETALLES */}
                                <td className="p-4 align-top max-w-xs">
                                    <div className="flex gap-2 mb-1">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${sol.categoria === 'IMPRESO' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{sol.categoria}</span>
                                        <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">{sol.tipoMaterial}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium text-xs mb-1 truncate">{sol.especificaciones?.descripcion}</p>
                                    <p className="text-[10px] text-gray-400">Medidas: <span className="font-bold">{sol.especificaciones?.dimensiones || 'N/A'}</span> • Cant: <span className="font-bold">{sol.especificaciones?.cantidad || 1}</span></p>
                                    
                                    {/* Link rápido a referencia si existe */}
                                    {sol.especificaciones?.referencia && (
                                        <button 
                                            onClick={() => setSolicitudSeleccionada(sol)}
                                            className="text-[10px] text-blue-500 font-bold flex items-center gap-1 mt-1 hover:underline"
                                        >
                                            <MdImage/> Ver Referencia
                                        </button>
                                    )}
                                </td>

                                {/* COLUMNA 3: GESTIÓN (Editable) */}
                                <td className="p-4 align-top">
                                    {editando === sol.id ? (
                                        <div className="space-y-2 bg-white p-2 rounded-xl border border-orange-200 shadow-sm animate-scale-in">
                                            <select 
                                                value={datosEdicion.estado} 
                                                onChange={(e) => setDatosEdicion({...datosEdicion, estado: e.target.value})} 
                                                className="w-full text-xs font-bold p-2 bg-gray-50 rounded-lg border-none outline-none cursor-pointer"
                                            >
                                                {ESTADOS_GESTION.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                            </select>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <MdAttachMoney className="absolute left-2 top-2 text-gray-400 text-xs"/>
                                                    <input type="number" placeholder="Costo" value={datosEdicion.costo} onChange={(e) => setDatosEdicion({...datosEdicion, costo: e.target.value})} className="w-full pl-6 pr-2 py-1.5 text-xs bg-gray-50 rounded-lg outline-none border border-gray-100 focus:border-orange-300" />
                                                </div>
                                                <div className="relative flex-1">
                                                    <input type="date" value={datosEdicion.fechaEntregaEstimada} onChange={(e) => setDatosEdicion({...datosEdicion, fechaEntregaEstimada: e.target.value})} className="w-full px-2 py-1.5 text-xs bg-gray-50 rounded-lg outline-none border border-gray-100 focus:border-orange-300" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase inline-block ${sol.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' : sol.estado === 'FINALIZADO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {ESTADOS_GESTION.find(e => e.id === sol.estado)?.label || sol.estado}
                                            </span>
                                            {(sol.gestion?.costo > 0 || sol.gestion?.fechaEntregaEstimada) && (
                                                <div className="text-[10px] text-gray-500 font-medium">
                                                    {sol.gestion?.costo > 0 && <span className="block">💰 ${sol.gestion.costo}</span>}
                                                    {sol.gestion?.fechaEntregaEstimada && <span className="block">📅 {sol.gestion.fechaEntregaEstimada}</span>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* COLUMNA 4: ACCIONES */}
                                <td className="p-4 align-top text-right">
                                    {editando === sol.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditando(null)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Cancelar"><MdClose/></button>
                                            <button onClick={guardarCambios} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Guardar"><MdSave/></button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-1">
                                            {/* Ver Detalles */}
                                            <button 
                                                onClick={() => setSolicitudSeleccionada(sol)} 
                                                className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors" 
                                                title="Ver Detalles Completos"
                                            >
                                                <MdVisibility />
                                            </button>

                                            {/* Editar */}
                                            <button 
                                                onClick={() => iniciarEdicion(sol)} 
                                                className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors" 
                                                title="Gestionar Pedido"
                                            >
                                                <MdEdit />
                                            </button>

                                            {/* Eliminar (Solo si eres Admin/Gerente o Creador) */}
                                            <button 
                                                onClick={() => handleDelete(sol.id)} 
                                                className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors" 
                                                title="Eliminar Pedido"
                                            >
                                                <MdDeleteOutline />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL DE DETALLES */}
        <ModalDetalleSolicitud 
            isOpen={!!solicitudSeleccionada}
            onClose={() => setSolicitudSeleccionada(null)}
            solicitud={solicitudSeleccionada}
        />
    </>
  );
}