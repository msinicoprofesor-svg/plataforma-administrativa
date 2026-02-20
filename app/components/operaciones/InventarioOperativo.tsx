/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/InventarioOperativo.tsx (VISTA HARDWARE)           */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdInventory2, MdAdd, MdRemove, MdSearch, MdWarning, MdCheckCircle, MdStore, MdVideocam, MdWifiTethering } from "react-icons/md";

export default function InventarioOperativo({ useData }) {
  const { inventario, registrarMovimiento } = useData;
  const [busqueda, setBusqueda] = useState('');
  const [almacenActivo, setAlmacenActivo] = useState('CENTRO');
  const [modalOpen, setModalOpen] = useState(false);
  const [productoSel, setProductoSel] = useState(null);
  const [tipoMov, setTipoMov] = useState('SALIDA');
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('');

  const productos = inventario.filter(p => p.almacen === almacenActivo && p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const config = {
    'CENTRO': { color: 'blue', titulo: 'Centro (General)', icono: <MdStore/> },
    'RK': { color: 'orange', titulo: 'Almacén RK', icono: <MdVideocam/> },
    'WIFICEL': { color: 'purple', titulo: 'Almacén WifiCel', icono: <MdWifiTethering/> }
  };

  const procesar = () => {
    if(!productoSel) return;
    if(tipoMov === 'SALIDA' && cantidad > productoSel.stock) return alert("Stock insuficiente");
    registrarMovimiento(productoSel.id, cantidad, tipoMov, motivo, 'Almacenista');
    setModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2"><MdInventory2 className="text-blue-600" /> Almacén Operativo</h2>
                <div className="relative w-64"><MdSearch className="absolute left-4 top-3.5 text-gray-400 text-xl" /><input type="text" placeholder="Buscar material..." className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none text-sm font-bold" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/></div>
            </div>
            
            <div className="flex p-1 bg-gray-100 rounded-2xl">
                {Object.keys(config).map(k => (
                    <button key={k} onClick={()=>setAlmacenActivo(k)} className={`flex-1 py-3 rounded-xl text-sm font-bold flex justify-center gap-2 transition-all ${almacenActivo===k ? 'bg-white text-gray-800 shadow-md' : 'text-gray-400'}`}>
                        {config[k].icono} {config[k].titulo}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm flex-1 overflow-hidden p-6 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
                <thead className="text-xs text-gray-400 uppercase border-b border-gray-100"><tr><th className="pb-4 pl-4">Producto</th><th className="pb-4 text-center">Stock</th><th className="pb-4 text-right pr-4">Acciones</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                    {productos.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50"><td className="py-4 pl-4"><p className="font-bold text-gray-800">{p.nombre}</p><p className="text-xs text-gray-400">{p.categoria}</p></td><td className="py-4 text-center font-bold text-gray-800">{p.stock} {p.unidad}</td><td className="py-4 text-right pr-4 flex justify-end gap-2"><button onClick={()=>{setProductoSel(p); setTipoMov('ENTRADA'); setCantidad(1); setModalOpen(true)}} className="p-2 bg-green-100 text-green-700 rounded-lg"><MdAdd/></button><button onClick={()=>{setProductoSel(p); setTipoMov('SALIDA'); setCantidad(1); setModalOpen(true)}} className="p-2 bg-red-100 text-red-700 rounded-lg"><MdRemove/></button></td></tr>
                    ))}
                </tbody>
            </table>
        </div>

        {modalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6">
                    <h3 className="text-xl font-black text-center mb-4">{tipoMov} MATERIAL</h3>
                    <p className="text-center text-sm text-gray-500 mb-6">{productoSel.nombre}</p>
                    <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl text-center text-2xl font-black mb-4" value={cantidad} onChange={e=>setCantidad(e.target.value)}/>
                    <input type="text" placeholder="Referencia (Obra/Factura)" className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold mb-4 outline-none" value={motivo} onChange={e=>setMotivo(e.target.value)}/>
                    <div className="flex gap-2">
                        <button onClick={()=>setModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold bg-gray-100 rounded-xl">Cancelar</button>
                        <button onClick={procesar} className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl">Confirmar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}