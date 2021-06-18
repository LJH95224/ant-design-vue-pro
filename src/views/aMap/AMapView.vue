<!--
 * @Description: 高德地图页
 * @Autor: Alfred
 * @Date: 2021-06-15 10:44:53
 * @LastEditTime: 2021-06-18 17:06:11
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
      opacity: 0.7
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
        pitch: 75, // 地图俯仰角度，有效范围 0 度- 83 度
        zoom: 11, // 级别WW
        center: [116.397428, 39.90923], // 中心点坐标
        viewMode: '3D' // 使用3D视图
      })

      AMap.plugin(['AMap.ControlBar', 'AMap.Scale', 'AMap.MapType'], function () {
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
      this.initDraw3D()
      this.initDraw3DModel()
      this.initMarker()
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
