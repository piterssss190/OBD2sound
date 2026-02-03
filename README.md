# 🏎️ OBD2 Sound Simulator - Instrukcja instalacji i użytkowania

## 📋 Spis treści
1. [Wymagania](#wymagania)
2. [Instalacja](#instalacja)
3. [Uruchomienie](#uruchomienie)
4. [Użytkowanie](#użytkowanie)
5. [Rozwiązywanie problemów](#rozwiązywanie-problemów)
6. [FAQ](#faq)

---

## 🔧 Wymagania

### Sprzęt
- **iPhone** (iOS 13+) lub telefon **Android** (8.0+)
- **Adapter OBD2 Bluetooth** kompatybilny z iOS:
  - ⚠️ **WAŻNE**: Większość tanich adapterów ELM327 działa tylko z Android!
  - ✅ Sprawdzone modele dla iOS:
    - **Veepeak OBDCheck BLE+** (ok. 100-150 zł)
    - **OBDLink MX+** (ok. 400-500 zł)
    - **Carista OBD2** (ok. 200 zł)
  - Adapter musi obsługiwać **Bluetooth 4.0 (BLE)** dla iOS

### Oprogramowanie
- **Przeglądarka**:
  - **Android**: Chrome, Edge
  - **iOS**: **Bluefy Browser** (OBOWIĄZKOWO - Safari nie obsługuje Web Bluetooth!)

---

## 📥 Instalacja

### Metoda 1: Hosting lokalny (Najszybsza)

#### Krok 1: Pobierz pliki
Możesz pobrać wszystkie pliki z tego folderu lub sklonować repozytorium.

#### Krok 2: Uruchom lokalny serwer

**Opcja A - Python (najprostsze):**
```bash
# Przejdź do folderu z plikami
cd obd2-sound-simulator

# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Opcja B - Node.js:**
```bash
# Zainstaluj http-server globalnie
npm install -g http-server

# Uruchom serwer
cd obd2-sound-simulator
http-server -p 8000
```

**Opcja C - PHP:**
```bash
cd obd2-sound-simulator
php -S localhost:8000
```

#### Krok 3: Otwórz w przeglądarce
- Na komputerze: `http://localhost:8000`
- Na telefonie w tej samej sieci WiFi: `http://[IP_KOMPUTERA]:8000`

**Jak znaleźć IP komputera:**
- Windows: `ipconfig` w CMD
- Mac/Linux: `ifconfig` lub `ip addr`
- Przykład: `http://192.168.1.100:8000`

---

### Metoda 2: GitHub Pages (Najłatwiejsza - bez komputera)

#### Krok 1: Stwórz konto na GitHub
Wejdź na [github.com](https://github.com) i załóż darmowe konto.

#### Krok 2: Stwórz nowe repozytorium
1. Kliknij "+" w prawym górnym rogu → "New repository"
2. Nazwa: `obd2-sound-simulator`
3. Ustaw jako **Public**
4. Kliknij "Create repository"

#### Krok 3: Dodaj pliki
1. Kliknij "uploading an existing file"
2. Przeciągnij wszystkie pliki:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `sw.js`
3. Kliknij "Commit changes"

#### Krok 4: Włącz GitHub Pages
1. Przejdź do **Settings** (ustawienia repozytorium)
2. W menu bocznym kliknij **Pages**
3. W sekcji "Source" wybierz **main** branch
4. Kliknij **Save**
5. Po chwili pojawi się link: `https://[twoj-username].github.io/obd2-sound-simulator`

#### Krok 5: Otwórz na telefonie
- Skopiuj link z GitHub Pages
- Otwórz w **Bluefy Browser** (iOS) lub **Chrome** (Android)

---

### Metoda 3: Netlify/Vercel (Alternatywa)

**Netlify Drop:**
1. Wejdź na [app.netlify.com/drop](https://app.netlify.com/drop)
2. Przeciągnij cały folder `obd2-sound-simulator`
3. Otrzymasz link typu `https://nazwa.netlify.app`

**Vercel:**
1. Zainstaluj Vercel CLI: `npm i -g vercel`
2. W folderze aplikacji: `vercel --prod`
3. Otrzymasz link do aplikacji

---

## 🚀 Uruchomienie na iPhone

### Krok 1: Zainstaluj Bluefy Browser
1. Otwórz **App Store**
2. Szukaj: **"Bluefy Browser"**
3. Pobierz i zainstaluj (darmowa, są reklamy)

### Krok 2: Otwórz aplikację
1. Uruchom **Bluefy Browser**
2. Wpisz adres aplikacji:
   - GitHub Pages: `https://[username].github.io/obd2-sound-simulator`
   - Lokalny: `http://[IP]:8000`
3. Poczekaj na załadowanie

### Krok 3: Zainstaluj jako PWA (opcjonalnie)
1. W Bluefy kliknij przycisk **"Share"** (udostępnij)
2. Wybierz **"Add to Home Screen"**
3. Nazwa: "OBD2 Sound"
4. Kliknij **"Add"**
5. Ikona pojawi się na ekranie głównym iPhone

### Krok 4: Dodaj ikony (opcjonalnie)
Aby aplikacja wyglądała profesjonalnie, dodaj ikony:

**Szybkie rozwiązanie - wygeneruj online:**
1. Wejdź na [favicon.io](https://favicon.io/favicon-generator/)
2. Stwórz ikonę (np. emoji 🏎️)
3. Pobierz paczka PNG
4. Zmień nazwę na `icon-192.png` i `icon-512.png`
5. Dodaj do repozytorium

**Lub użyj gotowych:**
Możesz użyć dowolnych obrazków 192x192 i 512x512 pikseli.

---

## 🎮 Użytkowanie

### Przygotowanie samochodu
1. **Podłącz adapter OBD2**:
   - Znajdź port OBD2 w aucie (zazwyczaj pod deską rozdzielczą po stronie kierowcy)
   - Włóż adapter ELM327
2. **Włącz zapłon** (nie musisz uruchamiać silnika)
3. Adapter powinien się zaświecić (zazwyczaj niebieska dioda)

### Połączenie z aplikacją

#### Na iOS (Bluefy):
1. Otwórz aplikację w **Bluefy Browser**
2. Kliknij **"📡 Połącz z ELM327"**
3. Wybierz swój adapter z listy (np. "OBDII", "V-LINK")
4. Poczekaj na inicjalizację (10-15 sekund)
5. Status zmieni się na **"Połączony"** (zielona kropka)

#### Na Android (Chrome):
1. Otwórz aplikację w **Chrome**
2. Kliknij **"📡 Połącz z ELM327"**
3. Wybierz adapter
4. Udziel pozwolenia na Bluetooth
5. Połączenie gotowe!

### Wybór dźwięku silnika
1. Wybierz jeden z dostępnych dźwięków:
   - **V8 Muscle** - amerykański muscle car
   - **V6 Sport** - sportowy V6
   - **2JZ Turbo** - legendarny silnik Toyota
   - **V10 F1** - wyścigowy V10
2. Kliknij kafelek z wybranym dźwiękiem

### Odtwarzanie
1. Kliknij **"▶️ Start"**
2. Aplikacja zacznie odtwarzać dźwięk silnika
3. Dźwięk będzie się zmieniał wraz z obrotami silnika!
4. Dostosuj głośność suwakiem
5. Kliknij **"⏹️ Stop"** aby zatrzymać

### Tryb Demo (bez samochodu)
Jeśli nie masz podłączonego adaptera:
1. NIE łącz się przez Bluetooth
2. Kliknij **"▶️ Start"**
3. Aplikacja uruchomi **tryb demo** z symulowanymi obrotami
4. Świetne do testowania!

---

## 🔧 Rozwiązywanie problemów

### Problem: "Bluetooth nie jest obsługiwane"
**Rozwiązanie:**
- **iOS**: Musisz użyć **Bluefy Browser**! Safari nie obsługuje Web Bluetooth
- **Android**: Użyj Chrome, Edge lub Opera
- Sprawdź czy masz włączone pozwolenia na Bluetooth

### Problem: Nie widzę adaptera na liście
**Rozwiązanie:**
1. Sprawdź czy adapter świeci się
2. Włącz zapłon w aucie
3. Usuń sparowanie adaptera w ustawieniach Bluetooth telefonu
4. Spróbuj ponownie
5. Niektóre adaptery mają tryb uśpienia - odpnij i podłącz ponownie

### Problem: Aplikacja się łączy, ale nie pokazuje obrotów
**Rozwiązanie:**
1. Uruchom silnik (niektóre auta nie wysyłają RPM przy samym zapłonie)
2. Sprawdź sekcję **"Diagnostyka"** - powinny pojawiać się komendy
3. Spróbuj zresetować adapter (odpnij i podłącz ponownie)

### Problem: Dźwięk nie gra lub jest przerywany
**Rozwiązanie:**
1. Sprawdź głośność telefonu
2. Kliknij **"🔊 Test dźwięku"** w sekcji Diagnostyka
3. Spróbuj innej przeglądarki
4. Zamknij inne aplikacje używające audio

### Problem: Połączenie się przerywa
**Rozwiązanie:**
1. Niektóre tanie adaptery mają słaby Bluetooth
2. Trzymaj telefon blisko adaptera
3. Wyłącz WiFi na telefonie (może powodować zakłócenia)
4. Sprawdź baterie w adapterze (jeśli ma własne zasilanie)

### Problem: iOS - Bluefy pokazuje reklamy
**Rozwiązanie:**
- Bluefy w wersji darmowej ma reklamy
- Opcja 1: Kup wersję Pro (~20 zł)
- Opcja 2: Używaj z reklamami (nie wpływają na działanie)

---

## ❓ FAQ

### Czy to działa bez samochodu?
**TAK!** Aplikacja ma **tryb demo** - po prostu nie łącz się z Bluetooth i kliknij Start.

### Czy mogę dodać własne dźwięki silnika?
**TAK!** Ale wymaga to edycji kodu. Aktualnie aplikacja generuje dźwięki syntetycznie.
Aby dodać własne sample:
1. Nagraj plik WAV przy stałych obrotach (np. 3000 RPM)
2. Dodaj plik do projektu
3. Edytuj `app.js` - funkcja `loadSound()`

### Które adaptery ELM327 działają z iOS?
**Tylko te z Bluetooth 4.0 BLE:**
- ✅ Veepeak OBDCheck BLE+
- ✅ OBDLink MX+
- ✅ Carista
- ❌ Większość tanich z Aliexpress (tylko Android!)

### Czy to zużywa dużo baterii?
**Średnio.** Bluetooth + ciągłe audio zużywa baterię, ale nie więcej niż słuchanie muzyki.

### Czy mogę używać w jeżdżącym aucie?
**TAK**, ale:
- Ustaw telefon w uchwycie
- Nie obsługuj aplikacji podczas jazdy
- Pamiętaj o bezpieczeństwie!

### Czy to bezpieczne dla samochodu?
**TAK!** Aplikacja tylko **odczytuje** dane przez OBD2, niczego nie zapisuje ani nie modyfikuje.

### Dlaczego dźwięk nie brzmi jak prawdziwy silnik?
Aplikacja generuje dźwięk **syntetycznie**. Dla prawdziwych dźwięków potrzebujesz:
1. Nagrać prawdziwe sample WAV
2. Dodać je do aplikacji
3. Jest to bardziej zaawansowane

### Czy mogę to sprzedawać?
To open-source. Możesz używać, modyfikować i dystrybuować zgodnie z licencją MIT.

---

## 🛠️ Dla zaawansowanych

### Dodawanie prawdziwych sampli audio

1. **Nagraj dźwięk silnika:**
   - Użyj aplikacji do nagrywania
   - Nagraj przy stałych obrotach (np. 3000 RPM)
   - Zapisz jako WAV lub MP3

2. **Konwertuj do WAV (jeśli potrzeba):**
   ```bash
   # Używając ffmpeg
   ffmpeg -i input.mp3 -acodec pcm_s16le -ar 44100 output.wav
   ```

3. **Dodaj do projektu:**
   - Umieść pliki w folderze `sounds/`
   - Nazwy: `v8.wav`, `v6.wav`, `2jz.wav`, `v10.wav`

4. **Edytuj `app.js`:**
   Znajdź funkcję `loadSound()` i zamień na:
   ```javascript
   async loadSound(soundName) {
       try {
           const response = await fetch(`sounds/${soundName}.wav`);
           const arrayBuffer = await response.arrayBuffer();
           this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
           this.updateDebug('audio', `✅ Załadowano: ${soundName}`);
       } catch (error) {
           console.error('Sound loading error:', error);
           this.generateSyntheticSound(soundName); // Fallback
       }
   }
   ```

### Dostosowanie zakresów RPM

Edytuj w `app.js`:
```javascript
this.soundConfigs = {
    'v8': { baseRPM: 3000, minRPM: 800, maxRPM: 7000 },
    'v6': { baseRPM: 3500, minRPM: 900, maxRPM: 7500 },
    // ... dodaj więcej
};
```

---

## 📞 Wsparcie

Jeśli masz problemy:
1. Sprawdź sekcję **Rozwiązywanie problemów**
2. Sprawdź sekcję **Diagnostyka** w aplikacji
3. Sprawdź konsolę przeglądarki (F12 na PC)

---

## 📄 Licencja

MIT License - możesz swobodnie używać i modyfikować.

---

## 🎉 Gotowe!

Teraz powinieneś mieć działającą aplikację OBD2 Sound Simulator!

**Powodzenia i bezpiecznej jazdy! 🏁**
