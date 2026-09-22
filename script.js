 // --- SCREEN MANAGEMENT ---
        function showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(`screen-${screenId}`).classList.add('active');
            if (screenId === 'map') buildMap();
            if (screenId !== 'game') applyTheme(false); // Reset to world 1 theme on map/menu unless specified
        }

        function applyTheme(isWorld2) {
            if (isWorld2) {
                document.body.classList.add('theme-world-2');
                document.getElementById('map-title-txt').innerText = "🌙 Starlight Realm";
            } else {
                document.body.classList.remove('theme-world-2');
                document.getElementById('map-title-txt').innerText = "🗺️ The Kingdom";
            }
        }

        // --- GAME VARIABLES ---
        const grid = document.getElementById('grid');
        const scoreDisplay = document.getElementById('score');
        const movesDisplay = document.getElementById('moves-display');
        const levelDisplay = document.getElementById('level-display');
        const progressBar = document.getElementById('score-progress');
        const starMarkers = [document.getElementById('star-marker-1'), document.getElementById('star-marker-2'), document.getElementById('star-marker-3')];
        
        const modal = document.getElementById('game-modal');
        const modalContent = document.getElementById('modal-content');
        const modalBtn = document.getElementById('modal-btn');
        const modalMapBtn = document.getElementById('modal-map-btn');
        const modalStarsDisplay = document.getElementById('modal-stars');
        const victoryModal = document.getElementById('victory-modal');
        const comboAnnouncer = document.getElementById('combo-announcer');

        const width = 8;
        const squares = [];
            
            const baseFruitPoints = { '🍓': 10, '🍋': 20, '🍏': 30, '🍑': 40, '🍇': 50, '🍊': 60 };
            const advancedFruitPoints = { ...baseFruitPoints, '🍉': 80, '🌟':100};

           let activePoints = baseFruitPoints;
           let activeKeys = Object.keys(activePoints);

            const levels = [
                //World 1: Royal Garden
                { level: 1, targets: [2000, 3000, 4000], moves: 22 },
                { level: 2, targets: [4000, 6000, 8000], moves: 33 },
                { level: 3, targets: [5500, 7500, 9500], moves: 44 }, 
                { level: 4, targets: [7000, 9000, 1100], moves: 50 },
                { level: 5, targets: [8500, 1100, 13500], moves: 55 },
                { level: 6, targets: [10000, 13000, 16000], moves: 60 },
                { level: 7, targets: [12000, 15000, 19000], moves: 65 },
                { level: 8, targets: [14500, 18000, 22000], moves: 70 },
                { level: 9, targets: [17500, 22000, 27000], moves: 75 },
                { level: 10, targets: [21000, 26000, 32000], moves: 80 },
                //World 2: Starlight Realm
                { level: 11, targets: [25000, 35000, 45000], moves:70},
                { level: 12, targets: [35000, 48000, 60000], moves:65},
                { level: 13, targets: [45000, 60000, 75000], moves:60},
                { level: 14, targets: [58000,75000, 95000], moves:70},
                { level: 15, targets: [72000, 95000, 150000], moves:80},
                { level: 16, targets: [90000, 120000, 150000], moves:65},
                { level: 17, targets: [110000, 145000, 180000], moves:75},
                { level: 18, targets: [135000, 175000, 220000], moves:75},
                { level: 19, targets: [165000, 210000, 260000], moves: 70},
                { level: 20, targets: [200000, 250000, 320000], moves: 50 }
            ];

             let currentLevelIndex = 0, score = 0, movesLeft = 0;
        let gameState = 'MENU', comboMultiplier = 1, hintTimer = null;
        let currentStarsEarned = 0;

        // --- MAP & PROGRESSION ---
        function getSavedStars() {
            try { let saved = localStorage.getItem('princessFruitStars20'); return saved ? JSON.parse(saved) : {}; } 
            catch(e) { return {}; }
        }

        function unlockNextLevel(completedIndex, starsEarned) {
            let savedData = getSavedStars();
            if (!savedData[completedIndex] || starsEarned > savedData[completedIndex]) savedData[completedIndex] = starsEarned;
            if (completedIndex < levels.length - 1 && savedData[completedIndex + 1] === undefined) savedData[completedIndex + 1] = 0; 
            localStorage.setItem('princessFruitStars20', JSON.stringify(savedData));
        }

        function resetSave() {
            if(confirm("Are you sure you want to reset all your magical progress?")) {
                localStorage.removeItem('princessFruitStars20');
                alert("Progress reset to Level 1!");
            }
        }

        function buildMap() {
            const w1Container = document.getElementById('level-grid-w1');
            const w2Container = document.getElementById('level-grid-w2');
            w1Container.innerHTML = '<div class="map-world-title">🌷 Royal Garden</div><div class="map-grid" id="grid-w1-inner"></div>';
            w2Container.innerHTML = '<div class="map-world-title" style="color:#fde047; border-color: rgba(253,224,71,0.4)">🌙 Starlight Realm</div><div class="map-grid" id="grid-w2-inner"></div>';
            
            const gridW1 = document.getElementById('grid-w1-inner');
            const gridW2 = document.getElementById('grid-w2-inner');

            let savedData = getSavedStars();
            if (Object.keys(savedData).length === 0) savedData[0] = 0;
            
            // Check if player has unlocked world 2 to apply theme to map
            if (savedData[10] !== undefined) applyTheme(true);

            levels.forEach((lvl, index) => {
                const btn = document.createElement('div');
                let isWorld2 = index >= 10;
                let targetGrid = isWorld2 ? gridW2 : gridW1;

                if (savedData[index] !== undefined) {
                    let stars = savedData[index];
                    btn.className = `level-node ${isWorld2 ? 'w2' : ''}`;
                    let starHTML = stars > 0 ? '⭐'.repeat(stars) : '☆';
                    btn.innerHTML = `<span>${lvl.level}</span><div class="level-stars">${stars > 0 ? starHTML : ''}</div>`;
                    btn.onclick = () => loadLevel(index);
                } else {
                    btn.className = 'level-node locked';
                    btn.innerHTML = '🔒';
                }
                targetGrid.appendChild(btn);
            });

            if (savedData[19] > 0) {
                const giftBtn = document.createElement('div');
                giftBtn.className = 'level-node w2'; giftBtn.style.gridColumn = "span 3";
                giftBtn.innerHTML = '👑 Grand Prize'; giftBtn.onclick = () => triggerVictory();
                gridW2.appendChild(giftBtn);
            }
        }

        function exitToMap() { gameState = 'MENU'; clearTimeout(hintTimer); showScreen('map'); }

        // --- GAMEPLAY INITIALIZATION ---
        function createBoard() {
            grid.innerHTML = ''; squares.length = 0;
            for (let i = 0; i < width * width; i++) {
                const cell = document.createElement('div'); cell.className = 'cell';
                const fruit = document.createElement('div'); fruit.className = 'fruit'; fruit.id = i;
                let randomFruit;
                do {
                    randomFruit = activeKeys[Math.floor(Math.random() * activeKeys.length)];
                    fruit.innerHTML = randomFruit;
                } while (
                    (i >= 2 && squares[i-1].innerHTML === randomFruit && squares[i-2].innerHTML === randomFruit) ||
                    (i >= width * 2 && squares[i-width].innerHTML === randomFruit && squares[i-width*2].innerHTML === randomFruit)
                );
                cell.appendChild(fruit); grid.appendChild(cell); squares.push(fruit);
            }
            if (!findAvailableMove()) shuffleBoard(true); 
        }

        function showGameModal(title, text, primaryBtnText, primaryCallback, showMapBtn = false, showStars = 0) {
            gameState = 'MODAL'; clearTimeout(hintTimer);
            modalContent.innerHTML = `<h2 class="modal-title">${title}</h2><p class="modal-text">${text}</p>`;
            
            if (showStars > 0 || (title === "Level Cleared!" || title === "Out of Moves!")) {
                modalStarsDisplay.classList.remove('hidden');
                let starSpans = modalStarsDisplay.querySelectorAll('span');
                starSpans.forEach((span, i) => {
                    span.className = ''; 
                    if (i < showStars) setTimeout(() => span.classList.add('earned'), i * 200);
                });
            } else { modalStarsDisplay.classList.add('hidden'); }

            modalBtn.innerText = primaryBtnText;
            modalBtn.onclick = () => { modal.classList.remove('active'); primaryCallback(); };
            
            if (showMapBtn) {
                modalMapBtn.classList.remove('hidden');
                modalMapBtn.onclick = () => { modal.classList.remove('active'); exitToMap(); };
            } else { modalMapBtn.classList.add('hidden'); }
            modal.classList.add('active');
        }

        function loadLevel(index) {
            showScreen('game'); 
            currentLevelIndex = index; let lvlData = levels[currentLevelIndex];
            movesLeft = lvlData.moves; score = 0; currentStarsEarned = 0;
            
            // Set rules based on World
            if (index >= 10) {
                applyTheme(true);
                activePoints = advancedFruitPoints; activeKeys = Object.keys(activePoints);
            } else {
                applyTheme(false);
                activePoints = baseFruitPoints; activeKeys = Object.keys(activePoints);
            }

            updateUI(); createBoard();
            
            showGameModal(`Level ${lvlData.level}`, 
                `Target for ★: <b>${lvlData.targets[0]}</b><br>Moves: <b>${movesLeft}</b>${index >= 10 ? '<br><br><i>Watch for rare 🍉 and 🌟!</i>' : ''}`, 
                "Play", () => { gameState = 'PLAYING'; resetHintTimer(); }, true);
        }

        function updateUI() {
            let lvlData = levels[currentLevelIndex];
            levelDisplay.innerText = lvlData.level; scoreDisplay.innerText = score; movesDisplay.innerText = movesLeft;
            let maxTarget = lvlData.targets[2];
            let progress = Math.min((score / maxTarget) * 100, 100); 
            progressBar.style.width = `${progress}%`;

            starMarkers.forEach((marker, i) => {
                marker.style.left = `${(lvlData.targets[i] / maxTarget) * 100}%`;
                if (score >= lvlData.targets[i]) {
                    marker.classList.add('reached');
                    if (currentStarsEarned < i + 1) currentStarsEarned = i + 1;
                } else { marker.classList.remove('reached'); }
            });

            if (movesLeft <= 5 && movesLeft > 0) movesDisplay.classList.add('low'); else movesDisplay.classList.remove('low');
        }

        // --- ENGINE & MECHANICS ---
        function resetHintTimer() {
            clearTimeout(hintTimer); squares.forEach(sq => sq.classList.remove('hint-pulse'));
            if (gameState === 'PLAYING') {
                hintTimer = setTimeout(() => {
                    let move = findAvailableMove();
                    if (move) { squares[move[0]].classList.add('hint-pulse'); squares[move[1]].classList.add('hint-pulse'); }
                }, 5000);
            }
        }

        function findAvailableMove() {
            for(let i=0; i < width * width; i++) {
                if (i % width < width - 1) {
                    let t = squares[i].innerHTML; squares[i].innerHTML = squares[i+1].innerHTML; squares[i+1].innerHTML = t;
                    let match = markMatches().matched; squares[i+1].innerHTML = squares[i].innerHTML; squares[i].innerHTML = t; 
                    if (match) return [i, i+1];
                }
                if (i < width * (width - 1)) {
                    let t = squares[i].innerHTML; squares[i].innerHTML = squares[i+width].innerHTML; squares[i+width].innerHTML = t;
                    let match = markMatches().matched; squares[i+width].innerHTML = squares[i].innerHTML; squares[i].innerHTML = t;
                    if (match) return [i, i+width];
                }
            }
            return null;
        }

        function shuffleBoard(silent = false) {
            gameState = 'ANIMATING'; let currentFruits = squares.map(sq => sq.innerHTML);
            let validBoard = false;
            while(!validBoard) {
                currentFruits.sort(() => Math.random() - 0.5);
                for(let i=0; i<64; i++) squares[i].innerHTML = currentFruits[i];
                if (!markMatches().matched && findAvailableMove()) validBoard = true;
            }
            if (!silent) { squares.forEach(sq => { sq.classList.add('pop'); setTimeout(() => sq.classList.remove('pop'), 300); }); }
            setTimeout(() => { gameState = 'PLAYING'; resetHintTimer(); }, silent ? 0 : 350);
        }

        function spawnParticles(element, emoji) {
            const rect = element.getBoundingClientRect();
            const containerRect = grid.getBoundingClientRect();
            const centerX = rect.left - containerRect.left + (rect.width/2);
            const centerY = rect.top - containerRect.top + (rect.height/2);

            for (let i = 0; i < 6; i++) {
                let p = document.createElement('div');
                p.innerHTML = ['✨', '🌟', emoji][Math.floor(Math.random() * 3)];
                p.className = 'particle';
                p.style.left = `${centerX - 10}px`; p.style.top = `${centerY - 10}px`;
                p.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`); p.style.setProperty('--ty', `${(Math.random() - 0.5) * 100}px`);
                grid.appendChild(p); setTimeout(() => p.remove(), 600);
            }
        }

        let startX, startY, selectedIndex = null;
        grid.addEventListener('pointerdown', (e) => {
            if (gameState !== 'PLAYING') return;
            const target = e.target.closest('.fruit');
            if (!target || target.innerHTML === '') return;
            startX = e.clientX; startY = e.clientY; selectedIndex = parseInt(target.id);
            target.classList.add('selected'); resetHintTimer();
        });

        const clearSelection = () => { if (selectedIndex !== null) { squares[selectedIndex].classList.remove('selected'); selectedIndex = null; } };
        grid.addEventListener('pointercancel', clearSelection);
        
        grid.addEventListener('pointerup', (e) => {
            if (gameState !== 'PLAYING' || selectedIndex === null) { clearSelection(); return; }
            let endX = e.clientX, endY = e.clientY, diffX = endX - startX, diffY = endY - startY, targetIndex = null, swipeThreshold = 20;

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
            gameState = 'ANIMATING'; clearSelection(); clearTimeout(hintTimer);
            let temp = squares[id1].innerHTML; squares[id1].innerHTML = squares[id2].innerHTML; squares[id2].innerHTML = temp;
            const { matched, toRemove } = markMatches();
            
            if (!matched) {
                squares[id1].parentElement.classList.add('shake-anim'); squares[id2].parentElement.classList.add('shake-anim');
                setTimeout(() => { 
                    squares[id1].parentElement.classList.remove('shake-anim'); squares[id2].parentElement.classList.remove('shake-anim');
                    squares[id2].innerHTML = squares[id1].innerHTML; squares[id1].innerHTML = temp; 
                    gameState = 'PLAYING'; resetHintTimer();
                }, 300);
            } else { movesLeft--; updateUI(); comboMultiplier = 1; processMatches(toRemove); }
        }

        function markMatches() {
            let toRemove = new Set(); let matched = false;
            for (let r = 0; r < width; r++) {
                for (let c = 0; c < width - 2; c++) {
                    let i = r * width + c; let type = squares[i].innerHTML;
                    if (type !== '') {
                        let matchLen = 1; while (c + matchLen < width && squares[i + matchLen].innerHTML === type) matchLen++;
                        if (matchLen >= 3) { matched = true; for (let m = 0; m < matchLen; m++) toRemove.add(i + m); }
                    }
                }
            }
            for (let c = 0; c < width; c++) {
                for (let r = 0; r < width - 2; r++) {
                    let i = r * width + c; let type = squares[i].innerHTML;
                    if (type !== '') {
                        let matchLen = 1; while (r + matchLen < width && squares[i + (matchLen * width)].innerHTML === type) matchLen++;
                        if (matchLen >= 3) { matched = true; for (let m = 0; m < matchLen; m++) toRemove.add(i + (m * width)); }
                    }
                }
            }
            return { matched, toRemove };
        }

        function showComboText(text) {
            comboAnnouncer.innerText = text; comboAnnouncer.classList.remove('combo-anim');
            void comboAnnouncer.offsetWidth; comboAnnouncer.classList.add('combo-anim');
        }

        function processMatches(toRemove) {
            gameState = 'ANIMATING'; let pointsEarned = 0;
            toRemove.forEach(index => {
                let fruitType = squares[index].innerHTML;
                if (activePoints[fruitType]) {
                    let specificPoints = activePoints[fruitType] * comboMultiplier; pointsEarned += activePoints[fruitType];
                    const floatText = document.createElement('div'); floatText.className = 'floating-text'; floatText.innerText = `+${specificPoints}`;
                    squares[index].parentElement.appendChild(floatText); setTimeout(() => floatText.remove(), 1000);
                    spawnParticles(squares[index].parentElement, fruitType);
                }
                squares[index].classList.add('pop');
            });

            score += (pointsEarned * comboMultiplier); updateUI();

            setTimeout(() => {
                toRemove.forEach(index => { squares[index].innerHTML = ''; squares[index].classList.remove('pop'); });
                applyGravity();
                setTimeout(() => {
                    const { matched, toRemove: newToRemove } = markMatches();
                    if (matched) { 
                        comboMultiplier++; 
                        if (comboMultiplier === 3) showComboText("Sweet! x2"); 
                        else if (comboMultiplier === 4) showComboText("Magnificent! x3"); 
                        else if (comboMultiplier >= 5) showComboText("ROYAL! x" + (comboMultiplier-1));
                        processMatches(newToRemove); 
                    } else checkWinLoss();
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
                            if (squares[aboveIndex].innerHTML !== '') { squares[i].innerHTML = squares[aboveIndex].innerHTML; squares[aboveIndex].innerHTML = ''; break; }
                        }
                    }
                }
            }
            for (let i = 0; i < width * width; i++) { if (squares[i].innerHTML === '') squares[i].innerHTML = activeKeys[Math.floor(Math.random() * activeKeys.length)]; }
        }

        function checkWinLoss() {
            let baseTarget = levels[currentLevelIndex].targets[0];
            
            if (score >= baseTarget && movesLeft <= 0) { handleWin(); } 
            else if (movesLeft <= 0) {
                showGameModal("Out of Moves!", `You needed ${baseTarget - score} more points for 1 star.`, "Try Again", () => loadLevel(currentLevelIndex), true, 0);
            } else if (score >= levels[currentLevelIndex].targets[2]) { handleWin(); } 
            else {
                gameState = 'PLAYING';
                if (!findAvailableMove()) { showComboText("Shuffling..."); setTimeout(() => shuffleBoard(), 1000); } 
                else { resetHintTimer(); }
            }
        }

        function handleWin() {
            unlockNextLevel(currentLevelIndex, currentStarsEarned);
            
            // Reached the end of World 1
            if (currentLevelIndex === 9 && getSavedStars()[10] === 0) {
                showGameModal("World 2 Unlocked!", "You have discovered the Starlight Realm! New magical fruits and immense challenges await you.", "Enter World 2", () => { exitToMap(); }, true, currentStarsEarned);
                return;
            }
            
            // Reached the end of World 2
            if (currentLevelIndex === levels.length - 1) { triggerVictory(); return; }
            
            showGameModal("Level Cleared!", `Amazing! You earned ${currentStarsEarned} star(s).`, "Next Level", () => loadLevel(currentLevelIndex + 1), true, currentStarsEarned);
        }

        function triggerVictory() {
            gameState = 'MODAL'; clearTimeout(hintTimer); victoryModal.classList.add('active');
            const closedGift = document.getElementById('gift-closed'), openGift = document.getElementById('gift-open'), hint = document.getElementById('gift-hint');
            closedGift.onclick = () => { closedGift.style.display = 'none'; hint.style.display = 'none'; openGift.classList.remove('hidden'); openGift.classList.add('flex'); };
        }
