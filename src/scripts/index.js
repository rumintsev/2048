const gridEl = document.querySelector('.grid');
const scoreEl = document.querySelector('.score');
const restartBtn = document.querySelector('.restartBtn');
const leaderBtn = document.querySelector('.leaderBtn');
const backBtn = document.querySelector('.backBtn');
const forwardBtn = document.querySelector('.forwardBtn');
const controls = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

const modal = document.querySelector('.gameOverModal');
const nickInput = document.querySelector('.nickInput');
const saveBtn = document.querySelector('.saveBtn');
const newGameBtn = document.querySelector('.newGameBtn');
const leadersBlock = document.querySelector('.leadersBlock');
const gameOverMsg = document.querySelector('.gameOverMsg');

let grid = [];
let score = 0;
let history = null;
let redoState = null;

const colors = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e'
};

function saveState() {
  localStorage.setItem('grid2048', JSON.stringify(grid));
  localStorage.setItem('score2048', score);
  localStorage.setItem('history2048', JSON.stringify(history));
}

function loadState() {
  const savedGrid = JSON.parse(localStorage.getItem('grid2048'));
  if (savedGrid) grid = savedGrid;
  const savedScore = localStorage.getItem('score2048');
  if (savedScore) score = +savedScore;
  const savedHistory = JSON.parse(localStorage.getItem('history2048'));
  if (savedHistory) history = savedHistory;
}

function addRandomTile() {
  const emptyCells = [];
  grid.forEach((row, rowIndex) => row.forEach((value, colIndex) => { if (!value) emptyCells.push([rowIndex, colIndex]); }));
  if (!emptyCells.length) return;
  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[row][col] = Math.random() < 0.9 ? 2 : 4;
}

function initGrid() {
  grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  const initialTiles = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < initialTiles; i++) addRandomTile();
  score = 0; history = []; redoStack = [];
  drawGrid();
  history = null;
  redoState = null;
  updateButtons();
  saveState();
}

function drawGrid() {
  gridEl.replaceChildren();
  grid.forEach(row => {
    row.forEach(value => {
      const tile = document.createElement('div');
      if (value) tile.style.background = colors[value];
      tile.textContent = value || '';
      gridEl.appendChild(tile);
    });
  });
  scoreEl.textContent = score;
}

function compressRowLeft(row) {
  const newRow = row.filter(v => v);
  let points = 0;
  for (let i = 0; i < newRow.length - 1; i++) {
    if (newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;
      points += newRow[i];
      newRow[i + 1] = 0;
    }
  }
  const finalRow = newRow.filter(v => v);
  while (finalRow.length < 4) finalRow.push(0);
  return [finalRow, points];
}

function rotateGrid(times) {
  for (let t = 0; t < times; t++) {
    grid = grid[0].map((_, i) => grid.map(row => row[i])).reverse();
  }
}

function move(direction) {
  const oldGrid = JSON.parse(JSON.stringify(grid));
  history = { grid: oldGrid, score };
  redoState = null;
  let movePoints = 0, moved = false;

  if (direction === 'up') rotateGrid(1);
  if (direction === 'down') rotateGrid(3);
  if (direction === 'right') grid = grid.map(row => row.reverse());

  grid = grid.map(row => {
    const [newRow, points] = compressRowLeft(row);
    movePoints += points;
    return newRow;
  });

  if (direction === 'up') rotateGrid(3);
  if (direction === 'down') rotateGrid(1);
  if (direction === 'right') grid = grid.map(row => row.reverse());

  moved = JSON.stringify(oldGrid) !== JSON.stringify(grid);
  if (!moved) return;

  if (movePoints > 0) score += movePoints;
  addRandomTile();
  drawGrid();
  updateButtons();
  saveState();
  if (isGameOver()) showGameOver();
}

function isGameOver() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return false;
      if (c < 4 - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 4 - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

function showGameOver() {
  history = null;
  redoState = null;
  updateButtons();
  modal.style.display = 'block';
  nickInput.value = '';
  saveBtn.disabled = true;
  gameOverMsg.textContent = 'Игра окончена! Введите ник:';
  nickInput.style.display = 'block';
  saveBtn.style.display = 'inline';
  newGameBtn.style.display = 'inline';
}

nickInput.oninput = () => {
  saveBtn.disabled = nickInput.value.trim() === '';
};

saveBtn.onclick = () => {
  const name = nickInput.value.trim();
  if (!name) return;

  const record = {
    name,
    score,
    date: new Date().toLocaleString()
  };

  let records = JSON.parse(localStorage.getItem('leaders2048') || '[]');

  if (records.length < 10) {
    records.push(record);
  } else {
    const minScore = Math.min(...records.map(r => r.score));
    if (score > minScore) {
      const minIndex = records.findIndex(r => r.score === minScore);
      records[minIndex] = record;
    } else {
      gameOverMsg.textContent = 'Ваш рекорд не вошёл в топ-10';
      nickInput.style.display = 'none';
      saveBtn.style.display = 'none';
      newGameBtn.style.display = 'none';
      setTimeout(() => {
        modal.style.display = 'none';
        initGrid();
      }, 1500);
      return;
    }
  }

  records.sort((a, b) => b.score - a.score);
  localStorage.setItem('leaders2048', JSON.stringify(records.slice(0, 10)));

  gameOverMsg.textContent = 'Ваш рекорд сохранён!';
  nickInput.style.display = 'none';
  saveBtn.style.display = 'none';
  newGameBtn.style.display = 'none';

  setTimeout(() => {
    modal.style.display = 'none';
    initGrid();
  }, 1500);
};

newGameBtn.onclick = () => {
  modal.style.display = 'none';
  initGrid();
};

function renderLeaders() {
  while (leadersBlock.firstChild) {
    leadersBlock.removeChild(leadersBlock.firstChild);
  }

  leadersBlock.style.display = 'block';
  const records = JSON.parse(localStorage.getItem('leaders2048') || '[]');

  const title = document.createElement('h3');
  title.textContent = 'Рекорды:';
  leadersBlock.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Закрыть';
  closeBtn.addEventListener('click', () => {
    leadersBlock.style.display = 'none';
  });

  if (!records.length) {
    const p = document.createElement('p');
    p.textContent = 'Рекордов пока нет';
    leadersBlock.appendChild(p);
    leadersBlock.appendChild(closeBtn);
    return;
  }

  records.forEach(r => {
    const line = document.createElement('div');
    line.textContent = `${r.score} | ${r.name} | ${r.date}`;
    leadersBlock.appendChild(line);
  });

  leadersBlock.appendChild(closeBtn);
}

function updateButtons() {
  backBtn.disabled = !history;
  forwardBtn.disabled = !redoState;
}

function undo() {
  if (!history) return;
  redoState = { grid: JSON.parse(JSON.stringify(grid)), score };
  grid = history.grid;
  score = history.score;
  history = null;
  drawGrid();
  saveState();
  updateButtons();
}

function redo() {
  if (!redoState) return;
  history = { grid: JSON.parse(JSON.stringify(grid)), score };
  grid = redoState.grid;
  score = redoState.score;
  redoState = null;
  drawGrid();
  saveState();
  updateButtons();
}


document.addEventListener('keydown', e => { if (controls[e.key]) move(controls[e.key]) });
document.querySelectorAll('.up,.down,.left,.right').forEach(b => b.onclick = e => move(e.target.className));
restartBtn.onclick = initGrid;
leaderBtn.onclick = renderLeaders;
backBtn.onclick = undo;
forwardBtn.onclick = redo;

loadState();

if (grid.length && !isGameOver()) {
  drawGrid();
  updateButtons();
} else {
  initGrid();
}