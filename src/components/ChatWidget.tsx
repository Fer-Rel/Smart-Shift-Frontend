import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react'; // Asegúrate de tener lucide-react instalado

interface Mensaje {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mensajeInput, setMensajeInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [historial, setHistorial] = useState<Mensaje[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! Bienvenido al soporte interactivo de Smart-Shift. ¿En qué puedo ayudarte con la gestión de tus citas médicas hoy?',
      timestamp: new Date(),
    },
  ]);

  const contenedorMensajesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje cada vez que cambia el historial o el estado de escritura
  useEffect(() => {
    if (contenedorMensajesRef.current) {
      contenedorMensajesRef.current.scrollTo({
        top: contenedorMensajesRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [historial, isTyping]);

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeInput.trim()) return;

    // 1. Agregar mensaje del usuario
    const nuevoMensajeUsuario: Mensaje = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: mensajeInput.trim(),
      timestamp: new Date(),
    };

    setHistorial((prev) => [...prev, nuevoMensajeUsuario]);
    setMensajeInput('');

    // 2. Simular estado "Escribiendo..." del asistente
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      // 3. Generar respuesta mock de IA / Soporte
      const respuestaBot: Mensaje = {
        id: crypto.randomUUID(),
        sender: 'bot',
        text: 'Agradecemos tu mensaje en la simulación de Smart-Shift. Próximamente, este canal estará conectado directamente a nuestro servicio de Backend para resolver tus dudas médicas en tiempo real.',
        timestamp: new Date(),
      };

      setHistorial((prev) => [...prev, respuestaBot]);
    }, 1200); // 1.2 segundos de espera simulada
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* BOTÓN FLOTANTE (TRIGGER) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center w-14 h-14 text-white rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <MessageSquare className="w-6 h-6" />
          {/* Indicador visual animado (Notificación Neon Pulsante) */}
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* VENTANA DEL WIDGET DE CHAT */}
      {isOpen && (
        <div 
          className="
            flex flex-col bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl transition-all duration-300 ease-out
            fixed inset-0 rounded-none w-full h-full sm:absolute sm:inset-auto sm:bottom-20 sm:right-0 sm:w-96 sm:h-[500px] sm:max-h-[80vh] sm:rounded-2xl overflow-hidden
          "
        >
          {/* HEADER DEL CHAT */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-800/50 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                <span className="font-bold text-sky-400">SS</span>
                {/* Estado en línea (verde animado) */}
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-none">Asistente Smart-Shift</h3>
                <span className="text-xs text-emerald-400">en línea</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* HISTORIAL DE MENSAJES */}
          <div 
            ref={contenedorMensajesRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40 custom-scrollbar"
          >
            {historial.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-sky-500 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* INDICADOR DE ESCRITURA ("ESCRIBIENDO...") */}
            {isTyping && (
              <div className="flex flex-col items-start animate-fade-in">
                <div className="bg-slate-800 text-slate-400 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* INPUT DE TEXTO */}
          <form 
            onSubmit={manejarEnvio}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={mensajeInput}
              onChange={(e) => setMensajeInput(e.target.value)}
              placeholder="Escribe un mensaje aquí..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!mensajeInput.trim()}
              className="p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 disabled:hover:bg-sky-500 transition-all flex items-center justify-center shadow-md shadow-sky-500/10"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};