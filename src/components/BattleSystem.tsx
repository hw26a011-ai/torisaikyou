/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Character, CollectedCharacter, ElementType, Rarity, PredatorQuest } from "../types";
import { CHARACTERS } from "../data/characters";
import { PREDATOR_QUESTS } from "../data/quests";
import { CharIcon } from "./CharIcon";
import { 
  Swords, Play, X, Shield, Heart, Award, Sparkles, ChevronRight, 
  Trash2, Plus, RefreshCw, Volume2, ShieldAlert, Zap, BarChart2, Star, Eye
} from "lucide-react";
import { playClick, playCoin } from "../utils/audio";

interface BattleSystemProps {
  collectedChars: Record<string, CollectedCharacter>;
  gold: number;
  manaStars: number;
  gems: number;
  onAwardRewards: (gold: number, stars: number, gems: number, expGains: Record<string, number>) => void;
}

interface BattleLogEntry {
  id: string;
  text: string;
  type: "system" | "friend" | "enemy" | "victory" | "defeat" | "crit" | "faint";
}

export const BattleSystem: React.FC<BattleSystemProps> = ({
  collectedChars,
  gold,
  manaStars,
  gems,
  onAwardRewards,
}) => {
  // Party array size 4. Holds character IDs of the assigned birds in slots 0 to 3.
  const [party, setParty] = useState<string[]>(() => {
    const saved = localStorage.getItem("bird_party");
    return saved ? JSON.parse(saved) : ["", "", "", ""];
  });

  // Save party to local storage
  const saveParty = (newParty: string[]) => {
    setParty(newParty);
    localStorage.setItem("bird_party", JSON.stringify(newParty));
  };

  // State to control assigning panel
  const [activeSlotToAssign, setActiveSlotToAssign] = useState<number | null>(null);

  // Selected Quest
  const [selectedQuestId, setSelectedQuestId] = useState<string>("Q01");
  const selectedQuest = useMemo(() => {
    return PREDATOR_QUESTS.find((q) => q.id === selectedQuestId) || PREDATOR_QUESTS[0];
  }, [selectedQuestId]);

  // Battle State variables
  const [isFighting, setIsFighting] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 2 | 100>(1); // 100 is instant-skip
  const [battleLogs, setBattleLogs] = useState<BattleLogEntry[]>([]);
  const [bossHp, setBossHp] = useState(100);
  const [bossMaxHp, setBossMaxHp] = useState(100);
  
  // Fight dynamic bird stats
  const [activeFighters, setActiveFighters] = useState<{
    id: string;
    name: string;
    jpName: string;
    maxHp: number;
    hp: number;
    atk: number;
    def: number;
    element: ElementType;
    iconName: string;
    isFainted: boolean;
  }[]>([]);

  const [fightOutcome, setFightOutcome] = useState<"won" | "lost" | null>(null);
  const [turnCount, setTurnCount] = useState(0);

  // Auto-scrolling the battle logs
  const logsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [battleLogs]);

  // Element Matchup helper
  const getDamageMultiplier = (birdElement: ElementType, bossElement: ElementType) => {
    // Adv chart: FLAME -> GALE -> TERRA -> AQUA -> FLAME
    if (birdElement === ElementType.FLAME && bossElement === ElementType.GALE) return 1.5;
    if (birdElement === ElementType.GALE && bossElement === ElementType.TERRA) return 1.5;
    if (birdElement === ElementType.TERRA && bossElement === ElementType.AQUA) return 1.5;
    if (birdElement === ElementType.AQUA && bossElement === ElementType.FLAME) return 1.5;
    
    // COSMOS vs DARK deal high damage to each other
    if (birdElement === ElementType.COSMOS && bossElement === ElementType.DARK) return 1.5;
    if (birdElement === ElementType.DARK && bossElement === ElementType.COSMOS) return 1.5;

    // Disadvantages (half damage or slightly less)
    if (birdElement === ElementType.GALE && bossElement === ElementType.FLAME) return 0.7;
    if (birdElement === ElementType.TERRA && bossElement === ElementType.GALE) return 0.7;
    if (birdElement === ElementType.AQUA && bossElement === ElementType.TERRA) return 0.7;
    if (birdElement === ElementType.FLAME && bossElement === ElementType.AQUA) return 0.7;

    return 1.0;
  };

  // Convert base stats using standard +8% per level
  const calculateDerivedStats = (base: number, level: number) => {
    return Math.round(base * (1 + (level - 1) * 0.08));
  };

  // Derived party total capabilities
  const partyFightersDetails = useMemo(() => {
    return party.map((id, index) => {
      if (!id) return null;
      const char = CHARACTERS.find((c) => c.id === id);
      const col = collectedChars[id];
      if (!char || !col) return null;
      return {
        id,
        char,
        col,
        hp: calculateDerivedStats(char.baseHp, col.level),
        atk: calculateDerivedStats(char.baseAtk, col.level),
        def: calculateDerivedStats(char.baseDef, col.level),
        slotIndex: index,
      };
    });
  }, [party, collectedChars]);

  const totalPartyAtk = useMemo(() => {
    return partyFightersDetails.reduce((acc, f) => acc + (f ? f.atk : 0), 0);
  }, [partyFightersDetails]);

  const totalPartyHp = useMemo(() => {
    return partyFightersDetails.reduce((acc, f) => acc + (f ? f.hp : 0), 0);
  }, [partyFightersDetails]);

  // Handle assigning bird
  const assignSlot = (slotIndex: number, charId: string) => {
    const updated = [...party];
    // Strip from existing slots if already there
    const existingIdx = updated.indexOf(charId);
    if (existingIdx !== -1) {
      updated[existingIdx] = "";
    }
    updated[slotIndex] = charId;
    saveParty(updated);
    setActiveSlotToAssign(null);
  };

  const removeSlot = (slotIndex: number) => {
    const updated = [...party];
    updated[slotIndex] = "";
    saveParty(updated);
  };

  // Get only birds that are unlocked (collected) to populate selector
  const availableUnlockedBirds = useMemo(() => {
    return CHARACTERS.filter((c) => !!collectedChars[c.id]);
  }, [collectedChars]);

  // Setup/Tear down combat loop
  const startCombat = () => {
    if (isFighting) return;
    playClick();

    // Pick fighters from party slots containing birds
    const readyUnits = partyFightersDetails
      .filter((f) => f !== null)
      .map((f) => ({
        id: f!.id,
        name: f!.char.name,
        jpName: f!.char.jpName,
        maxHp: f!.hp,
        hp: f!.hp,
        atk: f!.atk,
        def: f!.def,
        element: f!.char.element,
        iconName: f!.char.iconName,
        isFainted: false,
      }));

    if (readyUnits.length === 0) {
      alert("草原を守る小鳥を少なくとも1羽以上、パーティに編成してください！");
      return;
    }

    setBossMaxHp(selectedQuest.bossHp);
    setBossHp(selectedQuest.bossHp);
    setActiveFighters(readyUnits);
    setIsFighting(true);
    setFightOutcome(null);
    setTurnCount(0);
    
    const initialEntry: BattleLogEntry = {
      id: "init",
      text: `🍃 【戦闘開始】草原に『${selectedQuest.jpName}』が現れた！防衛部隊の小鳥たちが群れとなって立ち向かう！`,
      type: "system",
    };
    setBattleLogs([initialEntry]);

    // If speed is ultra fast (100x), resolve synchronously immediately
    if (battleSpeed === 100) {
      resolveInstantBattle(readyUnits, selectedQuest);
    }
  };

  // High-performance synchronous simulator for skipped battles
  const resolveInstantBattle = (
    initialFighters: typeof activeFighters,
    quest: PredatorQuest
  ) => {
    let currentFighters = initialFighters.map(f => ({ ...f }));
    let currentBossHp = quest.bossHp;
    const logs: BattleLogEntry[] = [
      {
        id: "instant-init",
        text: `⚡ 【高速決戦】バトルの過程をスキップして、防衛結果をただちに観測します...`,
        type: "system"
      }
    ];

    let turns = 0;
    while (currentBossHp > 0 && currentFighters.some(f => !f.isFainted) && turns < 100) {
      turns++;
      
      // Birds Turn
      const aliveFriends = currentFighters.filter(f => !f.isFainted);
      if (aliveFriends.length > 0) {
        // One random alive bird strikes
        const attacker = aliveFriends[Math.floor(Math.random() * aliveFriends.length)];
        const multiplier = getDamageMultiplier(attacker.element, quest.element);
        const isCrit = Math.random() < 0.12;
        let baseDamage = Math.max(15, Math.round((attacker.atk * multiplier - quest.bossDef * 0.4) * (0.85 + Math.random() * 0.3)));
        if (isCrit) baseDamage = Math.round(baseDamage * 1.8);

        currentBossHp = Math.max(0, currentBossHp - baseDamage);
        logs.push({
          id: `f-${turns}`,
          text: `▶ ${attacker.jpName} の全力空撃！ ${quest.jpName} に ${baseDamage} の猛攻ダメージ！ ${isCrit ? "🔥 [CRITICAL! / 強打!!]" : ""}`,
          type: isCrit ? "crit" : "friend"
        });

        if (currentBossHp <= 0) break;
      }

      // Boss Turn
      const aliveFriendsAgain = currentFighters.filter(f => !f.isFainted);
      if (aliveFriendsAgain.length > 0) {
        const defender = aliveFriendsAgain[Math.floor(Math.random() * aliveFriendsAgain.length)];
        const bossDamage = Math.max(20, Math.round((quest.bossAtk - defender.def * 0.5) * (0.85 + Math.random() * 0.3)));
        
        // Find inside list & deduct
        const idx = currentFighters.findIndex(f => f.id === defender.id);
        if (idx !== -1) {
          currentFighters[idx].hp = Math.max(0, currentFighters[idx].hp - bossDamage);
          logs.push({
            id: `b-${turns}`,
            text: `💥 ${quest.jpName} の反撃！ ${defender.jpName} は ${bossDamage} の傷を負った！`,
            type: "enemy"
          });

          if (currentFighters[idx].hp <= 0) {
            currentFighters[idx].isFainted = true;
            logs.push({
              id: `faint-${turns}-${defender.id}`,
              text: `💀 【危険】${defender.jpName} は力尽きて草原に不時着した！`,
              type: "faint"
            });
          }
        }
      }
    }

    const bossDefeated = currentBossHp <= 0;
    
    if (bossDefeated) {
      logs.push({
        id: "instant-victory",
        text: `🎉 【大勝利】草原の平和は護られた！${quest.jpName}は退散していった！`,
        type: "victory"
      });
      setFightOutcome("won");

      // Exp gains
      const expGains: Record<string, number> = {};
      initialFighters.forEach((f) => {
        expGains[f.id] = 120 + quest.difficulty * 40; // award clear exp
      });

      onAwardRewards(quest.rewards.gold, quest.rewards.stars, quest.rewards.gems, expGains);
    } else {
      logs.push({
        id: "instant-defeat",
        text: `😭 【敗北】天敵の圧倒的パワーの前に、防衛部隊が撤退を余儀なくされました...`,
        type: "defeat"
      });
      setFightOutcome("lost");
    }

    setBossHp(currentBossHp);
    setActiveFighters(currentFighters);
    setBattleLogs(logs);
    setTurnCount(turns);
  };

  // Semi-animated Battle Interval Loop
  useEffect(() => {
    if (!isFighting || fightOutcome || battleSpeed === 100) return;

    const intervalTime = battleSpeed === 2 ? 600 : 1305;
    const combatTimer = setInterval(() => {
      // Choose an attacker
      const aliveFriends = activeFighters.filter((f) => !f.isFainted);
      const isBossAlive = bossHp > 0;

      if (aliveFriends.length === 0) {
        // Defeat
        setFightOutcome("lost");
        setBattleLogs((prev) => [
          ...prev,
          {
            id: `defeat-${Date.now()}`,
            text: `😭 【敗北】天敵の圧倒的な力に、小鳥たちは体力を奪われ撤退を余儀なくされました...`,
            type: "defeat",
          },
        ]);
        clearInterval(combatTimer);
        return;
      }

      if (!isBossAlive) {
        // Victory
        playCoin();
        setFightOutcome("won");
        setBattleLogs((prev) => [
          ...prev,
          {
            id: `win-${Date.now()}`,
            text: `🎉 【大勝利】草原の安全は無事に確保された！ ${selectedQuest.jpName} の撃退に成功しました！`,
            type: "victory",
          },
        ]);

        // award EXP as a formula based on difficulty
        const expGains: Record<string, number> = {};
        activeFighters.forEach((f) => {
          expGains[f.id] = 120 + selectedQuest.difficulty * 40;
        });

        onAwardRewards(
          selectedQuest.rewards.gold,
          selectedQuest.rewards.stars,
          selectedQuest.rewards.gems,
          expGains
        );

        clearInterval(combatTimer);
        return;
      }

      // If both are alive, perform a turn!
      setTurnCount((prev) => prev + 1);

      // Determine who acts helper
      const isFriendTurn = turnCount % 2 === 0;

      if (isFriendTurn) {
        // High-speed strike from a random conscious bird
        const attacker = aliveFriends[Math.floor(Math.random() * aliveFriends.length)];
        const mult = getDamageMultiplier(attacker.element, selectedQuest.element);
        const randCrit = Math.random() < 0.12;
        let damage = Math.max(15, Math.round((attacker.atk * mult - selectedQuest.bossDef * 0.4) * (0.85 + Math.random() * 0.3)));
        if (randCrit) damage = Math.round(damage * 1.8);

        const newBossHp = Math.max(0, bossHp - damage);
        setBossHp(newBossHp);

        setBattleLogs((prev) => [
          ...prev,
          {
            id: `turn-f-${Date.now()}`,
            text: `▶ ${attacker.jpName} の飛翔アタック！ ${selectedQuest.jpName} に ${damage} ダメージ！ ${randCrit ? "🔥 [強打発動!!]" : ""}`,
            type: randCrit ? "crit" : "friend",
          },
        ]);
      } else {
        // Predator counters an attacker
        const target = aliveFriends[Math.floor(Math.random() * aliveFriends.length)];
        const bossDmg = Math.max(20, Math.round((selectedQuest.bossAtk - target.def * 0.5) * (0.85 + Math.random() * 0.3)));

        // Deduct health
        setActiveFighters((prev) => {
          return prev.map((f) => {
            if (f.id === target.id) {
              const updatedHp = Math.max(0, f.hp - bossDmg);
              return {
                ...f,
                hp: updatedHp,
                isFainted: updatedHp <= 0,
              };
            }
            return f;
          });
        });

        setBattleLogs((prev) => [
          ...prev,
          {
            id: `turn-b-${Date.now()}`,
            text: `💥 ${selectedQuest.jpName} 牙の反撃！ ${target.jpName} は ${bossDmg} のダメージを受けた！`,
            type: "enemy",
          },
        ]);

        // check if target just fainted
        if (target.hp - bossDmg <= 0) {
          setBattleLogs((prev) => [
            ...prev,
            {
              id: `faint-${Date.now()}`,
              text: `💀 【危険】${target.jpName} は戦線離脱し、草陰へと避難しました！`,
              type: "faint",
            },
          ]);
        }
      }

    }, intervalTime);

    return () => clearInterval(combatTimer);
  }, [isFighting, fightOutcome, bossHp, activeFighters, turnCount, battleSpeed, selectedQuest]);

  const exitBattle = () => {
    setIsFighting(false);
    setFightOutcome(null);
    setBattleLogs([]);
  };

  return (
    <div className="bg-slate-50 border border-slate-250/20 p-4 sm:p-5 rounded-2xl shadow-xs flex-1 flex flex-col overflow-hidden select-none">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 pb-3 border-b border-emerald-100 shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <Swords className="w-5 h-5 text-emerald-600 animate-pulse" />
            草原 the 天敵討伐クエスト
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            獲得した鳥たちで最強の防衛パーティを編成し、草原を荒らす天敵（ヘビ、肉食の鳥、凶暴な獣）たちを討伐しましょう！
          </p>
        </div>
        
        {/* Resource overview brief */}
        <div className="flex gap-3 bg-white border border-emerald-100/60 p-2 rounded-xl text-xs">
          <div className="flex items-center gap-1 font-mono">
            <span>🪙</span>
            <span className="font-bold text-yellow-600">{gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 font-mono border-l border-slate-200 pl-2">
            <span>✨</span>
            <span className="font-bold text-emerald-600">{manaStars.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 font-mono border-l border-slate-200 pl-2">
            <span>💎</span>
            <span className="font-bold text-sky-600">{gems.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Panel splitting Party and Quests */}
      {!isFighting ? (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto pr-1">
            
            {/* LEFT: 4 SLOT PARTY FORMATION CONFIG */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-inner">
                <h3 className="text-xs font-bold uppercase text-emerald-700 tracking-wider mb-1 flex items-center justify-between">
                  <span>🛡️ 防衛小鳥部隊</span>
                  <span className="text-[10px] font-mono text-slate-400 capitalize">最大4羽</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {party.map((assignedId, index) => {
                    const unit = partyFightersDetails[index];
                    
                    return (
                      <div 
                        key={index}
                        className={`relative min-h-[120px] p-2 rounded-lg border flex flex-col justify-between items-center transition ${
                          unit 
                            ? "bg-slate-50/70 border-emerald-200/80 hover:bg-slate-50" 
                            : "bg-slate-50 border-dashed border-slate-300 hover:border-emerald-400 text-slate-400 hover:text-emerald-600"
                        }`}
                      >
                        {/* Slot Label */}
                        <span className="absolute top-1 left-2 text-[8px] font-mono font-bold text-slate-400">枠 {index + 1}</span>

                        {unit ? (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeSlot(index); }}
                              className="absolute top-1 right-2 p-0.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition"
                              title="編成から除外"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            
                            <div className="flex flex-col items-center text-center mt-2">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-800 shadow-inner">
                                <CharIcon name={unit.char.iconName} className="w-4 h-4 text-slate-700" charId={unit.char.id} jpName={unit.char.jpName} element={unit.char.element} />
                              </div>
                              <span className="text-[11px] font-bold text-slate-800 mt-1 line-clamp-1">{unit.char.jpName}</span>
                              <span className="text-[9px] text-slate-500 font-bold leading-none mt-0.5">LV.{unit.col.level}</span>
                            </div>

                            <div className="w-full text-[8px] text-slate-500 font-mono flex justify-between bg-white border border-slate-200/60 rounded px-1.5 py-0.5 mt-1.5">
                              <span className="text-rose-600 flex items-center gap-0.5"><Swords className="w-2.5 h-2.5" />{unit.atk}</span>
                              <span className="text-blue-600 flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" />{unit.def}</span>
                              <span className="text-emerald-700 font-bold">HP:{unit.hp}</span>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => { playClick(); setActiveSlotToAssign(index); }}
                            className="w-full h-full flex flex-col items-center justify-center py-2 cursor-pointer"
                          >
                            <Plus className="w-5 h-5 stroke-[3] opacity-60 mb-0.5" />
                            <span className="text-[9px] font-bold">小鳥を編成</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total Party Summary statistics */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-1.5 rounded-lg text-center flex flex-col">
                    <span className="text-[8px] text-slate-400 font-bold block leading-tight">総合攻撃力</span>
                    <span className="text-xs font-mono font-bold text-rose-600 mt-0.5">⚔️ {totalPartyAtk.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg text-center flex flex-col">
                    <span className="text-[8px] text-slate-400 font-bold block leading-tight">総HPプール</span>
                    <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5">❤️ {totalPartyHp.toLocaleString()}</span>
                  </div>
                </div>

              </div>

              {/* Quick helper about elemental affinity */}
              <div className="bg-emerald-50/50 border border-emerald-150 p-2.5 rounded-xl text-xs text-slate-600 leading-normal">
                <h4 className="font-bold text-emerald-800 mb-0.5 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-emerald-600" /> 草原の属性相性</h4>
                <p className="text-[10px] text-slate-500 leading-tight">
                  属性が有利な場合、<strong className="text-amber-700">与ダメージ+50%</strong>、さらに<strong className="text-blue-700">被ダメージ30%低減</strong>！
                </p>
                <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mt-1.5 text-[9px] bg-white p-1 rounded-lg border border-emerald-100 font-medium font-mono text-center justify-center">
                  <span className="text-red-500">🔥 風勝</span>
                  <span className="text-emerald-600">🌱 土勝</span>
                  <span className="text-amber-600">⛰️ 水勝</span>
                  <span className="text-blue-500">💧 火勝</span>
                  <span className="text-purple-600">🔮対立👻</span>
                </div>
              </div>
            </div>

            {/* RIGHT: EXPEDITION SELECTABLE QUEST LIST */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded-xl flex-1 flex flex-col">
                <h3 className="text-xs font-bold uppercase text-slate-550 tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" /> 標的を選択
                </h3>
                
                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 max-h-[235px]">
                  {PREDATOR_QUESTS.map((quest) => {
                    const isSelected = selectedQuestId === quest.id;
                    
                    return (
                      <div 
                        key={quest.id}
                        onClick={() => { playClick(); setSelectedQuestId(quest.id); }}
                        className={`p-2 rounded-lg border cursor-pointer transition flex items-center justify-between gap-2.5 ${
                          isSelected 
                            ? "bg-emerald-50/40 border-emerald-500/80 ring-1 ring-emerald-500" 
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Predator Level / Indicator icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            quest.difficulty === 5 ? "bg-red-100 text-red-600 border border-red-200" :
                            quest.difficulty >= 4 ? "bg-amber-100 text-amber-600 border border-amber-200" :
                            "bg-emerald-100 text-emerald-600 border border-emerald-200"
                          }`}>
                            <CharIcon name={quest.iconName} className="w-4 h-4" charId={quest.id} jpName={quest.jpName} element={quest.element} />
                          </div>

                          <div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs font-extrabold text-slate-800 leading-tight">{quest.jpName}</span>
                              <span className={`text-[8px] font-mono uppercase tracking-wider font-bold px-1.5 border rounded-full ${
                                quest.element === "FLAME" ? "bg-red-50 text-red-500 border-red-200" :
                                quest.element === "AQUA" ? "bg-blue-50 text-blue-500 border-blue-200" :
                                quest.element === "GALE" ? "bg-emerald-50 text-emerald-500 border-emerald-200" :
                                quest.element === "TERRA" ? "bg-amber-50 text-amber-500 border-amber-200" :
                                "bg-purple-50 text-purple-500 border-purple-200"
                              }`}>
                                {quest.element === "FLAME" ? "火" :
                                 quest.element === "AQUA" ? "水" :
                                 quest.element === "GALE" ? "風" :
                                 quest.element === "TERRA" ? "土" : "魔"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {/* Stars indicating difficulty */}
                              <div className="flex text-amber-500 select-none">
                                {Array.from({ length: quest.difficulty }).map((_, i) => (
                                  <Star key={i} className="w-2.5 h-2.5 fill-amber-500" />
                                ))}
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono">推薦攻撃: <strong className="text-slate-600 font-bold">{quest.recommendedAtk}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col justify-center items-end shrink-0">
                          <span className="text-[8px] text-slate-400 font-bold block mb-0.5">報酬:</span>
                          <div className="flex gap-1.5 text-[8px] font-mono leading-none">
                            <span className="text-yellow-600 font-bold">🪙{quest.rewards.gold}</span>
                            <span className="text-emerald-600 font-bold">✨{quest.rewards.stars}</span>
                            <span className="text-sky-600 font-bold">💎{quest.rewards.gems}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* LOWER FLUID FULL-WIDTH BATTLE TRIGGER BOX */}
          <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-xs shrink-0 mt-2">
            <h4 className="text-xs font-bold text-slate-800 mb-2">🔭 選択中の標的情報と戦闘シミュレーション</h4>
            <p className="text-xs text-slate-500 leading-normal mb-3">
              『<strong className="text-slate-800">{selectedQuest.jpName}</strong>』への討伐作戦。
              {selectedQuest.description}
            </p>

            {/* Matchup advisor */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-semibold block">戦力比:</span>
                  <strong className="font-mono text-slate-700">{totalPartyAtk}</strong>
                  <span className="text-slate-350">/</span>
                  <span className="text-slate-450 font-mono">推奨 {selectedQuest.recommendedAtk}</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-500 leading-relaxed">
                  {totalPartyAtk >= selectedQuest.recommendedAtk ? (
                    <span className="text-emerald-600 font-bold">✔ 十分な戦力を検出！有利に戦いを進めるチャンスです。</span>
                  ) : (
                    <span className="text-orange-600 font-bold">⚠ 戦力が推奨値に達していません！小鳥の強化か、敵の弱点を考慮してください。</span>
                  )}
                </div>
              </div>

              <div className="flex flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <button 
                  onClick={startCombat}
                  disabled={partyFightersDetails.filter(Boolean).length === 0}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> 戦闘開始
                </button>

                {/* Speed Controllers - inline next to combat initiation */}
                <div className="flex bg-slate-200 rounded-lg p-0.5 text-[9px] font-bold select-none border border-slate-300 shrink-0">
                  <button 
                    onClick={() => setBattleSpeed(1)}
                    className={`px-2 py-1.5 rounded transition ${battleSpeed === 1 ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}
                  >
                    1x
                  </button>
                  <button 
                    onClick={() => setBattleSpeed(2)}
                    className={`px-2 py-1.5 rounded transition ${battleSpeed === 2 ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}
                  >
                    2x
                  </button>
                  <button 
                    onClick={() => setBattleSpeed(100)}
                    className={`px-2 py-1.5 rounded transition ${battleSpeed === 100 ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}
                    title="バトルの経過を完全に自動スキップします"
                  >
                    スキップ ⚡
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* BATTLE STAGE RUNNING MODE SCREEN (Optimized to prevent top/bottom clipping) */
        <div className="bg-neutral-950 border border-neutral-850 p-3 sm:p-4 rounded-2xl flex flex-col gap-3 relative overflow-hidden flex-1 min-h-0 animate-in zoom-in-95 duration-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

          {/* Speed / Exit floating controller */}
          <div className="z-10 flex justify-end items-center gap-3 bg-neutral-900 border border-neutral-800 p-2 rounded-xl shrink-0">
            <div className="flex-1" />
            
            <div className="flex gap-1.5 text-xs items-center">
              <div className="flex bg-neutral-850 rounded-lg p-0.5 text-[8.5px] font-bold select-none border border-neutral-800">
                <button 
                  onClick={() => setBattleSpeed(1)}
                  className={`px-1.5 py-0.5 rounded transition ${battleSpeed === 1 ? "bg-neutral-950 text-emerald-400 border border-neutral-800" : "text-neutral-500"}`}
                >
                  1x
                </button>
                <button 
                  onClick={() => setBattleSpeed(2)}
                  className={`px-1.5 py-0.5 rounded transition ${battleSpeed === 2 ? "bg-neutral-950 text-emerald-400 border border-neutral-800" : "text-neutral-500"}`}
                >
                  2x
                </button>
                <button 
                  onClick={() => {
                    setBattleSpeed(100);
                    resolveInstantBattle(activeFighters, selectedQuest);
                  }}
                  className={`px-1.5 py-0.5 rounded transition ${battleSpeed === 100 ? "bg-neutral-950 text-emerald-400 border border-neutral-800" : "text-neutral-500"}`}
                >
                  ⚡ SKIP
                </button>
              </div>
              
              {fightOutcome && (
                <button 
                  onClick={exitBattle}
                  className="px-2.5 py-0.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 rounded-lg font-bold hover:text-white transition cursor-pointer text-[9px]"
                >
                  <X className="w-2.5 h-2.5 inline mr-1" /> 会場を出る
                </button>
              )}
            </div>

            <span className="text-[7.5px] text-zinc-500 font-mono tracking-wider font-extrabold uppercase border-l border-neutral-800 pl-2">
              防衛戦闘フェーズ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 z-10 flex-1 min-h-0 items-stretch">
            {/* Left Column: Friendly birds (Defenders) */}
            <div className="md:col-span-5 flex flex-col gap-1.5 justify-center min-h-0 overflow-y-auto">
              <span className="text-[8px] font-mono tracking-wider text-neutral-400 uppercase font-black">🌱 草原の鳥部隊</span>
              <div className="grid grid-cols-1 gap-1.5">
                {activeFighters.map((fighter) => (
                  <div 
                    key={fighter.id}
                    className={`p-1.5 sm:p-2 rounded-lg border flex items-center justify-between gap-2.5 transition ${
                      fighter.isFainted 
                        ? "bg-neutral-950/80 border-neutral-850 opacity-40 grayscale" 
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-neutral-850 flex items-center justify-center border border-neutral-750 shrink-0">
                        <CharIcon name={fighter.iconName} className="w-3.5 h-3.5 text-slate-300" charId={fighter.id} jpName={fighter.jpName} element={fighter.element} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-neutral-100 leading-none">{fighter.jpName}</span>
                          <span className="text-[7px] border border-neutral-750 font-mono text-neutral-400 rounded px-1 scale-90 origin-left">{fighter.element}</span>
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono font-bold leading-none block mt-0.5">攻: {fighter.atk} | 防: {fighter.def}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {fighter.isFainted ? (
                        <span className="text-[8px] font-black text-rose-500 tracking-wider">避難済 ❌</span>
                      ) : (
                        <div className="w-16 sm:w-20">
                          <div className="flex justify-between text-[7px] font-mono text-zinc-400 mb-0.5 leading-none">
                            <span>HP</span>
                            <span>{fighter.hp}/{fighter.maxHp}</span>
                          </div>
                          <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden border border-neutral-800">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300 animate-pulse"
                              style={{ width: `${(fighter.hp / fighter.maxHp) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Column: Vs Emblem */}
            <div className="md:col-span-2 flex flex-col items-center justify-center py-1 shrink-0">
              <div className="w-8 h-8 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-rose-500 font-black text-xs animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                VS
              </div>
              <span className="text-[8px] font-mono text-neutral-500 mt-1">ターン: {turnCount}</span>
            </div>

            {/* Right Column: Giant boss threat AND Combat Log */}
            <div className="md:col-span-5 flex flex-col gap-2 min-h-0 justify-between self-stretch">
              {/* Visual Threat Card */}
              <div className="flex flex-col items-center justify-center bg-neutral-900/40 border border-neutral-850 p-2 rounded-xl relative shrink-0">
                <div className="absolute top-1 left-2 text-[7px] border border-neutral-750 text-neutral-400 px-1 font-mono uppercase bg-neutral-900/60 z-15 select-none">
                  ⚠️ 天敵強襲
                </div>
                
                <div className="relative mb-1 flex items-center justify-center">
                  {/* Visual pulse for boss */}
                  <div className="absolute w-12 h-12 rounded-full border border-dashed border-red-500/15 animate-spin" style={{ animationDuration: "12s" }} />
                  <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-red-500/30 flex items-center justify-center text-red-500 shadow-xl shadow-red-950/25 z-10 transition">
                    <CharIcon name={selectedQuest.iconName} className="w-6 h-6 animate-bounce" style={{ animationDuration: "2s" }} charId={selectedQuest.id} jpName={selectedQuest.jpName} element={selectedQuest.element} />
                  </div>
                </div>

                <div className="text-center w-full z-10">
                  <h3 className="text-[11px] font-extrabold text-neutral-100 flex items-center justify-center gap-1 leading-none">
                    {selectedQuest.jpName}
                    <span className="text-[7px] bg-red-950 text-red-400 border border-red-900 px-0.5 rounded uppercase font-bold tracking-wider font-mono scale-[0.85] origin-left">
                      [{selectedQuest.element}]
                    </span>
                  </h3>
                  <span className="text-[8px] text-rose-455 font-mono mt-0.5 block leading-none">ATK: {selectedQuest.bossAtk} | DEF: {selectedQuest.bossDef}</span>

                  {/* HP Tracker bar */}
                  <div className="mt-1.5 max-w-[140px] sm:max-w-xs mx-auto">
                    <div className="flex justify-between text-[7px] font-mono text-zinc-400 mb-0.5 leading-none">
                      <span>脅威HPプール</span>
                      <span className="font-bold">{bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden border border-neutral-800">
                      <div 
                        className={`h-full bg-gradient-to-r transition-all duration-300 ${
                          bossHp / bossMaxHp < 0.3 ? "from-red-600 to-rose-500" : "from-orange-500 to-amber-500"
                        }`}
                        style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* HIGH CONTRAST COMBAT SCROLL LOG (Placed under enemy panel) */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-2 flex-1 min-h-[140px] flex flex-col justify-between">
                <span className="text-[8px] font-mono text-neutral-500 tracking-wider font-extrabold uppercase block mb-0.5 shrink-0">📡 戦闘通信記録</span>
                
                <div 
                  ref={logsEndRef}
                  className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] sm:text-[9.5px] leading-snug pr-2"
                >
                  {battleLogs.map((log) => {
                    let colorClass = "text-neutral-400";
                    if (log.type === "system") colorClass = "text-emerald-400 font-bold border-l-2 border-emerald-500 pl-1.5 my-0.5";
                    if (log.type === "friend") colorClass = "text-sky-300";
                    if (log.type === "enemy") colorClass = "text-rose-350";
                    if (log.type === "crit") colorClass = "text-yellow-300 font-extrabold scale-[1.01]";
                    if (log.type === "faint") colorClass = "text-red-500 italic";
                    if (log.type === "victory") colorClass = "text-green-400 font-black tracking-wide text-xs border-y border-emerald-900/60 p-2 my-2 bg-emerald-950/30 block text-center";
                    if (log.type === "defeat") colorClass = "text-rose-450 font-black tracking-wide text-xs border-y border-rose-900/60 p-2 my-2 bg-rose-950/30 block text-center";

                    return (
                      <div key={log.id} className={colorClass}>
                        {log.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* OUTCOME OVERLAY SHOWS WHEN FINISHED */}
          {fightOutcome && (
            <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-sm z-30 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
              <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
                
                {fightOutcome === "won" ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch text-left">
                    {/* Left Column: Outcome status & text */}
                    <div className="md:col-span-5 flex flex-col justify-center items-center text-center p-2 border-b md:border-b-0 md:border-r border-neutral-800/60 pb-4 md:pb-0 md:pr-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 text-3xl mb-4 animate-bounce shrink-0">
                        👑
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-neutral-100 tracking-tight">草原防衛 成功！</h3>
                      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                        防衛小鳥部隊の連携が天敵を圧倒しました！天敵はすごすごと森へ撤退して行きました。
                      </p>
                    </div>

                    {/* Right Column: Acquired loot & Back to lobby button */}
                    <div className="md:col-span-7 flex flex-col justify-between gap-4">
                      <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-xl flex-1 flex flex-col justify-center">
                        <span className="text-[9px] font-mono text-neutral-500 uppercase font-black block mb-2 text-center md:text-left">💎 ACQUIRED LOOT (獲得品)</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-neutral-900/80 p-2 border border-neutral-800 rounded-lg text-center">
                            <span className="text-[9px] text-zinc-500 block">ゴールド</span>
                            <span className="text-xs font-bold text-yellow-500 font-mono">🪙{selectedQuest.rewards.gold}</span>
                          </div>
                          <div className="bg-neutral-900/80 p-2 border border-neutral-800 rounded-lg text-center">
                            <span className="text-[9px] text-zinc-500 block">マナ星</span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">✨{selectedQuest.rewards.stars}</span>
                          </div>
                          <div className="bg-neutral-900/80 p-2 border border-neutral-800 rounded-lg text-center">
                            <span className="text-[9px] text-zinc-500 block">ジェム</span>
                            <span className="text-xs font-bold text-sky-400 font-mono">💎{selectedQuest.rewards.gems}</span>
                          </div>
                        </div>

                        {/* EXP Notification */}
                        <div className="mt-3.5 pt-2 border-t border-neutral-850 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-405 animate-pulse shrink-0" />
                          <span className="leading-snug">戦闘メンバーに大空EXP <strong className="font-mono text-white">+{120 + selectedQuest.difficulty * 40}</strong> が与えられました！</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={exitBattle}
                          className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl border border-neutral-700 font-bold transition cursor-pointer text-xs"
                        >
                          ロビーへ戻る
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch text-left">
                    {/* Left Column: Defeat Status & text */}
                    <div className="md:col-span-5 flex flex-col justify-center items-center text-center p-2 border-b md:border-b-0 md:border-r border-neutral-800/60 pb-4 md:pb-0 md:pr-4">
                      <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-500 text-3xl mb-4 shrink-0">
                        💀
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-neutral-100 tracking-tight">作戦離脱 (Defeat)</h3>
                      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                        天敵が草原を支配するための威圧感に圧倒されました。小鳥たちをレベルアップさせるか、天敵の属性に優位なメンバーを編成して再挑戦してください。
                      </p>
                    </div>

                    {/* Right Column: Tips & Buttons */}
                    <div className="md:col-span-7 flex flex-col justify-between gap-4">
                      <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-xl text-left flex-1 flex flex-col justify-center">
                        <span className="text-[9px] font-mono text-red-400 uppercase font-bold block mb-1">💡 勝利への防衛ヒント:</span>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          標的「<strong className="text-yellow-600">{selectedQuest.jpName}</strong>」は <strong className="text-amber-500 font-mono">[{selectedQuest.element}]属性</strong> です。
                          {selectedQuest.element === ElementType.TERRA && "風属性 (GALE: シマエナガ、ウグイスなど) の鳥を編成すると、戦闘力ボーナスが得られます！"}
                          {selectedQuest.element === ElementType.DARK && "宇宙属性 (COSMOS: トキ、キジバト、セキセイインコなど) が特に有効です！"}
                          {selectedQuest.element === ElementType.GALE && "火属性 (FLAME: ハヤブサ、ベニマシコ、オオマシコなど) を編成しましょう！"}
                          {selectedQuest.element === ElementType.AQUA && "土属性 (TERRA: キジ、ヤマガラ、カルガモ、コウテイペンギンなど) を編成しましょう！"}
                          {selectedQuest.element === ElementType.FLAME && "水属性 (AQUA: カワセミ、コサギ、アヒル、シマフクロウなど) を編成しましょう！"}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={exitBattle}
                          className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl border border-neutral-700 font-bold transition cursor-pointer text-xs"
                        >
                          ロビーへ戻る
                        </button>
                        <button 
                          onClick={() => { exitBattle(); startCombat(); }}
                          className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-xl shadow-md transition text-xs opacity-90 hover:opacity-100"
                        >
                          すぐリトライ ⚡
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL OR SIDE PANEL FOR ASSIGNING BIRDS */}
      {activeSlotToAssign !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950/40">
              <span className="text-xs font-bold text-neural-100 flex items-center gap-1.5 text-slate-350">
                <Plus className="w-4 h-4 text-emerald-400" />
                スロット {activeSlotToAssign + 1} に編成する鳥霊を選択
              </span>
              <button 
                onClick={() => setActiveSlotToAssign(null)}
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[385px] overflow-y-auto space-y-2">
              {availableUnlockedBirds.length === 0 ? (
                <div className="text-center py-6 text-sm text-neutral-500">
                  まだ観測（召喚）した鳥がいません！<br />
                  「小鳥の召喚」タブで小鳥を仲間に迎えてください。
                </div>
              ) : (
                availableUnlockedBirds.map((char) => {
                  const col = collectedChars[char.id];
                  if (!col) return null;
                  
                  // Compute derived stats
                  const curHp = calculateDerivedStats(char.baseHp, col.level);
                  const curAtk = calculateDerivedStats(char.baseAtk, col.level);
                  
                  // Check if already in party (for indicator)
                  const partyIndex = party.indexOf(char.id);
                  const isEquipped = partyIndex !== -1;

                  return (
                    <div 
                      key={char.id}
                      onClick={() => assignSlot(activeSlotToAssign, char.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isEquipped 
                          ? "bg-neutral-950/60 border-indigo-500/50 opacity-95" 
                          : "bg-neutral-950/30 border-neutral-850 hover:bg-neutral-850 hover:border-neutral-750"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-200 shrink-0">
                          <CharIcon name={char.iconName} className="w-5 h-5" charId={char.id} jpName={char.jpName} element={char.element} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-bold text-neutral-100">{char.jpName}</span>
                            <span className="text-[8px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1 rounded uppercase font-mono">{char.element}</span>
                          </div>
                          
                          <div className="flex gap-2 text-[9px] text-neutral-400 font-mono mt-0.5">
                            <span>LV.{col.level}</span>
                            <span className="text-rose-450">⚔️{curAtk}</span>
                            <span className="text-emerald-450">HP:{curHp}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 font-mono text-[9px] text-right">
                        {isEquipped ? (
                          <span className="text-indigo-400 font-bold bg-indigo-950/60 border border-indigo-900 px-1.5 py-0.5 rounded">SLOT {partyIndex + 1} 配置中</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold hover:underline">配置する →</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-neutral-950/60 border-t border-neutral-800 text-center text-xs text-neutral-500">
              ※ パーティメンバーは重複して別のスロットに配置することはできません。
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
