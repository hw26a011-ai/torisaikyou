/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Rarity {
  UR = "UR",
  SSR = "SSR",
  SR = "SR",
  R = "R",
}

export enum ElementType {
  FLAME = "FLAME",
  AQUA = "AQUA",
  GALE = "GALE",
  TERRA = "TERRA",
  COSMOS = "COSMOS",
  DARK = "DARK",
  LIGHT = "LIGHT",
}

export interface Character {
  id: string;
  name: string;
  jpTitle: string; // e.g. "陽光の熾天使"
  jpName: string;  // e.g. "ウリエル"
  rarity: Rarity;
  element: ElementType;
  baseAtk: number;
  baseDef: number;
  baseHp: number;
  description: string;
  iconName: string; // Named after Lucide icons to dynamically load
}

export interface CollectedCharacter {
  id: string;
  level: number;
  exp: number;
  duplicateCount: number;
  acquiredAt: string;
  isFavorite: boolean;
}

export interface GachaRate {
  rarity: Rarity;
  rate: number; // percentage, e.g. 1, 3, 15, 81
  label: string;
  color: string;
  bgGlow: string;
}

export interface PullHistoryItem {
  id: string;
  characterId: string;
  rolledAt: string;
  rarity: Rarity;
  isNew: boolean;
}

export interface PredatorQuest {
  id: string;
  name: string;
  jpName: string;
  description: string;
  difficulty: number; // 1 to 5 stars
  bossHp: number;
  bossAtk: number;
  bossDef: number;
  element: ElementType;
  iconName: string;
  rewards: {
    gold: number;
    stars: number;
    gems: number;
  };
  recommendedAtk: number;
}

