const WORDS_URL = 'https://raw.githubusercontent.com/solovets/russian-words/refs/heads/master/words.json';

let russianWords = []; 
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

// 1. ЗАГРУЗКА СЛОВ
async function loadWords() {
    textDisplay.innerText = "Загрузка словаря...";
    try {
        const response = await fetch(WORDS_URL);
        if (!response.ok) throw new Error('Сеть не отвечает');
        const data = await response.json();
        
        // Фильтруем: берем слова от 3 до 8 символов, только кириллица
        // Этот словарь содержит слова с большой буквы, приводим к нижнему регистру
        russianWords = data.filter(word => 
            word.length >= 3 && 
            word.length <= 8 && 
            /^[а-яА-ЯёЁ]+$/.test(word)
        ).map(word => word.toLowerCase());

        console.log(`Загружено слов: ${russianWords.length}`);
        init(); 
    } catch (error) {
        console.error("Ошибка:", error);
        textDisplay.innerText = "Ошибка загрузки слов. Проверьте интернет.";
        // Запасной набор
        russianWords = ["ошибка", "загрузки", "словаря", "проверьте", "интернет", "соединение"];
        init();
    }
}

// 2. ИНИЦИАЛИЗАЦИЯ
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

// 3. СБРОС И ГЕНЕРАЦИЯ
function resetTest() {
    clearInterval(timerInterval);
    isTestActive = true;
    startTime = null;
    currentIndex = 0;
    mistakes = 0;
    totalTyped = 0;
    completedWords = 0;
    charElements = [];
    
    // Возвращаем видимость элементов
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
        wordCountGoal = 100; // Генерируем много для режима времени
        timerDisplay.classList.remove('hidden');
        counterDisplay.classList.add('hidden');
        timerDisplay.innerText = currentGoal;
    }

    // Выбираем случайные слова
    const selectedWords = [];
    for(let i=0; i < wordCountGoal; i++) {
        selectedWords.push(russianWords[Math.floor(Math.random() * russianWords.length)]);
    }

    selectedWords.forEach((wordText, wIdx) => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word';
        for (let char of wordText) {
            const span = createCharSpan(char);
            wordDiv.appendChild(span);
            charElements.push(span);
        }
        // Добавляем пробел
        if (wIdx < selectedWords.length - 1) {
            const spaceSpan = createCharSpan(' ');
            wordDiv.appendChild(spaceSpan);
            charElements.push(spaceSpan);
        }
        textDisplay.appendChild(wordDiv);
    });

    setTimeout(updateCaret, 10);
}

function createCharSpan(char) {
    const span = document.createElement('span');
    span.textContent = char;
    span.className = 'char';
    return span;
}

// 4. ДВИЖЕНИЕ КАРЕТКИ
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

// 5. ЗАВЕРШЕНИЕ
function finishTest() {
    isTestActive = false;
    clearInterval(timerInterval);
    
    const durationMin = (Date.now() - (startTime || Date.now())) / 60000 || 0.01;
    const correctChars = document.querySelectorAll('.char.correct').length;
    const wpm = Math.round((correctChars / 5) / durationMin) || 0;
    const accuracy = totalTyped > 0 ? Math.round(((totalTyped - mistakes) / totalTyped) * 100) : 0;

    document.getElementById('wpm-value').innerText = wpm;
    document.getElementById('accuracy-value').innerText = accuracy + "%";

    textDisplay.classList.add('hidden');
    configMenu.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    counterDisplay.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    caret.style.display = "none";
}

function startTimer() {
    let timeLeft = currentGoal;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) finishTest();
    }, 1000);
}

// 6. ОБРАБОТКА ВВОДА
window.addEventListener('keydown', (e) => {
    // Tab работает всегда
    if (e.code === "Tab") {
        e.preventDefault();
        resetTest();
        return;
    }

    if (!isTestActive) return;

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

    // Проверка на завершение последнего слова (индекс дошел до конца)
    if (currentIndex === charElements.length) {
        if (currentMode === 'words') {
            completedWords = wordCountGoal;
            updateCounter();
            finishTest();
        }
    }
});

window.addEventListener('resize', updateCaret);

// Запуск загрузки
loadWords();