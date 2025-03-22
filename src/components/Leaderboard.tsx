import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Player {
  nickname: string;
  high_score: number;
}

export const Leaderboard: React.FC = () => {
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('nickname, high_score')
          .order('high_score', { ascending: false })
          .limit(25);

        if (error) throw error;
        
        // Animate changes by comparing with previous state
        setTopPlayers(prevPlayers => {
          const hasChanges = JSON.stringify(data) !== JSON.stringify(prevPlayers);
          if (hasChanges) {
            return data || [];
          }
          return prevPlayers;
        });
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchTopPlayers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'players' 
        }, 
        () => {
          fetchTopPlayers();
        }
      )
      .subscribe();

    // Periodic polling as backup
    const pollInterval = setInterval(fetchTopPlayers, 5000);

    return () => {
      channel.unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-semibold text-emerald-900">Top Players</h3>
        </div>
        <div className="text-center text-emerald-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-lg max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-emerald-600" />
        <h3 className="text-xl font-semibold text-emerald-900">Top Players</h3>
      </div>
      
      <div className="space-y-3">
        {topPlayers.map((player, index) => (
          <div
            key={`${player.nickname}-${player.high_score}`}
            className="flex items-center gap-4 p-3 bg-emerald-50 rounded-lg transition-all duration-300 hover:transform hover:translate-x-1"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-full font-bold shadow-md">
              {index + 1}
            </div>
            <div>
              <div className="text-emerald-900 font-medium">{player.nickname}</div>
              <div className="text-red-600 font-semibold">{player.high_score}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};