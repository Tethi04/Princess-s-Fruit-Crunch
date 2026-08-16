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
            const resetBtn = document.getElementById('reset-btn');
            const victoryModal = document.getElementById('victory-modal');
            const comboAnnouncer = document.getElementById('combo-announcer');

            const width = 8;
            const squares = [];
            
            const fruitPoints = { '🍓': 10, '🍋': 20, '🍏': 30, '🍑': 40, '🍇': 50, '🍊': 60 };
            const fruitKeys = Object.keys(fruitPoints);

            const levels = [
                { level: 1, target: 2000, moves: 11 },
                { level: 2, target: 4000, moves: 22 },
                { level: 3, target: 5500, moves: 33 }, 
                { level: 4, target: 7000, moves: 44 },
                { level: 5, target: 8000, moves: 50 },
                { level: 6, target: 10000, moves: 55 },
                { level: 7, target: 12000, moves: 60 },
                { level: 8, target: 14000, moves: 65 },
                { level: 9, target: 17000, moves: 70 },
                { level: 10, target: 21000, moves: 75 }
            ];

            let currentLevelIndex = 0, score = 0, targetScore = 0, movesLeft = 0;
            let gameState = 'MODAL', comboMultiplier = 1;
            let hintTimer = null;

            let savedLevel = localStorage.getItem('princessFruiteLevel');
            if(savedLevel){
                currentLevelIndex = parseInt(savedLevel);
                if(currentLevelIndex >= levels.length) currentLevelIndex = 0;
            }

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
                if(!findAvailableMove()) {
                    suffleBoard(true);
                }
              }
  function showModal(title, text, btnText, callback, showReset = false) {
                gameState = 'MODAL';
                clearTimeout(hintTimer);

                modalContent.innerHTML = `<h2 class="modal-title">${title}</h2><p class="modal-text">${text}</p>`;
                modalBtn.innerText = btnText;
               //modalBtn.onclick = () => { modal.classList.remove('active'); callback(); };
               // modal.classList.add('active');
               if(showReset && currentLevelIndex > 0){
                resetBtn.classList.remove('hidden');
                resetBtn.onclick = () => {
                    localStorage.removeItem('princessFruitLevel');
                    currentLevelIndex = 0;
                    resetBtn.classList.add('hidden');
                    loadLevel(0);
                };
               } else {
                resetBtn.classList.add('hidden');
               }
               modal.onclick = () => {
                modal.classList.remove('active');
                callback();
               };
               modal.classList.add('active');
            }

            function loadLevel(index) {
                if (index >= levels.length) { triggerVictory(); return; }
                currentLevelIndex = index;
                let lvlData = levels[currentLevelIndex];
                targetScore = lvlData.target; movesLeft = lvlData.moves; score = 0;
                
                updateUI();
                createBoard();
                
                showModal(`Level ${lvlData.level}`, `Target: <b>${targetScore}</b> points<br>Moves: <b>${movesLeft}</b>`, "Play", () => {
                     gameState = 'PLAYING';
                    resetHintTimer();
                 }, true);
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
            
            function resetHintTimer(){
                clearTimeout(hintTimer);

                squares.forEach(sq => sq.classList.remove('hint-pulse'));

                if(gameState === 'PLAYING'){
                    hintTimer = setTimeout (() => {
                        let move = findAvailableMove();
                        if (move){
                            squares[move[0]].classList.add('hint-pulse');
                            squares[move[1]].classList.add('hint-pulse');
                        }
                    }, 5000);
                }
            }

            function findAvailableMove() {
                for(let i=0; i<width*width; i++){
                    if(i%width<width-1){
                        let t = squares[i].innerHTML; 
                        squares[i].innerHTML = squares[i+1].innerHTML; 
                        squares[i+1].innerHTML = t;
                        let match = markMatches().matched;
                        squares[i+1].innerHTML = squares[i].innerHTML; 
                        squares[i].innerHTML = t;
                        if(match) return[i, i+1];
                    }
                    if(i<width*(width-1)){
                        let t = squares[i].innerHTML; 
                        squares[i].innerHTML = squares[i+width].innerHTML; 
                        squares[i+width].innerHTML = t;
                        let match = markMatches().matched;
                        squares[i+width].innerHTML = squares[i].innerHTML; 
                        squares[i].innerHTML = t;
                        if(match) return [i, i+width]
                    }
                }
                return null;
            }

            function suffleBoard(silent = false){
                gameState = 'ANIMATING';
                let currentFruits = squares.map(sq => sq.innerHTML);

                let validBoard = false;
                while(!validBoard){
                    currentFruits.sort(() => Math.random()-0.5);
                    for(let i=0; i<64; i++) squares[i].innerHTML = currentFruits[i];

                    if(!markMatches().matched && findAvailableMove()){
                        validBoard = true;
                    }
                }
                if(!silent){
                    squares.forEach(sq => {
                        sq.classList.add('pop');
                        setTimeout(() => sq.classList.remove('pop'), 300);
                    });
                }
                setTimeout(() => {
                    gameState = 'PLAYING';
                    resetHintTimer();
                }, silent ? 0 : 350);
            }

            let startX, startY, selectedIndex = null;
            grid.addEventListener('pointerdown', (e) => {
                if (gameState !== 'PLAYING') return;
                const target = e.target.closest('.fruit');
                if (!target || target.innerHTML === '') return;
                startX = e.clientX; startY = e.clientY;
                selectedIndex = parseInt(target.id);
                target.classList.add('selected');
                resetHintTimer();
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
                clearSelection(); 
                clearTimeout(hintTimer);
                let temp = squares[id1].innerHTML;
                squares[id1].innerHTML = squares[id2].innerHTML;
                squares[id2].innerHTML = temp;

                const { matched, toRemove } = markMatches();
                if (!matched) {
                    //setTimeout(() => { squares[id2].innerHTML = squares[id1].innerHTML; squares[id1].innerHTML = temp; gameState = 'PLAYING'; }, 300);
                     squares[id1].parentElement.classList.add('shake-anim');
                     squares[id2].parentElement.classList.add('shake-anim');

                     setTimeout(() =>{
                        squares[id1].parentElement.classList.remove('shake-anim');
                        squares[id2].parentElement.classList.remove('shake-anim');
                        squares[id2].innerHTML = squares[id1].innerHTML;
                        squares[id1].innerHTML = temp;
                        gameState = 'PLAYING';
                        resetHintTimer();
                     }, 300);
                } else {
                    movesLeft--; 
                    updateUI(); 
                    comboMultiplier = 1; 
                    processMatches(toRemove);
                }
                      }
  function markMatches() {
                let toRemove = new Set(); 
                let matched = false;
                for (let r = 0; r < width; r++) {
                    for (let c = 0; c < width - 2; c++) {
                        let i = r * width + c; 
                        let type = squares[i].innerHTML;
                        if (type !== '') {
                            let matchLen = 1;
                            while (c + matchLen < width && squares[i + matchLen].innerHTML === type) matchLen++;
                            if (matchLen >= 3) { 
                                matched = true; 
                                for (let m = 0; m < matchLen; m++) 
                                    toRemove.add(i + m); 
                                }
                        }
                    }
                }
                for (let c = 0; c < width; c++) {
                    for (let r = 0; r < width - 2; r++) {
                        let i = r * width + c; 
                        let type = squares[i].innerHTML;
                        if (type !== '') {
                            let matchLen = 1;
                            while (r + matchLen < width && squares[i + (matchLen * width)].innerHTML === type) matchLen++;
                            if (matchLen >= 3) { 
                                matched = true; 
                                for (let m = 0; m < matchLen; m++) 
                                    toRemove.add(i + (m * width)); 
                                }
                        }
                    }
                }
                return { matched, toRemove };
            }

            function showComboText(text){
                comboAnnouncer.innerText = text;
                comboAnnouncer.classList.remove('combo-anim');
                void comboAnnouncer.offsetWidth;
                comboAnnouncer.classList.add('combo-anim');
            }

            function processMatches(toRemove) {
                gameState = 'ANIMATING'; 
                let pointsEarned = 0;
                toRemove.forEach(index => {
                    let fruitType = squares[index].innerHTML;
                    //if (fruitPoints[fruitType]) pointsEarned += fruitPoints[fruitType];
                    //squares[index].classList.add('pop');
                    if(fruitPoints[fruitType]){
                        let specificPoints = fruitPoints[fruitType] * comboMultiplier;
                        pointsEarned += fruitPoints[fruitType];

                        const floatText = document.createElement('div');
                        floatText.className = 'floating-text';
                        floatText.innerText = `+${specificPoints}`;
                        squares[index].parentElement.appendChild(floatText);

                        setTimeout(() => floatText.remove(), 1000);
                    }
                    squares[index].classList.add('pop');
                });

                score += (pointsEarned * comboMultiplier); 
                updateUI();

                setTimeout(() => {
                    toRemove.forEach(index => { 
                        squares[index].innerHTML = ''; 
                        squares[index].classList.remove('pop'); 
                    });
                    applyGravity();
                    setTimeout(() => {
                        const { matched, toRemove: newToRemove } = markMatches();
                        if (matched) { 
                            comboMultiplier++; 

                            if(comboMultiplier === 3) showComboText("Sweet! x2");
                            else if(comboMultiplier === 4) showComboText("Magnificent! x3");
                            else if(comboMultiplier >=5) showComboText("ROYAL! x" + (comboMultiplier-1));

                            processMatches(newToRemove);
                         } 
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
                                    squares[aboveIndex].innerHTML = ''; 
                                    break;
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
                //if (score >= targetScore) showModal("Level Cleared!", `Amazing! You scored ${score} points.`, "Next Level", () => loadLevel(currentLevelIndex + 1));
                //else if (movesLeft <= 0) showModal("Out of Moves!", `You needed ${targetScore - score} more points.`, "Try Again", () => loadLevel(currentLevelIndex));
                //else gameState = 'PLAYING';
                if(score >= targetScore){
                    let nextLevel = currentLevelIndex + 1;
                    localStorage.setItem('princessFruitLevel', nextLevel);
                    showModal("Level Cleared!", `Amazing! You scored ${score} points.`, "Next Level", () => loadLevel(nextLevel));
                }
                else if (movesLeft <= 0) {
                    showModal("Out of Moves!", `You needed ${targetScore-score} more points.`, "Try Again", () => loadLevel(currentLevelIndex));
                }
                else {
                    gameState = 'PLAYING';

                if(!findAvailableMove()){
                    showComboText("Shuffling...");
                    setTimeout(() => suffleBoard(), 1000);
                } else {
                    resetHintTimer();
                }
            }
         }

            function triggerVictory() {
                gameState = 'MODAL'; 
                clearTimeout(hintTimer);
                victoryModal.classList.add('active');
                const closedGift = document.getElementById('gift-closed'), openGift = document.getElementById('gift-open'), hint = document.getElementById('gift-hint');
                closedGift.onclick = () => {
                    closedGift.style.display = 'none'; 
                    hint.style.display = 'none';
                    openGift.classList.remove('hidden'); 
                    openGift.classList.add('flex');
                };
            }

            window.resetGameCompletely = () => {
                localStorage.removeItem('princessFruitLevel');
                location.reload();
            };

            loadLevel(0);
        });
