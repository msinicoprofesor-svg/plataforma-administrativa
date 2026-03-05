/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useColaboradores.js (CORRECCIÓN DE CAMPOS FALTANTES)    */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 

const DEFAULT_HORARIO = {
    tipo: 'REGULAR',
    horasDiarias: 8,
    dias: { lunes: 8, martes: 8, miercoles: 8, jueves: 8, viernes: 8, sabado: 0, domingo: 0 }
};

export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;

  // --- MAPERS: Traductores entre Frontend y BD ---
  const mapFromDB = (db) => ({
    id: db.id, nombre: db.nombre, puesto: db.puesto, departamento: db.departamento,
    email: db.email, region: db.region, marca: db.marca, puntos: db.puntos || 0,
    foto: db.foto, fechaIngreso: db.fecha_ingreso, horario: db.horario || DEFAULT_HORARIO,
    // CAMPOS DE CONTACTO RECUPERADOS:
    telefono: db.telefono || '',
    facebook: db.facebook || '',
    cumpleanos: db.cumpleanos || '',
    rfc: db.rfc, curp: db.curp, nss: db.nss,
    sueldoBase: db.sueldo_base || 0, premioPuntualidad: db.premio_puntualidad || 0,
    premioAsistencia: db.premio_asistencia || 0, bonoEspecial: db.bono_especial || 0,
    cajaAhorro: db.caja_ahorro || 0, creditoInfonavit: db.credito_infonavit || 0,
    // AMBOS PRÉSTAMOS AHORA SON JSON:
    prestamoAlianza: db.prestamo_alianza || { saldo: 0, descuento: 0 },
    prestamoEmpresa: db.prestamo_empresa || { saldo: 0, descuento: 0 }
  });

  const mapToDB = (c) => ({
    id: c.id, nombre: c.nombre, puesto: c.puesto, departamento: c.departamento || 'General',
    email: c.email || null, region: c.region, marca: c.marca, puntos: c.puntos || 0,
    foto: c.foto, fecha_ingreso: c.fechaIngreso || null, horario: c.horario,
    // CAMPOS DE CONTACTO ENVIADOS:
    telefono: c.telefono || null,
    facebook: c.facebook || null,
    cumpleanos: c.cumpleanos || null,
    rfc: c.rfc, curp: c.curp, nss: c.nss,
    sueldo_base: c.sueldoBase, premio_puntualidad: c.premioPuntualidad,
    premio_asistencia: c.premioAsistencia, bono_especial: c.bonoEspecial,
    caja_ahorro: c.cajaAhorro, credito_infonavit: c.creditoInfonavit,
    // AMBOS PRÉSTAMOS COMO JSON:
    prestamo_alianza: c.prestamoAlianza, 
    prestamo_empresa: c.prestamoEmpresa
  });

  const mapHistorialFromDB = (db) => ({
      id: db.id, fecha: db.fecha, tipo: db.tipo, detalle: db.detalle,
      colaborador: db.colaborador, totalPuntos: db.total_puntos, nota: db.nota,
      detalles: db.detalles, cantidad: db.cantidad
  });

  const mapHistorialToDB = (h) => ({
      id: h.id, fecha: h.fecha, tipo: h.tipo, detalle: h.detalle,
      colaborador: h.colaborador, total_puntos: h.totalPuntos, nota: h.nota,
      detalles: h.detalles, cantidad: h.cantidad
  });

  // --- CARGA INICIAL DESDE SUPABASE ---
  useEffect(() => {
    const cargarDatos = async () => {
        setCargando(true);
        try {
            const { data: dataColabs, error: errColabs } = await supabase
                .from('colaboradores')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!errColabs && dataColabs) {
                setColaboradores(dataColabs.map(mapFromDB));
            }

            const { data: dataHist, error: errHist } = await supabase
                .from('historial_puntos')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!errHist && dataHist) {
                setHistorial(dataHist.map(mapHistorialFromDB));
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setCargando(false);
        }
    };

    cargarDatos();
  }, []);

  // --- ACCIONES CRUD ---
  const agregarColaborador = async (nuevo) => {
    const id = nuevo.id || `EMP-${Date.now()}`;
    const colaborador = { 
        ...nuevo, 
        id, 
        puntos: 0,
        horario: nuevo.horario || DEFAULT_HORARIO, 
        sueldoBase: parseFloat(nuevo.sueldoBase) || 0,
        premioPuntualidad: parseFloat(nuevo.premioPuntualidad) || 0,
        premioAsistencia: parseFloat(nuevo.premioAsistencia) || 0,
        bonoEspecial: parseFloat(nuevo.bonoEspecial) || 0,
        cajaAhorro: parseFloat(nuevo.cajaAhorro) || 0,
        creditoInfonavit: parseFloat(nuevo.creditoInfonavit) || 0,
        prestamoAlianza: nuevo.prestamoAlianza || { saldo: 0, descuento: 0 },
        prestamoEmpresa: nuevo.prestamoEmpresa || { saldo: 0, descuento: 0 }
    };

    setColaboradores(prev => [colaborador, ...prev]);

    const { error } = await supabase.from('colaboradores').insert([mapToDB(colaborador)]);
    if (error) console.error("Error BD al agregar:", error);
  };

  const actualizarColaborador = async (editado) => {
    const colaboradorActualizado = {
        ...editado,
        horario: editado.horario || DEFAULT_HORARIO,
        sueldoBase: parseFloat(editado.sueldoBase) || 0,
        premioPuntualidad: parseFloat(editado.premioPuntualidad) || 0,
        premioAsistencia: parseFloat(editado.premioAsistencia) || 0
    };

    setColaboradores(prev => prev.map(c => c.id === editado.id ? colaboradorActualizado : c));

    const { error } = await supabase
        .from('colaboradores')
        .update(mapToDB(colaboradorActualizado))
        .eq('id', editado.id);
        
    if (error) console.error("Error BD al actualizar:", error);
  };

  const eliminarColaborador = async (id) => {
    setColaboradores(prev => prev.filter(c => c.id !== id)); 
    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    if (error) console.error("Error BD al eliminar:", error);
  };

  // --- MOTOR DE PUNTOS LIKESTORE ---
  const registrarPuntosMasivos = async (evento) => {
    const colabsAActualizar = [];
    
    const nuevosColaboradores = colaboradores.map(colab => {
        const detalle = evento.detalles.find(d => d.colaboradorId === colab.id);
        if (detalle) {
            const saldoActual = parseInt(colab.puntos) || 0;
            const puntosNuevos = parseInt(detalle.puntosGanados) || 0;
            const colabActualizado = { ...colab, puntos: saldoActual + puntosNuevos };
            colabsAActualizar.push(colabActualizado);
            return colabActualizado;
        }
        return colab;
    });

    setColaboradores(nuevosColaboradores);

    const descripcion = evento.tipo === 'CANJE_PRODUCTOS' 
        ? `Canje: ${evento.detalles[0]?.nombre || 'Artículo'}`
        : `${evento.tipo} (${evento.cantidad} ops)`;

    const registroHistorial = {
        id: evento.id || `EVT-${Date.now()}`,
        fecha: evento.fecha || new Date().toISOString(),
        tipo: evento.tipo, 
        detalle: descripcion,
        colaborador: evento.detalles.length > 1 ? 'Múltiples' : (evento.detalles[0]?.nombre || 'Varios'),
        totalPuntos: evento.totalPuntos,
        nota: evento.marca || 'General',
        detalles: evento.detalles, 
        cantidad: evento.cantidad
    };

    setHistorial(prev => [registroHistorial, ...prev]);

    await supabase.from('historial_puntos').insert([mapHistorialToDB(registroHistorial)]);
    
    if (colabsAActualizar.length > 0) {
        const upsertData = colabsAActualizar.map(mapToDB);
        await supabase.from('colaboradores').upsert(upsertData, { onConflict: 'id' });
    }
  };

  const eliminarImportacion = async (idEvento) => {
      setHistorial(prev => prev.filter(h => h.id !== idEvento));
      await supabase.from('historial_puntos').delete().eq('id', idEvento);
  };

  const importarMasivo = async (nuevos) => {
      const actualesIds = new Set(colaboradores.map(c => c.id));
      const filtrados = nuevos.filter(n => !actualesIds.has(n.id));
      
      const nuevosNormalizados = filtrados.map(n => ({
          ...n, puntos: 0, horario: DEFAULT_HORARIO, sueldoBase: 0, 
          prestamoEmpresa: { saldo: 0, descuento: 0 },
          prestamoAlianza: { saldo: 0, descuento: 0 }
      }));

      setColaboradores(prev => [...prev, ...nuevosNormalizados]);

      if (nuevosNormalizados.length > 0) {
          const insertData = nuevosNormalizados.map(mapToDB);
          await supabase.from('colaboradores').insert(insertData);
      }
  };

  const colaboradoresFiltrados = colaboradores.filter(c => 
    (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (c.puesto || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(colaboradoresFiltrados.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const colaboradoresVisibles = colaboradoresFiltrados.slice(inicio, inicio + itemsPorPagina);

  return {
    colaboradoresVisibles,
    colaboradoresReales: colaboradores,
    busqueda,
    setBusqueda,
    agregarColaborador,
    eliminarColaborador,
    actualizarColaborador,
    importarMasivo,
    registrarPuntosMasivos,
    eliminarImportacion,
    historial,
    cargando,
    paginacion: {
        paginaActual, totalPaginas,
        irAPaginaSiguiente: () => setPaginaActual(p => Math.min(p + 1, totalPaginas)),
        irAPaginaAnterior: () => setPaginaActual(p => Math.max(p - 1, 1)),
        tieneSiguiente: paginaActual < totalPaginas,
        tieneAnterior: paginaActual > 1
    }
  };
}