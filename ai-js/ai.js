// Number of moves the ai will look ahead
var lookAhead = 2;

function doMoves() {
	if(manager.over || manager.won) {
		return;
	} 
	determineNextMove(function(move) {
		if (move == -1) {
			return;
		}
		window.manager.inputManager.emit('move', move);
		setTimeout(doMoves,250);
	});
				
}

function determineNextMove(cb) {
	var grid = window.manager.grid;
	// Calculate maximum expected number of spaces
	var best = bestMove(grid);
	if(best == -1){
		console.error('no best space found');
	}
	cb(best);
	
}

function bestMoveValue(grid, num) {
	var max = -1;
	var max_val = -1;
	for(var i = 0; i < 4; i++){
		var open = expectedOpenSpace(grid, i, num-1);	
		if (open > max) { 
			max = open;
			max_val = i;
		}
	}
	return max;
}

function bestMove(grid) {
	var max = -1;
	var max_val = -1;
	for(var i = 0; i < 4; i++){
		var open = expectedOpenSpace(grid, i, lookAhead);
		if (open > max) { 
			max = open;
			max_val = i;
		}
	}
	return max_val;
}


function expectedOpenSpace(grid, move, num) {
	var new_grid = getNewGrid(grid, move);
	if(new_grid == null){
		return -1;
	}
	if(num == 0){
		var value = 0;
		value += new_grid.cellsAvailable();
		// values = [];
		// for (var x = 0; x < 4; x++) {
		// 	for (var y = 0; y < 4; y++) {
		// 		if(new_grid.cells[x][y]) {
		// 			values.push(new_grid.cells[x][y].value);
		// 		}
		// 	}
		// }
		// var sorted = values.sort(function(a, b) {
		// 	return a - b; 
		// });
		// var nums = 0;
		// for(var i = 0; i < 4; i++){
		// 	value += Math.log(sorted[i]) / Math.log(2) / ((i+1)*4);
		// }
		return value;
	}
	var openCells = new_grid.availableCells();
	var n = openCells.length;
	var exp = 0;
	for (var i = 0; i < n; i++) {
		var cell = openCells[i];

		// 90% chance of a 2 tile
		new_grid.insertTile(new Tile(cell, 2));
		exp += bestMoveValue(new_grid, num) * 0.9;
		new_grid.removeTile(cell);

		// 10% chance of a 4 tile
		new_grid.insertTile(new Tile(cell, 4));
		exp += bestMoveValue(new_grid, num) * 0.1;
		new_grid.removeTile(cell);
	}
	return exp / n;
}


function getNewGrid(grid, direction) {
  // 0: up, 1: right, 2:down, 3: left
  var newGrid = new Grid(4, grid);

  var cell, tile;
  var vector = getVector(direction)
  var traversals = buildTraversals(vector);
  var moved      = false;
  newGrid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
    	cell = { x : x, y : y};
      tile = newGrid.cellContent(cell);
      if (tile) {
        var positions = findFarthestPosition(cell, vector, newGrid);
        var next      = newGrid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          newGrid.insertTile(merged);
          newGrid.removeTile(tile);

          // Converge the two tiles' positions
          
          tile.updatePosition(positions.next);

        } else {
          newGrid.cells[tile.x][tile.y] = null;
          newGrid.cells[positions.farthest.x][positions.farthest.y] = tile;
          tile.updatePosition(positions.farthest)
        }

        if (tile.x != cell.x || tile.y != cell.y) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });
	if(moved) {
		return newGrid;
	} else {
		return null;
	}
	
}

function findFarthestPosition(cell, vector, grid) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (grid.withinBounds(cell) &&
           grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

function getVector(direction){
	var map = {
    0: { x: 0,  y: -1 }, // up
    1: { x: 1,  y: 0 },  // right
    2: { x: 0,  y: 1 },  // down
    3: { x: -1, y: 0 }   // left
  };
  return map[direction];
}
// Build a list of positions to traverse in the right order
function buildTraversals(vector) {
	

  var traversals = { x: [], y: [] };
  for (var pos = 0; pos < 4; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();
  return traversals;
};