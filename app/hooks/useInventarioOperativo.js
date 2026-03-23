/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useInventarioOperativo.js (WMS MULTI-SUCURSAL)          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 

export function useInventarioOperativo() {
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [activos, setActivos] = useState([]); 
  const [cargando, setCargando] = useState(true);

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

  const fetchData = async () => {
    setCargando(true);
    try {
        const { data: dInv } = await supabase.from('inventario_operativo').select('*').order('nombre', { ascending: true });
        if (dInv) setInventario(dInv.map(mapInvFromDB));

        const { data: dMov } = await supabase.from('inventario_movimientos').select('*').order('created_at', { ascending: false });
        if (dMov) setMovimientos(dMov.map(m => ({
            id: m.id, fecha: m.fecha, productoId: m.producto_id, 
            cantidad: m.cantidad, tipo: m.tipo, motivo: m.motivo, usuario: m.usuario
        })));

        const { data: dCom } = await supabase.from('inventario_compras').select('*').order('fecha_compra', { ascending: false });
        if (dCom) setCompras(dCom);

        const { data: dSol } = await supabase.from('inventario_solicitudes').select('*, detalles:inventario_solicitudes_detalle(*)').order('fecha_solicitud', { ascending: false });
        if (dSol) setSolicitudes(dSol);

        const { data: dAct } = await supabase.from('inventario_activos').select('*').order('fecha_asignacion', { ascending: false });
        if (dAct) setActivos(dAct);

    } catch (error) {
        console.error("Error cargando WMS:", error);
    } finally {
        setCargando(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const registrarMovimiento = async (productoId, cantidad, tipo, motivo, usuario) => {
    const productoActual = inventario.find(p => p.id === productoId);
    if (!productoActual) return;
    const cantNum = parseInt(cantidad, 10);
    const nuevoStock = tipo === 'ENTRADA' ? productoActual.stock + cantNum : productoActual.stock - cantNum;

    setInventario(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));
    const nuevoMovimiento = { id: `MOV-${Date.now()}`, fecha: new Date().toISOString(), productoId, cantidad: cantNum, tipo, motivo, usuario };
    setMovimientos(prev => [nuevoMovimiento, ...prev]);

    await Promise.all([
        supabase.from('inventario_operativo').update({ stock: nuevoStock }).eq('id', productoId),
        supabase.from('inventario_movimientos').insert([{ id: nuevoMovimiento.id, fecha: nuevoMovimiento.fecha, producto_id: productoId, cantidad: cantNum, tipo, motivo, usuario }])
    ]);
  };

  const agregarProducto = async (nuevoProd) => {
      const prod = { ...nuevoProd, id: `INV-${Date.now()}`, stock: 0 };
      setInventario(prev => [...prev, prod]);
      await supabase.from('inventario_operativo').insert([mapInvToDB(prod)]);
  };

  const registrarCompra = async (compraPayload, productosComprados) => {
      try {
          const { data: compraBD, error } = await supabase.from('inventario_compras').insert([compraPayload]).select();
          if(error) return { success: false, error: error.message };

          for(const p of productosComprados) {
              const baseProd = inventario.find(inv => inv.id === p.productoBaseId);
              if(!baseProd) continue;

              const marcaSegura = p.marca || 'JAVAK (Corporativo)';
              const regionSegura = p.region || 'Centro';
              const almacenSeguro = regionSegura.toUpperCase();

              const prodFisico = inventario.find(inv => inv.nombre === baseProd.nombre && inv.marca === marcaSegura && (inv.almacen === almacenSeguro || inv.region === regionSegura));
              
              if(prodFisico) {
                  await registrarMovimiento(prodFisico.id, p.cantidad, 'ENTRADA', `Compra Fac: ${compraPayload.proveedor}`, compraPayload.usuario_registro_id);
              } else {
                  const nuevoFisico = {
                      ...baseProd,
                      id: `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                      marca: marcaSegura,
                      almacen: almacenSeguro,
                      region: regionSegura,
                      stock: parseInt(p.cantidad, 10)
                  };
                  
                  await supabase.from('inventario_operativo').insert([mapInvToDB(nuevoFisico)]);
                  
                  const mov = { id: `MOV-${Date.now()}`, fecha: new Date().toISOString(), producto_id: nuevoFisico.id, cantidad: nuevoFisico.stock, tipo: 'ENTRADA', motivo: `Alta por Compra Fac: ${compraPayload.proveedor}`, usuario: compraPayload.usuario_registro_id };
                  await supabase.from('inventario_movimientos').insert([mov]);
              }
          }
          fetchData();
          return { success: true };
      } catch (err) {
          console.error("Fallo crítico en registrarCompra:", err);
          return { success: false, error: err.message || "Error procesando los productos." };
      }
  };

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
      
      if(!error) {
          // --- LOGICA DE TRANSFERENCIA DE STOCK (WMS) ---
          if (estado === 'EN_ENVIO') {
              const sol = solicitudes.find(s => s.id === id);
              if (sol && sol.detalles) {
                  for (const det of sol.detalles) {
                      // 1. Extraemos el nombre y marca que se guardó en la solicitud
                      // Ej. "Antena LiteBeam M5 (JAVAK (Corporativo))"
                      const str = det.producto_id;
                      const lastParen = str.lastIndexOf(' (');
                      let pNombre = str;
                      let pMarca = 'General';
                      
                      if(lastParen !== -1) {
                          pNombre = str.substring(0, lastParen).trim();
                          pMarca = str.substring(lastParen + 2, str.length - 1).trim();
                      }
                      
                      // 2. Buscamos el producto en el Almacén General (Centro)
                      const origen = inventario.find(p => p.nombre === pNombre && p.marca === pMarca && (p.region === 'Centro' || p.almacen === 'CENTRO'));
                      
                      if (origen) {
                          // A) Descontamos del General
                          await registrarMovimiento(origen.id, det.cantidad_solicitada, 'SALIDA', `Despacho a ${sol.destino} (Req: ${sol.id.substring(0,6)})`, 'SISTEMA_LOGISTICA');
                          
                          // B) Buscamos / Creamos en el destino
                          const destinoLimpio = sol.destino.replace(' (Almacén General)', '');
                          const destino = inventario.find(p => p.nombre === pNombre && p.marca === pMarca && (p.region === destinoLimpio || p.almacen === destinoLimpio.toUpperCase()));
                          
                          if (destino) {
                              // Ya existe la ficha, le sumamos el stock que llegó
                              await registrarMovimiento(destino.id, det.cantidad_solicitada, 'ENTRADA', `Transferencia de Almacén General (Req: ${sol.id.substring(0,6)})`, 'SISTEMA_LOGISTICA');
                          } else {
                              // No existe, clonamos la ficha y le ponemos el stock
                              const nuevoFisico = {
                                  ...origen,
                                  id: `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                                  almacen: destinoLimpio.toUpperCase(),
                                  region: destinoLimpio,
                                  stock: parseInt(det.cantidad_solicitada, 10)
                              };
                              
                              await supabase.from('inventario_operativo').insert([mapInvToDB(nuevoFisico)]);
                              
                              const mov = { id: `MOV-${Date.now()}`, fecha: new Date().toISOString(), producto_id: nuevoFisico.id, cantidad: nuevoFisico.stock, tipo: 'ENTRADA', motivo: `Transferencia Inicial de General (Req: ${sol.id.substring(0,6)})`, usuario: 'SISTEMA_LOGISTICA' };
                              await supabase.from('inventario_movimientos').insert([mov]);
                          }
                      }
                  }
              }
          }
          // Refrescamos todo para que la tabla muestre el nuevo stock
          fetchData();
      }
      return { success: !error, error };
  };

  const agregarActivoFijo = async (activo) => {
      const { error } = await supabase.from('inventario_activos').insert([activo]);
      if(!error) fetchData();
      return { success: !error };
  };

  return { 
      inventario, movimientos, compras, solicitudes, activos, cargando, 
      registrarMovimiento, agregarProducto, registrarCompra, crearSolicitud, actualizarEstadoSolicitud, agregarActivoFijo,
      refetch: fetchData
  };
}