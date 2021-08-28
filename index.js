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
