/*
 * @Description: 元素点击范围扩展指令
 * @des: 使用该指令可以隐式的扩展元素的点击范围，由于借用伪元素实现，故不会影响元素在页面上的排列布局。
 * @Date: 2021-07-06 10:02:52
 * @FilePath: \ant-design-vue-pro\src\core\directives\expandClick.js
 */

/**
 * 使用的时候采取数组的形势 v-expandClick="[20,30,40,50]"
 */
export default function (el, binding) {
  const s = document.styleSheets[document.styleSheets.length - 1]
  const DEFAULT = 10 // 默认向外扩展10px
  const [top, right, bottom, left] = binding.expression && JSON.parse(binding.expression) || []
  const ruleStr = `content:"";position:absolute;top:-${top || DEFAULT}px;bottom:-${bottom || DEFAULT}px;right:-${right || DEFAULT}px;left:-${left || DEFAULT}px;`
  const classNameList = el.className.split(' ')
  el.className = classNameList.includes('expand_click_range') ? classNameList.join(' ') : [...classNameList, 'expand_click_range'].join(' ')
  el.style.position = el.style.position || 'relative'
  if (s.insertRule) {
      s.insertRule('.expand_click_range::before' + '{' + ruleStr + '}', s.cssRules.length)
  } else { /* IE */
      s.addRule('.expand_click_range::before', ruleStr, -1)
  }
}
