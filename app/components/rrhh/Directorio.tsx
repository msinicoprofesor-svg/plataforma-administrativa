/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/Directorio.tsx (COMPONENTE VISUAL)            */
/* -------------------------------------------------------------------------- */
'use client';

import * as XLSX from 'xlsx'; 
import { 
  MdSearch, MdAdd, MdEdit, MdVisibility, MdDeleteOutline 
} from "react-icons/md";
import { FaFileExcel } from "react-icons/fa";

export default function Directorio({ 
    colaboradores, 
    busqueda, 
    setBusqueda, 
    paginacion, 
    onNuevo, 
    onVer, 
    onEditar, 
    onEliminar, 
    onImportar 
}) {

  // Lógica interna para leer el Excel y pasárselo limpio al sistema
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      // Formateamos los datos para que coincidan con el sistema
      const colaboradoresFormateados = data.map((row: any) => ({
        id: row.ID || row.id || `IMP-${Math.floor(Math.random()*1000)}`,
        nombre: row.Nombre || row.nombre || 'Sin Nombre',
        puesto: row.Puesto || row.puesto || '',
        region: row.Region || row.region || '',
        marca: row.Marca || row.marca || '',
        telefono: row.Telefono || row.telefono || '',
        email: row.Email || row.email || '',
        facebook: row.Facebook || row.facebook || '',
        foto: null,
        fechaIngreso: row['Fecha Ingreso'] || row.fechaIngreso || new Date().toISOString().split('T')[0],
        cumpleanos: row.Cumpleanos || row.cumpleanos || ''
      }));

      onImportar(colaboradoresFormateados);
      alert(`¡Se importaron ${colaboradoresFormateados.length} colaboradores!`);
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Limpiar input
  };

  return (
    <div className="space-y-6">
        {/* BARRA DE HERRAMIENTAS (Título, Búsqueda, Botones) */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="text-center xl:text-left">
                <h2 className="text-xl font-bold text-gray-800">Directorio</h2>
                <p className="text-sm text-gray-400">Gestión de personal</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                {/* Buscador */}
                <div className="relative flex-1 md:w-80">
                    <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-xl" />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)} 
                        className="w-full pl-12 pr-6 py-3 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-red-100 transition-all text-gray-700 font-medium" 
                    />
                </div>
                
                {/* Botones de Acción */}
                <div className="flex gap-2">
                    <label className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-green-100 text-green-600 rounded-2xl cursor-pointer hover:bg-green-200 transition-colors" title="Importar Excel">
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                        <FaFileExcel className="text-xl" />
                    </label>
                    
                    <button 
                        onClick={onNuevo} 
                        className="flex-1 md:flex-none px-6 py-3 bg-[#DA291C] text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all flex items-center justify-center gap-2"
                    >
                        <MdAdd className="text-xl" /> 
                        <span className="md:hidden lg:inline">Nuevo</span>
                    </button>
                </div>
            </div>
        </div>

        {/* TABLA DE DATOS */}
        <div className="bg-white rounded-[2.5rem] shadow-sm p-4 md:p-6 overflow-hidden">
            
            {/* VISTA MÓVIL (Tarjetas) */}
            <div className="md:hidden space-y-4">
                {colaboradores.map((colaborador) => (
                    <div key={colaborador.id} className="bg-gray-50 p-4 rounded-3xl flex items-center gap-4 relative">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 font-bold text-lg shadow-sm shrink-0 overflow-hidden">
                            {colaborador.foto ? <img src={colaborador.foto} alt="foto" className="w-full h-full object-cover"/> : colaborador.nombre?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 pr-10">
                            <h3 className="font-bold text-gray-800 truncate">{colaborador.nombre}</h3>
                            <p className="text-xs text-gray-500 truncate">{colaborador.puesto}</p>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">{colaborador.puntos || 0} Pts</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => onVer(colaborador)} className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-sm"><MdVisibility /></button>
                            <button onClick={() => onEditar(colaborador)} className="w-8 h-8 bg-white text-gray-600 rounded-full flex items-center justify-center shadow-sm"><MdEdit /></button>
                            <button onClick={() => { if(window.confirm(`¿Eliminar a ${colaborador.nombre}?`)) onEliminar(colaborador.id); }} className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-sm"><MdDeleteOutline /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* VISTA ESCRITORIO (Tabla) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100">
                            <th className="px-6 py-4">Colaborador</th>
                            <th className="px-6 py-4 text-center">Ubicación</th>
                            <th className="px-6 py-4 text-center">Puntos</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {colaboradores.map((colaborador) => (
                            <tr key={colaborador.id} className="group hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                                            {colaborador.foto ? <img src={colaborador.foto} alt="foto" className="w-full h-full object-cover" /> : colaborador.nombre?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{colaborador.nombre}</p>
                                            <p className="text-xs text-gray-500">{colaborador.puesto}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-xs text-gray-500 font-bold">{colaborador.region}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-extrabold border border-blue-100">{colaborador.puntos || 0}</span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-60 group-hover:opacity-100">
                                    <button onClick={() => onVer(colaborador)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><MdVisibility /></button>
                                    <button onClick={() => onEditar(colaborador)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><MdEdit /></button>
                                    <button onClick={() => { if(window.confirm(`Borrar ${colaborador.nombre}?`)) onEliminar(colaborador.id); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><MdDeleteOutline /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINACIÓN */}
            <div className="mt-6 flex justify-between items-center border-t border-gray-100 pt-4 px-2">
                <button onClick={paginacion.irAPaginaAnterior} disabled={!paginacion.tieneAnterior} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30">Anterior</button>
                <span className="text-xs font-bold text-gray-300 uppercase">Pág {paginacion.paginaActual}</span>
                <button onClick={paginacion.irAPaginaSiguiente} disabled={!paginacion.tieneSiguiente} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30">Siguiente</button>
            </div>
        </div>
    </div>
  );
}