/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnica/Cobertura.tsx (CON GIS AVANZADO Y EDICIÓN) */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic'; 
import { 
  MdMap, MdAdd, MdSearch, MdWifi, MdCable, MdClose, MdRouter, 
  MdLocationOn, MdDelete, MdPlace, MdBusiness, MdDomain, 
  MdAttachMoney, MdSpeed, MdCheckCircle, MdWarning, MdSwapHoriz,
  MdViewModule, MdSave, MdEdit, MdFilterList
} from "react-icons/md";

const MapaGlobal = dynamic(() => import('./MapaGlobal'), { ssr: false, loading: () => <div className="h-full w-full bg-gray-50 flex items-center justify-center animate-pulse"><MdMap className="text-4xl text-gray-300"/></div> });
const MapaEditor = dynamic(() => import('./MapaEditor'), { ssr: false, loading: () => <div className="h-full w-full min-h-[300px] bg-gray-100 rounded-[2rem] flex items-center justify-center animate-pulse"><MdMap className="text-3xl text-gray-300"/></div> });

const SEDES = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const MARCAS = ['DMG NET', 'Intercheap', 'Fibrox MX', 'WifiCel'];

export default function Cobertura({ cobertura = [], onAgregarZona, onActualizarZona, eliminarZona, usuarioActual }) {
  const [vistaActiva, setVistaActiva] = useState('TARJETAS'); 
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false); // NUEVO ESTADO PARA EL ACORDEÓN DE FILTROS

  const [busqueda, setBusqueda] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('TODAS');
  const [filtroMarca, setFiltroMarca] = useState('TODAS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  const [modalOpen, setModalOpen] = useState(false);
  const [zonaAConfigurar, setZonaAConfigurar] = useState(null);
  const [zonaDetalles, setZonaDetalles] = useState(null); 
  const [editandoZonaId, setEditandoZonaId] = useState(null); 
  
  const [costos, setCostos] = useState({ instalacion: '', cambio: '' });
  const [planes, setPlanes] = useState([]); 
  const [nuevoPlan, setNuevoPlan] = useState({ velocidad: '', precio: '' });

  const [tipoTecnologia, setTipoTecnologia] = useState('FIBRA'); 
  const [datosZona, setDatosZona] = useState({ nombreAp: '', sede: 'Centro', marca: 'DMG NET', municipio: '', estado: 'Guanajuato' });
  const [coordenadas, setCoordenadas] = useState({ lat: '', lng: '' });
  const [cajasTemporales, setCajasTemporales] = useState([]);
  const [nuevaCaja, setNuevaCaja] = useState({ nombre: '', calles: '', puertos: 8, lat: '', lng: '' }); 
  const [comunidadesAP, setComunidadesAP] = useState([]); 
  const [nuevaComunidad, setNuevaComunidad] = useState('');

  const [coberturaGeo, setCoberturaGeo] = useState({ radio: 3000, anguloInicio: 0, amplitud: 360, poligono: [] });
  const [modoEdicionMapa, setModoEdicionMapa] = useState('ZONA');

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

  const abrirModalNuevaZona = () => {
      setEditandoZonaId(null);
      setDatosZona({ nombreAp: '', sede: 'Centro', marca: 'DMG NET', municipio: '', estado: 'Guanajuato' });
      setCoordenadas({ lat: '', lng: '' }); setCajasTemporales([]); setComunidadesAP([]);
      setCoberturaGeo({ radio: 3000, anguloInicio: 0, amplitud: 360, poligono: [] });
      setModalOpen(true);
  };

  const abrirModalEditarZona = (zona) => {
      setEditandoZonaId(zona.id);
      setTipoTecnologia(zona.tipo);
      setDatosZona({ nombreAp: zona.nombreAp || zona.comunidad, sede: zona.sede, marca: zona.marca, municipio: zona.municipio, estado: zona.estado });
      setCoordenadas({ lat: zona.lat, lng: zona.lng });
      setCajasTemporales(zona.cajas || []);
      setComunidadesAP(zona.comunidades || []);
      setCoberturaGeo(zona.coberturaGeo || { radio: 3000, anguloInicio: 0, amplitud: 360, poligono: [] });
      setModalOpen(true);
  };

  const handleMapClick = (latlng) => {
      if (modoEdicionMapa === 'ZONA') setCoordenadas({ lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) });
      else setNuevaCaja({ ...nuevaCaja, lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) });
  };

  const agregarCajaALista = () => {
    if (!nuevaCaja.nombre || !nuevaCaja.lat) return alert("Faltan datos o ubicación en el mapa");
    setCajasTemporales([...cajasTemporales, { ...nuevaCaja, id: `TEMP-${Date.now()}` }]);
    setNuevaCaja({ nombre: '', calles: '', puertos: 8, lat: '', lng: '' }); 
    setModoEdicionMapa('ZONA');
  };
  const eliminarCajaDeLista = (id) => setCajasTemporales(cajasTemporales.filter(c => c.id !== id));

  const agregarComunidad = () => {
      if (!nuevaComunidad.trim() || comunidadesAP.includes(nuevaComunidad.trim())) return;
      setComunidadesAP([...comunidadesAP, nuevaComunidad.trim()]);
      setNuevaComunidad('');
  };
  const eliminarComunidad = (com) => setComunidadesAP(comunidadesAP.filter(c => c !== com));

  const handleGuardarZona = (e) => {
    e.preventDefault();
    if (!datosZona.nombreAp || !datosZona.municipio || !coordenadas.lat) return alert("Faltan datos generales o ubicación central.");
    
    const cajasFormateadas = cajasTemporales.map(c => ({
        ...c,
        puertosTotales: Number(c.puertos),
        puertosLibres: c.puertosLibres !== undefined ? Number(c.puertosLibres) : Number(c.puertos)
    }));

    const payload = {
        ...datosZona, tipo: tipoTecnologia, lat: coordenadas.lat, lng: coordenadas.lng,
        cajas: tipoTecnologia === 'FIBRA' ? cajasFormateadas : [],
        comunidades: tipoTecnologia === 'ANTENA' ? comunidadesAP : [],
        comunidad: tipoTecnologia === 'ANTENA' ? (comunidadesAP[0] || datosZona.nombreAp) : datosZona.nombreAp,
        coberturaGeo: coberturaGeo
    };

    if (editandoZonaId) {
        onActualizarZona({ ...cobertura.find(z => z.id === editandoZonaId), ...payload });
    } else {
        onAgregarZona({ ...payload, estatus: 'PENDIENTE_PRECIOS', costos: { instalacion: 0, cambio: 0 }, planes: [] });
    }
    setModalOpen(false);
  };

  const scrollbarInvisible = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4 shrink-0 border border-gray-100 relative z-10">
        <div><h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><MdMap className="text-blue-500" /> Cobertura y GIS</h2><p className="text-sm text-gray-400 font-medium">Gestión de Infraestructura</p></div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-full sm:w-auto shrink-0">
                <button onClick={() => setVistaActiva('TARJETAS')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaActiva === 'TARJETAS' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}><MdViewModule className="text-lg" /> Tarjetas</button>
                <button onClick={() => setVistaActiva('MAPA')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaActiva === 'MAPA' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}><MdMap className="text-lg" /> Mapa Global</button>
            </div>
            {/* BOTÓN PARA DESPLEGAR FILTROS */}
            <button onClick={() => setFiltrosAbiertos(!filtrosAbiertos)} className={`px-4 py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 ${filtrosAbiertos ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><MdFilterList className="text-lg" /></button>
            <button onClick={abrirModalNuevaZona} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><MdAdd className="text-xl" /> Nueva Zona</button>
        </div>
      </div>

      {/* SÚPER BARRA DE FILTROS DESPLEGABLE (ACORDEÓN CSS) */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${filtrosAbiertos ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
          <div className="overflow-hidden">
              <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-3 shrink-0">
                  <div className={`flex items-center gap-4 overflow-x-auto pb-1 ${scrollbarInvisible}`}>
                      <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2 text-gray-500 min-w-[200px] shrink-0"><MdSearch className="text-lg" /><input type="text" placeholder="Buscar zona o AP..." className="bg-transparent outline-none text-sm font-bold w-full" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
                      <div className="w-px h-6 bg-gray-200 shrink-0"></div>
                      <div className="flex items-center gap-2 shrink-0"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Tipo:</span>{['TODOS', 'FIBRA', 'ANTENA'].map(t => (<button key={t} onClick={() => setFiltroTipo(t)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroTipo === t ? 'bg-gray-800 text-white shadow-sm' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{t === 'FIBRA' ? 'Fibra Óptica' : t}</button>))}</div>
                      <div className="w-px h-6 bg-gray-200 shrink-0"></div>
                      <div className="flex items-center gap-2 shrink-0"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Región:</span><button onClick={() => setFiltroRegion('TODAS')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRegion === 'TODAS' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>Todas</button>{regionesDisponibles.map(r => (<button key={r} onClick={() => setFiltroRegion(r)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRegion === r ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{r}</button>))}</div>
                      <div className="w-px h-6 bg-gray-200 shrink-0"></div>
                      <div className="flex items-center gap-2 shrink-0 pr-4"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Marca:</span><button onClick={() => setFiltroMarca('TODAS')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMarca === 'TODAS' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>Todas</button>{marcasDisponibles.map(m => (<button key={m} onClick={() => setFiltroMarca(m)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMarca === m ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{m}</button>))}</div>
                  </div>
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
                          return (
                              <div key={zona.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 hover:shadow-md transition-all relative group">
                                  {/* BOTÓN DE PAPELERA (Aparece en Hover) */}
                                  <button onClick={() => { if(window.confirm('¿Seguro que deseas eliminar esta zona y toda su infraestructura?')) eliminarZona(zona.id); }} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white border border-red-100 text-red-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm"><MdDelete/></button>

                                  <div className="flex justify-between items-start mb-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${esFibra ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>{esFibra ? <MdCable /> : <MdWifi />}</div>
                                      <div className="text-right pr-8">
                                          <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">{zona.sede}</span>
                                          {zona.estatus === 'PENDIENTE_PRECIOS' ? <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-md text-[10px] font-bold flex items-center justify-end gap-1"><MdWarning/> PENDIENTE</span> : <span className="px-2 py-1 bg-green-100 text-green-600 rounded-md text-[10px] font-bold flex items-center justify-end gap-1"><MdCheckCircle/> ACTIVA</span>}
                                      </div>
                                  </div>
                                  <h3 className="text-lg font-extrabold text-gray-800 leading-tight mb-1 pr-8 truncate">{zona.nombreAp || zona.comunidad}</h3>
                                  <p className="text-xs text-gray-500 font-medium mb-4 flex items-center gap-1"><MdPlace className="text-gray-400" /> {zona.municipio}, {zona.estado}</p>
                                  
                                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center gap-2">
                                      <button onClick={() => abrirModalEditarZona(zona)} className="flex-1 py-2 text-[10px] font-black text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"><MdEdit/> Editar GEO</button>
                                      <button onClick={() => setZonaDetalles(zona)} className="flex-1 py-2 text-[10px] font-black text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">Ver Detalles</button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          ) : (
              <div className="h-full w-full bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-2 animate-fade-in"><MapaGlobal zonas={zonasFiltradas} /></div>
          )}
      </div>

      {/* --- MODAL NUEVA/EDITAR ZONA (EL SÚPER EDITOR GIS) --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl animate-scale-in flex flex-col overflow-hidden max-h-[95vh] min-h-[80vh]">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-extrabold text-gray-900">{editandoZonaId ? 'Editar Zona GIS' : 'Crear Nueva Zona GIS'}</h2>
                    <button onClick={() => setModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all"><MdClose className="text-xl"/></button>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                    <div className="w-full lg:w-1/3 p-6 border-r border-gray-100 bg-white space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="flex bg-gray-100 p-1 rounded-2xl">
                            <button disabled={!!editandoZonaId} onClick={() => { setTipoTecnologia('FIBRA'); setModoEdicionMapa('ZONA'); }} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tipoTecnologia === 'FIBRA' ? 'bg-white shadow text-purple-600' : 'text-gray-500 disabled:opacity-50'}`}>Fibra Óptica</button>
                            <button disabled={!!editandoZonaId} onClick={() => { setTipoTecnologia('ANTENA'); setModoEdicionMapa('ZONA'); }} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tipoTecnologia === 'ANTENA' ? 'bg-white shadow text-orange-600' : 'text-gray-500 disabled:opacity-50'}`}>Antena WISP</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sede Operativa</label><select value={datosZona.sede} onChange={(e) => setDatosZona({...datosZona, sede: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none font-bold text-xs text-gray-700 appearance-none">{SEDES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Marca</label><select value={datosZona.marca} onChange={(e) => setDatosZona({...datosZona, marca: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none font-bold text-xs text-gray-700 appearance-none">{MARCAS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        </div>
                        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre (ID Identificador)</label><input required type="text" placeholder="Ej: Torre Principal Noria" value={datosZona.nombreAp} onChange={(e) => setDatosZona({...datosZona, nombreAp: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none font-bold text-xs text-gray-800" /></div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Municipio</label><input required type="text" placeholder="Ej: San Diego" value={datosZona.municipio} onChange={(e) => setDatosZona({...datosZona, municipio: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none font-bold text-xs text-gray-800" /></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estado</label><input required type="text" placeholder="Ej: Guanajuato" value={datosZona.estado} onChange={(e) => setDatosZona({...datosZona, estado: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none font-bold text-xs text-gray-800" /></div>
                        </div>

                        {tipoTecnologia === 'ANTENA' && (
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Comunidades Cubiertas</label>
                                <div className="flex gap-2 mb-2">
                                    <input type="text" placeholder="Ej: La Soledad..." value={nuevaComunidad} onChange={(e) => setNuevaComunidad(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarComunidad())} className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-xs outline-none font-bold text-gray-800" />
                                    <button type="button" onClick={agregarComunidad} className="px-4 py-2.5 bg-orange-100 text-orange-700 rounded-xl font-bold text-xs hover:bg-orange-200 transition-colors">Añadir</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {comunidadesAP.map((com, idx) => (
                                        <span key={idx} className="bg-orange-50 border border-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">{com} <MdClose className="cursor-pointer hover:text-red-500" onClick={() => eliminarComunidad(com)}/></span>
                                    ))}
                                    {comunidadesAP.length === 0 && <span className="text-[10px] text-gray-400 italic">Agrega al menos una.</span>}
                                </div>
                            </div>
                        )}

                        {tipoTecnologia === 'ANTENA' && (
                            <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
                                <h4 className="text-xs font-extrabold text-orange-800 mb-4 flex items-center gap-2"><MdWifi/> Controles Sectoriales (Cono)</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex justify-between text-[10px] font-bold text-orange-700 uppercase mb-1"><span>Alcance (Radio)</span> <span>{coberturaGeo.radio} m</span></label>
                                        <input type="range" min="500" max="15000" step="500" value={coberturaGeo.radio} onChange={(e) => setCoberturaGeo({...coberturaGeo, radio: Number(e.target.value)})} className="w-full accent-orange-600"/>
                                    </div>
                                    <div>
                                        <label className="flex justify-between text-[10px] font-bold text-orange-700 uppercase mb-1"><span>Apertura (Grados)</span> <span>{coberturaGeo.amplitud}°</span></label>
                                        <input type="range" min="30" max="360" step="10" value={coberturaGeo.amplitud} onChange={(e) => setCoberturaGeo({...coberturaGeo, amplitud: Number(e.target.value)})} className="w-full accent-orange-600"/>
                                    </div>
                                    {coberturaGeo.amplitud < 360 && (
                                        <div>
                                            <label className="flex justify-between text-[10px] font-bold text-orange-700 uppercase mb-1"><span>Orientación (Dirección)</span> <span>{coberturaGeo.anguloInicio}°</span></label>
                                            <input type="range" min="0" max="360" step="5" value={coberturaGeo.anguloInicio} onChange={(e) => setCoberturaGeo({...coberturaGeo, anguloInicio: Number(e.target.value)})} className="w-full accent-orange-600"/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {tipoTecnologia === 'FIBRA' && (
                            <div className="bg-purple-50 p-4 rounded-3xl border border-purple-100">
                                <h4 className="text-xs font-extrabold text-purple-800 mb-3 flex items-center gap-2"><MdCable/> Dibujo de Polígono Irregular</h4>
                                <p className="text-[10px] text-purple-600 font-medium mb-3">Haz clic en el botón inferior para empezar a trazar calles en el mapa.</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setModoEdicionMapa('POLIGONO_FIBRA')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${modoEdicionMapa === 'POLIGONO_FIBRA' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-200'}`}>Trazar Perímetro</button>
                                    <button type="button" onClick={() => setCoberturaGeo({...coberturaGeo, poligono: []})} className="px-4 py-2 bg-white text-red-500 border border-red-100 rounded-xl text-[10px] font-black hover:bg-red-50">Borrar</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full lg:w-2/3 bg-gray-100 relative min-h-[400px] flex flex-col p-4 lg:p-6">
                        <div className="absolute top-8 lg:top-10 left-1/2 -translate-x-1/2 z-[400] flex bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-gray-200">
                            <button type="button" onClick={() => setModoEdicionMapa('ZONA')} className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-full transition-all ${modoEdicionMapa === 'ZONA' ? 'bg-blue-500 text-white shadow' : 'text-gray-500'}`}>Mover Central</button>
                            {tipoTecnologia === 'FIBRA' && <button type="button" onClick={() => setModoEdicionMapa('CAJA')} className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-full transition-all ${modoEdicionMapa === 'CAJA' ? 'bg-green-500 text-white shadow' : 'text-gray-500'}`}>Poner Cajas NAP</button>}
                        </div>

                        <div className="flex-1 w-full h-full relative mt-12 lg:mt-0">
                            <MapaEditor 
                                posicionCentro={modoEdicionMapa === 'ZONA' ? coordenadas : nuevaCaja} 
                                setPosicion={handleMapClick} 
                                tipoPunto={modoEdicionMapa === 'ZONA' ? tipoTecnologia : modoEdicionMapa}
                                marcadoresExtra={cajasTemporales}
                                coberturaGeo={coberturaGeo}
                                setCoberturaGeo={setCoberturaGeo}
                            />
                        </div>

                        {modoEdicionMapa === 'CAJA' && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm z-[400] bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-green-200">
                                <div className="flex gap-2 mb-2">
                                    <input type="text" placeholder="Ej: Caja Madero" value={nuevaCaja.nombre} onChange={e => setNuevaCaja({...nuevaCaja, nombre: e.target.value})} className="w-1/2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none border border-gray-200"/>
                                    <input type="text" placeholder="Calles que abarca" value={nuevaCaja.calles} onChange={e => setNuevaCaja({...nuevaCaja, calles: e.target.value})} className="w-1/2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none border border-gray-200"/>
                                </div>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Puertos" value={nuevaCaja.puertos} onChange={e => setNuevaCaja({...nuevaCaja, puertos: e.target.value})} className="w-1/2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs outline-none border border-gray-200 text-center font-bold"/>
                                    <button type="button" onClick={agregarCajaALista} className="w-1/2 bg-green-500 text-white text-[10px] font-black rounded-lg hover:bg-green-600 transition-all uppercase tracking-widest">Fijar Pin</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                    <button onClick={handleGuardarZona} className="w-full py-4 bg-gray-900 text-white font-extrabold rounded-2xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"><MdSave className="text-xl"/> {editandoZonaId ? 'Guardar Cambios de Zona' : 'Guardar Nueva Zona'}</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DETALLES DE ZONA (FICHA TÉCNICA) --- */}
      {zonaDetalles && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl animate-scale-in flex flex-col overflow-hidden h-[85vh]">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <div><h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><MdMap className="text-blue-500"/> Ficha Técnica de Cobertura</h2></div>
                    <button onClick={() => setZonaDetalles(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all"><MdClose className="text-xl"/></button>
                </div>
                
                <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                    <div className="w-full lg:w-1/3 p-6 overflow-y-auto custom-scrollbar bg-white border-r border-gray-100 space-y-6">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100"><p className="text-sm font-black text-gray-800">{zonaDetalles.nombreAp || zonaDetalles.comunidad}</p><p className="text-xs font-bold text-gray-500">Tipo: {zonaDetalles.tipo}</p></div>
                        {zonaDetalles.tipo === 'FIBRA' ? (
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cajas NAP ({zonaDetalles.cajas?.length})</p>
                                <div className="space-y-2">
                                    {zonaDetalles.cajas?.map((caja, idx) => (
                                        <div key={idx} className="bg-purple-50 rounded-xl p-3 border border-purple-100 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-black text-purple-800">{caja.nombre}</p>
                                                <p className="text-[9px] font-bold text-purple-600">{caja.calles || 'Sin calles'}</p>
                                            </div>
                                            <div className="text-center bg-white px-2 py-1 rounded-lg shadow-sm">
                                                <p className="text-[10px] font-black text-gray-800">{caja.puertosLibres ?? caja.puertos}</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Libres</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Comunidades</p><div className="flex flex-wrap gap-2">{zonaDetalles.comunidades?.map((com, idx) => (<span key={idx} className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-black">{com}</span>))}</div></div>
                        )}
                    </div>
                    <div className="w-full lg:w-2/3 h-full relative bg-gray-100 p-2">
                        {zonaDetalles.lat && zonaDetalles.lng ? <MapaGlobal zonas={[zonaDetalles]} /> : <div className="flex items-center justify-center h-full w-full opacity-50"><MdMap className="text-6xl text-gray-400 mb-2"/></div>}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}