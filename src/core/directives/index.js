/*
 * @Author: Vue 指令库
 * @Date: 2021-07-06 09:57:10
 * @LastEditTime: 2021-07-06 14:21:33
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \ant-design-vue-pro\src\core\directives\index.js
 */
import Vue from 'vue'
import expandClick from './expandClick'
import copy from './copy'
import ellipsis from './ellipsis'

const directives = {
  expandClick,
  copy,
  ellipsis
}

Object.keys(directives).forEach(name => Vue.directive(name, directives[name]))
