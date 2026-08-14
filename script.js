document.addEventListener('DOMContentLoaded', () => {
            const grid = document.getElementById('grid');
            const scoreDisplay = document.getElementById('score');
            const targetDisplay = document.getElementById('target-score');
            const movesDisplay = document.getElementById('moves-display');
            const levelDisplay = document.getElementById('level-display');
            const progressBar = document.getElementById('score-progress');
            
            const modal = document.getElementById('game-modal');
            const modalContent = document.getElementById('modal-content');
            const modalBtn = document.getElementById('modal-btn');
            const victoryModal = document.getElementById('victory-modal');

            const width = 8;
            const squares = [];
            
            const fruitPoints = { '🍓': 10, '🍋': 20, '🍏': 30, '🫐': 40, '🍇': 50, '🍊': 60 };
            const fruitKeys = Object.keys(fruitPoints);

            // Rebalanced levels to make Level 3 and onwards much fairer!
            const levels = [
                { level: 1, target: 2000, moves: 11 },
                { level: 2, target: 4000, moves: 22 },
                { level: 3, target: 5500, moves: 33 }, // Much easier target for Level 3!
                { level: 4, target: 7000, moves: 44 },
                { level: 5, target: 8500, moves: 50 },
                { level: 6, target: 10000, moves: 55 },
                { level: 7, target: 12000, moves: 60 },
                { level: 8, target: 14500, moves: 65 },
                { level: 9, target: 17500, moves: 70 },
                { level: 10, target: 21000, moves: 75 }
            ];

            let currentLevelIndex = 0, score = 0, targetScore = 0, movesLeft = 0;
            let gameState = 'MODAL', comboMultiplier = 1;

            function createBoard() {
                grid.innerHTML = '';
                squares.length = 0;
                for (let i = 0; i < width * width; i++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    const fruit = document.createElement('div');
                    fruit.className = 'fruit';
                    fruit.id = i;
                    
                    let randomFruit;
                    do {
                        randomFruit = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
                        fruit.innerHTML = randomFruit;
                    } while (
                        (i >= 2 && squares[i-1].innerHTML === randomFruit && squares[i-2].innerHTML === randomFruit) ||
                        (i >= width * 2 && squares[i-width].innerHTML === randomFruit && squares[i-width*2].innerHTML === randomFruit)
                    );
                    
                    cell.appendChild(fruit);
                    grid.appendChild(cell);
                    squares.push(fruit);
                }
              }
  function showModal(title, text, btnText, callback) {
                gameState = 'MODAL';
                modalContent.innerHTML = `<h2 class="modal-title">${title}</h2><p class="modal-text">${text}</p>`;
                modalBtn.innerText = btnText;
                modalBtn.onclick = () => { modal.classList.remove('active'); callback(); };
                modal.classList.add('active');
            }

            function loadLevel(index) {
                if (index >= levels.length) { triggerVictory(); return; }
                currentLevelIndex = index;
                let lvlData = levels[currentLevelIndex];
                targetScore = lvlData.target; movesLeft = lvlData.moves; score = 0;
                
                updateUI();
                createBoard();
                
                showModal(`Level ${lvlData.level}`, `Target: <b>${targetScore}</b> points<br>Moves: <b>${movesLeft}</b>`, "Play", () => { gameState = 'PLAYING'; });
            }

            function updateUI() {
                levelDisplay.innerText = levels[currentLevelIndex].level;
                targetDisplay.innerText = targetScore;
                scoreDisplay.innerText = score;
                movesDisplay.innerText = movesLeft;
                
                let progress = Math.min((score / targetScore) * 100, 100);
                progressBar.style.width = `${progress}%`;

                if (movesLeft <= 5 && movesLeft > 0) movesDisplay.classList.add('low');
                else movesDisplay.classList.remove('low');
            }

            let startX, startY, selectedIndex = null;
            grid.addEventListener('pointerdown', (e) => {
                if (gameState !== 'PLAYING') return;
                const target = e.target.closest('.fruit');
                if (!target || target.innerHTML === '') return;
                startX = e.clientX; startY = e.clientY;
                selectedIndex = parseInt(target.id);
                target.classList.add('selected');
            });

            const clearSelection = () => {
                if (selectedIndex !== null) { squares[selectedIndex].classList.remove('selected'); selectedIndex = null; }
            };
            grid.addEventListener('pointercancel', clearSelection);
            
            grid.addEventListener('pointerup', (e) => {
                if (gameState !== 'PLAYING' || selectedIndex === null) { clearSelection(); return; }
                let endX = e.clientX, endY = e.clientY;
                let diffX = endX - startX, diffY = endY - startY;
                let targetIndex = null;
                const swipeThreshold = 20;

                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
                    targetIndex = diffX > 0 ? selectedIndex + 1 : selectedIndex - 1;
                    if (selectedIndex % width === width - 1 && diffX > 0) targetIndex = null;
                    if (selectedIndex % width === 0 && diffX < 0) targetIndex = null;
                } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > swipeThreshold) {
                    targetIndex = diffY > 0 ? selectedIndex + width : selectedIndex - width;
                    if (selectedIndex >= width * (width - 1) && diffY > 0) targetIndex = null;
                    if (selectedIndex < width && diffY < 0) targetIndex = null;
                }

                squares[selectedIndex].classList.remove('selected');
                if (targetIndex !== null && targetIndex >= 0 && targetIndex < width * width) attemptSwap(selectedIndex, targetIndex);
                selectedIndex = null;
            });

            function attemptSwap(id1, id2) {
                gameState = 'ANIMATING';
                let temp = squares[id1].innerHTML;
                squares[id1].innerHTML = squares[id2].innerHTML;
                squares[id2].innerHTML = temp;

                const { matched, toRemove } = markMatches();
                if (!matched) {
                    setTimeout(() => { squares[id2].innerHTML = squares[id1].innerHTML; squares[id1].innerHTML = temp; gameState = 'PLAYING'; }, 300);
                } else {
                    movesLeft--; updateUI(); comboMultiplier = 1; processMatches(toRemove);
                }
                      }
  function markMatches() {
                let toRemove = new Set(); let matched = false;
                for (let r = 0; r < width; r++) {
                    for (let c = 0; c < width - 2; c++) {
                        let i = r * width + c; let type = squares[i].innerHTML;
                        if (type !== '') {
                            let matchLen = 1;
                            while (c + matchLen < width && squares[i + matchLen].innerHTML === type) matchLen++;
                            if (matchLen >= 3) { matched = true; for (let m = 0; m < matchLen; m++) toRemove.add(i + m); }
                        }
                    }
                }
                for (let c = 0; c < width; c++) {
                    for (let r = 0; r < width - 2; r++) {
                        let i = r * width + c; let type = squares[i].innerHTML;
                        if (type !== '') {
                            let matchLen = 1;
                            while (r + matchLen < width && squares[i + (matchLen * width)].innerHTML === type) matchLen++;
                            if (matchLen >= 3) { matched = true; for (let m = 0; m < matchLen; m++) toRemove.add(i + (m * width)); }
                        }
                    }
                }
                return { matched, toRemove };
            }

            function processMatches(toRemove) {
                gameState = 'ANIMATING'; let pointsEarned = 0;
                toRemove.forEach(index => {
                    let fruitType = squares[index].innerHTML;
                    if (fruitPoints[fruitType]) pointsEarned += fruitPoints[fruitType];
                    squares[index].classList.add('pop');
                });

                score += (pointsEarned * comboMultiplier); updateUI();

                setTimeout(() => {
                    toRemove.forEach(index => { squares[index].innerHTML = ''; squares[index].classList.remove('pop'); });
                    applyGravity();
                    setTimeout(() => {
                        const { matched, toRemove: newToRemove } = markMatches();
                        if (matched) { comboMultiplier++; processMatches(newToRemove); } 
                        else checkWinLoss();
                    }, 150);
                }, 250);
            }

            function applyGravity() {
                for (let c = 0; c < width; c++) {
                    for (let r = width - 1; r >= 0; r--) {
                        let i = r * width + c;
                        if (squares[i].innerHTML === '') {
                            for (let above = r - 1; above >= 0; above--) {
                                let aboveIndex = above * width + c;
                                if (squares[aboveIndex].innerHTML !== '') {
                                    squares[i].innerHTML = squares[aboveIndex].innerHTML;
                                    squares[aboveIndex].innerHTML = ''; break;
                                }
                            }
                        }
                    }
                  }
              for (let i = 0; i < width * width; i++) {
                    if (squares[i].innerHTML === '') squares[i].innerHTML = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
                }
            }

            function checkWinLoss() {
                if (score >= targetScore) showModal("Level Cleared!", `Amazing! You scored ${score} points.`, "Next Level", () => loadLevel(currentLevelIndex + 1));
                else if (movesLeft <= 0) showModal("Out of Moves!", `You needed ${targetScore - score} more points.`, "Try Again", () => loadLevel(currentLevelIndex));
                else gameState = 'PLAYING';
            }

            function triggerVictory() {
                gameState = 'MODAL'; victoryModal.classList.add('active');
                const closedGift = document.getElementById('gift-closed'), openGift = document.getElementById('gift-open'), hint = document.getElementById('gift-hint');
                closedGift.onclick = () => {
                    closedGift.style.display = 'none'; hint.style.display = 'none';
                    openGift.classList.remove('hidden'); openGift.classList.add('flex');
                };
            }

            loadLevel(0);
        });
