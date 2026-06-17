/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Orbit,
  Hourglass,
  Sun,
  Sword,
  Waves,
  Target,
  Shield,
  Scale,
  Flame,
  Droplet,
  Wind,
  Wrench,
  Zap,
  Moon,
  Crown,
  Hammer,
  Compass,
  Sparkles,
  Cpu,
  Heart,
  Scissors,
  Eye,
  ShieldAlert,
  Send,
  HelpCircle,
  Sparkle,
  Bird,
  Feather
} from "lucide-react";
import { BirdPixelArt } from "./BirdPixelArt";

interface CharIconProps {
  name: string;
  className?: string;
  size?: number;
  charId?: string;
  jpName?: string;
  element?: string;
}

export const CharIcon: React.FC<CharIconProps> = ({
  name,
  className = "",
  size = 24,
  charId,
  jpName,
  element
}) => {
  // If charId is explicitly provided, or if the name matches a character ID format (e.g. C01, C02, Q01 etc.)
  const parsedCharId = charId || (name && /^[CQ]\d+(_\d+)?$/i.test(name) ? name : undefined);

  if (parsedCharId) {
    return (
      <BirdPixelArt
        charId={parsedCharId}
        jpName={jpName}
        element={element}
        size={size}
        className={className}
      />
    );
  }

  const iconMap: { [key: string]: React.ComponentType<{ className?: string; size?: number }> } = {

    Orbit,
    Hourglass,
    Sun,
    Sword,
    Waves,
    Target,
    Shield,
    Scale,
    Flame,
    Droplet,
    Wind,
    Wrench,
    Zap,
    Moon,
    Crown,
    FlameKindling: Flame, // fallback elegant
    Hammer,
    Compass,
    Sparkles,
    Cpu,
    Heart,
    Scissors,
    Eye,
    ShieldAlert,
    Send,
    Sparkle,
    Bird,
    Feather
  };

  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
};
