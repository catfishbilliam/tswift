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

  // Unlock AudioContext
  function unlockAudioContext(audioCtx) {
    if (audioCtx.state === 'suspended') {
      const unlock = () => {
        audioCtx.resume().then(() => {
          console.log('AudioContext unlocked!');
          document.removeEventListener('click', unlock);
          document.removeEventListener('keydown', unlock);
        });
      };
      document.addEventListener('click', unlock);
      document.addEventListener('keydown', unlock);
    }
  }

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
      color: 0x001133,
      wireframe: true,
      emissive: 0x007BFF,
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
    const material = new THREE.MeshBasicMaterial({ color: 0x007BFF });
    for (let i = 0; i < numBars; i++) {
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

      bars.forEach((bar, i) => {
        const scale = Math.pow(dataArray[i] / 128.0, 1.5);
        bar.scale.z = scale * 5;
        bar.material.color.setHSL(scale, 1, 0.5);
      });

      const vertices = waveMesh.geometry.attributes.position.array;
      const rows = gridSizeZ + 1;
      const cols = gridSizeX + 1;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const index = (i * cols + j) * 3 + 2;
          const frequencyIndex = Math.floor((j / cols) * dataArray.length);
          const amplitude = dataArray[frequencyIndex] / 256;
          vertices[index] = Math.sin(i * 0.1 + Date.now() * 0.01) * amplitude * 30 + Math.cos(j * 0.1 + Date.now() * 0.008) * amplitude * 20;
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

  // Song Selector
  songSelector.addEventListener('change', () => {
    console.log('Song changed:', songSelector.value);
    audio.src = songSelector.value;
    audio.load(); // Reload song
    audio.play(); // Play the new song
    initializeAudio(); // Ensure audio context is set up
  });

  // Play Audio Event
  audio.addEventListener('play', () => {
    initializeAudio();
  });

  // Handle Resize for Mobile and Desktop
function handleResize() {
  const isMobile = window.innerWidth <= 768; // Mobile breakpoint
  const smallScreen = window.innerWidth <= 480; // Smaller screens

  // Resize the Renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Adjust Circular Visualizer
  const newRadius = isMobile ? 80 : 125; // Smaller radius for mobile
  const newBarHeight = isMobile ? 7 : 10; // Shorter bars for mobile

  bars.forEach((bar, i) => {
    const angle = (i / numBars) * Math.PI * 2;
    bar.position.x = Math.cos(angle) * newRadius;
    bar.position.y = Math.sin(angle) * newRadius + (isMobile ? 30 : 60); // Lower the circle for mobile
    bar.scale.z = newBarHeight;
  });

  // Adjust Wave Mesh
  const newGridSizeX = isMobile ? 100 : 150; // Fewer grid lines for mobile
  const newGridSizeZ = isMobile ? 150 : 250; // Smaller depth for mobile

  waveMesh.geometry.dispose(); // Clear old geometry
  waveMesh.geometry = new THREE.PlaneGeometry(
    window.innerWidth,
    newGridSizeZ * gridSpacing,
    newGridSizeX,
    newGridSizeZ
  );

  waveMesh.geometry.attributes.position.needsUpdate = true;

  // Adjust Camera Position
  camera.position.y = isMobile ? 30 : 40; // Lower camera height on mobile
  camera.position.z = isMobile ? 200 : 300; // Move closer to the scene for smaller screens
  camera.lookAt(0, 40, 50);
}

// Add Resize Listener
window.addEventListener('resize', handleResize);
handleResize(); // Initialize the resize settings

