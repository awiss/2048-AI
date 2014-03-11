function startAI(){
	var move = determineNextMove();
	window.manager.inputManager.emit('move', move);
}

function determineNextMove(){
	var grid = window.manager.grid;
	// Calculate maximum number of  spaces
	max = 0;
	max_val = -1;
	for(var i = 0; i < 4; i++){
		open = expectedOpenSpace(grid, i);
		if(expectedOpenSpace(grid,i) > max)
			max = open;
			max_val = i;
	}
	return i;
}

function expectedOpenSpace(grid, move){
	// Stub
	return -1;
}