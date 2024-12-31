// Unlock and initialize audio context on page load
window.addEventListener('DOMContentLoaded', () => {
  if (!audioCtx) {
    initializeAudio();
  }
});



// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Audio Elements
const audio = document.getElementById('audio-player');
const songSelector = document.getElementById('song-selector');
const track = document.getElementById('captions-track');

// Audio Context
let audioCtx;
let analyser;
let dataArray;
let bufferLength;

// Mesh Setup
let waveMesh;
const gridSizeX = 150;
const gridSizeZ = 250;
const gridSpacing = window.innerWidth / gridSizeX;

// Circular Visualizer Configuration
const bars = [];
const numBars = 128;
const radius = 125;

// Captions
let captions = [];
const captionsContainer = document.createElement('div');
captionsContainer.style.position = 'absolute';
captionsContainer.style.bottom = '15%';
captionsContainer.style.width = '100%';
captionsContainer.style.textAlign = 'center';
captionsContainer.style.color = 'white';
captionsContainer.style.fontSize = '20px';
captionsContainer.style.fontFamily = 'Arial, sans-serif';
captionsContainer.style.textShadow = '0 0 10px rgba(0, 123, 255, 0.8)';
document.body.appendChild(captionsContainer);

// Initialize Audio Context
function initializeAudio() {
  if (!audioCtx) {
    console.log('Initializing Audio Context...');
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    unlockAudioContext(audioCtx);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    console.log('Audio Context Initialized!');
  }
}

// Create Wave Mesh
function createWaveMesh() {
  const geometry = new THREE.PlaneGeometry(window.innerWidth, gridSizeZ * gridSpacing, gridSizeX, gridSizeZ);
  const material = new THREE.MeshStandardMaterial({
    color: 0xc1b7f1, // Periwinkle color
    wireframe: true,
    emissive: 0x9370db, // Light purple glow
    emissiveIntensity: 0.3,
  });
  waveMesh = new THREE.Mesh(geometry, material);
  waveMesh.rotation.x = -Math.PI / 2;
  waveMesh.position.y = -20;
  waveMesh.position.z = 0;
  scene.add(waveMesh);
}


// Create Circular Visualizer
function createCircularVisualizer() {
  const colors = [0xff69b4, 0xffc0cb, 0xda70d6]; // Pink, light red, and purple shades
  for (let i = 0; i < numBars; i++) {
    const color = colors[i % colors.length];
    const material = new THREE.MeshBasicMaterial({ color });
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 10);
    const bar = new THREE.Mesh(geometry, material);
    const angle = (i / numBars) * Math.PI * 2;
    bar.position.x = Math.cos(angle) * radius;
    bar.position.y = Math.sin(angle) * radius + 60;
    bar.position.z = 50;
    bar.lookAt(0, 100, 50);
    scene.add(bar);
    bars.push(bar);
  }
}


// Load Captions
track.addEventListener('load', () => {
  const cues = track.track.cues;
  captions = Array.from(cues).map((cue) => ({
    startTime: cue.startTime,
    endTime: cue.endTime,
    text: cue.text,
  }));
  console.log('Captions loaded:', captions);
});

// Update Captions
function updateCaptions() {
  const currentTime = audio.currentTime;
  const currentCaption = captions.find((caption) => currentTime >= caption.startTime && currentTime <= caption.endTime);
  captionsContainer.innerText = currentCaption ? currentCaption.text : '';
}

// Animate Visualizer
function animate() {
  requestAnimationFrame(animate);

  if (analyser) {
    analyser.getByteFrequencyData(dataArray);

    // Circular Visualizer Animation
bars.forEach((bar, i) => {
  const scale = Math.pow(dataArray[i] / 128.0, 1.2); // Softer scaling for pop
  bar.scale.z = scale * 3.5;
  const colorScale = scale * 0.6 + 0.2;
  bar.material.color.setHSL(colorScale, 0.8, 0.7); // Softer pastel shades
});

// Wave Mesh Animation
const vertices = waveMesh.geometry.attributes.position.array;
const rows = gridSizeZ + 1;
const cols = gridSizeX + 1;

for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    const index = (i * cols + j) * 3 + 2;
    const frequencyIndex = Math.floor((j / cols) * dataArray.length);
    const amplitude = dataArray[frequencyIndex] / 256;
    vertices[index] =
      Math.sin(i * 0.12 + Date.now() * 0.01) * amplitude * 20 +
      Math.cos(j * 0.1 + Date.now() * 0.008) * amplitude * 15;
  }
}
waveMesh.geometry.attributes.position.needsUpdate = true;


    updateCaptions();
  }
  renderer.render(scene, camera);
}

// Initialize
createWaveMesh();
createCircularVisualizer();
camera.position.y = 40;
camera.position.z = 300;
camera.lookAt(0, 40, 50);
animate();

// Song List (Match Dropdown Order)
const songList = [
  'fortnight.mp3',
  'the-tortured-poets-department.mp3',
  'my-boy-only-breaks-his-favorite-toys.mp3',
  'down-bad.mp3',
  'so-long-london.mp3',
  'but-daddy-i-love-him.mp3',
  'fresh-out-the-slammer.mp3',
  'florida.mp3',
  'guilty-as-sin.mp3',
  'whos-afraid-of-little-old-me.mp3',
  'i-can-fix-him.mp3',
  'loml.mp3',
  'i-can-do-it-with-a-broken-heart.mp3',
  'the-smallest-man-who-ever-lived.mp3',
  'the-alchemy.mp3',
  'clara-bow.mp3',
  'but-daddy-i-love-him.mp3' // Acoustic version
];


// Track Elements
let currentSongIndex = 0; // Start with the first song

// Unlock Audio Context
function unlockAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log('AudioContext unlocked!');
    });
  }
}

// Play Selected Song
function playSong(index) {
  currentSongIndex = index; // Update index
  audio.src = songList[index]; // Update source
  audio.load();

  // Ensure AudioContext is initialized before playing
  if (!audioCtx || audioCtx.state === 'suspended') {
    initializeAudio();
  }
  

  audio
    .play()
    .then(() => console.log(`Playing: ${songList[index]}`))
    .catch((err) => console.error('Playback Error:', err)); // Handle play errors
}


// Handle Next Song Autoplay
function playNextSong() {
  currentSongIndex++;
  if (currentSongIndex >= songList.length) {
    currentSongIndex = 0; // Loop back to the first song
  }
  playSong(currentSongIndex);
}

// Event Listener for Song End
audio.addEventListener('ended', () => {
  playNextSong(); // Autoplay the next song
});

// Dropdown Selection
songSelector.addEventListener('change', () => {
  const selectedSong = songSelector.value;

  // Unlock AudioContext if locked
  if (!audioCtx) {
    initializeAudio();
  }

  // Play selected song
  const selectedIndex = songList.indexOf(selectedSong);
  if (selectedIndex !== -1) {
    playSong(selectedIndex);
  }
});


// Unlock Audio Context on User Interaction
window.addEventListener('click', unlockAudioContext);
window.addEventListener('keydown', unlockAudioContext);

// Autoplay First Song After Interaction
window.addEventListener('click', () => {
  if (audio.paused) {
    playSong(0); // Start autoplay from the first song
  }
});

// Load the first song on page load
window.addEventListener('DOMContentLoaded', () => {
  playSong(0); // Start with the first song in the list
  audio.load(); // Force audio element to load immediately
});


// Handle Resize for Mobile and Desktop
function handleResize() {
  const isMobile = window.innerWidth <= 768; // Mobile breakpoint
  const smallScreen = window.innerWidth <= 480; // Smaller screens

  // Resize the Renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Circular Visualizer
  const newRadius = isMobile ? 110 : 125; // Slightly smaller radius for mobile
  const newBarHeight = isMobile ? 8 : 10; // Slightly shorter bars for mobile

  bars.forEach((bar, i) => {
    const angle = (i / numBars) * Math.PI * 2;

    // Position bars dynamically based on screen size
    bar.position.x = Math.cos(angle) * newRadius;
    bar.position.y = Math.sin(angle) * newRadius + (isMobile ? 50 : 60); // Slightly lowered for mobile

    // Dynamic height adjustment
    bar.scale.z = newBarHeight;
  });

  // Adjust Wave Mesh
  const newGridSizeX = isMobile ? 120 : 150; // Minor reduction for mobile
  const newGridSizeZ = isMobile ? 200 : 250; // Maintain visual depth
  const newSpacing = window.innerWidth / newGridSizeX;

  waveMesh.geometry.dispose(); // Dispose old geometry
  waveMesh.geometry = new THREE.PlaneGeometry(
    window.innerWidth,
    newGridSizeZ * newSpacing, // Adjust depth scaling
    newGridSizeX,
    newGridSizeZ
  );

  waveMesh.geometry.attributes.position.needsUpdate = true;

  // Adjust Camera Position
  camera.position.y = isMobile ? 35 : 40; // Slightly lower camera for mobile
  camera.position.z = isMobile ? 250 : 300; // Keep a balanced distance
  camera.lookAt(0, 40, 50);
}

// Add Resize Listener
window.addEventListener('resize', handleResize);
handleResize(); // Initialize the resize settings