// --- 1. DICCIONARIO DE IDIOMAS ---
const translations = {
    es: {
        title: "Tres en Raya", solo: "Solitario", multi: "Multijugador Local",
        settings: "Configuración", back: "Volver", restart: "Reiniciar Partida",
        language: "Idioma:", aiMode: "Modo de IA:", volume: "Volumen:", 
        soundEffects: "Efectos de Sonido:", resetData: "Opción Importante: Resetear Datos", 
        resetBtn: "Borrar Todo", turnX: "Turno de: X", turnO: "Turno de: O",
        win: "¡El jugador {player} ha ganado! 🎉", draw: "¡Es un empate! 🤝"
    },
    en: {
        title: "Tic Tac Toe", solo: "Single Player", multi: "Local Multiplayer",
        settings: "Settings", back: "Back", restart: "Restart Game",
        language: "Language:", aiMode: "AI Mode:", volume: "Volume:", 
        soundEffects: "Sound Effects:", resetData: "Important Option: Reset Data", 
        resetBtn: "Erase All", turnX: "Turn: X", turnO: "Turn: O",
        win: "Player {player} wins! 🎉", draw: "It's a draw! 🤝"
    }
};

// --- 2. ESTADO DE LA APLICACIÓN ---
let appState = {
    lang: 'es', volume: 50, soundOn: true, gameMode: 'multi',
    aiStyle: 'smart', // 🧠 Valor por defecto
    gameActive: false, currentPlayer: 'X',
    gameState: ["", "", "", "", "", "", "", "", ""]
};

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// --- 3. REFERENCIAS AL DOM ---
const screens = {
    menu: document.getElementById('main-menu'),
    game: document.getElementById('game-screen'),
    settings: document.getElementById('settings-screen')
};
const statusDisplay = document.getElementById('status');
const cells = document.querySelectorAll('.cell');

// --- 4. FUNCIONES DE NAVEGACIÓN ---
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

document.getElementById('btn-solo').addEventListener('click', () => {
    appState.gameMode = 'solo'; startGame();
});

document.getElementById('btn-multi').addEventListener('click', () => {
    appState.gameMode = 'multi'; startGame();
});

document.getElementById('btn-settings').addEventListener('click', () => showScreen('settings'));
document.getElementById('btn-back-menu').addEventListener('click', () => showScreen('menu'));
document.getElementById('btn-back-settings').addEventListener('click', () => showScreen('menu'));

// --- 5. LÓGICA DE CONFIGURACIÓN ---
function updateLanguage() {
    const t = translations[appState.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerText = t[key];
    });
    updateStatus();
}

document.getElementById('lang-select').addEventListener('change', (e) => {
    appState.lang = e.target.value;
    updateLanguage();
});

// 🎯 NUEVO: Control del modo de IA
document.getElementById('ai-style-select').addEventListener('change', (e) => {
    appState.aiStyle = e.target.value;
    playSound(500, 0.1); // Pequeño feedback sonoro
});

document.getElementById('volume-slider').addEventListener('input', (e) => {
    appState.volume = e.target.value;
    document.getElementById('volume-value').innerText = appState.volume + '%';
    playSound(400, 0.1);
});

document.getElementById('sound-toggle').addEventListener('change', (e) => {
    appState.soundOn = e.target.checked;
});

document.getElementById('btn-reset-data').addEventListener('click', () => {
    const msg = appState.lang === 'es' ? '¿Estás seguro? Se borrará todo.' : 'Are you sure?';
    if(confirm(msg)) {
        localStorage.clear();
        location.reload();
    }
});

// --- 6. SISTEMA DE SONIDO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, duration) {
    if (!appState.soundOn) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = frequency;
    gainNode.gain.value = (appState.volume / 100) * 0.5; 
    oscillator.start();
    setTimeout(() => oscillator.stop(), duration * 1000);
}

// ==========================================
// 🤖 7. LÓGICA DE LA IA (SEGÚN CONFIGURACIÓN)
// ==========================================

// Helper: Encuentra un movimiento ganador para un jugador específico
function findWinningMove(player) {
    for (let i = 0; i < 9; i++) {
        if (appState.gameState[i] === "") {
            appState.gameState[i] = player; // Simular
            if (checkWin(appState.gameState, player)) {
                appState.gameState[i] = ""; // Deshacer
                return i;
            }
            appState.gameState[i] = ""; // Deshacer
        }
    }
    return -1;
}

function checkWin(board, player) {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] === player && board[b] === player && board[c] === player) return true;
    }
    return false;
}

function getAiMove() {
    const style = appState.aiStyle;
    
    // 1. 🧠 ESTRATEGA: Perfecto (Bloquea y Ataca siempre)
    if (style === "smart") {
        let move = findWinningMove("O"); // Ganar
        if (move !== -1) return move;
        move = findWinningMove("X"); // Bloquear
        if (move !== -1) return move;
        if (appState.gameState[4] === "") return 4; // Centro
        const corners = [0, 2, 6, 8].filter(i => appState.gameState[i] === "");
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    }

    // 2. 🎲 CAÓTICO: Totalmente aleatorio
    if (style === "random") {
        // Pasa directamente al final
    }

    // 3. 🏰 DEFENSOR: Solo bloquea, ignora ataques propios
    if (style === "defensive") {
        let block = findWinningMove("X");
        if (block !== -1) return block;
        if (appState.gameState[4] === "" && Math.random() > 0.3) return 4;
    }

    // 4. ⚔️ AGRESIVO: Busca ganar, bloquea solo el 50% de las veces
    if (style === "aggressive") {
        let win = findWinningMove("O");
        if (win !== -1) return win;
        if (Math.random() > 0.5) {
            let block = findWinningMove("X");
            if (block !== -1) return block;
        }
    }

    // Movimiento por defecto: Aleatorio entre casillas libres
    const available = appState.gameState
        .map((val, idx) => val === "" ? idx : null)
        .filter(val => val !== null);
    return available[Math.floor(Math.random() * available.length)];
}

// ==========================================
// 8. LÓGICA PRINCIPAL DEL JUEGO
// ==========================================

function startGame() {
    appState.gameActive = true;
    appState.currentPlayer = 'X';
    appState.gameState = ["", "", "", "", "", "", "", "", ""];
    cells.forEach(cell => {
        cell.innerText = "";
        cell.classList.remove('x', 'o');
    });
    updateStatus();
    showScreen('game');
}

function updateStatus() {
    const t = translations[appState.lang];
    if (!appState.gameActive) return;
    
    let text = appState.currentPlayer === 'X' ? t.turnX : t.turnO;
    
    // Mostrar modo de IA actual cuando le toca a la máquina
    if (appState.gameMode === 'solo' && appState.currentPlayer === 'O') {
        const styleNames = {
            smart: '🧠 Estratega',
            defensive: '🏰 Defensor',
            aggressive: '⚔️ Agresivo',
            random: '🎲 Caótico'
        };
        text += ` vs ${styleNames[appState.aiStyle]}`;
    }
    
    statusDisplay.innerText = text;
}

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (appState.gameState[clickedCellIndex] !== "" || !appState.gameActive) return;

    makeMove(clickedCell, clickedCellIndex);
    
    // Turno de la IA
    if (appState.gameMode === 'solo' && appState.gameActive && appState.currentPlayer === 'O') {
        setTimeout(() => {
            const aiMoveIndex = getAiMove();
            const aiCell = document.querySelector(`.cell[data-index='${aiMoveIndex}']`);
            makeMove(aiCell, aiMoveIndex);
        }, 800);
    }
}

function makeMove(cell, index) {
    appState.gameState[index] = appState.currentPlayer;
    cell.innerText = appState.currentPlayer;
    cell.classList.add(appState.currentPlayer.toLowerCase());
    playSound(appState.currentPlayer === 'X' ? 600 : 400, 0.15);
    checkResult();
}

function checkResult() {
    let roundWon = false;
    const t = translations[appState.lang];

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (appState.gameState[a] && appState.gameState[a] === appState.gameState[b] && appState.gameState[a] === appState.gameState[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.innerText = t.win.replace('{player}', appState.currentPlayer);
        appState.gameActive = false;
        playSound(800, 0.5);
        return;
    }

    if (!appState.gameState.includes("")) {
        statusDisplay.innerText = t.draw;
        appState.gameActive = false;
        playSound(200, 0.5);
        return;
    }

    appState.currentPlayer = appState.currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
}

// Inicialización
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
document.getElementById('btn-restart').addEventListener('click', startGame);

// Cargar configuración guardada si existe (opcional pero recomendado)
if(localStorage.getItem('ticTacToeSettings')) {
    const saved = JSON.parse(localStorage.getItem('ticTacToeSettings'));
    appState.aiStyle = saved.aiStyle || 'smart';
    document.getElementById('ai-style-select').value = appState.aiStyle;
}
// Guardar configuración al cambiar
const saveSettings = () => localStorage.setItem('ticTacToeSettings', JSON.stringify({aiStyle: appState.aiStyle}));
document.getElementById('ai-style-select').addEventListener('change', saveSettings);

updateLanguage();
