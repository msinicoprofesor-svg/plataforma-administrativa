/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/lib/supabase.js (CONEXIÓN OFICIAL A BASE DE DATOS)            */
/* -------------------------------------------------------------------------- */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Creamos y exportamos la instancia de Supabase para usarla en toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);