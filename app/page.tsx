/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/page.tsx (CONECTADO A ATENCIÓN AL CLIENTE)                    */
/* -------------------------------------------------------------------------- */
'use client';

import { useState, useEffect } from 'react';
import { MdDashboard, MdEmail, MdLock } from "react-icons/md";
import { FaStoreAlt } from "react-icons/fa";

// --- IMPORTS DE HOOKS ---
import { useColaboradores } from './hooks/useColaboradores';
import { useVentas } from './hooks/useVentas'; 
import { useUsuarios } from './hooks/useUsuarios'; 
import { useInventarioOperativo } from './hooks/useInventarioOperativo';
import { useLikeStore } from './hooks/useLikeStore'; 
import { useSolicitudesContenido } from './hooks/useSolicitudesContenido';

// --- CONFIGURACIÓN DE PERMISOS ---
import { tienePermiso } from './config/permisos'; 

// --- IMPORTS DE COMPONENTES ---
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import InventarioOperativo from './components/operaciones/InventarioOperativo';
import LikeStore from './components/marketing/LikeStore';         
import CatalogoLikeStore from './components/marketing/CatalogoLikeStore'; 
import ImportarInteracciones from './components/marketing/ImportarInteracciones';
import PanelMarketing from './components/marketing/PanelMarketing';
import PanelSolicitudes from './components/marketing/PanelSolicitudes';
import PanelEstudios from './components/marketing/estudios/PanelEstudios'; 
import PanelSocial from './components/marketing/social/PanelSocial';

// --- COMPONENTES NUEVOS (JAVAK) ---
import PanelAtencionCliente from './components/atencion-cliente/PanelAtencionCliente';

// --- COMPONENTES RRHH ---
import Directorio from './components/rrhh/Directorio';
import PanelRRHH from './components/rrhh/PanelRRHH'; 
import ModalColaborador from './components/rrhh/ModalColaborador';

// OTRAS VISTAS
import Cobertura from './components/tecnica/Cobertura'; 
import MesaControl from './components/tecnica/MesaControl'; 
import PanelVentas from './components/ventas/PanelVentas'; 

export default function Home() {
  const auth = useUsuarios(); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard'); 
  
  // --- ESTADOS PARA LOGIN ---
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- HOOKS DE DATOS ---
  const { 
    colaboradoresVisibles, colaboradoresReales, busqueda, setBusqueda, 
    eliminarColaborador, agregarColaborador, importarMasivo, actualizarColaborador, 
    registrarPuntosMasivos, eliminarImportacion, historial, paginacion 
  } = useColaboradores();

  const ventasData = useVentas(); 
  const inventarioOps = useInventarioOperativo(); 
  const likeStoreData = useLikeStore();           
  const solicitudesData = useSolicitudesContenido(); 

  // Estados Modal RRHH
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradorEditar, setColaboradorEditar] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // ---------------------------------------------------------------------------
  // LÓGICA DE USUARIO ENRIQUECIDO
  // ---------------------------------------------------------------------------
  const uBasico = auth.usuarioActivo;
  const perfilReal = colaboradoresReales.find(c => c.email === uBasico?.email);

  const u = uBasico ? {
      ...uBasico,
      puesto: perfilReal?.puesto || uBasico.puesto || uBasico.rol,
      nombre: perfilReal?.nombre || uBasico.nombre,
      foto: perfilReal?.foto || uBasico.foto,
      rol: uBasico.rol 
  } : null;

  // --- VALIDACIÓN DE PERMISOS ---
  const verVentas = tienePermiso(u, 'marketing_ventas');
  const verCobertura = tienePermiso(u, 'marketing_cobertura');
  const verMesa = tienePermiso(u, 'marketing_mesa');
  const verLogistica = tienePermiso(u, 'almacen_operativo');
  
  // Permiso temporal para JAVAK (mientras se agrega al archivo de permisos)
  const verAtencionCliente = true; 

  const verSolicitudesDiseno = tienePermiso(u, 'marketing_solicitudes');
  const verPromociones = tienePermiso(u, 'marketing_promociones');
  const verColaboradores = tienePermiso(u, 'marketing_colaboradores');
  const verImportar = tienePermiso(u, 'marketing_importar');
  const verLikeStore = tienePermiso(u, 'likestore');
  
  const verEstudios = tienePermiso(u, 'marketing_estudios');
  const verSocial = tienePermiso(u, 'marketing_social');

  const verRRHH = tienePermiso(u, 'rrhh_hub') || tienePermiso(u, 'rrhh_incidencias') || tienePermiso(u, 'rrhh_mural') || tienePermiso(u, 'rrhh_nomina');

  // LÓGICA ESPECIAL LIKESTORE: ¿Quién ve la versión FULL y quién solo Catálogo?
  const ROLES_TIENDA_FULL = ['GERENTE_MKT', 'CREADOR_CONTENIDO', 'COMMUNITY_MANAGER', 'GERENTE_GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
  const esMarketingFull = u && ROLES_TIENDA_FULL.includes(u.rol);

  // Redirección Inicial
  useEffect(() => {
    if (u) {
        if (tienePermiso(u, 'marketing_ventas') && !tienePermiso(u, 'marketing_dashboard')) {
            setActiveModule('marketing_ventas');
        } else if (activeModule === 'dashboard') {
            setActiveModule('marketing_dashboard');
        }
    }
  }, [u?.email]);

  // --- LÓGICA DE LOGIN (CORREGIDA PARA ASYNC CON SUPABASE) ---
  const handleLogin = async (e) => {
      e.preventDefault();
      setErrorLogin(''); 
      
      const exito = await auth.login(emailInput, passInput); 
      
      if (exito) {
          setPassInput('');
      } else {
          setErrorLogin('Credenciales incorrectas o problema de conexión');
      }
  };

  const handleLogout = () => {
    auth.logout();
    setActiveModule('dashboard');
  };

  const descontarPuntos = (idColaborador, puntos) => {
    registrarPuntosMasivos({
        id: `CANJE-${Date.now()}`, fecha: new Date().toLocaleDateString(), marca: 'MARKETING',
        tipo: 'CANJE_PRODUCTOS', totalPuntos: -puntos, cantidad: 1,
        detalles: [{ colaboradorId: idColaborador, puntosGanados: -puntos, nombre: 'Canje LikeStore' }]
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!u) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md mx-auto border border-white/50 z-10">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-[#DA291C] to-orange-400 rounded-3xl mb-6 shadow-lg shadow-red-500/30">
                    <FaStoreAlt className="text-4xl text-white" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-800">LikeStore</h1>
                <p className="text-sm font-medium text-gray-500 mt-2">Acceso Corporativo</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                {/* MOSTRAR ERROR SI EXISTE */}
                {errorLogin && (
                    <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 text-center animate-pulse">
                        {errorLogin}
                    </div>
                )}

                <div className="group relative">
                    <label className="text-[10px] font-bold text-gray-400 ml-4 uppercase mb-1 block">Correo</label>
                    <div className="relative">
                        <MdEmail className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                        <input 
                            name="email" 
                            type="text" 
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-2xl border-none outline-none font-bold text-gray-700 focus:ring-2 focus:ring-red-100 transition-all" 
                            required 
                        />
                    </div>
                </div>

                <div className="group relative">
                    <label className="text-[10px] font-bold text-gray-400 ml-4 uppercase mb-1 block">Contraseña</label>
                    <div className="relative">
                        <MdLock className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                        <input 
                            name="password" 
                            type="password" 
                            value={passInput}
                            onChange={(e) => setPassInput(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-2xl border-none outline-none font-bold text-gray-700 focus:ring-2 focus:ring-red-100 transition-all" 
                            required 
                        />
                    </div>
                </div>

                <button type="submit" className="w-full py-4 bg-[#DA291C] text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-all mt-4">
                    Iniciar Sesión
                </button>
            </form>
        </div>
      </div>
    );
  }

  const isLikeStore = activeModule === 'likestore';
  const mainContainerClasses = isLikeStore ? "flex-1 overflow-hidden w-full h-full relative p-0" : "flex-1 overflow-y-auto px-4 md:px-8 pb-20 md:pb-8 custom-scrollbar w-full";

  return (
    <div className="flex h-screen bg-[#F5F7FA] font-sans text-gray-900 overflow-hidden relative">
      <Sidebar 
         isOpen={sidebarOpen} setIsOpen={setSidebarOpen} activeModule={activeModule} 
         setActiveModule={(mod) => { setActiveModule(mod); if(window.innerWidth < 768) setSidebarOpen(false); }}
         usuario={u} onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
         {!isLikeStore && <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title={activeModule.replace('marketing_', '').replace('almacen_operativo', 'Logística').replace('rrhh_', '').replace('atencion_cliente', 'Atención al Cliente').replace(/_/g, ' ')} />}
         
         <main className={mainContainerClasses}>
            {activeModule === 'marketing_dashboard' && (
                <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                   <div className="w-40 h-40 md:w-64 md:h-64 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.05)] mb-8 animate-pulse"><MdDashboard className="text-6xl md:text-8xl text-gray-200" /></div>
                   <h2 className="text-2xl md:text-4xl font-extrabold text-gray-300">Hola, {u.nombre.split(' ')[0]}</h2>
                   <p className="text-sm md:text-base text-gray-400 mt-2">Panel {u.puesto || u.rol}</p>
                </div>
            )}

            {/* --- MÓDULOS JAVAK (NUEVOS) --- */}
            {activeModule === 'atencion_cliente' && verAtencionCliente && (
                <div className="animate-slide-up h-full pb-10">
                    <PanelAtencionCliente />
                </div>
            )}

            {/* --- MÓDULOS OPERATIVOS --- */}
            {activeModule === 'marketing_ventas' && verVentas && <div className="animate-slide-up h-full pb-10"><PanelVentas ventas={ventasData.ventas} cobertura={ventasData.cobertura} cupones={ventasData.cupones} validarCupon={ventasData.validarCupon} onRegistrarVenta={ventasData.registrarVenta} vendedorActual={u} /></div>}
            {activeModule === 'marketing_cobertura' && verCobertura && <div className="animate-slide-up h-full pb-10"><Cobertura cobertura={ventasData.cobertura} onAgregarZona={ventasData.agregarZona} onActualizarZona={ventasData.actualizarZona} usuarioActual={u} /></div>}
            {activeModule === 'marketing_mesa' && verMesa && <div className="animate-slide-up h-full pb-10"><MesaControl ventas={ventasData.ventas} cobertura={ventasData.cobertura} onActualizarEstado={ventasData.actualizarEstadoVenta} usuarioActual={u} /></div>}

            {activeModule === 'marketing_solicitudes' && verSolicitudesDiseno && (
                <div className="animate-slide-up h-full pb-10">
                    <PanelSolicitudes solicitudes={solicitudesData.solicitudes} onCrear={solicitudesData.crearSolicitud} onActualizar={solicitudesData.actualizarSolicitud} onEliminar={solicitudesData.eliminarSolicitud} onCancelar={solicitudesData.cancelarSolicitud} usuarioActual={u} />
                </div>
            )}
            
            {activeModule === 'marketing_estudios' && verEstudios && (
                <div className="animate-slide-up h-full pb-10"><PanelEstudios usuario={u} /></div>
            )}

            {activeModule === 'marketing_social' && verSocial && (
                <div className="animate-slide-up h-full pb-10"><PanelSocial usuario={u} /></div>
            )}

            {activeModule === 'marketing_promociones' && verPromociones && <div className="animate-slide-up h-full pb-10"><PanelMarketing cupones={ventasData.cupones} cobertura={ventasData.cobertura} onAgregarCupon={ventasData.agregarCupon} onEliminarCupon={ventasData.eliminarCupon} /></div>}
            {activeModule === 'marketing_importar' && verImportar && <div className="animate-slide-up h-full"><ImportarInteracciones colaboradores={colaboradoresReales} historial={historial} onProcesar={registrarPuntosMasivos} onEliminarHistorial={eliminarImportacion} /></div>}
            
            {/* --- LIKESTORE INTELIGENTE (FULL vs CATÁLOGO) --- */}
            {activeModule === 'likestore' && verLikeStore && (
                <div className="animate-slide-up w-full h-full">
                    {esMarketingFull ? (
                        <LikeStore useData={likeStoreData} colaboradores={colaboradoresReales} onCanjear={descontarPuntos} />
                    ) : (
                        <CatalogoLikeStore useData={likeStoreData} />
                    )}
                </div>
            )}
            
            {activeModule === 'almacen_operativo' && verLogistica && <div className="animate-slide-up h-full pb-10"><InventarioOperativo useData={inventarioOps} /></div>}

            {/* --- SECCIÓN RRHH --- */}
            {activeModule.startsWith('rrhh_') && verRRHH && (
                <div className="animate-slide-up h-full pb-10">
                    <PanelRRHH usuario={u} colaboradores={colaboradoresReales} moduloActivo={activeModule} />
                </div>
            )}

            {activeModule === 'marketing_colaboradores' && verColaboradores && (
                <div className="animate-slide-up pb-10">
                    <Directorio colaboradores={colaboradoresVisibles} busqueda={busqueda} setBusqueda={setBusqueda} paginacion={paginacion} onNuevo={() => { setColaboradorEditar(null); setIsViewOnly(false); setIsModalOpen(true); }} onVer={(col) => { setColaboradorEditar(col); setIsViewOnly(true); setIsModalOpen(true); }} onEditar={(col) => { setColaboradorEditar(col); setIsViewOnly(false); setIsModalOpen(true); }} onEliminar={eliminarColaborador} onImportar={importarMasivo} />
                </div>
            )}
         </main>
      </div>

      <ModalColaborador isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} colaboradorAEditar={colaboradorEditar} isViewOnly={isViewOnly} onSave={(datos) => { colaboradorEditar ? actualizarColaborador(datos) : agregarColaborador(datos); setIsModalOpen(false); }} />
    </div>
  );
}