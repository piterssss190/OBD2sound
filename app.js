// OBD2 Sound Simulator - Advanced Audio Effects
class OBD2SoundSimulator {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
        this.isPlaying = false;
        this.currentRPM = 0;
        this.targetRPM = 0;
        this.smoothedRPM = 0;
        this.selectedSound = 'v8';
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.rpmInterval = null;
        this.rpmUpdateInterval = null;
        
        // Audio nodes for effects
        this.exhaustFilter = null;
        this.turboOscillator = null;
        this.turboGain = null;
        this.flutterOscillator = null;
        this.flutterGain = null;
        this.flutterLFO = null;
        this.flutterLFOGain = null;
        
        // Effects enabled/disabled
        this.effectsEnabled = {
            turbo: false,
            flutter: true,
            exhaust: true,
            gearShift: true
        };
        
        // Sound configurations
        this.soundConfigs = {
            'v8': { 
                baseRPM: 3000, 
                minRPM: 800, 
                maxRPM: 7000, 
                cylinders: 8,
                turbo: false,
                exhaustFreq: 150,
                flutterIntensity: 0.15
            },
            'v6': { 
                baseRPM: 3500, 
                minRPM: 900, 
                maxRPM: 7500, 
                cylinders: 6,
                turbo: false,
                exhaustFreq: 120,
                flutterIntensity: 0.12
            },
            '2jz': { 
                baseRPM: 4000, 
                minRPM: 1000, 
                maxRPM: 8000, 
                cylinders: 6,
                turbo: true,
                exhaustFreq: 180,
                flutterIntensity: 0.18
            },
            'v10': { 
                baseRPM: 5000, 
                minRPM: 1200, 
                maxRPM: 9000, 
                cylinders: 10,
                turbo: false,
                exhaustFreq: 200,
                flutterIntensity: 0.2
            }
        };

        this.init();
    }

    init() {
        this.setupUI();
        this.checkBluetoothSupport();
        this.setupAudioContext();
        this.registerServiceWorker();
        this.setupPWA();
    }

    // UI Setup
    setupUI() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connectToDevice());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());

        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSound(e.currentTarget));
        });

        document.getElementById('playBtn').addEventListener('click', () => this.startPlayback());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopPlayback());

        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            document.getElementById('volumeValue').textContent = volume + '%';
            if (this.gainNode) {
                this.gainNode.gain.value = volume / 100;
            }
        });

        document.getElementById('testSoundBtn').addEventListener('click', () => this.testSound());

        // Effects toggles
        document.getElementById('turboToggle')?.addEventListener('change', (e) => {
            this.effectsEnabled.turbo = e.target.checked;
            if (this.isPlaying) {
                this.updateTurboEffect();
            }
        });

        document.getElementById('flutterToggle')?.addEventListener('change', (e) => {
            this.effectsEnabled.flutter = e.target.checked;
            if (this.isPlaying) {
                this.updateFlutterEffect();
            }
        });

        document.getElementById('exhaustToggle')?.addEventListener('change', (e) => {
            this.effectsEnabled.exhaust = e.target.checked;
        });

        document.getElementById('gearShiftToggle')?.addEventListener('change', (e) => {
            this.effectsEnabled.gearShift = e.target.checked;
        });

        // Add gear shift simulation button
        document.getElementById('gearShiftBtn')?.addEventListener('click', () => {
            this.playGearShiftSound();
        });
    }

    checkBluetoothSupport() {
        if (!navigator.bluetooth) {
            this.updateDebug('bluetooth', '❌ Nie obsługiwane');
        } else {
            this.updateDebug('bluetooth', '✅ Dostępne');
        }
    }

    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = 0.7;

            // Create exhaust filter (low-pass + resonance)
            this.createExhaustFilter();

            this.updateDebug('audio', '✅ Gotowe');
            this.loadSound(this.selectedSound);
        } catch (error) {
            console.error('Audio setup error:', error);
            this.updateDebug('audio', '❌ Błąd: ' + error.message);
        }
    }

    // Create exhaust resonance filter
    createExhaustFilter() {
        const config = this.soundConfigs[this.selectedSound];
        
        // Biquad filter for exhaust resonance
        this.exhaustFilter = this.audioContext.createBiquadFilter();
        this.exhaustFilter.type = 'peaking';
        this.exhaustFilter.frequency.value = config.exhaustFreq;
        this.exhaustFilter.Q.value = 3; // Resonance
        this.exhaustFilter.gain.value = 8; // Boost at resonant frequency
        
        // Connect to main output
        this.exhaustFilter.connect(this.gainNode);
    }

    // Load Sound Sample
    async loadSound(soundName) {
        try {
            const response = await fetch(`sounds/${soundName}.wav`);
            
            if (!response.ok) {
                throw new Error('Nie znaleziono pliku');
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.updateDebug('audio', `✅ Załadowano: ${soundName}.wav`);
        } catch (error) {
            console.error('Sound loading error:', error);
            this.generateSyntheticSound(soundName);
            this.updateDebug('audio', '⚠️ Dźwięk syntetyczny');
        }
    }

    // IMPROVED: Generate Realistic Engine Sound with Flutter
    generateSyntheticSound(soundName) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 4;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);

        const config = this.soundConfigs[soundName];
        const baseFreq = config.baseRPM / 60;
        const cylinders = config.cylinders;

        // Generate engine sound with flutter effect
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            let sample = 0;

            // 1. FUNDAMENTAL FREQUENCY
            const firingFreq = baseFreq * (cylinders / 2);
            sample += Math.sin(2 * Math.PI * firingFreq * t) * 0.25;

            // 2. RICH HARMONICS
            sample += Math.sin(2 * Math.PI * baseFreq * t) * 0.2;
            sample += Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.15;
            sample += Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.1;
            sample += Math.sin(2 * Math.PI * baseFreq * 4 * t) * 0.08;
            sample += Math.sin(2 * Math.PI * baseFreq * 5 * t) * 0.05;

            // 3. INTAKE RESONANCE
            const intakeFreq = baseFreq * 0.3;
            sample += Math.sin(2 * Math.PI * intakeFreq * t) * 0.15;

            // 4. FLUTTER EFFECT - irregular oscillation (valve chatter)
            const flutterFreq = baseFreq * 0.8; // Flutter below fundamental
            const flutterAmount = config.flutterIntensity * Math.sin(2 * Math.PI * flutterFreq * t);
            sample *= (1 + flutterAmount);

            // 5. TURBULENT NOISE
            const noiseFreq = 200 + (baseFreq * 10);
            const noise = this.perlinNoise(t * noiseFreq);
            sample += noise * 0.08;

            // 6. COMPRESSION PEAKS
            sample += Math.sin(2 * Math.PI * baseFreq * 6 * t) * 0.04;

            // 7. AMPLITUDE MODULATION
            const thumpFreq = firingFreq;
            const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * thumpFreq * t);
            sample *= envelope;

            // 8. POPPING/FLUTTER at high RPM
            if (baseFreq > 100) { // At higher RPMs
                const popFreq = baseFreq * 1.2;
                sample += Math.sin(2 * Math.PI * popFreq * t) * 0.06;
            }

            // Soft clipping
            sample = Math.tanh(sample);

            channelData[i] = sample * 0.25;
        }

        this.audioBuffer = buffer;
    }

    // Perlin-like noise
    perlinNoise(t) {
        const ti = Math.floor(t);
        const tf = t - ti;
        const smoothstep = tf * tf * (3 - 2 * tf);
        
        const noise1 = Math.sin(ti * 12.9898) * 43758.5453;
        const noise2 = Math.sin((ti + 1) * 12.9898) * 43758.5453;
        
        const n1 = noise1 - Math.floor(noise1);
        const n2 = noise2 - Math.floor(noise2);
        
        return n1 + smoothstep * (n2 - n1) - 0.5;
    }

    // Select Sound
    selectSound(button) {
        document.querySelectorAll('.sound-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.selectedSound = button.dataset.sound;
        
        // Update filter for new engine type
        if (this.exhaustFilter) {
            const config = this.soundConfigs[this.selectedSound];
            this.exhaustFilter.frequency.value = config.exhaustFreq;
        }
        
        this.loadSound(this.selectedSound);
        
        if (this.isPlaying) {
            this.stopPlayback();
            setTimeout(() => this.startPlayback(), 100);
        }
    }

    // Connect to OBD2 Device
    async connectToDevice() {
        if (!navigator.bluetooth) {
            alert('Bluetooth nie jest obsługiwane w tej przeglądarce!');
            return;
        }

        try {
            this.showLoading(true);
            this.updateStatus('connecting', 'Łączenie...');

            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'OBD' },
                    { namePrefix: 'ELM' },
                    { namePrefix: 'OBDII' },
                    { namePrefix: 'V-LINK' },
                    { namePrefix: 'Veepeak' }
                ],
                optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb']
            });

            this.device = device;
            this.updateDebug('bluetooth', `Połączono: ${device.name}`);

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
            this.characteristic = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');

            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', (e) => {
                this.handleOBDResponse(e.target.value);
            });

            this.isConnected = true;
            this.updateStatus('connected', 'Połączony');
            document.getElementById('deviceInfo').classList.remove('hidden');
            document.getElementById('deviceName').textContent = device.name;
            document.getElementById('connectBtn').style.display = 'none';
            document.getElementById('playBtn').disabled = false;

            await this.initializeELM327();

            if (document.getElementById('autoStart').checked) {
                setTimeout(() => this.startPlayback(), 1000);
            }

            this.showLoading(false);
        } catch (error) {
            console.error('Connection error:', error);
            this.updateDebug('bluetooth', '❌ Błąd: ' + error.message);
            this.updateStatus('disconnected', 'Błąd połączenia');
            this.showLoading(false);
        }
    }

    async initializeELM327() {
        try {
            await this.sendOBDCommand('ATZ');
            await this.sleep(1000);
            await this.sendOBDCommand('ATE0');
            await this.sleep(100);
            await this.sendOBDCommand('ATL0');
            await this.sleep(100);
            await this.sendOBDCommand('ATSP0');
            await this.sleep(100);
            this.updateDebug('command', 'Inicjalizacja OK');
        } catch (error) {
            console.error('ELM327 init error:', error);
        }
    }

    async sendOBDCommand(command) {
        if (!this.characteristic) return;

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(command + '\r');
            await this.characteristic.writeValue(data);
            this.updateDebug('command', command);
        } catch (error) {
            console.error('Command send error:', error);
        }
    }

    handleOBDResponse(value) {
        const decoder = new TextDecoder();
        const response = decoder.decode(value).trim();
        this.updateDebug('response', response);

        if (response.includes('41 0C')) {
            const hex = response.replace(/\s/g, '').substring(4, 8);
            const rpm = parseInt(hex, 16) / 4;
            this.setTargetRPM(rpm);
        }
    }

// Start Playback 
startPlayback() { if (!this.audioBuffer) { alert('Dźwięk nie został załadowany!'); return; }

    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }

    this.isPlaying = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;

    this.playAudioLoop();
    this.setupEffects();

    if (this.isConnected) {
        this.startRPMMonitoring();
    } else {
        this.startDemoMode();
    }

    this.rpmUpdateInterval = setInterval(() => {
        this.updateSmoothedRPM();
    }, 16); // ~60fps smooth updates
}

// Setup audio effects nodes
setupEffects() {
    const config = this.soundConfigs[this.selectedSound];

    // TURBO WHISTLE EFFECT
    if (config.turbo && this.effectsEnabled.turbo) {
        this.turboOscillator = this.audioContext.createOscillator();
        this.turboOscillator.type = 'sine';
        this.turboOscillator.frequency.value = 4000; // Start at 4kHz
        
        this.turboGain = this.audioContext.createGain();
        this.turboGain.gain.value = 0;
        
        this.turboOscillator.connect(this.turboGain);
        this.turboGain.connect(this.gainNode);
        this.turboOscillator.start();
    }

    // ENGINE FLUTTER EFFECT
    if (this.effectsEnabled.flutter) {
        // LFO (Low Frequency Oscillator) for flutter modulation
        this.flutterLFO = this.audioContext.createOscillator();
        this.flutterLFO.type = 'sine';
        this.flutterLFO.frequency.value = 8; // 8Hz flutter rate
        
        this.flutterLFOGain = this.audioContext.createGain();
        this.flutterLFOGain.gain.value = 0;
        
        this.flutterLFO.connect(this.flutterLFOGain);
        this.flutterLFO.start();
    }
}

// Stop Playback
stopPlayback() {
    this.isPlaying = false;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;

    if (this.sourceNode) {
        this.sourceNode.stop();
        this.sourceNode = null;
    }

    // Stop all effect oscillators
    if (this.turboOscillator) {
        this.turboOscillator.stop();
        this.turboOscillator = null;
    }

    if (this.flutterLFO) {
        this.flutterLFO.stop();
        this.flutterLFO = null;
    }

    if (this.rpmInterval) {
        clearInterval(this.rpmInterval);
        this.rpmInterval = null;
    }

    if (this.rpmUpdateInterval) {
        clearInterval(this.rpmUpdateInterval);
        this.rpmUpdateInterval = null;
    }
}

playAudioLoop() {
    if (!this.isPlaying) return;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = true;
    
    // Route through exhaust filter if enabled
    if (this.effectsEnabled.exhaust) {
        this.sourceNode.connect(this.exhaustFilter);
    } else {
        this.sourceNode.connect(this.gainNode);
    }
    
    this.sourceNode.start();
}

// UPDATE TURBO EFFECT based on RPM
updateTurboEffect() {
    if (!this.turboOscillator || !this.turboGain || !this.effectsEnabled.turbo) {
        return;
    }

    const config = this.soundConfigs[this.selectedSound];
    const rpmPercent = (this.currentRPM - config.minRPM) / (config.maxRPM - config.minRPM);
    
    // Turbo activates above 50% RPM
    const turboActive = rpmPercent > 0.5;
    
    if (turboActive) {
        // Whistle frequency increases with RPM
        const whistleFreq = 3500 + (rpmPercent * 2000); // 3.5kHz to 5.5kHz
        this.turboOscillator.frequency.setTargetAtTime(
            whistleFreq,
            this.audioContext.currentTime,
            0.1
        );
        
        // Whistle volume increases with RPM intensity
        const whistleVolume = (rpmPercent - 0.5) * 0.4; // 0 to 0.2
        this.turboGain.gain.setTargetAtTime(
            whistleVolume,
            this.audioContext.currentTime,
            0.05
        );
    } else {
        // Fade out turbo at low RPM
        this.turboGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
    }
}

// UPDATE ENGINE FLUTTER EFFECT
updateFlutterEffect() {
    if (!this.flutterLFO || !this.flutterLFOGain || !this.effectsEnabled.flutter) {
        return;
    }

    const config = this.soundConfigs[this.soundConfigs];
    const rpmPercent = (this.currentRPM - config.minRPM) / (config.maxRPM - config.minRPM);
    
    // Flutter increases with RPM
    const flutterAmount = rpmPercent * config.flutterIntensity;
    
    // Flutter frequency increases with RPM (8Hz to 15Hz)
    const flutterFreq = 8 + (rpmPercent * 7);
    this.flutterLFO.frequency.setTargetAtTime(
        flutterFreq,
        this.audioContext.currentTime,
        0.05
    );
    
    this.flutterLFOGain.gain.setTargetAtTime(
        flutterAmount,
        this.audioContext.currentTime,
        0.05
    );
}

// GEAR SHIFT SOUND
playGearShiftSound() {
    if (!this.effectsEnabled.gearShift || !this.audioContext) {
        return;
    }

    // Create gear shift sound (rev drop + transmission noise)
    const now = this.audioContext.currentTime;
    
    // 1. Create pitch drop oscillator (clutch engagement)
    const dropOsc = this.audioContext.createOscillator();
    dropOsc.type = 'sine';
    dropOsc.frequency.setValueAtTime(800, now);
    dropOsc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
    
    // 2. Create transmission noise (white noise burst)
    const noiseBuffer = this.audioContext.createBuffer(
        1,
        this.audioContext.sampleRate * 0.4,
        this.audioContext.sampleRate
    );
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // 3. Envelope for gear shift
    const shiftGain = this.audioContext.createGain();
    shiftGain.gain.setValueAtTime(0.3, now);
    shiftGain.gain.exponentialRampToValueAtTime(0.05, now + 0.4);

    // 4. High-pass filter for transmission noise
    const hpFilter = this.audioContext.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 3000;
    hpFilter.Q.value = 1;

    // Connect gear shift sound chain
    dropOsc.connect(shiftGain);
    noiseSource.connect(hpFilter);
    hpFilter.connect(shiftGain);
    shiftGain.connect(this.gainNode);

    // Play
    dropOsc.start(now);
    dropOsc.stop(now + 0.3);
    noiseSource.start(now);
    noiseSource.stop(now + 0.4);

    // Temporarily reduce engine volume during shift
    const engineGain = this.sourceNode ? this.sourceNode.context.createGain() : null;
    if (engineGain) {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.2);
        this.gainNode.gain.exponentialRampToValueAtTime(0.7, now + 0.4);
    }
}

// POPPING/ANTI-LAG EFFECT
playAntiLagPop() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Create brief pitched pop
    const popOsc = this.audioContext.createOscillator();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(300, now);
    popOsc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    // Noise burst for crackle
    const popBuffer = this.audioContext.createBuffer(
        1,
        this.audioContext.sampleRate * 0.1,
        this.audioContext.sampleRate
    );
    const popData = popBuffer.getChannelData(0);
    for (let i = 0; i < popData.length; i++) {
        // Filtered noise for pop
        popData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (popData.length / 3));
    }

    const popSource = this.audioContext.createBufferSource();
    popSource.buffer = popBuffer;

    const popGain = this.audioContext.createGain();
    popGain.gain.setValueAtTime(0.4, now);
    popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    popOsc.connect(popGain);
    popSource.connect(popGain);
    popGain.connect(this.gainNode);

    popOsc.start(now);
    popOsc.stop(now + 0.05);
    popSource.start(now);
    popSource.stop(now + 0.1);
}

// Detect gear shifts (RPM drops suddenly)
detectGearShift(previousRPM, currentRPM) {
    const dropThreshold = 500; // 500 RPM drop = shift detected
    if (previousRPM - currentRPM > dropThreshold) {
        this.playGearShiftSound();
    }
}

startRPMMonitoring() {
    this.rpmInterval = setInterval(async () => {
        if (!this.isPlaying) return;
        await this.sendOBDCommand('010C');
    }, 100);
}

// Demo mode with smoother RPM transitions
startDemoMode() {
    this.targetRPM = 1000;
    this.smoothedRPM = 800;
    let lastRPM = 800;
    const config = this.soundConfigs[this.selectedSound];

    this.rpmInterval = setInterval(() => {
        if (!this.isPlaying) return;

        lastRPM = this.smoothedRPM;

        // Randomly change target RPM with realistic acceleration
        if (Math.random() < 0.02) {
            this.targetRPM = config.minRPM + Math.random() * (config.maxRPM - config.minRPM);
        }

        // Simulate occasional gear shifts
        if (Math.random() < 0.005 && this.smoothedRPM > 4000) {
            this.detectGearShift(lastRPM, this.smoothedRPM - 800);
        }
    }, 500);
}

// Smooth RPM interpolation
setTargetRPM(rpm) {
    this.targetRPM = rpm;
}

updateSmoothedRPM() {
    const smoothingFactor = 0.08;
    const lastSmoothed = this.smoothedRPM;
    
    this.smoothedRPM += (this.targetRPM - this.smoothedRPM) * smoothingFactor;
    
    // Detect gear shifts
    if (this.isConnected && (lastSmoothed - this.smoothedRPM) > 400) {
        this.playGearShiftSound();
    }
    
    this.updateRPMDisplay(this.smoothedRPM);
    this.updateTurboEffect();
    this.updateFlutterEffect();
}

// Update RPM Display
updateRPMDisplay(rpm) {
    this.currentRPM = rpm;
    document.getElementById('rpmValue').textContent = Math.round(rpm);

    const config = this.soundConfigs[this.selectedSound];
    const percentage = Math.min(100, (rpm / config.maxRPM) * 100);
    document.getElementById('rpmBar').style.width = percentage + '%';

    this.updatePlaybackRate();
}

// Smooth playback rate transition
updatePlaybackRate() {
    if (!this.sourceNode) return;

    const config = this.soundConfigs[this.selectedSound];
    
    let rate = this.currentRPM / config.baseRPM;
    rate = Math.max(0.5, Math.min(2.5, rate));
    
    if (this.sourceNode.playbackRate.value !== rate) {
        const currentRate = this.sourceNode.playbackRate.value;
        const diff = rate - currentRate;
        const step = diff * 0.15;
        this.sourceNode.playbackRate.value = currentRate + step;
    }
}

// Test Sound
testSound() {
    if (!this.audioBuffer) {
        alert('Najpierw załaduj dźwięk!');
        return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.connect(this.gainNode);
    source.start();
    source.stop(this.audioContext.currentTime + 2);
}

// Disconnect
disconnect() {
    this.stopPlayback();

    if (this.device && this.device.gatt.connected) {
        this.device.gatt.disconnect();
    }

    this.device = null;
    this.characteristic = null;
    this.isConnected = false;

    this.updateStatus('disconnected', 'Niepołączony');
    document.getElementById('deviceInfo').classList.add('hidden');
    document.getElementById('connectBtn').style.display = 'block';
    document.getElementById('playBtn').disabled = true;
}

// Update Status
updateStatus(status, text) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    statusDot.className = 'status-dot';
    if (status === 'connected') statusDot.classList.add('connected');
    if (status === 'connecting') statusDot.classList.add('connecting');

    statusText.textContent = text; }

// Update Debug Info
updateDebug(field, value) {
    const element = document.getElementById('debug' + field.charAt(0).toUpperCase() + field.slice(1));
    if (element) {
        element.textContent = value;
    }
}

// Show Loading Overlay
showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Utility: Sleep
sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Service Worker Registration
async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered');
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
}

// PWA Install Prompt
setupPWA() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBtn').classList.remove('hidden');
    });

    document.getElementById('installBtn').addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        document.getElementById('installBtn').classList.add('hidden');
    });
}
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => { window.app = new OBD2SoundSimulator(); });

