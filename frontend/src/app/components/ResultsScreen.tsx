import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';

interface ResultsScreenProps {
  currentRound: number;
  userChoice: number;
  userPrediction: number;
  actualPercentage: number;
  roundScore: number;
  baseScore: number;
  penalty: number;
  distribution: { sword: number; count: number; percentage: number }[];
  leaderboard: { rank: number; username: string; roundScore: number; totalScore: number }[];
  currentUsername: string;
  isFinalStandings: boolean;
}

export function ResultsScreen({
  currentRound,
  userChoice,
  userPrediction,
  actualPercentage,
  roundScore,
  baseScore,
  penalty,
  distribution,
  leaderboard,
  currentUsername,
  isFinalStandings
}: ResultsScreenProps) {
  const predictionError = Math.abs(userPrediction - actualPercentage);
  const isPositiveScore = roundScore >= 0;
  const userRank = leaderboard.find(p => p.username === currentUsername)?.rank || 0;

  // ── Animated score display ────────────────────────────────────────────────
  const animatedRoundScore = useCountUp(roundScore, 1500);
  const animatedBaseScore = useCountUp(baseScore, 1200);
  const animatedPenalty = useCountUp(penalty, 1200);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold">
            {isFinalStandings ? '🏆 Final Standings' : `Round ${currentRound} Results`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isFinalStandings
              ? `Game Complete! Final ranking: #${userRank}`
              : 'Review your performance and standings'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Personal Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2 border-border">
            <div className="flex items-start justify-between mb-6">
              <h3 className="font-semibold">Your Performance</h3>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              >
                <Badge
                  variant="outline"
                  className={`px-3 py-1 text-lg font-mono font-bold ${isPositiveScore
                      ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                      : 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]'
                    }`}
                >
                  {isPositiveScore ? '+' : ''}{animatedRoundScore.toFixed(1)}
                </Badge>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <div className="text-sm text-muted-foreground mb-2">You Chose</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-mono font-bold text-[#EF4444]">{userChoice}</span>
                  <span className="text-muted-foreground text-sm">sword</span>
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <div className="text-sm text-muted-foreground mb-2">Actual Crowd</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-mono font-bold text-[#06B6D4]">{actualPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Score breakdown with count-up */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-background/50 rounded-lg p-3 border border-border text-center"
              >
                <div className="text-xs text-muted-foreground mb-1">Base Score</div>
                <div className="text-xl font-mono font-bold text-foreground">{animatedBaseScore.toFixed(1)}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-background/50 rounded-lg p-3 border border-border text-center"
              >
                <div className="text-xs text-muted-foreground mb-1">Penalty</div>
                <div className="text-xl font-mono font-bold text-[#EF4444]">-{animatedPenalty.toFixed(1)}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-background/50 rounded-lg p-3 border border-border text-center"
              >
                <div className="text-xs text-muted-foreground mb-1">Round Score</div>
                <div className={`text-xl font-mono font-bold ${isPositiveScore ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {isPositiveScore ? '+' : ''}{animatedRoundScore.toFixed(1)}
                </div>
              </motion.div>
            </div>

            <div className="flex items-center justify-between bg-background/50 rounded-lg p-4 border border-border">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Your Prediction</div>
                <div className="text-2xl font-mono font-bold">{userPrediction}%</div>
              </div>
              <div className="flex items-center gap-2">
                {predictionError <= 10 ? (
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-[#EF4444]" />
                )}
                <span className={`text-sm ${predictionError <= 10 ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}>
                  {predictionError <= 5 ? 'Excellent!' :
                    predictionError <= 15 ? 'Good' :
                      predictionError <= 30 ? 'Fair' : 'Needs work'}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <h3 className="font-semibold mb-2">Crowd Distribution</h3>
          <p className="text-sm text-muted-foreground mb-6">Actual popularity (Y%) of each sword number</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="sword"
                  stroke="#94A3B8"
                  style={{ fontSize: '14px', fontFamily: 'Roboto Mono, monospace' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  style={{ fontSize: '12px', fontFamily: 'Roboto Mono, monospace' }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontFamily: 'Roboto Mono, monospace'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Popularity']}
                />
                <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.sword === userChoice ? '#EF4444' : '#06B6D4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold">
              {isFinalStandings ? '🏆 Final Standings' : 'Standings'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isFinalStandings ? 'Final cumulative rankings' : 'Current leaderboard rankings'}
            </p>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border">
              {leaderboard.map((player, idx) => {
                const isCurrentUser = player.username === currentUsername;
                const isTop3 = player.rank <= 3;

                return (
                  <motion.div
                    key={player.username}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * Math.min(idx, 20) }}
                    className={`flex items-center gap-4 p-4 transition-colors ${isCurrentUser
                        ? 'bg-[#F59E0B]/10 border-l-4 border-l-[#F59E0B] shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]'
                        : 'hover:bg-background/50'
                      }`}
                  >
                    {/* Rank */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold ${isTop3 ? 'bg-gradient-to-br from-[#F59E0B] to-[#EF4444] text-background' : 'bg-background text-muted-foreground'
                      }`}>
                      {player.rank === 1 && <Award className="w-6 h-6" />}
                      {player.rank !== 1 && player.rank}
                    </div>

                    {/* Username */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${isCurrentUser ? 'text-[#F59E0B]' : ''}`}>
                        {player.username}
                        {isCurrentUser && <span className="text-xs ml-2 text-[#F59E0B]/70">(You)</span>}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="text-right">
                      <div className={`font-mono font-bold ${player.roundScore >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                        }`}>
                        {player.roundScore >= 0 ? '+' : ''}{player.roundScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        Total: {player.totalScore.toFixed(1)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {leaderboard.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No results yet — waiting for round resolution.
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </div>
  );
}