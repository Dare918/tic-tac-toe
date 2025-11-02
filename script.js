document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const statusElement = document.getElementById('status');
    const restartBtn = document.getElementById('restart-btn');
    const cells = document.querySelectorAll('.cell');
    const overlay = document.getElementById('overlay');
    const resultPanel = document.getElementById('result-panel');
    const resultMessage = document.getElementById('result-message');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    // Statistics elements
    const winsValue = document.getElementById('wins-value');
    const lossesValue = document.getElementById('losses-value');
    const drawsValue = document.getElementById('draws-value');
    const winRateValue = document.getElementById('win-rate-value');
    
    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let gameMode = 'human'; // 'human' or 'computer'
    
    // Computer difficulty - 50% win rate means 50% optimal moves, 50% random moves
    const COMPUTER_WIN_RATE = 0.5; // 50% win rate
    
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
    
    // Handle mode selection
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
        
        // For computer mode, only allow human player to make moves
        if (gameMode === 'computer' && currentPlayer === 'O') return;
        
        // Update cell and game board
        makeMove(index);
        
        // If in computer mode and game is still active, let computer make a move
        if (gameMode === 'computer' && gameActive && currentPlayer === 'O') {
            setTimeout(makeComputerMove, 500); // Small delay for better UX
        }
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
                if (currentPlayer === 'X') {
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
        statusElement.textContent = gameMode === 'computer' 
            ? (currentPlayer === 'X' ? "Your turn (X)" : "Computer's turn (O)")
            : `Player ${currentPlayer}'s turn`;
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
    
    // Computer makes a move with 50% win rate
    const makeComputerMove = () => {
        if (!gameActive) return;
        
        let moveIndex;
        
        // 50% chance to make an optimal move, 50% chance to make a random move
        // This gives the computer a 50% win rate overall
        if (Math.random() < COMPUTER_WIN_RATE) {
            // Optimal move (minimax algorithm)
            moveIndex = getBestMove();
        } else {
            // Random move
            moveIndex = getRandomMove();
        }
        
        makeMove(moveIndex);
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
        currentPlayer = 'X';
        statusElement.textContent = gameMode === 'computer' 
            ? "Your turn (X)" 
            : `Player ${currentPlayer}'s turn`;
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning-cell');
        });
        
        // Hide result panel
        overlay.classList.remove('show');
    };
    
    // Reset statistics
    const resetStats = () => {
        stats = {
            wins: 0,
            losses: 0,
            draws: 0
        };
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