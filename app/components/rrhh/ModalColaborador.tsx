/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/ModalColaborador.tsx (UI HORARIOS UNIFICADA)  */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  MdClose, MdPerson, MdEmail, MdPhone, MdBusiness, MdWork, 
  MdLocationOn, MdBadge, MdCalendarToday, MdGroups, MdCloudUpload, MdDelete,
  MdAttachMoney, MdMoneyOff, MdReceiptLong, MdSavings, MdAccessTime, MdAdd, MdRemove
} from "react-icons/md";
import { FaFacebook } from "react-icons/fa";

const MARCAS = ['JAVAK (Corporativo)', 'DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel', 'Fundación Frenxo'];
const REGIONES = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const DEPARTAMENTOS = ['Marketing', 'Sistemas', 'Finanzas', 'Almacén', 'Operaciones', 'Dirección'];
const PUESTOS = [
  'Gerente General', 'Soporte General', 'Gerente Marketing', 'Gerente Administrativo', 'Gerente Técnico', 'Gerente RRHH',
  'Administrador', 'Líder Técnico', 'Control Vehicular', 'Community Manager', 'Atención al Cliente', 'Técnico', 'Creador de Contenido', 
  'Cobranza', 'Vendedor', 'Otro Personal'
];

const DEFAULT_HORARIO = {
    tipo: 'REGULAR',
    horasDiarias: 8,
    dias: { lunes: 8, martes: 8, miercoles: 8, jueves: 8, viernes: 8, sabado: 0, domingo: 0 }
};

export default function ModalColaborador({ isOpen, onClose, colaboradorAEditar, onSave, isViewOnly }) {
  const [activeTab, setActiveTab] = useState('PERFIL'); 
  const [diaActivo, setDiaActivo] = useState(null); 

  const [formData, setFormData] = useState({
    id: '', nombre: '', puesto: '', departamento: 'Sistemas', region: 'Centro', marca: 'JAVAK (Corporativo)',
    telefono: '', email: '', facebook: '', fechaIngreso: '', cumpleanos: '', foto: null,
    horario: DEFAULT_HORARIO,
    rfc: '', curp: '', nss: '',
    sueldoBase: 0, premioPuntualidad: 0, premioAsistencia: 0, bonoEspecial: 0,
    saldoAlianza: 0, descuentoAlianza: 0, saldoInterno: 0, descuentoInterno: 0
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        setActiveTab('PERFIL');
        setDiaActivo(null);

        if (colaboradorAEditar) {
            let horarioConfig = colaboradorAEditar.horario;
            if (!horarioConfig) {
                const hBase = colaboradorAEditar.horasJornada || 8;
                horarioConfig = {
                    tipo: 'REGULAR', horasDiarias: hBase,
                    dias: { lunes: hBase, martes: hBase, miercoles: hBase, jueves: hBase, viernes: hBase, sabado: 0, domingo: 0 }
                };
            }

            setFormData({
                id: colaboradorAEditar.id || '', nombre: colaboradorAEditar.nombre || '',
                puesto: colaboradorAEditar.puesto || '', departamento: colaboradorAEditar.departamento || 'Sistemas',
                region: colaboradorAEditar.region || 'Centro', marca: colaboradorAEditar.marca || 'JAVAK (Corporativo)',
                telefono: colaboradorAEditar.telefono || '', email: colaboradorAEditar.email || '',
                facebook: colaboradorAEditar.facebook || '', fechaIngreso: colaboradorAEditar.fechaIngreso || '',
                cumpleanos: colaboradorAEditar.cumpleanos || '', foto: colaboradorAEditar.foto || null,
                horario: horarioConfig, 
                rfc: colaboradorAEditar.rfc || '', curp: colaboradorAEditar.curp || '', nss: colaboradorAEditar.nss || '',
                sueldoBase: colaboradorAEditar.sueldoBase || 0, premioPuntualidad: colaboradorAEditar.premioPuntualidad || 0,
                premioAsistencia: colaboradorAEditar.premioAsistencia || 0, bonoEspecial: colaboradorAEditar.bonoEspecial || 0,
                saldoAlianza: colaboradorAEditar.prestamoAlianza?.saldo || 0, descuentoAlianza: colaboradorAEditar.prestamoAlianza?.descuento || 0,
                saldoInterno: colaboradorAEditar.prestamoEmpresa?.saldo || 0, descuentoInterno: colaboradorAEditar.prestamoEmpresa?.descuento || 0,
            });
        } else {
            setFormData({
                id: '', nombre: '', puesto: '', departamento: 'Sistemas', region: 'Centro', marca: 'JAVAK (Corporativo)',
                telefono: '', email: '', facebook: '', fechaIngreso: '', cumpleanos: '', foto: null,
                horario: DEFAULT_HORARIO, rfc: '', curp: '', nss: '',
                sueldoBase: 0, premioPuntualidad: 0, premioAsistencia: 0, bonoEspecial: 0,
                saldoAlianza: 0, descuentoAlianza: 0, saldoInterno: 0, descuentoInterno: 0
            });
        }
    }
  }, [colaboradorAEditar, isOpen]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleTipoHorario = () => {
      if (isViewOnly) return;
      const nuevoTipo = formData.horario.tipo === 'REGULAR' ? 'IRREGULAR' : 'REGULAR';
      setFormData(prev => ({ ...prev, horario: { ...prev.horario, tipo: nuevoTipo } }));
  };

  const handleHorasRegularesChange = (valor) => {
      let val = parseFloat(valor) || 0;
      if (val < 0) val = 0;
      if (val > 24) val = 24;
      setFormData(prev => ({
          ...prev, horario: { ...prev.horario, horasDiarias: val, dias: { lunes: val, martes: val, miercoles: val, jueves: val, viernes: val, sabado: 0, domingo: 0 } }
      }));
  };

  const handleDiaIrregularChange = (dia, valor) => {
      let val = parseFloat(valor) || 0;
      if (val < 0) val = 0;
      if (val > 24) val = 24;
      setFormData(prev => ({
          ...prev, horario: { ...prev.horario, dias: { ...prev.horario.dias, [dia]: val } }
      }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("La imagen es muy pesada. Máximo 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, foto: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation(); 
    if (window.confirm("¿Quitar foto de perfil?")) {
        setFormData(prev => ({ ...prev, foto: null }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const horarioProcesado = { ...formData.horario };
    if (horarioProcesado.tipo === 'REGULAR') {
        horarioProcesado.horasDiarias = parseFloat(horarioProcesado.horasDiarias) || 8;
    }
    const datosFinales = {
        ...formData,
        id: formData.id || `EMP-${Math.floor(Math.random() * 10000)}`,
        horario: horarioProcesado, 
        prestamoAlianza: { saldo: parseFloat(formData.saldoAlianza) || 0, descuento: parseFloat(formData.descuentoAlianza) || 0 },
        prestamoEmpresa: { saldo: parseFloat(formData.saldoInterno) || 0, descuento: parseFloat(formData.descuentoInterno) || 0 }
    };
    delete datosFinales.saldoAlianza; delete datosFinales.descuentoAlianza;
    delete datosFinales.saldoInterno; delete datosFinales.descuentoInterno;
    onSave(datosFinales);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setDiaActivo(null)}>
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
           <div>
             <h2 className="text-2xl font-extrabold text-gray-800">{isViewOnly ? 'Detalles del Colaborador' : colaboradorAEditar ? 'Editar Expediente' : 'Nuevo Ingreso'}</h2>
             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gestión de Recursos Humanos</p>
           </div>
           <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm transition-all"><MdClose className="text-xl" /></button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-100 px-8 shrink-0 bg-white">
            <button onClick={() => setActiveTab('PERFIL')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'PERFIL' ? 'border-[#DA291C] text-[#DA291C]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <MdPerson className="text-lg"/> Perfil General
            </button>
            <button onClick={() => setActiveTab('NOMINA')} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'NOMINA' ? 'border-[#DA291C] text-[#DA291C]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                <MdAttachMoney className="text-lg"/> Nómina & Horarios
            </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* PESTAÑA 1: PERFIL GENERAL */}
          {activeTab === 'PERFIL' && (
            <div className="space-y-6 animate-fade-in">
                {/* FOTO DE PERFIL */}
                <div className="flex flex-col items-center mb-6">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isViewOnly} />
                    <div onClick={() => !isViewOnly && fileInputRef.current?.click()} className={`w-28 h-28 rounded-full bg-gray-100 border-4 border-white shadow-xl flex items-center justify-center text-gray-300 relative overflow-hidden group transition-transform ${!isViewOnly ? 'cursor-pointer hover:scale-105' : ''}`}>
                        {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" alt="Perfil" /> : <MdPerson className="text-6xl" />}
                        {!isViewOnly && <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"><MdCloudUpload className="text-2xl mb-1"/><span className="text-[10px] font-bold uppercase">Subir Foto</span></div>}
                    </div>
                    {!isViewOnly && formData.foto && <button type="button" onClick={handleRemoveImage} className="mt-3 flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"><MdDelete /> Eliminar foto</button>}
                </div>

                {/* DATOS GENERALES */}
                <div className="space-y-4">
                     <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Información Corporativa</h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">ID Colaborador</label>
                            <div className="relative">
                                <MdBadge className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                                <input type="text" name="id" value={formData.id} disabled placeholder="Auto-generado" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none text-sm font-bold text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nombre Completo</label>
                            <div className="relative">
                                <MdPerson className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                                <input required disabled={isViewOnly} type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Juan Pérez" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800 transition-all" />
                            </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Marca / Empresa</label>
                            <div className="relative">
                                <MdBusiness className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                                <select disabled={isViewOnly} name="marca" value={formData.marca} onChange={handleChange} className="w-full pl-10 pr-8 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800 appearance-none cursor-pointer">
                                    {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Departamento</label>
                            <div className="relative">
                                <MdGroups className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                                <select disabled={isViewOnly} name="departamento" value={formData.departamento || 'Sistemas'} onChange={handleChange} className="w-full pl-10 pr-8 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800 appearance-none cursor-pointer">
                                    {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Puesto (Nivel)</label>
                            <div className="relative">
                                <MdWork className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                                <select disabled={isViewOnly} name="puesto" value={formData.puesto} onChange={handleChange} className="w-full pl-10 pr-8 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800 appearance-none cursor-pointer">
                                    <option value="">-- Seleccionar --</option>
                                    {PUESTOS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Región / Sede</label>
                            <div className="relative">
                                <MdLocationOn className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                                <select disabled={isViewOnly} name="region" value={formData.region} onChange={handleChange} className="w-full pl-10 pr-8 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800 appearance-none cursor-pointer">
                                    {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Fecha de Ingreso</label>
                        <div className="relative">
                            <MdCalendarToday className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                            <input disabled={isViewOnly} type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4">
                     <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Contacto y Personal</h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Teléfono</label>
                            <div className="relative">
                                <MdPhone className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                                <input disabled={isViewOnly} type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="55 1234 5678" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Cumpleaños</label>
                            <div className="relative">
                                <MdCalendarToday className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                                <input disabled={isViewOnly} type="date" name="cumpleanos" value={formData.cumpleanos} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800" />
                            </div>
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Correo Electrónico</label>
                        <div className="relative">
                            <MdEmail className="absolute left-3 top-3.5 text-gray-400 text-lg" />
                            <input disabled={isViewOnly} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="usuario@javak.com" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800" />
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Perfil Facebook (Marketing)</label>
                        <div className="relative">
                            <FaFacebook className="absolute left-3 top-3.5 text-blue-600 text-lg" />
                            <input disabled={isViewOnly} type="text" name="facebook" value={formData.facebook} onChange={handleChange} placeholder="Link o Usuario" className="w-full pl-10 pr-4 py-3 bg-blue-50/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-blue-800" />
                        </div>
                     </div>
                  </div>
            </div>
          )}

          {/* PESTAÑA 2: NÓMINA & HORARIOS */}
          {activeTab === 'NOMINA' && (
            <div className="space-y-6 animate-slide-up">
                
                {/* A. CONFIGURACIÓN LABORAL (DISEÑO CIRCULAR PRO + LIGHT COLORS) */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                            <MdAccessTime className="text-xl text-orange-500"/> Jornada Laboral
                        </h3>
                        
                        {/* TOGGLE ESTÉTICO */}
                        <div className="flex items-center gap-3">
                            <span className={`text-[11px] font-bold transition-colors ${formData.horario.tipo === 'REGULAR' ? 'text-gray-800' : 'text-gray-400'}`}>Regular</span>
                            <button 
                                type="button" disabled={isViewOnly} onClick={toggleTipoHorario}
                                className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors cursor-pointer ${formData.horario.tipo === 'IRREGULAR' ? 'bg-orange-500' : 'bg-white border-2 border-gray-200'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.horario.tipo === 'IRREGULAR' ? 'translate-x-6' : 'translate-x-0 border border-gray-200'}`}></div>
                            </button>
                            <span className={`text-[11px] font-bold transition-colors ${formData.horario.tipo === 'IRREGULAR' ? 'text-gray-800' : 'text-gray-400'}`}>Irregular</span>
                        </div>
                    </div>

                    {/* VISTAS */}
                    <div className="animate-fade-in pb-4">
                        {formData.horario.tipo === 'REGULAR' ? (
                            <div className="flex justify-center pt-2">
                                <div 
                                    className="text-center flex flex-col items-center relative group cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); setDiaActivo('regular'); }}
                                    onMouseLeave={() => setDiaActivo(null)}
                                >
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 mb-3 block uppercase tracking-wider">Lunes a viernes</label>

                                    {/* CÍRCULO CENTRAL REGULAR (Mismo estilo que el irregular pero ligeramente más grande) */}
                                    <div className={`w-20 h-20 flex items-center justify-center bg-white border-2 rounded-full transition-all duration-300 select-none ${formData.horario.horasDiarias > 0 ? 'border-gray-400' : 'border-gray-200'} ${diaActivo === 'regular' ? 'border-orange-400 ring-4 ring-orange-50' : 'group-hover:border-gray-300'}`}>
                                        {formData.horario.horasDiarias > 0 ? (
                                            <span className="text-3xl font-black text-gray-600">{formData.horario.horasDiarias}</span>
                                        ) : (
                                            <span className="text-xs font-bold text-gray-300">Horas</span>
                                        )}
                                    </div>

                                    {/* BOTONES FLOTANTES REGULAR */}
                                    {!isViewOnly && (
                                        <div className={`absolute -bottom-10 flex gap-3 transition-all duration-300 ${diaActivo === 'regular' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'} pointer-events-auto`}>
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleHorasRegularesChange((formData.horario.horasDiarias || 0) - 1); }}
                                                className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm transition-all"
                                            >
                                                <MdRemove className="text-base"/>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleHorasRegularesChange((formData.horario.horasDiarias || 0) + 1); }}
                                                className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-green-500 hover:border-green-200 hover:bg-green-50 shadow-sm transition-all"
                                            >
                                                <MdAdd className="text-base"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-7 gap-y-12 gap-x-2">
                                {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((diaKey) => {
                                    const labels = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
                                    const val = formData.horario.dias[diaKey];
                                    const hasValue = val > 0;
                                    const isActive = diaActivo === diaKey;

                                    return (
                                        <div 
                                            key={diaKey} 
                                            className="text-center flex flex-col items-center relative group cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); setDiaActivo(diaKey); }}
                                            onMouseLeave={() => setDiaActivo(null)}
                                        >
                                            <label className="text-[10px] md:text-xs font-bold text-gray-500 mb-2">{labels[diaKey]}</label>
                                            
                                            {/* CÍRCULO CENTRAL */}
                                            <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border-2 rounded-full transition-all duration-300 select-none ${hasValue ? 'border-gray-400' : 'border-gray-200'} ${isActive ? 'border-orange-400 ring-4 ring-orange-50' : 'group-hover:border-gray-300'}`}>
                                                {hasValue ? (
                                                    <span className="text-xl md:text-2xl font-black text-gray-600">{val}</span>
                                                ) : (
                                                    <span className="text-[10px] md:text-[11px] font-bold text-gray-300">Horas</span>
                                                )}
                                            </div>

                                            {/* BOTONES FLOTANTES */}
                                            {!isViewOnly && (
                                                <div className={`absolute -bottom-8 flex gap-2 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'} pointer-events-auto`}>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDiaIrregularChange(diaKey, (val || 0) - 1); }}
                                                        className="w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm transition-all"
                                                    >
                                                        <MdRemove className="text-sm"/>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDiaIrregularChange(diaKey, (val || 0) + 1); }}
                                                        className="w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-green-500 hover:border-green-200 hover:bg-green-50 shadow-sm transition-all"
                                                    >
                                                        <MdAdd className="text-sm"/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* B. DATOS FISCALES */}
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MdBadge className="text-lg text-blue-500"/> Identificación Fiscal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">RFC</label>
                            <input disabled={isViewOnly} type="text" name="rfc" value={formData.rfc} onChange={handleChange} placeholder="XAXX010101000" className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800 uppercase" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">CURP</label>
                            <input disabled={isViewOnly} type="text" name="curp" value={formData.curp} onChange={handleChange} placeholder="XXXX999999XXXXXX" className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800 uppercase" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">NSS (IMSS)</label>
                            <input disabled={isViewOnly} type="text" name="nss" value={formData.nss} onChange={handleChange} placeholder="00000000000" className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-800" />
                        </div>
                    </div>
                </div>

                {/* C. PERCEPCIONES */}
                <div className="bg-green-50 p-5 rounded-3xl border border-green-100">
                    <h3 className="text-xs font-black text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MdAttachMoney className="text-lg"/> Percepciones Fijas (Quincenal)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-green-600/70 uppercase mb-1 block">Sueldo Base</label>
                            <input disabled={isViewOnly} type="number" name="sueldoBase" value={formData.sueldoBase} onChange={handleChange} className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-green-200 text-lg font-black text-green-700" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-green-600/70 uppercase mb-1 block">Bono Especial (Fijo)</label>
                            <input disabled={isViewOnly} type="number" name="bonoEspecial" value={formData.bonoEspecial} onChange={handleChange} className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-green-200 text-sm font-bold text-green-700" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-green-600/70 uppercase mb-1 block">Premio Puntualidad</label>
                            <input disabled={isViewOnly} type="number" name="premioPuntualidad" value={formData.premioPuntualidad} onChange={handleChange} className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-green-200 text-sm font-bold text-green-700" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-green-600/70 uppercase mb-1 block">Premio Asistencia</label>
                            <input disabled={isViewOnly} type="number" name="premioAsistencia" value={formData.premioAsistencia} onChange={handleChange} className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-green-200 text-sm font-bold text-green-700" />
                        </div>
                    </div>
                </div>

                {/* D. DEDUCCIONES */}
                <div className="bg-red-50 p-5 rounded-3xl border border-red-100">
                    <h3 className="text-xs font-black text-red-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MdMoneyOff className="text-lg"/> Deducciones Recurrentes (Préstamos)
                    </h3>
                    
                    {/* Caja Alianza */}
                    <div className="mt-4 pb-4 border-b border-red-100 grid grid-cols-2 gap-4">
                        <div className="col-span-2"><h4 className="text-[10px] font-bold text-red-700 uppercase">Caja Alianza (Externo)</h4></div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[9px] text-red-600/70 uppercase mb-1 block">Saldo Total</label>
                            <div className="relative">
                                <MdReceiptLong className="absolute left-3 top-3 text-red-300"/>
                                <input disabled={isViewOnly} type="number" name="saldoAlianza" value={formData.saldoAlianza} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-red-200 text-sm font-bold text-red-700" />
                            </div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[9px] text-red-600/70 uppercase mb-1 block">Descuento Quincenal</label>
                            <input disabled={isViewOnly} type="number" name="descuentoAlianza" value={formData.descuentoAlianza} onChange={handleChange} className="w-full px-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-red-200 text-sm font-bold text-red-700" />
                        </div>
                    </div>

                    {/* Préstamo Interno */}
                    <div className="mt-4 pt-1 grid grid-cols-2 gap-4">
                        <div className="col-span-2"><h4 className="text-[10px] font-bold text-red-700 uppercase">Préstamo Interno (Empresa)</h4></div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[9px] text-red-600/70 uppercase mb-1 block">Saldo Total</label>
                            <div className="relative">
                                <MdSavings className="absolute left-3 top-3 text-red-300"/>
                                <input disabled={isViewOnly} type="number" name="saldoInterno" value={formData.saldoInterno} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-red-200 text-sm font-bold text-red-700" />
                            </div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[9px] text-red-600/70 uppercase mb-1 block">Descuento Quincenal</label>
                            <input disabled={isViewOnly} type="number" name="descuentoInterno" value={formData.descuentoInterno} onChange={handleChange} className="w-full px-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-red-200 text-sm font-bold text-red-700" />
                        </div>
                    </div>
                </div>

            </div>
          )}

        </form>

        {/* FOOTER */}
        {!isViewOnly && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                <button type="button" onClick={onClose} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-200 rounded-2xl transition-all">Cancelar</button>
                <button type="button" onClick={handleSubmit} className="flex-1 py-4 bg-[#DA291C] text-white font-bold rounded-2xl shadow-lg hover:bg-[#b02117] transition-all flex items-center justify-center gap-2">
                    <MdCloudUpload className="text-xl"/> Guardar Cambios
                </button>
            </div>
        )}
      </div>
    </div>
  );
}