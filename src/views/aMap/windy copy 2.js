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
  var builder;
  var gridData = params.data;
  var date;
  var λ0, φ0, Δλ, Δφ, ni, nj;

  // interpolation for vectors like wind (u,v,m)
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

	function createWindBuilder(uComp, vComp) {
		const uData = uComp.data
		const vData = vComp.data
		return {
			header: uComp.header,
			// recipe: recipeFor("wind-" + uComp.header.surface1Value),
			data: function data(i) {
				return [uData[i], vData[i]]
			},
      interpolate: bilinearInterpolateVector
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

  var interpolate = function(λ, φ) {
    if (!grid) return null;

    var i = floorMod(λ - λ0, 360) / Δλ; // calculate longitude index in wrapped range [0, 360)
    var j = (φ0 - φ) / Δφ; // calculate latitude index in direction +90 to -90

    var fi = Math.floor(i),
      ci = fi + 1;
    var fj = Math.floor(j),
      cj = fj + 1;

    var row;
    if ((row = grid[fj])) {
      var g00 = row[fi];
      var g10 = row[ci];
      if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
        var g01 = row[fi];
        var g11 = row[ci];
        if (isValue(g01) && isValue(g11)) {
          // All four points found, so interpolate the value.
          return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
        }
      }
    }
    return null;
  };

  const isValue = function isValue(x) {
		return x !== null && x !== undefined
	}

  function floorMod(a, n) {
		return a - n * Math.floor(a / n)
	}

  /**
   * Calculate distortion of the wind vector caused by the shape of the projection at point (x, y). The wind
   * vector is modified in place and returned by this function.
   */
   var distort = function(projection, λ, φ, x, y, scale, wind) {
    var u = wind[0] * scale;
    var v = wind[1] * scale;
    var d = distortion(projection, λ, φ, x, y);

    // Scale distortion vectors by u and v, then add.
    wind[0] = d[0] * u + d[2] * v;
    wind[1] = d[1] * u + d[3] * v;
    return wind;
  };

  var distortion = function(projection, λ, φ, x, y) {
    var τ = 2 * Math.PI;
    //    var H = Math.pow(10, -5.2); // 0.00000630957344480193
    //    var H = 0.0000360;          // 0.0000360°φ ~= 4m  (from https://github.com/cambecc/earth/blob/master/public/libs/earth/1.0.0/micro.js#L13)
    var H = 5; // ToDo:   Why does this work?
    var hλ = λ < 0 ? H : -H;
    var hφ = φ < 0 ? H : -H;

    var pλ = project(φ, λ + hλ);
    var pφ = project(φ + hφ, λ);

    // Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1º λ
    // changes depending on φ. Without this, there is a pinching effect at the poles.
    var k = Math.cos((φ / 360) * τ);
    return [
      (pλ[0] - x) / hλ / k,
      (pλ[1] - y) / hλ / k,
      (pφ[0] - x) / hφ,
      (pφ[1] - y) / hφ
    ];
  };

  var createField = function(columns, bounds, callback) {
    /**
     * @returns {Array} wind vector [u, v, magnitude] at the point (x, y), or [NaN, NaN, null] if wind
     *          is undefined at that point.
     */
    function field(x, y) {
      var column = columns[Math.round(x)];
      return (column && column[Math.round(y)]) || NULL_WIND_VECTOR;
    }

    // Frees the massive "columns" array for GC. Without this, the array is leaked (in Chrome) each time a new
    // field is interpolated because the field closure's context is leaked, for reasons that defy explanation.
    field.release = function() {
      columns = [];
    };

    field.randomize = function(o) {
      // UNDONE: this method is terrible
      var x, y;
      var safetyNet = 0;
      do {
        x = Math.round(Math.floor(Math.random() * bounds.width) + bounds.x);
        y = Math.round(Math.floor(Math.random() * bounds.height) + bounds.y);
      } while (field(x, y)[2] === null && safetyNet++ < 30);
      o.x = x;
      o.y = y;
      return o;
    };

    callback(bounds, field);
  };

  var buildBounds = function(bounds, width, height) {
    var upperLeft = bounds[0];
    var lowerRight = bounds[1];
    var x = Math.round(upperLeft[0]); //Math.max(Math.floor(upperLeft[0], 0), 0);
    var y = Math.max(Math.floor(upperLeft[1], 0), 0);
    var xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
    var yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
    return {
      x: x,
      y: y,
      xMax: width,
      yMax: yMax,
      width: width,
      height: height
    };
  };

  function deg2rad(deg) {
		return (deg / 180) * Math.PI
	}

  var invert = function(x, y, windy) {
    var latlon = params.map.containerPointToLatLng(L.point(x, y));
    return [latlon.lng, latlon.lat];
  };

  var project = function(lat, lon, windy) {
    var xy = params.map.latLngToContainerPoint(L.latLng(lat, lon));
    return [xy.x, xy.y];
  };

  var interpolateField = function(grid, bounds, extent, callback) {
    var projection = {}; // map.crs used instead
    var mapArea = (extent.south - extent.north) * (extent.west - extent.east);
    var velocityScale = VELOCITY_SCALE * Math.pow(mapArea, 0.4);

    var columns = [];
    var x = bounds.x;

    function interpolateColumn(x) {
      var column = [];
      for (var y = bounds.y; y <= bounds.yMax; y += 2) {
        var coord = invert(x, y);
        if (coord) {
          var λ = coord[0],
            φ = coord[1];
          if (isFinite(λ)) {
            var wind = grid.interpolate(λ, φ);
            if (wind) {
              wind = distort(projection, λ, φ, x, y, velocityScale, wind);
              column[y + 1] = column[y] = wind;
            }
          }
        }
      }
      columns[x + 1] = columns[x] = column;
    }

    (function batchInterpolate() {
      var start = Date.now();
      while (x < bounds.width) {
        interpolateColumn(x);
        x += 2;
        if (Date.now() - start > 1000) {
          //MAX_TASK_TIME) {
          setTimeout(batchInterpolate, 25);
          return;
        }
      }
      createField(columns, bounds, callback);
    })();
  };

  var animationLoop;
  var animate = function(bounds, field) {
    function windIntensityColorScale(min, max) {
      colorScale.indexFor = function(m) {
        // map velocity speed to a style
        return Math.max(
          0,
          Math.min(
            colorScale.length - 1,
            Math.round(((m - min) / (max - min)) * (colorScale.length - 1))
          )
        );
      };

      return colorScale;
    }

    var colorStyles = windIntensityColorScale(
      MIN_VELOCITY_INTENSITY,
      MAX_VELOCITY_INTENSITY
    );
    var buckets = colorStyles.map(function() {
      return [];
    });

    var particleCount = Math.round(
      bounds.width * bounds.height * PARTICLE_MULTIPLIER
    );
    if (isMobile()) {
      particleCount *= PARTICLE_REDUCTION;
    }

    var fadeFillStyle = `rgba(0, 0, 0, ${OPACITY})`;

    var particles = [];
    for (var i = 0; i < particleCount; i++) {
      particles.push(
        field.randomize({
          age: Math.floor(Math.random() * MAX_PARTICLE_AGE) + 0
        })
      );
    }

    function evolve() {
      buckets.forEach(function(bucket) {
        bucket.length = 0;
      });
      particles.forEach(function(particle) {
        if (particle.age > MAX_PARTICLE_AGE) {
          field.randomize(particle).age = 0;
        }
        var x = particle.x;
        var y = particle.y;
        var v = field(x, y); // vector at current position
        var m = v[2];
        if (m === null) {
          particle.age = MAX_PARTICLE_AGE; // particle has escaped the grid, never to return...
        } else {
          var xt = x + v[0];
          var yt = y + v[1];
          if (field(xt, yt)[2] !== null) {
            // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
            particle.xt = xt;
            particle.yt = yt;
            buckets[colorStyles.indexFor(m)].push(particle);
          } else {
            // Particle isn't visible, but it still moves through the field.
            particle.x = xt;
            particle.y = yt;
          }
        }
        particle.age += 1;
      });
    }

    var g = params.canvas.getContext("2d");
    g.lineWidth = PARTICLE_LINE_WIDTH;
    g.fillStyle = fadeFillStyle;
    g.globalAlpha = 0.6;

    function draw() {
      // Fade existing particle trails.
      var prev = "lighter";
      g.globalCompositeOperation = "destination-in";
      g.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      g.globalCompositeOperation = prev;
      g.globalAlpha = OPACITY === 0 ? 0 : OPACITY * 0.9;

      // Draw new particle trails.
      buckets.forEach(function(bucket, i) {
        if (bucket.length > 0) {
          g.beginPath();
          g.strokeStyle = colorStyles[i];
          bucket.forEach(function(particle) {
            g.moveTo(particle.x, particle.y);
            g.lineTo(particle.xt, particle.yt);
            particle.x = particle.xt;
            particle.y = particle.yt;
          });
          g.stroke();
        }
      });
    }

    var then = Date.now();
    (function frame() {
      animationLoop = requestAnimationFrame(frame);
      var now = Date.now();
      var delta = now - then;
      if (delta > FRAME_TIME) {
        then = now - (delta % FRAME_TIME);
        evolve();
        draw();
      }
    })();
  };

  var start = function(bounds, width, height, extent) {
    var mapBounds = {
      south: deg2rad(extent[0][1]),
      north: deg2rad(extent[1][1]),
      east: deg2rad(extent[1][0]),
      west: deg2rad(extent[0][0]),
      width: width,
      height: height
    };

    stop();

    // build grid
    buildGrid(gridData, function(grid) {
      // interpolateField
      interpolateField(
        grid,
        buildBounds(bounds, width, height),
        mapBounds,
        function(bounds, field) {
          // animate the canvas with random points
          windy.field = field;
          animate(bounds, field);
        }
      );
    });
  };

  var stop = function() {
    if (windy.field) windy.field.release();
    if (animationLoop) cancelAnimationFrame(animationLoop);
  };

  var windy = {
    params: params,
    start: start,
    stop: stop,
    createField: createField,
    interpolatePoint: interpolate,
    setData: setData,
    setOptions: setOptions
  };

  return windy;
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}
