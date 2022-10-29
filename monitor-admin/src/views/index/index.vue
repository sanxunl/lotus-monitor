<template>
  <div class="page-home">
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="首页" name="home">
        <home-page :node-list="nodeList" />
      </el-tab-pane>
      <el-tab-pane v-for="node in nodeList" :label="node.name" :name="node.id">
        <node-page :node-data="node" :is-show="activeName == node.id" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import { getNodeList } from '@/api/nodeinfo';
import homePage from './home';
import nodePage from './node';

export default {
  components: { nodePage, homePage },
  data() {
    return {
      activeName: 'home',
      nodeList: []
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    handleClick(tab, event) {},
    getList() {
      getNodeList().then(res => {
        this.nodeList = res;
      })
    }
  }
}

</script>
<style scoped>
.page-home {
  width: 100%;
}

.chart {
  width: 30vw;
  height: 33vh;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-body {
  display: flex;
  flex-wrap: wrap;
}

.el-card {
  width: 31vw;
  max-height: 42vh;
  margin-bottom: 20px;
  margin-right: 20px;
}

</style>
