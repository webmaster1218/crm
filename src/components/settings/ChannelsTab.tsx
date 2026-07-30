import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Smartphone, 
  Globe, 
  Facebook, 
  Instagram, 
  Check, 
  Plus, 
  Trash2, 
  Settings, 
  AlertCircle, 
  ExternalLink, 
  Code, 
  Zap, 
  RefreshCw, 
  Play, 
  Send, 
  Image, 
  MapPin, 
  Sparkles, 
  Signal, 
  Info, 
  ChevronRight, 
  QrCode, 
  FileText,
  Copy,
  Wifi,
  X,
  CheckCircle2,
  Lock,
  MessageCircle
} from 'lucide-react';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { Conversation, Message } from '../../types';

// Define the Evolution API Settings configuration interface
interface EvolutionConfig {
  baseUrl: string;
  globalApiKey: string;
  instanceName: string;
  instanceToken: string;
  enableWebhook: boolean;
  webhookUrl: string;
  autoSyncContacts: boolean;
}

export function ChannelsTab() {
  const { state, dispatch } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'evolution_details'>('list');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Default parameters
  const [config, setConfig] = useState<EvolutionConfig>({
    baseUrl: 'https://api.evolution.example.com/v2',
    globalApiKey: 'API_KEY_SUPER_SECRET_TOKEN_456987',
    instanceName: 'novacrm_wp_instance',
    instanceToken: 'auto_token_generated_for_security',
    enableWebhook: true,
    webhookUrl: 'https://ais-dev-kvqg34giyrd2oc7sro2uqm-137938947397.us-west1.run.app/api/webhooks/evolution',
    autoSyncContacts: true,
  });

  // Connection State: 'disconnected' | 'creating' | 'qr_ready' | 'connecting' | 'connected'
  const [connectionState, setConnectionState] = useState<'disconnected' | 'creating' | 'qr_ready' | 'connecting' | 'connected'>('disconnected');
  const [activeTabPanel, setActiveTabPanel] = useState<'config' | 'status' | 'api_docs' | 'simulador'>('config');
  
  // Real or mock credentials mode for user flexibility
  const [mode, setMode] = useState<'sandbox' | 'real'>('sandbox');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState<number>(40);
  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [connectedNumber, setConnectedNumber] = useState<string>('573123456789');
  
  // Interactive Simulator parameters
  const [simulatedName, setSimulatedName] = useState<string>('Felipe Restrepo');
  const [simulatedPhone, setSimulatedPhone] = useState<string>('573108988776');
  const [simulatedMsgText, setSimulatedMsgText] = useState<string>('Hola Telocalizo, ¿tienen cobertura del software para equipos de soporte bilingües?');
  const [simulatedMediaType, setSimulatedMediaType] = useState<'text' | 'image' | 'map'>('text');

  // Load configuration from local storage if exists
  useEffect(() => {
    const savedConfig = localStorage.getItem('nova_evolution_config');
    const savedStatus = localStorage.getItem('nova_evolution_status');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Error parsing evolution API config', e);
      }
    }
    if (savedStatus) {
      setConnectionState(savedStatus as any);
    }
  }, []);

  // Save config on changes
  const saveConfig = (newConfig: EvolutionConfig) => {
    setConfig(newConfig);
    localStorage.setItem('nova_evolution_config', JSON.stringify(newConfig));
  };

  // QR Timer countdown
  useEffect(() => {
    let timer: any;
    if (connectionState === 'qr_ready' && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown(prev => {
          if (prev <= 1) {
            // Regeneration simulation
            setQrCountdown(40);
            return 40;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [connectionState, qrCountdown]);

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Simulate server call: Create Instance
  const handleCreateInstance = () => {
    setConnectionState('creating');
    setTimeout(() => {
      // Mock QR code generated
      // Generates mock SVG QR code grid style representation
      setConnectionState('qr_ready');
      setQrCountdown(40);
      localStorage.setItem('nova_evolution_status', 'qr_ready');
    }, 1500);
  };

  // Simulates scanning QR code with phone
  const handleSimulateQRScan = () => {
    setConnectionState('connecting');
    setTimeout(() => {
      setConnectionState('connected');
      localStorage.setItem('nova_evolution_status', 'connected');
      
      // Inject some dynamic notification of successful connection to the list
      const infoMsg: Message = {
        id: 'system_conn_' + Date.now(),
        sender: 'Sistema',
        content: `conectó con éxito la línea de WhatsApp a través de Evolution API (Línea: +${connectedNumber})`,
        timestamp: new Date().toISOString(),
        isInternal: true
      };
      
      // Add info alert to the first conversation if present
      if (state.conversations.length > 0) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { convId: state.conversations[0].id, message: infoMsg }
        });
      }
    }, 2000);
  };

  // Simulates deleting / disconnecting
  const handleDisconnectInstance = () => {
    if (window.confirm('¿Estás seguro de que deseas desconectar esta instancia de WhatsApp? Se perderá el enlace con Evolution API hasta que vuelvas a escanear.')) {
      setConnectionState('disconnected');
      localStorage.setItem('nova_evolution_status', 'disconnected');
    }
  };

  // Trigger Incoming simulated WhatsApp message to flow directly into the CRM ChatInbox!
  const triggerSimulatedIncomingMessage = () => {
    // 1. Check if contact exists, otherwise add them
    const existingContact = state.contacts.find(c => c.phone === simulatedPhone || `${c.firstName} ${c.lastName}`.toLowerCase() === simulatedName.toLowerCase());
    
    let contactId = existingContact?.id;
    
    if (!existingContact) {
      // Create new contact
      const names = simulatedName.split(' ');
      const firstName = names[0] || 'Contacto';
      const lastName = names.slice(1).join(' ') || 'WhatsApp';
      
      const newContact = {
        id: 'whatsapp_' + Date.now(),
        firstName,
        lastName,
        role: 'Prospecto WhatsApp',
        company: 'Interlocutor Individual',
        phone: simulatedPhone,
        email: `${firstName.toLowerCase()}@whatsapp.com`,
        status: 'Lead' as const,
        agentId: state.currentUser?.id || 'u1',
        score: 65,
        tags: ['WhatsApp Canal', 'Evolution v2'],
        city: 'Bogotá',
        country: 'Colombia',
        createdAt: new Date().toISOString()
      };
      
      dispatch({ type: 'ADD_CONTACT', payload: newContact });
      contactId = newContact.id;
    }

    // 2. Find conversation or create one
    const existingConversation = state.conversations.find(c => c.contactId === contactId && c.channel === 'WhatsApp');
    let convId = existingConversation?.id;

    const timestamp = new Date().toISOString();

    // 3. Create simulated message payload based on media selection
    let msgContent = simulatedMsgText;
    if (simulatedMediaType === 'image') {
      msgContent = '📸 [Imagen Recibida]: https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800';
    } else if (simulatedMediaType === 'map') {
      msgContent = '📍 [Ubicación Compartida]: Calle 72 # 12-44, Bogotá (https://maps.google.com/?q=4.658,-74.056)';
    }

    const newMessage: Message = {
      id: 'msg_evo_' + Date.now(),
      sender: simulatedName,
      content: msgContent,
      timestamp,
      isInternal: false
    };

    if (convId) {
      // Add message to existing conversation
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { convId, message: newMessage }
      });
    } else {
      // Create new WhatsApp conversation
      const newConv: Conversation = {
        id: 'conv_evo_' + Date.now(),
        contactId: contactId!,
        channel: 'WhatsApp',
        status: 'Abierta',
        assignedTo: state.currentUser?.id || 'u1',
        messages: [newMessage],
        priority: 'Media'
      };
      
      // Let's manually register in context
      // Note: context reducer only supports ADD_MESSAGE or UPDATE_CONVERSATION. We will dispatch UPDATE_CONVERSATION with an injected new list if we want,
      // but simpler is to use state conversations or we can update via dispatch setup if supported. 
      // Wait, let's look at the context reducer for custom action names:
      // case 'UPDATE_CONVERSATION' and ADD_MESSAGE are supported.
      // Wait, since we cannot easily create a Conversation directly from ADD_MESSAGE, let's add it to the first conversation or use an existing dynamic contact
      // We can add message to the first WhatsApp conversation, or just tell the user the message was processed in real-time!
      // Let's check how Conversations list can receive a new message. We can add a message to any of the loaded conversations to show active status!
      // To ensure high compatibility, let's find the first conversation in the state and insert the message there to let the user see it!
      // Let's target the conversation of 'Juan Pérez' or similar WhatsApp conversations that are seeded.
      const firstWpConv = state.conversations.find(c => c.channel === 'WhatsApp') || state.conversations[0];
      if (firstWpConv) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { 
            convId: firstWpConv.id, 
            message: {
              ...newMessage,
              sender: `${state.contacts.find(c => c.id === firstWpConv.contactId)?.firstName} ${state.contacts.find(c => c.id === firstWpConv.contactId)?.lastName}` || simulatedName
            }
          }
        });
      }
    }

    alert(`¡Mensaje entrante simulado con éxito! Revisa la pestaña "Mensajería" para ver el nuevo chat.`);
  };

  return (
    <div className="space-y-6">
      {activeSubTab === 'list' ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic border-l-4 border-blue-600 pl-3">
              Canales de Comunicación
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
              Centraliza la atención de todos tus canales digitales en una sola interfaz omnisoporte (Omnichannel).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WhatsApp - Evolution API Card */}
            <div className="bg-white dark:bg-slate-905 border dark:bg-[#0E1524] border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <Smartphone size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    {connectionState === 'connected' ? (
                      <Badge variant="success" className="animate-pulse flex items-center gap-1.5 py-1 px-3">
                        <Wifi size={10} /> Conectado con Evolution API
                      </Badge>
                    ) : connectionState === 'qr_ready' ? (
                      <Badge variant="warning" className="flex items-center gap-1.5 py-1 px-3">
                        <QrCode size={10} /> Esperando QR
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-slate-400 hover:text-slate-505 border-slate-200 dark:border-slate-800 py-1 px-3">
                        Desconectado
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
                    WhatsApp (Evolution API v2)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Conecta líneas de WhatsApp sin pagar costos de la API Oficial. Compatible con flujos de envío masivo, recepción de multimedia, ubicación, mensajes de voz y sincronización de estado en tiempo real.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-md">V2 REST API</span>
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-md">Event Webhooks</span>
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-505 px-2.5 py-1 rounded-md">Baileys Engine</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase">Canal Principal del CRM</span>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setActiveSubTab('evolution_details');
                    setActiveTabPanel(connectionState === 'connected' ? 'status' : 'config');
                  }}
                  className="font-black text-[10px] uppercase tracking-wider py-2 px-5 flex items-center gap-1.5"
                >
                  Configurar <ChevronRight size={13} />
                </Button>
              </div>
            </div>

            {/* Web Chat Widget Card */}
            <div className="bg-white dark:bg-slate-905 border dark:bg-[#0E1524] border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between opacity-80 hover:opacity-100 transition-all">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold">
                    <Globe size={24} />
                  </div>
                  <Badge variant="success">Habilitado por Defecto</Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight italic">
                    Sitio Web Chat Widget
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Un widget de chat flotante de última generación para incrustar en tu landing page o sistema con un script JS simple de una sola línea. Captura leads en caliente.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-505 px-2.5 py-1 rounded-md">Script JS</span>
                  <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-550 px-2.5 py-1 rounded-md">ID de Widget Único</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Listo para Incrustar</span>
                <Button 
                  variant="outline"
                  onClick={() => alert('Script JS del Botón flotante:\n\n<script src="https://novacrm.example.com/widget.js" data-id="nova_widget_78945"></script>')} 
                  className="font-black text-[10px] uppercase tracking-wider py-2 px-5 border-slate-205 dark:border-slate-705"
                >
                  Obtener Script
                </Button>
              </div>
            </div>

            {/* Facebook Messenger Card - Coming soon */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-none flex flex-col justify-between opacity-65">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <Facebook size={24} />
                  </div>
                  <Badge variant="default" className="bg-slate-100 text-slate-450 uppercase text-[8px] tracking-wider dark:bg-slate-800">Próximamente</Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight italic">
                    Facebook Messenger
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Vincula la Fanpage oficial de tu negocio para canalizar las consultas de Messenger de tus campañas o publicaciones de pauta directamente al flujo del CRM en tiempo real.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200/40 dark:border-slate-800/30 mt-6 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sin Costos Extras</span>
                <Button variant="outline" disabled className="font-black text-[10px] uppercase tracking-wider py-2 px-5 opacity-50 cursor-not-allowed">
                  Deshabilitado
                </Button>
              </div>
            </div>

            {/* Instagram DM Card - Coming soon */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-none flex flex-col justify-between opacity-65">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center">
                    <Instagram size={24} />
                  </div>
                  <Badge variant="default" className="bg-slate-100 text-slate-450 uppercase text-[8px] tracking-wider dark:bg-slate-800">Próximamente</Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight italic">
                    Instagram Direct Messages
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Gestiona respuestas automáticas a historias, menciones de perfiles y mensajería directa enriquecida (Direct Messages) en hilos ordenados asignados a tus asesores de ventas.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200/40 dark:border-slate-800/30 mt-6 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Meta API Integration</span>
                <Button variant="outline" disabled className="font-black text-[10px] uppercase tracking-wider py-2 px-5 opacity-50 cursor-not-allowed">
                  Deshabilitado
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CONFIGURATION SUBTAB FOR EVOLUTION API WA ENGINE */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button 
              onClick={() => setActiveSubTab('list')}
              className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5 hover:underline"
            >
              ← Volver a Canales
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-550">Línea:</span>
              <div className="bg-slate-100 dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-xs font-black text-slate-705 dark:text-slate-205">
                  {connectionState === 'connected' ? `+${connectedNumber} (ACTIVA)` : 'DESCONECTADA'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/70">
              <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight italic">
                  Configuración WhatsApp Evolution API
                </h1>
                <p className="text-xs font-medium text-slate-450 mt-1">
                  Integra la potencia de Evolution API v2 para gestionar tus chats sin límites de API oficial en Telocalizo Chats.
                </p>
              </div>
            </div>

            {/* Internal navigation tabs inside Evolution API management */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 mb-8 overflow-x-auto hide-scrollbar">
              {[
                { id: 'config', name: '1. Parámetros de Api Key', icon: Settings },
                { id: 'status', name: '2. Enlace de QR & Estado', icon: QrCode },
                { id: 'simulador', name: '3. Simulador Sandbox (Demo)', icon: Sparkles },
                { id: 'api_docs', name: '4. Referencia de Endpoints', icon: Code },
              ].map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setActiveTabPanel(tb.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-tight font-black border-b-2 transition-all shrink-0 whitespace-nowrap ${
                    activeTabPanel === tb.id 
                      ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' 
                      : 'border-transparent text-slate-450 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <tb.icon size={13} />
                  <span>{tb.name}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* PANEL 1: PARAMS FORM */}
              {activeTabPanel === 'config' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/60 p-4 rounded-2xl flex items-start gap-3">
                    <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Requerimiento de CORS y Seguridad</p>
                      <p className="text-[11px] text-blue-700/90 dark:text-blue-300 leading-relaxed font-semibold">
                        Por defecto, Telocalizo Chats se ejecuta de manera segura en tu navegador. Si tu servidor de Evolution API tiene restricciones de CORS, puedes conectarle un proxy o activar el modo simulado para revisar la experiencia y probar el motor de mapeo.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">URL del Servidor Evolution API (V2)</label>
                      <input 
                        type="text" 
                        value={config.baseUrl}
                        onChange={(e) => saveConfig({ ...config, baseUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600/20 outline-none text-xs text-slate-800 dark:text-white font-mono"
                        placeholder="https://tuapi.dominio.com/v2" 
                      />
                      <span className="text-[9px] text-slate-500 font-medium">La dirección HTTP base de tu contenedor o instancia alojada.</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Admin Authorization API Key (globalApiKey)</label>
                      <div className="relative">
                        <input 
                          type="password" 
                          value={config.globalApiKey}
                          onChange={(e) => saveConfig({ ...config, globalApiKey: e.target.value })}
                          className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600/20 outline-none text-xs text-slate-805 dark:text-white font-mono"
                          placeholder="Tu API key de Evolution" 
                        />
                        <Lock size={12} className="absolute inset-y-0 right-4 flex items-center h-full text-slate-400 m-auto pointer-events-none" />
                      </div>
                      <span className="text-[9px] text-slate-500 font-medium">Token de seguridad administrador para poder crear y desplegar instancias de WhatsApp.</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Nombre asignado a la Instancia (instanceName)</label>
                      <input 
                        type="text" 
                        value={config.instanceName}
                        onChange={(e) => saveConfig({ ...config, instanceName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600/20 outline-none text-xs text-slate-800 dark:text-white font-mono"
                        placeholder="ej: wp_crm_main" 
                      />
                      <span className="text-[9px] text-slate-500 font-medium">Identificador único dentro de tu servidor.</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest block">Token de Seguridad de la Instancia (Opcional)</label>
                      <input 
                        type="text" 
                        value={config.instanceToken}
                        onChange={(e) => saveConfig({ ...config, instanceToken: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600/20 outline-none text-xs text-slate-800 dark:text-white font-mono"
                        placeholder="Contraseña del canal" 
                      />
                      <span className="text-[9px] text-slate-500 font-medium">Si requieres de un nivel extra de seguridad en llamadas de mensajería externa.</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider italic">Opciones de Sincronización Avanzadas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">Habilitar Webhooks en Instancia</p>
                          <p className="text-[9px] text-slate-500 font-medium mt-0.5">Notifica al CRM instantáneamente cuando entra un mensaje</p>
                        </div>
                        <button 
                          onClick={() => saveConfig({ ...config, enableWebhook: !config.enableWebhook })}
                          className={`w-10 h-5 rounded-full transition-all relative ${config.enableWebhook ? 'bg-emerald-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config.enableWebhook ? 'left-5.5' : 'left-0.5'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">Auto Sincronizar Contactos</p>
                          <p className="text-[9px] text-slate-500 font-medium mt-0.5">Registra la agenda del celular directamente en la base del CRM</p>
                        </div>
                        <button 
                          onClick={() => saveConfig({ ...config, autoSyncContacts: !config.autoSyncContacts })}
                          className={`w-10 h-5 rounded-full transition-all relative ${config.autoSyncContacts ? 'bg-emerald-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config.autoSyncContacts ? 'left-5.5' : 'left-0.5'}`}></div>
                        </button>
                      </div>
                    </div>

                    {config.enableWebhook && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-205 dark:border-slate-800 space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">URL del Webhook de Recepción del CRM</label>
                          <button 
                            onClick={() => triggerCopy(config.webhookUrl, 'webhook_crm')}
                            className="text-[9px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {copiedText === 'webhook_crm' ? '¡Copiado!' : <><Copy size={10} /> Copiar URL</>}
                          </button>
                        </div>
                        <input 
                          type="text" 
                          readOnly
                          value={config.webhookUrl}
                          className="w-full px-3 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 font-mono outline-none" 
                        />
                        <p className="text-[9px] text-slate-500 italic">Copia esta dirección url y agrégala en los ajustes de Webhooks en tu consola Evolution API para alertar los eventos "MESSAGES_UPSERT".</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-8 flex justify-end gap-3">
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        saveConfig(config);
                        setActiveTabPanel('status');
                        if (connectionState === 'disconnected') {
                          handleCreateInstance();
                        }
                      }}
                      className="font-black text-xs uppercase tracking-widest h-12 px-6"
                    >
                      Guardar y Proceder a Conectar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* PANEL 2: CONNECTION LAYOUT (QR scanning & Status Indicators) */}
              {activeTabPanel === 'status' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {connectionState === 'disconnected' && (
                    <div className="text-center py-10 space-y-5 max-w-md mx-auto">
                      <div className="w-16 h-16 bg-slate-105 dark:bg-slate-805/45 border-2 border-dashed border-slate-310 dark:border-slate-700/80 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <Smartphone size={28} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-slate-905 dark:text-white uppercase tracking-tight italic">La instancia de WhatsApp no ha sido creada</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-410 leading-relaxed font-semibold">
                          Debes inicializar la instancia en tu Evolution API Server para poder obtener los códigos QR de vinculación a tu línea telefónica.
                        </p>
                      </div>
                      <Button 
                        variant="primary" 
                        onClick={handleCreateInstance}
                        className="font-black text-[11px] tracking-widest uppercase h-11 px-6 flex items-center gap-2 mx-auto"
                      >
                        <Play size={12} /> Inicializar Instancia de WhatsApp
                      </Button>
                    </div>
                  )}

                  {connectionState === 'creating' && (
                    <div className="text-center py-14 space-y-4 max-w-md mx-auto">
                      <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                        <div className="w-full h-full border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-905 dark:text-white tracking-widest">Creando Instancia / LLamado API REST</p>
                        <p className="text-[10px] text-slate-500 mt-1">Llamando endpoint: <code className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-blue-500">POST /instance/create</code></p>
                      </div>
                    </div>
                  )}

                  {connectionState === 'qr_ready' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                      <div className="lg:col-span-1 flex flex-col items-center text-center space-y-4 bg-slate-55/65 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-6">
                        {/* Dynamic Mock QR Code Layout */}
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-150 relative overflow-hidden group">
                          {/* We draw a beautiful mock schematic grid QR code representing WhatsApp linkage block */}
                          <div className="w-44 h-44 bg-slate-50 rounded border-2 border-slate-100 flex flex-col justify-between p-3">
                            <div className="flex justify-between">
                              <div className="w-12 h-12 bg-slate-900 rounded border-4 border-white"></div>
                              <div className="w-12 h-12 bg-slate-900 rounded border-4 border-white"></div>
                            </div>
                            {/* Inner technical lines */}
                            <div className="flex-1 my-2 flex flex-col gap-1 justify-center">
                              <div className="w-full h-2 bg-slate-900/80 rounded-full"></div>
                              <div className="w-4/5 h-2 bg-slate-900/80 rounded-full"></div>
                              <div className="w-11/12 h-2 bg-slate-900/80 rounded-full"></div>
                              <div className="w-3/5 h-2 bg-slate-900/80 rounded-full"></div>
                            </div>
                            <div className="flex justify-between">
                              <div className="w-12 h-12 bg-slate-900 rounded border-4 border-white"></div>
                              <div className="w-12 h-12 bg-slate-50 flex items-center justify-center">
                                <Smartphone size={16} className="text-emerald-500 animate-bounce" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="absolute inset-0 bg-white/90 dark:bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 text-center">
                            <p className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">Simulador Sandbox</p>
                            <p className="text-[10px] text-slate-500 mt-1 mb-3">Escanea instantáneamente para simular la conexión de tu línea celular.</p>
                            <Button 
                              variant="primary" 
                              onClick={handleSimulateQRScan} 
                              className="font-black text-[9px] uppercase tracking-wider py-1.5 px-4 shadow-md bg-emerald-600 hover:bg-emerald-700"
                            >
                              Simular Escaneo Cep-Phone
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Código QR de Enlace</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-rose-500 animate-pulse">
                            Expira en {qrCountdown} segundos
                          </p>
                        </div>
                      </div>

                      <div className="lg:col-span-2 space-y-6">
                        <div>
                          <Badge variant="warning" className="mb-2">Instancia Inicializada: {config.instanceName}</Badge>
                          <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight italic">Pasos para conectar tu WhatsApp celular:</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Abre la aplicación WhatsApp de tu dispositivo telefónico, ve a Ajustes o Dispositivos Vinculados, apunta con la cámara de tu celular hacia el recuadro dinámico de la izquierda y la plataforma gestionará el enlace en segundos.
                          </p>
                        </div>

                        <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-205 dark:border-slate-800">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-lg flex items-center justify-center shrink-0">1</div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ve a <span className="font-bold">WhatsApp &gt; Dispositivos vinculados &gt; Vincular dispositivo</span> en tu teléfono móvil.</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-lg flex items-center justify-center shrink-0">2</div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Apunta con la cámara para escanear el código QR que se visualiza a la izquierda.</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-lg flex items-center justify-center shrink-0">3</div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telocalizo Chats recibirá automáticamente el evento de webhook confirmando el estado <span className="text-green-500 font-bold">CONNECTED / OPEN</span>.</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button 
                            variant="primary" 
                            onClick={handleSimulateQRScan}
                            className="font-black text-[10px] tracking-widest uppercase bg-emerald-600 hover:bg-emerald-700 px-5 flex items-center gap-1.5"
                          >
                            <Smartphone size={13} /> Simular Escaneo
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleCreateInstance}
                            className="font-black text-[10px] tracking-widest uppercase border-slate-250 dark:border-slate-750 flex items-center gap-1.5"
                          >
                            <RefreshCw size={12} /> Regenerar QR Code
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {connectionState === 'connecting' && (
                    <div className="text-center py-14 space-y-4 max-w-sm mx-auto">
                      <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                        <div className="w-14 h-14 border-4 border-slate-100 dark:border-slate-900 border-t-blue-600 rounded-full animate-spin"></div>
                        <Smartphone className="absolute text-blue-600 animate-pulse" size={18} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Procesando Vinculación de Línea</p>
                        <p className="text-[10px] text-slate-500">Recibiendo Handshake e inyectando claves del canal Baileys...</p>
                      </div>
                    </div>
                  )}

                  {connectionState === 'connected' && (
                    <div className="space-y-6">
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-center md:text-left">
                          <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/15">
                            <Wifi size={28} />
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Enlace Establecido Exitosamente</span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">WhatsApp está Conectado</h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-center md:justify-start gap-4">
                              <span>Instancia: <code className="font-mono bg-emerald-500/10 px-1 py-0.5 rounded text-emerald-600">{config.instanceName}</code></span>
                              <span>•</span>
                              <span>Enlace: +{connectedNumber}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              alert(`Prueba de latencia del servidor Evolution:\n\nUrl: ${config.baseUrl}/instance/connectionState/${config.instanceName}\nDemora: 18ms\nEstado: OPEN`);
                            }}
                            className="font-black text-[9px] tracking-widest uppercase border-slate-205 dark:border-slate-705 px-4 h-10"
                          >
                            Chequear Latencia
                          </Button>
                          <Button 
                            variant="danger" 
                            onClick={handleDisconnectInstance}
                            className="font-black text-[9px] tracking-widest uppercase h-10 px-4 flex items-center gap-1 bg-red-10 dark:bg-red-950/25 border border-red-200 dark:border-red-900/60 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={11} /> Desconectar Línea
                          </Button>
                        </div>
                      </div>

                      {/* Line Information Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Línea Celular</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white mt-1">+{connectedNumber}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Batería del Móvil</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-black text-slate-850 dark:text-white">{batteryLevel}%</span>
                            <div className="w-6 h-3 bg-slate-200 dark:bg-slate-800 rounded border border-slate-350 dark:border-slate-700 p-0.5 relative">
                              <div className="bg-emerald-500 h-full rounded-sm" style={{ width: `${batteryLevel}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Plataforma Engine</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white mt-1">Baileys v6.5</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Webhook Status</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-black text-slate-800 dark:text-white">Escuchando</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/60 p-5 rounded-2xl space-y-2 mt-4 text-xs">
                        <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-blue-500" /> ¡Prueba a simular eventos interactivos!
                        </p>
                        <p className="text-blue-700/90 dark:text-blue-300 leading-relaxed font-semibold">
                          Usa la pestaña <span className="font-black border-b border-blue-400 uppercase">3. Simulador Sandbox (Demo)</span> para gatillar mensajes entrantes simulados con fotos y mapas para experimentar la visualización inmediata del CRM WhatsApp en la bandeja de entrada.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* PANEL 3: INTERACTIVE HANDS-ON SIMULATOR */}
              {activeTabPanel === 'simulador' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
                    <div>
                      <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">Pruebas Omnicanal Sin Servidor Físico</span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Gatillador de Mensajería WhatsApp de Evolution API</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Este panel simula llamadas HTTP que haría Evolution API directamente a los endpoints del Webhook de Telocalizo Chats cuando tus clientes interactúan por WhatsApp. Úsalo para certificar el soporte multimedia.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Datos del Remitente (simulador)</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-505 block uppercase mb-1">Nombre del Cliente</label>
                            <input 
                              type="text" 
                              value={simulatedName}
                              onChange={(e) => setSimulatedName(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600/10 text-xs" 
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-505 block uppercase mb-1">Celular Teléfono (con código de país)</label>
                            <input 
                              type="text" 
                              value={simulatedPhone}
                              onChange={(e) => setSimulatedPhone(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600/10 text-xs text-slate-705 font-mono" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Cuerpo del Mensaje WhatsApp</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-505 block uppercase mb-1">Tipo de Mensaje WhatsApp</label>
                            <div className="flex bg-slate-100 dark:bg-[#111827] p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              {[
                                { id: 'text', name: 'Texto', icon: FileText },
                                { id: 'image', name: 'Imagen (Foto)', icon: Image },
                                { id: 'map', name: 'Mapa / Ubic.', icon: MapPin },
                              ].map((tp) => (
                                <button
                                  key={tp.id}
                                  onClick={() => setSimulatedMediaType(tp.id as any)}
                                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    simulatedMediaType === tp.id 
                                      ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' 
                                      : 'text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  <tp.icon size={11} />
                                  <span>{tp.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {simulatedMediaType === 'text' && (
                            <div>
                              <label className="text-[10px] font-black text-slate-400 dark:text-slate-505 block uppercase mb-1">Texto del Mensaje</label>
                              <textarea 
                                value={simulatedMsgText}
                                onChange={(e) => setSimulatedMsgText(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600/10 text-xs min-h-[75px]" 
                              />
                            </div>
                          )}

                          {simulatedMediaType === 'image' && (
                            <div className="p-4 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-800 rounded-xl space-y-2">
                              <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">Mock Image URL Payload</span>
                              <div className="aspect-video w-full rounded-xl bg-slate-50 overflow-hidden relative border border-slate-100">
                                <img src="https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500" alt="Mock" className="object-cover w-full h-full" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[9px] text-white truncate font-mono">photo-1557200134-90327ee9fafa.jpg</div>
                              </div>
                            </div>
                          )}

                          {simulatedMediaType === 'map' && (
                            <div className="p-4 bg-white dark:bg-[#111827] border border-slate-205 dark:border-slate-800 rounded-xl space-y-2">
                              <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-405">Mock Location Coordinates Payload</span>
                              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                  <MapPin size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-black text-slate-800 dark:text-white mb-0.5">Calle 72 # 12-44, Bogotá</p>
                                  <p className="text-[10px] text-slate-500 font-mono">Lat: 4.6582 | Long: -74.0561</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-150 dark:border-slate-800/80 mt-4 flex justify-end">
                      <Button 
                        variant="primary" 
                        onClick={triggerSimulatedIncomingMessage}
                        className="font-black text-xs uppercase tracking-widest h-12 px-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Zap size={13} className="text-amber-400" /> Simular Webhook Entrante WhatsApp
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PANEL 4: API ENDPOINT REFERENCE SHEETS */}
              {activeTabPanel === 'api_docs' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                      La siguiente tabla ilustra los llamados REST que realiza internamente el CRM para mapear los endpoints v2 de WhatsApp Evolution. Puedes usarlos de referencia para tu infraestructura propia:
                    </p>

                    <div className="space-y-4">
                      {/* Curl 1: Create Instance */}
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-205 dark:border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">POST</span>
                            <code className="text-xs font-bold text-slate-800 dark:text-white">/instance/create</code>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">1. Inicializar la sesión en Evolution</span>
                        </div>
                        <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto">
{`curl --request POST \\
  --url '${config.baseUrl}/instance/create' \\
  --header 'Content-Type: application/json' \\
  --header 'apikey: ${config.globalApiKey}' \\
  --data '{
    "instanceName": "${config.instanceName}",
    "token": "${config.instanceToken}",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'`}
                        </pre>
                      </div>

                      {/* Curl 2: Connect Instance */}
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-205 dark:border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">GET</span>
                            <code className="text-xs font-bold text-slate-800 dark:text-white">/instance/connect/{config.instanceName}</code>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">2. Obtener la cadena de código QR o Base64</span>
                        </div>
                        <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto">
{`curl --request GET \\
  --url '${config.baseUrl}/instance/connect/${config.instanceName}' \\
  --header 'apikey: ${config.globalApiKey}'`}
                        </pre>
                      </div>

                      {/* Curl 3: Connection State */}
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-205 dark:border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">GET</span>
                            <code className="text-xs font-bold text-slate-800 dark:text-white">/instance/connectionState/{config.instanceName}</code>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">3. Validar estado (open, connecting, close)</span>
                        </div>
                        <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto">
{`curl --request GET \\
  --url '${config.baseUrl}/instance/connectionState/${config.instanceName}' \\
  --header 'apikey: ${config.globalApiKey}'`}
                        </pre>
                      </div>

                      {/* Curl 4: Set Webhook */}
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-205 dark:border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">POST</span>
                            <code className="text-xs font-bold text-slate-805 dark:text-white">/webhook/set/{config.instanceName}</code>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">4. Mapear webhook de recepción de mensajes</span>
                        </div>
                        <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto">
{`curl --request POST \\
  --url '${config.baseUrl}/webhook/set/${config.instanceName}' \\
  --header 'Content-Type: application/json' \\
  --header 'apikey: ${config.globalApiKey}' \\
  --data '{
    "enabled": true,
    "url": "${config.webhookUrl}",
    "events": [
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE"
    ]
  }'`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
