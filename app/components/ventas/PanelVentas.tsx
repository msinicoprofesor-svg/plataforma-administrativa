/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/PanelVentas.tsx                             */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdAddShoppingCart, MdBarChart, MdAssignment, MdFlag } from "react-icons/md";

// IMPORTACIÓN DE MÓDULOS SEPARADOS
import AnaliticaVentas from './AnaliticaVentas';
import ModalNuevaVenta from './ModalNuevaVenta';
import GestorMetas from './GestorMetas';
import MisVentas from './MisVentas'; // <-- NUEVO MÓDULO ORGANIZADO

export default function PanelVentas({ 
    ventas = [], cobertura = [], cupones = [], metas = [], comisiones = [],
    onRegistrarVenta, vendedorActual, validarCupon, 
    actualizarMeta, guardarReglaComision, eliminarReglaComision, colaboradores = [] 
}) {
  
  // VERIFICAR PERMISOS GERENCIALES
  const rolNormalizado = (vendedorActual?.rol || '').toUpperCase();
  const ROLES_GERENCIALES = ['GERENTE_MKT', 'GERENTE MARKETING', 'GERENTE_GENERAL', 'GERENTE GENERAL', 'DIRECTOR', 'ADMINISTRADOR', 'SOPORTE_GENERAL'];
  const esGerencia = ROLES_GERENCIALES.includes(rolNormalizado);

  // ESTADO DE LAS PESTAÑAS
  const [tabActiva, setTabActiva] = useState('MIS_VENTAS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="h-full flex flex-col relative">
        
        {/* SISTEMA DE PESTAÑAS (GERENCIA VE TODO, VENDEDOR SOLO SUS VENTAS) */}
        {esGerencia && (
            <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6 w-full max-w-lg mx-auto z-10 shrink-0">
                <button onClick={() => setTabActiva('MIS_VENTAS')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${tabActiva === 'MIS_VENTAS' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><MdAssignment className="text-lg"/> Mis Ventas</button>
                <button onClick={() => setTabActiva('ANALITICA')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${tabActiva === 'ANALITICA' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><MdBarChart className="text-lg"/> Analítica Global</button>
                <button onClick={() => setTabActiva('METAS')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${tabActiva === 'METAS' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><MdFlag className="text-lg"/> Metas (CRM)</button>
            </div>
        )}

        <div className="flex-1 min-h-0 relative">
            {/* VISTA 1: ORGANIZACIÓN PERSONAL DEL VENDEDOR */}
            {tabActiva === 'MIS_VENTAS' && (
                <div className="flex flex-col h-full animate-fade-in w-full relative">
                    {/* BOTÓN FLOTANTE O SUPERIOR PARA NUEVA VENTA */}
                    <button onClick={() => setIsModalOpen(true)} className="absolute bottom-4 right-4 z-20 bg-[#DA291C] text-white p-4 rounded-3xl shadow-xl shadow-red-500/40 hover:scale-105 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                        <MdAddShoppingCart className="text-xl" /> Nueva Venta
                    </button>

                    <MisVentas 
                        ventas={ventas} 
                        vendedorActual={vendedorActual} 
                        comisiones={comisiones} 
                        colaboradores={colaboradores} 
                    />
                </div>
            )}

            {/* VISTA 2: ANALÍTICA GLOBAL */}
            {tabActiva === 'ANALITICA' && esGerencia && (
                <div className="flex flex-col h-full animate-fade-in w-full">
                    <AnaliticaVentas ventas={ventas} colaboradores={colaboradores} comisiones={comisiones} />
                </div>
            )}

            {/* VISTA 3: GESTOR DE METAS */}
            {tabActiva === 'METAS' && esGerencia && (
                <div className="flex flex-col h-full animate-fade-in w-full">
                    <GestorMetas ventas={ventas} metas={metas} actualizarMeta={actualizarMeta} colaboradores={colaboradores} comisiones={comisiones} guardarReglaComision={guardarReglaComision} eliminarReglaComision={eliminarReglaComision} />
                </div>
            )}
        </div>

        {/* MODAL NUEVA VENTA */}
        <ModalNuevaVenta isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} cobertura={cobertura} cupones={cupones} onRegistrarVenta={onRegistrarVenta} vendedorActual={vendedorActual} validarCupon={validarCupon} />
    </div>
  );
}