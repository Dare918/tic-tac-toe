document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const statusElement = document.getElementById('status');
    const restartBtn = document.getElementById('restart-btn');
    const cells = document.querySelectorAll('.cell');
    const overlay = document.getElementById('overlay');
    const resultPanel = document.getElementById('result-panel');
    const resultMessage = document.getElementById('result-message');
    const playAgainBtn = document.getElementById('play-again-btn');
    const themeToggle = document.getElementById('theme-toggle'); // Theme toggle button
    
    // Mode selection elements
    const modeSelectionOverlay = document.getElementById('mode-selection-overlay');
    const humanModeBtn = document.getElementById('human-mode-btn');
    const computerModeBtn = document.getElementById('computer-mode-btn');
    
    // Statistics elements
    const winsValue = document.getElementById('wins-value');
    const lossesValue = document.getElementById('losses-value');
    const drawsValue = document.getElementById('draws-value');
    const winRateValue = document.getElementById('win-rate-value');
    
    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let gameMode = 'human'; // 'human' or 'computer'
    let firstPlayer = 'X'; // Track who goes first ('X' for human, 'O' for computer)
    let gameCount = 0; // Track number of games played (0 = first game)
    
    // Theme state
    let isDarkMode = false;
    
    // Computer difficulty - 70% win rate means 70% optimal moves, 30% random moves
    const COMPUTER_WIN_RATE = 0.7; // 70% win rate
    
    // Statistics
    let stats = {
        wins: 0,
        losses: 0,
        draws: 0
    };
    
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-theme', isDarkMode);
        themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    });
    
    // Handle mode selection
    humanModeBtn.addEventListener('click', () => {
        gameMode = 'human';
        modeSelectionOverlay.style.display = 'none';
        initializeGame();
    });
    
    computerModeBtn.addEventListener('click', () => {
        gameMode = 'computer';
        modeSelectionOverlay.style.display = 'none';
        initializeGame();
        // Ensure status message is updated immediately
        updateStatusMessage();
    });
    
    // Initialize game based on selected mode
    const initializeGame = () => {
        // Set first player based on game count
        // Even game numbers (0, 2, 4...) = human plays first as X
        // Odd game numbers (1, 3, 5...) = computer plays first as X
        firstPlayer = gameCount % 2 === 0 ? 'X' : 'O';
        currentPlayer = firstPlayer;
        
        // Increment game count for next game
        gameCount++;
        
        // Hide mode selection radio buttons during gameplay
        document.querySelector('.mode-selection').style.display = 'none';
        
        // Update status message
        updateStatusMessage();
            
        // If computer goes first as X, trigger its move
        if (firstPlayer === 'O' && gameMode === 'computer' && gameActive && currentPlayer === 'X') {
            setTimeout(() => {
                if (gameActive && currentPlayer === 'X') {
                    makeComputerMove();
                }
            }, 300); // 300ms delay
        }
    };
    
    // Update status message based on game state
    const updateStatusMessage = () => {
        if (gameMode === 'computer') {
            if (currentPlayer === 'X') {
                // When it's X's turn
                if (firstPlayer === 'X') {
                    // Human starts as X
                    statusElement.textContent = "Your turn (X)";
                } else {
                    // Computer starts as X
                    statusElement.textContent = "Computer's turn (X)";
                }
            } else {
                // When it's O's turn
                if (firstPlayer === 'X') {
                    // Human started as X, so computer is O
                    statusElement.textContent = "Computer's turn (O)";
                } else {
                    // Computer started as X, so human is O
                    statusElement.textContent = "Your turn (O)";
                }
            }
        } else {
            // Human vs Human mode
            statusElement.textContent = `Player ${currentPlayer}'s turn`;
        }
    };
    
    // Handle mode selection change during gameplay (restart button)
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            gameMode = radio.value;
            restartGame();
        });
    });
    
    // Handle cell click
    const handleCellClick = (e) => {
        const cell = e.target;
        const index = parseInt(cell.getAttribute('data-index'));
        
        // Check if cell is already filled or game is inactive
        if (gameBoard[index] !== '' || !gameActive) return;
        
        // For computer mode, only allow appropriate player to make moves
        if (gameMode === 'computer') {
            // If computer starts as X (firstPlayer === 'O'), human can only play when currentPlayer is O
            if (firstPlayer === 'O' && currentPlayer !== 'O') return;
            // If human starts as X (firstPlayer === 'X'), human can only play when currentPlayer is X
            if (firstPlayer === 'X' && currentPlayer !== 'X') return;
        }
        
        // Update cell and game board
        makeMove(index);
    };
    
    // Make a move on the board
    const makeMove = (index) => {
        gameBoard[index] = currentPlayer;
        cells[index].textContent = currentPlayer;
        cells[index].classList.add(currentPlayer.toLowerCase());
        
        // Check for win or draw
        if (checkWin()) {
            gameActive = false;
            highlightWinningCells();
            
            // Update statistics and show result panel
            if (gameMode === 'computer') {
                // Human wins if they made the last move
                if ((firstPlayer === 'X' && currentPlayer === 'X') || (firstPlayer === 'O' && currentPlayer === 'O')) {
                    stats.wins++;
                    showResultPanel('win');
                } else {
                    stats.losses++;
                    showResultPanel('lose');
                }
            } else {
                stats.wins++; // In human vs human, we count X as winner
                showResultPanel('win');
            }
            
            updateStatsDisplay();
            return;
        }
        
        if (checkDraw()) {
            gameActive = false;
            stats.draws++;
            updateStatsDisplay();
            showResultPanel('draw');
            return;
        }
        
        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateStatusMessage();
            
        // If in computer mode and it's now computer's turn, let computer make a move
        if (gameMode === 'computer' && gameActive) {
            // Computer plays as O when human starts as X
            if (firstPlayer === 'X' && currentPlayer === 'O') {
                setTimeout(() => {
                    if (gameActive && currentPlayer === 'O') {
                        makeComputerMove();
                    }
                }, 300); // 300ms delay
            }
            // Computer plays as X when computer starts as X
            else if (firstPlayer === 'O' && currentPlayer === 'X') {
                setTimeout(() => {
                    if (gameActive && currentPlayer === 'X') {
                        makeComputerMove();
                    }
                }, 300); // 300ms delay
            }
        }
    };
    
    // Show result panel
    const showResultPanel = (result) => {
        if (result === 'win') {
            resultMessage.textContent = 'Congratulations! You Win!';
            resultMessage.className = 'win-message';
        } else if (result === 'lose') {
            resultMessage.textContent = 'Sorry! You Lost!';
            resultMessage.className = 'lose-message';
        } else {
            resultMessage.textContent = "It's a Draw!";
            resultMessage.className = 'draw-message';
        }
        
        overlay.classList.add('show');
    };
    
    // Computer makes a move with 70% win rate
    const makeComputerMove = () => {
        // Double-check that it's the computer's turn and game is active
        if (!gameActive) return;
        
        // Check if it's actually the computer's turn based on first player
        let isComputerTurn = false;
        // Computer plays as O when human starts as X
        if (firstPlayer === 'X' && currentPlayer === 'O') isComputerTurn = true;
        // Computer plays as X when computer starts as X
        if (firstPlayer === 'O' && currentPlayer === 'X') isComputerTurn = true;
        
        if (!isComputerTurn || gameMode !== 'computer') return;
        
        let moveIndex;
        
        // 70% chance to make an optimal move, 30% chance to make a random move
        // This gives the computer a 70% win rate overall
        if (Math.random() < COMPUTER_WIN_RATE) {
            // Optimal move (minimax algorithm)
            moveIndex = getBestMove();
        } else {
            // Random move
            moveIndex = getRandomMove();
        }
        
        // Ensure we have a valid move
        if (moveIndex !== undefined && moveIndex >= 0) {
            makeMove(moveIndex);
        } else {
            // Fallback to random move if there's an issue
            moveIndex = getRandomMove();
            if (moveIndex !== undefined && moveIndex >= 0) {
                makeMove(moveIndex);
            }
        }
    };
    
    // Get a random valid move
    const getRandomMove = () => {
        const emptyCells = [];
        gameBoard.forEach((cell, index) => {
            if (cell === '') {
                emptyCells.push(index);
            }
        });
        
        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            return emptyCells[randomIndex];
        }
        
        return -1; // No move available
    };
    
    // Get optimal move using minimax algorithm
    const getBestMove = () => {
        // First, try to win
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameBoard[a] === 'O' && gameBoard[b] === 'O' && gameBoard[c] === '') return c;
            if (gameBoard[a] === 'O' && gameBoard[c] === 'O' && gameBoard[b] === '') return b;
            if (gameBoard[b] === 'O' && gameBoard[c] === 'O' && gameBoard[a] === '') return a;
        }
        
        // Then, try to block player from winning
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameBoard[a] === 'X' && gameBoard[b] === 'X' && gameBoard[c] === '') return c;
            if (gameBoard[a] === 'X' && gameBoard[c] === 'X' && gameBoard[b] === '') return b;
            if (gameBoard[b] === 'X' && gameBoard[c] === 'X' && gameBoard[a] === '') return a;
        }
        
        // If no immediate win or block, use minimax
        let bestScore = -Infinity;
        let bestMove = 0;
        
        for (let i = 0; i < 9; i++) {
            if (gameBoard[i] === '') {
                gameBoard[i] = 'O';
                let score = minimax(gameBoard, 0, false);
                gameBoard[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    };
    
    // Minimax algorithm implementation
    const minimax = (board, depth, isMaximizing) => {
        // Check for terminal states
        if (checkWinForPlayer('O')) {
            return 10 - depth;
        } else if (checkWinForPlayer('X')) {
            return depth - 10;
        } else if (checkDrawForBoard(board)) {
            return 0;
        }
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    };
    
    // Check for win for a specific player
    const checkWinForPlayer = (player) => {
        return winningConditions.some(condition => {
            const [a, b, c] = condition;
            return (
                gameBoard[a] === player && 
                gameBoard[b] === player && 
                gameBoard[c] === player
            );
        });
    };
    
    // Check for win (current implementation)
    const checkWin = () => {
        return winningConditions.some(condition => {
            const [a, b, c] = condition;
            return (
                gameBoard[a] !== '' && 
                gameBoard[a] === gameBoard[b] && 
                gameBoard[a] === gameBoard[c]
            );
        });
    };
    
    // Highlight winning cells
    const highlightWinningCells = () => {
        winningConditions.forEach(condition => {
            const [a, b, c] = condition;
            if (
                gameBoard[a] !== '' && 
                gameBoard[a] === gameBoard[b] && 
                gameBoard[a] === gameBoard[c]
            ) {
                cells[a].classList.add('winning-cell');
                cells[b].classList.add('winning-cell');
                cells[c].classList.add('winning-cell');
            }
        });
    };
    
    // Check for draw
    const checkDraw = () => {
        return gameBoard.every(cell => cell !== '');
    };
    
    // Check for draw for a specific board
    const checkDrawForBoard = (board) => {
        return board.every(cell => cell !== '');
    };
    
    // Update statistics display
    const updateStatsDisplay = () => {
        winsValue.textContent = stats.wins;
        lossesValue.textContent = stats.losses;
        drawsValue.textContent = stats.draws;
        
        const totalGames = stats.wins + stats.losses + stats.draws;
        const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;
        winRateValue.textContent = `${winRate}%`;
    };
    
    // Restart game
    const restartGame = () => {
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        // Set first player based on game count
        // Even game numbers (0, 2, 4...) = human plays first as X
        // Odd game numbers (1, 3, 5...) = computer plays first as X
        firstPlayer = gameCount % 2 === 0 ? 'X' : 'O';
        currentPlayer = firstPlayer;
        gameCount++;
        
        updateStatusMessage();
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning-cell');
        });
        
        // Hide result panel
        overlay.classList.remove('show');
        
        // If computer goes first as X, trigger its move
        if (firstPlayer === 'O' && gameMode === 'computer' && gameActive && currentPlayer === 'X') {
            setTimeout(() => {
                if (gameActive && currentPlayer === 'X') {
                    makeComputerMove();
                }
            }, 300); // 300ms delay
        }
    };
    
    // Reset statistics
    const resetStats = () => {
        stats = {
            wins: 0,
            losses: 0,
            draws: 0
        };
        gameCount = 0; // Reset game count
        updateStatsDisplay();
    };
    
    // Play again button event listener
    playAgainBtn.addEventListener('click', restartGame);
    
    // Event listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartBtn.addEventListener('click', () => {
        restartGame();
        // Reset stats when explicitly restarting
        resetStats();
    });
    
    // Initialize stats display
    updateStatsDisplay();
});
