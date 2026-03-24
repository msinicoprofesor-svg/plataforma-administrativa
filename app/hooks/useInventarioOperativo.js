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
    marca: db.marca || 'General', region: db.region || 'N/A',
    codigoBarras: db.codigo_barras || ''
  });

  const mapInvToDB = (inv) => ({
    id: inv.id, nombre: inv.nombre, almacen: inv.almacen, 
    categoria: inv.categoria, stock: inv.stock, minimo: inv.minimo, unidad: inv.unidad,
    marca: inv.marca || 'General', region: inv.region || 'N/A',
    codigo_barras: inv.codigoBarras || null
  });

  const fetchData = async () => {
    setCargando(true);
    try {
        const { data: dInv } = await supabase.from('inventario_operativo').select('*').order('nombre', { ascending: true });
        if (dInv) setInventario(dInv.map(mapInvFromDB));

        const { data: dMov } = await supabase.from('inventario_movimientos').select('*').order('created_at', { ascending: false });
        if (dMov) setMovimientos(dMov);

        const { data: dCom } = await supabase.from('inventario_compras').select('*').order('fecha_compra', { ascending: false });
        if (dCom) setCompras(dCom);

        const { data: dSol } = await supabase.from('inventario_solicitudes').select('*, detalles:inventario_solicitudes_detalle(*)').order('fecha_solicitud', { ascending: false });
        if (dSol) setSolicitudes(dSol);

        const { data: dAct } = await supabase.from('inventario_activos').select('*').order('fecha_asignacion', { ascending: false });
        if (dAct) setActivos(dAct);
    } catch (error) { console.error("Error WMS:", error); } finally { setCargando(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const registrarMovimiento = async (productoId, cantidad, tipo, motivo, usuario) => {
    const productoActual = inventario.find(p => p.id === productoId);
    if (!productoActual) return;
    const cantNum = parseInt(cantidad, 10);
    const nuevoStock = tipo === 'ENTRADA' ? productoActual.stock + cantNum : Math.max(0, productoActual.stock - cantNum);

    setInventario(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));
    const nuevoMovimiento = { id: `MOV-${Date.now()}`, fecha: new Date().toISOString(), producto_id: productoId, cantidad: cantNum, tipo, motivo, usuario };

    await Promise.all([
        supabase.from('inventario_operativo').update({ stock: nuevoStock }).eq('id', productoId),
        supabase.from('inventario_movimientos').insert([nuevoMovimiento])
    ]);
  };

  const agregarProducto = async (nuevoProd) => {
      const prod = { ...nuevoProd, id: `INV-${Date.now()}`, stock: 0 };
      setInventario(prev => [...prev, prod]);
      await supabase.from('inventario_operativo').insert([mapInvToDB(prod)]);
  };

  const registrarCompra = async (compraPayload, productosComprados) => {
      try {
          // ENRIQUECEMOS LOS DETALLES CON EL NOMBRE REAL DEL PRODUCTO
          const detallesEnriquecidos = productosComprados.map(p => {
              const base = inventario.find(i => i.id === p.productoBaseId);
              return { ...p, nombre: base ? base.nombre : 'Producto Desconocido' };
          });

          // AGREGAMOS LOS DETALLES AL PAYLOAD DE LA COMPRA
          const payloadFinal = { ...compraPayload, detalles: detallesEnriquecidos };

          const { error } = await supabase.from('inventario_compras').insert([payloadFinal]);
          if(error) return { success: false, error: error.message };

          for(const p of productosComprados) {
              const baseProd = inventario.find(inv => inv.id === p.productoBaseId);
              if(!baseProd) continue;

              const marcaSegura = p.marca || 'JAVAK (Corporativo)';
              const regionSegura = p.region || 'Almacén General';
              const almacenSeguro = regionSegura.toUpperCase();

              const prodFisico = inventario.find(inv => inv.nombre === baseProd.nombre && inv.marca === marcaSegura && (inv.almacen === almacenSeguro || inv.region === regionSegura));
              
              if(prodFisico) {
                  await registrarMovimiento(prodFisico.id, p.cantidad, 'ENTRADA', `Compra Fac: ${compraPayload.proveedor}`, compraPayload.usuario_registro_id);
              } else {
                  const nuevoFisico = { ...baseProd, id: `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`, marca: marcaSegura, almacen: almacenSeguro, region: regionSegura, stock: parseInt(p.cantidad, 10) };
                  await supabase.from('inventario_operativo').insert([mapInvToDB(nuevoFisico)]);
                  const mov = { id: `MOV-${Date.now()}`, fecha: new Date().toISOString(), producto_id: nuevoFisico.id, cantidad: nuevoFisico.stock, tipo: 'ENTRADA', motivo: `Alta Compra Fac: ${compraPayload.proveedor}`, usuario: compraPayload.usuario_registro_id };
                  await supabase.from('inventario_movimientos').insert([mov]);
              }
          }
          fetchData();
          return { success: true };
      } catch (err) { return { success: false, error: err.message }; }
  };

  const crearSolicitud = async (solicitudPayload, detalles) => {
      const { data, error } = await supabase.from('inventario_solicitudes').insert([solicitudPayload]).select();
      if(error) return { success: false, error };
      const detallesConId = detalles.map(d => ({ ...d, solicitud_id: data[0].id }));
      await supabase.from('inventario_solicitudes_detalle').insert(detallesConId);
      fetchData();
      return { success: true };
  };

  const actualizarEstadoSolicitud = async (id, estado, comentarios_admin) => {
      const updateData = { estado, comentarios_admin };
      if(estado === 'ENTREGADO') updateData.fecha_entrega = new Date().toISOString();
      const { error } = await supabase.from('inventario_solicitudes').update(updateData).eq('id', id);
      
      if(!error && estado === 'EN_ENVIO') {
          const sol = solicitudes.find(s => s.id === id);
          if (sol && sol.detalles) {
              for (const det of sol.detalles) {
                  const str = det.producto_id;
                  const lastParen = str.lastIndexOf(' (');
                  const pNombre = lastParen !== -1 ? str.substring(0, lastParen).trim() : str.trim();
                  
                  const origenes = inventario.filter(p => p.nombre === pNombre && (p.region === 'Almacén General' || p.almacen === 'ALMACÉN GENERAL' || p.almacen === 'ALMACEN GENERAL') && p.stock > 0);
                  
                  let cantidadPendiente = parseInt(det.cantidad_solicitada, 10);
                  const destinoLimpio = sol.destino;

                  for (const origen of origenes) {
                      if (cantidadPendiente <= 0) break;
                      const cantidadATomar = Math.min(origen.stock, cantidadPendiente);

                      await registrarMovimiento(origen.id, cantidadATomar, 'SALIDA', `Despacho a ${sol.destino} (Req: ${sol.id.substring(0,6)})`, 'SISTEMA_LOGISTICA');
                      
                      const destino = inventario.find(p => p.nombre === pNombre && p.marca === origen.marca && (p.region === destinoLimpio || p.almacen === destinoLimpio.toUpperCase()));
                      
                      if (destino) {
                          await registrarMovimiento(destino.id, cantidadATomar, 'ENTRADA', `Transf. de Almacén Gral (Req: ${sol.id.substring(0,6)})`, 'SISTEMA_LOGISTICA');
                      } else {
                          const nuevoFisico = { ...origen, id: `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`, almacen: destinoLimpio.toUpperCase(), region: destinoLimpio, stock: cantidadATomar };
                          await supabase.from('inventario_operativo').insert([mapInvToDB(nuevoFisico)]);
                          const mov = { id: `MOV-${Date.now()}`, fecha: new Date().toISOString(), producto_id: nuevoFisico.id, cantidad: cantidadATomar, tipo: 'ENTRADA', motivo: `Transf. Inicial Gral (Req: ${sol.id.substring(0,6)})`, usuario: 'SISTEMA_LOGISTICA' };
                          await supabase.from('inventario_movimientos').insert([mov]);
                      }
                      cantidadPendiente -= cantidadATomar;
                  }
              }
          }
          fetchData();
      }
      return { success: !error, error };
  };

  const agregarActivoFijo = async (activo) => {
      const { error } = await supabase.from('inventario_activos').insert([activo]);
      if(!error) fetchData();
      return { success: !error };
  };

  return { inventario, movimientos, compras, solicitudes, activos, cargando, registrarMovimiento, agregarProducto, registrarCompra, crearSolicitud, actualizarEstadoSolicitud, agregarActivoFijo, refetch: fetchData };
}