/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/PanelRRHH.tsx (CON NOMINA CONECTADA)          */
/* -------------------------------------------------------------------------- */
'use client';
import { MdDashboard, MdEventNote, MdAttachMoney, MdCake } from "react-icons/md";

// --- IMPORTS DE MÓDULOS REALES ---
import PanelIncidencias from './incidencias/PanelIncidencias'; 
import PanelNomina from './nomina/PanelNomina'; // <--- IMPORT NUEVO

// --- VISTAS INTERNAS (Placeholders restantes) ---

const MuralView = ({ colaboradores }) => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-8">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <MdDashboard className="text-5xl text-blue-500" />
        </div>
        <h3 className="text-2xl font-black text-gray-800">Periódico Mural</h3>
        <p className="text-gray-400 mt-2 max-w-md">El espacio para noticias, avisos importantes y celebraciones del equipo.</p>
        
        <div className="mt-10 w-full max-w-md">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-pink-100 rounded-full text-pink-500 shrink-0"><MdCake className="text-2xl"/></div>
                <div className="text-left flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cumpleañeros del Mes</p>
                    <p className="font-black text-gray-800 text-lg">
                        {colaboradores?.length > 0 
                            ? `${colaboradores.filter(c => c.fechaNacimiento && new Date(c.fechaNacimiento).getMonth() === new Date().getMonth()).length}`
                            : '0'}
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default function PanelRRHH({ usuario, colaboradores, moduloActivo }) {
    
    let content = null;
    let title = "";
    let subtitle = "";

    switch (moduloActivo) {
        case 'rrhh_incidencias':
            title = "Incidencias";
            subtitle = "Registro y Control";
            content = <PanelIncidencias colaboradores={colaboradores} usuario={usuario} />;
            break;
        case 'rrhh_nomina':
            title = "Nómina";
            subtitle = "Cálculo Quincenal";
            // Conectamos el Panel Real
            content = <PanelNomina usuario={usuario} />;
            break;
        case 'rrhh_mural':
        default:
            title = "Mural & Avisos";
            subtitle = "Comunicación Interna";
            content = <MuralView colaboradores={colaboradores} />;
            break;
    }

    return (
        <div className="h-full flex flex-col bg-[#F6F8FA] rounded-[2.5rem] overflow-hidden shadow-xl animate-fade-in">
            {/* --- HEADER --- */}
            <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">{title}</h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase">{subtitle}</p>
                </div>
            </div>

            {/* --- CONTENIDO --- */}
            <div className="flex-1 overflow-hidden relative">
                <div className="h-full w-full">
                    {content}
                </div>
            </div>
        </div>
    );
}