/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Rarity } from "../types";

let isMuted = false;

export function toggleMute(): boolean {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

/**
 * Common sound synth helper to avoid repetitive boilerplate and ensure proper node disposal
 */
function playTone({
  frequency,
  type = "sine",
  duration = 0.5,
  gainStart = 0.1,
  frequencySweep,
  delay = 0,
}: {
  frequency: number;
  type?: OscillatorType;
  duration?: number;
  gainStart?: number;
  frequencySweep?: number;
  delay?: number;
}) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  
  if (frequencySweep) {
    osc.frequency.exponentialRampToValueAtTime(frequencySweep, ctx.currentTime + delay + duration);
  }

  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(gainStart, ctx.currentTime + delay + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.1);
}

export function playClick() {
  playTone({
    frequency: 600,
    type: "sine",
    duration: 0.08,
    gainStart: 0.15,
    frequencySweep: 150,
  });
}

export function playCoin() {
  // Classic double-ding coin sound
  playTone({
    frequency: 987.77, // B5
    type: "sine",
    duration: 0.12,
    gainStart: 0.1,
  });
  playTone({
    frequency: 1318.51, // E6
    type: "sine",
    duration: 0.3,
    gainStart: 0.1,
    delay: 0.08,
  });
}

export function playLevelUp() {
  // Arpeggio sweep upwards
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major chord arpeggio
  notes.forEach((freq, idx) => {
    playTone({
      frequency: freq,
      type: "triangle",
      duration: 0.4,
      gainStart: 0.08,
      delay: idx * 0.06,
    });
  });
}

export function playPullStart() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Mystical rising sweep
  const now = ctx.currentTime;
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(100, now);
  osc1.frequency.exponentialRampToValueAtTime(800, now + 1.2);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(105, now);
  osc2.frequency.exponentialRampToValueAtTime(810, now + 1.2);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.06, now + 0.1);
  gainNode.gain.linearRampToValueAtTime(0.08, now + 0.8);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  // Bandpass filter to make it sound "portal-like"
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(1200, now + 1.2);
  filter.Q.setValueAtTime(3, now);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 1.3);
  osc2.stop(now + 1.3);
}

export function playReveal(rarity: Rarity) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (rarity === Rarity.UR) {
    // Majestic cosmic chime chord (Cmaj9 / Amin9 feeling, heavy spaciousness)
    const freqs = [220.00, 329.63, 392.00, 523.25, 587.33, 659.25, 880.00, 1174.66]; // A, E, G, C, D, E, A, D
    freqs.forEach((freq, idx) => {
      // Subtly staggered chord strike
      const delay = idx * 0.04;
      
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const delayNode = ctx.createDelay();
      const feedbackNode = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + delay);
      
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(freq / 2, now + delay); // Sub-harmonics

      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(0.04, now + delay + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + 2.0);

      // Low pass to warm up the sawtooth
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 1.5);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      subOsc.start(now + delay);
      osc.stop(now + delay + 2.2);
      subOsc.stop(now + delay + 2.2);
    });

    // Epic high scale chime sweep
    for (let i = 0; i < 12; i++) {
      const f = 800 + i * 150;
      playTone({
        frequency: f,
        type: "sine",
        duration: 0.8,
        gainStart: 0.03,
        delay: 0.3 + i * 0.04,
      });
    }

  } else if (rarity === Rarity.SSR) {
    // Rich golden major chime (Cmaj9)
    const freqs = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 987.77]; // C4, E4, G4, B4, C5, E5, B5
    freqs.forEach((freq, idx) => {
      const delay = idx * 0.03;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + delay);

      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(0.06, now + delay + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.2);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 1.4);
    });

    // Glitter sprinkle
    for (let i = 0; i < 6; i++) {
      playTone({
        frequency: 1200 + i * 100,
        type: "sine",
        duration: 0.4,
        gainStart: 0.02,
        delay: 0.2 + i * 0.05,
      });
    }

  } else if (rarity === Rarity.SR) {
    // Beautiful purple chord (Amin)
    const freqs = [220.00, 261.63, 329.63, 440.00, 523.25]; // A3, C4, E4, A4, C5
    freqs.forEach((freq, idx) => {
      const delay = idx * 0.02;
      playTone({
        frequency: freq,
        type: "sine",
        duration: 0.8,
        gainStart: 0.07,
        delay: delay,
      });
    });

    // Quick light chime
    playTone({
      frequency: 880,
      type: "sine",
      duration: 0.3,
      gainStart: 0.05,
      delay: 0.15,
    });
  } else {
    // Clean basic blue chime
    playTone({
      frequency: 329.63, // E4
      type: "sine",
      duration: 0.4,
      gainStart: 0.08,
    });
    playTone({
      frequency: 440.00, // A4
      type: "sine",
      duration: 0.5,
      gainStart: 0.05,
      delay: 0.08,
    });
  }
}
