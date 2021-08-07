<!--
 * @Description: 高德地图页
 * @Autor: Alfred
 * @Date: 2021-06-15 10:44:53
 * @LastEditTime: 2021-08-07 14:45:09
 * @FilePath: \ant-design-vue-pro\src\views\aMap\AMapView.vue
-->
<template>
  <div id="container">
  </div>
</template>

<script>
import { loadBMap } from './loadMap'
import { ScanRadarModel, ScanRadarRange, getRadians } from './ScanRadarModel'
import radarImg from '@/assets/site_type_radar_big.png'
import { Windy } from './windy.js'
// import windDataJSON from './windy.json'
// 一张图数据
import windDataJSON2 from './one.json'
// import * as _ from 'lodash'
var AMap = null
export default {
  data () {
    return {
      myamap: null,
      // 雷达分辨率步进长度;
      stepLength: 7.5,
      // 雷达步进角度;
      stepDegree: 2,
      // 高度数量;
      heightCount: 1000,
      // 倾斜弧度;
      obliquityDegree: 20,
      // 雷达透明度;
      opacity: 0.7,
      windy: null,
      canvasOverlayVector: null,
      canvasContent: null,
      timer: null
    }
  },
  mounted () {
    this.$nextTick(() => {
      loadBMap('4c3405d64b542d04758985ed9b93f5a8').then(() => {
        // this.initMap()
        AMap = window.AMap
        this.initMap()
      })
    })
  },
  methods: {
    initMap () {
      console.log('a')
      const _this = this
      _this.myamap = new AMap.Map('container', {
        pitch: 0, // 地图俯仰角度，有效范围 0 度- 83 度
        // zoom: 1, // 级别WW
        // center: [116.397428, 39.90923], // 中心点坐标
        viewMode: '3D', // 使用3D视图
        zoom: 3,
        center: [116.335183, 39.941735]
      })

      AMap.plugin(['AMap.ControlBar', 'AMap.Scale', 'AMap.MapType', 'AMap.CustomLayer'], function () {
        // this 指向修改了
        _this.myamap.addControl(new AMap.ControlBar({
          position: {
            left: '-90px',
            top: '10px'
          }
        }))
        _this.myamap.addControl(new AMap.Scale())
        _this.myamap.addControl(new AMap.MapType())
      })
      // this.initDraw3D()
      // this.initDraw3DModel()
      // this.initMarker()
      // this.drawCanvas()
      // this.getWindData()
      // this.drawWindData(windDataJSON2.data)
      this.drawRanderCustomLayer(windDataJSON2.data)
    },
    /**
     * @Author: Alfred
     * @description: 绘制3D
     * @param {*}
     * @return {*}
     */
    initDraw3D () {
      const object3DLayer = new AMap.Object3DLayer()
      this.myamap.add(object3DLayer)
      const rectangle = new AMap.Object3D.Mesh()
      // 创建之后获取geometry
      const geometry = rectangle.geometry
      var lnglat1 = new AMap.LngLat(116.39, 39.9)
      var lnglat2 = new AMap.LngLat(116.40, 39.9)
      var v0xy = this.myamap.lngLatToGeodeticCoord(lnglat1)
      var v1xy = this.myamap.lngLatToGeodeticCoord(lnglat2)
      var z = -1000 // 3D地图Z方向朝下，所以负值
      geometry.vertices.push(v0xy.x, v0xy.y, 0) // V0
      geometry.vertices.push(v1xy.x, v1xy.y, 0) // V1
      geometry.vertices.push(v1xy.x, v1xy.y, z) // V2
      geometry.vertices.push(v0xy.x, v0xy.y, z) // V3
      geometry.faces.push(0, 1, 3)
      geometry.faces.push(1, 2, 3)
      geometry.vertexColors.push(1, 0, 0, 1) // V0
      geometry.vertexColors.push(0, 1, 0, 1) // V1
      geometry.vertexColors.push(0, 0, 1, 1) // V2
      geometry.vertexColors.push(0, 1, 1, 1) // V3

      rectangle.transparent = false
      rectangle.backOrFront = 'both' // 'back'、'front'、'both'
      object3DLayer.add(rectangle)
    },
    /**
     * @Author: Alfred
     * @description: 绘制3D模型
     * @param {*}
     * @return {*}
     */
    initDraw3DModel () {
      const _this = this
      const object3Dlayer = new AMap.Object3DLayer()
      this.myamap.add(object3Dlayer)
      var scanRadarModel1 = new ScanRadarModel({
        lng: 116.397428,
        lat: 39.90923,
        centerHeight: 1000,
        obliquityDegree: _this.obliquityDegree,
        stepLength: _this.stepLength,
        heightCount: _this.heightCount,
        beginDegree: 90,
        degree: 360,
        stepDegree: _this.stepDegree,
        opacity: _this.opacity,
        map: this.myamap,
        object3Dlayer,
        AMap
      })
      scanRadarModel1.build()
      var scanRadarRange1 = new ScanRadarRange({
        lngLat: new AMap.LngLat(116.397428, 39.90923),
        radius: _this.stepLength * _this.heightCount * Math.cos(getRadians(_this.obliquityDegree)),
        degrees: 360,
        red: 1,
        green: 0,
        blue: 0,
        map: this.myamap,
        AMap
      })
      scanRadarRange1.addTo(object3Dlayer)
      scanRadarRange1.start()
    },
    /**
     * @description: 添加 Marker 点
     * @param {*}
     * @return {*}
     */
    initMarker () {
      const _this = this
      const radarLngLat = new AMap.LngLat(116.397428, 39.90923)
      const icon = new AMap.Icon({
        size: new AMap.Size(19, 33), // 图标尺寸
        image: radarImg, // Icon的图像
        imageOffset: new AMap.Pixel(0, 0), // 图像相对展示区域的偏移量，适于雪碧图等
        // 根据所设置的大小拉伸或压缩图片
        imageSize: new AMap.Size(19, 33)
      })
      const marker = new AMap.Marker({
        icon: icon,
        position: radarLngLat,
        offset: new AMap.Pixel(-10, -10)
      })
      this.myamap.add(marker)
      // 鼠标点击marker弹出自定义的信息窗体
      const info = []
      info.push('<div style="padding:7px 0px 0px 0px;"><h4>雷达</h4>')
      info.push("<p class='input-item'>雷达XXX</p>")
      info.push("<p class='input-item'>描述：雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达雷达</p></div></div>")

      const infoWindow = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -25),
        content: info.join('')
      })
      AMap.event.addListener(marker, 'click', function () {
        infoWindow.open(_this.myamap, marker.getPosition())
      })
    },
    getWindData () {
      const _this = this
			const targetTime = '2021080420'
      const params = {
				bizId: `wind-json-0-${targetTime}`,
				attachmentBizType: 10
			}
      _this.$http.get('http://ndp8.rnd.cas-pe.com:8080/platform-file-service/attachment/downloadAttachment', { params }).then((res) => {
        if (res) {
          _this.drawWindData(res)
        } else {
          console.error('无风场数据')
        }
      })
    },
    drawRanderCustomLayer (winddata) {
      const _this = this
     _this.canvasOverlayVector = document.createElement('canvas')
      _this.canvasOverlayVector.width = this.myamap.getSize().width
			_this.canvasOverlayVector.height = this.myamap.getSize().height
      const customLayer = new AMap.CustomLayer(_this.canvasOverlayVector, {
        zIndex: 22,
        alwaysRender: true
      })
      const options = {
        data: winddata,
        canvas: _this.canvasOverlayVector, // 绘制风流线的canvas对象
        map: _this.myamap // 地图对象
      }
      _this.windy = new Windy(options)
       customLayer.setMap(_this.myamap)
      this.onDrawLayer()
      _this.myamap.on('dragstart', _this.windy.stop)
      _this.myamap.on('dragend', _this.clearAndRestart())
      _this.myamap.on('zoomstart', _this.windy.stop)
      _this.myamap.on('zoomend', _this.clearAndRestart())
    },
    // drawWindData (winddata) {
    //   const _this = this
    //   _this.canvasOverlayVector = document.createElement('canvas')
    //   // _this.canvasOverlayVector.classList.add('velocity-overlay')
		// 	_this.canvasOverlayVector.width = _this.myamap.getSize().width
		// 	_this.canvasOverlayVector.height = _this.myamap.getSize().height
    //   _this.canvasContent = _this.canvasOverlayVector.getContext('2d')
    //   // const southWest = [winddata[0].header.lo1, winddata[0].header.la1]
    //   // const northEast = [winddata[0].header.lo2, winddata[0].header.la2]
    //   const southWest = new AMap.LngLat(winddata[0].header.lo1, winddata[0].header.la1)
    //   const northEast = new AMap.LngLat(winddata[0].header.lo2, winddata[0].header.la2)
    //   console.log(southWest, northEast)
    //   const customLayer = new AMap.CanvasLayer({
    //     bounds: new AMap.Bounds(southWest, northEast),
    //     canvas: _this.canvasOverlayVector,
		// 		zIndex: 1100
		// 	})
    //   customLayer.setMap(_this.myamap)
    //   // _this.myamap.add(customLayer)
    //   // _this.canvasContent = _this.canvasOverlayVector.getContext('2d')
    //   const options = {
    //     data: winddata,
		// 		canvas: _this.canvasOverlayVector, // 绘制风流线的canvas对象
		// 		map: _this.myamap // 地图对象
		// 	}
    //   _this.windy = new Windy(options)
    //   this.onDrawLayer()
    //   console.log(_this.windy)
    //   const windyLayer = _.filter(_this.myamap.getLayers(), item => item.CLASS_NAME === 'AMap.CanvasLayer')
    //   console.log(windyLayer)
    //   // _this.myamap.on('dragstart', _this.windy.stop)
    //   // _this.myamap.on('dragend', _this.clearAndRestart())
    //   // _this.myamap.on('zoomstart', _this.windy.stop)
    //   // _this.myamap.on('zoomend', _this.clearAndRestart())
    // },
    onDrawLayer () {
      const _this = this
      if (!_this.windy) {
        _this.drawWindData(windDataJSON2.data)
        return
      }
      if (_this.timer) clearTimeout(_this._timer)
      _this.timer = setTimeout(function () {
        _this.startWindy()
      }, 750)
    },
    clearAndRestart () {
      if (this.windy) this.startWindy()
    },
    startWindy () {
      const bounds = this.myamap.getBounds()
      const size = this.myamap.getSize()
      console.log(bounds.bounds[0].lng, bounds.bounds[0].lat)
      console.log(bounds.bounds[1].lng, bounds.bounds[1].lat)
      console.log(bounds.bounds[2].lng, bounds.bounds[2].lat)
      console.log(bounds.bounds[3].lng, bounds.bounds[3].lat)
      console.log(bounds.bounds[4].lng, bounds.bounds[4].lat)
      this.windy.start([[0, 0], [size.width, size.height]], size.width, size.height, [[bounds.bounds[0].lng, bounds.bounds[0].lat], [bounds.bounds[2].lng, bounds.bounds[2].lat]])
    },
    drawCanvas () {
      var canvas = document.createElement('canvas')
      canvas.width = canvas.height = 200

      var context = canvas.getContext('2d')
      context.fillStyle = 'rgb(0,100,255)'
      context.strokeStyle = 'white'
      context.globalAlpha = 1
      context.lineWidth = 2

      var radious = 0
      var draw = function () {
        context.clearRect(0, 0, 200, 200)
        context.globalAlpha = (context.globalAlpha - 0.01 + 1) % 1
        radious = (radious + 1) % 100

        context.beginPath()
        context.arc(100, 100, radious, 0, 2 * Math.PI)
        context.fill()
        context.stroke()

        // 2D视图时可以省略
        CanvasLayer.reFresh()

        AMap.Util.requestAnimFrame(draw)
      }

      var CanvasLayer = new AMap.CanvasLayer({
        canvas: canvas,
        bounds: new AMap.Bounds(
            [66, 10],
            [140, 58]
        ),
        zooms: [3, 18]
      })

      CanvasLayer.setMap(this.myamap)
      draw()
    }
  }
}
</script>

<style scoped>
#container {
  width: 100%;
  height: 800px;
}
</style>
