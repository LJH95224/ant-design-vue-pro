/*
 * @Description: 加载地图组件
 * @Autor: Alfred
 * @Date: 2021-06-15 11:36:11
 * @LastEditTime: 2021-06-15 11:46:04
 * @FilePath: \ant-design-vue-pro\src\views\aMap\loadMap.js
 */
export function loadBMap (ak) {
  return new Promise(function (resolve, reject) {
      if (typeof AMap !== 'undefined') {
          // eslint-disable-next-line no-undef
          resolve(AMap)
          return true
      }
      window.init = function () {
        // eslint-disable-next-line no-undef
        resolve(AMap)
      }
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://webapi.amap.com/maps?v=1.4.15&key=' + ak
      script.onerror = reject
      document.head.appendChild(script)
  })
}
