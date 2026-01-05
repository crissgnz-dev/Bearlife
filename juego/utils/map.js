import { TILE_SIZE, MAP_COLS, MAP_ROWS, fondoX, fondoY, TERRAIN } from './constants.js';

let mapGrid = [];

export function getMapGrid() {
    return mapGrid;
}

export function generateIslandMap() {
  const newMap = [];
  const centerX = Math.floor(MAP_COLS / 2);
  const centerY = Math.floor(MAP_ROWS / 2);
  const maxRadius = Math.min(MAP_COLS, MAP_ROWS) / 2;

  // 1. Inicialización Radial
  for (let y = 0; y < MAP_ROWS; y++) {
    const row = [];
    for (let x = 0; x < MAP_COLS; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const normalizedDist = dist / maxRadius;

      if (normalizedDist < 0.25) {
        row.push(TERRAIN.LAND);
      } else if (normalizedDist < 0.75) {
        row.push(Math.random() < 0.58 ? TERRAIN.LAND : TERRAIN.WATER);
      } else {
        row.push(TERRAIN.WATER);
      }
    }
    newMap.push(row);
  }

  // 2. Cellular Automata
  const iterations = 5;
  for (let i = 0; i < iterations; i++) {
    smoothMap(newMap);
  }

  // 3. Flood Fill
  const visited = new Array(MAP_ROWS).fill(0).map(() => new Array(MAP_COLS).fill(false));
  const queue = [{ x: centerX, y: centerY }];

  if (newMap[centerY][centerX] === TERRAIN.WATER) {
    newMap[centerY][centerX] = TERRAIN.LAND;
  }
  visited[centerY][centerX] = true;

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    const dirs = [
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    ];

    for (let d of dirs) {
      const nx = x + d.dx;
      const ny = y + d.dy;

      if (nx >= 0 && nx < MAP_COLS && ny >= 0 && ny < MAP_ROWS) {
        if (!visited[ny][nx] && newMap[ny][nx] === TERRAIN.LAND) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      if (newMap[y][x] === TERRAIN.LAND && !visited[y][x]) {
        newMap[y][x] = TERRAIN.WATER;
      }
    }
  }

  // 4. Generar Playas
  const mapWithSand = JSON.parse(JSON.stringify(newMap));
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      if (newMap[y][x] === TERRAIN.LAND) {
        let isCoast = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (y + dy >= 0 && y + dy < MAP_ROWS && x + dx >= 0 && x + dx < MAP_COLS) {
              if (newMap[y + dy][x + dx] === TERRAIN.WATER) {
                isCoast = true;
              }
            }
          }
        }
        if (isCoast) {
          mapWithSand[y][x] = TERRAIN.SAND;
        }
      }
    }
  }

  mapGrid = mapWithSand;
  return mapWithSand;
}

function smoothMap(map) {
  const tempMap = JSON.parse(JSON.stringify(map));
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      if (x === 0 || x === MAP_COLS - 1 || y === 0 || y === MAP_ROWS - 1) continue;
      const neighborBoxSize = 1;
      let landNeighbors = 0;
      for (let dy = -neighborBoxSize; dy <= neighborBoxSize; dy++) {
        for (let dx = -neighborBoxSize; dx <= neighborBoxSize; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (tempMap[y + dy][x + dx] === TERRAIN.LAND) {
            landNeighbors++;
          }
        }
      }
      if (landNeighbors > 4) {
        map[y][x] = TERRAIN.LAND;
      } else if (landNeighbors < 4) {
        map[y][x] = TERRAIN.WATER;
      }
    }
  }
}

export function drawMap(scene) {
  scene.add.tileSprite(fondoX / 2, fondoY / 2, fondoX, fondoY, "water");
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      if (mapGrid[y][x] === TERRAIN.LAND) {
        scene.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, "grass")
             .setDisplaySize(TILE_SIZE, TILE_SIZE);
      } else if (mapGrid[y][x] === TERRAIN.SAND) {
        scene.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, "sand")
             .setDisplaySize(TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

export function isLand(x, y) {
  const gridX = Math.floor(x / TILE_SIZE);
  const gridY = Math.floor(y / TILE_SIZE);
  if (gridX >= 0 && gridX < MAP_COLS && gridY >= 0 && gridY < MAP_ROWS) {
    return mapGrid[gridY][gridX] === TERRAIN.LAND || mapGrid[gridY][gridX] === TERRAIN.SAND;
  }
  return false;
}

export function isFertileLand(x, y) {
  const gridX = Math.floor(x / TILE_SIZE);
  const gridY = Math.floor(y / TILE_SIZE);
  if (gridX >= 0 && gridX < MAP_COLS && gridY >= 0 && gridY < MAP_ROWS) {
    return mapGrid[gridY][gridX] === TERRAIN.LAND;
  }
  return false;
}
