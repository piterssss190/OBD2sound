// OBD2 Sound Simulator - Complete Application with Advanced Audio Effects
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
        
        // NEW: User-defined RPM limits
        this.userMinRPM = null;
        this.userMaxRPM = null;
        
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
        this.setupRPMControls();
        this.checkBluetoothSupport();
        this.setupAudioContext();
        this.registerServiceWorker();
        this.setupPWA();
    }

    // ==================== NEW: RPM CONTROLS SETUP ====================
    setupRPMControls() {
        const minRpmSlider = document.getElementById('minRpmSlider');
        const maxRpmSlider = document.getElementById('maxRpmSlider');
        const resetRpmBtn = document.getElementById('resetRpmBtn');

        if (minRpmSlider) {
            // Load saved values from localStorage
            const savedMinRpm = localStorage.getItem(`minRpm_${this.selectedSound}`);
            if (savedMinRpm) {
                minRpmSlider.value = savedMinRpm;
                document.getElementById('minRpmValue').textContent = savedMinRpm;
                this.userMinRPM = parseInt(savedMinRpm);
            }

            minRpmSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const maxValue = parseInt(maxRpmSlider.value);

                // Prevent min from exceeding max
                if (value >= maxValue) {
                    e.target.value = maxValue - 100;
                    return;
                }

                this.userMinRPM = value;
                document.getElementById('minRpmValue').textContent = value;
                
                // Save to localStorage
                localStorage.setItem(`minRpm_${this.selectedSound}`, value);
                
                this.updateRPMRangeInfo();
                this.updateRPMDisplay(this.smoothedRPM);
            });
        }

        if (maxRpmSlider) {
            // Load saved values from localStorage
            const savedMaxRpm = localStorage.getItem(`maxRpm_${this.selectedSound}`);
            if (savedMaxRpm) {
                maxRpmSlider.value = savedMaxRpm;
                document.getElementById('maxRpmValue').textContent = savedMaxRpm;
                this.userMaxRPM = parseInt(savedMaxRpm);
            }

            maxRpmSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const minValue = parseInt(minRpmSlider.value);

                // Prevent max from going below min
                if (value <= minValue) {
                    e.target.value = minValue + 100;
                    return;
                }

                this.userMaxRPM = value;
                document.getElementById('maxRpmValue').textContent = value;
                
                // Save to localStorage
                localStorage.setItem(`maxRpm_${this.selectedSound}`, value);
                
                this.updateRPMRangeInfo();
                this.updateRPMDisplay(this.smoothedRPM);
            });
        }

        if (resetRpmBtn) {
            resetRpmBtn.addEventListener('click', () => {
                this.resetRPMToDefault();
            });
        }
    }

    // NEW: Update RPM range display
    updateRPMRangeInfo() {
        const config = this.soundConfigs[this.selectedSound];
        const minRpm = this.userMinRPM || config.minRPM;
        const maxRpm = this.userMaxRPM || config.maxRPM;
        
        const info = document.getElementById('rpmRangeInfo');
        if (info) {
            info.textContent = `Range: ${minRpm} - ${maxRpm} RPM`;
        }
    }

    // NEW: Reset RPM to default
    resetRPMToDefault() {
        const config = this.soundConfigs[this.selectedSound];
        
        // Clear localStorage
        localStorage.removeItem(`minRpm_${this.selectedSound}`);
        localStorage.removeItem(`maxRpm_${this.selectedSound}`);
        
        // Reset values
        this.userMinRPM = null;
        this.userMaxRPM = null;
        
        // Update UI
        const minRpmSlider = document.getElementById('minRpmSlider');
        const maxRpmSlider = document.getElementById('maxRpmSlider');
        
        if (minRpmSlider) {
            minRpmSlider.value = config.minRPM;
            document.getElementById('minRpmValue').textContent = config.minRPM;
        }
        
        if (maxRpmSlider) {
            maxRpmSlider.value = config.maxRPM;
            document.getElementById('maxRpmValue').textContent = config.maxRPM;
        }
        
        this.updateRPMRangeInfo();
    }

    // ==================== UI SETUP ====================
    setupUI() {
        // Connection buttons
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        if (connectBtn) connectBtn.addEventListener('click', () => this.connectToDevice());
        if (disconnectBtn) disconnectBtn.addEventListener('click', () => this.disconnect());

        // Sound selection
        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectSound(e.currentTarget));
        });

        // Playback controls
        const playBtn = document.getElementById('playBtn');
        const stopBtn = document.getElementById('stopBtn');
        if (playBtn) playBtn.addEventListener('click', () => this.startPlayback());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopPlayback());

        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value;
                const volumeValue = document.getElementById('volumeValue');
                if (volumeValue) volumeValue.textContent = volume + '%';
                if (this.gainNode) {
                    this.gainNode.gain.value = volume / 100;
                }
            });
        }

        // Test sound button
        const testSoundBtn = document.getElementById('testSoundBtn');
        if (testSoundBtn) testSoundBtn.addEventListener('click', () => this.testSound());

        // Effects toggles
        const turboToggle = document.getElementById('turboToggle');
        if (turboToggle) {
            turboToggle.addEventListener('change', (e) => {
                this.effectsEnabled.turbo = e.target.checked;
                if (this.isPlaying) {
                    this.updateTurboEffect();
                }
            });
        }

        const flutterToggle = document.getElementById('flutterToggle');
        if (flutterToggle) {
            flutterToggle.addEventListener('change', (e) => {
                this.effectsEnabled.flutter = e.target.checked;
                if (this.isPlaying) { this.updateFlutterEffect(); } }); }

    const exhaustToggle = document.getElementById('exhaustToggle');
    if (exhaustToggle) {
        exhaustToggle.addEventListener('change', (e) => {
            this.effectsEnabled.exhaust = e.target.checked;
        });
    }

    const gearShiftToggle = document.getElementById('gearShiftToggle');
    if (gearShiftToggle) {
        gearShiftToggle.addEventListener('change', (e) => {
            this.effectsEnabled.gearShift = e.target.checked;
        });
    }

    // Gear shift button
    const gearShiftBtn = document.getElementById('gearShiftBtn');
    if (gearShiftBtn) {
        gearShiftBtn.addEventListener('click', () => {
            this.playGearShiftSound();
        });
    }

    // Anti-lag pop button
    const antiLagBtn = document.getElementById('antiLagBtn');
    if (antiLagBtn) {
        antiLagBtn.addEventListener('click', () => {
            this.playAntiLagPop();
        });
    }
}

// ==================== BLUETOOTH & AUDIO SETUP ====================
checkBluetoothSupport() {
    if (!navigator.bluetooth) {
        this.updateDebug('bluetooth', '❌ Nie obsługiwane');
        console.warn('Bluetooth API not supported');
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

        this.createExhaustFilter();

        this.updateDebug('audio', '✅ Gotowe');
        this.loadSound(this.selectedSound);
    } catch (error) {
        console.error('Audio setup error:', error);
        this.updateDebug('audio', '❌ Błąd: ' + error.message);
    }
}

createExhaustFilter() {
    const config = this.soundConfigs[this.selectedSound];
    
    this.exhaustFilter = this.audioContext.createBiquadFilter();
    this.exhaustFilter.type = 'peaking';
    this.exhaustFilter.frequency.value = config.exhaustFreq;
    this.exhaustFilter.Q.value = 3;
    this.exhaustFilter.gain.value = 8;
    
    this.exhaustFilter.connect(this.gainNode);
}

// ==================== SOUND LOADING ====================
async loadSound(soundName) {
    try {
        const response = await fetch(`sounds/${soundName}.wav`);
        
        if (!response.ok) {
            throw new Error('File not found');
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

generateSyntheticSound(soundName) {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 4;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    const config = this.soundConfigs[soundName];
    const baseFreq = config.baseRPM / 60;
    const cylinders = config.cylinders;

    for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        let sample = 0;

        const firingFreq = baseFreq * (cylinders / 2);
        sample += Math.sin(2 * Math.PI * firingFreq * t) * 0.25;

        sample += Math.sin(2 * Math.PI * baseFreq * t) * 0.2;
        sample += Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.15;
        sample += Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.1;
        sample += Math.sin(2 * Math.PI * baseFreq * 4 * t) * 0.08;
        sample += Math.sin(2 * Math.PI * baseFreq * 5 * t) * 0.05;

        const intakeFreq = baseFreq * 0.3;
        sample += Math.sin(2 * Math.PI * intakeFreq * t) * 0.15;

        const flutterFreq = baseFreq * 0.8;
        const flutterAmount = config.flutterIntensity * Math.sin(2 * Math.PI * flutterFreq * t);
        sample *= (1 + flutterAmount);

        const noiseFreq = 200 + (baseFreq * 10);
        const noise = this.perlinNoise(t * noiseFreq);
        sample += noise * 0.08;

        sample += Math.sin(2 * Math.PI * baseFreq * 6 * t) * 0.04;

        const thumpFreq = firingFreq;
        const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * thumpFreq * t);
        sample *= envelope;

        if (baseFreq > 100) {
            const popFreq = baseFreq * 1.2;
            sample += Math.sin(2 * Math.PI * popFreq * t) * 0.06;
        }

        sample = Math.tanh(sample);

        channelData[i] = sample * 0.25;
    }

    this.audioBuffer = buffer;
}

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

// ==================== SOUND SELECTION ====================
selectSound(button) {
    document.querySelectorAll('.sound-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    this.selectedSound = button.dataset.sound;
    
    if (this.exhaustFilter) {
        const config = this.soundConfigs[this.selectedSound];
        this.exhaustFilter.frequency.value = config.exhaustFreq;
    }
    
    // NEW: Update RPM controls for new engine
    this.setupRPMControls();
    this.updateRPMRangeInfo();
    
    this.loadSound(this.selectedSound);
    
    if (this.isPlaying) {
        this.stopPlayback();
        setTimeout(() => this.startPlayback(), 100);
    }
}

// ==================== BLUETOOTH CONNECTION ====================
async connectToDevice() {
    if (!navigator.bluetooth) {
        alert('Bluetooth not supported in this browser!');
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
        
        const deviceInfo = document.getElementById('deviceInfo');
        if (deviceInfo) deviceInfo.classList.remove('hidden');
        
        const deviceName = document.getElementById('deviceName');
        if (deviceName) deviceName.textContent = device.name;
        
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) connectBtn.style.display = 'none';
        
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.disabled = false;

        await this.initializeELM327();

        const autoStart = document.getElementById('autoStart');
        if (autoStart && autoStart.checked) {
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

// ==================== PLAYBACK CONTROL ====================
startPlayback() {
    if (!this.audioBuffer) {
        alert('Dźwięk nie został załadowany!');
        return;
    }

    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }

    this.isPlaying = true;
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (playBtn) playBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;

    this.playAudioLoop();
    this.setupEffects();

    if (this.isConnected) {
        this.startRPMMonitoring();
    } else {
        this.startDemoMode();
    }

    this.rpmUpdateInterval = setInterval(() => {
        this.updateSmoothedRPM();
    }, 16);
}

setupEffects() {
    const config = this.soundConfigs[this.selectedSound];

    if (config.turbo && this.effectsEnabled.turbo) {
        this.turboOscillator = this.audioContext.createOscillator();
        this.turboOscillator.type = 'sine';
        this.turboOscillator.frequency.value = 4000;
        
        this.turboGain = this.audioContext.createGain();
        this.turboGain.gain.value = 0;
        
        this.turboOscillator.connect(this.turboGain);
        this.turboGain.connect(this.gainNode);
        this.turboOscillator.start();
    }

    if (this.effectsEnabled.flutter) {
        this.flutterLFO = this.audioContext.createOscillator();
        this.flutterLFO.type = 'sine';
        this.flutterLFO.frequency.value = 8;
        
        this.flutterLFOGain = this.audioContext.createGain();
        this.flutterLFOGain.gain.value = 0;
        
        this.flutterLFO.connect(this.flutterLFOGain);
        this.flutterLFO.start();
    }
}

stopPlayback() {
    this.isPlaying = false;
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (playBtn) playBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;

    if (this.sourceNode) {
        this.sourceNode.stop();
        this.sourceNode = null;
    }

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
    
    if (this.effectsEnabled.exhaust) {
        this.sourceNode.connect(this.exhaustFilter);
    } else {
        this.sourceNode.connect(this.gainNode);
    }
    
    this.sourceNode.start();
}

// ==================== EFFECTS UPDATE ====================
updateTurboEffect() {
    if (!this.turboOscillator || !this.turboGain || !this.effectsEnabled.turbo) {
        return;
    }

    const config = this.soundConfigs[this.selectedSound];
    const minRpm =this.userMinRPM || config.minRPM; const maxRpm = this.userMaxRPM || config.maxRPM; const rpmRange = maxRpm - minRpm; const rpmPercent = (this.currentRPM - minRpm) / rpmRange;

    const turboActive = rpmPercent > 0.5;
    
    if (turboActive) {
        const whistleFreq = 3500 + (rpmPercent * 2000);
        this.turboOscillator.frequency.setTargetAtTime(
            whistleFreq,
            this.audioContext.currentTime,
            0.1
        );
        
        const whistleVolume = (rpmPercent - 0.5) * 0.4;
        this.turboGain.gain.setTargetAtTime(
            whistleVolume,
            this.audioContext.currentTime,
            0.05
        );
    } else {
        this.turboGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
    }
}

updateFlutterEffect() {
    if (!this.flutterLFO || !this.flutterLFOGain || !this.effectsEnabled.flutter) {
        return;
    }

    const config = this.soundConfigs[this.selectedSound];
    const minRpm = this.userMinRPM || config.minRPM;
    const maxRpm = this.userMaxRPM || config.maxRPM;
    const rpmRange = maxRpm - minRpm;
    const rpmPercent = (this.currentRPM - minRpm) / rpmRange;
    
    const flutterAmount = rpmPercent * config.flutterIntensity;
    
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

// ==================== GEAR SHIFT & POP EFFECTS ====================
playGearShiftSound() {
    if (!this.effectsEnabled.gearShift || !this.audioContext) {
        return;
    }

    const now = this.audioContext.currentTime;
    
    const dropOsc = this.audioContext.createOscillator();
    dropOsc.type = 'sine';
    dropOsc.frequency.setValueAtTime(800, now);
    dropOsc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
    
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

    const shiftGain = this.audioContext.createGain();
    shiftGain.gain.setValueAtTime(0.3, now);
    shiftGain.gain.exponentialRampToValueAtTime(0.05, now + 0.4);

    const hpFilter = this.audioContext.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 3000;
    hpFilter.Q.value = 1;

    dropOsc.connect(shiftGain);
    noiseSource.connect(hpFilter);
    hpFilter.connect(shiftGain);
    shiftGain.connect(this.gainNode);

    dropOsc.start(now);
    dropOsc.stop(now + 0.3);
    noiseSource.start(now);
    noiseSource.stop(now + 0.4);

    if (this.sourceNode) {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.2);
        this.gainNode.gain.exponentialRampToValueAtTime(0.7, now + 0.4);
    }
}

playAntiLagPop() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    const popOsc = this.audioContext.createOscillator();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(300, now);
    popOsc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    const popBuffer = this.audioContext.createBuffer(
        1,
        this.audioContext.sampleRate * 0.1,
        this.audioContext.sampleRate
    );
    const popData = popBuffer.getChannelData(0);
    for (let i = 0; i < popData.length; i++) {
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

detectGearShift(previousRPM, currentRPM) {
    const dropThreshold = 500;
    if (previousRPM - currentRPM > dropThreshold) {
        this.playGearShiftSound();
    }
}

// ==================== RPM MONITORING ====================
startRPMMonitoring() {
    this.rpmInterval = setInterval(async () => {
        if (!this.isPlaying) return;
        await this.sendOBDCommand('010C');
    }, 100);
}

startDemoMode() {
    this.targetRPM = 1000;
    this.smoothedRPM = 800;
    let lastRPM = 800;
    const config = this.soundConfigs[this.selectedSound];
    const minRpm = this.userMinRPM || config.minRPM;
    const maxRpm = this.userMaxRPM || config.maxRPM;

    this.rpmInterval = setInterval(() => {
        if (!this.isPlaying) return;

        lastRPM = this.smoothedRPM;

        if (Math.random() < 0.02) {
            this.targetRPM = minRpm + Math.random() * (maxRpm - minRpm);
        }

        if (Math.random() < 0.005 && this.smoothedRPM > (minRpm + (maxRpm - minRpm) * 0.5)) {
            this.detectGearShift(lastRPM, this.smoothedRPM - 800);
        }
    }, 500);
}

setTargetRPM(rpm) {
    this.targetRPM = rpm;
}

updateSmoothedRPM() {
    const smoothingFactor = 0.08;
    const lastSmoothed = this.smoothedRPM;
    
    this.smoothedRPM += (this.targetRPM - this.smoothedRPM) * smoothingFactor;
    
    if (this.isConnected && (lastSmoothed - this.smoothedRPM) > 400) {
        this.playGearShiftSound();
    }
    
    this.updateRPMDisplay(this.smoothedRPM);
    this.updateTurboEffect();
    this.updateFlutterEffect();
}

// ==================== RPM DISPLAY ====================
updateRPMDisplay(rpm) {
    this.currentRPM = rpm;
    const rpmValue = document.getElementById('rpmValue');
    if (rpmValue) rpmValue.textContent = Math.round(rpm);

    const config = this.soundConfigs[this.selectedSound];
    const minRpm = this.userMinRPM || config.minRPM;
    const maxRpm = this.userMaxRPM || config.maxRPM;
    const rpmRange = maxRpm - minRpm;
    
    const percentage = Math.min(100, Math.max(0, (rpm - minRpm) / rpmRange * 100));
    const rpmBar = document.getElementById('rpmBar');
    if (rpmBar) rpmBar.style.width = percentage + '%';

    this.updatePlaybackRate();
}

updatePlaybackRate() {
    if (!this.sourceNode) return;

    const config = this.soundConfigs[this.selectedSound];
    const minRpm = this.userMinRPM || config.minRPM;
    const maxRpm = this.userMaxRPM || config.maxRPM;
    
    // Calculate rate based on user-defined range
    let rate = (this.currentRPM - minRpm) / (config.baseRPM - minRpm);
    rate = Math.max(0.5, Math.min(2.5, rate));
    
    if (this.sourceNode.playbackRate.value !== rate) {
        const currentRate = this.sourceNode.playbackRate.value;
        const diff = rate - currentRate;
        const step = diff * 0.15;
        this.sourceNode.playbackRate.value = currentRate + step;
    }
}

// ==================== TEST SOUND ====================
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

// ==================== DISCONNECT ====================
disconnect() {
    this.stopPlayback();

    if (this.device && this.device.gatt.connected) {
        this.device.gatt.disconnect();
    }

    this.device = null;
    this.characteristic = null;
    this.isConnected = false;

    this.updateStatus('disconnected', 'Niepołączony');
    const deviceInfo = document.getElementById('deviceInfo');
    if (deviceInfo) deviceInfo.classList.add('hidden');
    
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) connectBtn.style.display = 'block';
    
    const playBtn = document.getElementById('playBtn');
    if (playBtn) playBtn.disabled = true;
}

// ==================== UI HELPERS ====================
updateStatus(status, text) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (statusDot) {
        statusDot.className = 'status-dot';
        if (status === 'connected') statusDot.classList.add('connected');
        if (status === 'connecting') statusDot.classList.add('connecting');
    }

    if (statusText) {
        statusText.textContent = text;
    }
}

updateDebug(field, value) {
    const element = document.getElementById('debug' + field.charAt(0).toUpperCase() + field.slice(1));
    if (element) {
        element.textContent = value;
    }
}

showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== SERVICE WORKER & PWA ====================
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

setupPWA() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('installBtn');
        if (installBtn) installBtn.classList.remove('hidden');
    });

    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            deferredPrompt = null;
            installBtn.classList.add('hidden');
        });
    }
}

// ==================== PHONE SUPPORT ====================
setupPhoneSupport() {
    // Prevent zoom
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Keep screen on while playing
    if ('wakeLock' in navigator) {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', async () => {
                try {
                    await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.log('Wake Lock error:', err);
                }
            });
        }
    }

    // Handle phone orientation
    window.addEventListener('orientationchange', () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    });

    // Haptic feedback on buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        });
    });
}
}

// Initialize app when DOM is ready 
document.addEventListener('DOMContentLoaded', () => { window.app = new OBD2SoundSimulator(); window.app.setupPhoneSupport(); });

