import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Shield, 
  Mail, 
  Trash2, 
  Edit3, 
  Plus, 
  UserPlus,
  CheckCircle,
  XCircle,
  MoreVertical,
  Activity
} from 'lucide-react';
import { Button } from '../shared/Button';
import { Avatar } from '../shared/Avatar';
import { Badge } from '../shared/Badge';

export function UserManagement() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const users = state.users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Gestión de Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Controla quién tiene acceso y qué puede ver en Telocalizo Chats.</p>
        </div>
        <Button>
          <UserPlus size={18} /> Invitar usuario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand rounded-2xl p-6 text-white shadow-lg shadow-brand/20">
           <div className="flex justify-between items-start mb-4">
              <Users size={24} className="opacity-80" />
              <Badge variant="info" className="bg-white/20 text-white border-white/30">{state.users.length} Total</Badge>
           </div>
           <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1 text-blue-100">Usuarios Activos</p>
           <h3 className="text-3xl font-black tracking-tighter italic">{state.users.filter(u => u.status !== 'Desconectado').length}</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <Shield size={24} className="text-blue-600 opacity-80" />
              <Badge variant="info">Admin</Badge>
           </div>
           <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1 text-slate-400">Superadmins/Admins</p>
           <h3 className="text-3xl font-black tracking-tighter italic dark:text-white">
             {state.users.filter(u => u.role === 'Superadmin' || u.role === 'Administrador').length}
           </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <Activity size={24} className="text-green-500 opacity-80" />
           </div>
           <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1 text-slate-400">Conversaciones totales</p>
           <h3 className="text-3xl font-black tracking-tighter italic dark:text-white">
             {state.users.reduce((acc, u) => acc + u.activeConversations, 0)}
           </h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
           <div className="relative max-w-sm w-full">
              <Users size={16} className="absolute inset-y-0 left-3 flex items-center h-full text-slate-400" />
              <input 
                type="text" 
                placeholder="Filtrar usuarios..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border-transparent rounded-xl focus:ring-2 focus:ring-blue-600/20 outline-none dark:text-white font-medium" 
              />
           </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Rol</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Chats</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Último Acceso</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] font-medium text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.role === 'Superadmin' ? 'danger' : user.role === 'Administrador' ? 'warning' : 'info'} size="sm">
                       {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.status === 'En línea' ? 'bg-green-500' : user.status === 'Ocupado' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{user.status}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 italic">{user.activeConversations}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{new Date(user.lastAccess).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={16} /></button>
                       <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                       <button className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
