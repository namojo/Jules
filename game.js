// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 상태
let gameRunning = false;
let gamePaused = false;
let score = 0;
let level = 1;
let lives = 3;

// 공 설정
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 10,
    dx: 5,
    dy: -5,
    speed: 5,
    color: '#fff'
};

// 패들 설정
const paddle = {
    width: 120,
    height: 15,
    x: (canvas.width - 120) / 2,
    y: canvas.height - 30,
    speed: 8,
    color: '#e94560'
};

// 블록 설정
const brickConfig = {
    rows: 5,
    cols: 10,
    width: 70,
    height: 25,
    padding: 5,
    offsetTop: 50,
    offsetLeft: 35
};

// 블록 색상 (행별로 다른 색상)
const brickColors = [
    '#ff6b6b',
    '#feca57',
    '#48dbfb',
    '#1dd1a1',
    '#5f27cd'
];

// 블록 배열
let bricks = [];

// 키보드 상태
let rightPressed = false;
let leftPressed = false;

// 파티클 효과
let particles = [];

// 블록 초기화
function initBricks() {
    bricks = [];
    for (let row = 0; row < brickConfig.rows; row++) {
        bricks[row] = [];
        for (let col = 0; col < brickConfig.cols; col++) {
            const x = col * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft;
            const y = row * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop;
            bricks[row][col] = {
                x: x,
                y: y,
                status: 1,
                color: brickColors[row],
                points: (brickConfig.rows - row) * 10
            };
        }
    }
}

// 파티클 생성
function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 3 + 1,
            color: color,
            life: 1
        });
    }
}

// 파티클 업데이트
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life -= 0.02;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 파티클 그리기
function drawParticles() {
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1;
    });
}

// 공 그리기
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

    // 그라데이션 효과
    const gradient = ctx.createRadialGradient(
        ball.x - 3, ball.y - 3, 0,
        ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#e94560');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();

    // 공 그림자
    ctx.beginPath();
    ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    ctx.closePath();
}

// 패들 그리기
function drawPaddle() {
    // 패들 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(paddle.x + 3, paddle.y + 3, paddle.width, paddle.height);

    // 패들 그라데이션
    const gradient = ctx.createLinearGradient(
        paddle.x, paddle.y,
        paddle.x, paddle.y + paddle.height
    );
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#e94560');

    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
}

// 블록 그리기
function drawBricks() {
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.status === 1) {
                // 블록 그림자
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(brick.x + 2, brick.y + 2, brickConfig.width, brickConfig.height);

                // 블록 그라데이션
                const gradient = ctx.createLinearGradient(
                    brick.x, brick.y,
                    brick.x, brick.y + brickConfig.height
                );
                gradient.addColorStop(0, brick.color);
                gradient.addColorStop(1, shadeColor(brick.color, -20));

                ctx.beginPath();
                ctx.roundRect(brick.x, brick.y, brickConfig.width, brickConfig.height, 5);
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();
            }
        });
    });
}

// 색상 명도 조절
function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

// 충돌 감지
function collisionDetection() {
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.status === 1) {
                if (
                    ball.x > brick.x &&
                    ball.x < brick.x + brickConfig.width &&
                    ball.y > brick.y &&
                    ball.y < brick.y + brickConfig.height
                ) {
                    ball.dy = -ball.dy;
                    brick.status = 0;
                    score += brick.points;
                    updateScore();
                    createParticles(
                        brick.x + brickConfig.width / 2,
                        brick.y + brickConfig.height / 2,
                        brick.color
                    );

                    // 모든 블록 파괴 확인
                    if (checkAllBricksDestroyed()) {
                        levelUp();
                    }
                }
            }
        });
    });
}

// 모든 블록 파괴 확인
function checkAllBricksDestroyed() {
    return bricks.every(row => row.every(brick => brick.status === 0));
}

// 레벨업
function levelUp() {
    level++;
    ball.speed += 0.5;
    resetBallAndPaddle();
    initBricks();
    updateLevel();

    // 잠시 멈추고 다시 시작
    gamePaused = true;
    setTimeout(() => {
        gamePaused = false;
    }, 1000);
}

// 점수 업데이트
function updateScore() {
    document.getElementById('score').textContent = score;
}

// 레벨 업데이트
function updateLevel() {
    document.getElementById('level').textContent = level;
}

// 목숨 업데이트
function updateLives() {
    document.getElementById('lives').textContent = lives;
}

// 공과 패들 리셋
function resetBallAndPaddle() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = -ball.speed;
    paddle.x = (canvas.width - paddle.width) / 2;
}

// 게임 그리기
function draw() {
    // 캔버스 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 그라데이션
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#0f0f23');
    bgGradient.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 요소 그리기
    drawBricks();
    drawBall();
    drawPaddle();
    drawParticles();

    if (!gameRunning || gamePaused) {
        return;
    }

    // 파티클 업데이트
    updateParticles();

    // 충돌 감지
    collisionDetection();

    // 벽 충돌
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    }

    // 패들 충돌
    if (ball.y + ball.dy > paddle.y - ball.radius) {
        if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            // 패들 위치에 따른 반사각 조절
            const hitPoint = (ball.x - paddle.x) / paddle.width;
            const angle = hitPoint * Math.PI - Math.PI / 2;
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = speed * Math.cos(angle);
            ball.dy = -Math.abs(speed * Math.sin(angle));
        } else if (ball.y + ball.dy > canvas.height - ball.radius) {
            // 공 놓침
            lives--;
            updateLives();

            if (lives === 0) {
                gameOver(false);
            } else {
                resetBallAndPaddle();
                gamePaused = true;
                setTimeout(() => {
                    gamePaused = false;
                }, 1000);
            }
        }
    }

    // 패들 이동
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }

    // 공 이동
    ball.x += ball.dx;
    ball.y += ball.dy;
}

// 게임 오버
function gameOver(won) {
    gameRunning = false;
    const gameOverDiv = document.getElementById('gameOver');
    const title = document.getElementById('gameOverTitle');

    if (won) {
        title.textContent = '축하합니다!';
        title.style.color = '#1dd1a1';
    } else {
        title.textContent = '게임 오버';
        title.style.color = '#e94560';
    }

    document.getElementById('finalScore').textContent = score;
    gameOverDiv.style.display = 'block';
}

// 게임 재시작
function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    score = 0;
    level = 1;
    lives = 3;
    ball.speed = 5;
    updateScore();
    updateLevel();
    updateLives();
    initBricks();
    resetBallAndPaddle();
    gameRunning = true;
    gamePaused = false;
}

// 게임 시작
function startGame() {
    if (!gameRunning) {
        initBricks();
        resetBallAndPaddle();
        gameRunning = true;
        gamePaused = false;
        document.getElementById('startBtn').textContent = '일시정지';
    } else {
        gamePaused = !gamePaused;
        document.getElementById('startBtn').textContent = gamePaused ? '계속하기' : '일시정지';
    }
}

// 이벤트 리스너
document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === ' ') {
        e.preventDefault();
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
});

// 마우스 이벤트
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    if (mouseX > paddle.width / 2 && mouseX < canvas.width - paddle.width / 2) {
        paddle.x = mouseX - paddle.width / 2;
    }
});

// 터치 이벤트 (모바일 지원)
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    if (touchX > paddle.width / 2 && touchX < canvas.width - paddle.width / 2) {
        paddle.x = touchX - paddle.width / 2;
    }
});

// 시작 버튼 이벤트
document.getElementById('startBtn').addEventListener('click', startGame);

// 게임 루프
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// 초기화 및 시작
initBricks();
gameLoop();
