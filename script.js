import { setupGame, resetGame, checkPossibleMoves, setupDragEvents } from "./gameLogic.js";

document.addEventListener('DOMContentLoaded', () => {
    const apple = document.getElementById('start-apple');
    const img = new Image();
    img.src = apple.src;

    /* img.onload: 이미지가 로드될 때까지 대기하다가,
    로드가 완료되면 지정된 함수를 실행하는 역할 */
    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        /* 사과 이미지(img)를 캔버스의 (0, 0) 좌표에 그대로 그리고,
        이미지의 픽셀 데이터를 캔버스에 로드해
        getImageData로 분석할 수 있게 준비하는 과정 */

        apple.parentElement.addEventListener('click', function(event) {
            // ★ 클릭한 위치가 투명한지, 불투명한지 판단하는 코드 ★
            const rect = apple.getBoundingClientRect();
            // getBoundingClientRect: 해당 요소의 크기와 뷰포트 기준 위치 정보를 반환
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top;
            // event.clientX, event.clientY: 클릭 이벤트가 발생한 마우스의 x,y좌표 (뷰포트 기준)
            const pixelX = x * (img.width / apple.width);
            const pixelY = y * (img.height / apple.height);
            const pixelData = ctx.getImageData(pixelX, pixelY, 1, 1).data;
            /* (pixelX, pixelY) 위치에서 1x1 픽셀의 데이터를 가져옴
            위 배열은 [R, G, B, A] 형식으로 구성되고,
            R (인덱스 0): 빨간색 값 (0~255)
            G (인덱스 1): 초록색 값 (0~255)
            B (인덱스 2): 파란색 값 (0~255)
            A (인덱스 3): 알파 값 (투명도, 0~255) */

            // 투명한 픽셀이면 클릭 무시
            // pixelData[3] = 투명도(A)
            if (pixelData[3] === 0) {
                event.preventDefault();
                /* 이벤트의 기본 동작 중단
                클릭 이벤트가 불필요하게 전파되거나
                다른 동작을 트리거하지 않도록 방지 */
                event.stopPropagation();
                /* 이벤트가 부모 요소로 전파되는 것을 중단
                투명한 부분 클릭 시 이벤트가 #start-button이나
                다른 부모 요소로 전달되지 않도록 막아줌 */
                return;
            }

            // 클릭 이벤트: 단순히 게임 화면 전환 후 보드 초기화 역할만 수행
            const startScreen = document.getElementById('start-screen');
            const gameScreen = document.getElementById('game-screen');
            // 버튼 클릭 효과
            apple.classList.add('pulse');
            setTimeout(() => {
                apple.classList.remove('pulse');
                // 화면 전환 효과
                startScreen.classList.add('fade-out');
                setTimeout(() => {
                    startScreen.style.display = 'none';
                    gameScreen.classList.add('fade-in');
                    gameScreen.style.display = 'block';

                    // 초기화 로직 분리
                    initializeGameBoard();
                    // 게임 시작 시 BGM 재생
                    if (bgmCheckbox.checked) {
                        bgm.play();
                    }
                }, 500);
            }, 400);            
        });

        // 마우스 이동 시 실시간으로 커서 변경
        /* mousemove 이벤트를 사용해 마우스가 불투명한 부분 위에 있을 때
        커서를 포인터로 변경 */
        apple.parentElement.addEventListener('mousemove', function(event) {
            const rect = apple.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const pixelX = x * (img.width / apple.width);
            const pixelY = y * (img.height / apple.height);
            const pixelData = ctx.getImageData(pixelX, pixelY, 1, 1).data;

            // 불투명한 부분일 때 커서 포인터로 설정
            /* apple.parentElement에 커서 스타일을 적용하여
            클릭 가능한 부분임을 시각적으로 표시 */
            if (pixelData[3] > 0) {
                apple.parentElement.style.cursor = 'pointer';
            } else {
                apple.parentElement.style.cursor = 'default'; // 투명한 부분에서는 기본 커서
            }
        });
    };

    /* initializeGameBoard: 게임 보드를 새로 만드는 함수
    게임 화면이 표시될 때마다 사과 170개를 배열하고,
    숫자를 랜덤으로 배치하며,
    총합이 10의 배수가 되도록 초기화하는 작업 */
    function initializeGameBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';   // 기존 내용 제거

        const totalApples = 170;    // 총 170개 사과 필요
        const numbers = new Array(totalApples); // 이 배열에 170개의 숫자를 넣을 거임

        // 1~9 사이의 랜덤 숫자 생성
        let totalSum = 0;   // 모든 숫자의 합을 저장할 변수
        for (let i=0; i<totalApples; i++) {
            numbers[i] = Math.floor(Math.random() * 9) + 1;
            /*
            Math.random(): 0에서 1 미만의 랜덤 숫자를 줌
            9를 곱해 0~8 사이로 만들고,
            1을 더해 1~9 사이가 되도록 함
            Math.floor: 소수점을 버려 정수로 만들어줌
            */
            totalSum += numbers[i]; // 새로 만든 숫자를 totalSum에 더해서 합계 갱신
        }

        // 170개 숫자의 총합이 10의 배수가 되어야 함
        // 랜덤으로 만든 숫자의 합이 10의 배수가 아닐 수 있어 고쳐줘야 함
        const remainder = totalSum % 10;    // 나머지 계산
        /* 나머지가 0이 아닐 경우, 숫자 조정 시작
        (ex) totalSum = 173일 경우 remainder = 3 */
        if (remainder !== 0) {
            const adjustment = 10 - remainder;
            /* 나머지를 10에서 빼서 합을 10의 배수로 만들기 위해 필요한 수를 구함
            (ex) adjustment = 7 */
            let remainingAdjustment = adjustment;   // 조정값 저장

            // 조정값이 0이 될 때까지 반복
            while (remainingAdjustment > 0) { 
                const index = Math.floor(Math.random() * totalApples);
                /* 랜덤으로 사과 선택해 숫자 조정
                0부터 169까지 랜덤한 위치를 골라서, 어떤 사과를 고칠지 정함 */
                const currentNumber = numbers[index];   // 그 사과에 있던 숫자를 확인함
                const maxIncrease = 9 - currentNumber;
                // 현재 숫자에서 9(최대)까지 늘릴 수 있는 최댓값을 계산
                const increase = Math.min(remainingAdjustment, maxIncrease);
                /* remainingAdjustment(조정값)과 maxIncrease(최대 증가값) 중 더 작은 값을 선택
                (ex) 현재 고른 사과의 숫자가 4라면,
                최대 5까지 늘릴 수 있고, 5와 조정값 7 중 5를 선택 */

                // 증가값이 0보다 크면(= 바꿀 수 있으면) 실행
                if (increase > 0) {
                    numbers[index] += increase; // 선택한 사과의 숫자를 증가시킴 (ex) 4가 9가 됨
                    remainingAdjustment -= increase;    // 남은 조정값을 줄임 (ex) 7 - 5 = 2
                }
            }
            /* 이 과정을 반복해서 remainingAdjustment가
            0이 될 때까지 숫자를 조금씩 늘리면 합이 10의 배수가 된다. */
        }

        // 총합 확인 (디버깅)
        totalSum = numbers.reduce((sum, num) => sum + num, 0);
        console.log('Total Sum:', totalSum, '은(는) 10의 배수입니다.', totalSum % 10 === 0);
        
        // 사과와 숫자 생성
        for (let i=0; i<totalApples; i++) {
            const appleDiv = document.createElement('div');
            appleDiv.classList.add('game-apple');
            appleDiv.dataset.index = i;
            appleDiv.dataset.number = numbers[i];

            const numberSpan = document.createElement('span');
            numberSpan.classList.add('apple-number');
            numberSpan.textContent = numbers[i];    // 배열에서 숫자를 꺼내서 <span>에 넣음

            appleDiv.appendChild(numberSpan);   // 숫자를 사과 안에 넣음
            gameBoard.appendChild(appleDiv);    // 사과를 게임 보드에 추가
        }

        setupGame();    // gameLogic.js에서 정의
        setupDragEvents();
        checkPossibleMoves();
    }

    // 하단 설정 바
    const bgm = new Audio('./assets/bgm.mp3');
    bgm.loop = true;
    const bgmCheckbox = document.getElementById('checkbox');

    // BGM 체크박스 이벤트
    bgmCheckbox.addEventListener('change', () => {
        if (bgmCheckbox.checked) {
            bgm.play();
        } else {
            bgm.pause();
        }
    });

    // Reset 버튼 이벤트
    document.getElementById('reset-button').addEventListener('click', () => {
        const gameScreen = document.getElementById('game-screen');
        const startScreen = document.getElementById('start-screen');
        resetGame();
        gameScreen.classList.add('fade-out');
        setTimeout(()=> {
            gameScreen.style.display = 'none';
            startScreen.classList.add('fade-in');
            startScreen.style.display = 'flex';
            bgmCheckbox.checked = false;
            bgm.pause();
        }, 500);
    })
});
