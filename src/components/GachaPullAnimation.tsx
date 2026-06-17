/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Character, Rarity } from "../types";
import { CharIcon } from "./CharIcon";
import { playReveal, playCoin } from "../utils/audio";
import { Sparkles, Trophy, RotateCcw, ArrowRight, ShieldCheck, Zap, Sparkle, Orbit } from "lucide-react";

interface GachaPullAnimationProps {
  results: { character: Character; isNew: boolean }[];
  onComplete: () => void;
  onReSummon?: (count: number) => void;
  gems: number;
  tickets: number;
  isAuto?: boolean;
  onStopAuto?: () => void;
}

export const GachaPullAnimation: React.FC<GachaPullAnimationProps> = ({
  results,
  onComplete,
  onReSummon,
  gems,
  tickets,
  isAuto = false,
  onStopAuto,
}) => {
  const [phase, setPhase] = useState<"portal" | "reveal" | "summary">("portal");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [historyOfFlips, setHistoryOfFlips] = useState<{ character: Character; isNew: boolean; flipped: boolean }[]>(
    results.map((r) => ({ ...r, flipped: false }))
  );
  const [autoCountdown, setAutoCountdown] = useState<number>(2); // 2秒のカウントダウン（スキップテンポ改善）

  // Find the highest rarity in the summon results to drive the connection screen loading effect
  const getHighestRarityInResults = (): Rarity => {
    const rarities = results.map((r) => r.character.rarity);
    if (rarities.includes(Rarity.UR)) return Rarity.UR;
    if (rarities.includes(Rarity.SSR)) return Rarity.SSR;
    if (rarities.includes(Rarity.SR)) return Rarity.SR;
    return Rarity.R;
  };

  const highestRarity = getHighestRarityInResults();

  const getPortalTheme = (rarityVal: Rarity) => {
    switch (rarityVal) {
      case Rarity.UR:
        return {
          bgGlow: "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.22)_0%,transparent_75%)]",
          outerRing: "border-2 border-dashed border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5)]",
          midRing: "border border-dotted border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]",
          coreStar: "absolute w-28 h-28 bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 blur-2xl opacity-80 rounded-full",
          orbitIconClass: "text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.95)] scale-[1.12]",
          textClass: "text-amber-300 font-extrabold tracking-widest drop-shadow-[0_0_12px_rgba(251,191,36,0.7)] text-sm sm:text-base",
          message: "【※極彩の神託】霊界深淵（UR級）と極大特異共鳴中...",
          portalSubText: "虹色に揺らめく時空の歪みから、究極の存在が応じようとしています！",
          additionalStars: true,
        };
      case Rarity.SSR:
        return {
          bgGlow: "bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15)_0%,transparent_70%)]",
          outerRing: "border-2 border-dashed border-yellow-400/70 shadow-[0_0_25px_rgba(234,179,8,0.4)]",
          midRing: "border border-dotted border-orange-400/60 shadow-[0_0_12px_rgba(249,115,22,0.2)]",
          coreStar: "absolute w-24 h-24 bg-yellow-500/35 blur-xl opacity-75 rounded-full",
          orbitIconClass: "text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.75)] scale-[1.06]",
          textClass: "text-yellow-300 font-bold tracking-wider drop-shadow-[0_0_8px_rgba(234,179,8,0.45)] text-sm",
          message: "【強魔力感知】高位星霊（SSR級）の顕現準備中...",
          portalSubText: "黄金に輝く魔力の波動が周囲の空間を満たしています！",
          additionalStars: false,
        };
      case Rarity.SR:
        return {
          bgGlow: "bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12)_0%,transparent_70%)]",
          outerRing: "border-2 border-dashed border-purple-500/60 shadow-[0_0_18px_rgba(168,85,247,0.3)]",
          midRing: "border border-dotted border-indigo-400/50",
          coreStar: "absolute w-22 h-22 bg-purple-500/30 blur-xl opacity-65 rounded-full",
          orbitIconClass: "text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.55)]",
          textClass: "text-purple-400 font-bold tracking-wider text-xs sm:text-sm",
          message: "【魔気上昇】星霊界（SR級以上）との共鳴を確認...",
          portalSubText: "紫光を帯びた魔力がポータルを活性化させています",
          additionalStars: false,
        };
      case Rarity.R:
      default:
        return {
          bgGlow: "bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.06)_0%,transparent_70%)]",
          outerRing: "border-2 border-dashed border-sky-500/40",
          midRing: "border border-dotted border-purple-500/40",
          coreStar: "absolute w-20 h-20 bg-sky-500/20 blur-xl opacity-50 rounded-full",
          orbitIconClass: "text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]",
          textClass: "text-sky-400 font-medium tracking-widest text-xs",
          message: "アルカナ星霊界への接続中...",
          portalSubText: "通常空間を拡張し、星霊の呼びかけをキャッチしています",
          additionalStars: false,
        };
    }
  };

  const portalTheme = getPortalTheme(highestRarity);

  // Portal automatic transition
  useEffect(() => {
    const duration = isAuto ? 1000 : 1800; // オート時は1.0秒に短縮
    const timer = setTimeout(() => {
      setPhase((currentPhase) => {
        if (currentPhase === "portal") {
          if (isAuto) {
            // オート時は個別カードめくりをスキップして即サマリーへ
            const updated = historyOfFlips.map((item) => ({ ...item, flipped: true }));
            setHistoryOfFlips(updated);
            playCoin();
            return "summary";
          }
          triggerCardReveal(0);
          return "reveal";
        }
        return currentPhase;
      });
    }, duration);
    return () => clearTimeout(timer);
  }, [isAuto]);

  // オート連続召喚のループ制御・カウントダウン処理
  const hasUR = results.some(r => r.character.rarity === Rarity.UR);
  const canAffordNext = results.length === 1 
    ? (tickets >= 1 || gems >= 150)
    : (tickets >= 10 || gems >= 1500);

  useEffect(() => {
    if (!isAuto || phase !== "summary") return;

    if (hasUR) {
      // URが排出されたので即時オート停止
      onStopAuto?.();
      return;
    }

    if (!canAffordNext) {
      // リソース不足でオート停止
      onStopAuto?.();
      return;
    }

    if (autoCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // カウントダウンが0になったら次の召喚を自動でキック！
      if (onReSummon) {
        onReSummon(results.length);
      }
    }
  }, [isAuto, phase, autoCountdown, hasUR, canAffordNext]);

  const triggerCardReveal = (index: number) => {
    setIsFlipped(false);
    setTimeout(() => {
      setIsFlipped(true);
      const updated = [...historyOfFlips];
      updated[index].flipped = true;
      setHistoryOfFlips(updated);
      
      // Play specific synth sound for this rarity
      playReveal(results[index].character.rarity);
    }, 300);
  };

  const handleNextReveal = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex((p) => p + 1);
      triggerCardReveal(currentIndex + 1);
    } else {
      setPhase("summary");
      playCoin();
    }
  };

  const skipAll = () => {
    const updated = historyOfFlips.map((item) => ({ ...item, flipped: true }));
    setHistoryOfFlips(updated);
    setPhase("summary");
    playCoin();
  };

  const getCurrentRarityStyling = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.UR:
        return {
          textColor: "text-amber-300 font-extrabold tracking-wider",
          glow: "shadow-[0_0_35px_rgba(253,224,71,0.5)] border-amber-400 bg-gradient-to-b from-neutral-900 via-amber-950/20 to-neutral-950",
          accentColor: "#facc15",
          badge: "bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500 text-white font-black",
          textGlow: "text-amber-200 drop-shadow-[0_2px_8px_rgba(250,204,21,0.5)]",
          stars: 5,
        };
      case Rarity.SSR:
        return {
          textColor: "text-amber-400 font-bold",
          glow: "shadow-[0_0_25px_rgba(234,179,8,0.4)] border-yellow-500 bg-gradient-to-b from-neutral-900 via-yellow-950/20 to-neutral-950",
          accentColor: "#eab308",
          badge: "bg-yellow-500 text-neutral-950 font-bold",
          textGlow: "text-yellow-300 drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)]",
          stars: 4,
        };
      case Rarity.SR:
        return {
          textColor: "text-purple-400 font-semibold",
          glow: "shadow-[0_0_18px_rgba(168,85,247,0.35)] border-purple-500 bg-gradient-to-b from-neutral-900 via-purple-950/20 to-neutral-950",
          accentColor: "#a855f7",
          badge: "bg-purple-600 text-white",
          textGlow: "text-purple-300",
          stars: 3,
        };
      case Rarity.R:
      default:
        return {
          textColor: "text-blue-400",
          glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)] border-blue-500 bg-gradient-to-b from-neutral-900 via-blue-950/10 to-neutral-950",
          accentColor: "#3b82f6",
          badge: "bg-blue-600 text-white",
          textGlow: "text-blue-300",
          stars: 2,
        };
    }
  };

  const getElementColor = (element: string) => {
    switch (element) {
      case "FLAME": return "from-red-500 to-orange-600 text-red-200";
      case "AQUA": return "from-blue-500 to-cyan-500 text-blue-200";
      case "GALE": return "from-emerald-400 to-teal-500 text-emerald-100";
      case "TERRA": return "from-amber-600 to-yellow-800 text-amber-100";
      case "COSMOS": return "from-indigo-500 via-purple-500 to-pink-500 text-indigo-100";
      default: return "from-gray-500 to-slate-600 text-gray-100";
    }
  };

  const currentResult = results[currentIndex];
  const activeStyle = currentResult ? getCurrentRarityStyling(currentResult.character.rarity) : null;

  return (
    <div id="gacha-summon-portal" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/95 overflow-y-auto p-4 backdrop-blur-md select-none font-sans">
      
      {/* Background space/ambient sparkles with dynamic color during connection phase */}
      <div className={`absolute inset-0 transition-all duration-1000 pointer-events-none ${
        phase === "portal" ? portalTheme.bgGlow : "bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0%,transparent_70%)]"
      }`} />

      {/* Header Info */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <span className="text-sm font-mono text-neutral-500 tracking-wider font-semibold">
          SUMMONS PROCESS: {phase === "reveal" ? `${currentIndex + 1} / ${results.length}` : phase.toUpperCase()}
        </span>
        {(phase === "portal" || phase === "reveal") && (
          <button
            onClick={skipAll}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-md text-xs transition duration-200 cursor-pointer"
          >
            スキップ (Skip) <Sparkles className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* PHASE 1: Astral Swirl / Portal */}
        {phase === "portal" && (
          <motion.div
            key="portal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center max-w-md text-center px-4"
          >
            {/* Summoning Circle */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
              {/* Outer Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${portalTheme.outerRing}`}
              />
              {/* Mid Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
                className={`absolute inset-4 rounded-full transition-all duration-1000 ${portalTheme.midRing}`}
              />
              {/* Core Star */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className={`transition-all duration-1000 ${portalTheme.coreStar}`}
              />

              {/* Sparkle burst for UR/SSR */}
              {portalTheme.additionalStars && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 0.9, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute w-40 h-40 border border-amber-400/30 rounded-full animate-ping"
                  />
                  <div className="absolute top-4 left-6 text-yellow-400 animate-bounce">✨</div>
                  <div className="absolute bottom-6 right-8 text-amber-300 animate-pulse delay-75">✦</div>
                </div>
              )}

              {/* Active Orbit Center */}
              <motion.div
                animate={{ rotate: 45 }}
                className={`transition-all duration-1000 ${portalTheme.orbitIconClass}`}
              >
                <Orbit className="w-16 h-16 animate-spin" style={{ animationDuration: "3s" }} />
              </motion.div>
            </div>

            {/* Connection labels */}
            <p className={`mt-8 font-mono text-sm tracking-widest transition-all duration-1000 animate-pulse font-bold ${portalTheme.textClass}`}>
              {portalTheme.message}
            </p>
            
            <p className="mt-2 text-[11px] sm:text-xs text-neutral-400 max-w-sm leading-relaxed tracking-wide">
              {portalTheme.portalSubText}
            </p>

            {/* Highest rarity helper badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`mt-4 px-3 py-1 rounded-full border text-[10px] uppercase font-bold tracking-widest bg-neutral-900 flex items-center gap-1.5 ${
                highestRarity === "UR" ? "text-amber-400 border-amber-500/40" :
                highestRarity === "SSR" ? "text-yellow-400 border-yellow-500/40" :
                highestRarity === "SR" ? "text-purple-400 border-purple-500/40" :
                "text-sky-400 border-sky-500/30"
              }`}
            >
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>最高反応: {highestRarity} CLASS</span>
            </motion.div>
          </motion.div>
        )}

        {/* PHASE 2: Individual Card Reveal */}
        {phase === "reveal" && currentResult && activeStyle && (
          <motion.div
            key={`reveal-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center max-w-sm w-full"
          >
            {/* 3D Card Flip Container */}
            <div className="w-72 h-104 relative perspective-1000">
              <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="w-full h-full transform-style-3d relative"
              >
                {/* Back side of card */}
                <div className="absolute inset-0 backface-hidden flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-950/40 via-neutral-900 to-neutral-950 border border-neutral-700 rounded-2xl shadow-xl">
                  <div className="border border-indigo-500/20 rounded-lg p-2 bg-neutral-950/40 text-center font-mono text-[10px] text-indigo-400 tracking-wider">
                    ALCANA SUMMON ENGINE
                  </div>
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 flex items-center justify-center text-indigo-500 opacity-60">
                      <Sparkles className="w-12 h-12 rotate-45 animate-pulse" />
                    </div>
                    <div className="mt-4 text-xs font-mono text-indigo-400/80 tracking-widest text-center animate-pulse">
                      CARD READY...
                    </div>
                  </div>
                  <div className="h-6 w-full flex items-center justify-center">
                    <span className="text-[10px] text-neutral-600">© ALCANA CELESTIAL</span>
                  </div>
                </div>

                {/* Front side of card */}
                <div
                  className={`absolute inset-0 backface-hidden rotateY-180 flex flex-col justify-between p-6 border-2 rounded-2xl ${activeStyle.glow}`}
                >
                  {/* Top: NEW badge & Rarity */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${activeStyle.badge}`}>
                      {currentResult.character.rarity}
                    </span>
                    {currentResult.isNew && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-mono text-[10px] font-bold tracking-widest flex items-center gap-0.5 shadow-md shadow-rose-950/40"
                      >
                        <Sparkle className="w-3 h-3 fill-white" /> NEW
                      </motion.span>
                    )}
                  </div>

                  {/* Core Icon & Element */}
                  <div className="flex flex-col items-center justify-center my-6 relative">
                    {/* Element badge floating */}
                    <div className={`absolute top-0 right-4 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r ${getElementColor(currentResult.character.element)}`}>
                      {currentResult.character.element}
                    </div>

                    <div
                      className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center text-white/90 shadow-lg relative bg-neutral-900/60 transition"
                      style={{ borderColor: activeStyle.accentColor }}
                    >
                      <CharIcon name={currentResult.character.iconName} className="w-12 h-12" charId={currentResult.character.id} jpName={currentResult.character.jpName} element={currentResult.character.element} />
                    </div>

                    <div className="flex gap-1 mt-4">
                      {Array.from({ length: activeStyle.stars }).map((_, i) => (
                        <div key={i} className="text-yellow-400 drop-shadow-md">★</div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom details */}
                  <div className="text-center">
                    <span className="text-[10px] text-neutral-400 font-mono tracking-widest mb-1 block">
                      {currentResult.character.jpTitle}
                    </span>
                    <h3 className={`text-xl font-bold truncate ${activeStyle.textGlow}`}>
                      {currentResult.character.jpName}
                    </h3>
                    <p className="text-[10px] text-neutral-500 tracking-wider font-mono mt-0.5">
                      {currentResult.character.name}
                    </p>
                  </div>

                  {/* Duplicate label */}
                  {!currentResult.isNew && (
                    <div className="mt-4 py-1.5 px-3 bg-neutral-900/90 text-center rounded-lg border border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                      <RotateCcw className="w-3 h-3 text-emerald-400" />
                      <span>獲得済: <strong className="text-emerald-400">マナ星 ✨ +100</strong></span>
                    </div>
                  )}
                  {currentResult.isNew && (
                    <div className="mt-4 py-1.5 px-3 bg-indigo-950/20 text-center rounded-lg border border-indigo-900/30 text-[10px] text-indigo-300 flex items-center justify-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span>新規図鑑アンロック！</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Tap Action */}
            <button
              onClick={handleNextReveal}
              className="mt-8 flex items-center gap-2 py-3 px-8 bg-white text-neutral-950 font-semibold rounded-lg hover:bg-neutral-100 transition shadow-lg active:scale-95 duration-150 text-sm"
            >
              {currentIndex < results.length - 1 ? "次の召喚 (Next)" : "結果を確認する"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </motion.div>
        )}

        {/* PHASE 3: Summary screen */}
        {phase === "summary" && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl max-h-[85vh] flex flex-col justify-between"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                召喚結果 <span className="text-sky-400 font-mono text-sm font-normal">Summon Details</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">今回の召喚アルカナです。未所持キャラは自動的に図鑑に登録されます。</p>
            </div>

            {/* Grid of Results */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 overflow-y-auto max-h-[50vh] p-3 border border-neutral-900 bg-neutral-950/50 rounded-xl">
              {results.map((result, idx) => {
                const style = getCurrentRarityStyling(result.character.rarity);
                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative p-3.5 border rounded-xl flex flex-col items-center justify-between bg-neutral-900/60 ${style.glow}`}
                  >
                    {/* NEW tag */}
                    {result.isNew && (
                      <span className="absolute -top-1.5 -left-1 px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono text-[8px] font-bold uppercase tracking-wider shadow">
                        NEW
                      </span>
                    )}

                    {/* Rarity */}
                    <span className={`px-1.5 py-0.5 rounded text-[8px] absolute top-1.5 right-1.5 font-bold ${style.badge}`}>
                      {result.character.rarity}
                    </span>

                    {/* Visual representation */}
                    <div className="w-12 h-12 rounded-lg border flex items-center justify-center text-white/90 bg-neutral-950/60 my-3" style={{ borderColor: style.accentColor }}>
                      <CharIcon name={result.character.iconName} className="w-6 h-6" charId={result.character.id} jpName={result.character.jpName} element={result.character.element} />
                    </div>

                    {/* Titles */}
                    <div className="text-center w-full">
                      <span className="text-[8px] text-neutral-500 truncate block">
                        {result.character.jpTitle}
                      </span>
                      <p className="text-xs font-bold text-white truncate max-w-full">
                        {result.character.jpName}
                      </p>
                      <span className="text-[8px] text-neutral-400 truncate block font-mono">
                        {result.character.name}
                      </span>
                    </div>

                    {!result.isNew && (
                      <div className="mt-2 text-[8px] text-neutral-400 font-mono bg-neutral-950/40 px-1 py-0.5 rounded flex items-center gap-0.5">
                        <RotateCcw className="w-2.5 h-2.5 text-emerald-400" />
                        <span>マナ ✨+100</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Auto Summon Actions & Badges */}
            {isAuto && (
              <div className="mt-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in text-left">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full scale-150 animate-pulse" />
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-emerald-300">自動連続召喚（10連ループ）が稼働中</h5>
                    <p className="text-[10px] text-emerald-400/80 mt-0.5">
                      {autoCountdown > 0 ? (
                        <>あと <strong className="text-white text-xs font-mono">{autoCountdown}</strong> 秒で次の10羽を自動的に召喚します（リソース消費あり）</>
                      ) : (
                        <>まもなく時空を拡張し、次の召喚を開始します...</>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  id="stop-auto-summon-animation-btn"
                  onClick={() => {
                    onStopAuto?.();
                  }}
                  className="px-6 py-2 bg-red-650 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition duration-150 shadow-md shadow-red-950/20 cursor-pointer animate-pulse shrink-0"
                >
                  自動召喚を停止
                </button>
              </div>
            )}

            {/* UR Pull Protection Alert when autoplay is stopped by UR pull */}
            {!isAuto && hasUR && (
              <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center gap-3 animate-in slide-in-from-bottom duration-300 text-left">
                <Trophy className="w-6 h-6 text-yellow-500 shrink-0 animate-bounce" />
                <div>
                  <h5 className="font-bold text-xs text-amber-300">極大共鳴反応（UR排出）により召喚を安全に停止しました！</h5>
                  <p className="text-[10px] text-amber-400/80 mt-0.5">
                    おめでとうございます！極めて強力なURクラスの星霊（鳥）が具現化されたため、リソースを安全に管理できるよう、自動連続召喚プロセスを停止（セーフティロック）しました。
                  </p>
                </div>
              </div>
            )}

            {/* Currency depletion protection alert */}
            {!isAuto && !hasUR && !canAffordNext && (
              <div className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-950/10 flex items-center gap-3 text-left">
                <Zap className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <h5 className="font-bold text-xs text-red-300">リソース不足により自動召喚停止</h5>
                  <p className="text-[10px] text-red-400/70 mt-0.5">
                    所持しているチケットおよびジェムが、次の10回連続召喚を実行する残高に満たないため、自動プロセスが安全に完了しました。
                  </p>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            {(() => {
              const count = results.length;
              const canAfford = count === 1 
                ? (tickets >= 1 || gems >= 150)
                : (tickets >= 10 || gems >= 1500);
              const costLabel = count === 1
                ? (tickets >= 1 ? "🎟️ x1" : "💎 x150")
                : (tickets >= 10 ? "🎟️ x10" : "💎 x1500");
              return (
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  {/* オート停止中または最初からオートではない時のみ、閉じる・再度召喚を表示 */}
                  {(!isAuto || hasUR || !canAffordNext) && (
                    <>
                      <button
                        onClick={onComplete}
                        className="py-3 px-8 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg shadow-lg active:scale-95 duration-150 transition border border-neutral-700 w-full sm:w-auto cursor-pointer text-xs"
                      >
                        召喚完了 (Back to Portal)
                      </button>
                      <button
                        disabled={!canAfford}
                        onClick={() => onReSummon && onReSummon(count)}
                        className={`py-3 px-8 font-bold rounded-lg shadow-lg active:scale-95 duration-150 transition flex items-center justify-center gap-2 w-full sm:w-auto text-xs ${
                          canAfford
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-900 font-extrabold cursor-pointer"
                            : "bg-neutral-900 text-neutral-500 border border-neutral-850 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        もう一度{count}回召喚 ({costLabel})
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
