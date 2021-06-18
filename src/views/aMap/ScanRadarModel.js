/*
 * @Author: your name
 * @Date: 2021-06-18 14:46:14
 * @LastEditTime: 2021-06-18 17:08:03
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \ant-design-vue-pro\src\views\aMap\ScanRadarModel.js
 */
export const getRadians = function (degrees) {
  return (Math.PI * degrees) / 180
}
const getPixelByRealDistance = function (realDistance, CP) {
  return realDistance / CP
}
export const ScanRadarModel = function (o) {
  const AMap = o.AMap
  const map = o.map
  const object3Dlayer = o.object3Dlayer
  const CP = map.getResolution(map.getCenter(), 20)
  var r = this
  // 中心经纬度对象;
  var centerLnglat = new AMap.LngLat(o.lng, o.lat)
  var centerHeight = o.centerHeight // 中心高度;
  var obliquityRad = getRadians(o.obliquityDegree) // 倾斜弧度;
  var stepLength = o.stepLength // 步进长度;
  var heightCount = o.heightCount // 高度数量;
  var beginDegree = o.beginDegree // 开始角度;
  var degree = o.degree
  var stepDegree = o.stepDegree // 步进角度;
  var opacity = o.opacity // 透明度;

  var endDegree = beginDegree + degree // 结束角度;
  var offsetDegree = stepDegree / 2 // 中心偏移角度;
  var offsetCos = Math.cos(getRadians(offsetDegree)) // 偏移余弦值;

  var stepPixel = getPixelByRealDistance(stepLength, CP) // 步进像素;
  var stepShadowRadius = stepPixel * Math.cos(obliquityRad) // 影子步进像素;
  var beginZ = 0 - getPixelByRealDistance(centerHeight, CP)
  var stepZ = stepPixel * Math.sin(obliquityRad) // 步进高度;

  var cVx = map.lngLatToGeodeticCoord(centerLnglat) // 中心顶点;

  var curDegree = 0 // 当前角度;
  var drawScan = function () {
    curDegree += stepDegree
    if (curDegree >= endDegree) {
      window.clearInterval(scanInterval)
      scanInterval = null
      return
    }

    var scanRectangle = new AMap.Object3D.Mesh()
    var geometry = scanRectangle.geometry

    var fixedDegree = 540 - curDegree // 修正角度;

    var o1 = Math.sin(getRadians(fixedDegree - offsetDegree))
    var o2 = Math.cos(getRadians(fixedDegree - offsetDegree))
    var o3 = Math.sin(getRadians(fixedDegree + offsetDegree))
    var o4 = Math.cos(getRadians(fixedDegree + offsetDegree))

    for (var i = 0; i < heightCount; i++) {
      var lowShadowRadius = i * stepShadowRadius
      var highShadowRadius = (i + 1) * stepShadowRadius

      var lowOffsetRadius = lowShadowRadius * offsetCos
      var highOffsetRadius = highShadowRadius * offsetCos

      var lowZ = beginZ - i * stepZ
      var highZ = beginZ - (i + 1) * stepZ

      geometry.vertices.push(cVx.x + o1 * lowOffsetRadius, cVx.y + o2 * lowOffsetRadius, lowZ) // V0
      geometry.vertices.push(cVx.x + o3 * lowOffsetRadius, cVx.y + o4 * lowOffsetRadius, lowZ) // V1
      geometry.vertices.push(cVx.x + o1 * highOffsetRadius, cVx.y + o2 * highOffsetRadius, highZ) // V2
      geometry.vertices.push(cVx.x + o3 * highOffsetRadius, cVx.y + o4 * highOffsetRadius, highZ) // V3

      // TODO START;
      var red = 0
      var green = 0.5
      var blue = 0

      // TODO END;

      // 颜色填充
      geometry.vertexColors.push(red, green, blue, opacity) // V0
      geometry.vertexColors.push(red, green, blue, opacity) // V1
      geometry.vertexColors.push(red, green, blue, opacity) // V2
      geometry.vertexColors.push(red, green, blue, opacity) // V3

      var bottomIndex = i * 4
      var topIndex = bottomIndex + 1
      var nextBottomIndex = bottomIndex + 2
      var nextTopIndex = bottomIndex + 3

      geometry.faces.push(topIndex, bottomIndex, nextBottomIndex)
      geometry.faces.push(topIndex, nextBottomIndex, nextTopIndex)
    }

    scanRectangle.transparent = true
    scanRectangle.backOrFront = 'both'
    object3Dlayer.add(scanRectangle)
  }

  var scanInterval = null

  r.build = function () {
    if (scanInterval) {
      return
    }
    curDegree = beginDegree - stepDegree // 当前角度;
    scanInterval = window.setInterval(drawScan, 1)
  }

  r.distroy = function () {
    if (!scanInterval) {
      return
    }
    window.clearInterval(scanInterval)
    scanInterval = null
  }
}

export const ScanRadarRange = function (o) {
  var r = this
  const AMap = o.AMap
  const map = o.map
  const CP = map.getResolution(map.getCenter(), 20)
  var object3DLayer = null
  var radar = new AMap.Object3D.Mesh()
  radar.transparent = true
  radar.backOrFront = 'front'

  var unitDegree = 1 // 单元角度;

  var lngLat = o.lngLat // 经纬度;
  var radius = o.radius // 半径;
  var degrees = o.degrees // 角度;
  var { red, green, blue } = o // 颜色

  var radiusPixel = radius / CP
  var count = degrees / unitDegree

  var getOpacity = function (scale) {
    return 1 - Math.pow(scale, 0.15)
  }

  var geometry = radar.geometry
  for (var i = 0; i < count; i++) {
    var angle1 = i * getRadians(unitDegree)
    var angle2 = (i + 1) * getRadians(unitDegree)

    var p1x = Math.cos(angle1) * radiusPixel
    var p1y = Math.sin(angle1) * radiusPixel
    var p2x = Math.cos(angle2) * radiusPixel
    var p2y = Math.sin(angle2) * radiusPixel

    geometry.vertices.push(0, 0, 0)
    geometry.vertices.push(p1x, p1y, 0)
    geometry.vertices.push(p2x, p2y, 0)

    var opacityStart = getOpacity(1 - i / count)
    var opacityEnd = getOpacity(1 - (i + 1) / count)

    geometry.vertexColors.push(red, green, blue, opacityStart)
    geometry.vertexColors.push(red, green, blue, opacityStart)
    geometry.vertexColors.push(red, green, blue, opacityEnd)
  }

  radar.position(lngLat)

  r.addTo = function (object3dLayer) {
    r.remove()
    object3dLayer.add(radar)
    object3DLayer = object3dLayer
  }

  r.remove = function () {
    if (object3DLayer) {
      object3DLayer.remove(radar)
      object3DLayer = null
    }
  }

  r.start = function () {
    radar.rotateZ(1)
    AMap.Util.requestAnimFrame(r.start)
  }
}
