/*
 * @Description: 文本内容复制指令
 * @Date: 2021-07-06 10:54:43
 * @FilePath: \ant-design-vue-pro\src\core\directives\copy.js
 */
import { Icon, message } from 'ant-design-vue'
import Vue from 'vue'

export default {
  bind (el, binding) {
    if (binding.modifiers.dblclick) {
      // 双击触发复制
      el.addEventListener('dblclick', () => handleClick(el.innerText))
      el.style.cursor = 'copy'
    } else if (binding.modifiers.icon) {
      // 点击icon触发复制
      if (el.hasIcon) return
      const CopyIcon = Vue.extend({
        render: (h) => h(Icon, {
          style: {
            marginLeft: '5px'
          },
          props: {
            type: 'copy'
          }
        })
      })
      const copyComponent = new CopyIcon().$mount()
      const domCopy = copyComponent.$el

      el.appendChild(domCopy)
      el.hasIcon = true
      domCopy.addEventListener('click', () => handleClick(el.innerText))
      domCopy.style.cursor = 'copy'
    } else {
      // 单击触发复制
      el.addEventListener('click', () => handleClick(el.innerText))
      el.style.cursor = 'copy'
    }
  }
}
function handleClick (text) {
  // 创建元素
  if (!document.getElementById('copyTarget')) {
    const copyTarget = document.createElement('input')
    copyTarget.setAttribute('style', 'position:fixed;top:0;left:0;opacity:0;z-index:-1000;')
    copyTarget.setAttribute('id', 'copyTarget')
    document.body.appendChild(copyTarget)
  }

  // 复制内容
  const input = document.getElementById('copyTarget')
  input.value = text
  input.select()
  document.execCommand('copy')
  // alert('复制成功')
  message.success('复制成功')
}
