/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/page.tsx (ACTUALIZADO: LOGIN JAVAK CORE Y DISEÑO ADMIN)       */
/* -------------------------------------------------------------------------- */
'use client';

import { useState, useEffect } from 'react';
// FIX: Importamos iconos más administrativos y corporativos
import { MdDashboard, MdEmail, MdLock, MdAdminPanelSettings, MdBusiness, MdVerifiedUser } from "react-icons/md";
// OLD: FaStoreAlt (eliminado)


import { useColaboradores } from './hooks/useColaboradores';
import { useVentas } from './hooks/useVentas'; 
import { useUsuarios } from './hooks/useUsuarios'; 
import { useInventarioOperativo } from './hooks/useInventarioOperativo';
import { useLikeStore } from './hooks/useLikeStore'; 
import { useSolicitudesContenido } from './hooks/useSolicitudesContenido';
import { useVehiculos } from './hooks/useVehiculos'; 

import { tienePermiso } from './config/permisos'; 

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import InventarioOperativo from './components/operaciones/InventarioOperativo';
import ActivosFijos from './components/operaciones/almacen/ActivosFijos';
import ModuloLogistica from './components/operaciones/almacen/ModuloLogistica';

import LikeStore from './components/marketing/LikeStore';         
import CatalogoLikeStore from './components/marketing/CatalogoLikeStore'; 
import ImportarInteracciones from './components/marketing/ImportarInteracciones';
import PanelMarketing from './components/marketing/PanelMarketing';
import PanelSolicitudes from './components/marketing/PanelSolicitudes';
import PanelEstudios from './components/marketing/estudios/PanelEstudios'; 
import PanelSocial from './components/marketing/social/PanelSocial';

import PanelAtencionCliente from './components/atencion-cliente/PanelAtencionCliente';
import DirectorioClientes from './components/atencion-cliente/views/DirectorioClientes'; 
import DashboardTecnico from './components/tecnico/DashboardTecnico'; 

import Directorio from './components/rrhh/Directorio';
import PanelRRHH from './components/rrhh/PanelRRHH'; 
import ModalColaborador from './components/rrhh/ModalColaborador';

import Cobertura from './components/tecnica/Cobertura'; 
import MesaControl from './components/tecnica/MesaControl'; 
import PanelVentas from './components/ventas/PanelVentas'; 

import PanelVehiculos from './components/vehiculos/PanelVehiculos';
import BitacoraGlobal from './components/vehiculos/BitacoraGlobal';
import PanelMantenimiento from './components/vehiculos/PanelMantenimiento';
import ModuloSolicitudesVehiculos from './components/vehiculos/ModuloSolicitudesVehiculos'; 


export default function Home() {
  const auth = useUsuarios(); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [activeModuleState, setActiveModuleState] = useState('dashboard'); 

  useEffect(() => {
    const moduloGuardado = localStorage.getItem('javak_modulo_activo');
    if (moduloGuardado) {
        setActiveModuleState(moduloGuardado);
    }
  }, []);

  const setActiveModule = (modulo) => {
      setActiveModuleState(modulo);
      localStorage.setItem('javak_modulo_activo', modulo);
  };
  const activeModule = activeModuleState;
  
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { 
    colaboradoresVisibles, colaboradoresReales, busqueda, setBusqueda, 
    eliminarColaborador, agregarColaborador, importarMasivo, actualizarColaborador, 
    registrarPuntosMasivos, eliminarImportacion, historial, paginacion 
  } = useColaboradores();

  const ventasData = useVentas(); 
  const inventarioOps = useInventarioOperativo(); 
  const likeStoreData = useLikeStore();           
  const solicitudesData = useSolicitudesContenido(); 
  const vehiculosData = useVehiculos(); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradorEditar, setColaboradorEditar] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const uBasico = auth.usuarioActivo;
  const perfilReal = (colaboradoresReales || []).find(c => c.email === uBasico?.email);

  const u = uBasico ? {
      ...uBasico,
      puesto: perfilReal?.puesto || uBasico.puesto || uBasico.rol,
      nombre: perfilReal?.nombre || uBasico.nombre,
      foto: perfilReal?.foto || uBasico.foto,
      rol: uBasico.rol 
  } : null;

  const verVentas = tienePermiso(u, 'marketing_ventas');
  const verCobertura = tienePermiso(u, 'marketing_cobertura');
  const verMesa = tienePermiso(u, 'marketing_mesa');
  
  const verAlmacen = tienePermiso(u, 'almacen_operativo');
  
  const verAtencionCliente = true; 

  const verSolicitudesDiseno = tienePermiso(u, 'marketing_solicitudes');
  const verPromociones = tienePermiso(u, 'marketing_promociones');
  const verColaboradores = tienePermiso(u, 'marketing_colaboradores');
  const verImportar = tienePermiso(u, 'marketing_importar');
  const verLikeStore = tienePermiso(u, 'likestore');
  
  const verEstudios = tienePermiso(u, 'marketing_estudios');
  const verSocial = tienePermiso(u, 'marketing_social');

  const verRRHH = tienePermiso(u, 'rrhh_hub') || tienePermiso(u, 'rrhh_incidencias') || tienePermiso(u, 'rrhh_mural') || tienePermiso(u, 'rrhh_nomina');

  const ROLES_TIENDA_FULL = ['GERENTE_MKT', 'CREADOR_CONTENIDO', 'COMMUNITY_MANAGER', 'GERENTE_GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
  const esMarketingFull = u && ROLES_TIENDA_FULL.includes(u.rol);

  const ROLES_ADMIN_FLOTILLA = ['ENCARGADO_FLOTILLA', 'GERENTE_GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL', 'GERENTE_MKT'];
  const esEncargadoFlotilla = u && ROLES_ADMIN_FLOTILLA.includes(u.rol);

  useEffect(() => {
    if (u && !localStorage.getItem('javak_modulo_activo')) {
        if (tienePermiso(u, 'marketing_ventas') && !tienePermiso(u, 'marketing_dashboard')) {
            setActiveModule('marketing_ventas');
        } else if (activeModule === 'dashboard') {
            setActiveModule('marketing_dashboard');
        }
    }
  }, [u?.email]);

  const handleLogin = async (e) => {
      e.preventDefault();
      setErrorLogin(''); 
      const exito = await auth.login(emailInput, passInput); 
      if (exito) setPassInput('');
      else setErrorLogin('Credenciales incorrectas o problema de conexión');
  };

  const handleLogout = () => {
    auth.logout();
    setActiveModule('dashboard');
    localStorage.removeItem('javak_modulo_activo'); 
  };

  const descontarPuntos = (idColaborador, puntos) => {
    registrarPuntosMasivos({
        id: `CANJE-${Date.now()}`, fecha: new Date().toLocaleDateString(), marca: 'MARKETING',
        tipo: 'CANJE_PRODUCTOS', totalPuntos: -puntos, cantidad: 1,
        detalles: [{ colaboradorId: idColaborador, puntosGanados: -puntos, nombre: 'Canje LikeStore' }]
    });
  };

  if (!u) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] p-4 relative overflow-hidden">
        {/* Fondo decorativo con blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md mx-auto border border-white/50 z-10 transition-all">
            <div className="text-center mb-10">
                {/* FIX: Ícono administrativo con gradiente azul profesional */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-3xl mb-6 shadow-lg shadow-blue-500/30">
                    <MdAdminPanelSettings className="text-5xl text-white" />
                </div>
                {/* FIX: Nombre de la plataforma actualizado */}
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tighter">JAVAK <span className='text-blue-600'>Core</span></h1>
                <p className="text-sm font-semibold text-gray-500 mt-3 uppercase tracking-widest">Plataforma Administrativa Central</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                {errorLogin && (
                    <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 text-center animate-pulse">
                        {errorLogin}
                    </div>
                )}

                <div className="group relative">
                    <label className="text-[10px] font-bold text-gray-400 ml-4 uppercase mb-1 block tracking-wider">Correo Electrónico</label>
                    <div className="relative">
                        <MdEmail className="absolute left-4 top-4 text-gray-400 text-xl transition-colors group-focus-within:text-blue-500" />
                        <input name="email" type="text" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-gray-800 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 transition-all placeholder:text-gray-300" placeholder='usuario@empresa.com' required />
                    </div>
                </div>

                <div className="group relative">
                    <label className="text-[10px] font-bold text-gray-400 ml-4 uppercase mb-1 block tracking-wider">Contraseña</label>
                    <div className="relative">
                        <MdLock className="absolute left-4 top-4 text-gray-400 text-xl transition-colors group-focus-within:text-blue-500" />
                        <input name="password" type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-gray-800 focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-200 transition-all placeholder:text-gray-300" placeholder='••••••••' required />
                    </div>
                </div>

                {/* FIX: Botón con color azul administrativo */}
                <button type="submit" className="w-full py-4.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all mt-6 text-base tracking-tight flex items-center justify-center gap-2">
                    <MdVerifiedUser className='text-xl' /> Ingresar Seguro
                </button>
            </form>
            
            <div className="text-center mt-10 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium">&copy; 2024 JAVAK Group. Todos los derechos reservados.</p>
            </div>
        </div>
      </div>
    );
  }

  const isLikeStore = activeModule === 'likestore';
  const isTecnicoMovil = activeModule === 'tecnico_movil';
  
  const mainContainerClasses = isLikeStore 
    ? "flex-1 overflow-hidden w-full h-full relative p-0 bg-gray-100" 
    : isTecnicoMovil 
        ? "flex-1 overflow-y-auto w-full h-full relative p-0 bg-gray-100 custom-scrollbar" 
        : "flex-1 overflow-y-auto px-4 md:px-8 pb-20 md:pb-8 custom-scrollbar w-full";

  return (
    <div className="flex h-screen bg-[#F5F7FA] font-sans text-gray-900 overflow-hidden relative">
      <Sidebar 
         isOpen={sidebarOpen} setIsOpen={setSidebarOpen} activeModule={activeModule} 
         setActiveModule={(mod) => { setActiveModule(mod); if(window.innerWidth < 768) setSidebarOpen(false); }}
         usuario={u} onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
         {!isLikeStore && !isTecnicoMovil && <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title={activeModule.replace('marketing_', '').replace('vehiculos_', 'Flotilla: ').replace('almacen_operativo', 'Almacén General').replace('almacen_activos', 'Activos Fijos').replace('almacen_logistica', 'Logística y Pedidos').replace('rrhh_', '').replace('atencion_cliente', 'Atención al Cliente').replace('atencion_directorio', 'Directorio de Clientes').replace(/_/g, ' ')} />}
         
         <main className={mainContainerClasses}>
            
            {/* --- OPERACIONES --- */}
            {activeModule === 'marketing_dashboard' && (
                <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                   <div className="w-40 h-40 md:w-64 md:h-64 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.05)] mb-8 animate-pulse"><MdDashboard className="text-6xl md:text-8xl text-gray-200" /></div>
                   <h2 className="text-2xl md:text-4xl font-extrabold text-gray-300">Hola, {u.nombre.split(' ')[0]}</h2>
                   <p className="text-sm md:text-base text-gray-400 mt-2">Panel {u.puesto || u.rol}</p>
                </div>
            )}

            {/* --- ATENCIÓN AL CLIENTE --- */}
            {activeModule === 'atencion_cliente' && verAtencionCliente && <div className="animate-slide-up h-full pb-10"><PanelAtencionCliente /></div>}
            {activeModule === 'atencion_directorio' && verAtencionCliente && <div className="animate-slide-up h-full pb-10 pt-4 md:pt-6"><DirectorioClientes /></div>}
            {activeModule === 'tecnico_movil' && verAtencionCliente && <div className="animate-fade-in h-full w-full"><DashboardTecnico tecnicoId={u?.id || "1"} onOpenMenu={() => setSidebarOpen(true)} /></div>}

            {/* --- COMERCIAL Y MARKETING --- */}
            {activeModule === 'marketing_ventas' && verVentas && (
                <div className="animate-slide-up h-full pb-10">
                    <PanelVentas 
                        ventas={ventasData?.ventas || []} 
                        cobertura={ventasData?.cobertura || []} 
                        cupones={ventasData?.cupones || []} 
                        validarCupon={ventasData?.validarCupon} 
                        onRegistrarVenta={ventasData?.registrarVenta} 
                        vendedorActual={u} 
                        metas={ventasData?.metas || []} 
                        actualizarMeta={ventasData?.actualizarMeta} 
                        colaboradores={colaboradoresReales || []} 
                        comisiones={ventasData?.comisiones || []}
guardarReglaComision={ventasData?.guardarReglaComision}
eliminarReglaComision={ventasData?.eliminarReglaComision}
                    />
                </div>
            )}
            
            {activeModule === 'marketing_cobertura' && verCobertura && <div className="animate-slide-up h-full pb-10"><Cobertura cobertura={ventasData.cobertura} onAgregarZona={ventasData.agregarZona} onActualizarZona={ventasData.actualizarZona} eliminarZona={ventasData.eliminarZona} usuarioActual={u} /></div>}
            
            {activeModule === 'marketing_mesa' && verMesa && <div className="animate-slide-up h-full pb-10"><MesaControl ventas={ventasData.ventas} cobertura={ventasData.cobertura} onActualizarEstado={ventasData.actualizarEstadoVenta} usuarioActual={u} /></div>}

            {activeModule === 'marketing_solicitudes' && verSolicitudesDiseno && <div className="animate-slide-up h-full pb-10"><PanelSolicitudes solicitudes={solicitudesData.solicitudes} onCrear={solicitudesData.crearSolicitud} onActualizar={solicitudesData.actualizarSolicitud} onEliminar={solicitudesData.eliminarSolicitud} onCancelar={solicitudesData.cancelarSolicitud} usuarioActual={u} /></div>}
            {activeModule === 'marketing_estudios' && verEstudios && <div className="animate-slide-up h-full pb-10"><PanelEstudios usuario={u} /></div>}
            {activeModule === 'marketing_social' && verSocial && <div className="animate-slide-up h-full pb-10"><PanelSocial usuario={u} /></div>}
            {activeModule === 'marketing_promociones' && verPromociones && <div className="animate-slide-up h-full pb-10"><PanelMarketing cupones={ventasData.cupones} cobertura={ventasData.cobertura} onAgregarCupon={ventasData.agregarCupon} onEliminarCupon={ventasData.eliminarCupon} /></div>}
            
            {activeModule === 'marketing_colaboradores' && verColaboradores && (
                <div className="animate-slide-up pb-10">
                    <Directorio colaboradores={colaboradoresVisibles} busqueda={busqueda} setBusqueda={setBusqueda} paginacion={paginacion} onNuevo={() => { setColaboradorEditar(null); setIsViewOnly(false); setIsModalOpen(true); }} onVer={(col) => { setColaboradorEditar(col); setIsViewOnly(true); setIsModalOpen(true); }} onEditar={(col) => { setColaboradorEditar(col); setIsViewOnly(false); setIsModalOpen(true); }} onEliminar={eliminarColaborador} onImportar={importarMasivo} />
                </div>
            )}
            
            {activeModule === 'marketing_importar' && verImportar && <div className="animate-slide-up h-full"><ImportarInteracciones colaboradores={colaboradoresReales} historial={historial} onProcesar={registrarPuntosMasivos} onEliminarHistorial={eliminarImportacion} /></div>}
            
            {activeModule === 'likestore' && verLikeStore && (
                <div className="animate-slide-up w-full h-full">
                    {esMarketingFull ? <LikeStore useData={likeStoreData} colaboradores={colaboradoresReales} onCanjear={descontarPuntos} /> : <CatalogoLikeStore useData={likeStoreData} />}
                </div>
            )}
            
            {/* --- ALMACÉN Y LOGÍSTICA --- */}
            {activeModule === 'almacen_operativo' && verAlmacen && (
                <div className="animate-slide-up h-full pb-10">
                    <InventarioOperativo useData={inventarioOps} usuarioActivo={u} colaboradores={colaboradoresReales} />
                </div>
            )}
            {activeModule === 'almacen_activos' && verAlmacen && (
                <div className="animate-slide-up h-full pb-10">
                    <ActivosFijos useData={inventarioOps} usuarioActivo={u} colaboradores={colaboradoresReales} />
                </div>
            )}
            {activeModule === 'almacen_logistica' && (
                <div className="animate-slide-up h-full pb-10">
                    <ModuloLogistica useData={inventarioOps} usuarioActivo={u} colaboradores={colaboradoresReales} />
                </div>
            )}

            {/* --- RRHH --- */}
            {activeModule.startsWith('rrhh_') && verRRHH && <div className="animate-slide-up h-full pb-10"><PanelRRHH usuario={u} colaboradores={colaboradoresReales} moduloActivo={activeModule} /></div>}

            {/* --- FLOTILLA VEHICULAR --- */}
            {activeModule === 'vehiculos_panel' && (
                <div className="animate-slide-up h-full pb-10">
                    <PanelVehiculos usuarioActivo={u} colaboradores={colaboradoresReales} />
                </div>
            )}
            
            {activeModule === 'vehiculos_auditoria' && (
                <div className="animate-slide-up h-full pb-10">
                    <BitacoraGlobal onClose={() => setActiveModule('vehiculos_panel')} />
                </div>
            )}

            {activeModule === 'vehiculos_taller' && (
                <div className="animate-slide-up h-full pb-10">
                    <PanelMantenimiento onClose={() => setActiveModule('vehiculos_panel')} vehiculos={vehiculosData.vehiculos} />
                </div>
            )}

            {activeModule === 'vehiculos_solicitudes' && (
                <div className="animate-slide-up h-full pb-10">
                    <ModuloSolicitudesVehiculos usuarioActivo={u} esEncargado={esEncargadoFlotilla} colaboradores={colaboradoresReales} vehiculos={vehiculosData.vehiculos} />
                </div>
            )}

         </main>
      </div>

      <ModalColaborador isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} colaboradorAEditar={colaboradorEditar} isViewOnly={isViewOnly} onSave={(datos) => { colaboradorEditar ? actualizarColaborador(datos) : agregarColaborador(datos); setIsModalOpen(false); }} />
    </div>
  );
}