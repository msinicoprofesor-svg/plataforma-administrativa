/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/ModalDespacho.tsx              */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef, useEffect } from 'react';
import { MdClose, MdPointOfSale, MdQrCodeScanner, MdShoppingCart, MdDelete, MdPrint, MdCheckCircle, MdPerson, MdStore, MdSearch, MdLightbulbOutline } from "react-icons/md";

export default function ModalDespacho({ isOpen, onClose, useData, usuarioActivo, colaboradores = [], carrito, setCarrito }) {
    const { inventario, registrarMovimiento } = useData;
    
    // Búsqueda de Productos
    const [busquedaLector, setBusquedaLector] = useState('');
    const lectorRef = useRef(null);

    // Búsqueda de Colaboradores (Nuevo Motor UI)
    const [busquedaColab, setBusquedaColab] = useState('');
    const [colabSeleccionado, setColabSeleccionado] = useState(null);
    const [mostrarDropdownColab, setMostrarDropdownColab] = useState(false);
    
    // Datos de Entrega
    const [destino, setDestino] = useState('');
    const [motivo, setMotivo] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketGenerado, setTicketGenerado] = useState(null);

    useEffect(() => {
        if (isOpen && lectorRef.current && !ticketGenerado) {
            lectorRef.current.focus();
        }
    }, [isOpen, ticketGenerado]);

    if (!isOpen) return null;

    const stockFisico = inventario.filter(p => p.almacen !== 'CATALOGO_BASE' && p.stock > 0);

    // --- 1. MOTOR DE BÚSQUEDA DE PRODUCTOS EN VIVO ---
    const productosSugeridos = busquedaLector.trim().length > 1 
        ? stockFisico.filter(p => p.nombre.toLowerCase().includes(busquedaLector.toLowerCase()) || (p.marca && p.marca.toLowerCase().includes(busquedaLector.toLowerCase())))
        : [];

    const handleScanSubmit = (e) => {
        e.preventDefault();
        if(!busquedaLector.trim()) return;

        const q = busquedaLector.toLowerCase();
        const productoEncontrado = stockFisico.find(p => p.nombre.toLowerCase() === q || (p.marca && p.marca.toLowerCase() === q) || p.id.toLowerCase() === q);

        if (productoEncontrado) {
            // Lector de código de barras (Match exacto)
            agregarAlCarrito(productoEncontrado);
        } else if (productosSugeridos.length === 1) {
            // Solo quedó uno en el filtro, lo metemos directo
            agregarAlCarrito(productosSugeridos[0]);
        } else if (productosSugeridos.length === 0) {
            alert("❌ Producto no encontrado o sin stock disponible.");
        }
        // Si hay varios, el usuario debe hacer clic en las tarjetitas flotantes
    };

    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const existe = prev.find(item => item.producto.id === producto.id);
            if (existe) {
                if (existe.cantidad >= producto.stock) {
                    alert(`Solo hay ${producto.stock} unidades disponibles de este producto.`);
                    return prev;
                }
                return prev.map(item => item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { producto, cantidad: 1 }];
        });
        setBusquedaLector(''); 
        lectorRef.current?.focus();
    };

    const quitarDelCarrito = (idProducto) => setCarrito(prev => prev.filter(item => item.producto.id !== idProducto));

    const modificarCantidad = (idProducto, nuevaCant) => {
        const cant = parseInt(nuevaCant);
        if (isNaN(cant) || cant < 1) return;
        setCarrito(prev => prev.map(item => {
            if (item.producto.id === idProducto) {
                if (cant > item.producto.stock) { alert(`Máximo disponible: ${item.producto.stock}`); return item; }
                return { ...item, cantidad: cant };
            }
            return item;
        }));
    };

    // --- 2. MOTOR DE BÚSQUEDA DE COLABORADORES ---
    const colabsFiltrados = colaboradores.filter(c => 
        (c.nombre && c.nombre.toLowerCase().includes(busquedaColab.toLowerCase())) || 
        (c.puesto && c.puesto.toLowerCase().includes(busquedaColab.toLowerCase()))
    );

    // --- 3. MOTOR INTELIGENTE DE CHIPS (Sugerencias) ---
    const getSugerencias = () => {
        const categoriasEnCarrito = carrito.map(c => c.producto.categoria);
        
        let destinos = ['Vehículo (Stock Flotante)', 'Oficina Regional', 'Bodega Técnica'];
        let motivos = ['Asignación de material', 'Reposición de stock personal'];

        if (categoriasEnCarrito.includes('FIBRA ÓPTICA') || categoriasEnCarrito.includes('ENLACE / ANTENA')) {
            destinos = ['Instalación Cliente Nuevo', 'Mantenimiento de Torre', ...destinos];
            motivos = ['Uso en instalación', 'Mantenimiento Correctivo', ...motivos];
        }
        if (categoriasEnCarrito.includes('CCTV')) {
            destinos = ['Empresa Cliente', 'Casa Habitación Cliente'];
            motivos = ['Instalación de cámaras', 'Revisión de DVR / Cableado'];
        }
        if (categoriasEnCarrito.includes('HERRAMIENTA')) {
            destinos = ['Cuadrilla de Trabajo', 'Taller'];
            motivos = ['Asignación de herramienta', 'Reposición por pérdida o daño'];
        }
        return { destinos: [...new Set(destinos)], motivos: [...new Set(motivos)] };
    };

    const handleDespachar = async (e) => {
        e.preventDefault();
        if (carrito.length === 0) return alert("El carrito está vacío.");
        if (!colabSeleccionado) return alert("Debes seleccionar a quién le entregas el material.");
        if (!destino.trim() || !motivo.trim()) return alert("Completa los campos de destino y motivo.");

        setIsSubmitting(true);
        const horaEntrega = new Date();

        try {
            for (const item of carrito) {
                const motivoCompleto = `Mostrador | A: ${colabSeleccionado.nombre} | Destino: ${destino} | Motivo: ${motivo}`;
                await registrarMovimiento(item.producto.id, item.cantidad, 'SALIDA', motivoCompleto, usuarioActivo?.nombre || 'Administrador');
            }

            setTicketGenerado({
                folio: `DSP-${Date.now().toString().slice(-6)}`,
                fecha: horaEntrega,
                encargado: usuarioActivo?.nombre || 'Administrador',
                recibe: colabSeleccionado.nombre,
                destino: destino,
                proposito: motivo,
                items: carrito
            });
        } catch (error) {
            alert("Error al despachar el material.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImprimir = () => window.print();

    const resetear = () => {
        setCarrito([]); setBusquedaLector(''); setColabSeleccionado(null); setBusquedaColab(''); 
        setDestino(''); setMotivo(''); setTicketGenerado(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
            
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .zona-ticket, .zona-ticket * { visibility: visible; }
                    .zona-ticket { position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 5mm; font-family: monospace; font-size: 12px; color: black; box-shadow: none; background: white; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {!ticketGenerado ? (
                <div className="bg-gray-100 rounded-[2rem] w-full max-w-6xl h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in" onClick={() => setMostrarDropdownColab(false)}>
                    
                    <div className="bg-gray-900 text-white p-5 flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-xl font-black flex items-center gap-2"><MdPointOfSale className="text-blue-400"/> Punto de Despacho Rápido</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Salida de almacén con responsiva técnica</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-gray-800 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"><MdClose className="text-2xl"/></button>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        
                        {/* PANEL IZQUIERDO: Escáner y Carrito */}
                        <div className="flex-[3] bg-white border-r border-gray-200 flex flex-col relative z-20">
                            
                            {/* BÚSQUEDA Y ESCÁNER CON TARJETAS FLOTANTES */}
                            <form onSubmit={handleScanSubmit} className="p-5 border-b border-gray-100 bg-blue-50/30 relative">
                                <label className="block text-[10px] font-black text-blue-600 uppercase mb-2 flex items-center gap-1"><MdQrCodeScanner className="text-lg"/> Escáner / Búsqueda de Inventario</label>
                                <input 
                                    ref={lectorRef} type="text" value={busquedaLector} onChange={e => setBusquedaLector(e.target.value)}
                                    placeholder="Bipea el código o escribe el producto y selecciona..." 
                                    className="w-full bg-white border-2 border-blue-200 rounded-xl px-5 py-4 text-lg font-black text-gray-800 outline-none focus:border-blue-500 shadow-sm"
                                />
                                
                                {/* DESPLEGABLE DE PRODUCTOS */}
                                {busquedaLector.trim().length > 1 && productosSugeridos.length > 0 && (
                                    <div className="absolute top-[100%] left-5 right-5 z-[50] bg-white shadow-2xl border border-gray-200 rounded-xl mt-2 max-h-72 overflow-y-auto custom-scrollbar p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {productosSugeridos.map(p => (
                                            <div key={p.id} onClick={() => agregarAlCarrito(p)} className="p-3 border border-gray-100 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center group">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-xs font-black text-gray-800 truncate">{p.nombre}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase truncate">{p.marca} • {p.almacen}</p>
                                                </div>
                                                <div className="bg-gray-100 group-hover:bg-blue-100 text-gray-700 group-hover:text-blue-700 px-2 py-1 rounded-md text-[10px] font-black shrink-0">
                                                    {p.stock} disp.
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </form>

                            {/* CARRITO */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-4">
                                {carrito.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                        <MdShoppingCart className="text-6xl mb-3"/>
                                        <p className="font-bold text-sm">El carrito está vacío</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {carrito.map(item => (
                                            <div key={item.producto.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4 animate-fade-in">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-gray-800 truncate">{item.producto.nombre}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{item.producto.marca} • <span className="text-blue-500">{item.producto.almacen}</span></p>
                                                </div>
                                                <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                                    <input 
                                                        type="number" min="1" max={item.producto.stock} value={item.cantidad} 
                                                        onChange={(e) => modificarCantidad(item.producto.id, e.target.value)}
                                                        className="w-16 bg-white border border-gray-300 rounded-lg py-2 text-center text-sm font-black text-gray-800 outline-none focus:border-blue-500"
                                                    />
                                                    <button onClick={() => quitarDelCarrito(item.producto.id)} className="w-10 h-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"><MdDelete className="text-xl"/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PANEL DERECHO: Responsiva y Chips */}
                        <div className="flex-[2] bg-white flex flex-col relative z-10 border-l border-gray-200">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2"><MdPerson className="text-blue-500 text-lg"/> Confirmación de Responsiva</h3>
                                
                                {/* BUSCADOR DE COLABORADOR CUSTOM UI */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Colaborador que Recibe *</label>
                                    
                                    {colabSeleccionado ? (
                                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between animate-fade-in shadow-sm">
                                            <div className="flex items-center gap-3">
                                                {colabSeleccionado.foto ? <img src={colabSeleccionado.foto} className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white"/> : <div className="w-12 h-12 bg-white text-blue-300 rounded-full flex items-center justify-center border-2 border-blue-100"><MdPerson className="text-2xl"/></div>}
                                                <div>
                                                    <p className="text-sm font-black text-blue-900">{colabSeleccionado.nombre}</p>
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">{colabSeleccionado.puesto} • {colabSeleccionado.marca}</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setColabSeleccionado(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 hover:bg-red-500 hover:text-white transition-colors"><MdClose className="text-lg"/></button>
                                        </div>
                                    ) : (
                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                            <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg"/>
                                            <input 
                                                type="text" value={busquedaColab} 
                                                onChange={e => { setBusquedaColab(e.target.value); setMostrarDropdownColab(true); }}
                                                onClick={() => setMostrarDropdownColab(true)}
                                                placeholder="Buscar por nombre o puesto..." 
                                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:border-blue-500 shadow-sm"
                                            />
                                            
                                            {mostrarDropdownColab && (
                                                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar overflow-hidden">
                                                    {colabsFiltrados.length === 0 ? (
                                                        <div className="p-5 text-center text-xs font-bold text-gray-400">No se encontraron coincidencias.</div>
                                                    ) : (
                                                        colabsFiltrados.map(c => (
                                                            <div key={c.id} onClick={() => { setColabSeleccionado(c); setMostrarDropdownColab(false); setBusquedaColab(''); }} className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                                                                {c.foto ? <img src={c.foto} className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center"><MdPerson className="text-lg"/></div>}
                                                                <div>
                                                                    <p className="text-xs font-black text-gray-800">{c.nombre}</p>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">{c.puesto} • {c.region}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* SMART CHIPS PARA DESTINO */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdStore/> Destino Físico (Obra/Cliente) *</label>
                                    <div className="flex flex-wrap gap-2 mb-3 min-h-[30px]">
                                        {getSugerencias().destinos.map(sug => (
                                            <button type="button" key={sug} onClick={() => setDestino(sug)} className={`px-3 py-1.5 border rounded-full text-[10px] font-bold transition-all active:scale-95 ${destino === sug ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{sug}</button>
                                        ))}
                                    </div>
                                    <input type="text" required value={destino} onChange={e => setDestino(e.target.value)} placeholder="O escribe el destino específico..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>

                                {/* SMART CHIPS PARA MOTIVO */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdLightbulbOutline className="text-yellow-500"/> Propósito / Observaciones *</label>
                                    <div className="flex flex-wrap gap-2 mb-3 min-h-[30px]">
                                        {getSugerencias().motivos.map(sug => (
                                            <button type="button" key={sug} onClick={() => setMotivo(sug)} className={`px-3 py-1.5 border rounded-full text-[10px] font-bold transition-all active:scale-95 ${motivo === sug ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{sug}</button>
                                        ))}
                                    </div>
                                    <textarea required value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="O detalla el motivo del retiro..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 h-20 resize-none"></textarea>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0">
                                <div className="flex justify-between items-center mb-5">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Artículos:</span>
                                    <span className="text-3xl font-black text-gray-900">{carrito.reduce((acc, c) => acc + c.cantidad, 0)}</span>
                                </div>
                                <button 
                                    onClick={handleDespachar} 
                                    disabled={isSubmitting || carrito.length === 0} 
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-black shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <MdCheckCircle className="text-xl"/>}
                                    Confirmar y Generar Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // ---------------- VISTA DE TICKET GENERADO (TÉRMICA 80mm) ----------------
                <div className="flex flex-col items-center w-full max-w-sm animate-scale-in">
                    <div className="zona-ticket bg-white shadow-2xl p-6 w-[80mm] min-h-[100mm] text-black">
                        <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                            <h2 className="text-xl font-black mb-1 tracking-tighter uppercase">JAVAK LOGÍSTICA</h2>
                            <p className="text-xs uppercase font-bold">Ticket de Entrega de Material</p>
                            <p className="text-[10px] mt-2 font-bold uppercase">Folio: {ticketGenerado.folio}</p>
                            <p className="text-[10px]">{ticketGenerado.fecha.toLocaleString('es-MX')}</p>
                        </div>
                        
                        <div className="text-xs mb-4 space-y-1 uppercase font-medium">
                            <p><strong>Despachó:</strong> {ticketGenerado.encargado}</p>
                            <p><strong>Recibe:</strong> {ticketGenerado.recibe}</p>
                            <p><strong>Destino:</strong> {ticketGenerado.destino}</p>
                            <p><strong>Motivo:</strong> {ticketGenerado.proposito}</p>
                        </div>

                        <div className="border-b-2 border-dashed border-gray-300 pb-2 mb-2 text-[10px] font-black flex justify-between uppercase">
                            <span>Cant.</span>
                            <span className="flex-1 ml-2">Artículo</span>
                        </div>
                        
                        <div className="space-y-3 text-[10px] mb-6 font-bold">
                            {ticketGenerado.items.map(item => (
                                <div key={item.producto.id} className="flex items-start">
                                    <span className="w-8 text-center">{item.cantidad}</span>
                                    <span className="flex-1 ml-2 uppercase leading-tight">{item.producto.nombre} <br/><span className="text-[8px] text-gray-500">{item.producto.marca}</span></span>
                                </div>
                            ))}
                        </div>

                        <div className="text-center border-t-2 border-dashed border-gray-300 pt-6 mt-8">
                            <p className="text-[10px] mb-10 uppercase font-bold">Firma de Conformidad</p>
                            <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                            <p className="text-[10px] font-black uppercase">{ticketGenerado.recibe}</p>
                            <p className="text-[8px] mt-4 italic text-center font-medium">El material entregado es responsabilidad del técnico a partir de la firma.</p>
                        </div>
                    </div>

                    <div className="no-print w-full flex gap-3 mt-6">
                        <button onClick={resetear} className="flex-1 bg-white hover:bg-gray-100 text-gray-800 font-black py-4 rounded-2xl shadow-lg transition-colors">Terminar</button>
                        <button onClick={handleImprimir} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"><MdPrint className="text-xl"/> Imprimir Ticket 80mm</button>
                    </div>
                </div>
            )}
        </div>
    );
}