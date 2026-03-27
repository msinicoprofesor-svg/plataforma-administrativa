/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnica/Cobertura.tsx (PREPARADO PARA MAPAS GIS)   */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic'; 
import { 
  MdMap, MdAdd, MdSearch, MdWifi, MdCable, MdClose, MdRouter, 
  MdLocationOn, MdDelete, MdPlace, MdBusiness, MdDomain, 
  MdAttachMoney, MdSpeed, MdCheckCircle, MdWarning, MdSwapHoriz,
  MdViewModule
} from "react-icons/md";

// IMPORTACIÓN DINÁMICA DE LOS DOS MAPAS
const MapaGlobal = dynamic(() => import('./MapaGlobal'), { 
    ssr: false, 
    loading: () => <div className="h-full w-full bg-gray-50 flex items-center justify-center animate-pulse"><MdMap className="text-4xl text-gray-300"/></div>
});

const MapaEditor = dynamic(() => import('./MapaEditor'), { 
    ssr: false, 
    loading: () => <div className="h-64 w-full bg-gray-100 rounded-2xl flex items-center justify-center animate-pulse"><MdMap className="text-3xl text-gray-300"/></div>
});

const SEDES = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const MARCAS = ['DMG NET', 'Intercheap', 'Fibrox MX', 'WifiCel'];

export default function Cobertura({ cobertura = [], onAgregarZona, onActualizarZona, usuarioActual }) {
  const [vistaActiva, setVistaActiva] = useState('TARJETAS'); 
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('TODAS');
  const [filtroMarca, setFiltroMarca] = useState('TODAS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  const [modalOpen, setModalOpen] = useState(false);
  const [zonaAConfigurar, setZonaAConfigurar] = useState(null);
  
  const [costos, setCostos] = useState({ instalacion: '', cambio: '' });
  const [planes, setPlanes] = useState([]); 
  const [nuevoPlan, setNuevoPlan] = useState({ velocidad: '', precio: '' });

  // ESTADOS DEL FORMULARIO DE NUEVA ZONA
  const [tipoTecnologia, setTipoTecnologia] = useState('FIBRA'); 
  const [datosZona, setDatosZona] = useState({ nombreAp: '', sede: 'Centro', marca: 'DMG NET', municipio: '', estado: 'Guanajuato' });
  const [coordenadas, setCoordenadas] = useState({ lat: '', lng: '' });
  const [cajasTemporales, setCajasTemporales] = useState([]);
  const [nuevaCaja, setNuevaCaja] = useState({ nombre: '', calles: '', puertos: 8, lat: '', lng: '' }); 
  const [comunidadesAP, setComunidadesAP] = useState([]); 
  const [nuevaComunidad, setNuevaComunidad] = useState('');

  // NUEVO: ESTADO PARA EL EDITOR DE MAPAS
  const [modoEdicionMapa, setModoEdicionMapa] = useState('ZONA'); // 'ZONA' | 'CAJA'

  const rol = usuarioActual?.rol || '';
  const esMarketing = ['GERENTE_MKT', 'DIRECTOR', 'ADMINISTRADOR'].includes(rol);

  const regionesDisponibles = useMemo(() => [...new Set(cobertura.map(z => z.sede).filter(Boolean))].sort(), [cobertura]);
  const marcasDisponibles = useMemo(() => [...new Set(cobertura.map(z => z.marca).filter(Boolean))].sort(), [cobertura]);

  const zonasFiltradas = useMemo(() => {
      return cobertura.filter(z => {
          const matchBusqueda = z.comunidad?.toLowerCase().includes(busqueda.toLowerCase()) || 
                                z.municipio?.toLowerCase().includes(busqueda.toLowerCase()) ||
                                z.nombreAp?.toLowerCase().includes(busqueda.toLowerCase());
          const matchRegion = filtroRegion === 'TODAS' || z.sede === filtroRegion;
          const matchMarca = filtroMarca === 'TODAS' || z.marca === filtroMarca;
          const matchTipo = filtroTipo === 'TODOS' || z.tipo === filtroTipo;
          return matchBusqueda && matchRegion && matchMarca && matchTipo;
      });
  }, [cobertura, busqueda, filtroRegion, filtroMarca, filtroTipo]);

  // EL MOTOR DE CLICS EN EL MAPA EDITOR
  const handleMapClick = (latlng) => {
      if (modoEdicionMapa === 'ZONA') {
          setCoordenadas({ lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) });
      } else {
          setNuevaCaja({ ...nuevaCaja, lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) });
      }
  };

  const agregarCajaALista = () => {
    if (!nuevaCaja.nombre || !nuevaCaja.calles) return alert("Faltan datos de la caja");
    if (!nuevaCaja.lat || !nuevaCaja.lng) return alert("Haz clic en el mapa para ubicar la caja.");
    setCajasTemporales([...cajasTemporales, { ...nuevaCaja, id: `TEMP-${Date.now()}` }]);
    setNuevaCaja({ nombre: '', calles: '', puertos: 8, lat: '', lng: '' }); 
    setModoEdicionMapa('ZONA'); // Regresa el mapa a modo zona
  };
  const eliminarCajaDeLista = (id) => setCajasTemporales(cajasTemporales.filter(c => c.id !== id));

  const agregarComunidad = () => {
      if (!nuevaComunidad.trim()) return;
      if (comunidadesAP.includes(nuevaComunidad.trim())) return alert("Ya agregaste esa comunidad");
      setComunidadesAP([...comunidadesAP, nuevaComunidad.trim()]);
      setNuevaComunidad('');
  };
  const eliminarComunidad = (com) => setComunidadesAP(comunidadesAP.filter(c => c !== com));

  const agregarPlan = () => {
      if (!nuevoPlan.velocidad || !nuevoPlan.precio) return alert("Completa velocidad y precio del plan");
      let vel = nuevoPlan.velocidad.toUpperCase();
      if (!vel.includes('MB')) vel += ' MB';
      setPlanes([...planes, { ...nuevoPlan, velocidad: vel, id: Date.now() }]);
      setNuevoPlan({ velocidad: '', precio: '' });
  };
  const eliminarPlan = (id) => setPlanes(planes.filter(p => p.id !== id));

  const guardarConfiguracionMarketing = (e) => {
      e.preventDefault();
      if (!costos.instalacion || !costos.cambio) return alert("Define los costos de instalación y cambio.");
      if (planes.length === 0) return alert("Debes agregar al menos un plan de internet.");

      const zonaActualizada = { ...zonaAConfigurar, costos: { instalacion: Number(costos.instalacion), cambio: Number(costos.cambio) }, planes: planes, estatus: 'ACTIVA' };
      onActualizarZona(zonaActualizada);
      setZonaAConfigurar(null);
      setCostos({ instalacion: '', cambio: '' });
      setPlanes([]);
  };

  const handleGuardarZona = (e) => {
    e.preventDefault();
    if (!datosZona.nombreAp || !datosZona.municipio) return alert("Faltan datos generales");
    if (!coordenadas.lat || !coordenadas.lng) return alert("Haz clic en el mapa para ubicar la antena/OLT central.");
    if (tipoTecnologia === 'ANTENA' && comunidadesAP.length === 0) return alert("Agrega comunidades.");
    if (tipoTecnologia === 'FIBRA' && cajasTemporales.length === 0) return alert("Configura y ubica al menos una caja NAP.");

    const zonaFinal = {
        id: `ZONA-${Date.now()}`, ...datosZona, tipo: tipoTecnologia,
        lat: coordenadas.lat, lng: coordenadas.lng,
        cajas: tipoTecnologia === 'FIBRA' ? cajasTemporales.map(c => ({
            id: `BOX-${Math.random().toString(36).substr(2,9)}`, nombre: c.nombre, calles: c.calles, puertosTotales: Number(c.puertos), puertosLibres: Number(c.puertos), lat: c.lat, lng: c.lng 
        })) : [],
        comunidades: tipoTecnologia === 'ANTENA' ? comunidadesAP : [],
        comunidad: tipoTecnologia === 'ANTENA' ? (comunidadesAP[0] || datosZona.nombreAp) : datosZona.nombreAp,
        estatus: 'PENDIENTE_PRECIOS', costos: { instalacion: 0, cambio: 0 }, planes: []
    };

    onAgregarZona(zonaFinal);
    setModalOpen(false);
    setDatosZona({ nombreAp: '', sede: 'Centro', marca: 'DMG NET', municipio: '', estado: 'Guanajuato' });
    setCajasTemporales([]); setComunidadesAP([]); setCoordenadas({ lat: '', lng: '' });
  };

  const scrollbarInvisible = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="bg-white p-6 rounded-t-[2rem] rounded-b-xl shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-2 shrink-0">
        <div>
            <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><MdMap className="text-blue-500" /> Cobertura y GIS</h2>
            <p className="text-sm text-gray-400 font-medium">Gestión de Infraestructura y Tarifas</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-full sm:w-auto shrink-0">
                <button onClick={() => setVistaActiva('TARJETAS')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaActiva === 'TARJETAS' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}><MdViewModule className="text-lg" /> Tarjetas</button>
                <button onClick={() => setVistaActiva('MAPA')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaActiva === 'MAPA' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}><MdMap className="text-lg" /> Mapa Global</button>
            </div>
            <button onClick={() => setModalOpen(true)} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><MdAdd className="text-xl" /> Nueva Zona</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-t-xl rounded-b-[2rem] shadow-sm border border-gray-100 mb-6 flex flex-col gap-3 shrink-0">
          <div className={`flex items-center gap-4 overflow-x-auto pb-1 ${scrollbarInvisible}`}>
              <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2 text-gray-500 min-w-[200px] shrink-0">
                  <MdSearch className="text-lg" /><input type="text" placeholder="Buscar zona o AP..." className="bg-transparent outline-none text-sm font-bold w-full" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <div className="w-px h-6 bg-gray-200 shrink-0"></div>
              <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Tipo:</span>
                  {['TODOS', 'FIBRA', 'ANTENA'].map(t => (
                      <button key={t} onClick={() => setFiltroTipo(t)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroTipo === t ? 'bg-gray-800 text-white shadow-sm' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{t === 'FIBRA' ? 'Fibra Óptica' : t}</button>
                  ))}
              </div>
              <div className="w-px h-6 bg-gray-200 shrink-0"></div>
              <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Región:</span>
                  <button onClick={() => setFiltroRegion('TODAS')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRegion === 'TODAS' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>Todas</button>
                  {regionesDisponibles.map(r => (<button key={r} onClick={() => setFiltroRegion(r)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRegion === r ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{r}</button>))}
              </div>
              <div className="w-px h-6 bg-gray-200 shrink-0"></div>
              <div className="flex items-center gap-2 shrink-0 pr-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Marca:</span>
                  <button onClick={() => setFiltroMarca('TODAS')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMarca === 'TODAS' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>Todas</button>
                  {marcasDisponibles.map(m => (<button key={m} onClick={() => setFiltroMarca(m)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMarca === m ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{m}</button>))}
              </div>
          </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
          {vistaActiva === 'TARJETAS' ? (
              <div className="h-full overflow-y-auto custom-scrollbar pb-10 pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {zonasFiltradas.length === 0 && (<div className="col-span-full text-center py-20 text-gray-300 font-bold uppercase tracking-widest">No hay zonas que coincidan con los filtros</div>)}
                      {zonasFiltradas.map((zona) => {
                          const esFibra = zona.tipo === 'FIBRA';
                          const pendiente = zona.estatus === 'PENDIENTE_PRECIOS';
                          let totalLibres = 0;
                          if (esFibra && zona.cajas) totalLibres = zona.cajas.reduce((acc, c) => acc + c.puertosLibres, 0);
                          
                          return (
                              <div key={zona.id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border transition-all relative overflow-hidden group ${pendiente ? 'border-orange-200 bg-orange-50/30' : 'border-gray-50 hover:shadow-md'}`}>
                                  <div className="flex justify-between items-start mb-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${esFibra ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>{esFibra ? <MdCable /> : <MdWifi />}</div>
                                      <div className="text-right">
                                          <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">{zona.sede}</span>
                                          {pendiente ? <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-md text-[10px] font-bold flex items-center justify-end gap-1"><MdWarning/> PENDIENTE</span> : <span className="px-2 py-1 bg-green-100 text-green-600 rounded-md text-[10px] font-bold flex items-center justify-end gap-1"><MdCheckCircle/> ACTIVA</span>}
                                      </div>
                                  </div>
                                  <h3 className="text-lg font-extrabold text-gray-800 leading-tight mb-1">{zona.nombreAp || zona.comunidad}</h3>
                                  <p className="text-xs text-gray-500 font-medium mb-3 flex items-center gap-1"><MdPlace className="text-gray-400" /> {zona.municipio}, {zona.estado}</p>

                                  {!pendiente && zona.costos && (
                                      <div className="flex flex-wrap gap-2 mb-4">
                                          <span className="text-[10px] bg-green-50 border border-green-100 px-2 py-1 rounded-lg font-bold text-green-700 flex items-center gap-1"><MdAttachMoney/> Inst: ${zona.costos.instalacion}</span>
                                          <span className="text-[10px] bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg font-bold text-blue-700 flex items-center gap-1"><MdSwapHoriz/> Camb: ${zona.costos.cambio}</span>
                                      </div>
                                  )}

                                  {pendiente && esMarketing && (
                                      <button onClick={() => { setZonaAConfigurar(zona); setPlanes([]); setCostos({instalacion: '', cambio: ''}); }} className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 mt-2 animate-pulse">
                                          <MdAttachMoney className="text-lg"/> Configurar Oferta
                                      </button>
                                  )}

                                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                                      {esFibra ? <p className="text-[10px] font-bold text-gray-400">{zona.cajas?.length || 0} Cajas NAP • {totalLibres} Puertos Libres</p> : <p className="text-[10px] font-bold text-gray-400">{zona.comunidades?.length || 0} Comunidades Cubiertas</p>}
                                      <button className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Ver Detalles</button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          ) : (
              <div className="h-full w-full bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-2 animate-fade-in">
                  <MapaGlobal zonas={zonasFiltradas} />
              </div>
          )}
      </div>

      {/* --- MODAL NUEVA ZONA CON EDITOR MAPA --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-extrabold text-gray-900">Agregar Zona</h2>
                    <button onClick={() => setModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><MdClose /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                    <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                        <button onClick={() => { setTipoTecnologia('FIBRA'); setModoEdicionMapa('ZONA'); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tipoTecnologia === 'FIBRA' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Fibra Óptica</button>
                        <button onClick={() => { setTipoTecnologia('ANTENA'); setModoEdicionMapa('ZONA'); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tipoTecnologia === 'ANTENA' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>Antena</button>
                    </div>
                    <form id="zonaForm" onSubmit={handleGuardarZona} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sede Operativa</label><div className="relative"><MdDomain className="absolute left-3 top-3.5 text-gray-400"/><select value={datosZona.sede} onChange={(e) => setDatosZona({...datosZona, sede: e.target.value})} className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm text-gray-700 appearance-none">{SEDES.map(s => <option key={s} value={s}>{s}</option>)}</select></div></div>
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2">Marca</label><div className="relative"><MdBusiness className="absolute left-3 top-3.5 text-gray-400"/><select value={datosZona.marca} onChange={(e) => setDatosZona({...datosZona, marca: e.target.value})} className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm text-gray-700 appearance-none">{MARCAS.map(m => <option key={m} value={m}>{m}</option>)}</select></div></div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2">{tipoTecnologia === 'FIBRA' ? 'Nombre Zona OLT' : 'Nombre del AP (Torre)'}</label><input required type="text" placeholder="Ej: Zona Centro" value={datosZona.nombreAp} onChange={(e) => setDatosZona({...datosZona, nombreAp: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-100 font-bold text-gray-800" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2">Municipio</label><input required type="text" placeholder="Ej: San Diego" value={datosZona.municipio} onChange={(e) => setDatosZona({...datosZona, municipio: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none outline-none font-medium text-gray-800" /></div>
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-2">Estado</label><input required type="text" placeholder="Ej: Guanajuato" value={datosZona.estado} onChange={(e) => setDatosZona({...datosZona, estado: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border-none outline-none font-medium text-gray-800" /></div>
                        </div>

                        {/* EL NUEVO EDITOR DE MAPA INCRUSTADO */}
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200 mt-6">
                            <h4 className="text-sm font-extrabold text-gray-800 mb-3 flex items-center gap-2"><MdMap className="text-blue-500"/> Ubicación Geográfica (Clic para ubicar)</h4>
                            
                            {/* SWITCH DE EDICIÓN PARA FIBRA ÓPTICA */}
                            {tipoTecnologia === 'FIBRA' && (
                                <div className="flex bg-gray-200/50 p-1 rounded-xl mb-3">
                                    <button type="button" onClick={() => setModoEdicionMapa('ZONA')} className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg transition-all ${modoEdicionMapa === 'ZONA' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400'}`}>1. OLT Principal</button>
                                    <button type="button" onClick={() => setModoEdicionMapa('CAJA')} className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg transition-all ${modoEdicionMapa === 'CAJA' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}>2. Cajas NAP</button>
                                </div>
                            )}

                            <MapaEditor 
                                posicionCentro={modoEdicionMapa === 'ZONA' ? coordenadas : nuevaCaja} 
                                setPosicion={handleMapClick} 
                                tipoPunto={modoEdicionMapa === 'ZONA' ? tipoTecnologia : 'CAJA'}
                                marcadoresExtra={cajasTemporales}
                            />
                            
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Latitud ({modoEdicionMapa === 'ZONA' ? 'OLT' : 'Caja'})</label><input readOnly value={modoEdicionMapa === 'ZONA' ? coordenadas.lat : nuevaCaja.lat} className="w-full px-4 py-2 bg-white rounded-xl text-xs border border-gray-100 text-gray-400 font-bold" /></div>
                                <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Longitud ({modoEdicionMapa === 'ZONA' ? 'OLT' : 'Caja'})</label><input readOnly value={modoEdicionMapa === 'ZONA' ? coordenadas.lng : nuevaCaja.lng} className="w-full px-4 py-2 bg-white rounded-xl text-xs border border-gray-100 text-gray-400 font-bold" /></div>
                            </div>
                        </div>

                        {/* COMUNIDADES ANTENA */}
                        {tipoTecnologia === 'ANTENA' && (
                            <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100"><h4 className="text-sm font-extrabold text-orange-800 mb-2 flex items-center gap-2"><MdPlace/> Comunidades Cubiertas</h4><div className="flex gap-2 mb-3"><input type="text" placeholder="Ej: La Soledad" value={nuevaComunidad} onChange={(e) => setNuevaComunidad(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarComunidad())} className="flex-1 px-4 py-2 bg-white rounded-xl text-sm outline-none border border-orange-200" /><button type="button" onClick={agregarComunidad} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600">Agregar</button></div><div className="flex flex-wrap gap-2">{comunidadesAP.map((com, idx) => (<span key={idx} className="px-3 py-1 bg-white border border-orange-200 text-orange-700 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">{com} <button type="button" onClick={() => eliminarComunidad(com)} className="text-orange-300 hover:text-red-500"><MdClose/></button></span>))}</div></div>
                        )}

                        {/* FORMULARIO DE CAJAS (Ya no pide coordenadas manuales) */}
                        {tipoTecnologia === 'FIBRA' && (
                            <div className="bg-green-50 p-5 rounded-3xl border border-green-100">
                                <h4 className="text-sm font-extrabold text-green-800 mb-2 flex items-center gap-2"><MdRouter/> Agregar Caja NAP</h4>
                                <p className="text-[10px] text-green-600 mb-3">*Asegúrate de haber seleccionado "2. Cajas NAP" arriba y dar clic en el mapa para ubicarla.</p>
                                <div className="space-y-3 mb-4">
                                    <input type="text" placeholder="Nombre (Ej: Caja 1)" value={nuevaCaja.nombre} onChange={(e) => setNuevaCaja({...nuevaCaja, nombre: e.target.value})} className="w-full px-4 py-2 bg-white rounded-xl text-sm border border-green-100 outline-none" />
                                    <input type="text" placeholder="Calles que abarca" value={nuevaCaja.calles} onChange={(e) => setNuevaCaja({...nuevaCaja, calles: e.target.value})} className="w-full px-4 py-2 bg-white rounded-xl text-sm border border-green-100 outline-none" />
                                    <div className="flex gap-2 items-center"><input type="number" placeholder="Puertos" value={nuevaCaja.puertos} onChange={(e) => setNuevaCaja({...nuevaCaja, puertos: e.target.value})} className="w-20 px-4 py-2 bg-white rounded-xl text-sm border border-green-100 outline-none text-center font-bold" /><button type="button" onClick={agregarCajaALista} className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Guardar Caja</button></div>
                                </div>
                                {cajasTemporales.length > 0 && <div className="space-y-2">{cajasTemporales.map((c, i) => (<div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-green-200 shadow-sm"><div><p className="text-xs font-bold text-gray-800">{c.nombre} <span className="text-[9px] text-green-500 bg-green-50 px-1 rounded ml-1">📍 {c.lat}</span></p><p className="text-[10px] text-gray-500">{c.puertos} puertos</p></div><button type="button" onClick={() => eliminarCajaDeLista(c.id)} className="text-red-400 hover:text-red-600"><MdDelete/></button></div>))}</div>}
                            </div>
                        )}
                    </form>
                </div>
                <div className="pt-6 border-t border-gray-100 mt-2">
                    <button type="submit" form="zonaForm" className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"><MdSave className="text-xl"/> Guardar Zona Completa</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL CONFIGURACIÓN MARKETING (Se queda igual de hermoso) --- */}
      {zonaAConfigurar && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">Oferta Comercial</h2>
                        <p className="text-xs text-gray-500 font-bold">{zonaAConfigurar.nombreAp}</p>
                    </div>
                    <button onClick={() => setZonaAConfigurar(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><MdClose /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                        <h4 className="text-xs font-black text-gray-400 uppercase mb-3">Costos de Contratación</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-bold text-green-600 uppercase mb-1">Instalación Nueva ($)</label><input type="number" placeholder="Ej: 1500" value={costos.instalacion} onChange={(e) => setCostos({...costos, instalacion: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl outline-none font-bold text-gray-800 border border-gray-200 focus:border-green-400" /></div>
                            <div><label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Cambio Prov. ($)</label><input type="number" placeholder="Ej: 500" value={costos.cambio} onChange={(e) => setCostos({...costos, cambio: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl outline-none font-bold text-gray-800 border border-gray-200 focus:border-blue-400" /></div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-xs font-black text-gray-400 uppercase mb-3">Planes de Velocidad</h4>
                        <div className="flex gap-2 mb-3"><input type="text" placeholder="Ej: 50" value={nuevoPlan.velocidad} onChange={(e) => setNuevoPlan({...nuevoPlan, velocidad: e.target.value})} className="w-24 px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200" /><span className="self-center font-bold text-gray-400 text-xs">MB</span><span className="self-center font-bold text-gray-400 text-sm ml-2">$</span><input type="number" placeholder="Precio" value={nuevoPlan.precio} onChange={(e) => setNuevoPlan({...nuevoPlan, precio: e.target.value})} className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-sm outline-none border border-gray-200" /><button type="button" onClick={agregarPlan} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">Agregar</button></div>
                        <div className="space-y-2">
                            {planes.map((p) => (
                                <div key={p.id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                    <div><p className="font-extrabold text-gray-800 text-sm flex items-center gap-2"><MdSpeed className="text-blue-500"/> {p.velocidad}</p><p className="text-xs text-gray-500 font-bold">${p.precio} / mes</p></div><button onClick={() => eliminarPlan(p.id)} className="text-red-400 hover:text-red-600 p-2"><MdDelete/></button>
                                </div>
                            ))}
                            {planes.length === 0 && <p className="text-center text-xs text-gray-400 italic py-4">Agrega al menos un plan para activar la zona.</p>}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button onClick={guardarConfiguracionMarketing} className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                        <MdCheckCircle className="text-xl" /> Activar Zona
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}