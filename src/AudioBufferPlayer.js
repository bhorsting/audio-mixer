export default class AudioBufferPlayer {
  constructor(audioBuffer, audioCtx) {
    this.audioBuffer = audioBuffer;
    this.audioCtx = audioCtx || new AudioContext();
    this.source = null;
    this.startTime = 0; // When playback started
    this.pauseTime = 0; // Where we are in the buffer when paused
    this.isPlaying = false;
  }

  play() {
    if (this.isPlaying) return; // Already playing

    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.audioCtx.destination);

    // If resuming from pause, adjust the start time
    this.source.start(0, this.pauseTime);
    this.startTime = this.audioCtx.currentTime - this.pauseTime;
    this.isPlaying = true;
    this.source.onended = () => {
      if (this.source.buffer.duration !== this.getCurrentTime()) return;
      this.isPlaying = false;
      this.pauseTime = 0;
    };
  }

  pause() {
    if (!this.isPlaying) return;

    this.pauseTime = this.audioCtx.currentTime - this.startTime;
    this.source.stop();
    this.isPlaying = false;
  }

  resume() {
    if (this.isPlaying) return;
    this.play();
  }

  getCurrentTime() {
    if (!this.isPlaying) {
      return this.pauseTime;
    }
    return this.audioCtx.currentTime - this.startTime;
  }
}
