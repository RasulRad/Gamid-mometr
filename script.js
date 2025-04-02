document.getElementById("start-button").addEventListener("click", () => {
    startMicrophone();
});

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
            
            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 512;  // Больше данных для анализа
            analyser.minDecibels = -90;  // Ограничение на минимальные децибелы
            analyser.maxDecibels = -10;  // Максимум для предотвращения «перегрузки»
            
            microphone.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            const image = document.getElementById("image");
            const volumeLevel = document.getElementById("volume-level");
            const triggerSound = document.getElementById("trigger-sound");

            let triggered = false;

            scriptProcessor.onaudioprocess = () => {
                if (audioContext.state === "suspended") {
                    audioContext.resume(); // Для iOS Safari
                }

                let dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);

                // Усредняем громкость, но фильтруем только громкие звуки
                let volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                volume = Math.pow(volume, 1.5);  // Усиливаем громкость, чтобы игнорировать фоновый шум

                console.log("Уровень громкости:", volume); 

                // Обновление полоски громкости
                let volumePercent = Math.min(volume * 2, 100); 
                volumeLevel.style.width = volumePercent + "%";

                // Если громкость превышает порог и не было срабатывания
                // Установим порог так, чтобы он реагировал только на сильные звуки
                if (volume > 180 && !triggered) { 
                    triggered = true;
                    image.style.transform = "scale(1.3) rotate(10deg)";
                    triggerSound.play();
                    
                    setTimeout(() => {
                        image.style.transform = "scale(1) rotate(0deg)";
                        triggered = false; // Разрешаем повторное срабатывание
                    }, 500);
                }
            };
        })
        .catch(error => {
            console.error("Ошибка доступа к микрофону:", error);
            alert("Ошибка: нет доступа к микрофону. Проверьте настройки браузера.");
        });
}
