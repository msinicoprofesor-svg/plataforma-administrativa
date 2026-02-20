/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/LikeStore.tsx (FINAL: BUSCADOR HISTORIAL + FIX UI) */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
  MdStorefront, MdRedeem, MdHistory, MdLocalOffer, MdAdd, MdSearch, 
  MdNotifications, MdClose, MdDelete, MdEdit, MdShoppingCart, 
  MdPersonSearch, MdVisibility, MdRemoveCircleOutline, MdAddCircleOutline, 
  MdKeyboardArrowDown, MdNoteAlt, MdCalendarToday, MdWarning, MdDateRange
} from "react-icons/md";

// LISTA DE EMOJIS
const EMOJIS_DISPONIBLES = [
    '🎁', '🍫', '🍬', '🍪', '🍿', '🧀', '🥨', 
    '🥤', '🧃', '☕', '🍵', '🍺', '💧',       
    '🧢', '👕', '🎒', '🕶️', '👟',             
    '🏖️', '🎟️', '🎂', '🍿', '🎮', '🎧',       
    '🍶', '🖊️', '📓', '🔑', '🧸'              
];

export default function LikeStore({ useData, colaboradores, onCanjear }) {
  const { 
    productos, historial, cupones, alertas, alertasLeidas, 
    guardarProducto, eliminarProducto, registrarTransaccion, 
    agregarCupon, borrarCupon, marcarLeida, ajustarStockRapido, registrarUsoCupon 
  } = useData;

  // NAVEGACIÓN
  const [tabActual, setTabActual] = useState('CANJE'); 
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarCuponesModal, setMostrarCuponesModal] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  
  // BÚSQUEDA
  const [busqueda, setBusqueda] = useState('');
  const [busquedaColab, setBusquedaColab] = useState('');
  const [mostrarResultadosColab, setMostrarResultadosColab] = useState(false);

  // ESTADOS CANJE
  const [colaboradorId, setColaboradorId] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cuponAplicado, setCuponAplicado] = useState(null);

  // ESTADOS ADMIN
  const [modalProdOpen, setModalProdOpen] = useState(false);
  const [prodEditando, setProdEditando] = useState(null); 
  const [emojiSeleccionado, setEmojiSeleccionado] = useState('🎁');

  // MODAL STOCK AVANZADO
  const [modalStockOpen, setModalStockOpen] = useState(false);
  const [prodStock, setProdStock] = useState(null);
  const [tipoAjuste, setTipoAjuste] = useState('ENTRADA'); 
  const [cantidadAjuste, setCantidadAjuste] = useState(0);
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [nuevaCaducidad, setNuevaCaducidad] = useState(''); 

  // MODAL HISTORIAL
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [registroDetalle, setRegistroDetalle] = useState(null);

  // --- LÓGICA ---
  const colaboradorActivo = useMemo(() => colaboradores.find(c => c.id === colaboradorId), [colaboradorId, colaboradores]);

  // Filtro Colaboradores
  const colaboradoresFiltrados = useMemo(() => {
      if (!busquedaColab) return [];
      return colaboradores.filter(c => c.nombre.toLowerCase().includes(busquedaColab.toLowerCase()));
  }, [busquedaColab, colaboradores]);

  // Filtro Productos (Catálogo)
  const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  
  // Filtro Historial (NUEVO: Hace que la barra de búsqueda funcione en Historial)
  const historialFiltrado = useMemo(() => {
      if (!busqueda) return historial;
      const term = busqueda.toLowerCase();
      return historial.filter(h => 
          h.colaborador.toLowerCase().includes(term) || 
          h.tipo.toLowerCase().includes(term) ||
          h.detalle.toLowerCase().includes(term)
      );
  }, [historial, busqueda]);

  const alertasActivas = alertas.filter(a => !alertasLeidas.includes(a.id));

  // --- FUNCIONES ---
  const agregarAlCarrito = (producto) => {
    if (!colaboradorId) return alert("⚠️ Selecciona un colaborador primero.");
    const item = carrito.find(i => i.id === producto.id);
    const cantidad = item ? item.cantidad : 0;
    if (cantidad + 1 > producto.stock) return alert("¡Stock insuficiente!");
    if (item) setCarrito(carrito.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    else setCarrito([...carrito, { ...producto, cantidad: 1 }]);
  };

  const quitarDelCarrito = (id) => setCarrito(carrito.filter(i => i.id !== id));

  const intentarAplicarCupon = (codigo) => {
      const cupon = cupones.find(c => c.codigo === codigo);
      if (!cupon || !cupon.activo) return alert("Cupón no válido.");
      if (cupon.caducidad && new Date() > new Date(cupon.caducidad)) return alert("El cupón ha caducado.");
      if (cupon.limite && (cupon.usos || 0) >= cupon.limite) return alert("Límite de usos alcanzado.");
      setCuponAplicado(cupon);
  };

  const totalBruto = carrito.reduce((s, i) => s + (i.puntos * i.cantidad), 0);
  const descuento = cuponAplicado ? Math.floor(totalBruto * (cuponAplicado.descuento / 100)) : 0;
  const totalNeto = totalBruto - descuento;
  const saldoActual = colaboradorActivo ? (colaboradorActivo.puntos || 0) : 0;
  const alcanza = saldoActual >= totalNeto;

  const confirmarCanje = () => {
    if (!colaboradorId || carrito.length === 0 || !alcanza) return;
    if (window.confirm(`¿Canjear por ${totalNeto} puntos?`)) {
      onCanjear(colaboradorId, totalNeto);
      registrarTransaccion(carrito, 'SALIDA', colaboradorActivo, 'Canje Tienda');
      if (cuponAplicado) registrarUsoCupon(cuponAplicado.id);
      setCarrito([]); setCuponAplicado(null);
      setMobileCartOpen(false);
      alert("¡Canje Exitoso! 🥳");
    }
  };

  const abrirModalStock = (prod, tipo) => {
      setProdStock(prod);
      setTipoAjuste(tipo);
      setCantidadAjuste(0);
      setMotivoAjuste('');
      setNuevaCaducidad(prod.caducidad || ''); 
      setModalStockOpen(true);
  };

  const confirmarAjusteStock = () => {
    if (cantidadAjuste <= 0) return alert("Cantidad inválida");
    if (!motivoAjuste.trim()) return alert("Escribe un motivo (ej: Lote 540)");
    
    const cantidadFinal = tipoAjuste === 'ENTRADA' ? cantidadAjuste : -cantidadAjuste;
    const fechaParaGuardar = (tipoAjuste === 'ENTRADA' && nuevaCaducidad) ? nuevaCaducidad : null;

    ajustarStockRapido(prodStock.id, parseInt(cantidadFinal), motivoAjuste, fechaParaGuardar);
    setModalStockOpen(false);
  };

  const guardarFormProd = (e) => {
    e.preventDefault();
    const f = e.target;
    guardarProducto({
      id: prodEditando ? prodEditando.id : null,
      nombre: f.nombre.value,
      categoria: f.categoria.value,
      puntos: parseInt(f.puntos.value),
      stock: parseInt(f.stock.value),
      caducidad: f.caducidad.value || null,
      imagen: emojiSeleccionado
    });
    setModalProdOpen(false);
  };

  // --- COMPONENTE CARRITO ---
  const ContenidoCarrito = () => (
    <div className="flex flex-col h-full w-full bg-white md:rounded-[2rem] rounded-none shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Carrito */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><MdShoppingCart/> Tu Carrito</h3>
            <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-full border border-gray-200">{carrito.length} items</span>
        </div>
        
        {/* LISTA EXPANDIBLE */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-white w-full">
            {carrito.length===0 ? 
                /* FIX: Usamos justify-start + pt-32 para subirlo visualmente y que no se vea caído */
                <div className="h-full flex flex-col items-center justify-start pt-32 text-gray-300 opacity-60">
                    <MdShoppingCart className="text-6xl mb-2"/>
                    <p className="text-xs font-bold">Carrito Vacío</p>
                    <p className="text-[10px]">Busca productos para agregar</p>
                </div> 
                : 
                <div className="space-y-3 w-full">
                    {carrito.map(i=>(
                        <div key={i.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl shadow-sm border border-gray-100 w-full">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-2xl shrink-0">{i.imagen}</span>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 text-sm truncate">{i.nombre}</p>
                                    <p className="text-[10px] text-gray-500">{i.cantidad} x {i.puntos} pts</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="font-black text-sm">{i.cantidad*i.puntos}</span>
                                <button onClick={()=>quitarDelCarrito(i.id)} className="text-red-400 p-1 hover:bg-red-50 rounded-lg"><MdDelete/></button>
                            </div>
                        </div>
                    ))}
                </div>
            }
        </div>

        {/* FOOTER STICKY */}
        <div className="p-5 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] w-full">
            {cupones.filter(c=>c.activo).length > 0 && (
                <div className="mb-4">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Cupones Disponibles</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {cupones.filter(c=>c.activo).map(c=>(<button key={c.id} onClick={()=>intentarAplicarCupon(c.codigo)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100 whitespace-nowrap hover:bg-blue-100 flex items-center gap-1"><MdLocalOffer/> {c.codigo}</button>))}
                    </div>
                </div>
            )}
            {cuponAplicado && <div className="mb-3 bg-green-100 text-green-800 px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center shadow-sm"><span>Cupón: {cuponAplicado.codigo} (-{cuponAplicado.descuento}%)</span><button onClick={()=>setCuponAplicado(null)}><MdClose/></button></div>}
            
            <div className="flex justify-between text-sm mb-4"><span className="text-gray-500 font-bold">Total a Pagar</span><span className="font-black text-gray-800 text-lg">{totalNeto} pts</span></div>
            <button onClick={confirmarCanje} disabled={!alcanza || !colaboradorId || carrito.length===0} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg text-sm transition-all flex items-center justify-center gap-2 ${alcanza && colaboradorId && carrito.length>0 ? 'bg-[#DA291C] hover:bg-[#b02117] hover:scale-[1.02]':'bg-gray-300 cursor-not-allowed'}`}>Confirmar Canje</button>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#F5F7FA] md:bg-gray-50/50 md:rounded-[2.5rem] rounded-none overflow-hidden relative">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-3 md:p-6 shadow-sm z-10 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
        <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#DA291C] rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl shadow-xl shadow-red-500/20"><MdStorefront /></div>
            <div><h1 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight leading-none">LikeStore</h1><p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Centro de Canje</p></div>
          </div>
          {/* TABS PC/TABLET */}
          <div className="hidden md:flex bg-gray-100 p-1.5 rounded-2xl">
            {[ {id:'CANJE', icon:<MdRedeem/>, label:'Canje'}, {id:'CATALOGO', icon:<MdStorefront/>, label:'Productos'}, {id:'HISTORIAL', icon:<MdHistory/>, label:'Historial'} ].map(tab => (
              <button key={tab.id} onClick={()=>setTabActual(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${tabActual===tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{tab.icon} <span>{tab.label}</span></button>
            ))}
          </div>
        </div>

        {/* TABS MÓVIL (BOTTOM BAR) */}
        <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 z-50 justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
             {[ {id:'CANJE', icon:<MdRedeem/>, label:'Canje'}, {id:'CATALOGO', icon:<MdStorefront/>, label:'Admin'}, {id:'HISTORIAL', icon:<MdHistory/>, label:'Historial'} ].map(tab => (
              <button key={tab.id} onClick={()=>setTabActual(tab.id)} className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl text-[9px] font-bold transition-all ${tabActual===tab.id ? 'text-[#DA291C] bg-red-50' : 'text-gray-400'}`}><span className="text-lg">{tab.icon}</span> <span>{tab.label}</span></button>
            ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group"><MdSearch className="absolute left-4 top-3 text-gray-400 text-lg" />
          {/* INPUT DE BÚSQUEDA GLOBAL (AHORA BUSCA EN PRODUCTOS E HISTORIAL) */}
          <input type="text" placeholder={tabActual==='HISTORIAL' ? "Buscar en historial..." : "Buscar producto..."} className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-100 transition-all" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/></div>
          <button onClick={()=>setMostrarCuponesModal(true)} className="relative w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors shadow-sm"><MdLocalOffer className="text-xl" /></button>
          <button onClick={()=>setMostrarNotificaciones(!mostrarNotificaciones)} className="relative w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-500 hover:text-[#DA291C] transition-colors shadow-sm"><MdNotifications className="text-xl" />{alertasActivas.length>0 && <span className="absolute top-2 right-2 w-3 h-3 bg-[#DA291C] text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white">{alertasActivas.length}</span>}</button>
        </div>
      </div>

      {/* --- PANEL NOTIFICACIONES --- */}
      {mostrarNotificaciones && (
        <div className="absolute top-20 right-4 z-40 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 animate-scale-in">
          <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2"><h3 className="font-bold text-gray-800 text-sm">Alertas</h3><button onClick={()=>setMostrarNotificaciones(false)}><MdClose/></button></div>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">{alertasActivas.length===0 ? <p className="text-center text-xs text-gray-400 py-4">Sin novedades</p> : alertasActivas.map(a=>(<div key={a.id} className={`p-3 rounded-2xl border-l-4 bg-white shadow-sm text-xs flex gap-3 ${a.severidad==='red'?'border-red-500':'border-orange-400'}`}><div className="mt-0.5 text-lg"><MdWarning className={a.severidad==='red'?'text-red-500':'text-orange-400'}/></div><div className="flex-1"><p className="font-bold text-gray-800">{a.titulo}</p><p className="text-gray-500 leading-tight mb-2">{a.mensaje}</p><button onClick={()=>marcarLeida(a.id)} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Marcar leída</button></div></div>))}</div>
        </div>
      )}

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex-1 overflow-hidden p-2 md:p-6 custom-scrollbar overflow-y-auto pb-24 md:pb-6">
        
        {/* VISTA 1: CANJE */}
        {tabActual === 'CANJE' && (
          <div className="flex flex-col md:flex-row gap-6 h-full relative">
            
            {/* SIDEBAR: BUSCADOR + CARRITO (TABLET Y ESCRITORIO) */}
            <div className="w-full md:w-72 lg:w-96 flex flex-col gap-4 shrink-0 h-auto md:h-full">
                {/* BUSCADOR */}
                <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg relative shrink-0">
                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-2 block flex items-center gap-1"><MdPersonSearch/> Colaborador</label>
                    <div className="relative">
                        <input type="text" placeholder="Buscar..." className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-[#DA291C]" value={busquedaColab} onChange={(e)=>{setBusquedaColab(e.target.value); setMostrarResultadosColab(true);}} onFocus={()=>setMostrarResultadosColab(true)} />
                        <MdSearch className="absolute left-3 top-3 text-gray-500" />
                        {mostrarResultadosColab && busquedaColab && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto custom-scrollbar border border-gray-200">
                                {colaboradoresFiltrados.map(c => (
                                    <div key={c.id} onClick={()=>{setColaboradorId(c.id); setBusquedaColab(''); setMostrarResultadosColab(false);}} className="p-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b border-gray-50 text-gray-800"><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold overflow-hidden">{c.foto?<img src={c.foto} className="w-full h-full object-cover"/>:c.nombre.charAt(0)}</div><div><p className="text-xs font-bold">{c.nombre}</p></div></div>
                                ))}
                            </div>
                        )}
                    </div>
                    {colaboradorActivo && (
                        <div className="mt-3 flex items-center gap-3 bg-gray-800 p-2.5 rounded-xl border border-gray-700 animate-fade-in"><div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-500">{colaboradorActivo.foto?<img src={colaboradorActivo.foto} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">{colaboradorActivo.nombre.charAt(0)}</div>}</div><div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{colaboradorActivo.nombre}</p><p className="text-[9px] text-gray-400 truncate">{colaboradorActivo.puesto}</p></div><div className="text-right"><p className="text-[8px] text-gray-400">Puntos</p><p className="text-sm font-black text-[#DA291C]">{saldoActual}</p></div></div>
                    )}
                </div>

                {/* CARRITO */}
                <div className="hidden md:flex flex-1 overflow-hidden h-full min-h-0">
                    <ContenidoCarrito />
                </div>
            </div>

            {/* PRODUCTOS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {productosFiltrados.map(prod => {
                        const accesible = colaboradorActivo && (prod.puntos <= saldoActual);
                        return (
                            <div key={prod.id} className={`bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm relative group transition-all ${!accesible && colaboradorId ? 'opacity-60 grayscale':'hover:shadow-md'}`}>
                                {prod.caducidad && <div className="absolute top-3 right-3 bg-red-50 text-red-500 text-[8px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"><MdDateRange/> {prod.caducidad}</div>}
                                <div className="text-center my-3"><div className="text-5xl md:text-6xl mb-3 transform group-hover:scale-110 transition-transform cursor-default">{prod.imagen}</div><h3 className="font-bold text-gray-800 text-xs md:text-sm leading-tight line-clamp-2 h-8">{prod.nombre}</h3><p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-wider">{prod.categoria}</p></div>
                                <div className="flex items-center justify-between mt-auto bg-gray-50 p-2 rounded-xl"><span className="text-xs md:text-sm font-black text-[#DA291C] ml-1">{prod.puntos} pts</span><button onClick={()=>agregarAlCarrito(prod)} disabled={!colaboradorId || prod.stock===0} className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-green-600 hover:bg-green-500 hover:text-white transition-colors disabled:opacity-50"><MdAdd/></button></div>
                                <p className="text-[8px] text-center text-gray-300 mt-2 font-bold">Stock: {prod.stock}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BOTÓN FLOTANTE CARRITO (MÓVIL) */}
            <div className="md:hidden fixed bottom-20 right-4 z-30">
                <button onClick={()=>setMobileCartOpen(true)} className="w-14 h-14 bg-[#DA291C] rounded-full shadow-2xl flex items-center justify-center text-white text-2xl relative hover:scale-105 transition-transform active:scale-95"><MdShoppingCart />{carrito.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#DA291C] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-red-500">{carrito.length}</span>}</button>
            </div>

            {/* MODAL CARRITO MÓVIL */}
            {mobileCartOpen && (<div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col animate-slide-up"><div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-100"><button onClick={()=>setMobileCartOpen(false)} className="flex items-center gap-1 text-sm font-bold text-gray-500"><MdKeyboardArrowDown className="text-xl"/> Seguir Comprando</button><h3 className="font-black text-gray-800">Tu Carrito</h3></div><div className="flex-1 overflow-hidden"><ContenidoCarrito /></div></div>)}
          </div>
        )}

        {/* VISTA 2: CATÁLOGO */}
        {tabActual === 'CATALOGO' && (
          <div className="space-y-6">
            <div className="flex justify-end"><button onClick={()=>{setProdEditando(null); setEmojiSeleccionado('🎁'); setModalProdOpen(true);}} className="bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all flex items-center gap-2"><MdAdd className="text-xl"/> Nuevo Producto</button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {productosFiltrados.map(prod => (
                <div key={prod.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start"><span className="text-4xl">{prod.imagen}</span><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={()=>{setProdEditando(prod); setEmojiSeleccionado(prod.imagen); setModalProdOpen(true);}} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><MdEdit/></button><button onClick={()=>{if(window.confirm('Eliminar?')) eliminarProducto(prod.id);}} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><MdDelete/></button></div></div>
                  <h3 className="font-bold text-gray-800 mt-2 text-xs line-clamp-1">{prod.nombre}</h3>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                    <span className="font-black text-[#DA291C]">{prod.puntos} pts</span>
                    {/* BOTONES STOCK */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button onClick={()=>abrirModalStock(prod, 'SALIDA')} className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-white rounded"><MdRemoveCircleOutline/></button>
                        <span className="font-bold text-gray-700 min-w-[20px] text-center text-[10px]">{prod.stock}</span>
                        <button onClick={()=>abrirModalStock(prod, 'ENTRADA')} className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-white rounded"><MdAddCircleOutline/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 3: HISTORIAL (USANDO HISTORIAL FILTRADO) */}
        {tabActual === 'HISTORIAL' && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-bold"><tr><th className="px-5 py-4">Fecha</th><th className="px-5 py-4">Acción</th><th className="px-5 py-4">Usuario</th><th className="px-5 py-4 text-right">Detalle</th></tr></thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                    {/* AQUI SE USA HISTORIAL FILTRADO */}
                    {historialFiltrado.length > 0 ? (
                        historialFiltrado.map((h, i)=>(
                            <tr key={i} className="hover:bg-gray-50"><td className="px-5 py-4 font-mono text-gray-500">{h.fecha.split(',')[0]}</td><td className="px-5 py-4"><span className={`px-2 py-1 rounded-lg text-[9px] font-bold ${h.tipo==='ENTRADA'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{h.tipo}</span></td><td className="px-5 py-4 text-gray-700 font-bold">{h.colaborador}</td><td className="px-5 py-4 text-right"><button onClick={()=>{setRegistroDetalle(h); setModalHistorialOpen(true);}} className="text-gray-400 hover:text-blue-600 text-xl"><MdVisibility/></button></td></tr>
                        ))
                    ) : (
                        <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 font-bold">No se encontraron resultados</td></tr>
                    )}
                </tbody>
            </table>
          </div>
        )}

      </div>

      {/* --- MODALES --- */}

      {/* 1. GESTIÓN CUPONES */}
      {mostrarCuponesModal && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md"><div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl">Gestión de Cupones</h3><button onClick={()=>setMostrarCuponesModal(false)}><MdClose className="text-2xl"/></button></div><div className="bg-blue-50 p-5 rounded-3xl flex flex-wrap gap-3 items-end mb-6"><div className="flex-1 min-w-[120px]"><label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Código</label><input id="newCode" className="w-full p-3 rounded-xl text-xs font-bold uppercase shadow-sm" placeholder="EJ: VIP20" /></div><div className="w-24"><label className="text-[10px] font-bold uppercase text-gray-400 ml-1">% Desc</label><input id="newDisc" type="number" className="w-full p-3 rounded-xl text-xs font-bold shadow-sm" placeholder="10" /></div><div className="w-24"><label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Límite</label><input id="newLim" type="number" className="w-full p-3 rounded-xl text-xs font-bold shadow-sm" placeholder="∞" /></div><div className="w-36"><label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Vence</label><input id="newDate" type="date" className="w-full p-3 rounded-xl text-xs font-bold shadow-sm" /></div><button onClick={()=>{ const c=(document.getElementById('newCode') as HTMLInputElement).value; const d=(document.getElementById('newDisc') as HTMLInputElement).value; const l=(document.getElementById('newLim') as HTMLInputElement).value; const dt=(document.getElementById('newDate') as HTMLInputElement).value; if(c&&d){ agregarCupon(c, d, dt, l); alert('Creado'); } }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">Crear</button></div><div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3">{cupones.map(c => (<div key={c.id} className="border border-gray-100 p-4 rounded-2xl flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow"><div><p className="font-black text-gray-800 text-lg">{c.codigo}</p><p className="text-xs text-green-600 font-bold">-{c.descuento}% • Usos: {c.usos||0}{c.limite?`/${c.limite}`:''}</p><p className="text-[9px] text-gray-400">{c.caducidad ? `Vence: ${c.caducidad}` : 'Sin caducidad'}</p></div><button onClick={()=>borrarCupon(c.id)} className="text-gray-300 hover:text-red-500 bg-gray-50 p-2 rounded-xl"><MdDelete/></button></div>))}</div></div></div>)}
      
      {/* 2. MODAL STOCK (NUEVO: CON FECHA) */}
      {modalStockOpen && prodStock && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
              <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-scale-in text-center">
                  <div className="text-5xl mb-4">{prodStock.imagen}</div>
                  <h3 className={`font-bold text-xl mb-1 ${tipoAjuste==='ENTRADA'?'text-green-600':'text-red-600'}`}>
                      {tipoAjuste === 'ENTRADA' ? 'Ingreso de Mercancía' : 'Registrar Salida/Merma'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 font-medium">{prodStock.nombre}</p>
                  
                  {/* Selector Cantidad */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                      <button onClick={()=>setCantidadAjuste(Math.max(0, cantidadAjuste-1))} className="w-12 h-12 bg-gray-100 rounded-2xl text-gray-600 font-bold text-xl hover:bg-gray-200 transition-colors">-</button>
                      <div className="w-24 bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center justify-center">
                          <input type="number" className="w-full bg-transparent text-center text-3xl font-black outline-none" placeholder="0" value={cantidadAjuste || ''} onChange={e=>setCantidadAjuste(parseInt(e.target.value))} />
                      </div>
                      <button onClick={()=>setCantidadAjuste(cantidadAjuste+1)} className="w-12 h-12 bg-gray-100 rounded-2xl text-gray-600 font-bold text-xl hover:bg-gray-200 transition-colors">+</button>
                  </div>

                  {/* Campo Motivo */}
                  <div className="mb-4 text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block flex items-center gap-1"><MdNoteAlt/> Motivo / Lote</label>
                      <input 
                        type="text" 
                        placeholder={tipoAjuste==='ENTRADA' ? "Ej: Compra Lote #540" : "Ej: Caducado / Dañado"}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                        value={motivoAjuste}
                        onChange={e => setMotivoAjuste(e.target.value)}
                      />
                  </div>

                  {/* Campo Fecha (Solo Entrada) */}
                  {tipoAjuste === 'ENTRADA' && (
                      <div className="mb-6 text-left animate-fade-in">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block flex items-center gap-1"><MdCalendarToday/> Nueva Caducidad (Opcional)</label>
                          <input 
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                            value={nuevaCaducidad}
                            onChange={e => setNuevaCaducidad(e.target.value)}
                          />
                      </div>
                  )}

                  <button 
                    onClick={confirmarAjusteStock} 
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${tipoAjuste==='ENTRADA' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'}`}
                  >
                      Confirmar {tipoAjuste === 'ENTRADA' ? 'Ingreso' : 'Salida'}
                  </button>
                  <button onClick={()=>setModalStockOpen(false)} className="mt-4 text-xs text-gray-400 font-bold hover:text-gray-600 underline">Cancelar Operación</button>
              </div>
          </div>
      )}

      {/* 3. DETALLE HISTORIAL */}
      {modalHistorialOpen && registroDetalle && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md"><div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-scale-in"><div className="flex justify-between items-start mb-6"><div><h3 className="font-bold text-gray-800 text-xl">Detalle de Movimiento</h3><p className="text-xs text-gray-400 font-mono mt-1">{registroDetalle.id}</p></div><button onClick={()=>setModalHistorialOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><MdClose/></button></div><div className="bg-gray-50 p-5 rounded-3xl space-y-3 text-sm mb-6"><div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{registroDetalle.fecha}</span></div><div className="flex justify-between"><span>Tipo:</span> <span className={`font-bold px-2 rounded ${registroDetalle.tipo==='ENTRADA'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{registroDetalle.tipo}</span></div><div className="flex justify-between"><span>Usuario:</span> <span className="font-bold">{registroDetalle.colaborador}</span></div><div className="flex justify-between text-gray-500"><span>Nota:</span> <span>{registroDetalle.nota || '-'}</span></div></div><div className="border-t border-gray-100 pt-4"><p className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><MdShoppingCart/> Productos Afectados</p><div className="bg-gray-100 p-4 rounded-2xl text-gray-700 font-medium text-sm leading-relaxed">{registroDetalle.detalle}</div></div><div className="mt-6 text-right"><span className="text-xs text-gray-400 font-bold uppercase mr-2">Valor Total:</span> <span className="text-2xl font-black text-[#DA291C]">{registroDetalle.totalPuntos} pts</span></div></div></div>)}
      
      {/* 4. EDITOR PRODUCTO */}
      {modalProdOpen && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md"><div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar"><h2 className="text-2xl font-black text-center mb-6 text-gray-800">{prodEditando?'Editar':'Nuevo'} Producto</h2><form onSubmit={guardarFormProd} className="space-y-4"><div><label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-2 block">Selecciona un Icono</label><div className="bg-gray-50 p-3 rounded-2xl grid grid-cols-7 gap-2 mb-2">{EMOJIS_DISPONIBLES.map(e=>(<button key={e} type="button" onClick={()=>setEmojiSeleccionado(e)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-xl hover:bg-white transition-all ${emojiSeleccionado===e?'bg-white shadow-md scale-110 border border-blue-200':''}`}>{e}</button>))}</div></div><div><label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Nombre del Producto</label><input name="nombre" required defaultValue={prodEditando?.nombre} className="w-full bg-gray-50 rounded-2xl px-5 py-3 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-gray-200" placeholder="Ej: Papitas" /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Categoría</label><select name="categoria" defaultValue={prodEditando?.categoria} className="w-full bg-gray-50 rounded-2xl px-4 py-3 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-gray-200"><option value="SNACKS">Snacks</option><option value="BEBIDAS">Bebidas</option><option value="SOUVENIR">Souvenir</option><option value="TEXTIL">Textil</option><option value="BENEFICIOS">Beneficios</option></select></div><div><label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Costo (Puntos)</label><input type="number" name="puntos" required defaultValue={prodEditando?.puntos} className="w-full bg-gray-50 rounded-2xl px-4 py-3 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-gray-200" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Stock Inicial</label><input type="number" name="stock" required defaultValue={prodEditando?.stock} className="w-full bg-gray-50 rounded-2xl px-4 py-3 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-gray-200" /></div><div><label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Caducidad</label><input type="date" name="caducidad" defaultValue={prodEditando?.caducidad} className="w-full bg-gray-50 rounded-2xl px-4 py-3 font-bold text-gray-800 outline-none text-xs focus:ring-2 focus:ring-gray-200" /></div></div><div className="flex gap-3 pt-6"><button type="button" onClick={()=>setModalProdOpen(false)} className="flex-1 py-4 text-gray-400 font-bold bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">Cancelar</button><button type="submit" className="flex-1 py-4 text-white font-bold bg-gray-900 rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Guardar Producto</button></div></form></div></div>)}
    </div>
  );
}