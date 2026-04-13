'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { User, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/lib/api';

export interface ProfileUser {
  _id?: string;
  name?: string;
  email?: string;
  telefone?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PerfilModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PerfilModal({ open, onOpenChange, onSuccess }: PerfilModalProps) {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [name, setName] = useState('');
  const [telefone, setTelefone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setProfileMessage(null);
    setPasswordMessage(null);
    setCurrentPassword('');
    setNewPassword('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setProfile(data.user);
          setName(data.user.name ?? '');
          setTelefone(data.user.telefone ?? '');
        } else {
          setProfile(null);
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [open]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setProfileMessage({ type: 'error', text: 'Sessão expirada. Faça login novamente.' });
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() || undefined, telefone: telefone.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || 'Erro ao actualizar');
      if (data.user) {
        setProfile(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      setProfileMessage({ type: 'success', text: 'Dados actualizados com sucesso.' });
      onSuccess?.();
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao actualizar perfil.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setPasswordMessage({ type: 'error', text: 'Sessão expirada. Faça login novamente.' });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(`${BASE_URL}/profile/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || 'Erro ao alterar senha');
      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao alterar senha.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-md max-h-[90vh] overflow-y-auto')} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#ED5379]" />
            Perfil do usuário
          </DialogTitle>
        </DialogHeader>

        {loadingProfile ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">A carregar perfil...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dados do perfil */}
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Dados pessoais</h4>
              {profileMessage && (
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    profileMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                  )}
                >
                  {profileMessage.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="9xxxxxxxx"
                  className="w-full"
                />
              </div>
              {profile?.role && (
                <p className="text-xs text-gray-500">Função: {profile.role}</p>
              )}
              <Button type="submit" disabled={savingProfile} size="sm" className="bg-[#ED5379] hover:bg-[#ED5379]/90">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar dados'}
              </Button>
            </form>

            {/* Alterar senha */}
            <form onSubmit={handleChangePassword} className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#ED5379]" />
                Alterar senha
              </h4>
              {passwordMessage && (
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    passwordMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                  )}
                >
                  {passwordMessage.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Senha actual</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite a senha actual"
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nova senha</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" disabled={savingPassword} size="sm" variant="outline">
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Alterar senha'}
              </Button>
            </form>
          </div>
        )}

        <DialogFooter className="border-t pt-4 mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
