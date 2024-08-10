import AudioBufferPlayer from "./AudioBufferPlayer.js";

const createFile = document.querySelector("#create-file");

createFile.addEventListener(
  "click",
  async () => {
    const tracks = [];
    document.querySelectorAll("form").forEach((form) => {
      // get file from each file
      const formData = new FormData(form);
      const formObject = Object.fromEntries(formData);
      tracks.push({
        src: formObject.file,
        gain: Number(formObject.gain),
        seek: Number(formObject.seek),
        duration: Number(formObject.duration),
        start: Number(formObject.start),
      });
    });
    const audioLength = Number(document.querySelector("#audio-length").value);
    const output = await mixTracks(tracks, audioLength);
    createPlayer(output);
  },
  false
);

async function fetchAndDecodeAudio(context, src) {
  if (src instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        context.decodeAudioData(e.target.result, resolve, reject);
      };
      reader.readAsArrayBuffer(src);
    });
  }
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return context.decodeAudioData(arrayBuffer);
}

// @Track[]
// src: url or file
// gain: number
// seek: number
// duration: number
async function mixTracks(
  tracks = [],
  finalLength = 10,
  sampleRate = 44100,
  channels = 2
) {
  const offlineContext = new OfflineAudioContext(
    channels,
    sampleRate * finalLength,
    sampleRate
  );

  for (let track of tracks) {
    const audioBuffer = await fetchAndDecodeAudio(offlineContext, track.src);
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = audioBuffer;

    // gain
    const gainNode = offlineContext.createGain();
    gainNode.gain.value = track.gain;
    sourceNode.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    const startArgs = [track.start || 0, track.seek || 0];
    if (track.duration) {
      startArgs.push(track.duration);
    }
    sourceNode.start(...startArgs);
  }

  // Render the audio
  const renderedBuffer = await offlineContext.startRendering();

  // The renderedBuffer now contains the mixed audio
  return renderedBuffer;
}

function createPlayer(buffer) {
  const player = new AudioBufferPlayer(buffer);

  const playButton = document.createElement("button");
  playButton.textContent = "Play";
  playButton.addEventListener("click", () => {
    if (player.isPlaying) {
      player.pause();
      playButton.textContent = "Play";
    } else {
      player.play();
      playButton.textContent = "Pause";
    }
  });
  document.body.appendChild(playButton);
}
