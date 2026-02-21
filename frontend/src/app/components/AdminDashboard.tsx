import { useState } from 'react';
import { Users, Activity, Play, Eye, SkipForward, RotateCcw, Settings, Lock, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface AdminDashboardProps {
  playerCount: number;
  currentRound: number;
  totalRounds: number;
  gamePhase: 'lobby' | 'round_input' | 'round_resolution' | 'final_standings';
  onAdminAction: (action: string, password: string) => void;
  isConnected: boolean;
}

// Human-readable phase labels.
const PHASE_LABELS: Record<string, string> = {
  lobby: 'Waiting in Lobby',
  round_input: 'Round Active — Collecting Choices',
  round_resolution: 'Round Resolved — Viewing Results',
  final_standings: 'Game Over — Final Standings',
};

const PHASE_COLORS: Record<string, string> = {
  lobby: 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]',
  round_input: 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]',
  round_resolution: 'border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]',
  final_standings: 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]',
};

export function AdminDashboard({
  playerCount,
  currentRound,
  totalRounds,
  gamePhase,
  onAdminAction,
  isConnected,
}: AdminDashboardProps) {
  const [password, setPassword] = useState('');
  const [lastAction, setLastAction] = useState('');

  const fire = (action: string) => {
    onAdminAction(action, password);
    setLastAction(action);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Settings className="w-7 h-7 text-[#06B6D4]" />
              Host Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Control the game flow and monitor players</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-sm border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]">
            Round {currentRound} / {totalRounds}
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Players Card */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#06B6D4]" />
              </div>
              <Badge variant="outline" className="text-xs">Connected</Badge>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-bold font-mono text-[#06B6D4]">{playerCount}</div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </div>
          </Card>

          {/* Phase Card */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#10B981]" />
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${PHASE_COLORS[gamePhase] || ''}`}
              >
                {PHASE_LABELS[gamePhase] || gamePhase}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold">{PHASE_LABELS[gamePhase]}</div>
              <div className="text-sm text-muted-foreground">Current Phase</div>
            </div>
          </Card>

          {/* Connection Card */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-border">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? 'bg-[#10B981]/20' : 'bg-[#EF4444]/20'}`}>
                {isConnected
                  ? <Wifi className="w-6 h-6 text-[#10B981]" />
                  : <WifiOff className="w-6 h-6 text-[#EF4444]" />
                }
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${isConnected ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]' : 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]'}`}
              >
                {isConnected ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className={`text-xl font-bold ${isConnected ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {isConnected ? 'Server Connected' : 'Disconnected'}
              </div>
              <div className="text-sm text-muted-foreground">Backend Status</div>
            </div>
          </Card>
        </div>

        {/* Admin Password */}
        <Card className="p-6 border-2 border-border mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="font-semibold">Admin Password</h3>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password…"
            className="h-12 text-base bg-background border-border focus-visible:ring-[#06B6D4] focus-visible:border-[#06B6D4] font-mono"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Required for all game control actions. Must match the server's ADMIN_PASSWORD env variable.
          </p>
        </Card>

        {/* Control Panel */}
        <Card className="p-8 border-2 border-border">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Game Controls</h2>
            <p className="text-sm text-muted-foreground">
              Manage the game state and advance through rounds
            </p>
          </div>

          {/* State Display */}
          <div className="bg-background rounded-lg p-4 mb-6 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current State:</span>
              <Badge
                variant="outline"
                className={`text-sm px-4 py-1 ${PHASE_COLORS[gamePhase] || ''}`}
              >
                {PHASE_LABELS[gamePhase] || gamePhase}
              </Badge>
            </div>
          </div>

          {/* Action Buttons — 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* START ROUND */}
            <Button
              onClick={() => fire('start_round')}
              disabled={!password || (gamePhase !== 'lobby' && gamePhase !== 'round_resolution')}
              className="h-24 text-lg font-bold bg-[#10B981] hover:bg-[#059669] text-background disabled:opacity-50 disabled:cursor-not-allowed flex-col gap-2"
            >
              <Play className="w-8 h-8" />
              {gamePhase === 'lobby' ? `START ROUND ${currentRound}` : `START ROUND ${currentRound + 1}`}
            </Button>

            {/* RESOLVE ROUND */}
            <Button
              onClick={() => fire('resolve_round')}
              disabled={!password || gamePhase !== 'round_input'}
              variant="outline"
              className="h-24 text-lg font-bold border-2 border-[#06B6D4] bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#06B6D4] disabled:opacity-50 disabled:cursor-not-allowed flex-col gap-2"
            >
              <Eye className="w-8 h-8" />
              RESOLVE ROUND
            </Button>

            {/* NEXT ROUND */}
            <Button
              onClick={() => fire('next_round')}
              disabled={!password || gamePhase !== 'round_resolution'}
              variant="outline"
              className="h-24 text-lg font-bold border-2 border-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] disabled:opacity-50 disabled:cursor-not-allowed flex-col gap-2"
            >
              <SkipForward className="w-8 h-8" />
              {currentRound >= totalRounds ? 'SHOW FINAL STANDINGS' : 'NEXT ROUND'}
            </Button>

            {/* RESET GAME */}
            <Button
              onClick={() => fire('reset_game')}
              disabled={!password}
              variant="outline"
              className="h-24 text-lg font-bold border-2 border-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] disabled:opacity-50 disabled:cursor-not-allowed flex-col gap-2"
            >
              <RotateCcw className="w-8 h-8" />
              RESET GAME
            </Button>
          </div>

          {/* Last action feedback */}
          {lastAction && (
            <div className="mt-4 text-sm text-muted-foreground text-center font-mono">
              Last action: <span className="text-[#06B6D4]">{lastAction}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}