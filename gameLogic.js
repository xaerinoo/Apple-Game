let score = 0;
let timeLeft = 120;
let timerInterval = null;
let selectedApples = [];
let isDragging = false;
let startCell = null;

export function setupGame() {
    startTimer();
    setupDragEvents();
    checkPossibleMoves();
}

export function resetGame() {
    // 타이머 정지
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    // 게임 상태 초기화
    score = 0;
    timeLeft = 120;
    selectedApples = [];
    isDragging = false;
    startCell = null;
    document.querySelector('#top-bar p:nth-child(1)').textContent = `현재 점수: ${score}`;
    document.querySelector('#top-bar p:nth-child(2)').textContent = `남은 시간: 02:00`;
    // 게임 오버 모달 제거
    const modal = document.getElementById('game-over-modal');
    if (modal) modal.remove();
}

function startTimer() {
    const timeDisplay = document.querySelector('#top-bar p:nth-child(2)');
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeDisplay.textContent = `남은 시간: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showGameOverModal();
        }
    }, 1000);
}

function showGameOverModal() {
    const modal = document.createElement('div');
    modal.id = 'game-over-modal';

    const modalContent = document.createElement('div');
    modalContent.innerHTML = `
        <h2 id="game-over-text">Game Over</h2>
        <p>SCORE: ${score}</p>
        <button id="replay-button">Replay</button>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.getElementById('replay-button').addEventListener('click', () => {
        resetGame();
        const gameScreen = document.getElementById('game-screen');
        const startScreen = document.getElementById('start-screen');
        gameScreen.classList.add('fade-out');
        startScreen.classList.remove('fade-in');
        setTimeout(() => {
            gameScreen.style.display = 'none';
            gameScreen.classList.remove('fade-out');
            startScreen.style.display = 'flex';
            startScreen.classList.add('fade-in');
            const bgmCheckbox = document.getElementById('checkbox');
            bgmCheckbox.checked = true;
            if (bgm) bgm.play().catch(error => console.log("BGM 재생 실패:", error));
        }, 500);
    });
}

export function setupDragEvents() {
    const apples = document.querySelectorAll('.game-apple');
    apples.forEach(apple => {
        apple.removeEventListener('mousedown', startDrag);
        apple.removeEventListener('mouseover', dragOver);
        apple.removeEventListener('mouseup', endDrag);
        apple.addEventListener('mousedown', startDrag);
        apple.addEventListener('mouseover', dragOver);
        apple.addEventListener('mouseup', endDrag);
    });

    document.removeEventListener('mousemove', dragOver);
    document.addEventListener('mousemove', dragOver);
    document.removeEventListener('mouseup', endDrag);
    document.addEventListener('mouseup', endDrag);
}

function startDrag(event) {
    event.preventDefault();
    isDragging = true;
    selectedApples = [];
    startCell = event.target.closest('.game-apple');
    if (startCell) {
        selectedApples.push(startCell);
        startCell.classList.add('selected-apple');
    }
}

function dragOver(event) {
    if (!isDragging || !startCell) return;
    const currentCell = event.target.closest('.game-apple');
    if (!currentCell) return;

    selectedApples.forEach(apple => apple.classList.remove('selected-apple'));
    selectedApples = [];

    const startIndex = parseInt(startCell.dataset.index);
    const currentIndex = parseInt(currentCell.dataset.index);
    
    const startRow = Math.floor(startIndex / 17);
    const startCol = startIndex % 17;
    const currentRow = Math.floor(currentIndex / 17);
    const currentCol = currentIndex % 17;

    const minRow = Math.min(startRow, currentRow);
    const maxRow = Math.max(startRow, currentRow);
    const minCol = Math.min(startCol, currentCol);
    const maxCol = Math.max(startCol, currentCol);

    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            const index = row * 17 + col;
            const apple = document.querySelector(`.game-apple[data-index="${index}"]`);
            if (apple) {
                selectedApples.push(apple);
                apple.classList.add('selected-apple');
            }
        }
    }    
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    const sum = selectedApples.reduce((total, apple) => total + parseInt(apple.dataset.number), 0);
    if (sum % 10 === 0 && sum > 0) {
        const count = selectedApples.length;
        score += count === 2 ? 4 : count === 3 ? 6 : count === 4 ? 8 : 10;
        document.querySelector('#top-bar p:nth-child(1)').textContent = `현재 점수: ${score}`;

        selectedApples.forEach(apple => {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.width = '45px';
            emptyDiv.style.height = '45px';
            emptyDiv.style.background = 'none';
            emptyDiv.dataset.index = apple.dataset.index;
            emptyDiv.classList.add('empty-cell');
            apple.replaceWith(emptyDiv);
        });
        checkPossibleMoves();
    } else {
        selectedApples.forEach(apple => apple.classList.remove('selected-apple'));
    }
    selectedApples = [];
    startCell = null;
}

export function checkPossibleMoves() {
    const apples = document.querySelectorAll('.game-apple');
    if (apples.length === 0) {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        showGameOverModal();
        return;
    }

    let hasMoves = false;

    for (let i = 0; i < apples.length; i++) {
        const startIndex = parseInt(apples[i].dataset.index);
        const startRow = Math.floor(startIndex / 17);
        const startCol = startIndex % 17;
        const startNum = parseInt(apples[i].dataset.number);

        // 가로 확인 (10의 배수)
        let sum = startNum;
        let count = 1;
        for (let col = startCol + 1; col < 17; col++) {
            const index = startRow * 17 + col;
            const apple = document.querySelector(`.game-apple[data-index="${index}"]`);
            if (!apple) break;
            sum += parseInt(apple.dataset.number);
            count++;
            if (sum % 10 === 0 && sum > 0) {
                hasMoves = true;
                break;
            }
            if (sum > 10 && sum % 10 !== 0) break;
        }

        // 세로 확인 (10의 배수)
        sum = startNum;
        count = 1;
        for (let row = startRow + 1; row < 10; row++) {
            const index = row * 17 + startCol;
            const apple = document.querySelector(`.game-apple[data-index="${index}"]`);
            if (!apple) break;
            sum += parseInt(apple.dataset.number);
            count++;
            if (sum % 10 === 0 && sum > 0) {
                hasMoves = true;
                break;
            }
            if (sum > 10 && sum % 10 !== 0) break;
        }

        if (hasMoves) break;
    }

    // 이동 가능성 없으면 게임 오버
    if (!hasMoves) {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        showGameOverModal();
    }
}