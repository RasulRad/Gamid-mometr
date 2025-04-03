document.getElementById("start-button").addEventListener("click", () => {
    startMicrophone();
});

const skins = {
    "Гамид": {
        image: "skins/classic.PNG",
        sound: "sound/classic.mp3"
    },

    "ВиТ": {
        image: "skins/Vkusno_I_Tochka.png",
        sound: "sound/classic.mp3"
    }
};

let clickCount = 0;
const image = document.getElementById("image");
const triggerSound = document.getElementById("trigger-sound");

// Счетчик кликов для разблокировки скина
image.addEventListener("click", () => {
    clickCount++;

    if (clickCount === 3) {
        showSkinInput();
        clickCount = 0; // Сбрасываем счётчик после появления поля ввода
    }

    setTimeout(() => { clickCount = 0; }, 1000); // Сброс, если клики были небыстрые
});

function showSkinInput() {
    const inputContainer = document.createElement("div");
    inputContainer.classList.add("popup-overlay");

    inputContainer.innerHTML = `
        <div class="skin-popup">
            <span class="close-btn">&times;</span>
            <h2>Введите кодовое слово</h2>
            <input type="text" id="skin-input" placeholder="Секретное слово...">
            <button id="apply-skin">Далее</button>
        </div>
    `;

    document.body.appendChild(inputContainer);

    // Применяем стили ОКНУ, а не затемнённому фону
    const popup = document.querySelector(".skin-popup");
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = "rgba(255, 255, 255, 0.9)";
    popup.style.padding = "20px";
    popup.style.borderRadius = "10px";
    popup.style.zIndex = "1001";
    popup.style.border = "3px solid #ff6600"; // ✅ Добавляем обводку

    // Закрытие окна при клике на крестик
    document.querySelector(".close-btn").addEventListener("click", () => {
        document.body.removeChild(inputContainer);
    });

    document.getElementById("apply-skin").addEventListener("click", () => {
        const inputValue = document.getElementById("skin-input").value.trim().toLowerCase();
        
        // Ищем подходящий ключ (без учёта регистра)
        const matchedKey = Object.keys(skins).find(key => key.toLowerCase() === inputValue);
    
        if (matchedKey) {
            image.src = skins[matchedKey].image;
            triggerSound.src = skins[matchedKey].sound;
            console.log(`✅ Скин изменён на: ${matchedKey}`);
        } else {
            console.log("❌ Неверное кодовое слово");
        }
    
        document.body.removeChild(document.querySelector(".popup-overlay"));
    });
    
}

navigator.mediaDevices.getUserMedia({ 
    audio: { 
        echoCancellation: false, // Отключаем подавление эха
        noiseSuppression: false, // Отключаем подавление шума
        autoGainControl: false // Отключаем автоматическую регулировку громкости
    } 
})


function startMicrophone() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Ваш браузер не поддерживает доступ к микрофону.");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            console.log("Доступ к микрофону получен");

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(256, 1, 1);
            
            analyser.smoothingTimeConstant = 0.3;
            analyser.fftSize = 512;  
            analyser.minDecibels = -90;  
            analyser.maxDecibels = -10;  
            
            microphone.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            const volumeLevel = document.getElementById("volume-level");

            let triggered = false;

            scriptProcessor.onaudioprocess = () => {
                if (audioContext.state === "suspended") {
                    audioContext.resume(); 
                }

                let dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);

                let volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                volume = Math.pow(volume, 1.5); 

                console.log("Уровень громкости:", volume); 

                let volumePercent = Math.min(volume * 2, 100); 
                volumeLevel.style.width = volumePercent + "%";

                if (volume > 180 && !triggered) { 
                    triggered = true;
                    image.style.transform = "scale(1.3) rotate(10deg)";
                    triggerSound.play();
                    
                    setTimeout(() => {
                        image.style.transform = "scale(1) rotate(0deg)";
                        triggered = false; 
                    }, 500);
                }
            };
        })
        .catch(error => {
            console.error("Ошибка доступа к микрофону:", error);
            alert("Ошибка: нет доступа к микрофону. Проверьте настройки браузера.");
        });
}
