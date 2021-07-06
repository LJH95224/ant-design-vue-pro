/*
 * @Description: 文字超出省略指令
 * @Date: 2021-07-06 14:20:29
 * @FilePath: \ant-design-vue-pro\src\core\directives\ellipsis.js
 */
export default function (el, binding) {
  el.style.width = (binding.expression || 100) + 'px'
  el.style.whiteSpace = 'nowrap'
  el.style.overflow = 'hidden'
  el.style.textOverflow = 'ellipsis'
}
