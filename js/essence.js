window.requestAnimationFrame = function() {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		function(f) {
			window.setTimeout(f, 1000 / 60)
		}
}()

function timedChunk(items, newItems, process, context, delay, maxItems) {
	var n = items.length,
		delay = delay || 25,
		maxItems = maxItems || n,
		i = 0
	
	setTimeout(function chunkTimer(){
		var start = +new Date(),
			j = i
		
		while (i < n && (i - j) < maxItems && (new Date() - start < 50)) {
			process.call(context, items[i], newItems[i])
			i += 1
		}
		
		if (i < n) {
			setTimeout(chunkTimer, delay)
		}
	}, 25)
}

function updateVertices(vert, newVert) {
	vert.z = newVert
}

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
	directionalLight.position.y = SIZE_X / 2
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
		forest.repeat.set(32, 32)
		
		rock = loader.load('images/rock.png')
		rock.magFilter = THREE.Linear;
		rock.minFilter = THREE.Linear;
		rock.wrapS = rock.wrapT = THREE.RepeatWrapping;
		rock.repeat.set(32, 32)
		
		snow = loader.load('images/snow.png')
		snow.magFilter = THREE.Linear;
		snow.minFilter = THREE.Linear;
		snow.wrapS = snow.wrapT = THREE.RepeatWrapping;
		snow.repeat.set(32, 32)
		
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
	
	// initialize web worker
	var count = 0
	var worker = new Worker('js/worker.js')
	worker.addEventListener('message', function(e) {
		count += 1
		
		timedChunk(terrain.geometry.vertices, e.data, updateVertices)
		
		terrain.geometry.verticesNeedUpdate = true
		if (count >= SIZE_Y) {
			terrain.geometry.computeVertexNormals()
		}
		
		terrain.position.y = 0
	}, false)
	
	// render loop
	var now
	var then = Date.now()
	var interval = 1000 / 60;
	var delta
	var frame = 0
    function render() {
		requestAnimationFrame(render)
		
		// lock frame rate
		now = Date.now()
		delta = now - then 
		if (delta > interval) {
			then = now - (delta % interval)
			frame += 1
			
			for (var i = 0; i < clouds.length; i++) {
				clouds[i].position.y -= SPEED / 1.5
				
				if (clouds[i].position.y <= camera.position.y) {
					resetCloud(clouds[i])
				}
			}
			
			flare.lensFlares[0].opacity = 0.45 + 0.15 * (Math.sin(frame / (4 * 60)) + 1)

			terrain.position.y -= SPEED
			
			water.material.uniforms.time.value += (1 / 600) * (SPEED / 0.1)
			waterNormals.offset.y -= SPEED
			water.render()

			if (frame % Math.floor(((1 / SPEED) * (SIZE_Y))) == 0) {
				analyser.getByteFrequencyData(dataArray)

				worker.postMessage(dataArray)
			}
			
			renderer.render(scene, camera)
		}
    }
	
	render()
})