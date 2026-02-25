const russianWords = ["привет", "экран", "код", "программа", "клавиатура", "монитор", "свет", "время", "мир", "задача", "работа", "слово", "проект", "человек", "книга", "город", "машина", "день", "ночь", "вода", "огонь", "земля", "небо", "солнце", "жизнь", "система", "быстро", "точно", "успех", "школа", "язык", "мысль", "музыка", "абзац", "берег", "ветер", "голос", "дождь", "осень", "песок", "рыба", "утка", "холод", "чай", "шаг", "поле", "глаз", "звук", "лес", "рука"];

let currentMode = 'words';
let currentGoal = 25;
let timerInterval = null;
let isTestActive = false;
let startTime = null;

let charElements = [];
let currentIndex = 0;
let mistakes = 0;
let totalTyped = 0;
let wordCountGoal = 0;
let completedWords = 0;

const textDisplay = document.getElementById('text-display');
const caret = document.getElementById('caret');
const timerDisplay = document.getElementById('timer-display');
const counterDisplay = document.getElementById('counter-display');
const resultsScreen = document.getElementById('results-screen');
const configMenu = document.getElementById('config-menu');

function init() {
    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.mode-btn[data-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            currentGoal = currentMode === 'words' ? 25 : 30;
            renderValueSelector();
            resetTest();
        };
    });
    renderValueSelector();
    resetTest();
}

function renderValueSelector() {
    const valSelector = document.getElementById('value-selector');
    const values = currentMode === 'words' ? [10, 25, 50] : [15, 30, 60];
    valSelector.innerHTML = '';
    values.forEach(val => {
        const btn = document.createElement('button');
        btn.className = `mode-btn ${val === currentGoal ? 'active' : ''}`;
        btn.innerText = val;
        btn.onclick = () => {
            currentGoal = val;
            renderValueSelector();
            resetTest();
        };
        valSelector.appendChild(btn);
    });
}

function resetTest() {
    clearInterval(timerInterval);
    isTestActive = true;
    startTime = null;
    currentIndex = 0;
    mistakes = 0;
    totalTyped = 0;
    completedWords = 0;
    charElements = [];
    
    // СБРОС ВИДИМОСТИ
    textDisplay.classList.remove('hidden');
    resultsScreen.classList.add('hidden');
    configMenu.classList.remove('hidden');
    caret.style.display = "block";
    textDisplay.style.transform = "translateY(0)";
    textDisplay.innerHTML = "";
    
    if (currentMode === 'words') {
        wordCountGoal = currentGoal;
        counterDisplay.classList.remove('hidden');
        timerDisplay.classList.add('hidden');
        updateCounter();
    } else {
        wordCountGoal = 100; 
        timerDisplay.classList.remove('hidden');
        counterDisplay.classList.add('hidden');
        timerDisplay.innerText = currentGoal;
    }

    const selectedWords = Array.from({ length: wordCountGoal }, () => 
        russianWords[Math.floor(Math.random() * russianWords.length)]
    );

    selectedWords.forEach((wordText, wIdx) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word';
        for (let char of wordText) {
            const span = createCharSpan(char);
            wordDiv.appendChild(span);
            charElements.push(span);
        }
        if (wIdx < selectedWords.length - 1) {
            const spaceSpan = createCharSpan(' ');
            wordDiv.appendChild(spaceSpan);
            charElements.push(spaceSpan);
        }
        textDisplay.appendChild(wordDiv);
    });

    setTimeout(updateCaret, 0);
}

function createCharSpan(char) {
    const span = document.createElement('span');
    span.textContent = char;
    span.className = 'char';
    return span;
}

function updateCaret() {
    if (charElements.length === 0) return;
    
    const charEl = charElements[currentIndex];
    if (!charEl) return;

    caret.style.left = charEl.offsetLeft + "px";
    caret.style.top = (charEl.offsetTop + 7) + "px";

    const currentLineTop = charEl.offsetTop;
    if (currentLineTop > 50) {
        textDisplay.style.transform = `translateY(-${currentLineTop - 50}px)`;
    } else {
        textDisplay.style.transform = `translateY(0)`;
    }
}

function updateCounter() {
    counterDisplay.innerText = `${completedWords}/${wordCountGoal}`;
}

function startTimer() {
    let timeLeft = currentGoal;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) finishTest();
    }, 1000);
}

function finishTest() {
    isTestActive = false;
    clearInterval(timerInterval);
    
    // Вычисляем результаты
    const durationMin = (Date.now() - startTime) / 60000 || 0.01;
    const correctChars = document.querySelectorAll('.char.correct').length;
    const wpm = Math.round((correctChars / 5) / durationMin) || 0;
    const accuracy = totalTyped > 0 ? Math.round(((totalTyped - mistakes) / totalTyped) * 100) : 0;

    document.getElementById('wpm-value').innerText = wpm;
    document.getElementById('accuracy-value').innerText = accuracy + "%";

    // ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
    textDisplay.classList.add('hidden');
    configMenu.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    counterDisplay.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    caret.style.display = "none";
}

window.addEventListener('keydown', (e) => {
    // TAB ВСЕГДА ПЕРЕЗАПУСКАЕТ
    if (e.code === "Tab") {
        e.preventDefault();
        resetTest();
        return;
    }

    if (!isTestActive) return;

    // Подсветка кнопок
    const keyEl = document.getElementById(e.code);
    if (keyEl) {
        keyEl.classList.add('active');
        setTimeout(() => keyEl.classList.remove('active'), 100);
    }

    if (e.code === "Backspace") {
        if (currentIndex > 0) {
            currentIndex--;
            const char = charElements[currentIndex];
            if (char.classList.contains('extra')) {
                char.remove();
                charElements.splice(currentIndex, 1);
            } else {
                if (char.textContent === " " && char.classList.contains('correct')) {
                    completedWords--;
                    updateCounter();
                }
                char.classList.remove('correct', 'incorrect');
            }
            updateCaret();
        }
        return;
    }

    if (e.key.length > 1 && e.code !== "Space") return;
    if (e.code === "Space") e.preventDefault();

    if (!startTime) {
        startTime = Date.now();
        if (currentMode === 'time') startTimer();
    }

    const typedKey = e.key.toLowerCase();
    const currentCharEl = charElements[currentIndex];
    
    if (currentCharEl.textContent === " " && typedKey !== " ") {
        const extraSpan = createCharSpan(typedKey);
        extraSpan.classList.add('extra', 'incorrect');
        currentCharEl.parentNode.insertBefore(extraSpan, currentCharEl);
        charElements.splice(currentIndex, 0, extraSpan);
        currentIndex++;
        mistakes++;
        totalTyped++;
    } else {
        totalTyped++;
        if (typedKey === currentCharEl.textContent) {
            currentCharEl.classList.add('correct');
            if (currentCharEl.textContent === " ") {
                completedWords++;
                updateCounter();
            }
        } else {
            currentCharEl.classList.add('incorrect');
            mistakes++;
        }
        currentIndex++;
    }

    updateCaret();

    // ЗАВЕРШЕНИЕ
    if (currentMode === 'words' && currentIndex === charElements.length) {
        completedWords = wordCountGoal;
        updateCounter();
        finishTest();
    }
});

window.addEventListener('resize', updateCaret);
init();