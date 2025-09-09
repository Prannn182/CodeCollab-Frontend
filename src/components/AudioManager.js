class AudioManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = true;
    this.init();
  }

  init() {
    // Create audio context for better sound control
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported, falling back to HTML5 Audio');
      this.audioContext = null;
    }

    // Preload sounds
    this.loadSounds();
  }

  loadSounds() {
    // User join sound (Discord-like notification)
    this.sounds.userJoin = this.createJoinSound();
    
    // Message sound
    this.sounds.message = this.createMessageSound();
    
    // Typing sound
    this.sounds.typing = this.createTypingSound();
  }

  createJoinSound() {
    if (this.audioContext) {
      // Create a Discord-like join sound using Web Audio API
      return () => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Discord-like frequency sweep
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
      };
    } else {
      // Fallback to HTML5 Audio
      const audio = new Audio();
      audio.volume = 0.3;
      return () => {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      };
    }
  }

  createMessageSound() {
    if (this.audioContext) {
      return () => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
      };
    } else {
      const audio = new Audio();
      audio.volume = 0.2;
      return () => {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      };
    }
  }

  createTypingSound() {
    if (this.audioContext) {
      return () => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.08);
      };
    } else {
      const audio = new Audio();
      audio.volume = 0.1;
      return () => {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      };
    }
  }

  playSound(soundName) {
    if (!this.isEnabled) return;
    
    try {
      if (this.sounds[soundName]) {
        this.sounds[soundName]();
      }
    } catch (error) {
      console.warn('Failed to play sound:', soundName, error);
    }
  }

  playUserJoin() {
    this.playSound('userJoin');
  }

  playMessage() {
    this.playSound('message');
  }

  playTyping() {
    this.playSound('typing');
  }

  toggleSound() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  isSoundEnabled() {
    return this.isEnabled;
  }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager; 