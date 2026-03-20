/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useInventarioOperativo.js (WMS ENTERPRISE)              */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 

export function useInventarioOperativo() {
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- MAPERS: Traductores Frontend <-> Base de Datos ---
  const mapInvFromDB = (db) => ({
    id: db.id, nombre: db.nombre, almacen: db.almacen, 
    categoria: db.categoria, stock: db.stock, minimo: db.minimo, unidad: db.unidad,
    marca: db.marca || 'General', region: db.region || 'N/A'
  });

  const mapInvToDB = (inv) => ({
    id: inv.id, nombre: inv.nombre, almacen: inv.almacen, 
    categoria: inv.categoria, stock: inv.stock, minimo: inv.minimo, unidad: inv.unidad,
    marca: inv.marca || 'General', region: inv.region || 'N/A'
  });

  const mapMovFromDB = (db) => ({
    id: db.id, fecha: db.fecha, productoId: db.producto_id, 
    cantidad: db.cantidad, tipo: db.tipo, motivo: db.motivo, usuario: db.usuario
  });

  const mapMovToDB = (mov) => ({
    id: mov.id.toString(), fecha: mov.fecha, producto_id: mov.productoId, 
    cantidad: mov.cantidad, tipo: mov.tipo, motivo: mov.motivo, usuario: mov.usuario
  });

  // --- 1. CARGA MAESTRA DESDE SUPABASE ---
  const fetchData = async () => {
    setCargando(true);
    try {
        // 1. Cargar Inventario
        const { data: dInv } = await supabase.from('inventario_operativo').select('*').order('nombre', { ascending: true });
        if (dInv) setInventario(dInv.map(mapInvFromDB));

        // 2. Cargar Movimientos (Kardex)
        const { data: dMov } = await supabase.from('inventario_movimientos').select('*').order('created_at', { ascending: false });
        if (dMov) setMovimientos(dMov.map(mapMovFromDB));

        // 3. Cargar Compras
        const { data: dCom } = await supabase.from('inventario_compras').select('*').order('fecha_compra', { ascending: false });
        if (dCom) setCompras(dCom);

        // 4. Cargar Solicitudes Logísticas (Con sus detalles internos)
        const { data: dSol } = await supabase.from('inventario_solicitudes').select('*, detalles:inventario_solicitudes_detalle(*)').order('fecha_solicitud', { ascending: false });
        if (dSol) setSolicitudes(dSol);

    } catch (error) {
        console.error("Error cargando WMS:", error);
    } finally {
        setCargando(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. REGISTRAR MOVIMIENTO BÁSICO ---
  const registrarMovimiento = async (productoId, cantidad, tipo, motivo, usuario) => {
    const productoActual = inventario.find(p => p.id === productoId);
    if (!productoActual) return;

    const cantNum = parseInt(cantidad, 10);
    const nuevoStock = tipo === 'ENTRADA' ? productoActual.stock + cantNum : productoActual.stock - cantNum;

    setInventario(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));

    const nuevoMovimiento = { id: `MOV-${Date.now()}`, fecha: new Date().toISOString(), productoId, cantidad: cantNum, tipo, motivo, usuario };
    setMovimientos(prev => [nuevoMovimiento, ...prev]);

    try {
        await Promise.all([
            supabase.from('inventario_operativo').update({ stock: nuevoStock }).eq('id', productoId),
            supabase.from('inventario_movimientos').insert([mapMovToDB(nuevoMovimiento)])
        ]);
    } catch (error) {
        console.error("Error al registrar movimiento en BD:", error);
    }
  };

  // --- 3. AGREGAR NUEVO PRODUCTO AL CATÁLOGO ---
  const agregarProducto = async (nuevoProd) => {
      const prod = { ...nuevoProd, id: `INV-${Date.now()}`, stock: 0 };
      setInventario(prev => [...prev, prod]);
      await supabase.from('inventario_operativo').insert([mapInvToDB(prod)]);
  };

  // --- 4. REGISTRAR COMPRA MAYORISTA ---
  const registrarCompra = async (compraPayload, productosComprados) => {
      const { data, error } = await supabase.from('inventario_compras').insert([compraPayload]).select();
      if(!error) {
          // Por cada producto de la factura, sumamos el stock automáticamente
          for(const p of productosComprados) {
              await registrarMovimiento(p.productoId, p.cantidad, 'ENTRADA', `Ingreso de Factura/Compra a ${compraPayload.proveedor}`, compraPayload.usuario_registro_id);
          }
          fetchData();
      }
      return { success: !error, error };
  };

  // --- 5. SOLICITUDES DE MATERIAL (EMPLEADOS/TÉCNICOS) ---
  const crearSolicitud = async (solicitudPayload, detalles) => {
      const { data, error } = await supabase.from('inventario_solicitudes').insert([solicitudPayload]).select();
      if(error || !data) return { success: false, error };

      const solicitudId = data[0].id;
      const detallesConId = detalles.map(d => ({ ...d, solicitud_id: solicitudId }));
      const { error: eDet } = await supabase.from('inventario_solicitudes_detalle').insert(detallesConId);
      
      if(!eDet) fetchData();
      return { success: !eDet, error: eDet };
  };

  const actualizarEstadoSolicitud = async (id, estado, comentarios_admin) => {
      const updateData = { estado, comentarios_admin };
      if(estado === 'ENTREGADO') updateData.fecha_entrega = new Date().toISOString();

      const { error } = await supabase.from('inventario_solicitudes').update(updateData).eq('id', id);
      if(!error) fetchData();
      return { success: !error, error };
  };

  return { 
      inventario, movimientos, compras, solicitudes, cargando, 
      registrarMovimiento, agregarProducto, registrarCompra, crearSolicitud, actualizarEstadoSolicitud,
      refetch: fetchData
  };
}