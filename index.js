const pubsub = {
  events: {},
  on: function (evName, evHandler) {
    this.events[evName] = this.events[evName] || [];
    this.events[evName].push(evHandler);
  },
  off: function (evName, evHandler) {
    if (this.events[evName]) {
      this.events[evName] = this.events[evName].filter((h) => h !== evHandler);
    }
  },
  emit: function (evName, data) {
    if (this.events[evName]) {
      this.events[evName].forEach((handler) => {
        handler(data);
      });
    }
  },
};

const GameBoard = (function () {
  let state = [
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ];
  function getState() {
    return state;
  }
  function setState(newState) {
    state = newState;
    pubsub.emit('stateUpdated', state);
    let winner = checkWinner();
    let tie = checkTie();
    if (winner) {
      pubsub.emit('gameWon', winner);
      console.log('game won');
    } else if (tie) {
      pubsub.emit('gameTied', null);
      console.log('game tied');
    }
  }
  function checkWinner() {
    // check rows
    for (let row of state) {
      if (row.every(item => item === 'X')) {
        return 'X';
      }

      if (row.every(item => item === 'O')) {
        return 'O';
      }
    }

    //check cols
    for (let r = 0; r < state.length; r++) {
      let col = state.map(row => row[r]);
      if (col.every(item => item === 'X')) {
        return 'X';
      }

      if (col.every(item => item === 'O')) {
        return 'O';
      }
    }

    // check diagonals
    let diagOne = [];
    let diagTwo = [];
    for (let i = 0; i < state.length; i++) {
      diagOne.push(state[i][i]);
      diagTwo.push(state[state.length - 1 - i][i]);
    }
    if (diagOne.every(item => item === 'X')) {
      return 'X'
    }
    if (diagOne.every(item => item === 'O')) {
      return 'O'
    }
    if (diagTwo.every(item => item === 'X')) {
      return 'X';
    }
    if (diagTwo.every(item => item === 'O')) {
      return 'O';
    }
    return null;
  }
  function checkTie() {
    return state.flat().every(item => item);
  }
  return {
    getState,
    setState,
  };
})();

const Display = (function () {
  const main = document.querySelector('main');
  const template = document.getElementById('ttc-template');
  const container = template.content.cloneNode(true);
  main.appendChild(container);
  const ttcGrid = document.querySelector('.ttc-grid');
  const restartBtn = document.getElementById('restart');
  restartBtn.addEventListener('click', () => {
    window.location.reload();
  });
  ttcGrid.innerHTML = ''; // clear grid
  let state = GameBoard.getState();
  for (let r = 0; r < state.length; r++) {
    for (let c = 0; c < state[r].length; c++) {
      let val = state[r][c];
      const newVal = document.createElement('div');
      newVal.classList.add('ttc-val');
      newVal.textContent = val;
      newVal.dataset.row = r;
      newVal.dataset.col = c;
      newVal.addEventListener(
        'click',
        () => {
          Game.getNextPlayer().addMark(r, c);
        },
        { once: true }
      );
      ttcGrid.appendChild(newVal);
    }
  }

  pubsub.on('stateUpdated', render);
  function render(state) {
    for (let r = 0; r < state.length; r++) {
      for (let c = 0; c < state[r].length; c++) {
        ttcGrid.querySelector(
          `.ttc-val[data-row="${r}"][data-col="${c}"]`
        ).innerText = state[r][c];
      }
    }
  }

  function disableDisplay() {
    const vals = document.querySelectorAll('.ttc-val');
    vals.forEach(val => {
      val.classList.add('disable');
    })
  }

  pubsub.on('gameWon', showWinner);
  function showWinner(winner) {
    const heading = document.querySelector('.ttc-heading');
    heading.textContent = heading.textContent + ` (Player '${winner}' won!)`;
    disableDisplay();
  }
  pubsub.on('gameTied', showTie);
  function showTie() {
    const heading = document.querySelector('.ttc-heading');
    heading.textContent = heading.textContent + ` (Game tied!)`;
    disableDisplay();
  }

  return {
    render,
  };
})();

function createPlayer(sign) {
  let obj = Object.create(createPlayer.proto);
  obj.sign = sign;
  return obj;
}
createPlayer.proto = {
  addMark: function (row, col) {
    let state = GameBoard.getState();
    state[row][col] = this.sign;
    GameBoard.setState(state);
  },
};

const Game = (function () {
  let players = [];
  let nextPlayer;
  function addPlayers(...p) {
    players = [...p];
    nextPlayer = players[0];
  }
  function getPlayers() {
    return players;
  }
  function getNextPlayer() {
    nextPlayer = nextPlayer === players[0] ? players[1] : players[0];
    return nextPlayer;
  }
  return {
    addPlayers,
    getPlayers,
    getNextPlayer,
  };
})();

let player1 = createPlayer('O');
let player2 = createPlayer('X');
Game.addPlayers(player1, player2);
