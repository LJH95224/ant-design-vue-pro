/* eslint-disable */
/* create by lyf */
// 函数表达式方式创建函数1

function Windy(params) {
	if (!params) {
		return
	}
	// 各种定义和参数
	const grid = [] // 定义经纬度网格数组
	const particles = [] // 存放粒子数组
	const PARTICLE_MULTIPLIER = 0.4 / 300 // 粒子数量参数，默认1/300，可以根据实际调
	const max_age = 100 // 定义粒子的最大运动次数
	// 没有风的情况
	const NULL_WIND_VECTOR = [NaN, NaN, null]
	const min_color = 0 // 风速为0使用的颜色
	const max_color = 10 // 风速最大使用的颜色
	const linewidth = 1.5 // 定义粒子粗细
	let FRAME_RATE = 35 // 定义每秒执行的次数
	let FRAME_TIME = 1000 / FRAME_RATE // desired frames per second
	let galpha = 1 // 定义透明度，透明度越大，尾巴越长
	// 存放颜色的数组
	const colorScale = [
		'#348791',
		'#419293',
		'#499B94',
		'#59A995',
		'#6DB897',
		'#7AC197',
		'#98D397',
		'#A4D997',
		'#B7E197',
		'#CFE391',
		'#D5DE8C',
		'#DECC7D',
		'#E3B66B',
		'#E7A35C',
		'#EB8F4E'
		// 'rgb(36,104, 180)',
		// 'rgb(60,157, 194)',
		// 'rgb(128,205,193 )',
		// 'rgb(151,218,168 )',
		// 'rgb(198,231,181)',
		// 'rgb(238,247,217)',
		// 'rgb(255,238,159)',
		// 'rgb(252,217,125)',
		// 'rgb(255,182,100)',
		// 'rgb(252,150,75)',
		// 'rgb(250,112,52)',
		// 'rgb(245,64,32)',
		// 'rgb(237,45,28)',
		// 'rgb(220,24,32)',
		// 'rgb(180,0,35)'
	]

	// 新增:可能是“bearing”(气流朝向的角度)或“meteo”(气流来自的角度)和“CW”(角度值顺时针增加)或“CCW”(角度值逆时针增加)的任意组合
	const angleConvention = 'bearingCCW'
	// 风速单位
	const speedUnit = 'm/s'

	// 粒子动画的速度，为参数乘以屏幕的像素密度开三次方
	// 如果不支持像素密度，就乘以1,
	// 默认0.0005
	//	var vscale = (0.01) * (Math.pow(window.devicePixelRatio, 1 / 3) || 1); // scale for wind velocity (completely arbitrary--this value looks nice)
	const vscale = 0.01
	let animationLoop // 定义动画
	let lonMin, latMin, x_kuadu, y_kuadu, ni, nj, builder

	// 第一步生成经纬度网格
	buildGrid(params.data)

	function createWindBuilder(uComp, vComp) {
		const uData = uComp.data
		const vData = vComp.data
		return {
			header: uComp.header,
			// recipe: recipeFor("wind-" + uComp.header.surface1Value),
			data: function data(i) {
				return [uData[i], vData[i]]
			}
		}
	}

	function createBuilder(data) {
		let uComp = null
		let vComp = null
		let scalar = null
		// 从这里判断出，数据中的这两个参数，必须是固定的，否则会不执行
		data.forEach(record => {
			switch (`${record.header.parameterCategory},${record.header.parameterNumber}`) {
				case '1,2':
				case '2,2':
					uComp = record
					break
				case '1,3':
				case '2,3':
					vComp = record
					break
				default:
					scalar = record
			}
		})
		return createWindBuilder(uComp, vComp)
	}

  var buildGrid = function(data, callback) {
    var supported = true;

    if (data.length < 2 ) supported = false;
    if (!supported) console.log("Windy Error: data must have at least two components (u,v)");
    
    builder = createBuilder(data);
    var header = builder.header;

    if (header.hasOwnProperty("gridDefinitionTemplate") && header.gridDefinitionTemplate != 0 ) supported = false;
    if (!supported) {
      console.log("Windy Error: Only data with Latitude_Longitude coordinates is supported");
    }
    supported = true;  // reset for futher checks
    
    λ0 = header.lo1;
    φ0 = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)

    Δλ = header.dx;
    Δφ = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

    ni = header.nx;
    nj = header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)

    if (header.hasOwnProperty("scanMode")) {
      var scanModeMask = header.scanMode.toString(2)
      scanModeMask = ('0'+scanModeMask).slice(-8);
      var scanModeMaskArray = scanModeMask.split('').map(Number).map(Boolean);

      if (scanModeMaskArray[0]) Δλ =-Δλ;
      if (scanModeMaskArray[1]) Δφ = -Δφ;
      if (scanModeMaskArray[2]) supported = false;
      if (scanModeMaskArray[3]) supported = false;
      if (scanModeMaskArray[4]) supported = false;
      if (scanModeMaskArray[5]) supported = false;
      if (scanModeMaskArray[6]) supported = false;
      if (scanModeMaskArray[7]) supported = false;
      if (!supported) console.log("Windy Error: Data with scanMode: "+header.scanMode+ " is not supported.");
    }
    date = new Date(header.refTime);
    date.setHours(date.getHours() + header.forecastTime);

    // Scan modes 0, 64 allowed.
    // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
    grid = [];
    var p = 0;
    var isContinuous = Math.floor(ni * Δλ) >= 360;

    for (var j = 0; j < nj; j++) {
      var row = [];
      for (var i = 0; i < ni; i++, p++) {
        row[i] = builder.data(p);
      }
      if (isContinuous) {
        // For wrapped grids, duplicate first column as last column to simplify interpolation logic
        row.push(row[0]);
      }
      grid[j] = row;
    }

    callback({
      date: date,
      interpolate: interpolate
    });
  };

	function buildGrid(data, callback) {
		builder = createBuilder(data)
		const header = builder.header
		lonMin = header.lo1 // 小的经度
		latMin = header.la1 // the grid's origin (e.g., 0.0E, 90.0N)
		// latMin = header.scanMode == 0 ? header.la1 : header.la2
		// 小纬度
		x_kuadu = header.dx // x方向的跨度
		y_kuadu = header.dy // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)
		// y方向的跨度
		ni = header.nx // x方向的总数
		nj = header.ny // number of grid points W-E and N-S (e.g., 144 x 73)
		// y方向的总数
		// Scan mode 0 assumed. Longitude increases from lonMin, and latitude decreases from latMin.
		//  http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
		let p = 0
		const isContinuous = Math.floor(ni * x_kuadu) >= 360
		// x方向的跨度乘以x方向的数量是否大于360
		for (let j = 0; j < nj; j++) {
			const row = []
			for (let i = 0; i < ni; i++, p++) {
				row[i] = builder.data(p)
			}
			if (isContinuous) {
				// For wrapped grids, duplicate first column as last column to simplify interpolation logic
				row.push(row[0])
			}
			grid[j] = row
			// if (header.scanMode == 0) {
			// 	grid[j] = row;
			// } else {
			// 	grid[nj - j] = row;
			// }
		}
		// grid是一个三维数组
		// 第一纬表示行数
		// 第二纬表示列数
		// 第三纬表示每一个网格点的uv
	}

	// 第二步生成插值网格
	let columns = [] // 存放插值网格数组
	let start = Date.now()
	let bwidth = params.map.getSize().width
	let bheight = params.map.getSize().height
	let bx = 0
	let by = 0
	let projection = {}
	let mbounds = params.map.getBounds()
	let now_bounds = {
		east: deg2rad(mbounds.bounds[1].lng),
		west: deg2rad(mbounds.bounds[3].lng),
		north: deg2rad(mbounds.bounds[1].lat),
		south: deg2rad(mbounds.bounds[3].lat),
		height: bheight,
		width: bwidth
	}
	let mapArea = (now_bounds.south - now_bounds.north) * (now_bounds.west - now_bounds.east)
	let velocityScale = vscale * Math.pow(mapArea, 0.4)

	function bulid_grid(map) {
		columns = [] // 存放插值网格数组
		start = Date.now()
		;(bx = 0), (by = 0)
		projection = {}
		mbounds = map.getBounds()
		now_bounds = {
			east: deg2rad(mbounds.bounds[1].lng),
			west: deg2rad(mbounds.bounds[3].lng),
			north: deg2rad(mbounds.bounds[1].lat),
			south: deg2rad(mbounds.bounds[3].lat),
			height: bheight,
			width: bwidth
		}
		mapArea = (now_bounds.south - now_bounds.north) * (now_bounds.west - now_bounds.east)
		velocityScale = vscale * Math.pow(mapArea, 0.4)
		batchInterpolate()
	}

	function batchInterpolate() {
		while (bx < bwidth) {
			interpolateColumn(bx)
			bx += 2
			if (Date.now() - start > 1000) {
				// MAX_TASK_TIME) {
				setTimeout(batchInterpolate, 25) // 如果粒子生成时间大于1秒了，就不再生成
				return
			}
		}
	}

	function interpolateColumn(x) {
		const column = []
		// 画布上的每两个像素是一个格点
		for (let y = 0; y <= bheight; y += 2) {
			const coord = invert(x, y, now_bounds)
			// 求出每一个格点所对应的经纬度
			if (coord) {
				let λ = coord[0] // 经度
				let φ = coord[1] // 纬度
				// 监测经度是不是数字
				if (isFinite(λ)) {
					let wind = interpolate(λ, φ)
					// 每一个格点的uv和风速大小
					if (wind) {
						wind = distort(projection, λ, φ, x, y, velocityScale, wind, now_bounds)
						// wind 表示粒子x方向的像素速度，y方向上的像素速度和风速
						column[y + 1] = column[y] = wind
					}
				}
			}
		}
		// 相邻两个格点用相同的速度
		columns[x + 1] = columns[x] = column
	}

	function invert(x, y, windy) {
		const mapLonDelta = windy.east - windy.west // 经度跨度
		const worldMapRadius = ((windy.width / rad2deg(mapLonDelta)) * 360) / (2 * Math.PI)
		const mapOffsetY =
			(worldMapRadius / 2) * Math.log((1 + Math.sin(windy.south)) / (1 - Math.sin(windy.south)))
		const equatorY = windy.height + mapOffsetY
		const a = (equatorY - y) / worldMapRadius

		const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(a)) - Math.PI / 2)
		const lon = rad2deg(windy.west) + (x / windy.width) * rad2deg(mapLonDelta)
		return [lon, lat]
	}

	function deg2rad(deg) {
		return (deg / 180) * Math.PI
	}

	function rad2deg(ang) {
		return ang / (Math.PI / 180.0)
	}

	function floorMod(a, n) {
		return a - n * Math.floor(a / n)
	}
	const isValue = function isValue(x) {
		return x !== null && x !== undefined
	}
	const mercY = function mercY(lat) {
		return Math.log(Math.tan(lat / 2 + Math.PI / 4))
	}

	function interpolate(λ, φ) {
		// 如果风场网格数据不存在，就不执行
		if (!grid) return null
		// λ, φ分别是每个网格点的经度和纬度
		const i = floorMod(λ - lonMin, 360) / x_kuadu // calculate longitude index in wrapped range [0, 360)
		// latMin 应该是上面的纬度，大的一个
		const j = (latMin - φ) / y_kuadu // calculate latitude index in direction +90 to -90
		// 计算网格点在从上到下，从左到右，以最小刻度为0的第几个经纬度格点上
		let fi = Math.floor(i) // 格点的上一行
		let ci = fi + 1 // 格点的下一行
		let fj = Math.floor(j) // 格点的前一列
		let cj = fj + 1 // 格点的后一列
		let row
		if ((row = grid[fj])) {
			const g00 = row[fi]
			const g10 = row[ci]
			if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
				const g01 = row[fi]
				const g11 = row[ci]
				// 计算出格点周围4个点
				if (isValue(g01) && isValue(g11)) {
					// All four points found, so interpolate the value.
					return bilinearInterpolateVector(i - fi, j - fj, g00, g10, g01, g11)
				}
			}
		}
		return null
	}

	function bilinearInterpolateVector(x, y, g00, g10, g01, g11) {
		// y表示格点距离上一个经纬度格点的距离
		// x表示格点距离前一个经纬度给点的距离
		const rx = 1 - x
		const ry = 1 - y
		let a = rx * ry
		let b = x * ry
		let c = rx * y
		let d = x * y
		const u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d
		const v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d
		return [u, v, Math.sqrt(u * u + v * v)]
		// 返回格点插值出来u和v还有速度
	}

	function distort(projection, λ, φ, x, y, scale, wind, windy) {
		// projection是一个空的对象
		// λ, φ格点的经纬度
		// x, y格点所在的像素点
		// 格点的风向风速
		// windy
		// scale 一个参数，每次粒子运动的距离
		const u = wind[0] * scale
		const v = wind[1] * scale
		const d = distortion(projection, λ, φ, x, y, windy)

		// Scale distortion vectors by u and v, then add.
		wind[0] = d[0] * u + d[2] * v
		wind[1] = d[1] * u + d[3] * v
		return wind
	}

	function distortion(projection, λ, φ, x, y, windy) {
		const τ = 2 * Math.PI
		const H = Math.pow(10, -5.2)
		const hλ = λ < 0 ? H : -H
		const hφ = φ < 0 ? H : -H

		const pλ = project(φ, λ + hλ, windy)
		const pφ = project(φ + hφ, λ, windy)

		// Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1º λ
		// changes depending on φ. Without this, there is a pinching effect at the poles.
		const k = Math.cos((φ / 360) * τ)
		return [(pλ[0] - x) / hλ / k, (pλ[1] - y) / hλ / k, (pφ[0] - x) / hφ, (pφ[1] - y) / hφ]
	}
	let project = function project(lat, lon, windy) {
		// both in radians, use deg2rad if neccessary
		const ymin = mercY(windy.south)
		const ymax = mercY(windy.north)
		const xFactor = windy.width / (windy.east - windy.west)
		const yFactor = windy.height / (ymax - ymin)

		const _y = mercY(deg2rad(lat))
		const x = (deg2rad(lon) - windy.west) * xFactor
		const y = (ymax - _y) * yFactor // y points south
		return [x, y]
	}
	// 第三步初始化生成粒子
	function randomize(o) {
		// UNDONE: this method is terrible
		let x, y
		let safetyNet = 0
		do {
			x = Math.round(Math.floor(Math.random() * bwidth))
			y = Math.round(Math.floor(Math.random() * bheight))
		} while (field(x, y)[2] === null && safetyNet++ < 30)
		o.x = x
		o.y = y
		return o
	}

	function field(x, y) {
		const column = columns[Math.round(x)]
		return (column && column[Math.round(y)]) || NULL_WIND_VECTOR
	}

	function create_new_lizi() {
		particles.length = 0
		const particleCount = Math.round(bwidth * bheight * PARTICLE_MULTIPLIER)
		const zoom = params.map.getZoom()
		if (zoom < 8 && zoom >=5) {
			galpha = 1
		} else if (zoom >= 8 && zoom < 10){
			galpha = 0.9
		} else if (zoom >= 10 && zoom < 12) {
			galpha = 0.8
		} else if (zoom >= 12 && zoom < 14) {
			galpha = 0.7
		} else if (zoom >= 14 && zoom < 16) {
			galpha = 0.6
		} else {
			galpha = 0.5
		}
		// 计算粒子的数量
		for (let i = 0; i < particleCount; i++) {
			particles.push(
				randomize({
					age: Math.floor(Math.random() * max_age)
				})
			)
		}
	}

	// 第四步,定义每次粒子的变化
	const colorStyles = windIntensityColorScale(min_color, max_color)
	const buckets = colorStyles.map(() => [])

	function windIntensityColorScale(min, max) {
		colorScale.indexFor = function(m) {
			// map velocity speed to a style
			return Math.max(
				0,
				Math.min(colorScale.length - 1, Math.round(((m - min) / (max - min)) * (colorScale.length - 1)))
			)
		}

		return colorScale
	}

	function evolve() {
		// 清除风点数组
		buckets.forEach(bucket => {
			bucket.length = 0
		})
		// particles是存放所有点的数组
		particles.forEach(particle => {
			// 如果粒子运行的次数大于设定的最大次数
			// 重新随机粒子的位置，并把次数定义成0
			if (particle.age > max_age) {
				randomize(particle).age = 0
			}
			const x = particle.x
			const y = particle.y
			const v = field(x, y) // vector at current position
			const m = v[2]
			if (m === null) {
				// 如果没有速度,就让age是最大值，重新随机点
				particle.age = max_age // particle has escaped the grid, never to return...
			} else {
				const xt = x + v[0]
				const yt = y + v[1]
				if (field(xt, yt)[2] !== null) {
					// Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
					particle.xt = xt
					particle.yt = yt
					buckets[colorStyles.indexFor(m)].push(particle)
				} else {
					// Particle isn't visible, but it still moves through the field.
					particle.x = xt
					particle.y = yt
				}
			}
			particle.age += 1
		})
	}
	function draw(g) {
		// Fade existing particle trails.
		const prev = 'lighter'
		g.globalCompositeOperation = 'destination-in'
		g.fillRect(0, 0, bwidth, bheight)
		g.globalCompositeOperation = prev
		g.globalAlpha = galpha

		// Draw new particle trails.
		// buckets是把风点按照不同颜色分级，分成的数组
		// 数组的每一项是一个对象，
		buckets.forEach((bucket, i) => {
			if (bucket.length > 0) {
				g.beginPath()
				g.strokeStyle = colorStyles[i]
				// g.strokeStyle = 'rgb(255,255,255)';
				bucket.forEach(particle => {
					g.moveTo(particle.x, particle.y)
					g.lineTo(particle.xt, particle.yt)
					particle.x = particle.xt
					particle.y = particle.yt
				})
				g.stroke()
			}
		})
	}
	function stopWindy() {
		// params.map.off('mousemove', mousemoveEvent)
		const g = params.canvas.getContext('2d')
		const x = params.map.getSize().width
		const y = params.map.getSize().height
		g.clearRect(0, 0, x, y)
		particles.length = 0
		if (windy.timer) clearTimeout(windy.timer)
		window.cancelAnimationFrame(animationLoop)
	}
	function startWindy() {
		stopWindy()
		window.cancelAnimationFrame(animationLoop)
		const fadeFillStyle = 'rgba(0, 0, 0, 0.97)'
		const g = params.canvas.getContext('2d')
		g.lineWidth = linewidth
		g.fillStyle = fadeFillStyle
		g.globalAlpha = 0.6

		bulid_grid(params.map)
		create_new_lizi()
		windy.timer = setTimeout(() => {
			let then = Date.now()
			;(function frame() {
				animationLoop = requestAnimationFrame(frame)
				const now = Date.now()
				const delta = now - then
				if (delta > FRAME_TIME) {
					then = now - (delta % FRAME_TIME)
					evolve()
					draw(g)
				}
			})()
		}, 200)
		// params.map.on('mousemove', mousemoveEvent)
	}
	// function mousemoveEvent(e) {
	// 	let gridValue = interpolate(e.lnglat.getLng(), e.lnglat.getLat())
	// 	let angleOld = vectorToDegrees(gridValue[0], gridValue[1], angleConvention)
	// 	let angle = fixedNum(angleOld)
	// 	let speedOld = vectorToSpeed(gridValue[0], gridValue[1], speedUnit)
	// 	let speed = fixedNum(speedOld)
	// 	console.log('您活动了鼠标当前经纬度坐标为：', e.lnglat.getLng(), e.lnglat.getLat(), '风向：', angle, '风速：', speed)
	// }

	// 根据网格数据，计算风向
	function vectorToDegrees (uMs, vMs, angleConvention) {
    // Default angle convention is CW
    if (angleConvention.endsWith('CCW')) {
      // vMs comes out upside-down..
      vMs = vMs > 0 ? vMs = -vMs : Math.abs(vMs)
    }

    const velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2))
    const velocityDir = Math.atan2(uMs / velocityAbs, vMs / velocityAbs)
    let velocityDirToDegrees = velocityDir * 180 / Math.PI + 180

    if (angleConvention === 'bearingCW' || angleConvention === 'meteoCCW') {
      velocityDirToDegrees += 180
      if (velocityDirToDegrees >= 360) velocityDirToDegrees -= 360
    }

    return velocityDirToDegrees
  }

	// 根据网格计算风速
	function vectorToSpeed (uMs, vMs, unit) {
    const velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2)) // Default is m/s

    if (unit === 'k/h') {
      return meterSec2kilometerHour(velocityAbs)
    } else if (unit === 'kt') {
      return meterSec2Knots(velocityAbs)
    } else {
      return velocityAbs
    }
  }

	// 风速 m/s 转换成 km/h
	function meterSec2kilometerHour (meters) {
    return meters * 3.6
  }

	// 风速 m/s 转换成 节（海里/小时）
	function meterSec2Knots (meters) {
    return meters / 0.514
  }

	/**
	 * @desc 保留n位小数 fixedNum(1.234,2)
	 * @param {Number} num 浮点数
	 * @param {Number} n 保留位数
	 * @param {Boolean} isStr 是否输出字符串
	 * @returns {string|number} 保留n位小数的浮点数
	 */
	function fixedNum (num, n = 2, isStr) {
		n = parseInt(n)
		if (isNaN(n)) {
			n = 2
		}
		num = parseFloat(num) || 0
		num = num.toFixed(n) // old
		if (isStr) {
			return num
		}
		num = parseFloat(num) || 0
		return num
	}

	const windy = {
		params,
		startWindy,
		stopWindy
	}

	return windy
}

// shim layer with setTimeout fallback(使用setTimeout这种回退到过去的方法作为一个“垫片层”)
// 所谓shim，是指 楔（某物）或用垫片填满（一个空间），使之更合适，更完备
// 这是一种标准的写法：
// 代码作用有二，一是把各浏览器前缀进行统一，二是在浏览器没有requestAnimationFrame方法时将其指向setTimeout方法。
window.requestAnimationFrame = (function() {
	return (
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 20)
		}
	)
})()

export default Windy
