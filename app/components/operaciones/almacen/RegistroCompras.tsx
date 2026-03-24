/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/RegistroCompras.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdShoppingCart, MdAdd, MdDelete, MdSave, MdFileUpload, MdCheckCircle } from "react-icons/md";

const MARCAS_DISPONIBLES = ['JAVAK (Corporativo)', 'DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel', 'Fundación Frenxo'];

// SEPARACIÓN CORRECTA: Almacén General es independiente de Centro
const REGIONES_DISPONIBLES = [
    'Almacén General', 'Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 
    'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río',
    'WifiCel', 'RK', 'Fibrox MX', 'Intercheap'
];

export default function RegistroCompras({ useData, usuarioActivo }) {
    const { inventario, registrarCompra } = useData;
    const [proveedor, setProveedor] = useState('');
    const [archivoBase64, setArchivoBase64] = useState('');
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rolNormalizado = (usuarioActivo?.rol || usuarioActivo?.puesto || '').toUpperCase().trim();
    const ROLES_ADMIN_GENERAL = ['ENCARGADO_ALMACEN', 'ENCARGADO DE ALMACÉN', 'ENCARGADO DE ALMACEN', 'GERENTE_GENERAL', 'GERENTE GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
    const esAdminGeneral = rolNormalizado !== '' && ROLES_ADMIN_GENERAL.includes(rolNormalizado);

    const miRegion = (usuarioActivo?.region && usuarioActivo.region !== 'N/A') ? usuarioActivo.region : REGIONES_DISPONIBLES[0];
    const miMarca = (usuarioActivo?.marca && usuarioActivo.marca !== 'N/A') ? usuarioActivo.marca : MARCAS_DISPONIBLES[0];

    const marcasPermitidas = esAdminGeneral ? MARCAS_DISPONIBLES : [miMarca];
    const regionesPermitidas = esAdminGeneral ? REGIONES_DISPONIBLES : [miRegion];

    const [items, setItems] = useState([{ productoBaseId: '', cantidad: 1, marca: miMarca, region: miRegion }]);
    const catalogoBase = inventario.filter(p => p.almacen === 'CATALOGO_BASE');

    const handleAgregarItem = () => setItems([...items, { productoBaseId: '', cantidad: 1, marca: miMarca, region: miRegion }]);
    const handleQuitarItem = (index) => setItems(items.filter((_, i) => i !== index));
    const handleCambioItem = (index, campo, valor) => {
        const nuevos = [...items];
        nuevos[index][campo] = valor;
        setItems(nuevos);
    };

    const handleSubirArchivo = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return alert("⚠️ Archivo muy pesado (Max 2MB).");
        setNombreArchivo(file.name);
        const reader = new FileReader();
        reader.onload = (event) => setArchivoBase64(event.target.result);
        reader.readAsDataURL(file);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        const itemsValidos = items.filter(i => i.productoBaseId && i.cantidad > 0);
        if(itemsValidos.length === 0) return alert("Selecciona al menos un artículo base.");

        setIsSubmitting(true);
        try {
            const payload = {
                proveedor, factura_url: archivoBase64,
                total_articulos: itemsValidos.reduce((acc, el) => acc + parseInt(el.cantidad), 0),
                usuario_registro_id: usuarioActivo?.id || 'SISTEMA'
            };

            const res = await registrarCompra(payload, itemsValidos);

            if(res.success) {
                alert("✅ Compra registrada correctamente en el inventario.");
                setProveedor(''); setArchivoBase64(''); setNombreArchivo(''); setItems([{ productoBaseId: '', cantidad: 1, marca: miMarca, region: miRegion }]);
            } else alert("❌ Error en BD.");
        } catch (err) { alert("❌ Error: " + err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdShoppingCart className="text-blue-600"/> Ingreso de Mercancía a Sucursales</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sube la factura y asigna los productos a una marca y ubicación física</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <form onSubmit={handleGuardar} className="max-w-4xl mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Nombre Proveedor *</label>
                            <input required type="text" value={proveedor} onChange={e=>setProveedor(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Comprobante / Factura</label>
                            <div className="relative w-full">
                                <input type="file" onChange={handleSubirArchivo} className="hidden" id="file-upload" />
                                <label htmlFor="file-upload" className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors ${archivoBase64 ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
                                    <span className="text-sm font-bold truncate pr-4">{nombreArchivo || 'Subir PDF o foto...'}</span>
                                    {archivoBase64 ? <MdCheckCircle className="text-xl"/> : <MdFileUpload className="text-xl"/>}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">Detalle de Artículos</h4>
                            </div>
                            <button type="button" onClick={handleAgregarItem} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-blue-700 shadow-md active:scale-95"><MdAdd className="text-lg"/> Añadir Fila</button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-white p-3 rounded-xl border border-blue-100 shadow-sm relative">
                                    <div className="w-full md:flex-1 min-w-[200px]">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Producto Base</label>
                                        <select required value={item.productoBaseId} onChange={e=>handleCambioItem(idx, 'productoBaseId', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-gray-800 outline-none">
                                            <option value="">Selecciona plantilla...</option>
                                            {catalogoBase.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-1/2 md:w-36">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Propietario (Marca)</label>
                                        <select required disabled={!esAdminGeneral} value={item.marca} onChange={e=>handleCambioItem(idx, 'marca', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-[10px] font-black text-gray-700 outline-none uppercase cursor-pointer">
                                            {marcasPermitidas.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-1/2 md:w-36">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Ubicación Física</label>
                                        <select required disabled={!esAdminGeneral} value={item.region} onChange={e=>handleCambioItem(idx, 'region', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-[10px] font-black text-gray-700 outline-none uppercase cursor-pointer">
                                            {regionesPermitidas.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-20 md:w-24">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 text-center">Cant.</label>
                                        <input required type="number" min="1" value={item.cantidad} onChange={e=>handleCambioItem(idx, 'cantidad', e.target.value)} className="w-full bg-blue-50 border-2 border-blue-200 rounded-lg px-2 py-1.5 text-sm font-black text-center text-blue-800 outline-none" />
                                    </div>
                                    <button type="button" onClick={()=>handleQuitarItem(idx)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-4 md:mt-0 absolute md:relative top-2 right-2"><MdDelete className="text-xl"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
                        <MdSave className="text-lg"/> Cargar e Ingresar Stock
                    </button>
                </form>
            </div>
        </div>
    );
}