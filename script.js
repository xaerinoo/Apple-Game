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

            const startScreen = document.getElementById('start-screen');
            const gameScreen = document.getElementById('game-screen');
            // 버튼 클릭 효과과
            apple.classList.add('pulse');
            setTimeout(() => {
                apple.classList.remove('pulse');
                // 화면 전환 효과
                startScreen.classList.add('fade-out');
                setTimeout(() => {
                    startScreen.style.display = 'none';
                    gameScreen.classList.add('fade-in');
                    gameScreen.style.display = 'block';
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
});
