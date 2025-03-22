import React, { useState } from 'react';
import { UserCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nickname: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{ 
          nickname,
          high_score: 0
        }])
        .select()
        .single();

      if (error) throw error;

      onSuccess(nickname);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="glass-effect p-8 rounded-xl max-w-md w-full border border-white/20 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <UserCircle2 className="w-16 h-16 text-emerald-600 mb-4" />
          <h2 className="text-2xl font-bold text-emerald-900">Enter Your Nickname</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              className="w-full px-4 py-3 bg-white/80 border border-emerald-100 rounded-lg focus:outline-none focus:border-emerald-500 text-emerald-900 placeholder-emerald-400"
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-red-600 hover:from-emerald-500 hover:to-red-500 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};