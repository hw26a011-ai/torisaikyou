/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { Character, CollectedCharacter, PullHistoryItem, Rarity, ElementType } from "./types";
import { CHARACTERS, GACHA_RATES } from "./data/characters";
import { CharIcon } from "./components/CharIcon";
import { GachaPullAnimation } from "./components/GachaPullAnimation";
import { CharacterDetailModal } from "./components/CharacterDetailModal";
import { BattleSystem } from "./components/BattleSystem";
import { playClick, playCoin, playPullStart, toggleMute, getMuteState } from "./utils/audio";
import { 
  Sparkles, 
  Database, 
  History, 
  Flame, 
  Droplet, 
  Wind, 
  Shield, 
  Swords, 
  Coins, 
  Heart, 
  Info, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  Award, 
  Compass, 
  HelpCircle,
  HelpCircle as QuestionIcon,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal,
  Zap,
  Sparkle,
  Plus,
  Orbit,
  Bird,
  Feather
} from "lucide-react";

export default function App() {
  // --- Game Currencies & States ---
  const [gems, setGems] = useState<number>(() => {
    const s = localStorage.getItem("gacha_gems");
    return s ? parseInt(s, 10) : 3000; // Start with 3000 Gems (enough for two 10-pulls!)
  });
  const [tickets, setTickets] = useState<number>(() => {
    const s = localStorage.getItem("gacha_tickets");
    return s ? parseInt(s, 10) : 10; // Start with 10 free tickets
  });
  const [gold, setGold] = useState<number>(() => {
    const s = localStorage.getItem("gacha_gold");
    return s ? parseInt(s, 10) : 1500; // Start with 1500 Gold
  });
  const [manaStars, setManaStars] = useState<number>(() => {
    const s = localStorage.getItem("gacha_manaStars");
    return s ? parseInt(s, 10) : 120; // Start with 120 Mana Stars
  });
  const [collectedChars, setCollectedChars] = useState<Record<string, CollectedCharacter>>(() => {
    const s = localStorage.getItem("gacha_collected");
    return s ? JSON.parse(s) : {};
  });
  const [pullHistory, setPullHistory] = useState<PullHistoryItem[]>(() => {
    const s = localStorage.getItem("gacha_history");
    return s ? JSON.parse(s) : [];
  });
  const [pityCount, setPityCount] = useState<number>(() => {
    const s = localStorage.getItem("gacha_pity");
    return s ? parseInt(s, 10) : 0;
  });

  const [activeTab, setActiveTab] = useState<"summon" | "book" | "history" | "quests" | "battle">("summon");
  const [muted, setMuted] = useState<boolean>(() => getMuteState());

  // UI helpers
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  const [currentResults, setCurrentResults] = useState<{ character: Character; isNew: boolean }[]>([]);
  const [showRatesModal, setShowRatesModal] = useState<boolean>(false);
  
  // Filtering for Book
  const [rarityFilter, setRarityFilter] = useState<string>("ALL");
  const [elementFilter, setElementFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quest achievements state (auto-tracked)
  const [claimedQuests, setClaimedQuests] = useState<string[]>(() => {
    const s = localStorage.getItem("gacha_claimed_quests");
    return s ? JSON.parse(s) : [];
  });



  // --- Sync storage ---
  useEffect(() => {
    localStorage.setItem("gacha_gems", gems.toString());
  }, [gems]);
  useEffect(() => {
    localStorage.setItem("gacha_tickets", tickets.toString());
  }, [tickets]);
  useEffect(() => {
    localStorage.setItem("gacha_gold", gold.toString());
  }, [gold]);
  useEffect(() => {
    localStorage.setItem("gacha_manaStars", manaStars.toString());
  }, [manaStars]);
  useEffect(() => {
    localStorage.setItem("gacha_collected", JSON.stringify(collectedChars));
  }, [collectedChars]);
  useEffect(() => {
    localStorage.setItem("gacha_history", JSON.stringify(pullHistory));
  }, [pullHistory]);
  useEffect(() => {
    localStorage.setItem("gacha_pity", pityCount.toString());
  }, [pityCount]);
  useEffect(() => {
    localStorage.setItem("gacha_claimed_quests", JSON.stringify(claimedQuests));
  }, [claimedQuests]);

  const toggleSound = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
    playClick();
  };

  // --- Real-time Gacha Pull Engine ---
  const executeSummons = (count: number) => {
    // Currency deduction
    let tempGems = gems;
    let tempTickets = tickets;

    if (count === 1) {
      if (tempTickets >= 1) {
        tempTickets -= 1;
      } else if (tempGems >= 150) {
        tempGems -= 150;
      } else {
        return; // Insufficient currencies
      }
    } else if (count === 10) {
      if (tempTickets >= 10) {
        tempTickets -= 10;
      } else if (tempGems >= 1500) {
        tempGems -= 1500;
      } else {
        return; // Insufficient currencies
      }
    }

    playPullStart();

    setGems(tempGems);
    setTickets(tempTickets);

    const newResults: { character: Character; isNew: boolean }[] = [];
    let updatedCollected = { ...collectedChars };
    const dateStr = new Date().toISOString();
    let currentPity = pityCount;
    let newStarsGranted = 0;
    let newGoldGranted = 0;

    const urPool = CHARACTERS.filter((c) => c.rarity === Rarity.UR);
    const ssrPool = CHARACTERS.filter((c) => c.rarity === Rarity.SSR);
    const srPool = CHARACTERS.filter((c) => c.rarity === Rarity.SR);
    const rPool = CHARACTERS.filter((c) => c.rarity === Rarity.R);

    for (let i = 0; i < count; i++) {
      currentPity += 1;
      let rolledRarity: Rarity = Rarity.R;

      // Pity system: Guaranteed UR at 80 pulls
      if (currentPity >= 80) {
        // Guaranteed UR
        rolledRarity = Rarity.UR;
        currentPity = 0; // reset
      } else {
        const rand = Math.random();
        if (rand < 0.012) { // 1.2% UR
          rolledRarity = Rarity.UR;
          currentPity = 0; // reset on UR pull
        } else if (rand < 0.012 + 0.038) { // 3.8% SSR (Cumulative 5%)
          rolledRarity = Rarity.SSR;
        } else if (rand < 0.012 + 0.038 + 0.15) { // 15% SR (Cumulative 20%)
          rolledRarity = Rarity.SR;
        } else {
          rolledRarity = Rarity.R;
        }
      }

      // Select character from rarity subclass
      let selectedPool = rPool;
      if (rolledRarity === Rarity.UR) selectedPool = urPool;
      if (rolledRarity === Rarity.SSR) selectedPool = ssrPool;
      if (rolledRarity === Rarity.SR) selectedPool = srPool;

      const randomChar = selectedPool[Math.floor(Math.random() * selectedPool.length)];
      const alreadyOwned = !!updatedCollected[randomChar.id];

      if (!alreadyOwned) {
        // Add fresh new character to inventory
        updatedCollected[randomChar.id] = {
          id: randomChar.id,
          level: 1,
          exp: 0,
          duplicateCount: 0,
          acquiredAt: dateStr,
          isFavorite: false,
        };
      } else {
        // Duplicate handling -> Convert to stats and grant 100 Mana Stars & 150 Gold!
        updatedCollected[randomChar.id].duplicateCount += 1;
        newStarsGranted += 100;
        newGoldGranted += 150;
      }

      newResults.push({
        character: randomChar,
        isNew: !alreadyOwned,
      });

      // Track into pull ledger histories
      const historyItem: PullHistoryItem = {
        id: Math.random().toString(36).slice(2, 9),
        characterId: randomChar.id,
        rolledAt: dateStr,
        rarity: randomChar.rarity,
        isNew: !alreadyOwned,
      };
      
      // Update state ledger in loop
      setPullHistory((prev) => [historyItem, ...prev].slice(0, 50)); // limit history log visual to recent 50 entries
    }

    setManaStars((prev) => prev + newStarsGranted);
    setGold((prev) => prev + newGoldGranted);
    setCollectedChars(updatedCollected);
    setPityCount(currentPity);

    // Launch beautiful summoning animations
    setCurrentResults(newResults);
    setShowAnimation(true);
  };



  // --- Quests & Milestones Calculations ---
  const questMilestones = useMemo(() => [
    {
      id: "Q01",
      title: "神秘の扉を開くもの",
      desc: "初めての召喚を完了する",
      target: 1,
      current: pullHistory.length,
      rewardType: "GEMS",
      rewardQty: 400,
    },
    {
      id: "Q02",
      title: "SSR以上の邂逅者",
      desc: "図鑑でURまたはSSRキャラを1名以上解放する",
      target: 1,
      current: Object.keys(collectedChars).filter((id) => {
        const c = CHARACTERS.find((ch) => ch.id === id);
        return c?.rarity === Rarity.UR || c?.rarity === Rarity.SSR;
      }).length,
      rewardType: "GEMS",
      rewardQty: 600,
    },
    {
      id: "Q03",
      title: "一人前の星使い",
      desc: "いずれかのキャラをレベル5以上にする",
      target: 1,
      current: (Object.values(collectedChars) as CollectedCharacter[]).some((item) => item.level >= 5) ? 1 : 0,
      rewardType: "STARS",
      rewardQty: 300,
    },
    {
      id: "Q04",
      title: "究極コレクターへの道",
      desc: "異なるキャラを計12名以上図鑑に登録する",
      target: 12,
      current: Object.keys(collectedChars).length,
      rewardType: "TICKETS",
      rewardQty: 5,
    },
    {
      id: "Q05",
      title: "大召喚祭の立役者",
      desc: "総召喚回数50回を突破する",
      target: 50,
      current: pullHistory.length,
      rewardType: "GEMS",
      rewardQty: 1500,
    }
  ], [pullHistory, collectedChars]);

  const claimQuestReward = (questId: string, type: string, qty: number) => {
    if (claimedQuests.includes(questId)) return;
    playCoin();
    
    if (type === "GEMS") setGems((prev) => prev + qty);
    if (type === "STARS") setManaStars((prev) => prev + qty);
    if (type === "TICKETS") setTickets((prev) => prev + qty);
    
    setClaimedQuests((prev) => [...prev, questId]);
  };

  // --- Level Up Handler inside modal ---
  const handleCharacterLevelUp = (charId: string, goldCost: number, starCost: number) => {
    if (gold < goldCost || manaStars < starCost) return;
    
    setGold((prev) => prev - goldCost);
    setManaStars((prev) => prev - starCost);

    setCollectedChars((prev) => {
      const updated = { ...prev };
      if (updated[charId]) {
        updated[charId].level += 1;
      }
      return updated;
    });
  };

  // --- Award Battle / Quest Rewards ---
  const handleAwardBattleRewards = (addGold: number, addStars: number, addGems: number, expGains: Record<string, number>) => {
    setGold((prev) => prev + addGold);
    setManaStars((prev) => prev + addStars);
    setGems((prev) => prev + addGems);

    setCollectedChars((prev) => {
      const updated = { ...prev };
      Object.entries(expGains).forEach(([charId, expValue]) => {
        if (updated[charId]) {
          const current = updated[charId];
          let nextExp = (current.exp || 0) + expValue;
          let nextLvl = current.level;
          
          // Cap level up at 100 max
          while (nextLvl < 100 && nextExp >= nextLvl * 100) {
            nextExp -= nextLvl * 100;
            nextLvl += 1;
          }
          
          updated[charId] = {
            ...current,
            level: nextLvl,
            exp: nextExp,
          };
        }
      });
      return updated;
    });
  };

  // Favorite toggle
  const handleToggleFavorite = (charId: string) => {
    setCollectedChars((prev) => {
      const updated = { ...prev };
      if (updated[charId]) {
        updated[charId].isFavorite = !updated[charId].isFavorite;
      }
      return updated;
    });
  };

  // --- Filtering & Searching for characters in the Book ---
  const filteredCharacters = useMemo(() => {
    return CHARACTERS.filter((c) => {
      const matchRarity = rarityFilter === "ALL" ? true : c.rarity === rarityFilter;
      const matchElement = elementFilter === "ALL" ? true : c.element === elementFilter;
      const matchSearch = searchQuery === "" ? true : (
        c.jpName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.jpTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchRarity && matchElement && matchSearch;
    });
  }, [rarityFilter, elementFilter, searchQuery]);

  // Overall database collection rate
  const completionPercentage = useMemo(() => {
    const totalCount = CHARACTERS.length;
    const unlockedCount = Object.keys(collectedChars).length;
    return totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  }, [collectedChars]);

  // Statistics
  const statsSummary = useMemo(() => {
    let totalPulls = pullHistory.length;
    let urPulls = pullHistory.filter((p) => p.rarity === Rarity.UR).length;
    let ssrPulls = pullHistory.filter((p) => p.rarity === Rarity.SSR).length;
    let srPulls = pullHistory.filter((p) => p.rarity === Rarity.SR).length;
    let rPulls = pullHistory.filter((p) => p.rarity === Rarity.R).length;

    return {
      totalPulls,
      urCount: urPulls,
      ssrCount: ssrPulls,
      srCount: srPulls,
      rCount: rPulls,
      pityTarget: 80,
    };
  }, [pullHistory]);

  const getElementBadgeIcon = (element: ElementType) => {
    switch (element) {
      case ElementType.FLAME: return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case ElementType.AQUA: return <Droplet className="w-3.5 h-3.5 text-blue-400" />;
      case ElementType.GALE: return <Wind className="w-3.5 h-3.5 text-emerald-400" />;
      case ElementType.TERRA: return <Shield className="w-3.5 h-3.5 text-amber-500" />;
      case ElementType.COSMOS: return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getRarityGlowClass = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.UR: return "border-amber-400/30 text-amber-300 shadow-[inset_0_0_10px_rgba(251,191,36,0.15)]";
      case Rarity.SSR: return "border-yellow-500/30 text-yellow-300 shadow-[inset_0_0_8px_rgba(234,179,8,0.1)]";
      case Rarity.SR: return "border-purple-500/30 text-purple-300";
      case Rarity.R: return "border-blue-500/30 text-blue-300";
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#dcfce7] via-[#f0fdf4] to-[#ccfbf1] min-h-screen text-slate-800 font-sans select-none relative flex items-center justify-center p-0 md:p-6 selection:bg-emerald-500/20 overflow-hidden">
      
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810b_1px,transparent_1px),linear-gradient(to_bottom,#10b9810b_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* 16:9 App-Device Container Frame (間延びを防ぎゲーム筐体のように見やすく統合) */}
      <div className="relative w-full max-w-6xl aspect-auto md:aspect-[16/9] md:h-[82vh] md:max-h-[820px] md:min-h-[640px] bg-white border-none md:border md:border-emerald-200/80 md:rounded-3xl md:shadow-[0_25px_65px_-12px_rgba(16,185,129,0.18)] flex flex-col overflow-hidden animate-fade-in z-10">
        
        {/* Dynamic Background Inner Mesh */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#eefaf2] via-[#f3fdf6] to-[#e1f5e8] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98112_1px,transparent_1px),linear-gradient(to_bottom,#10b98112_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60 m-0" />

        {/* STICKY CURRENCY HEADER */}
        <header className="relative z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-wrap justify-between items-center gap-3">
          
          {/* Logo & Total SUMMONS count */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-green-450 to-teal-600 flex items-center justify-center text-white font-bold tracking-tight shadow-md shadow-emerald-550/20">
              <Bird className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-850 leading-none">草原の鳥霊召喚儀</h1>
              <span className="text-[10px] text-emerald-650 font-mono font-bold">CELESTIAL BIRD COLLECTOR</span>
            </div>
          </div>

          {/* Currencies stats pill line */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            
            {/* Direct FREE GEMS claim button */}
            <button
              onClick={() => {
                playCoin();
                setGems((prev) => prev + 5000);
              }}
              className="bg-amber-100 hover:bg-amber-200 active:scale-95 border border-amber-300 hover:border-amber-400 text-amber-800 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm transition duration-150 cursor-pointer animate-pulse"
              title="ジェムを5,000個もらう"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>GEMSをもらう (+5k)</span>
            </button>

            {/* Total Pull Counter */}
            <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-400 font-bold leading-none">TOTAL SUMMON</span>
                <span className="text-xs font-mono font-bold text-slate-700">{pullHistory.length} 回</span>
              </div>
            </div>

            {/* Silver Gold */}
            <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm" title="ゴールド 🪙 (Coreクリックやダブリ召喚で獲得)">
              <span className="text-sm">🪙</span>
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-400 font-bold leading-none">GOLD</span>
                <span className="text-xs font-mono font-bold text-yellow-600">{gold.toLocaleString()}</span>
              </div>
            </div>

            {/* Special Summon Ticket */}
            <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm" title="召喚チケット 🎟️ (1枚で1連ガチャ)">
              <span className="text-sm">🎟️</span>
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-400 font-bold leading-none">TICKET</span>
                <span className="text-xs font-mono font-bold text-sky-500">{tickets}</span>
              </div>
              <button 
                onClick={() => {
                  if (gems >= 150) {
                    playCoin();
                    setGems(g => g - 150);
                    setTickets(t => t + 1);
                  }
                }} 
                disabled={gems < 150}
                className="ml-1 p-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-600 disabled:opacity-40 transition"
                title="150💎でチケット1枚購入"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Gems */}
            <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm" title="ジェム 💎 (150個で1連、1500個で10連召喚)">
              <span className="text-sm">💎</span>
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-400 font-bold leading-none">GEMS</span>
                <span className="text-xs font-mono font-bold text-amber-600">{gems.toLocaleString()}</span>
              </div>
            </div>

            {/* Mana Stars */}
            <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm" title="マナ星 ✨ (キャラクターレベルアップ用、ダブリ召喚で獲得)">
              <span className="text-sm">✨</span>
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-400 font-bold leading-none">MANA STARS</span>
                <span className="text-xs font-mono font-bold text-emerald-600">{manaStars}</span>
              </div>
            </div>

            {/* Mute controller Toggle */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border transition ${
                muted 
                  ? "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600" 
                  : "bg-emerald-50 border-emerald-150 text-emerald-600 hover:bg-emerald-100"
              }`}
              title={muted ? "サウンドをミュート解除" : "サウンドをミュート"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

          </div>

        </div>
      </header>

      {/* CENTRALIZED INTERACTION SHELF */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden px-4 md:px-6 py-4 max-w-5xl mx-auto w-full min-h-0">

        {/* TAB SWITCH HEADER */}
        <div className="flex border-b border-emerald-100 mb-4 font-semibold overflow-x-auto select-none gap-2 shrink-0">
          
          <button
            onClick={() => { playClick(); setActiveTab("summon"); }}
            className={`py-3 px-5 border-b-2 text-xs flex items-center gap-2 tracking-wider uppercase transition cursor-pointer ${
              activeTab === "summon" 
                ? "border-emerald-500 text-emerald-700 font-extrabold bg-emerald-50/60" 
                : "border-transparent text-slate-550 hover:text-emerald-755"
            }`}
          >
            <Bird className="w-4 h-4 text-emerald-600" /> 小鳥の召喚
          </button>

          <button
            onClick={() => { playClick(); setActiveTab("book"); }}
            className={`py-3 px-5 border-b-2 text-xs flex items-center gap-2 tracking-wider uppercase transition cursor-pointer ${
              activeTab === "book" 
                ? "border-emerald-500 text-emerald-700 font-extrabold bg-emerald-50/60" 
                : "border-transparent text-slate-550 hover:text-emerald-755"
            }`}
          >
            <Feather className="w-4 h-4 text-emerald-600" /> 鳥霊図鑑
          </button>

          <button
            onClick={() => { playClick(); setActiveTab("history"); }}
            className={`py-3 px-5 border-b-2 text-xs flex items-center gap-2 tracking-wider uppercase transition cursor-pointer ${
              activeTab === "history" 
                ? "border-emerald-500 text-emerald-700 font-extrabold bg-emerald-50/60" 
                : "border-transparent text-slate-550 hover:text-emerald-755"
            }`}
          >
            <History className="w-4 h-4 text-slate-500" /> 観測ログと統計
          </button>

          <button
            onClick={() => { playClick(); setActiveTab("quests"); }}
            className={`py-3 px-5 border-b-2 text-xs flex items-center gap-2 tracking-wider transition cursor-pointer ${
              activeTab === "quests" 
                ? "border-emerald-500 text-emerald-700 font-extrabold bg-emerald-50/60" 
                : "border-transparent text-slate-550 hover:text-emerald-755"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-550 animate-pulse" /> 任務とマナ星設定
          </button>

          <button
            onClick={() => { playClick(); setActiveTab("battle"); }}
            className={`py-3 px-5 border-b-2 text-xs flex items-center gap-2 tracking-wider transition cursor-pointer ${
              activeTab === "battle" 
                ? "border-emerald-500 text-emerald-700 font-extrabold bg-emerald-50/60" 
                : "border-transparent text-slate-550 hover:text-emerald-755"
            }`}
          >
            <Swords className="w-4 h-4 text-emerald-600 animate-pulse" /> 天敵討伐
          </button>
        </div>

        {/* ======================================= */}
        {/*            TAB 1: SUMMON GACHA          */}
        {/* ======================================= */}
        {activeTab === "summon" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-y-auto flex-1 min-h-0 pr-1 select-none pb-4">
            
            {/* Gacha summoning portal controller */}
            <div className="lg:col-span-2 bg-white border border-slate-200/85 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden h-[460px] shadow-sm">
              
              {/* Star backdrop glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12)_0%,transparent_50%)] pointer-events-none" />

              <div className="z-10">
                <span className="text-[10px] text-emerald-600 tracking-widest font-mono font-bold uppercase p-1 bg-emerald-50 border border-emerald-100 rounded px-2">
                  CURRENT MEADOW BANNER
                </span>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-3">草原のとり霊召喚</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  緑深き草原に集う神秘の小鳥たち。最高レアURの不死鳥「スザク」や「ヨル」をはじめとする、色とりどりの個性豊かな鳥たちの召喚陣です！
                </p>
              </div>

              {/* Mystical Astral Circle visual mapping */}
              <div className="relative w-40 h-40 md:w-48 md:h-48 my-4 flex items-center justify-center z-10">
                <div className="absolute inset-0 border border-dashed border-emerald-500/25 rounded-full animate-spin" style={{ animationDuration: "20s" }} />
                <div className="absolute inset-2 border-2 border-dotted border-green-500/15 rounded-full animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
                <div className="absolute inset-6 bg-emerald-500/8 blur-xl rounded-full" />
                <Bird className="w-16 h-16 text-emerald-650 drop-shadow-[0_2px_12px_rgba(16,185,129,0.2)] animate-bounce" />
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-sm flex flex-col sm:flex-row gap-3 z-10">
                
                {/* 1 Summon */}
                <button
                  onClick={() => executeSummons(1)}
                  disabled={tickets < 1 && gems < 150}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 shadow-xs flex flex-col items-center justify-center cursor-pointer"
                >
                  <span>1回召喚</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    {tickets >= 1 ? (
                      <span className="text-sky-600 font-mono font-extrabold">🎟️ 1 枚</span>
                    ) : (
                      <span className="text-amber-600 font-mono font-extrabold">💎 150</span>
                    )}
                  </div>
                </button>

                {/* 10 Summon */}
                <button
                  onClick={() => executeSummons(10)}
                  disabled={tickets < 10 && gems < 1500}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-450 hover:to-indigo-550 text-white disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 shadow-md hover:shadow-sky-500/15 flex flex-col items-center justify-center cursor-pointer"
                >
                  <span className="flex items-center gap-1">10回召喚</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-white/95">
                    {tickets >= 10 ? (
                      <span className="font-mono text-white/90 font-bold">🎟️ 10 枚</span>
                    ) : (
                      <span className="font-mono text-yellow-200 font-bold">💎 1,500</span>
                    )}
                  </div>
                </button>

              </div>

              {/* Pity tracker footer */}
              <div className="mt-2 text-[10px] text-slate-400 font-mono z-10">
                <span>天井カウンター: <strong className="text-slate-600">{pityCount} / 80</strong> (あと <strong className="text-emerald-600">{80 - pityCount}回</strong> で<strong className="text-amber-600 font-bold">UR確定</strong>)</span>
              </div>

            </div>

            {/* Sidebar quick stat / latest roster unlocked */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex-1 flex flex-col justify-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> 特典と情報の確認
                </h4>

                <button
                  onClick={() => { playClick(); setShowRatesModal(true); }}
                  className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-450 hover:to-green-550 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-emerald-500/15 transition duration-150 flex items-center justify-center gap-2 cursor-pointer mb-4"
                >
                  <TrendingUp className="w-4 h-4 shadow-sm" />
                  <span>召喚確率テーブルを表示</span>
                </button>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[10px] text-slate-500 leading-relaxed mb-4">
                  <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-sky-505" /> 天井カウントのルール
                  </div>
                  79回連続で最高レア度が出現しなかった場合、80回目の召喚時に自動的に最高レア「UR」のキャラクターが100%確定出現します。URが出現した時点でカウンターはゼロにリセットされます。
                </div>
              </div>

              {/* Latest unlock character card banner preview */}
              <div className="mt-5 pt-4 border-t border-slate-150">
                <span className="text-[10px] text-slate-400 font-mono tracking-widest block mb-2">FAVORITE CHAMPION</span>
                {(Object.values(collectedChars) as CollectedCharacter[]).some(x => x.isFavorite) ? (
                  (() => {
                    const favItem = (Object.values(collectedChars) as CollectedCharacter[]).find(x => x.isFavorite)!;
                    const char = CHARACTERS.find(c => c.id === favItem.id)!;
                    return (
                      <div 
                        onClick={() => { playClick(); setSelectedChar(char); }}
                        className="p-3.5 bg-slate-50 border border-slate-150 hover:bg-slate-100 hover:border-slate-350 rounded-xl flex items-center justify-between cursor-pointer transition group shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-205 flex items-center justify-center text-rose-500 group-hover:scale-105 transition shadow-xs">
                            <CharIcon name={char.iconName} className="w-5 h-5" charId={char.id} jpName={char.jpName} element={char.element} />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-mono font-bold block">{char.jpTitle}</span>
                            <h5 className="text-xs font-bold text-slate-705 group-hover:text-rose-500 transition">{char.jpName}</h5>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-mono">LV.{favItem.level}</span>
                          <span className="text-[9px] text-rose-500 font-bold">♥ FAV</span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    図鑑でお気に入りのキャラクターにお気に入り「♥」を設定すると、ここに常駐表示されます。
                  </p>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ======================================= */}
        {/*            TAB 2: CHARACTER BOOK        */}
        {/* ======================================= */}
        {activeTab === "book" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col flex-1 min-h-0 overflow-hidden select-none">
            
            {/* COMPACT PROGRESS AND RATE GLIMPSE HEADER */}
            <div className="bg-white border border-emerald-150/60 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-150 flex flex-col items-center justify-center font-mono text-[9px] font-bold text-slate-700 shrink-0">
                  <span className="text-[7px] text-emerald-600 font-bold leading-none">登録率</span>
                  <span className="text-xs text-emerald-700 font-bold mt-0.5">{completionPercentage}%</span>
                </div>
                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">小鳥の図鑑収集進捗</h2>
                  <p className="text-xs font-bold text-slate-750 mt-0.5">
                    {Object.keys(collectedChars).length} <span className="text-slate-350 font-normal">/</span> {CHARACTERS.length} 羽の鳥霊を観測
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-xs sm:max-w-sm w-full">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-450 to-green-550 transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filters Shelf */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-4 flex flex-col md:flex-row flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
              
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-bold text-slate-705">フィルター絞り込み:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* Search query input */}
                <input 
                  type="text"
                  placeholder="名前やタイトルで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:border-sky-500 text-xs px-3 py-1.5 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none w-full sm:w-44 font-medium transition"
                />

                {/* Rarity selector */}
                <select 
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-lg text-slate-600 cursor-pointer focus:outline-none focus:border-sky-500 font-medium transition"
                >
                  <option value="ALL">全てのレアリティ</option>
                  <option value={Rarity.UR}>UR</option>
                  <option value={Rarity.SSR}>SSR</option>
                  <option value={Rarity.SR}>SR</option>
                  <option value={Rarity.R}>R</option>
                </select>

                {/* Element selector */}
                <select 
                  value={elementFilter}
                  onChange={(e) => setElementFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-lg text-slate-605 cursor-pointer focus:outline-none focus:border-sky-500 font-medium transition"
                >
                  <option value="ALL">全ての属性</option>
                  <option value={ElementType.COSMOS}>星幽</option>
                  <option value={ElementType.FLAME}>火霊</option>
                  <option value={ElementType.AQUA}>水精</option>
                  <option value={ElementType.GALE}>翠嵐</option>
                  <option value={ElementType.TERRA}>地王</option>
                </select>
              </div>

              {/* Reset filter */}
              <button 
                onClick={() => { playClick(); setRarityFilter("ALL"); setElementFilter("ALL"); setSearchQuery(""); }}
                className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1 underline decoration-slate-200 hover:decoration-slate-550 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> フィルター初期化
              </button>

            </div>

            {/* Grid of database book with clean list scroll wrapper */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0 pb-4">
              {filteredCharacters.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <QuestionIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-400 font-mono">NO CHARACTERS MATCH</h4>
                  <p className="text-xs text-slate-500 mt-1">指定条件に合致するキャラクターが図鑑に見つかりませんでした。</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredCharacters.map((char) => {
                    const collectedItem = collectedChars[char.id];
                    const isUnlocked = !!collectedItem;
                    const glowClass = isUnlocked ? getRarityGlowClass(char.rarity) : "border-slate-100 text-slate-400";
                    
                    return (
                      <div
                        key={char.id}
                        onClick={() => {
                          playClick();
                          setSelectedChar(char);
                        }}
                        className={`relative p-3.5 border rounded-2xl flex flex-col items-center justify-between bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 group overflow-hidden ${
                          isUnlocked ? "opacity-100 hover:scale-[1.03]" : "opacity-50 hover:opacity-70 bg-slate-50/50"
                        } ${glowClass}`}
                      >
                        {/* Favorite star */}
                        {isUnlocked && collectedItem.isFavorite && (
                          <div className="absolute top-2 left-2 text-rose-500 z-10 animate-pulse">
                            <Heart className="w-3.5 h-3.5 fill-rose-500" />
                          </div>
                        )}

                        {/* Floating metadata elements */}
                        <div className="absolute top-2.5 right-2 flex items-center gap-1 select-none pointer-events-none">
                          <span className="text-[8px] bg-slate-100 border border-slate-200/60 px-1 rounded text-slate-500 font-mono font-bold leading-none py-0.5">{char.rarity}</span>
                          {isUnlocked && (
                            <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200/60 flex items-center justify-center font-mono text-[8px] font-bold text-slate-600">
                              {collectedItem.level}
                            </div>
                          )}
                        </div>

                        {/* Icon */}
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-600 my-4 shadow-xs group-hover:scale-110 transition duration-150">
                          <CharIcon name={char.iconName} className="w-5 h-5 text-slate-500" charId={char.id} jpName={char.jpName} element={char.element} />
                        </div>

                        {/* Info lines */}
                        <div className="text-center w-full">
                          <span className="text-[8px] text-slate-400 font-medium truncate block leading-none mb-1">
                            {char.jpTitle}
                          </span>
                          <h4 className="text-xs font-bold text-slate-700 truncate group-hover:text-sky-655 transition">
                            {char.jpName}
                          </h4>
                          <span className="text-[8px] text-slate-400 font-mono truncate block mt-0.5 max-w-full">
                            {char.name}
                          </span>
                        </div>

                        {/* Locked visual indicator */}
                        {!isUnlocked && (
                          <div className="mt-2 text-[8px] font-bold text-slate-400 uppercase flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                            LOCKED 🔒
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/*       TAB 3: LEDGER AND STATISTICS      */}
        {/* ======================================= */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-y-auto flex-1 min-h-0 pr-1 pb-4 select-none">
            
            {/* Stats Dashboard */}
            <div className="space-y-4 md:col-span-1">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-550 mb-4 flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-indigo-500" /> 召喚統計情報
                </h4>

                <div className="space-y-3 font-mono">
                  
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">総召喚回数</span>
                    <span className="font-bold text-slate-705">{statsSummary.totalPulls} 回</span>
                  </div>

                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                    <span className="text-amber-600 font-bold">UR 召喚数</span>
                    <span className="font-bold text-amber-600">{statsSummary.urCount} ({statsSummary.totalPulls > 0 ? ((statsSummary.urCount / statsSummary.totalPulls)*100).toFixed(1) : 0}%)</span>
                  </div>

                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                    <span className="text-yellow-600 font-bold">SSR 召喚数</span>
                    <span className="font-bold text-yellow-650">{statsSummary.ssrCount} ({statsSummary.totalPulls > 0 ? ((statsSummary.ssrCount / statsSummary.totalPulls)*100).toFixed(1) : 0}%)</span>
                  </div>

                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                    <span className="text-purple-600 font-bold">SR 召喚数</span>
                    <span className="font-bold text-purple-650">{statsSummary.srCount} ({statsSummary.totalPulls > 0 ? ((statsSummary.srCount / statsSummary.totalPulls)*100).toFixed(1) : 0}%)</span>
                  </div>

                  <div className="flex justify-between text-xs py-1.5">
                    <span className="text-blue-600 font-bold">R 召喚数</span>
                    <span className="font-bold text-blue-650">{statsSummary.rCount} ({statsSummary.totalPulls > 0 ? ((statsSummary.rCount / statsSummary.totalPulls)*100).toFixed(1) : 0}%)</span>
                  </div>

                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 mt-5 text-[10px] text-slate-500 flex flex-col gap-1.5 w-full">
                  <div className="font-bold text-slate-755">星晶変換システムのルール</div>
                  すでに所持しているアルカナが重複して出現した場合、自動的に「マナ星 ✨ +100」および「ゴールド 🪙 +150」に置換還元され、さらにキャラ上限突破用の「ダブり素体」が+1累積蓄積されます。
                </div>
              </div>
            </div>

            {/* Pull Ledger timeline (recent 50 entries) */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[400px] shadow-sm">
              
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-500" /> 最新召喚監査ログ <span className="font-mono text-slate-400 font-normal">(近年の履歴50件)</span>
                </h4>
                {pullHistory.length > 0 && (
                  <button 
                    onClick={() => {
                      if(window.confirm("召喚履歴ログを消去しますか？（通貨や登録済図鑑はリセットされません）")) {
                        setPullHistory([]);
                        playClick();
                      }
                    }}
                    className="text-[9px] text-rose-500 hover:text-rose-700 border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold rounded cursor-pointer transition shadow-xs"
                  >
                    ログ消去
                  </button>
                )}
              </div>

              {pullHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 text-center">
                  <QuestionIcon className="w-8 h-8 text-slate-300 mb-2" />
                  <span className="text-xs text-slate-400">召喚ログはまだ空です。ガチャを引くとここに時系列で蓄積されます。</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {pullHistory.map((item) => {
                    const char = CHARACTERS.find((c) => c.id === item.characterId);
                    if (!char) return null;

                    // Color tags by rarity
                    let badgeColor = "text-blue-600 border-blue-200 bg-blue-50/70";
                    if (item.rarity === Rarity.UR) badgeColor = "text-amber-700 border-amber-250 bg-amber-50 font-extrabold";
                    if (item.rarity === Rarity.SSR) badgeColor = "text-yellow-700 border-yellow-250 bg-yellow-50 font-extrabold";
                    if (item.rarity === Rarity.SR) badgeColor = "text-purple-600 border-purple-200 bg-purple-50";

                    return (
                      <div 
                        key={item.id}
                        className="p-2.5 bg-slate-50 border border-slate-150 hover:bg-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono transition shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Small icon */}
                          <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-xs">
                            <CharIcon name={char.iconName} className="w-3.5 h-3.5" charId={char.id} jpName={char.jpName} element={char.element} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 h-4">
                              <span className="text-xs font-bold text-slate-700 line-clamp-1">{char.jpName}</span>
                              {item.isNew && (
                                <span className="px-1.5 py-px rounded bg-rose-500 text-white font-mono text-[7px] font-black tracking-widest scale-90 leading-none">NEW</span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 truncate block mt-0.5">{char.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[9px] border ${badgeColor}`}>
                            {item.rarity}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(item.rolledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        )}

        {/* ======================================= */}
        {/*     TAB 4: CELESTIAL CLICKER QUESTS     */}
        {/* ======================================= */}
        {activeTab === "quests" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-y-auto flex-1 min-h-0 pr-1 pb-4 select-none">
            
            {/* Achievements Milestones */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-550 mb-4 flex items-center gap-1.5 font-mono">
                <Award className="w-4 h-4 text-amber-500" /> 実績任務
              </h4>

              <div className="space-y-3.5">
                {questMilestones.map((quest) => {
                  const isCompleted = quest.current >= quest.target;
                  const isClaimed = claimedQuests.includes(quest.id);

                  return (
                    <div 
                      key={quest.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                        isClaimed 
                          ? "bg-slate-50/50 border-slate-100 opacity-60" 
                          : isCompleted 
                            ? "bg-emerald-50/70 border-emerald-250" 
                            : "bg-slate-50 border-slate-150"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-800">{quest.title}</h5>
                          {isClaimed ? (
                            <span className="text-[9px] bg-slate-105 text-slate-400 border border-slate-200 font-bold px-1.5 py-0.5 rounded uppercase leading-none font-mono">受領済</span>
                          ) : isCompleted ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded uppercase leading-none font-mono">達成！</span>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-400 border border-slate-205 font-bold px-1.5 py-0.5 rounded uppercase leading-none font-mono">進行中</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{quest.desc}</p>
                        
                        {/* Progressive line bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/80">
                            <div 
                              className="h-full bg-sky-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-455 font-mono">
                            {quest.current} / {quest.target}
                          </span>
                        </div>
                      </div>

                      {/* Reward Claim button action */}
                      <div className="shrink-0">
                        <button
                          disabled={!isCompleted || isClaimed}
                          onClick={() => claimQuestReward(quest.id, quest.rewardType, quest.rewardQty)}
                          className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition duration-150 cursor-pointer ${
                            isClaimed 
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                              : isCompleted 
                                ? "bg-amber-500 hover:bg-amber-450 text-slate-900 shadow shadow-amber-100 font-extrabold" 
                                : "bg-slate-100 text-slate-400 border border-slate-150 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          報酬受取: 
                          {quest.rewardType === "GEMS" && <span className="font-mono font-bold text-slate-800">💎+{quest.rewardQty}</span>}
                          {quest.rewardType === "STARS" && <span className="font-mono font-bold text-emerald-600">✨+{quest.rewardQty}</span>}
                          {quest.rewardType === "TICKETS" && <span className="font-mono font-bold text-sky-600">🎟️+{quest.rewardQty}</span>}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {activeTab === "battle" && (
          <BattleSystem
            collectedChars={collectedChars}
            gold={gold}
            manaStars={manaStars}
            gems={gems}
            onAwardRewards={handleAwardBattleRewards}
          />
        )}

      </main>

      {/* --- FLOATING GACHA SUMMON OVERLAY PORTAL --- */}
      {showAnimation && (
        <GachaPullAnimation
          key={currentResults.map(r => r.character.id).join("-") + currentResults.length}
          results={currentResults}
          onComplete={() => {
            setShowAnimation(false);
            setCurrentResults([]);
          }}
          onReSummon={(count) => {
            executeSummons(count);
          }}
          gems={gems}
          tickets={tickets}
        />
      )}

      {/* --- FLOATING DEEP DETAIL EXPLORER DRAWER --- */}
      {selectedChar && (
        <CharacterDetailModal
          character={selectedChar}
          collectedInfo={collectedChars[selectedChar.id]}
          manaStars={manaStars}
          gold={gold}
          onClose={() => setSelectedChar(null)}
          onLevelUp={handleCharacterLevelUp}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* --- PROBABILITY RATES MODAL TABLE --- */}
      {showRatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
          <div className="bg-neutral-900 border border-neutral-850 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/40">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" /> 召喚確率 & 特典詳細
              </h3>
              <button 
                onClick={() => { playClick(); setShowRatesModal(false); }}
                className="text-neutral-400 hover:text-white px-2 py-1 text-xs border border-transparent hover:border-neutral-700 bg-neutral-800 hover:bg-neutral-850 rounded"
              >
                閉じる
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold text-neutral-300 uppercase mb-2">基本提供確率</h4>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between p-2 bg-neutral-950 rounded">
                    <span className="text-amber-300">UR (キジ、オオワシ、イヌワシ、シマフクロウ等)</span>
                    <span className="font-bold">1.2 %</span>
                  </div>
                  <div className="flex justify-between p-2 bg-neutral-250/20 bg-neutral-950 rounded">
                    <span className="text-yellow-400">SSR (トキ、ハヤブサ、カワセミ、ライチョウ等)</span>
                    <span className="font-bold">3.8 %</span>
                  </div>
                  <div className="flex justify-between p-2 bg-neutral-950 rounded">
                    <span className="text-purple-400">SR (ベニマシコ、コサギ、ヒバリ、ヤマガラ等)</span>
                    <span className="font-bold">15.0 %</span>
                  </div>
                  <div className="flex justify-between p-2 bg-neutral-950 rounded">
                    <span className="text-blue-400">R (シマエナガ、ウグイス、カルガモ、スズメ等)</span>
                    <span className="font-bold">80.0 %</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-300 uppercase mb-2">重複キャラクターの還元仕様</h4>
                <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-950 p-2.5 rounded border border-neutral-850">
                  すでに図鑑に登録しているキャラクターを再度召喚した場合、自動的にそのキャラクターは以下に変換されます：<br />
                  <strong className="text-white">・マナ星 (Mana Stars) ✨ +100</strong><br />
                  <strong className="text-white">・ゴールド (Gold) 🪙 +150</strong><br />
                  <strong className="text-white">・対象キャラクターの「ダブり所持数」 +1個（上限解放用素材）</strong><br />
                  <span className="text-neutral-500 block mt-1.5 text-[9px]">※ 還元された「マナ星」と「ゴールド」は、図鑑で該当キャラを「強化（レベルアップ）」させてステータス（ATK・HP・DEF）を恒久的に伸ばすために使用します。</span>
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-300 uppercase mb-2">全収録キャラクターリスト</h4>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-neutral-950 p-2 rounded border border-neutral-850">
                  {CHARACTERS.map((char) => (
                    <div key={char.id} className="flex justify-between text-[10px] py-1 border-b border-neutral-900 last:border-0 px-1 font-mono">
                      <span className="text-neutral-400">{char.jpName} ({char.name})</span>
                      <span className={`font-bold ${
                        char.rarity === Rarity.UR ? "text-amber-300" :
                        char.rarity === Rarity.SSR ? "text-yellow-400" :
                        char.rarity === Rarity.SR ? "text-purple-400" : "text-blue-400"
                      }`}>{char.rarity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto py-3 border-t border-emerald-150/60 bg-slate-50/90 text-center text-[10px] text-emerald-800/60 select-none shrink-0 z-20">
        <p className="font-mono text-[9px]">Celestial Bird Gacha and Predator Defense Simulator v2.2.0</p>
        <p className="mt-0.5 text-[8px]">草原の鳥霊召喚 & 天敵討伐 16:9 快適レスポンシブモード</p>
      </footer>

      </div> {/* 16:9 Inner Container wrap closure */}

    </div>
  );
}
