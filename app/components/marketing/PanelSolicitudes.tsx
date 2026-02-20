/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/PanelSolicitudes.tsx (CON CANCELAR)      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { MdAddCircle, MdDashboard } from "react-icons/md";

import { ROLES, tienePermiso } from '../../config/permisos';

import FormularioSolicitud from './contenido/FormularioSolicitud';
import ListaMisSolicitudes from './contenido/ListaMisSolicitudes';
import TableroGestion from './contenido/TableroGestion';

export default function PanelSolicitudes({ solicitudes, onCrear, onActualizar, onEliminar, onCancelar, usuarioActual }) {
  const [vistaActiva, setVistaActiva] = useState('SOLICITAR'); 

  // --- 1. VALIDACIÓN DE ACCESO ---
  const accesoPermitido = tienePermiso(usuarioActual, 'marketing_solicitudes');

  if (!accesoPermitido) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 font-bold opacity-50">
              <MdDashboard className="text-6xl mb-2"/>
              <p>No tienes permisos para acceder a este módulo.</p>
          </div>
      );
  }

  // --- 2. DETERMINAR ROL ---
  const rawKey = usuarioActual?.puesto || usuarioActual?.rol || '';
  const rolKey = ROLES[rawKey.toUpperCase().trim()] || 'OTRO_PERSONAL';

  const esEquipoGestion = [
      'CREADOR_CONTENIDO', 
      'GERENTE_MKT', 
      'GERENTE_GENERAL'
  ].includes(rolKey);

  // --- 3. FILTRADO ---
  const misPedidos = solicitudes.filter(s => {
      const matchId = s.usuarioId && usuarioActual.id && String(s.usuarioId) === String(usuarioActual.id);
      const matchEmail = s.email && usuarioActual.email && String(s.email).toLowerCase().trim() === String(usuarioActual.email).toLowerCase().trim();
      return matchId || matchEmail;
  });

  // --- 4. INTERCEPTOR DE CREACIÓN ---
  const handleCrearPedido = (datosFormulario) => {
      const pedidoCompleto = {
          ...datosFormulario,
          fecha: new Date().toISOString().split('T')[0],
          estado: 'PENDIENTE'
      };
      onCrear(pedidoCompleto, usuarioActual);
  };

  useEffect(() => {
      if (esEquipoGestion) {
          setVistaActiva('GESTION');
      }
  }, [esEquipoGestion]);

  return (
    <div className="h-full flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 px-2">
          <div>
              <h2 className="text-2xl font-extrabold text-gray-800">Centro de Diseño</h2>
              <p className="text-sm text-gray-400 font-medium">Solicitudes de material impreso y digital</p>
          </div>

          {esEquipoGestion && (
              <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
                  <button 
                      onClick={() => setVistaActiva('SOLICITAR')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${vistaActiva === 'SOLICITAR' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      <MdAddCircle className="text-lg"/> Nuevo Pedido
                  </button>
                  <button 
                      onClick={() => setVistaActiva('GESTION')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${vistaActiva === 'GESTION' ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      <MdDashboard className="text-lg"/> Mesa de Ayuda
                      {solicitudes.filter(s => s.estado === 'PENDIENTE').length > 0 && (
                          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">
                              {solicitudes.filter(s => s.estado === 'PENDIENTE').length}
                          </span>
                      )}
                  </button>
              </div>
          )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-hidden">
          
          {/* VISTA 1: GESTIÓN (Tablero) */}
          {vistaActiva === 'GESTION' && esEquipoGestion && (
              <div className="h-full animate-fade-in">
                  <TableroGestion 
                      solicitudes={solicitudes} 
                      onActualizar={onActualizar} 
                      onEliminar={onEliminar} // Los gestores sí pueden borrar basura
                      usuarioActual={usuarioActual}
                  />
              </div>
          )}

          {/* VISTA 2: SOLICITUDES (Formulario y Lista) */}
          {(vistaActiva === 'SOLICITAR' || !esEquipoGestion) && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-fade-in">
                  <div className="lg:col-span-7 overflow-y-auto custom-scrollbar pr-2 pb-10">
                      <FormularioSolicitud onGuardar={handleCrearPedido} usuario={usuarioActual} />
                  </div>

                  <div className="lg:col-span-5 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 p-6 flex flex-col h-full overflow-hidden">
                      {/* AQUÍ ESTÁ EL CAMBIO: Pasamos onCancelar en vez de onEliminar */}
                      <ListaMisSolicitudes 
                          solicitudes={misPedidos} 
                          usuario={usuarioActual} 
                          onCancelar={onCancelar} 
                      />
                  </div>
              </div>
          )}

      </div>
    </div>
  );
}