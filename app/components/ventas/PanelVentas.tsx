/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/PanelVentas.tsx (CUPONES INTELIGENTES)      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
  MdAddShoppingCart, MdRouter, MdAttachMoney, 
  MdSearch, MdCameraAlt, MdWifiTethering, 
  MdBarChart, MdAssignment, MdFlag
} from "react-icons/md";

// IMPORTACIÓN DE MÓDULOS SEPARADOS (ARQUITECTURA LIMPIA)
import AnaliticaVentas from './AnaliticaVentas';
import ModalNuevaVenta from './ModalNuevaVenta';
import GestorMetas from './GestorMetas';

export default function PanelVentas({ 
    ventas, cobertura, cupones, metas, 
    onRegistrarVenta, vendedorActual, validarCupon, 
    actualizarMeta, colaboradores 
}) {
  
  // VERIFICAR PERMISOS GERENCIALES PARA MOSTRAR LAS PESTAÑAS EXTRAS
  const rolNormalizado = (vendedorActual?.rol || '').toUpperCase();
  const ROLES_GERENCIALES = ['GERENTE_MKT', 'GERENTE MARKETING', 'GERENTE_GENERAL', 'GERENTE GENERAL', 'DIRECTOR', 'ADMINISTRADOR', 'SOPORTE_GENERAL'];
  const esGerencia = ROLES_GERENCIALES.includes(rolNormalizado);

  // ESTADO DE LAS PESTAÑAS
  const [tabActiva, setTabActiva] = useState('MIS_VENTAS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const misVentas = ventas.filter(v => v.vendedor?.id === vendedorActual?.id);

  return (
    <div className="h-full flex flex-col">
        
        {/* SISTEMA DE PESTAÑAS (SÓLO VISIBLE PARA GERENCIA) */}
        {esGerencia && (
            <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6 w-full max-w-lg mx-auto z-10 shrink-0">
                <button 
                    onClick={() => setTabActiva('MIS_VENTAS')} 
                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${tabActiva === 'MIS_VENTAS' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <MdAssignment className="text-lg"/> Mis Ventas
                </button>
                <button 
                    onClick={() => setTabActiva('ANALITICA')} 
                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${tabActiva === 'ANALITICA' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <MdBarChart className="text-lg"/> Analítica Global
                </button>
                <button 
                    onClick={() => setTabActiva('METAS')} 
                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${tabActiva === 'METAS' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <MdFlag className="text-lg"/> Metas (CRM)
                </button>
            </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col relative">
            {/* VISTA 1: CAPTURA DE VENTAS DEL USUARIO (VISTA ORIGINAL) */}
            {tabActiva === 'MIS_VENTAS' && (
                <div className="flex flex-col h-full animate-fade-in w-full">
                    <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
                        <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-red-50 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Mis Ventas del Mes</p>
                                <h3 className="text-4xl font-extrabold text-gray-800 mt-1">{misVentas.length}</h3>
                            </div>
                            <MdAttachMoney className="absolute -right-4 -bottom-4 text-8xl text-red-50" />
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="bg-[#DA291C] text-white p-6 rounded-[2rem] shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-2 min-w-[150px]">
                            <MdAddShoppingCart className="text-4xl" />
                            <span className="font-bold text-sm">Nueva Venta</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm flex-1 overflow-hidden flex flex-col border border-gray-100">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-gray-800">Mi Historial Reciente</h3>
                            <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2 text-gray-500">
                                <MdSearch /><input type="text" placeholder="Buscar cliente..." className="bg-transparent outline-none text-sm font-bold w-32" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                            </div>
                        </div>
                        <div className="overflow-y-auto p-4 custom-scrollbar space-y-3 flex-1">
                            {misVentas.length === 0 ? (
                                <div className="text-center py-20 text-gray-400"><MdAddShoppingCart className="text-6xl mx-auto mb-4 opacity-20" /><p>Aún no has registrado ventas.</p></div>
                            ) : (
                                misVentas
                                .filter(v => v.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
                                .map(venta => (
                                    <div key={venta.id} className="bg-gray-50 p-4 rounded-3xl flex items-center gap-4 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white shadow-md shrink-0 ${venta.estatus === 'PENDIENTE' ? 'bg-yellow-400 shadow-yellow-200' : venta.estatus === 'FINALIZADA' ? 'bg-green-500 shadow-green-200' : 'bg-blue-500 shadow-blue-200'}`}>
                                            {venta.servicio?.tipoServicio === 'CCTV' ? <MdCameraAlt /> : venta.servicio?.tipoServicio === 'HOTSPOT' ? <MdWifiTethering /> : <MdRouter />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 truncate">{venta.cliente?.nombre}</h4>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded uppercase">{venta.servicio?.tecnologia}</span>
                                                {venta.servicio?.tipoVenta === 'CAMBIO' && <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded uppercase">Cambio</span>}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${venta.estatus === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' : venta.estatus === 'FINALIZADA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{venta.estatus.replace('_', ' ')}</span>
                                            <p className="text-xs font-bold text-gray-400 mt-1">{new Date(venta.fechaRegistro).toLocaleDateString('es-MX')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA 2: ANALÍTICA GLOBAL (SÓLO GERENTES) */}
            {tabActiva === 'ANALITICA' && esGerencia && (
                <div className="flex flex-col h-full animate-fade-in w-full">
                    <AnaliticaVentas ventas={ventas} />
                </div>
            )}

            {/* VISTA 3: GESTOR DE METAS (SÓLO GERENTES) */}
            {tabActiva === 'METAS' && esGerencia && (
                <div className="flex flex-col h-full animate-fade-in w-full">
                    <GestorMetas 
                        ventas={ventas} 
                        metas={metas} 
                        actualizarMeta={actualizarMeta} 
                        colaboradores={colaboradores} 
                    />
                </div>
            )}
        </div>

        {/* MODAL SEPARADO Y LIMPIO */}
        <ModalNuevaVenta 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            cobertura={cobertura}
            cupones={cupones}
            onRegistrarVenta={onRegistrarVenta}
            vendedorActual={vendedorActual}
            validarCupon={validarCupon}
        />
    </div>
  );
}