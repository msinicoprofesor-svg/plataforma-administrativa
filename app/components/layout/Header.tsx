/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/layout/Header.tsx (BARRA SUPERIOR)                 */
/* -------------------------------------------------------------------------- */
'use client';
import { MdMenu, MdChevronLeft, MdSettings } from "react-icons/md";

export default function Header({ sidebarOpen, setSidebarOpen, title }) {
  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 z-20 shrink-0 bg-[#F5F7FA] md:bg-transparent">
        
        {/* IZQUIERDA: TOGGLE Y TÍTULO */}
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm transition-all active:scale-95"
            >
                {sidebarOpen ? <MdChevronLeft className="text-3xl hidden md:block" /> : <MdMenu className="text-3xl" />}
                {!sidebarOpen && <MdMenu className="text-3xl md:hidden" />}
            </button>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate max-w-[200px] md:max-w-none">
                    {title}
                </h2>
            </div>
        </div>

        {/* DERECHA: ACCIONES */}
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm cursor-pointer hover:text-[#DA291C] transition-colors">
                <MdSettings />
            </div>
        </div>
    </header>
  );
}