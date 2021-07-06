<!--
 * @Description: Vue 指令示例
 * @Date: 2021-07-06 10:20:50
 * @FilePath: \ant-design-vue-pro\src\views\directives\index.vue
-->
<template>
  <page-header-wrapper>
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="expandClick 指令" :bordered="false">
          <!-- 一起使用的时候注意覆盖 -->
          <span v-expandClick @click="glabClickoutside"> 点击范围扩大</span>
          <!-- <span v-expandClick="[20,30,40,50]" @click="glabClickoutside"> 点击范围扩大</span> -->
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="copy 指令" :bordered="false">
          <div style="margin-bottom: 20px" v-copy> 单击复制 </div>
          <div style="margin-bottom: 20px" v-copy.dblclick> 双击复制 </div>
          <div style="margin-bottom: 20px" v-copy.icon> icon复制 </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="ellipsis 指令" :bordered="false">
          <div v-ellipsis="80">需要省略的文字是阿萨的副本阿萨的副本阿萨的副本阿萨的副本</div>
        </a-card>
      </a-col>
    </a-row>
  </page-header-wrapper>
</template>

<script>
export default {
  methods: {
    glabClickoutside () {
      console.log('点击范围扩大')
    }
  }
}
</script>
