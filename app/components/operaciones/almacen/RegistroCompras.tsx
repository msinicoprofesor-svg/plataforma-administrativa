/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/RegistroCompras.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdShoppingCart, MdAdd, MdDelete, MdSave } from "react-icons/md";

export default function RegistroCompras({ useData, usuarioActivo }) {
    const { inventario, registrarCompra } = useData;
    const [proveedor, setProveedor] = useState('');
    const [facturaUrl, setFacturaUrl] = useState('');
    const [items, setItems] = useState([{ productoId: '', cantidad: 1 }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAgregarItem = () => setItems([...items, { productoId: '', cantidad: 1 }]);
    const handleQuitarItem = (index) => setItems(items.filter((_, i) => i !== index));
    const handleCambioItem = (index, campo, valor) => {
        const nuevos = [...items];
        nuevos[index][campo] = valor;
        setItems(nuevos);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        const itemsValidos = items.filter(i => i.productoId && i.cantidad > 0);
        if(itemsValidos.length === 0) return alert("Agrega al menos un producto válido.");

        setIsSubmitting(true);
        const payload = {
            proveedor,
            factura_url: facturaUrl,
            total_articulos: itemsValidos.reduce((acc, el) => acc + parseInt(el.cantidad), 0),
            usuario_registro_id: usuarioActivo.id
        };

        const res = await registrarCompra(payload, itemsValidos);
        setIsSubmitting(false);

        if(res.success) {
            alert("Compra registrada y stock actualizado.");
            setProveedor(''); setFacturaUrl(''); setItems([{ productoId: '', cantidad: 1 }]);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdShoppingCart className="text-blue-600"/> Ingreso de Mercancía</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registra compras y actualiza el stock</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <form onSubmit={handleGuardar} className="max-w-3xl mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Proveedor</label>
                            <input required type="text" value={proveedor} onChange={e=>setProveedor(e.target.value)} placeholder="Nombre del proveedor..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">URL de Factura (Opcional)</label>
                            <input type="url" value={facturaUrl} onChange={e=>setFacturaUrl(e.target.value)} placeholder="Enlace a Drive o PDF..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                        <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-4 flex justify-between items-center">
                            Artículos Comprados
                            <button type="button" onClick={handleAgregarItem} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-colors"><MdAdd/> Añadir Fila</button>
                        </h4>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-white p-2 rounded-xl border border-blue-50">
                                    <div className="flex-1">
                                        <select required value={item.productoId} onChange={e=>handleCambioItem(idx, 'productoId', e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none">
                                            <option value="">Selecciona un producto del catálogo...</option>
                                            {inventario.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.marca}) - Stock: {p.stock}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <input required type="number" min="1" value={item.cantidad} onChange={e=>handleCambioItem(idx, 'cantidad', e.target.value)} placeholder="Cant." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-black text-center text-gray-800 outline-none focus:border-blue-500" />
                                    </div>
                                    <button type="button" onClick={()=>handleQuitarItem(idx)} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><MdDelete className="text-xl"/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
                        <MdSave className="text-lg"/> Registrar Compra e Ingresar Stock
                    </button>
                </form>
            </div>
        </div>
    );
}