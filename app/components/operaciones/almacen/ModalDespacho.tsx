/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/ModalDespacho.tsx              */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef, useEffect } from 'react';
import { MdClose, MdPointOfSale, MdQrCodeScanner, MdShoppingCart, MdDelete, MdPrint, MdCheckCircle, MdPerson, MdStore } from "react-icons/md";

export default function ModalDespacho({ isOpen, onClose, useData, usuarioActivo, colaboradores = [] }) {
    const { inventario, registrarMovimiento } = useData;
    
    const [carrito, setCarrito] = useState([]);
    const [busquedaLector, setBusquedaLector] = useState('');
    
    // Datos de Entrega
    const [colaboradorId, setColaboradorId] = useState('');
    const [destino, setDestino] = useState('');
    const [motivo, setMotivo] = useState('Uso interno / Instalación');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketGenerado, setTicketGenerado] = useState(null); // Guarda los datos del ticket al terminar

    const lectorRef = useRef(null);

    // Auto-focus en el lector al abrir el modal para que el encargado use la pistola de códigos rápido
    useEffect(() => {
        if (isOpen && lectorRef.current && !ticketGenerado) {
            lectorRef.current.focus();
        }
    }, [isOpen, ticketGenerado]);

    if (!isOpen) return null;

    // Solo podemos despachar stock físico real
    const stockFisico = inventario.filter(p => p.almacen !== 'CATALOGO_BASE' && p.stock > 0);

    const handleScan = (e) => {
        e.preventDefault();
        if(!busquedaLector.trim()) return;

        // Simulamos la búsqueda del código de barras por el nombre, marca o serie
        const q = busquedaLector.toLowerCase();
        const productoEncontrado = stockFisico.find(p => 
            p.nombre.toLowerCase().includes(q) || 
            (p.marca && p.marca.toLowerCase().includes(q))
        );

        if (productoEncontrado) {
            agregarAlCarrito(productoEncontrado);
            setBusquedaLector(''); // Limpiamos para el siguiente bip
        } else {
            alert("❌ Producto no encontrado o sin stock disponible.");
        }
    };

    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const existe = prev.find(item => item.producto.id === producto.id);
            if (existe) {
                if (existe.cantidad >= producto.stock) {
                    alert(`Solo hay ${producto.stock} unidades de ${producto.nombre} disponibles.`);
                    return prev;
                }
                return prev.map(item => item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { producto, cantidad: 1 }];
        });
    };

    const quitarDelCarrito = (idProducto) => {
        setCarrito(prev => prev.filter(item => item.producto.id !== idProducto));
    };

    const modificarCantidad = (idProducto, nuevaCant) => {
        const cant = parseInt(nuevaCant);
        if (isNaN(cant) || cant < 1) return;
        
        setCarrito(prev => prev.map(item => {
            if (item.producto.id === idProducto) {
                if (cant > item.producto.stock) {
                    alert(`Máximo disponible: ${item.producto.stock}`);
                    return item;
                }
                return { ...item, cantidad: cant };
            }
            return item;
        }));
    };

    const handleDespachar = async (e) => {
        e.preventDefault();
        if (carrito.length === 0) return alert("El carrito está vacío.");
        if (!colaboradorId) return alert("Debes seleccionar a quién le entregas el material.");
        if (!destino.trim()) return alert("Debes indicar el destino de la instalación/uso.");

        setIsSubmitting(true);
        const colab = colaboradores.find(c => c.id === colaboradorId);
        const nombreColab = colab ? colab.nombre : 'Usuario Desconocido';
        const horaEntrega = new Date();

        try {
            // Descontamos del inventario uno por uno
            for (const item of carrito) {
                const motivoCompleto = `Despacho Mostrador | Entregado a: ${nombreColab} | Destino: ${destino} | Motivo: ${motivo}`;
                await registrarMovimiento(
                    item.producto.id, 
                    item.cantidad, 
                    'SALIDA', 
                    motivoCompleto, 
                    usuarioActivo?.nombre || 'Administrador'
                );
            }

            // Generamos la data para el Ticket Térmico
            setTicketGenerado({
                folio: `DSP-${Date.now().toString().slice(-6)}`,
                fecha: horaEntrega,
                encargado: usuarioActivo?.nombre || 'Administrador',
                recibe: nombreColab,
                destino: destino,
                proposito: motivo,
                items: carrito
            });

        } catch (error) {
            alert("Error al despachar el material.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImprimir = () => {
        window.print();
    };

    const resetear = () => {
        setCarrito([]); setBusquedaLector(''); setColaboradorId(''); setDestino(''); setMotivo('Uso interno / Instalación'); setTicketGenerado(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
            
            {/* ESTILOS EXCLUSIVOS PARA IMPRESIÓN TÉRMICA */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .zona-ticket, .zona-ticket * { visibility: visible; }
                    .zona-ticket { position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 5mm; font-family: monospace; font-size: 12px; color: black; box-shadow: none; background: white; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {!ticketGenerado ? (
                // ---------------- VISTA DE PUNTO DE VENTA (CAJERO) ----------------
                <div className="bg-gray-100 rounded-[2rem] w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
                    
                    {/* CABECERA POS */}
                    <div className="bg-gray-900 text-white p-5 flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-xl font-black flex items-center gap-2"><MdPointOfSale className="text-blue-400"/> Punto de Despacho Rápido</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Salida de almacén con responsiva</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-gray-800 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"><MdClose className="text-2xl"/></button>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                        {/* PANEL IZQUIERDO: Escáner y Carrito */}
                        <div className="flex-[3] bg-white border-r border-gray-200 flex flex-col">
                            {/* ESCÁNER */}
                            <form onSubmit={handleScan} className="p-5 border-b border-gray-100 bg-blue-50/30">
                                <label className="block text-[10px] font-black text-blue-600 uppercase mb-2 flex items-center gap-1"><MdQrCodeScanner className="text-lg"/> Escáner / Búsqueda Rápida</label>
                                <input 
                                    ref={lectorRef} type="text" value={busquedaLector} onChange={e => setBusquedaLector(e.target.value)}
                                    placeholder="Bipea el código o escribe el nombre y presiona Enter..." 
                                    className="w-full bg-white border-2 border-blue-200 rounded-xl px-5 py-4 text-lg font-black text-gray-800 outline-none focus:border-blue-500 shadow-sm"
                                />
                            </form>

                            {/* TABLA DEL CARRITO */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-2">
                                {carrito.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                        <MdShoppingCart className="text-6xl mb-3"/>
                                        <p className="font-bold text-sm">El carrito está vacío</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {carrito.map(item => (
                                            <div key={item.producto.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3 animate-fade-in">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-gray-800 truncate">{item.producto.nombre}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.producto.marca} • {item.producto.almacen}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="number" min="1" max={item.producto.stock} value={item.cantidad} 
                                                        onChange={(e) => modificarCantidad(item.producto.id, e.target.value)}
                                                        className="w-16 bg-gray-100 border border-gray-300 rounded-lg py-1.5 text-center text-sm font-black text-gray-800 outline-none focus:border-blue-500"
                                                    />
                                                    <span className="text-[10px] font-bold text-gray-400 w-10">unid.</span>
                                                    <button onClick={() => quitarDelCarrito(item.producto.id)} className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"><MdDelete className="text-lg"/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PANEL DERECHO: Datos de Entrega y Botón de Pago */}
                        <div className="flex-[2] bg-white flex flex-col">
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2"><MdPerson className="text-blue-500 text-lg"/> Datos de Responsiva</h3>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Colaborador que Recibe *</label>
                                    <select required value={colaboradorId} onChange={e => setColaboradorId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        <option value="">Selecciona al técnico...</option>
                                        {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.puesto})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdStore/> Destino Físico (Obra/Cliente) *</label>
                                    <input required type="text" value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ej. Instalación Cliente Juriquilla" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Propósito / Observaciones</label>
                                    <select required value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 mb-2">
                                        <option value="Uso interno / Instalación">Uso interno / Instalación</option>
                                        <option value="Reposición por daño">Reposición por daño</option>
                                        <option value="Stock para vehículo">Stock para vehículo</option>
                                        <option value="Demostración a cliente">Demostración a cliente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-black text-gray-500 uppercase">Total de Artículos:</span>
                                    <span className="text-2xl font-black text-gray-900">{carrito.reduce((acc, c) => acc + c.cantidad, 0)}</span>
                                </div>
                                <button 
                                    onClick={handleDespachar} 
                                    disabled={isSubmitting || carrito.length === 0} 
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
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
                    
                    {/* TICKET VISUAL (El que se va a imprimir) */}
                    <div className="zona-ticket bg-white shadow-2xl p-6 w-[80mm] min-h-[100mm] text-black">
                        <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                            <h2 className="text-xl font-black mb-1 tracking-tighter uppercase">JAVAK LOGÍSTICA</h2>
                            <p className="text-xs uppercase">Ticket de Entrega de Material</p>
                            <p className="text-[10px] mt-2 font-bold">Folio: {ticketGenerado.folio}</p>
                            <p className="text-[10px]">{ticketGenerado.fecha.toLocaleString('es-MX')}</p>
                        </div>
                        
                        <div className="text-xs mb-4 space-y-1">
                            <p><strong>Despachó:</strong> {ticketGenerado.encargado}</p>
                            <p><strong>Recibe:</strong> {ticketGenerado.recibe}</p>
                            <p><strong>Destino:</strong> {ticketGenerado.destino}</p>
                            <p><strong>Motivo:</strong> {ticketGenerado.proposito}</p>
                        </div>

                        <div className="border-b-2 border-dashed border-gray-300 pb-2 mb-2 text-[10px] font-black flex justify-between uppercase">
                            <span>Cant.</span>
                            <span className="flex-1 ml-2">Artículo</span>
                        </div>
                        
                        <div className="space-y-2 text-[10px] mb-6">
                            {ticketGenerado.items.map(item => (
                                <div key={item.producto.id} className="flex items-start">
                                    <span className="w-8 font-bold text-center">{item.cantidad}</span>
                                    <span className="flex-1 ml-2 uppercase leading-tight">{item.producto.nombre} <br/><span className="text-[8px] text-gray-500">{item.producto.marca}</span></span>
                                </div>
                            ))}
                        </div>

                        <div className="text-center border-t-2 border-dashed border-gray-300 pt-6 mt-8">
                            <p className="text-[10px] mb-8 uppercase">Firma de Conformidad</p>
                            <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                            <p className="text-[9px] font-bold uppercase">{ticketGenerado.recibe}</p>
                            <p className="text-[8px] mt-4 italic text-center">El material entregado es responsabilidad del técnico a partir de la firma de este documento.</p>
                        </div>
                    </div>

                    {/* BOTONES DE CONTROL (No se imprimen) */}
                    <div className="no-print w-full flex gap-3 mt-6">
                        <button onClick={resetear} className="flex-1 bg-white hover:bg-gray-100 text-gray-800 font-black py-4 rounded-2xl shadow-lg transition-colors">Terminar</button>
                        <button onClick={handleImprimir} className="flex-[2] bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"><MdPrint className="text-xl"/> Imprimir Ticket 80mm</button>
                    </div>
                </div>
            )}
        </div>
    );
}