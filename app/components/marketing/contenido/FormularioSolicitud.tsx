/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/contenido/FormularioSolicitud.tsx        */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdCloudUpload, MdSend, MdDescription, MdPhotoSizeSelectSmall, MdFormatPaint, MdImage } from "react-icons/md";

const MATERIALES_IMPRESOS = [
  'Lona', 'Cartel Papel Couché', 'Cartel Coroplast', 'Cartel PVC', 
  'Volante', 'Tríptico', 'Vinil', 'Sticker', 'Notas', 'Otro'
];

const CONTENIDO_DIGITAL = ['Imagen', 'Video', 'Otro'];

export default function FormularioSolicitud({ onGuardar, usuario }) {
  const [categoria, setCategoria] = useState('IMPRESO'); // IMPRESO | DIGITAL
  const [form, setForm] = useState({
    tipoMaterial: '',
    dimensiones: '',
    cantidad: 1,
    descripcion: '',
    folioNotas: '',
    referencia: null // Base64
  });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
        if(file.size > 1024 * 1024) return alert("Imagen muy pesada (Máx 1MB)");
        const reader = new FileReader();
        reader.onloadend = () => setForm({ ...form, referencia: reader.result });
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tipoMaterial || !form.dimensiones || !form.descripcion) return alert("Completa los campos obligatorios");
    
    // Preparar objeto para enviar al hook
    const datosFinales = {
        categoria,
        ...form
    };
    
    onGuardar(datosFinales, usuario);
    
    // Reset
    setForm({ tipoMaterial: '', dimensiones: '', cantidad: 1, descripcion: '', folioNotas: '', referencia: null });
    alert("✅ ¡Solicitud enviada a Marketing!");
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
      <h3 className="text-lg font-extrabold text-gray-800 mb-4 flex items-center gap-2">
        <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><MdFormatPaint/></span>
        Nueva Solicitud
      </h3>

      {/* TIPO DE CATEGORÍA */}
      <div className="flex bg-gray-50 p-1 rounded-xl mb-6">
        <button onClick={() => { setCategoria('IMPRESO'); setForm({...form, tipoMaterial: ''}); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${categoria === 'IMPRESO' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>IMPRESO</button>
        <button onClick={() => { setCategoria('DIGITAL'); setForm({...form, tipoMaterial: ''}); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${categoria === 'DIGITAL' ? 'bg-white shadow text-purple-600' : 'text-gray-400'}`}>DIGITAL</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* TIPO DE MATERIAL */}
        <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tipo de {categoria === 'IMPRESO' ? 'Material' : 'Contenido'}</label>
            <select 
                value={form.tipoMaterial} 
                onChange={(e) => setForm({...form, tipoMaterial: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer"
            >
                <option value="">-- Seleccionar --</option>
                {(categoria === 'IMPRESO' ? MATERIALES_IMPRESOS : CONTENIDO_DIGITAL).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>

        {/* DIMENSIONES Y CANTIDAD */}
        <div className="flex gap-3">
            <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Dimensiones / Detalles</label>
                <div className="relative">
                    <MdPhotoSizeSelectSmall className="absolute left-3 top-3 text-gray-400"/>
                    <input 
                        type="text" 
                        placeholder={categoria === 'IMPRESO' ? "Ej: 1.20m x 2m" : "Ej: 1080x1920 px"} 
                        value={form.dimensiones} 
                        onChange={(e) => setForm({...form, dimensiones: e.target.value})} 
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-700" 
                    />
                </div>
            </div>
            {categoria === 'IMPRESO' && (
                <div className="w-24">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Cantidad</label>
                    <input 
                        type="number" 
                        min="1" 
                        value={form.cantidad} 
                        onChange={(e) => setForm({...form, cantidad: Number(e.target.value)})} 
                        className="w-full px-3 py-2.5 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-700 text-center" 
                    />
                </div>
            )}
        </div>

        {/* CONDICIONAL: FOLIO NOTAS */}
        {form.tipoMaterial === 'Notas' && (
            <div>
                <label className="text-[10px] font-bold text-orange-400 uppercase mb-1 block">Folio Inicial</label>
                <input 
                    type="text" 
                    placeholder="Ej: 001 - 500" 
                    value={form.folioNotas} 
                    onChange={(e) => setForm({...form, folioNotas: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-xl outline-none text-sm font-bold text-gray-700" 
                />
            </div>
        )}

        {/* DESCRIPCIÓN */}
        <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Instrucciones de Diseño</label>
            <textarea 
                rows={3}
                placeholder="Describe colores, textos obligatorios, estilo..." 
                value={form.descripcion} 
                onChange={(e) => setForm({...form, descripcion: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-medium text-gray-700 resize-none" 
            />
        </div>

        {/* IMAGEN REFERENCIA */}
        <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Referencia Visual (Opcional)</label>
            <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center gap-2 transition-all">
                    <MdCloudUpload className="text-gray-400"/>
                    <span className="text-xs font-bold text-gray-500">Subir Imagen</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </label>
                {form.referencia && (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img src={form.referencia} className="w-full h-full object-cover" />
                    </div>
                )}
            </div>
        </div>

        <button type="submit" className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 mt-2">
            <MdSend /> Enviar Pedido
        </button>
      </form>
    </div>
  );
}