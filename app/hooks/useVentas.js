/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useVentas.js (MIGRADO A SUPABASE)                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // <-- CONEXIÓN OFICIAL

export function useVentas() {
  const [cobertura, setCobertura] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- MAPERS: Traductores Frontend <-> Base de Datos ---
  const mapZonaToDB = (z) => ({
      id: z.id, nombre_ap: z.nombreAp, comunidad: z.comunidad, 
      municipio: z.municipio, estado: z.estado, sede: z.sede, 
      marca: z.marca, tipo: z.tipo, lat: z.lat, lng: z.lng, 
      estatus: z.estatus, costos: z.costos, planes: z.planes, cajas: z.cajas
  });

  const mapZonaFromDB = (db) => ({
      id: db.id, nombreAp: db.nombre_ap, comunidad: db.comunidad, 
      municipio: db.municipio, estado: db.estado, sede: db.sede, 
      marca: db.marca, tipo: db.tipo, lat: db.lat, lng: db.lng, 
      estatus: db.estatus, costos: db.costos, planes: db.planes, cajas: db.cajas
  });

  const mapVentaToDB = (v) => ({
      id: v.id, fecha_registro: v.fechaRegistro, vendedor: v.vendedor, 
      cliente: v.cliente, servicio: v.servicio, estatus: v.estatus, bitacora: v.bitacora
  });

  const mapVentaFromDB = (db) => ({
      id: db.id, fechaRegistro: db.fecha_registro, vendedor: db.vendedor, 
      cliente: db.cliente, servicio: db.servicio, estatus: db.estatus, bitacora: db.bitacora
  });

  const mapCuponToDB = (c) => ({
      id: c.id, codigo: c.codigo, descripcion: c.descripcion, 
      tipo_descuento: c.tipoDescuento, valor: c.valor, aplicar_a: c.aplicarA, 
      vigencia: c.vigencia, restricciones: c.restricciones, limite: c.limite, 
      usos: c.usos, activo: c.activo
  });

  const mapCuponFromDB = (db) => ({
      id: db.id, codigo: db.codigo, descripcion: db.descripcion, 
      tipoDescuento: db.tipo_descuento, valor: db.valor, aplicarA: db.aplicar_a, 
      vigencia: db.vigencia, restricciones: db.restricciones, limite: db.limite, 
      usos: db.usos, activo: db.activo
  });

  // --- 1. CARGA INICIAL DESDE SUPABASE ---
  useEffect(() => {
    const cargarDatos = async () => {
        setCargando(true);
        try {
            // Cargar Zonas
            const { data: dCob } = await supabase.from('ventas_zonas').select('*');
            if (dCob) setCobertura(dCob.map(mapZonaFromDB));

            // Cargar Ventas
            const { data: dVen } = await supabase.from('ventas_registros').select('*').order('created_at', { ascending: false });
            if (dVen) setVentas(dVen.map(mapVentaFromDB));

            // Cargar Cupones
            const { data: dCup } = await supabase.from('ventas_cupones').select('*');
            if (dCup) setCupones(dCup.map(mapCuponFromDB));

        } catch (error) {
            console.error("Error cargando Ventas:", error);
        } finally {
            setCargando(false);
        }
    };
    cargarDatos();
  }, []);

  // --- 2. GESTIÓN DE CUPONES ---
  const agregarCupon = async (nuevo) => {
      const cupon = { ...nuevo, id: `CUP-${Date.now()}`, activo: true, usos: 0 };
      setCupones(prev => [cupon, ...prev]);
      await supabase.from('ventas_cupones').insert([mapCuponToDB(cupon)]);
  };

  const eliminarCupon = async (id) => {
      setCupones(prev => prev.filter(c => c.id !== id));
      await supabase.from('ventas_cupones').delete().eq('id', id);
  };

  const validarCupon = (codigo, contextoVenta) => {
      const cupon = cupones.find(c => c.codigo.toUpperCase() === codigo.toUpperCase() && c.activo);
      
      if (!cupon) return { valido: false, mensaje: 'Cupón no existe o inactivo.' };

      // Validar Vigencia
      const hoy = new Date().toISOString().split('T')[0];
      if (cupon.vigencia < hoy) return { valido: false, mensaje: 'Cupón expirado.' };

      // Validar Límite
      if (cupon.limite !== null && cupon.usados >= cupon.limite) {
          return { valido: false, mensaje: 'Este cupón ha agotado sus usos disponibles.' };
      }

      // Validar Restricciones
      const restr = cupon.restricciones || {};
      if (restr.sede !== 'TODAS' && restr.sede !== contextoVenta.sede) {
          return { valido: false, mensaje: `Solo válido para sede ${restr.sede}.` };
      }
      if (restr.marca !== 'TODAS' && restr.marca !== contextoVenta.marca) {
          return { valido: false, mensaje: `Solo válido para marca ${restr.marca}.` };
      }
      
      // Validar Zona Específica
      if (restr.zonaId && restr.zonaId !== 'TODAS') {
          if (restr.zonaId !== contextoVenta.zonaId) {
              return { valido: false, mensaje: 'Este cupón no es válido para esta zona.' };
          }
      }

      return { valido: true, datos: cupon, mensaje: 'Cupón aplicado correctamente.' };
  };

  // --- 3. GESTIÓN DE COBERTURA Y VENTAS ---
  const agregarZona = async (zona) => {
    const nuevaZona = { ...zona, id: `ZONA-${Date.now()}` };
    setCobertura(prev => [...prev, nuevaZona]);
    await supabase.from('ventas_zonas').insert([mapZonaToDB(nuevaZona)]);
  };

  const actualizarZona = async (zonaActualizada) => {
    setCobertura(prev => prev.map(z => z.id === zonaActualizada.id ? zonaActualizada : z));
    await supabase.from('ventas_zonas').update(mapZonaToDB(zonaActualizada)).eq('id', zonaActualizada.id);
  };

  const registrarVenta = async (datosFormulario, vendedor) => {
    const nuevaVenta = {
      id: `VENTA-${Date.now()}`,
      fechaRegistro: new Date().toISOString(), // Formato estándar ISO para BD
      vendedor: { id: vendedor.id, nombre: vendedor.nombre },
      cliente: { ...datosFormulario }, 
      servicio: { ...datosFormulario },
      estatus: 'PENDIENTE',
      bitacora: [{ fecha: new Date().toISOString(), mensaje: 'Venta registrada', usuario: vendedor.nombre }]
    };

    // 1. Actualización Inmediata UI (Optimista)
    setVentas(prev => [nuevaVenta, ...prev]);

    // PREPARAR ACTUALIZACIONES BD
    const updates = [];

    // A) Guardar Venta
    updates.push(supabase.from('ventas_registros').insert([mapVentaToDB(nuevaVenta)]));

    // B) Actualizar Inventario Puertos (Si es Fibra)
    if (datosFormulario.tecnologia === 'FIBRA' && datosFormulario.zonaId && datosFormulario.cajaId) {
        const zona = cobertura.find(z => z.id === datosFormulario.zonaId);
        if (zona) {
            const nuevasCajas = zona.cajas.map(c => 
                c.id === datosFormulario.cajaId ? { ...c, puertosLibres: Math.max(0, c.puertosLibres - 1) } : c
            );
            const zonaActualizada = { ...zona, cajas: nuevasCajas };
            
            // UI Update
            setCobertura(prev => prev.map(z => z.id === zona.id ? zonaActualizada : z));
            // BD Update
            updates.push(supabase.from('ventas_zonas').update({ cajas: nuevasCajas }).eq('id', zona.id));
        }
    }

    // C) Actualizar Uso de Cupón
    if (datosFormulario.cuponAplicado) {
        const cupon = cupones.find(c => c.id === datosFormulario.cuponAplicado.id);
        if (cupon) {
            const nuevosUsos = (cupon.usos || 0) + 1;
            const cuponActualizado = { ...cupon, usos: nuevosUsos };
            
            // UI Update
            setCupones(prev => prev.map(c => c.id === cupon.id ? cuponActualizado : c));
            // BD Update
            updates.push(supabase.from('ventas_cupones').update({ usos: nuevosUsos }).eq('id', cupon.id));
        }
    }

    // EJECUTAR TODO EN PARALELO
    await Promise.all(updates);
  };

  const actualizarEstadoVenta = async (idVenta, nuevoEstado, nota, usuarioAutor) => {
    let ventaActualizada = null;

    setVentas(prev => prev.map(v => {
      if (v.id === idVenta) {
        ventaActualizada = {
          ...v,
          estatus: nuevoEstado,
          bitacora: [{ fecha: new Date().toISOString(), mensaje: `Cambio a ${nuevoEstado}: ${nota}`, usuario: usuarioAutor }, ...v.bitacora || []]
        };
        return ventaActualizada;
      }
      return v;
    }));

    if (ventaActualizada) {
        await supabase.from('ventas_registros').update({ 
            estatus: nuevoEstado, 
            bitacora: ventaActualizada.bitacora 
        }).eq('id', idVenta);
    }
  };

  return { 
      cobertura, ventas, cupones, cargando,
      agregarZona, actualizarZona, registrarVenta, actualizarEstadoVenta, 
      agregarCupon, eliminarCupon, validarCupon 
  };
}