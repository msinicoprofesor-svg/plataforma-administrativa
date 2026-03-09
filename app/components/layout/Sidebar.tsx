/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/layout/Sidebar.tsx                                 */
/* -------------------------------------------------------------------------- */
'use client';
import { 
  MdDashboard, MdPeople, MdOutlineCloudUpload, MdMap, MdAttachMoney, 
  MdFactCheck, MdInventory2, MdCardGiftcard, MdBusiness, MdEngineering, 
  MdWork, MdLocalOffer, MdClose, MdFormatPaint, MdPoll, MdShare, 
  MdEventNote, MdGroups, MdReceiptLong, MdSupportAgent, MdPeopleAlt,
  MdPhoneIphone, MdDirectionsCar // <-- NUEVO ICONO DE COCHE
} from "react-icons/md";
import { FaStoreAlt, FaUserCircle } from "react-icons/fa";

import { tienePermiso } from '../../config/permisos'; 

export default function Sidebar({ isOpen, setIsOpen, activeModule, setActiveModule, usuario, onLogout }) {
  
  const verAtencionCliente = true; 

  const verDashboard = tienePermiso(usuario, 'marketing_dashboard');
  const verVentas = tienePermiso(usuario, 'marketing_ventas');
  const verCobertura = tienePermiso(usuario, 'marketing_cobertura');
  const verMesa = tienePermiso(usuario, 'marketing_mesa');

  const verAlmacen = tienePermiso(usuario, 'almacen_operativo');

  // --- NUEVOS PERMISOS VEHICULARES ---
  // Por ahora lo dejamos en true para que puedas visualizar y desarrollar el módulo
  const verFlotilla = true; 

  const verCentroDiseno = tienePermiso(usuario, 'marketing_solicitudes');
  const verEstudios = tienePermiso(usuario, 'marketing_estudios');
  const verSocial = tienePermiso(usuario, 'marketing_social');
  const verPromociones = tienePermiso(usuario, 'marketing_promociones');
  const verColaboradores = tienePermiso(usuario, 'marketing_colaboradores');
  const verImportar = tienePermiso(usuario, 'marketing_importar');
  const verLikeStore = tienePermiso(usuario, 'likestore');

  const verHubRRHH = tienePermiso(usuario, 'rrhh_hub'); 
  const verMural = tienePermiso(usuario, 'rrhh_mural');
  const verIncidencias = tienePermiso(usuario, 'rrhh_incidencias');
  const verNomina = tienePermiso(usuario, 'rrhh_nomina');

  const verSoporte = tienePermiso(usuario, 'soporte_tickets');

  const verSeccionMarketing = verCentroDiseno || verEstudios || verSocial || verPromociones || verColaboradores || verImportar || verLikeStore;
  const verSeccionRRHH = verMural || verIncidencias || verNomina || verHubRRHH;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 bg-white text-gray-600 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out border-r border-gray-100 flex flex-col ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0 md:w-24'} md:relative`}>
        
        <div className="h-24 flex items-center justify-between px-6 md:justify-center">
          <div className={`flex items-center gap-3 transition-all duration-300 ${!isOpen && 'md:justify-center'}`}>
            <div className="w-12 h-12 bg-[#DA291C] rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
                <FaStoreAlt className="text-white text-xl" />
            </div>
            <span className={`font-extrabold text-2xl text-gray-800 tracking-tight ${!isOpen && 'md:hidden'}`}>JAVAK</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 p-2">
            <MdClose className="text-2xl"/>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar pb-6">
          
          {verAtencionCliente && (
            <>
                <SectionTitle label="Atención al Cliente" isOpen={isOpen} />
                <MenuButton icon={<MdSupportAgent />} label="Reportes y Rutas" active={activeModule === 'atencion_cliente'} onClick={() => setActiveModule('atencion_cliente')} isOpen={isOpen} />
                <MenuButton icon={<MdPeopleAlt />} label="Directorio Clientes" active={activeModule === 'atencion_directorio'} onClick={() => setActiveModule('atencion_directorio')} isOpen={isOpen} />
                <MenuButton icon={<MdPhoneIphone />} label="App Técnico (Móvil)" active={activeModule === 'tecnico_movil'} onClick={() => setActiveModule('tecnico_movil')} isOpen={isOpen} />
            </>
          )}

          <div className="my-4 border-t border-dashed border-gray-200 mx-2"></div>
          <SectionTitle label="Operaciones" isOpen={isOpen} />
          {verDashboard && <MenuButton icon={<MdDashboard />} label="Dashboard" active={activeModule === 'marketing_dashboard'} onClick={() => setActiveModule('marketing_dashboard')} isOpen={isOpen} />}
          {verVentas && <MenuButton icon={<MdAttachMoney />} label="Ventas" active={activeModule === 'marketing_ventas'} onClick={() => setActiveModule('marketing_ventas')} isOpen={isOpen} />}
          {verCobertura && <MenuButton icon={<MdMap />} label="Cobertura" active={activeModule === 'marketing_cobertura'} onClick={() => setActiveModule('marketing_cobertura')} isOpen={isOpen} />}
          {verMesa && <MenuButton icon={<MdFactCheck />} label="Mesa de Control" active={activeModule === 'marketing_mesa'} onClick={() => setActiveModule('marketing_mesa')} isOpen={isOpen} />}

          {verAlmacen && (
            <>
                <div className="my-4 border-t border-dashed border-gray-200 mx-2"></div>
                <SectionTitle label="Logística" isOpen={isOpen} />
                <MenuButton icon={<MdInventory2 />} label="Almacén General" active={activeModule === 'almacen_operativo'} onClick={() => setActiveModule('almacen_operativo')} isOpen={isOpen} />
            </>
          )}

          {/* --- NUEVA SECCIÓN: FLOTILLA --- */}
          {verFlotilla && (
            <>
                <div className="my-4 border-t border-dashed border-gray-200 mx-2"></div>
                <SectionTitle label="Flotilla" isOpen={isOpen} />
                <MenuButton icon={<MdDirectionsCar />} label="Control Vehicular" active={activeModule === 'vehiculos_panel'} onClick={() => setActiveModule('vehiculos_panel')} isOpen={isOpen} />
            </>
          )}

          {verSeccionMarketing && (
            <>
                <div className="my-4 border-t border-dashed border-gray-200 mx-2"></div>
                <SectionTitle label="Marketing" isOpen={isOpen} />
                {verCentroDiseno && <MenuButton icon={<MdFormatPaint />} label="Centro de Diseño" active={activeModule === 'marketing_solicitudes'} onClick={() => setActiveModule('marketing_solicitudes')} isOpen={isOpen} />}
                {verEstudios && <MenuButton icon={<MdPoll />} label="Estudios Mercado" active={activeModule === 'marketing_estudios'} onClick={() => setActiveModule('marketing_estudios')} isOpen={isOpen} />}
                {verSocial && <MenuButton icon={<MdShare />} label="Social Media" active={activeModule === 'marketing_social'} onClick={() => setActiveModule('marketing_social')} isOpen={isOpen} />}
                {verPromociones && <MenuButton icon={<MdLocalOffer />} label="Promociones" active={activeModule === 'marketing_promociones'} onClick={() => setActiveModule('marketing_promociones')} isOpen={isOpen} />}
                {verColaboradores && <MenuButton icon={<MdPeople />} label="Colaboradores" active={activeModule === 'marketing_colaboradores'} onClick={() => setActiveModule('marketing_colaboradores')} isOpen={isOpen} />}
                {verImportar && <MenuButton icon={<MdOutlineCloudUpload />} label="Importar Puntos" active={activeModule === 'marketing_importar'} onClick={() => setActiveModule('marketing_importar')} isOpen={isOpen} />}
                {verLikeStore && <MenuButton icon={<MdCardGiftcard />} label="LikeStore (Canje)" active={activeModule === 'likestore'} onClick={() => setActiveModule('likestore')} isOpen={isOpen} />}
            </>
          )}
          
          {verSeccionRRHH && (
            <>
                <div className="my-4 border-t border-dashed border-gray-200 mx-2"></div>
                <SectionTitle label="Recursos Humanos" isOpen={isOpen} />
                {verMural && <MenuButton icon={<MdGroups />} label="Mural & Avisos" active={activeModule === 'rrhh_mural'} onClick={() => setActiveModule('rrhh_mural')} isOpen={isOpen} />}
                {verIncidencias && <MenuButton icon={<MdEventNote />} label="Incidencias" active={activeModule === 'rrhh_incidencias'} onClick={() => setActiveModule('rrhh_incidencias')} isOpen={isOpen} />}
                {verNomina && <MenuButton icon={<MdReceiptLong />} label="Nómina" active={activeModule === 'rrhh_nomina'} onClick={() => setActiveModule('rrhh_nomina')} isOpen={isOpen} />}
            </>
          )}
          
          {verSoporte && (
            <>
                <div className="my-4 border-t border-dashed border-gray-200 mx-2"></div>
                <SectionTitle label="Soporte IT" isOpen={isOpen} />
                <MenuButton icon={<MdEngineering />} label="Tickets" active={activeModule === 'soporte_tickets'} onClick={() => setActiveModule('soporte_tickets')} isOpen={isOpen} />
            </>
          )}

        </nav>

        <div className={`p-4 mx-4 mb-4 bg-gray-50 rounded-3xl flex items-center gap-3 transition-all border border-gray-100 ${!isOpen && 'md:justify-center md:px-0 md:mx-2'}`}>
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden shadow-sm">
                {usuario.foto ? <img src={usuario.foto} className="w-full h-full object-cover"/> : <FaUserCircle className="text-xl" />}
            </div>
            <div className={`flex-1 min-w-0 ${!isOpen && 'md:hidden'}`}>
                <p className="text-sm font-bold text-gray-800 truncate leading-tight">{usuario.nombre}</p>
                <p className="text-[10px] font-bold text-gray-400 truncate uppercase mt-0.5">{usuario.puesto || usuario.rol}</p>
                <button onClick={onLogout} className="text-[10px] text-red-500 font-bold hover:underline mt-1 flex items-center gap-1">
                   Cerrar Sesión
                </button>
            </div>
        </div>
      </aside>
    </>
  );
}

function MenuButton({ icon, label, active, onClick, isOpen }) {
  return (
    <button 
        onClick={onClick} 
        className={`
            group w-full flex items-center px-4 py-3 mb-1 rounded-2xl transition-all duration-300 ease-out 
            ${active 
                ? 'bg-[#DA291C] text-white shadow-lg shadow-red-500/30 font-bold' 
                : 'text-gray-500 hover:bg-red-50 hover:text-[#DA291C] font-medium'} 
            ${!isOpen && 'md:justify-center md:px-0 md:w-12 md:h-12 md:mx-auto md:mb-2'}
        `} 
        title={!isOpen ? label : ''}
    >
      <span className={`text-xl transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
      <span className={`ml-3.5 text-sm tracking-wide ${!isOpen && 'md:hidden'}`}>{label}</span>
    </button>
  );
}

function SectionTitle({ label, isOpen }) { 
    return <div className={`px-4 mt-4 mb-2 text-[10px] font-black text-gray-300 uppercase tracking-widest ${!isOpen && 'md:hidden'}`}>{label}</div>; 
}