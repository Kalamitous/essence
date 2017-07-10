importScripts('globals.js')
importScripts('libs/perlin.js')

// seed noise
var date = new Date()
var elevation = new SimplexNoise('rnd' + date.getTime())
var moisture = new SimplexNoise('rnd' + date.getTime() + 1)

var count = 0
var rowPos = []
var verts = []
self.addEventListener('message', function(e) {
	count += 1

	var vertices = []
	var nextRowPos = []
	var curOffset = []
	var curVerts = []
	
	// get instantaneous audio volume
	var dataArray = e.data
	var energySum = 0
	for(var i = 0; i < dataArray.length; i++) {
		energySum += dataArray[i]
	}

	var avgEnergy = energySum / dataArray.length
			
	var newHeight = avgEnergy / 20
	if (newHeight > 8 - VARIANCE / 3) {
		newHeight = 8 - VARIANCE / 3
	}
	
	for (var i = 0; i < SECTION_COUNT; i++) {
		var row = Math.floor(i / (SIZE_X * QUALITY + 1)) + 1
		var column = i % (SIZE_X * QUALITY + 1) + 1
		
		// generate elevation & moisture noise from audio volume
		var x = TILE_SIZE * (column - 1) - SIZE_X / 2
		var y = SIZE_Y * 2 - TILE_SIZE * ((SIZE_Y * QUALITY) * count) + TILE_SIZE * (row - 1)

		var nx = x / SIZE_X
		var ny = y / SIZE_X
		
		var e = (1 * genNoise(elevation, 1 * nx,  1 * ny)
			   + (1 / 2) * genNoise(elevation, 2 * nx,  2 * ny)
			   + (1 / 4) * genNoise(elevation, 4 * nx,  2 * ny)
			   + (1 / 8) * genNoise(elevation, 8 * nx,  8 * ny)
			   + (1 / 16) * genNoise(elevation, 16 * nx, 16 * ny)
			   + (1 / 32) * genNoise(elevation, 32 * nx, 32 * ny))
		e /= (1 + 1 / 2 + 1 / 4 + 1 / 8 + 1 / 16 + 1 / 32)
		e = e ** 4
		var m = (1 * genNoise(moisture, 1 * nx,  1 * ny)
			   + (1 / 2) * genNoise(moisture, 2 * nx,  2 * ny)
			   + (1 / 4) * genNoise(moisture, 4 * nx,  2 * ny)
			   + (1 / 8) * genNoise(moisture, 8 * nx,  8 * ny)
			   + (1 / 16) * genNoise(moisture, 16 * nx, 16 * ny)
			   + (1 / 32) * genNoise(moisture, 32 * nx, 32 * ny))
		m /= (1 + 1 / 2 + 1 / 4 + 1 / 8 + 1 / 16 + 1 / 32)
		var value = e * ((newHeight + m) * VARIANCE) + (newHeight / 16 - (VARIANCE / 3 - 1))
		
		// edge falloffs
		if (column <= 16 * QUALITY) {
			value *= (column - 1) / (16 * QUALITY - 1)
		} else if (column >= SIZE_X * QUALITY - 16 * QUALITY) {
			value *= (Math.abs(column - SIZE_X * QUALITY) - 1) / (16 * QUALITY - 1)
		}
		if (count == 1) {
			value *= (Math.floor(SECTION_COUNT / (SIZE_X * QUALITY + 1)) - row) / (Math.floor(SECTION_COUNT / (SIZE_X * QUALITY + 1)) - 1)
		}
		
		vertices.push(value)

		if (row == 1) {
			nextRowPos.push(value)
		} else if (row == (SIZE_Y * QUALITY) + 1) {
			if (rowPos.length > 0) {
				curOffset.push(value - rowPos[column])
			} else {
				curOffset.push(0)
			}
		}
	}
	
	// interpolate terrain altitudes to avoid distinct bumps
	for (var i = 0; i < SECTION_COUNT; i++) {
		var row = Math.floor(i / (SIZE_X * QUALITY + 1)) + 1
		var column = i % (SIZE_X * QUALITY + 1) + 1
		
		var increment = curOffset[column]
		var step = ((SIZE_Y * QUALITY) - (row - 1)) / (SIZE_Y * QUALITY)
		var lerp = (increment * easeInOutQuad(step))

		if (increment && lerp) {
			vertices[i] += lerp - increment
		}
		
		curVerts.push(vertices[i])
	}
	
	// scroll terrain
	if (verts.length > 0) {
		for (var i = 0; i < verts.length; i++) {
			for (var j = 0; j < SECTION_COUNT; j++) {
				var idx = SECTION_COUNT * (i + 1) + j - (SIZE_X * QUALITY + 1) * (i + 1)
				
				vertices[idx] = verts[i][j]
			}
		}
	}
	
	verts.unshift(curVerts)
	
	if (verts.length >= (SIZE_X / SIZE_Y)) {
		verts.pop()
	}
	
	rowPos = nextRowPos
			
	self.postMessage(vertices)
}, false)