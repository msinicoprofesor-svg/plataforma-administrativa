/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/CatalogoLikeStore.tsx (NUEVO - VISTA SOLO LECTURA) */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdStorefront, MdSearch, MdDateRange } from "react-icons/md";

export default function CatalogoLikeStore({ useData }) {
  // Extraemos solo lo necesario: la lista de productos
  const { productos } = useData;
  const [busqueda, setBusqueda] = useState('');

  // Filtro de búsqueda local
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#F5F7FA] md:bg-gray-50/50 md:rounded-[2.5rem] rounded-none overflow-hidden relative">
      
      {/* --- HEADER SIMPLIFICADO --- */}
      <div className="bg-white p-3 md:p-6 shadow-sm z-10 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-500 text-xl md:text-2xl shadow-sm">
            <MdStorefront />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight leading-none">Catálogo LikeStore</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Vista de Disponibilidad</p>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="relative w-full md:w-96 group">
            <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
            <input 
                type="text" 
                placeholder="Buscar producto..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)}
            />
        </div>
      </div>

      {/* --- GRILLA DE PRODUCTOS --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {productosFiltrados.map(prod => (
                <div key={prod.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative group hover:shadow-md transition-all">
                    
                    {/* Badge de Caducidad (Si existe) */}
                    {prod.caducidad && (
                        <div className="absolute top-3 right-3 bg-gray-100 text-gray-500 text-[8px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                            <MdDateRange/> {prod.caducidad}
                        </div>
                    )}
                    
                    {/* Imagen y Datos */}
                    <div className="text-center my-4">
                        <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform cursor-default">
                            {prod.imagen}
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 h-10 flex items-center justify-center">
                            {prod.nombre}
                        </h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-wider">
                            {prod.categoria}
                        </p>
                    </div>

                    {/* Footer Tarjeta: Precio y Stock */}
                    <div className="flex items-center justify-between mt-auto bg-gray-50 p-3 rounded-2xl">
                        <span className="text-sm font-black text-gray-700">
                            {prod.puntos} pts
                        </span>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Disponibles</p>
                            <p className={`text-xs font-black ${prod.stock > 0 ? 'text-green-600' : 'text-red-400'}`}>
                                {prod.stock}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}