// seed noise
var date = new Date()
var elevation = new SimplexNoise('rnd' + date.getTime())
var moisture = new SimplexNoise('rnd' + date.getTime() + 1)

// audio
var audioCtx = new (window.AudioContext || window.webKitAudioContext)()
var analyser = audioCtx.createAnalyser()
var source

analyser.fftSize = 256
analyser.minDecibels = -90
analyser.maxDecibels = -20

var bufferLength = analyser.frequencyBinCount
var dataArray = new Uint8Array(bufferLength)

function playMP3(file, callback) {
	var reader = new FileReader()
	reader.onload = function(event) {
		var data = reader.result
		decodeBuffer(data)
	}

	reader.readAsArrayBuffer(file)
}

function decodeBuffer(data, callback) {
	if (source) {
		source.stop(0)
	}
	
	audioCtx.decodeAudioData(data, function(buffer) {
		source = audioCtx.createBufferSource()
		source.buffer = buffer
		source.connect(analyser)
		
		analyser.connect(audioCtx.destination)
		
		source.start(0)
	})
}

// constants
var SIZE_X = 64
var SIZE_Y = 4
var QUALITY = 1
var TILE_SIZE = 1 / QUALITY
var SECTION_COUNT = (SIZE_X * QUALITY + 1) * (SIZE_Y * QUALITY + 1)
var TOTAL_COUNT = (SIZE_X * QUALITY + 1) * (SIZE_X * QUALITY + 1)
var CLOUD_NUM = 32
var OCEAN_SIZE = SIZE_X * 4
var VARIANCE = 4
var CAM_HEIGHT = 16
var SPEED = 0.05

$(document).ready(function() {
	// setup scene
    var scene = new THREE.Scene()
    scene.background = new THREE.Color(0x81dfff)
	
    var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000)
	camera.position.y = -32
	camera.position.z = CAM_HEIGHT
	camera.rotation.x = Math.PI / 2.5

    var renderer = new THREE.WebGLRenderer({canvas: document.getElementById("essence")})
    renderer.setSize(window.innerWidth, window.innerHeight)
	
	$(window).on('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()

		renderer.setSize(window.innerWidth, window.innerHeight)
	})

	var loader = new THREE.TextureLoader()
	loader.crossOrigin = ''
	
	THREE.DefaultLoadingManager.onProgress = function (item, loaded, total) {
		if (loaded == total) {
			$(".blank").fadeOut(800, 'linear', function() {
				$(".bar").fadeIn(800)
			})
		}
	};

	var ambientLight = new THREE.AmbientLight(0x404040, 2)
	var hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5)
	var directionalLight = new THREE.DirectionalLight(0xffff55, 0.5)
	directionalLight.position.x = camera.position.x
	directionalLight.position.y = SIZE_X * QUALITY / 2
	directionalLight.position.z = VARIANCE / 3
	
	scene.add(ambientLight)
	scene.add(hemisphereLight)
    scene.add(directionalLight)
	
	scene.fog = new THREE.Fog(0x81dfff, -camera.position.y * 1.75 - SIZE_Y, -camera.position.y * 2 - SIZE_Y)
	
	var flareColor = new THREE.Color(0xffffbb)
	var flare = new THREE.LensFlare(loader.load("images/flare.png"), 384, -1 - VARIANCE / 3, THREE.AdditiveBlending, flareColor)
	flare.lensFlares[0].opacity = 0.5
	flare.position.copy(directionalLight.position)

	scene.add(flare)
	
	var cloudTexture = []
	cloudTexture.push(loader.load('images/cloud1.png'))
	cloudTexture.push(loader.load('images/cloud2.png'))
	cloudTexture.push(loader.load('images/cloud3.png'))
	cloudTexture.push(loader.load('images/cloud4.png'))

	function buildCloud() {
		var material = new THREE.MeshBasicMaterial({map: cloudTexture[Math.round(Math.random() * (cloudTexture.length - 1))], depthWrite: false, depthTest: false})
		material.side = THREE.DoubleSide
		material.transparent = true
		material.opacity = 0.75
		
		var cloud = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), material)
		
		resetCloud(cloud)
		scene.add(cloud)
		
		return cloud
	}
	
	function resetCloud(cloud) {
		cloud.rotation.x = Math.PI / 2
		cloud.scale.x = cloud.scale.y = 0.25 + Math.random() * 0.25
		cloud.position.x = camera.position.x + (Math.random() * 2 - 1) * 128

		cloud.position.y = -camera.position.y * 1.75 - SIZE_Y + Math.random() * (-camera.position.y * (1.75 * 2) - SIZE_Y)
		
		cloud.position.z = CAM_HEIGHT + Math.random() * 16 + 64 * cloud.scale.x / 3
	}
	
    function buildTerrain(geometry) {
		sand = loader.load('images/sand.png')
		sand.magFilter = THREE.Linear;
		sand.minFilter = THREE.Linear;
		sand.wrapS = sand.wrapT = THREE.RepeatWrapping;
		sand.repeat.set(16, 16)
		
		outline = loader.load('images/outline.png')
		outline.magFilter = THREE.Linear;
		outline.minFilter = THREE.Linear;
		outline.wrapS = outline.wrapT = THREE.RepeatWrapping;
		outline.repeat.set(16, 16)
		
		grass = loader.load('images/grass.png')
		grass.magFilter = THREE.Linear;
		grass.minFilter = THREE.Linear;
		grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
		grass.repeat.set(16, 16)
		
		forest = loader.load('images/forest.png')
		forest.magFilter = THREE.Linear;
		forest.minFilter = THREE.Linear;
		forest.wrapS = forest.wrapT = THREE.RepeatWrapping;
		forest.repeat.set(16, 16)
		
		rock = loader.load('images/rock.png')
		rock.magFilter = THREE.Linear;
		rock.minFilter = THREE.Linear;
		rock.wrapS = rock.wrapT = THREE.RepeatWrapping;
		rock.repeat.set(16, 16)
		
		snow = loader.load('images/snow.png')
		snow.magFilter = THREE.Linear;
		snow.minFilter = THREE.Linear;
		snow.wrapS = snow.wrapT = THREE.RepeatWrapping;
		snow.repeat.set(16, 16)
		
		var material = generateBlendedMaterial([
			{texture: sand},
			{texture: outline, levels: [0, 0, 0, 0.5]},
			{texture: grass, levels: [1, 3, 3, 4]},
			{texture: forest, levels: [2, 4, 6, 8]},
			{texture: rock, levels: [6, 8, 10, 12]},
			{texture: snow, levels: [8, 10, 19, 20]},
		]);

        var terrain = new THREE.Mesh(geometry, material)

        scene.add(terrain)

        return terrain
    };

	function buildOcean() {
		waterNormals = new loader.load('images/water.png')
		waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping
		waterNormals.repeat.set(64, 64)
		
		water = new THREE.Water(renderer, camera, scene, {
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: waterNormals,
			time: 1,
			alpha: 0.85,
			sunDirection: directionalLight.position.clone().normalize(),
			sunColor: 0xffffff,
			waterColor: 0x001e0f,
			noiseScale: 0.5,
			distortionScale: 4,
			fog: true
		})

		var geometry = new THREE.PlaneGeometry(OCEAN_SIZE, SIZE_X, OCEAN_SIZE, SIZE_X)
		
		// give curve
		for(var i = 0; i < geometry.vertices.length; i++) {
			var column = i % (OCEAN_SIZE * 1 + 1) + 1
			var offset = ((1 - easeInQuad(column / (OCEAN_SIZE + 1)))) * 16 - 3 - VARIANCE / 3
			if (column < (OCEAN_SIZE) / 2 + 1) {
				offset = ((1 - easeInQuad(((OCEAN_SIZE + 1) - column) / (OCEAN_SIZE + 1)))) * 16 - 3 - VARIANCE / 3
			}

			geometry.vertices[i].z = offset
		}
			
		var ocean = new THREE.Mesh(geometry, water.material)
		ocean.add(water)
		
		scene.add(ocean)

        return ocean
    };
	
	function buildBase() {
		var material = new THREE.MeshLambertMaterial({color: 0x000000});
		var geometry = new THREE.PlaneGeometry(OCEAN_SIZE, SIZE_X, OCEAN_SIZE, SIZE_X)
		
		// give curve
		for(var i = 0; i < geometry.vertices.length; i++) {
			var column = i % (OCEAN_SIZE * 1 + 1) + 1
			if (column > OCEAN_SIZE / 2 - SIZE_X / 2 && column < OCEAN_SIZE / 2 + SIZE_X / 2) {
				continue;
			}
			
			var offset = ((1 - easeInQuad(column / (OCEAN_SIZE + 1)))) * 16 - 3 - VARIANCE / 3
			if (column < (OCEAN_SIZE) / 2 + 1) {
				offset = ((1 - easeInQuad(((OCEAN_SIZE + 1) - column) / (OCEAN_SIZE + 1)))) * 16 - 3 - VARIANCE / 3
			}

			geometry.vertices[i].z = offset
		}
		
		var base = new THREE.Mesh(geometry, material)
		
		scene.add(base)

        return base
    };
	
	var clouds = []
	for (var i = 0; i < CLOUD_NUM; i++) {
		clouds.push(buildCloud())
	}
	
	ocean = buildOcean()
	ocean.position.z = VARIANCE / 3
	
	base = buildBase()
	
	var terrainGeometry = new THREE.PlaneGeometry(SIZE_X, SIZE_X, SIZE_X * QUALITY, SIZE_X * QUALITY)
	terrain = buildTerrain(terrainGeometry)

	// render loop
	var frame = 0
	var count = 0
	var rowPos = []
	var verts = []
    function render() {	
		frame += 1
		
		for (var i = 0; i < clouds.length; i++) {
			clouds[i].position.y -= SPEED
			
			if (clouds[i].position.y <= camera.position.y) {
				resetCloud(clouds[i])
			}
		}
		
		flare.lensFlares[0].opacity = 0.45 + 0.15 * (Math.sin(frame / (4 * 60)) + 1)

		terrain.position.y -= SPEED
		
		water.material.uniforms.time.value += 1 / 600
		waterNormals.offset.y -= SPEED
		water.render()

		// get instantaneous audio volume
		analyser.getByteFrequencyData(dataArray)
      
		var energySum = 0
		for(var i = 0; i < dataArray.length; i++) {
			energySum += dataArray[i]
		}
		
		var avgEnergy = energySum / dataArray.length

		// generate terrain
		var mesh
		var nextRowPos = []
		var curOffset = []
		if (frame % Math.floor(((1 / SPEED) * (SIZE_Y))) == 0) {
			count += 1
			
			var curVerts = []
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
				
				// give curve
				var offsetColumn = i % (SIZE_X * 1 + 1) + 1
				var offset = ((1 - easeInQuad(offsetColumn / (SIZE_X + 1)))) * 16
				if (offsetColumn < (SIZE_X) / 2 + 1) {
					offset = ((1 - easeInQuad(((SIZE_X + 1) - offsetColumn) / (SIZE_X + 1)))) * 16
				}
				offset /= ((OCEAN_SIZE / SIZE_X) ** 2)
				
				value += offset
				
				terrain.geometry.vertices[i].z = value

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
					terrain.geometry.dynamic = true
					terrain.geometry.vertices[i].z += lerp - increment
					terrain.geometry.verticesNeedUpdate = true
				}
				
				curVerts.push(terrain.geometry.vertices[i].z)
			}
			
			// scroll terrain
			if (verts.length > 0) {
				for (var i = 0; i < verts.length; i++) {
					for (var j = 0; j < SECTION_COUNT; j++) {
						var idx = SECTION_COUNT * (i + 1) + j - (SIZE_X * QUALITY + 1) * (i + 1)

						terrain.geometry.dynamic = true
						terrain.geometry.vertices[idx].z = verts[i][j]
						terrain.geometry.verticesNeedUpdate = true
					}
				}
			}
			
			terrain.geometry.computeVertexNormals()
			terrain.geometry.computeFaceNormals()
			
			verts.unshift(curVerts)
			
			if (verts.length >= (SIZE_X / SIZE_Y)) {
				verts.pop()
			}
			
			terrain.position.y = 0
			
			rowPos = nextRowPos
		}
		
        renderer.render(scene, camera)
    }

    render()
	setInterval(function() {
        render()
    }, 1000 / 144);
})

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
