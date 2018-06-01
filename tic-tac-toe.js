//--------------------------------------------------------------------
const grid = [
    '', '', '', // 0 1 2
    '', '', '', // 3 4 5
    '', '', ''  // 6 7 8
];

// Find and return the index of any open square in the grid
// where we can make a move. -1 indidates the grid is full!
const findOpenSquare = () => {
    return grid.findIndex(e => e === '');
}

// Indexes of winning moves/positions in the grid
const winningMoves = [
    [ 0, 1, 2 ],
    [ 0, 3, 6 ],
    [ 0, 4, 8 ],
    [ 1, 4, 7 ],
    [ 2, 4, 6 ],    
    [ 2, 5, 8 ],
    [ 3, 4, 5 ],
    [ 6, 7, 8 ]
];

const getWinningMoveStrings = (i) => {
    return winningMoves[i].map(
        squareNum => grid[squareNum]
    ).join('');
};

let highlightWinningMove = (winningMove) => {
    winningMoves[winningMove].forEach((i) => {
        let elem = document.querySelector(`.square${i}`);
        elem.style.background = 'orange';
    });
};

//--------------------------------------------------------------------
const UI = {
    player1Name: document.querySelector('.player1 .name'),
    player2Name: document.querySelector('.player2 .name'),
    
    player1Score: document.querySelector('.player1 .score'),
    player2Score: document.querySelector('.player2 .score'),

    reset: document.querySelector('.reset'),    
    status: document.querySelector('.prompt .status'),

    chooseNumPlayers: document.getElementById('choose-num-players'),
    chooseSym: document.getElementById('choose-sym'),
    gameBoard: document.getElementById('gameboard'),
    grid: document.getElementById('grid'),    

    highlightSquare: function(squareNum) {
        let elem = document.querySelector(`.square${squareNum}`);
        elem.style.background = 'orange';
    },
    
    fillSquare: function(squareNum, sym) {
        let elem = document.querySelector(`.square${squareNum}`);
        elem.classList.add(sym);
    },
    
    clearSquare: function(squareNum) {
        let elem = document.querySelector(`.square${squareNum}`);

        elem.classList.remove('x');
        elem.classList.remove('o');
        elem.style.background = 'none';
    },
};

//--------------------------------------------------------------------
class ComputerPlayer {
    constructor(sym) {
        this.sym = sym;
    }

    // Examine the board and see if we can get one move closer to winning
    // TODO: https://www.neverstopbuilding.com/blog/2013/12/13/tic-tac-toe-understanding-the-minimax-algorithm13/    
    getBestMove(sym) {
        let length = 0;
        let regexp = new RegExp(sym, 'g');
        let bestMove = {
            squareNum: -1,
            movesLeft: 2 // moves left after this to win
        };

        // ''    empty and all three available
        // 'x'   two available
        // 'x o' one empty but o blocks winning string for x
        // 'xx ' most preferable since one more move for 'x' and we win
        for (let i = 0; i < winningMoves.length; i++) {
            let s = getWinningMoveStrings(i);
        
            if (s.length === (s.match(regexp) || []).length) {
                if (s.length > length) {
                    length = s.length;

                    bestMove.movesLeft = 2 - s.length;                
                    bestMove.squareNum = winningMoves[i][
                        winningMoves[i].findIndex(j => grid[j] === '')
                    ];
                }
            }
        }

        if (bestMove.squareNum === -1) {
            bestMove.squareNum = findOpenSquare();
            bestMove.movesLeft = 2;
        }

        return bestMove;
    }

    // Computer chooses its next move    
    takeTurn() {
        let myBestMove = this.getBestMove(this.sym);
        let theirSym = this.sym === 'x' ? 'o' : 'x';
        let theirBestMove = this.getBestMove(theirSym);
        let squareNum;
        
        if (theirBestMove.movesLeft === 0 && myBestMove.movesLeft > 0) {
            squareNum = theirBestMove.squareNum;
        } else {
            squareNum = myBestMove.squareNum;
        }

        UI.fillSquare(squareNum, this.sym);
        grid[squareNum] = this.sym;
    }
}

//--------------------------------------------------------------------
class Game {
    constructor() {
        this.players = [
            {
                name: 'Player 1',
                score: 0, 
                sym: null
            },
            {
                name: 'Player 2',
                sym: null,
                score: 0
            }
        ];

        this.gameOn = false;
    }

    chooseNumPlayers() {
        UI.chooseNumPlayers.onclick = (event) => {
            if (event.target.dataset.choice === '1' ||
                event.target.dataset.choice === '2') {
        
                this.numPlayers = parseInt(event.target.dataset.choice);

                if (this.numPlayers === 1) {
                    UI.player2Name.innerText = this.players[1].name = 'Computer';
                } else {
                    UI.player2Name.innerText = this.players[1].name = 'Player 2';
                }
        
                UI.chooseNumPlayers.style.display = 'none';
                UI.chooseSym.style.display = 'block';
                UI.gameBoard.style.display = 'none';
            }
        }
    }

    chooseSymbol() {
        UI.chooseSym.onclick = (event) => {
            if (event.target.innerText === 'X' ||
                event.target.innerText === 'O') {

                this.players[0].sym = event.target.innerText.toLowerCase();
                this.players[1].sym = this.players[0].sym === 'x' ? 'o': 'x';

                if (this.numPlayers === 1) {
                    this.computerPlayer = new ComputerPlayer(this.players[1].sym);
                    this.computersTurnTimer = null;            
                }
                
                UI.chooseNumPlayers.style.display = 'none';
                UI.chooseSym.style.display = 'none';
                UI.gameBoard.style.display = 'block';

                this.resetScore();        
                this.startRound();
            }
        };
    }

    startNewGame() {
        UI.chooseNumPlayers.style.display = 'block';
        UI.chooseSym.style.display = 'none';
        UI.gameBoard.style.display = 'none';
    }

    registerResetHandler() {
        UI.reset.onclick = (event) => {
            this.startNewGame();
        };
    }

    startRound() {
        this.currentPlayer = this.players[0];
        this.computersTurnTimer = null; // clear any old timers?

        for (let i = 0; i < grid.length; i++) {
            UI.clearSquare(i);
            grid[i] = '';
        }

        this.gameOn = true;
        this.displayStatus(this.currentPlayer.name + '\'s Turn');
    }

    registerPlayersMoveHandler() {
        UI.grid.onclick = (event) => {
            let elem = event.target;
            let squareNum = parseInt(
                    /\bsquare(\d+)\b/.exec( elem.getAttribute('class') )[1]
            );

            if (this.gameOn && !this.isComputersTurn() && grid[squareNum] === '') {
                let sym = this.currentPlayer.sym;

                UI.fillSquare(squareNum, sym);
                grid[squareNum] = sym;

                if (!this.gameIsOver()) {
                    this.nextPlayer();
                }
            }
        }
    }
    
    isComputersTurn() {
        return this.numPlayers === 1 &&
            this.currentPlayer === this.players[1]; // Computer is always Player 2
    }

    computersTurn() {
        this.computerPlayer.takeTurn(); 
        if (this.gameIsOver() === false) {
            this.nextPlayer();
        }        
    }

    nextPlayer() {
        this.currentPlayer = this.currentPlayer === this.players[0]
            ? this.players[1]
            : this.players[0];
    
        if (this.numPlayers === 1) {
            this.computersTurnTimer = this.isComputersTurn() ? setTimeout(() => {
                this.computersTurn(); // XXX this bound to Game!
            }, 1500) : null;
        }

        this.displayStatus(this.currentPlayer.name + '\'s Turn');
    }

    // Return true if current player just won the game
    currentPlayerWon() {
        let winStr = this.currentPlayer.sym.repeat(3);
        let winMove = winningMoves.findIndex((_,j) => getWinningMoveStrings(j) === winStr);

        if (winMove !== -1) {
            highlightWinningMove(winMove);
            return true;
        } else {
            return false;            
        }
    }
    
    isStalemate() {
        return findOpenSquare() === -1;
    }

    gameIsOver() {
        if (this.currentPlayerWon()) {
            this.displayStatus(this.currentPlayer.name + ' wins');
            this.currentPlayer.score++;
            this.displayScore();
            this.gameOn = false;
            
            setTimeout(() => {
                this.startRound(); // XXX this bound to Game
            }, 3000);
        } else if (this.isStalemate()) {            
            this.displayStatus('Stalemate');
            this.gameOn = false;
            
            setTimeout(() => {
                this.startRound(); // XXX this bound to Game
            }, 3000);
        }

        return !this.gameOn;
    }

    displayStatus(status) {
        UI.status.innerText = status;
    }

    displayScore() {
        UI.player1Score.innerText = this.players[0].score;
        UI.player2Score.innerText = this.players[1].score;
    }

    resetScore() {
        this.players[0].score = 0;
        this.players[1].score = 0;

        this.displayScore();
    }
}

const game = new Game();

document.body.onload = () => {
    game.startNewGame();
    game.chooseNumPlayers();
    game.chooseSymbol();
    game.registerPlayersMoveHandler();
    game.registerResetHandler();
};
