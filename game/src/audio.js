// All sound is synthesised with the Web Audio API: no audio files are shipped,
// nothing is fetched, and the game stays silent until the player first presses
// a key or clicks (browsers only allow sound after a gesture).

/**
 * Create the sound board. Every method is safe to call before the audio
 * context exists: it simply does nothing until `unlock()` runs on a gesture.
 */
export function createAudio() {
  let context = null;
  let muted = false;

  function unlock() {
    if (context !== null) {
      if (context.state === 'suspended') context.resume();
      return;
    }
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return;
      context = new AudioContext();
    } catch {
      context = null;
    }
  }

  /** One oscillator note with a pitch slide and a volume envelope. */
  function tone({ type = 'sine', from = 440, to = null, seconds = 0.12, volume = 0.12, delay = 0 }) {
    if (context === null || muted) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    if (to !== null) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + seconds);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  }

  /** A short burst of filtered noise, for thuds and rustles. */
  function noise({ seconds = 0.1, volume = 0.15, delay = 0, low = 400 }) {
    if (context === null || muted) return;
    const start = context.currentTime + delay;
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
  }

  return {
    unlock,
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** The turkey's gobble: two descending honks. */
    gobble() {
      tone({ type: 'sawtooth', from: 320, to: 180, seconds: 0.09, volume: 0.1 });
      tone({ type: 'sawtooth', from: 280, to: 150, seconds: 0.11, volume: 0.1, delay: 0.11 });
    },
    jump() {
      tone({ type: 'sine', from: 300, to: 620, seconds: 0.14, volume: 0.09 });
    },
    land() {
      noise({ seconds: 0.06, volume: 0.06, low: 300 });
    },
    pickup() {
      tone({ type: 'sine', from: 880, to: 1320, seconds: 0.09, volume: 0.1 });
    },
    golden() {
      tone({ type: 'sine', from: 880, seconds: 0.08, volume: 0.1 });
      tone({ type: 'sine', from: 1174, seconds: 0.08, volume: 0.1, delay: 0.08 });
      tone({ type: 'sine', from: 1568, seconds: 0.14, volume: 0.1, delay: 0.16 });
    },
    stumble() {
      noise({ seconds: 0.18, volume: 0.2, low: 500 });
      tone({ type: 'square', from: 220, to: 90, seconds: 0.2, volume: 0.08 });
    },
    /** A rising alarm while the farmer is close behind. */
    alarm() {
      tone({ type: 'square', from: 520, to: 700, seconds: 0.12, volume: 0.05 });
      tone({ type: 'square', from: 700, to: 520, seconds: 0.12, volume: 0.05, delay: 0.13 });
    },
    hide() {
      noise({ seconds: 0.25, volume: 0.08, low: 900 });
    },
    /** The escape fanfare: a little major arpeggio. */
    fanfare() {
      [523, 659, 784, 1046].forEach((note, index) => {
        tone({ type: 'triangle', from: note, seconds: 0.22, volume: 0.12, delay: index * 0.13 });
      });
    },
    /** Caught: a short descending line. */
    caught() {
      [392, 330, 262, 196].forEach((note, index) => {
        tone({ type: 'sawtooth', from: note, seconds: 0.2, volume: 0.08, delay: index * 0.16 });
      });
    },
  };
}
