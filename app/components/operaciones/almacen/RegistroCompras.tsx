/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/RegistroCompras.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdShoppingCart, MdAdd, MdDelete, MdSave, MdFileUpload, MdCheckCircle } from "react-icons/md";

const MARCAS_DISPONIBLES = ['JAVAK (Corporativo)', 'DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel', 'Fundación Frenxo'];
const REGIONES_DISPONIBLES = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];

export default function RegistroCompras({ useData, usuarioActivo }) {
    const { inventario, registrarCompra } = useData;
    const [proveedor, setProveedor] = useState('');
    const [archivoBase64, setArchivoBase64] = useState('');
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Los administradores regionales por defecto ven su marca y región seleccionada
    const miRegion = usuarioActivo?.region !== 'N/A' ? usuarioActivo?.region : REGIONES_DISPONIBLES[0];
    const miMarca = usuarioActivo?.marca !== 'N/A' ? usuarioActivo?.marca : MARCAS_DISPONIBLES[0];

    const [items, setItems] = useState([{ productoBaseId: '', cantidad: 1, marca: miMarca, region: miRegion }]);

    // Solo mostramos en el dropdown los productos "BASE" genéricos para comprar
    const catalogoBase = inventario.filter(p => p.almacen === 'CATALOGO_BASE');

    const handleAgregarItem = () => setItems([...items, { productoBaseId: '', cantidad: 1, marca: miMarca, region: miRegion }]);
    const handleQuitarItem = (index) => setItems(items.filter((_, i) => i !== index));
    const handleCambioItem = (index, campo, valor) => {
        const nuevos = [...items];
        nuevos[index][campo] = valor;
        setItems(nuevos);
    };

    // --- MOTOR DE COMPRESIÓN DE IMÁGENES ---
    const handleSubirArchivo = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setNombreArchivo(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Reducimos el tamaño para no saturar la BD
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Comprimimos a JPEG calidad media (0.6)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                setArchivoBase64(compressedDataUrl);
            };
            // Si no es imagen (ej. PDF), lo guardamos como base64 directo (cuidado con PDFs gigantes)
            if(file.type.startsWith('image/')) {
                img.src = event.target.result;
            } else {
                setArchivoBase64(event.target.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        const itemsValidos = items.filter(i => i.productoBaseId && i.cantidad > 0);
        if(itemsValidos.length === 0) return alert("Selecciona al menos un artículo base.");

        setIsSubmitting(true);
        const payload = {
            proveedor,
            factura_url: archivoBase64, // Guardamos la foto comprimida o PDF
            total_articulos: itemsValidos.reduce((acc, el) => acc + parseInt(el.cantidad), 0),
            usuario_registro_id: usuarioActivo.id
        };

        const res = await registrarCompra(payload, itemsValidos);
        setIsSubmitting(false);

        if(res.success) {
            alert("✅ Compra registrada. Los productos han sido asignados y clonados a sus sucursales correspondientes.");
            setProveedor(''); setArchivoBase64(''); setNombreArchivo(''); setItems([{ productoBaseId: '', cantidad: 1, marca: miMarca, region: miRegion }]);
        } else {
            alert("Error registrando compra.");
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdShoppingCart className="text-blue-600"/> Ingreso de Mercancía a Sucursales</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sube la factura y asigna los productos a una marca/región</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <form onSubmit={handleGuardar} className="max-w-4xl mx-auto space-y-6">
                    
                    {/* DATOS DE COMPRA Y ARCHIVO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Nombre del Proveedor *</label>
                            <input required type="text" value={proveedor} onChange={e=>setProveedor(e.target.value)} placeholder="Ej. Syscom, Steren, Home Depot..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Comprobante / Factura (Autocompresión)</label>
                            <div className="relative w-full">
                                <input type="file" accept="image/*,application/pdf" onChange={handleSubirArchivo} className="hidden" id="file-upload" />
                                <label htmlFor="file-upload" className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors ${archivoBase64 ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100'}`}>
                                    <span className="text-sm font-bold truncate pr-4">{nombreArchivo || 'Subir foto del ticket o PDF...'}</span>
                                    {archivoBase64 ? <MdCheckCircle className="text-xl shrink-0"/> : <MdFileUpload className="text-xl shrink-0"/>}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* LISTA DE PARTIDAS (MULTI-SUCURSAL) */}
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">Detalle de Artículos Comprados</h4>
                                <p className="text-[10px] text-blue-600/70 font-medium">Asigna hacia qué sucursal y empresa va cada pieza</p>
                            </div>
                            <button type="button" onClick={handleAgregarItem} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-md active:scale-95"><MdAdd className="text-lg"/> Añadir Fila</button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-white p-3 rounded-xl border border-blue-100 shadow-sm relative">
                                    <div className="w-full md:flex-1 min-w-[200px]">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Producto Base</label>
                                        <select required value={item.productoBaseId} onChange={e=>handleCambioItem(idx, 'productoBaseId', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-800 outline-none">
                                            <option value="">Selecciona plantilla base...</option>
                                            {catalogoBase.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-1/2 md:w-36">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Marca Destino</label>
                                        <select required value={item.marca} onChange={e=>handleCambioItem(idx, 'marca', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-[10px] font-black text-gray-700 outline-none uppercase tracking-wide">
                                            {MARCAS_DISPONIBLES.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-1/2 md:w-36">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Región Destino</label>
                                        <select required value={item.region} onChange={e=>handleCambioItem(idx, 'region', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-[10px] font-black text-gray-700 outline-none uppercase tracking-wide">
                                            {REGIONES_DISPONIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-20 md:w-24">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 text-center">Cant.</label>
                                        <input required type="number" min="1" value={item.cantidad} onChange={e=>handleCambioItem(idx, 'cantidad', e.target.value)} className="w-full bg-blue-50 border-2 border-blue-200 rounded-lg px-2 py-1.5 text-sm font-black text-center text-blue-800 outline-none focus:border-blue-500" />
                                    </div>
                                    <button type="button" onClick={()=>handleQuitarItem(idx)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-4 md:mt-0 absolute md:relative top-2 right-2 md:top-auto md:right-auto"><MdDelete className="text-xl"/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50">
                        <MdSave className="text-lg"/> Cargar Documento e Ingresar Stock
                    </button>
                </form>
            </div>
        </div>
    );
}