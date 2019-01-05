// constants
var SIZE_X = 64
var SIZE_Y = 4
var QUALITY = 2
var TILE_SIZE = 1 / QUALITY
var SECTION_COUNT = (SIZE_X * QUALITY + 1) * (SIZE_Y * QUALITY + 1)
var TOTAL_COUNT = (SIZE_X * QUALITY + 1) * (SIZE_X * QUALITY + 1)
var CLOUD_NUM = 16
var OCEAN_SIZE = SIZE_X * 4
var VARIANCE = 4
var CAM_HEIGHT = 16
var SPEED = 0.2

// helper functions
function genNoise(type, nx, ny) {
	return (type.noise(nx, ny) / 2) + 0.5
}

function easeInQuad(t) {
	return t ** t
}

function easeOutQuad(t) {
	return t * (2 - t)
}

function easeInOutQuad(t) {
	return t < 0.5 ? 2 * t ** 2:-1 + (4 - 2 * t) * t
}
