/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/PanelVentas.tsx (CUPONES INTELIGENTES)      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo, useEffect } from 'react';
import { 
  MdAddShoppingCart, MdPerson, MdLocationOn, MdRouter, MdAttachMoney, 
  MdSignalCellularAlt, MdCheckCircle, MdSearch, MdMap, MdCameraAlt, MdWifiTethering, 
  MdDns, MdSettingsInputAntenna, MdDescription, MdWarning, MdVerified, MdSwapHoriz, 
  MdFiberNew, MdDelete, MdLocalOffer, MdClose, MdBarChart, MdAssignment
} from "react-icons/md";

// IMPORTAR EL NUEVO MÓDULO ANALÍTICO
import AnaliticaVentas from './AnaliticaVentas';

// --- CATÁLOGOS ESTÁTICOS ---
const REGIONES = [
  'Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 
  'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'
];

const PRECIOS_KITS = {
    'Kit 2 Cámaras': 3500,
    'Kit 4 Cámaras': 5800,
    'Kit 6 Cámaras': 8200,
    'Kit 8 Cámaras': 10500,
    'Cotización Especial': 0 
};

const CONFIG_MARCAS = {
  'DMG NET': { tipo: 'INTERNET', tecnologias: ['FIBRA', 'ANTENA'] },
  'Intercheap': { tipo: 'INTERNET', tecnologias: ['FIBRA', 'ANTENA'] },
  'Fibrox MX': { tipo: 'INTERNET', tecnologias: ['FIBRA'] },
  'RK': { tipo: 'CCTV', opciones: Object.keys(PRECIOS_KITS) },
  'WifiCel': { tipo: 'HOTSPOT', opciones: ['Sistema por Fichas', 'Máquina de Monedas'] }
};

export default function PanelVentas({ ventas, cobertura, cupones, onRegistrarVenta, vendedorActual, validarCupon }) {
  
  // VERIFICAR PERMISOS GERENCIALES PARA MOSTRAR LA PESTAÑA DE ANALÍTICA
  const rolNormalizado = (vendedorActual?.rol || '').toUpperCase();
  const ROLES_GERENCIALES = ['GERENTE_MKT', 'GERENTE MARKETING', 'GERENTE_GENERAL', 'GERENTE GENERAL', 'DIRECTOR', 'ADMINISTRADOR', 'SOPORTE_GENERAL'];
  const esGerencia = ROLES_GERENCIALES.includes(rolNormalizado);

  // ESTADO DE LAS PESTAÑAS
  const [tabActiva, setTabActiva] = useState('MIS_VENTAS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const [form, setForm] = useState({
    nombre: '', telefono1: '', telefono2: '',
    estado: 'Guanajuato', municipio: '', comunidad: '', direccion: '', 
    gps: '', referencias: '',
    region: 'Centro', marca: 'DMG NET', 
    tipoServicio: 'INTERNET', tecnologia: 'FIBRA', velocidad: '',
    paquete: '', precioEquipo: 0,
    costoInstalacion: '', mensualidad: '',
    fechaConexion: '', horaConexion: '',
    zonaId: '', cajaId: '',
    requiereVerificacion: false,
    tipoVenta: 'NUEVA', 
    fotosEvidencia: { router: null, antena: null },
    codigoCupon: '', cuponAplicado: null  
  });

  const [mensajeCupon, setMensajeCupon] = useState({ texto: '', tipo: '' });

  const zonasDisponibles = useMemo(() => {
    if (form.tipoServicio !== 'INTERNET') return [];
    return cobertura.filter(zona => {
        const coincideRegion = zona.sede === form.region;
        const coincideTecnologia = zona.tipo === form.tecnologia;
        return coincideRegion && coincideTecnologia && zona.estatus === 'ACTIVA';
    });
  }, [cobertura, form.region, form.tecnologia, form.tipoServicio]);

  const zonaSeleccionadaData = useMemo(() => {
      if (!form.zonaId) return null;
      return cobertura.find(z => z.id === form.zonaId);
  }, [form.zonaId, cobertura]);

  const cajasDisponibles = useMemo(() => {
     if (form.tecnologia !== 'FIBRA' || !zonaSeleccionadaData) return [];
     return zonaSeleccionadaData.cajas || [];
  }, [zonaSeleccionadaData, form.tecnologia]);

  const planesDisponibles = useMemo(() => {
      return zonaSeleccionadaData?.planes || [];
  }, [zonaSeleccionadaData]);

  const apSugerido = useMemo(() => {
      if (form.tecnologia !== 'ANTENA' || !form.comunidad || form.comunidad.length < 3) return null;
      return cobertura.find(z => 
          z.tipo === 'ANTENA' && z.sede === form.region && z.estatus === 'ACTIVA' &&
          z.comunidades && z.comunidades.some(c => c.toLowerCase().includes(form.comunidad.toLowerCase()))
      );
  }, [cobertura, form.comunidad, form.tecnologia, form.region]);

  useEffect(() => {
      if (apSugerido) {
          setForm(prev => ({ ...prev, zonaId: apSugerido.id, requiereVerificacion: false }));
      } else if (form.tecnologia === 'ANTENA' && form.comunidad.length > 3) {
          setForm(prev => ({ ...prev, zonaId: '', requiereVerificacion: true }));
      }
  }, [apSugerido, form.comunidad, form.tecnologia]);

  const calcularDescuento = (precioBase, cupon) => {
      if (!cupon) return precioBase;
      let descuento = 0;
      if (cupon.tipoDescuento === 'MONTO_FIJO') descuento = cupon.valor;
      if (cupon.tipoDescuento === 'PORCENTAJE') descuento = precioBase * (cupon.valor / 100);
      return Math.max(0, precioBase - descuento);
  };

  useEffect(() => {
      if (zonaSeleccionadaData && zonaSeleccionadaData.costos) {
          let precioBase = form.tipoVenta === 'NUEVA' ? zonaSeleccionadaData.costos.instalacion : zonaSeleccionadaData.costos.cambio;
          if (form.cuponAplicado && form.cuponAplicado.aplicarA === 'INSTALACION') precioBase = calcularDescuento(precioBase, form.cuponAplicado);
          setForm(prev => ({ ...prev, costoInstalacion: precioBase }));
      }
      if (form.velocidad && planesDisponibles.length > 0) {
          const plan = planesDisponibles.find(p => p.velocidad === form.velocidad);
          if (plan) {
              let precioMes = plan.precio;
              if (form.cuponAplicado && form.cuponAplicado.aplicarA === 'MENSUALIDAD') precioMes = calcularDescuento(precioMes, form.cuponAplicado);
              setForm(prev => ({ ...prev, mensualidad: precioMes }));
          }
      }
  }, [zonaSeleccionadaData, form.tipoVenta, form.velocidad, form.cuponAplicado, planesDisponibles]);

  const cuponesSugeridos = useMemo(() => {
      if (!cupones) return [];
      const hoy = new Date().toISOString().split('T')[0];
      return cupones.filter(c => {
          if (!c.activo || c.vigencia < hoy || (c.limite !== null && c.usados >= c.limite)) return false;
          if (c.restricciones.sede !== 'TODAS' && c.restricciones.sede !== form.region) return false;
          if (c.restricciones.marca !== 'TODAS' && c.restricciones.marca !== form.marca) return false;
          if (c.restricciones.zonaId && c.restricciones.zonaId !== 'TODAS') {
              if (!form.zonaId || c.restricciones.zonaId !== form.zonaId) return false;
          }
          return true;
      });
  }, [cupones, form.region, form.marca, form.zonaId]);

  const handleAplicarCupon = (codigoManual = null) => {
      const codigo = codigoManual || form.codigoCupon;
      if (!codigo) return;
      const resultado = validarCupon(codigo, { sede: form.region, marca: form.marca, zonaId: form.zonaId });
      if (resultado.valido) {
          setForm(prev => ({ ...prev, codigoCupon: codigo, cuponAplicado: resultado.datos }));
          setMensajeCupon({ texto: `¡${resultado.mensaje}!`, tipo: 'exito' });
      } else {
          setForm(prev => ({ ...prev, cuponAplicado: null }));
          setMensajeCupon({ texto: resultado.mensaje, tipo: 'error' });
      }
  };

  const handleQuitarCupon = () => {
      setForm(prev => ({ ...prev, codigoCupon: '', cuponAplicado: null }));
      setMensajeCupon({ texto: '', tipo: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'marca') {
      const config = CONFIG_MARCAS[value];
      const esInternet = config.tipo === 'INTERNET';
      setForm(prev => ({
        ...prev, marca: value, tipoServicio: config.tipo,
        tecnologia: esInternet ? config.tecnologias[0] : '',
        paquete: '', precioEquipo: 0, zonaId: '', cajaId: '', mensualidad: '', velocidad: '',
        tipoVenta: 'NUEVA', fotosEvidencia: { router: null, antena: null },
        codigoCupon: '', cuponAplicado: null
      }));
      setMensajeCupon({ texto: '', tipo: '' });
    } 
    else if (name === 'paquete' && form.tipoServicio === 'CCTV') {
        setForm(prev => ({ ...prev, paquete: value, precioEquipo: PRECIOS_KITS[value] || 0 }));
    }
    else if (name === 'region' || name === 'tecnologia') {
        setForm(prev => ({ ...prev, [name]: value, zonaId: '', cajaId: '', velocidad: '', mensualidad: '', costoInstalacion: '' }));
        if(name === 'region') {
             setForm(prev => ({ ...prev, [name]: value, codigoCupon: '', cuponAplicado: null }));
             setMensajeCupon({ texto: '', tipo: '' });
        }
    }
    else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEvidenciaUpload = (tipoFoto, e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 500 * 1024) return alert("La imagen es muy pesada. Máximo 500KB.");
          const reader = new FileReader();
          reader.onloadend = () => { setForm(prev => ({ ...prev, fotosEvidencia: { ...prev.fotosEvidencia, [tipoFoto]: reader.result } })); };
          reader.readAsDataURL(file);
      }
  };

  const removeEvidencia = (tipoFoto) => setForm(prev => ({ ...prev, fotosEvidencia: { ...prev.fotosEvidencia, [tipoFoto]: null } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const datosFinales = { ...form };
    
    if (form.requiereVerificacion && form.tecnologia === 'ANTENA') {
        datosFinales.referencias += " [SOLICITUD VERIFICACIÓN]";
        datosFinales.zonaId = 'PENDIENTE_VERIFICACION'; 
    }
    if (form.tipoVenta === 'CAMBIO') datosFinales.referencias += " [CAMBIO PROVEEDOR]";
    if (form.cuponAplicado) datosFinales.referencias += ` [CUPÓN: ${form.cuponAplicado.codigo}]`;

    onRegistrarVenta(datosFinales, vendedorActual);
    setIsModalOpen(false);
    
    setForm({
      nombre: '', telefono1: '', telefono2: '', 
      estado: 'Guanajuato', municipio: '', comunidad: '', direccion: '', gps: '', referencias: '',
      region: 'Centro', marca: 'DMG NET', tipoServicio: 'INTERNET', tecnologia: 'FIBRA',
      velocidad: '', paquete: '', precioEquipo: 0, costoInstalacion: '', mensualidad: '',
      fechaConexion: '', horaConexion: '', zonaId: '', cajaId: '', requiereVerificacion: false,
      tipoVenta: 'NUEVA', fotosEvidencia: { router: null, antena: null },
      codigoCupon: '', cuponAplicado: null
    });
    setMensajeCupon({ texto: '', tipo: '' });
  };

  const misVentas = ventas.filter(v => v.vendedor?.id === vendedorActual?.id);

  return (
    <div className="h-full flex flex-col">
        
        {/* SISTEMA DE PESTAÑAS (SÓLO VISIBLE PARA GERENCIA) */}
        {esGerencia && (
            <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6 w-full max-w-sm mx-auto z-10 shrink-0">
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
            </div>
        )}

        <div className="flex-1 min-h-0 relative">
            {/* VISTA 1: CAPTURA DE VENTAS DEL USUARIO (VISTA ORIGINAL) */}
            {tabActiva === 'MIS_VENTAS' && (
                <div className="flex flex-col h-full animate-fade-in absolute inset-0">
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
                <div className="absolute inset-0">
                    <AnaliticaVentas ventas={ventas} />
                </div>
            )}
        </div>

      {/* MODAL NUEVA VENTA (PERMANECE IGUAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div><h2 className="text-xl font-extrabold text-gray-800">Registrar Venta</h2><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Formulario de Contratación</p></div>
                    <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all">✕</button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                    {/* CLIENTE Y UBICACIÓN */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest border-b border-gray-100 pb-2">Cliente y Ubicación</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Nombre Completo</label><input required name="nombre" value={form.nombre} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-red-100 text-sm font-bold text-gray-800" placeholder="Ej: Don Clemente" /></div>
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Teléfonos</label><div className="flex gap-2"><input required name="telefono1" value={form.telefono1} onChange={handleChange} className="w-1/2 px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-red-100 text-sm font-bold text-gray-800" placeholder="Principal" /><input name="telefono2" value={form.telefono2} onChange={handleChange} className="w-1/2 px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-red-100 text-sm font-bold text-gray-800" placeholder="Alterno" /></div></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                             <div><label className="text-[10px] font-bold text-blue-400 uppercase ml-3">Sede Operativa</label><div className="relative"><MdMap className="absolute left-3 top-3.5 text-blue-300 text-lg" /><select name="region" value={form.region} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-200 text-sm font-bold text-gray-700 appearance-none cursor-pointer">{REGIONES.map(r => <option key={r} value={r}>{r}</option>)}</select></div></div>
                             <div><label className="text-[10px] font-bold text-blue-400 uppercase ml-3">Marca / Empresa</label><div className="relative"><MdSignalCellularAlt className="absolute left-3 top-3.5 text-blue-300 text-lg" /><select name="marca" value={form.marca} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-200 text-sm font-bold text-gray-700 appearance-none cursor-pointer">{Object.keys(CONFIG_MARCAS).map(m => <option key={m} value={m}>{m}</option>)}</select></div></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Estado</label><input name="estado" value={form.estado} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-800" placeholder="Estado" /></div>
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Municipio</label><input name="municipio" value={form.municipio} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-800" placeholder="Municipio" /></div>
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Comunidad</label><input name="comunidad" value={form.comunidad} onChange={handleChange} className={`w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-800 transition-colors ${apSugerido ? 'bg-green-50 ring-2 ring-green-100' : ''}`} placeholder="Comunidad" /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Calle y Número</label><input required name="direccion" value={form.direccion} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-red-100 text-sm font-bold text-gray-800" placeholder="Calle, Número, Colonia" /></div>
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Coordenadas GPS</label><input required name="gps" value={form.gps} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-red-100 text-sm font-bold text-gray-800" placeholder="Pegar ubicación Maps" /></div>
                        </div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Referencias / Notas</label><div className="relative"><MdDescription className="absolute left-3 top-3.5 text-gray-400 text-lg" /><textarea name="referencias" value={form.referencias} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-red-100 text-sm font-bold text-gray-800 resize-none h-24" placeholder="Ej: Casa blanca de dos pisos, portón negro..." /></div></div>
                    </div>

                    {/* CONFIGURACIÓN SERVICIO */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest pb-2">Configuración del Servicio</h3>

                        {CONFIG_MARCAS[form.marca].tipo === 'INTERNET' && (
                            <>
                                <div className="flex p-1 bg-gray-100 rounded-2xl mb-4">
                                    <button type="button" onClick={() => setForm({...form, tipoVenta: 'NUEVA'})} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${form.tipoVenta === 'NUEVA' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}><MdFiberNew className="text-lg" /> Instalación Nueva</button>
                                    <button type="button" onClick={() => setForm({...form, tipoVenta: 'CAMBIO'})} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${form.tipoVenta === 'CAMBIO' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}><MdSwapHoriz className="text-lg" /> Cambio Proveedor</button>
                                </div>

                                <div className={`p-4 rounded-2xl mb-4 transition-colors ${apSugerido ? 'bg-green-50 border border-green-100' : form.requiereVerificacion ? 'bg-orange-50 border border-orange-100' : 'bg-gray-100'}`}>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-3 mb-1 block">Infraestructura</label>
                                    {apSugerido && <div className="flex items-center gap-2 text-green-700 text-xs font-bold mb-3 bg-green-100/50 p-2 rounded-lg"><MdVerified className="text-lg" /> {apSugerido.nombreAp} cubre {form.comunidad}.</div>}
                                    {form.requiereVerificacion && <div className="flex items-center gap-2 text-orange-700 text-xs font-bold mb-3 bg-orange-100/50 p-2 rounded-lg"><MdWarning className="text-lg" /> Verificación requerida.</div>}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative"><MdDns className="absolute left-3 top-3.5 text-gray-400 text-lg" /><select name="zonaId" value={form.zonaId} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer shadow-sm"><option value="">-- Zona / AP --</option>{zonasDisponibles.map(z => (<option key={z.id} value={z.id}>{z.nombreAp || z.comunidad} ({z.municipio})</option>))}</select></div>
                                        {form.tecnologia === 'FIBRA' && (<div className="relative"><MdRouter className="absolute left-3 top-3.5 text-gray-400 text-lg" /><select name="cajaId" value={form.cajaId} onChange={handleChange} disabled={!form.zonaId} className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer shadow-sm disabled:opacity-50"><option value="">-- Caja NAP --</option>{cajasDisponibles.map(c => (<option key={c.id} value={c.id}>{c.nombre} ({c.puertosLibres} Disp.)</option>))}</select></div>)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Tecnología</label><select name="tecnologia" value={form.tecnologia} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-800 cursor-pointer">{CONFIG_MARCAS[form.marca].tecnologias.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Plan de Velocidad</label>
                                        <select name="velocidad" value={form.velocidad} onChange={handleChange} disabled={!form.zonaId} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-800 cursor-pointer disabled:bg-gray-100 disabled:text-gray-400">
                                            <option value="">-- Seleccionar Plan --</option>
                                            {planesDisponibles.map(p => (<option key={p.velocidad} value={p.velocidad}>{p.velocidad} - ${p.precio}</option>))}
                                        </select>
                                        {planesDisponibles.length === 0 && form.zonaId && <p className="text-[9px] text-red-400 ml-2 mt-1">Zona sin planes configurados.</p>}
                                    </div>
                                </div>

                                {form.tipoVenta === 'CAMBIO' && (
                                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 animate-fade-in mt-4">
                                        <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2"><MdCameraAlt /> Evidencia Equipo Actual</h4>
                                        <div className="flex gap-4 overflow-x-auto">
                                            <div className="flex flex-col items-center"><label className="cursor-pointer group relative w-20 h-20 bg-white rounded-xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center hover:border-purple-400 transition-all overflow-hidden">{form.fotosEvidencia.router ? <img src={form.fotosEvidencia.router} className="w-full h-full object-cover" /> : <MdRouter className="text-2xl text-purple-300" />}<input type="file" className="hidden" accept="image/*" onChange={(e) => handleEvidenciaUpload('router', e)} /></label><span className="text-[10px] font-bold text-purple-500 mt-1">Router/Modem</span>{form.fotosEvidencia.router && <button type="button" onClick={() => removeEvidencia('router')} className="text-red-400 text-xs mt-1"><MdDelete/></button>}</div>
                                            {form.tecnologia === 'ANTENA' && (<div className="flex flex-col items-center"><label className="cursor-pointer group relative w-20 h-20 bg-white rounded-xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center hover:border-purple-400 transition-all overflow-hidden">{form.fotosEvidencia.antena ? <img src={form.fotosEvidencia.antena} className="w-full h-full object-cover" /> : <MdSettingsInputAntenna className="text-2xl text-purple-300" />}<input type="file" className="hidden" accept="image/*" onChange={(e) => handleEvidenciaUpload('antena', e)} /></label><span className="text-[10px] font-bold text-purple-500 mt-1">Antena Ext.</span>{form.fotosEvidencia.antena && <button type="button" onClick={() => removeEvidencia('antena')} className="text-red-400 text-xs mt-1"><MdDelete/></button>}</div>)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {form.marca === 'RK' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Paquete CCTV</label><select name="paquete" value={form.paquete} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-800 cursor-pointer"><option value="">-- Seleccionar Kit --</option>{CONFIG_MARCAS['RK'].opciones.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Precio Equipo (Base)</label><div className="relative"><MdAttachMoney className="absolute left-3 top-3.5 text-gray-400 text-lg" /><input disabled value={form.precioEquipo} className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none text-sm font-bold text-gray-500" /></div></div>
                            </div>
                        )}

                        {form.marca === 'WifiCel' && (
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Tipo de Hotspot</label><div className="relative"><MdSettingsInputAntenna className="absolute left-3 top-3.5 text-gray-400 text-lg" /><select name="paquete" value={form.paquete} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-800 cursor-pointer"><option value="">-- Seleccionar Sistema --</option>{CONFIG_MARCAS['WifiCel'].opciones.map(o => <option key={o} value={o}>{o}</option>)}</select></div></div>
                        )}

                        <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                            <label className="text-[10px] font-bold text-orange-400 uppercase mb-2 block flex items-center gap-1"><MdLocalOffer/> Promoción / Cupón</label>
                            
                            {cuponesSugeridos.length > 0 && !form.cuponAplicado && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {cuponesSugeridos.map(c => (
                                        <button 
                                            type="button" 
                                            key={c.id} 
                                            onClick={() => handleAplicarCupon(c.codigo)}
                                            className="text-[10px] bg-white border border-orange-200 text-orange-600 px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-orange-50 flex items-center gap-1 transition-all"
                                        >
                                            <MdLocalOffer/> {c.codigo} (-{c.valor}{c.tipoDescuento === 'PORCENTAJE' ? '%' : '$'})
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Código Manual" 
                                    value={form.codigoCupon}
                                    onChange={(e) => setForm({...form, codigoCupon: e.target.value.toUpperCase()})}
                                    disabled={!!form.cuponAplicado}
                                    className="flex-1 px-4 py-2 bg-white rounded-xl outline-none text-sm font-bold text-gray-800 border border-orange-200 uppercase disabled:bg-gray-100"
                                />
                                {form.cuponAplicado ? (
                                    <button type="button" onClick={handleQuitarCupon} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-xs hover:bg-red-200 flex items-center gap-1"><MdClose/> Quitar</button>
                                ) : (
                                    <button type="button" onClick={() => handleAplicarCupon()} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-orange-600">Aplicar</button>
                                )}
                            </div>
                            {mensajeCupon.texto && (
                                <p className={`text-[10px] font-bold mt-2 ${mensajeCupon.tipo === 'exito' ? 'text-green-600' : 'text-red-500'}`}>
                                    {mensajeCupon.texto} {form.cuponAplicado && `(Descuento en ${form.cuponAplicado.aplicarA})`}
                                </p>
                            )}
                        </div>

                        {/* COSTOS FINALES */}
                        <div className="grid grid-cols-2 gap-4">
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Instalación ($)</label><input type="number" name="costoInstalacion" value={form.costoInstalacion} onChange={handleChange} className="w-full px-4 py-3 bg-green-50 rounded-xl outline-none focus:ring-2 focus:ring-green-100 text-sm font-bold text-green-700" placeholder="0.00" /></div>
                             {CONFIG_MARCAS[form.marca].tipo === 'INTERNET' && (
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-3">Mensualidad ($)</label><input type="number" name="mensualidad" value={form.mensualidad} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-100 text-sm font-bold text-gray-800" placeholder="0.00" /></div>
                             )}
                        </div>

                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <label className="text-[10px] font-bold text-orange-400 uppercase mb-2 block">Preferencia del Cliente (Sugerido)</label>
                            <div className="flex gap-2"><input type="date" name="fechaConexion" value={form.fechaConexion} onChange={handleChange} className="w-2/3 px-4 py-3 bg-white rounded-xl outline-none text-sm font-bold text-gray-700" /><input type="time" name="horaConexion" value={form.horaConexion} onChange={handleChange} className="w-1/3 px-4 py-3 bg-white rounded-xl outline-none text-sm font-bold text-gray-700" /></div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-100 rounded-2xl transition-all">Cancelar</button>
                        <button type="submit" className="flex-1 py-4 bg-[#DA291C] text-white font-bold rounded-2xl shadow-xl hover:bg-[#b02117] transition-all flex items-center justify-center gap-2">
                            <MdCheckCircle className="text-xl" /> Registrar Venta
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}