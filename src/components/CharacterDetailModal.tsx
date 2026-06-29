/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Character, CollectedCharacter, Rarity } from "../types";
import { CharIcon } from "./CharIcon";
import { playLevelUp, playClick } from "../utils/audio";
import { X, Heart, Shield, Swords, Activity, ArrowUp, Star } from "lucide-react";

interface CharacterDetailModalProps {
  character: Character;
  collectedInfo?: CollectedCharacter;
  manaStars: number;
  gold: number;
  onClose: () => void;
  onLevelUp: (charId: string, goldCost: number, starCost: number) => void;
  onToggleFavorite: (charId: string) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  collectedInfo,
  manaStars,
  gold,
  onClose,
  onLevelUp,
  onToggleFavorite,
}) => {
  const isUnlocked = !!collectedInfo;
  const level = collectedInfo?.level ?? 1;
  const duplicates = collectedInfo?.duplicateCount ?? 0;
  const isFavorite = collectedInfo?.isFavorite ?? false;

  // Level up calculation: costs grow with level
  const calcLevelUpCosts = (currentLevel: number) => {
    const goldCost = Math.round(150 + Math.pow(currentLevel, 1.8) * 80);
    const starCost = Math.round(20 + Math.pow(currentLevel, 1.5) * 10);
    return { goldCost, starCost };
  };

  const { goldCost, starCost } = calcLevelUpCosts(level);

  const canLevelUp = isUnlocked && gold >= goldCost && manaStars >= starCost && level < 100;

  // Stat calculations with levels (stat increases by +8% per level)
  const calculateStat = (base: number, lvl: number) => {
    return Math.round(base * (1 + (lvl - 1) * 0.08));
  };

  const curAtk = calculateStat(character.baseAtk, level);
  const curDef = calculateStat(character.baseDef, level);
  const curHp = calculateStat(character.baseHp, level);

  const nextAtk = calculateStat(character.baseAtk, level + 1);
  const nextDef = calculateStat(character.baseDef, level + 1);
  const nextHp = calculateStat(character.baseHp, level + 1);

  const handleLevelUpClick = () => {
    if (!canLevelUp) return;
    playLevelUp();
    onLevelUp(character.id, goldCost, starCost);
  };

  const getRarityBadge = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.UR: return "bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500 text-white font-black shadow-[0_0_15px_rgba(234,179,8,0.4)]";
      case Rarity.SSR: return "bg-yellow-500 text-neutral-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]";
      case Rarity.SR: return "bg-purple-600 text-white";
      case Rarity.R:
      default: return "bg-blue-600 text-white";
    }
  };

  const getElementColor = (element: string) => {
    switch (element) {
      case "FLAME": return "from-red-500/20 to-orange-600/10 border-red-500/30 text-red-300";
      case "AQUA": return "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300";
      case "GALE": return "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300";
      case "TERRA": return "from-amber-600/20 to-yellow-800/10 border-amber-600/30 text-amber-300";
      case "COSMOS": return "from-indigo-500/20 via-purple-500/10 to-pink-500/10 border-indigo-500/30 text-indigo-300";
      default: return "from-gray-500/20 to-slate-600/10 border-gray-500/30 text-gray-300";
    }
  };

  return (
    <div id="character-detail-backdrop" className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none font-sans">
      <div 
        className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        {/* Top interactive Header */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${getRarityBadge(character.rarity)}`}>
              {character.rarity}
            </span>
            <span className={`text-[10px] border px-2 py-0.5 rounded-md uppercase tracking-wider bg-gradient-to-r ${getElementColor(character.element)}`}>
              {character.element}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                onClick={() => { playClick(); onToggleFavorite(character.id); }}
                className={`p-2 rounded-lg border transition duration-150 ${
                  isFavorite 
                    ? "bg-rose-950/40 border-rose-800 text-rose-500 hover:bg-rose-900/40" 
                    : "bg-neutral-850 border-neutral-850 text-neutral-500 hover:text-neutral-400"
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500" : ""}`} />
              </button>
            )}
            <button
              onClick={() => { playClick(); onClose(); }}
              className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg border border-transparent hover:border-neutral-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Info container */}
        <div className="p-6 flex flex-col md:flex-row gap-6">
          
          {/* Card Frame Visualization */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-36 h-48 rounded-xl border flex flex-col items-center justify-center relative bg-gradient-to-b from-neutral-800 to-neutral-950 ${
                isUnlocked ? "opacity-100" : "opacity-30 filter grayscale"
              }`}
              style={{ borderColor: isUnlocked ? "rgba(224,242,254,0.15)" : "#334155" }}
            >
              <div className="w-16 h-16 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-center text-neutral-200">
                <CharIcon name={character.iconName} className="w-8 h-8" charId={character.id} jpName={character.jpName} element={character.element} />
              </div>
              <div className="text-center mt-3 px-2 w-full">
                <span className="text-[8px] text-neutral-500 truncate block font-mono">{character.jpTitle}</span>
                <span className="text-sm font-bold text-white truncate block">{character.jpName}</span>
                <span className="text-[8px] text-neutral-400 truncate block font-mono">{character.name}</span>
              </div>
              {isUnlocked && (
                <div className="absolute bottom-2 left-2 bg-neutral-900/90 text-yellow-400 border border-neutral-800 px-1.5 py-0.5 rounded text-[8px] font-mono">
                  LV.{level}
                </div>
              )}
            </div>
            {isUnlocked ? (
              <div className={`mt-2 text-xs font-mono bg-neutral-950 px-2.5 py-0.5 rounded-full ${duplicates >= 6 ? "text-emerald-400 font-bold" : "text-neutral-400"}`}>
                限界突破 (凸数): {duplicates} / 6 {duplicates >= 6 && " (MAX)"}
              </div>
            ) : (
              <div className="mt-2 text-xs text-rose-500 font-mono font-medium">
                未解放 🔒
              </div>
            )}
          </div>

          {/* Details & Interactive Block */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <span className="text-[10px] text-neutral-500 tracking-widest uppercase block font-mono">ABOUT</span>
                <h2 className="text-lg font-bold text-neutral-100">
                  {character.jpName}
                </h2>
                <span className="text-xs text-neutral-400 block mt-0.5">{character.jpTitle}・{character.name}</span>
              </div>
              
              <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-950/40 border border-neutral-850 p-2.5 rounded-lg">
                {character.description}
              </p>
            </div>

            {/* Stats section */}
            <div className="mt-4">
              <span className="text-[10px] text-neutral-500 tracking-widest uppercase block font-mono mb-2">STATS</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-950/70 p-2 border border-neutral-850 rounded-lg text-center">
                  <div className="flex justify-center text-rose-400 mb-0.5"><Swords className="w-3.5 h-3.5" /></div>
                  <span className="text-[9px] text-neutral-500 block font-bold">攻撃力 (ATK)</span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-neutral-200">{curAtk}</span>
                    {canLevelUp && (
                      <span className="text-[9px] text-emerald-400 flex items-center">
                        <ArrowUp className="w-2.5 h-2.5" />{nextAtk - curAtk}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-950/70 p-2 border border-neutral-850 rounded-lg text-center">
                  <div className="flex justify-center text-blue-400 mb-0.5"><Shield className="w-3.5 h-3.5" /></div>
                  <span className="text-[9px] text-neutral-500 block font-bold">防御力 (DEF)</span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-neutral-200">{curDef}</span>
                    {canLevelUp && (
                      <span className="text-[9px] text-emerald-400 flex items-center">
                        <ArrowUp className="w-2.5 h-2.5" />{nextDef - curDef}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-950/70 p-2 border border-neutral-850 rounded-lg text-center">
                  <div className="flex justify-center text-emerald-400 mb-0.5"><Activity className="w-3.5 h-3.5" /></div>
                  <span className="text-[9px] text-neutral-500 block font-bold">生命力 (HP)</span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-neutral-200">{curHp}</span>
                    {canLevelUp && (
                      <span className="text-[9px] text-emerald-400 flex items-center">
                        <ArrowUp className="w-2.5 h-2.5" />{nextHp - curHp}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Upgrade/Footer Bar */}
        {isUnlocked && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-neutral-400">
              {level >= 100 ? (
                <span className="text-yellow-400 font-bold">レベル最大 (LV.100 MAX)</span>
              ) : (
                <div className="flex flex-col">
                  <span>次レベルの強化コスト:</span>
                  <div className="flex gap-2.5 mt-1">
                    <span className={`font-mono text-xs flex items-center gap-0.5 ${gold >= goldCost ? "text-yellow-500" : "text-rose-500"}`}>
                      🪙 {goldCost}
                    </span>
                    <span className={`font-mono text-xs flex items-center gap-0.5 ${manaStars >= starCost ? "text-emerald-400" : "text-rose-500"}`}>
                      ✨ {starCost}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              disabled={!canLevelUp}
              onClick={handleLevelUpClick}
              className={`py-2 px-5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 duration-150 shadow-md ${
                canLevelUp 
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.02] active:scale-95" 
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-750"
              }`}
            >
              <ArrowUp className="w-4 h-4 animate-bounce" style={{ animationDuration: "2s" }} /> 強化 (LV.{level} → {level + 1})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
