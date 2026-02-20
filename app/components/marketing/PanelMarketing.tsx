/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/PanelMarketing.tsx (SOLO CUPONES)        */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
  MdLocalOffer, MdAdd, MdDelete, MdStore, MdDomain, 
  MdAttachMoney, MdPercent, MdMap
} from "react-icons/md";

// --- CATÁLOGOS ---
const SEDES = ['TODAS', 'Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const MARCAS = ['TODAS', 'DMG NET', 'Intercheap', 'Fibrox MX', 'WifiCel'];

export default function PanelMarketing({ cupones, cobertura, onAgregarCupon, onEliminarCupon }) {
  
  // ESTADO DEL FORMULARIO
  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    tipoDescuento: 'MONTO_FIJO', 
    valor: '',
    aplicarA: 'INSTALACION', 
    vigencia: '',
    sede: 'TODAS',
    marca: 'TODAS',
    zonaId: 'TODAS',
    tieneLimite: false,
    limiteCantidad: ''
  });

  // Filtrar zonas según la sede seleccionada
  const zonasDisponibles = useMemo(() => {
      if (form.sede === 'TODAS') return [];
      return cobertura.filter(z => z.sede === form.sede && z.estatus === 'ACTIVA');
  }, [cobertura, form.sede]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.codigo || !form.valor || !form.vigencia) return alert("Completa los datos obligatorios.");
    if (form.tieneLimite && !form.limiteCantidad) return alert("Define la cantidad límite de cupones.");

    if (cupones.some(c => c.codigo.toUpperCase() === form.codigo.toUpperCase())) {
        return alert("¡Este código ya existe!");
    }

    const nuevoCupon = {
        codigo: form.codigo.toUpperCase(),
        descripcion: form.descripcion || 'Sin descripción',
        tipoDescuento: form.tipoDescuento,
        valor: Number(form.valor),
        aplicarA: form.aplicarA,
        vigencia: form.vigencia,
        limite: form.tieneLimite ? Number(form.limiteCantidad) : null,
        usados: 0,
        restricciones: {
            sede: form.sede,
            marca: form.marca,
            zonaId: form.zonaId
        }
    };

    onAgregarCupon(nuevoCupon);
    
    setForm({
        codigo: '', descripcion: '', tipoDescuento: 'MONTO_FIJO', 
        valor: '', aplicarA: 'INSTALACION', vigencia: '', 
        sede: 'TODAS', marca: 'TODAS', zonaId: 'TODAS',
        tieneLimite: false, limiteCantidad: ''
    });
  };

  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-2 animate-fade-in">
      
      {/* 1. COLUMNA IZQUIERDA: CREAR PROMOCIÓN */}
      <div className="w-full md:w-96 shrink-0">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-orange-50 h-full flex flex-col">
            <div className="mb-6">
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><MdLocalOffer /></div>
                    Crear Cupón
                </h2>
                <p className="text-sm text-gray-400 mt-1 font-medium">Configura una nueva promoción</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                
                {/* CÓDIGO Y DESCRIPCIÓN */}
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Código del Cupón</label>
                    <input type="text" placeholder="Ej: VERANO2026" value={form.codigo} onChange={(e) => setForm({...form, codigo: e.target.value.toUpperCase().replace(/\s/g, '')})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none font-black text-gray-800 tracking-wider uppercase focus:ring-2 focus:ring-orange-100" maxLength={15} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Descripción Corta</label>
                    <input type="text" placeholder="Ej: Descuento por apertura" value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-medium text-gray-700" />
                </div>

                {/* REGLAS DE VALOR */}
                <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                    <label className="text-[10px] font-bold text-orange-400 uppercase mb-3 block">Configuración de Descuento</label>
                    <div className="flex gap-2 mb-3">
                        <button type="button" onClick={() => setForm({...form, tipoDescuento: 'MONTO_FIJO'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.tipoDescuento === 'MONTO_FIJO' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}>$ Monto</button>
                        <button type="button" onClick={() => setForm({...form, tipoDescuento: 'PORCENTAJE'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.tipoDescuento === 'PORCENTAJE' ? 'bg-white shadow text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}>% Porcentaje</button>
                    </div>
                    <div className="flex gap-3 mb-3">
                        <div className="w-1/3"><input type="number" placeholder={form.tipoDescuento === 'PORCENTAJE' ? '10' : '200'} value={form.valor} onChange={(e) => setForm({...form, valor: e.target.value})} className="w-full px-3 py-2 bg-white rounded-xl outline-none font-bold text-gray-800 text-center" /></div>
                        <select value={form.aplicarA} onChange={(e) => setForm({...form, aplicarA: e.target.value})} className="flex-1 px-3 py-2 bg-white rounded-xl outline-none text-xs font-bold text-gray-600 cursor-pointer"><option value="INSTALACION">en Instalación</option><option value="MENSUALIDAD">en 1ra Mensualidad</option></select>
                    </div>
                </div>

                {/* RESTRICCIONES */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Válido en Sede</label>
                        <select value={form.sede} onChange={(e) => setForm({...form, sede: e.target.value, zonaId: 'TODAS'})} className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 outline-none">
                            {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Válido para</label>
                        <select value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 outline-none">
                            {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {/* ZONA ESPECÍFICA */}
                {form.sede !== 'TODAS' && (
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Zona Específica (Opcional)</label>
                        <div className="relative">
                            <MdMap className="absolute left-3 top-2.5 text-gray-400"/>
                            <select value={form.zonaId} onChange={(e) => setForm({...form, zonaId: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 outline-none truncate">
                                <option value="TODAS">-- Todas las zonas de {form.sede} --</option>
                                {zonasDisponibles.map(z => (
                                    <option key={z.id} value={z.id}>{z.nombreAp || z.comunidad}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* LÍMITES Y VIGENCIA */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Vigencia Límite</label>
                        <input type="date" min={hoy} value={form.vigencia} onChange={(e) => setForm({...form, vigencia: e.target.value})} className="w-full px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Límite de Uso</label>
                        <div className="flex gap-2 items-center">
                            <input type="checkbox" checked={form.tieneLimite} onChange={(e) => setForm({...form, tieneLimite: e.target.checked})} className="w-4 h-4 accent-orange-500 rounded cursor-pointer" />
                            {form.tieneLimite ? (
                                <input type="number" placeholder="Cant." value={form.limiteCantidad} onChange={(e) => setForm({...form, limiteCantidad: e.target.value})} className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none" />
                            ) : (
                                <span className="text-xs text-gray-400 font-medium">Ilimitado</span>
                            )}
                        </div>
                    </div>
                </div>

                <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 mt-4">
                    <MdAdd className="text-xl"/> Guardar Promoción
                </button>
            </form>
        </div>
      </div>

      {/* 2. COLUMNA DERECHA: LISTA DE CUPONES */}
      <div className="flex-1 bg-gray-50 rounded-[2.5rem] border border-gray-200 p-6 flex flex-col overflow-hidden">
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            Promociones Activas <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-xs">{cupones.length}</span>
        </h3>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-10">
            {cupones.length === 0 ? (
                <div className="text-center py-20 opacity-40">
                    <MdLocalOffer className="text-6xl mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 font-bold">No hay cupones activos</p>
                </div>
            ) : (
                cupones.map((cupon) => {
                    const agotado = cupon.limite !== null && cupon.usados >= cupon.limite;
                    const vencido = cupon.vigencia < hoy;
                    
                    return (
                        <div key={cupon.id} className={`bg-white p-0 rounded-2xl shadow-sm border border-gray-100 flex relative overflow-hidden group hover:shadow-md transition-all ${agotado || vencido ? 'opacity-60 grayscale' : ''}`}>
                            <div className={`w-3 relative ${agotado || vencido ? 'bg-gray-400' : 'bg-orange-500'}`}>
                                <div className="absolute top-0 bottom-0 -left-1.5 border-r-2 border-dashed border-white w-3"></div>
                            </div>

                            <div className="flex-1 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-xl font-black text-gray-800 tracking-wider truncate">{cupon.codigo}</h4>
                                        {agotado ? <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">Agotado</span> :
                                         vencido ? <span className="text-[9px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold uppercase">Vencido</span> :
                                         <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Activo</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium truncate">{cupon.descripcion}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded flex items-center gap-1"><MdDomain/> {cupon.restricciones.sede}</span>
                                        {cupon.restricciones.zonaId !== 'TODAS' && (
                                            <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded flex items-center gap-1 font-bold truncate max-w-[150px]"><MdMap/> Zona Específica</span>
                                        )}
                                        <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded flex items-center gap-1"><MdStore/> {cupon.restricciones.marca}</span>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1">
                                    <div className="text-2xl font-black text-orange-500 flex items-center">
                                        {cupon.tipoDescuento === 'MONTO_FIJO' ? <MdAttachMoney className="text-xl"/> : ''}
                                        {cupon.valor}
                                        {cupon.tipoDescuento === 'PORCENTAJE' ? <MdPercent className="text-xl"/> : ''}
                                    </div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-1">
                                        En {cupon.aplicarA.toLowerCase()}
                                    </span>
                                    
                                    {cupon.limite !== null && (
                                        <div className="w-full max-w-[100px]">
                                            <div className="flex justify-between text-[8px] font-bold text-gray-400 mb-0.5">
                                                <span>{cupon.usados} usados</span>
                                                <span>Max {cupon.limite}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${agotado ? 'bg-red-500' : 'bg-green-500'}`} 
                                                    style={{ width: `${Math.min((cupon.usados / cupon.limite) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={() => { if(window.confirm('¿Borrar cupón?')) onEliminarCupon(cupon.id) }} className="mt-2 p-1.5 bg-gray-100 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"><MdDelete /></button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
}