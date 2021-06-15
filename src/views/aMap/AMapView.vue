<!--
 * @Description: 高德地图页
 * @Autor: Alfred
 * @Date: 2021-06-15 10:44:53
 * @LastEditTime: 2021-06-15 12:00:09
 * @FilePath: \ant-design-vue-pro\src\views\aMap\AMapView.vue
-->
<template>
  <div id="container">
  </div>
</template>

<script>
import { loadBMap } from './loadMap'
export default {
  data () {
    return {
      myamap: null
    }
  },
  mounted () {
    this.$nextTick(() => {
      loadBMap('4c3405d64b542d04758985ed9b93f5a8').then(() => {
        // this.initMap()
        this.initMap()
      })
    })
  },
  methods: {
    initMap () {
      console.log('a')
      // eslint-disable-next-line no-undef
      const myamap = new AMap.Map('container', {
        zoom: 11, // 级别WW
        center: [116.397428, 39.90923], // 中心点坐标
        viewMode: '3D' // 使用3D视图
      })
      console.log(myamap)
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
