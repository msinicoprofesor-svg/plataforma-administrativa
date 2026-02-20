/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/marketing/social/VistaCalendario.tsx (DISEÑO FINAL) */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo, useEffect } from 'react';
import { MdChevronLeft, MdChevronRight, MdImage, MdEventBusy, MdClose, MdMoreHoriz, MdAdd } from "react-icons/md";
import { REDES } from './useSocialMedia';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_CORTOS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function VistaCalendario({ posts, onMoverPost, onEditar }) {
  const [fechaActual, setFechaActual] = useState(new Date());
  
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [panelLateralOpen, setPanelLateralOpen] = useState(false);

  useEffect(() => {
      const hoy = new Date();
      if (fechaActual.getMonth() === hoy.getMonth() && fechaActual.getFullYear() === hoy.getFullYear()) {
          setDiaSeleccionado(hoy.getDate());
      } else {
          setDiaSeleccionado(null);
          setPanelLateralOpen(false);
      }
  }, [fechaActual.getMonth(), fechaActual.getFullYear()]);

  const diasDelMes = useMemo(() => {
      const año = fechaActual.getFullYear();
      const mes = fechaActual.getMonth();
      const primerDia = new Date(año, mes, 1).getDay();
      const totalDias = new Date(año, mes + 1, 0).getDate();
      
      const diasArray = [];
      for (let i = 0; i < primerDia; i++) diasArray.push(null);
      for (let i = 1; i <= totalDias; i++) diasArray.push(i);
      while (diasArray.length < 42) diasArray.push(null);

      return diasArray;
  }, [fechaActual]);

  const cambiarMes = (delta) => {
      setFechaActual(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleDragStart = (e, postId) => { e.dataTransfer.setData('postId', postId); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e, diaDestino) => {
      e.preventDefault();
      const postId = e.dataTransfer.getData('postId');
      if (postId && diaDestino) {
          const año = fechaActual.getFullYear();
          const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
          const dia = String(diaDestino).padStart(2, '0');
          onMoverPost(postId, `${año}-${mes}-${dia}`, null);
      }
  };

  const getPostsDelDia = (dia) => {
      if (!dia) return [];
      const año = fechaActual.getFullYear();
      const mes = fechaActual.getMonth();
      return posts.filter(p => {
          const [pAño, pMes, pDia] = p.fecha.split('-').map(Number);
          return pAño === año && (pMes - 1) === mes && pDia === dia;
      });
  };

  const seleccionarDia = (dia) => {
      if (!dia) return;
      setDiaSeleccionado(dia);
      setPanelLateralOpen(true);
  };

  const postsAgenda = diaSeleccionado ? getPostsDelDia(diaSeleccionado) : [];

  return (
    <div className="flex flex-col bg-white rounded-[2rem] shadow-sm border border-gray-200 animate-fade-in w-full h-full relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex flex-row justify-between items-center p-4 md:p-5 border-b border-gray-100 bg-white z-20 shrink-0">
            <h3 className="text-xl md:text-2xl font-black text-gray-800 capitalize flex items-center gap-2">
                {MESES[fechaActual.getMonth()]} 
                <span className="text-gray-300 font-medium">{fechaActual.getFullYear()}</span>
            </h3>
            <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
                <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all"><MdChevronLeft className="text-xl"/></button>
                <button onClick={() => { setFechaActual(new Date()); setDiaSeleccionado(new Date().getDate()); }} className="px-3 py-2 text-xs font-bold text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">Hoy</button>
                <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all"><MdChevronRight className="text-xl"/></button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="grid grid-cols-7 bg-white border-b border-gray-100 shrink-0">
                    {DIAS_CORTOS.map(d => (
                        <div key={d} className="py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {d}
                        </div>
                    ))}
                </div>

                {/* --- MÓVIL --- */}
                <div className="md:hidden flex-1 overflow-y-auto">
                     <div className="grid grid-cols-7 p-2 gap-y-2">
                        {diasDelMes.slice(0, 31).map((dia, index) => {
                            if (!dia) return <div key={index} className="h-10"></div>;
                            const tieneEventos = getPostsDelDia(dia).length > 0;
                            const esSeleccionado = dia === diaSeleccionado;
                            return (
                                <div key={index} className="flex flex-col items-center justify-center cursor-pointer" onClick={() => seleccionarDia(dia)}>
                                    <div className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold relative ${esSeleccionado ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                                        {dia}
                                        {tieneEventos && !esSeleccionado && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-red-400 rounded-full"></div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {diaSeleccionado && postsAgenda.length > 0 && (
                        <div className="bg-gray-50 border-t border-gray-100 p-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase mb-3">Actividades del día {diaSeleccionado}</h4>
                            <div className="space-y-2">
                                {postsAgenda.map(post => {
                                     const redData = REDES.find(r => r.id === post.red);
                                     return (
                                        <div key={post.id} onClick={() => onEditar(post)} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 items-center">
                                            <div className={`w-1 h-8 rounded-full ${redData?.color}`}></div>
                                            <p className="font-bold text-sm text-gray-800">{post.titulo}</p>
                                        </div>
                                     );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- ESCRITORIO --- */}
                <div className="hidden md:grid grid-cols-7 grid-rows-6 h-full border-b border-gray-200">
                    {diasDelMes.map((dia, index) => {
                        const postsDia = getPostsDelDia(dia);
                        const esHoy = dia === new Date().getDate() && fechaActual.getMonth() === new Date().getMonth() && fechaActual.getFullYear() === new Date().getFullYear();
                        const esSeleccionado = dia === diaSeleccionado && panelLateralOpen;

                        if (!dia) return <div key={index} className="bg-gray-50/20 border-r border-b border-gray-100"></div>;

                        // LÓGICA DE VISUALIZACIÓN
                        const soloUno = postsDia.length === 1;
                        const sobrantes = postsDia.length > 2 ? postsDia.length - 2 : 0;
                        // Siempre mostramos máximo 2 posts visualmente en la celda
                        const postsAMostrar = postsDia.slice(0, 2); 

                        return (
                            <div 
                                key={index}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, dia)}
                                onClick={() => seleccionarDia(dia)}
                                className={`
                                    border-r border-b border-gray-100 transition-all cursor-pointer relative group flex flex-row
                                    ${esSeleccionado ? 'bg-indigo-50/40 ring-inset ring-2 ring-indigo-500 z-10' : 'bg-white hover:bg-gray-50'}
                                `}
                            >
                                {/* 1. COLUMNA IZQUIERDA: DÍA + CONTADOR SOBRANTES */}
                                <div className="w-10 pt-2 flex flex-col items-center gap-1 shrink-0 border-r border-transparent group-hover:border-gray-50">
                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-[#DA291C] text-white' : 'text-gray-500'}`}>
                                        {dia}
                                    </span>
                                    
                                    {/* Indicador de Sobrantes (Debajo del número) */}
                                    {sobrantes > 0 && (
                                        <div className="mt-1 bg-indigo-50 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm border border-indigo-100">
                                            +{sobrantes}
                                        </div>
                                    )}

                                    {/* Botón flotante para agregar (visible en hover si no hay sobrantes estorbando) */}
                                    {sobrantes === 0 && (
                                        <button className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-indigo-600 rounded-full p-1 transition-all mt-1">
                                            <MdAdd className="text-sm"/>
                                        </button>
                                    )}
                                </div>
                                
                                {/* 2. COLUMNA DERECHA: POSTS (Máximo 2) */}
                                <div className="flex-1 flex flex-col gap-1 p-1 pt-2 overflow-hidden justify-start">
                                    
                                    {/* CASO A: UN SOLO POST (Tarjeta Detallada) */}
                                    {soloUno && postsDia.map(post => {
                                        const redData = REDES.find(r => r.id === post.red);
                                        return (
                                            <div key={post.id} draggable onDragStart={(e) => handleDragStart(e, post.id)} onClick={(e) => { e.stopPropagation(); onEditar(post); }}
                                                className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group/card h-full max-h-[85px] flex flex-col justify-center"
                                            >
                                                <div className="flex items-center gap-1 mb-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${redData?.color}`}></div>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase truncate">{post.marca}</span>
                                                </div>
                                                <p className="text-[11px] font-bold text-gray-800 leading-tight line-clamp-2">{post.titulo}</p>
                                                <div className="mt-1 flex gap-1">
                                                    <span className={`text-[8px] px-1.5 rounded text-white font-bold ${redData?.color}`}>{redData?.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* CASO B: MÚLTIPLES POSTS (Lista Compacta, Máx 2) */}
                                    {!soloUno && postsAMostrar.map(post => {
                                        const redData = REDES.find(r => r.id === post.red);
                                        return (
                                            <div key={post.id} draggable onDragStart={(e) => handleDragStart(e, post.id)} onClick={(e) => { e.stopPropagation(); onEditar(post); }}
                                                className="bg-white border border-gray-200 rounded px-1.5 py-1.5 shadow-sm flex items-center gap-1.5 hover:border-indigo-300 transition-all h-[40px]"
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${redData?.color} shrink-0`}></div>
                                                <span className="text-[9px] font-bold text-gray-700 truncate leading-tight flex-1">{post.titulo}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={`
                hidden md:flex absolute top-0 right-0 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-100 z-30 flex-col transition-transform duration-300 ease-in-out
                ${panelLateralOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h4 className="font-black text-gray-800 text-lg">Agenda</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase">
                            {diaSeleccionado} de {MESES[fechaActual.getMonth()]}
                        </p>
                    </div>
                    <button onClick={() => setPanelLateralOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <MdClose className="text-xl"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {postsAgenda.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center opacity-60">
                            <MdEventBusy className="text-5xl mb-3"/>
                            <p className="text-sm font-bold">Día libre</p>
                            <p className="text-xs">Sin publicaciones programadas.</p>
                        </div>
                    ) : (
                        postsAgenda.map(post => {
                            const redData = REDES.find(r => r.id === post.red);
                            return (
                                <div key={post.id} className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${redData?.color}`}></div>
                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-500`}>{post.marca}</span>
                                        <button onClick={() => onEditar(post)} className="text-gray-300 hover:text-indigo-600"><MdMoreHoriz/></button>
                                    </div>
                                    <h5 className="font-bold text-gray-800 text-sm mb-1 pl-2 leading-snug">{post.titulo}</h5>
                                    <div className="flex items-center gap-2 pl-2 mt-2">
                                        <span className={`text-[9px] font-bold ${redData?.color} text-white px-1.5 py-0.5 rounded`}>{redData?.label}</span>
                                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">{post.estado}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

        </div>
    </div>
  );
}