<template>
  <div class="page-home">
    <el-form :model="searchForm" :inline="true">
      <el-form-item label="日期">
        <el-date-picker v-model="searchForm.date" type="daterange" unlink-panels range-separator="To" start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" format="YYYY-MM-DD" value-format="YYYY-MM-DD" :clearable="false" @change="getList" />
      </el-form-item>
      <el-form-item>
        <el-button v-loading="loading" type="primary" @click="getList">查询</el-button>
      </el-form-item>
    </el-form>
    <el-card class="box-card">
      <v-chart class="chart" :option="optionCPU" />
    </el-card>
    <el-card class="box-card">
      <v-chart class="chart" :option="optionRam" />
    </el-card>
    <el-card class="box-card">
      <v-chart class="chart" :option="optionGpu" />
    </el-card>
  </div>
</template>
<script>
import { getCpuLogList } from '@/api/cpulogs';
import { getRamLogList } from '@/api/ramlogs';
import { getGpuLogList } from '@/api/gpulogs';
import { convert } from '@/utils/unitConvert';
import moment from 'moment';
import * as echarts from 'echarts';
export default {
  props: {
    nodeList: {
      type: Array,
      default: null
    },
  },
  data() {
    return {
      loading: false,
      nodeInfoMap: {},
      searchForm: {},
      shortcuts: [{
          text: '近一周',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return [start, end]
          },
        },
        {
          text: '近一个月',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return [start, end]
          },
        },
        {
          text: '近3个月',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return [start, end]
          },
        }
      ],
      optionCPU: {},
      optionRam: {},
      optionGpu: {}
    }
  },
  watch: {
    'nodeList': function(newVal, oldVal) {
      let map = {};
      for (const i in this.nodeList) {
        let item = this.nodeList[i];
        if (item.is_home_contrast) {
          map[item.id] = item;
        }
      }
      this.nodeInfoMap = map;
      this.init();
    }
  },
  methods: {
    init() {
      let date = new Date();
      let end = moment(date).format('YYYY-MM-DD');
      // date.setDate(date.getDate() - 1);
      let start = moment(date).format('YYYY-MM-DD');
      this.searchForm = {
        date: [start, end]
      }
      this.getList();
    },
    getList() {
      this.loading = true;
      this.getCpuList();
      this.getRamList();
      this.getGpuList();
    },
    getCpuList() {
      let params = {
        start: this.searchForm.date[0] + ' 00:00:00',
        end: this.searchForm.date[1] + ' 23:59:59'
      }
      getCpuLogList(params).then(res => {
        let timeDataMap = {};
        let nodeCountMap = {};
        for (const i in res) {
          let item = res[i];
          if (this.nodeInfoMap[item['n_id']]) {
            item.dateTime = moment(item.created_time).format('YYYY-MM-DD HH:mm');
            nodeCountMap[item.n_id] = true;
            let dataMap = timeDataMap[item.dateTime];
            if (!dataMap) {
              dataMap = {};
            }
            dataMap[item.n_id] = item.us;
            timeDataMap[item.dateTime] = dataMap;
          }
        }

        let nodeCount = Object.keys(nodeCountMap).length;
        let nodeMap = {};
        let legend_list = [];
        let series_list = [];
        let time_list = [];

        for (const key in timeDataMap) {
          let data = timeDataMap[key];
          if (Object.keys(data).length == nodeCount) {
            time_list.push(key);
            for (const nodeid in data) {
              let arr = nodeMap[nodeid];
              if (!arr) {
                arr = [];
              }
              arr.push(data[nodeid]);
              nodeMap[nodeid] = arr;
            }
          }
        }

        for (const key in nodeMap) {
          let datas = nodeMap[key];
          let name = this.nodeInfoMap[key].name;
          legend_list.push(name);
          series_list.push({
            name: name,
            type: 'line',
            smooth: true,
            data: datas
          });
        }
        let option = {
          title: {
            text: 'CPU'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: legend_list
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: time_list
          },
          yAxis: {
            type: 'value'
          },
          series: series_list
        }
        this.optionCPU = option;
        this.loading = false;
      });
    },
    getRamList() {
      let params = {
        start: this.searchForm.date[0] + ' 00:00:00',
        end: this.searchForm.date[1] + ' 23:59:59'
      }
      getRamLogList(params).then(res => {
        let timeDataMap = {};
        let nodeCountMap = {};
        for (const i in res) {
          let item = res[i];
          if (this.nodeInfoMap[item['n_id']]) {
            item.dateTime = moment(item.created_time).format('YYYY-MM-DD HH:mm');
            nodeCountMap[item.n_id] = true;
            let dataMap = timeDataMap[item.dateTime];
            if (!dataMap) {
              dataMap = {};
            }
            dataMap[item.n_id] = item.used;
            timeDataMap[item.dateTime] = dataMap;
          }
        }

        let nodeCount = Object.keys(nodeCountMap).length;
        let nodeMap = {};
        let legend_list = [];
        let series_list = [];
        let time_list = [];

        for (const key in timeDataMap) {
          let data = timeDataMap[key];
          if (Object.keys(data).length == nodeCount) {
            time_list.push(key);
            for (const nodeid in data) {
              let arr = nodeMap[nodeid];
              if (!arr) {
                arr = [];
              }
              arr.push(data[nodeid]);
              nodeMap[nodeid] = arr;
            }
          }
        }

        for (const key in nodeMap) {
          let datas = nodeMap[key];
          let name = this.nodeInfoMap[key].name;
          legend_list.push(name);
          series_list.push({
            name: name,
            type: 'line',
            smooth: true,
            data: datas
          });
        }
        let option = {
          title: {
            text: '内存'
          },
          tooltip: {
            trigger: 'axis',
            valueFormatter: (value) => convert(value)
          },
          legend: {
            data: legend_list
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: time_list
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: function(value, index) {
                return convert(value, 0);
              }
            }
          },
          series: series_list
        }
        this.optionRam = option;
        this.loading = false;
      });
    },
    getGpuList() {
      let params = {
        start: this.searchForm.date[0] + ' 00:00:00',
        end: this.searchForm.date[1] + ' 23:59:59'
      }
      getGpuLogList(params).then(res => {
        let timeDataMap = {};
        let nodeCountMap = {};
        for (const i in res) {
          let item = res[i];
          if (this.nodeInfoMap[item['n_id']]) {
            item.dateTime = moment(item.created_time).format('YYYY-MM-DD HH:mm');
            nodeCountMap[item.n_id] = true;
            let dataMap = timeDataMap[item.dateTime];
            if (!dataMap) {
              dataMap = {};
            }
            let t1 = item.temp1 ? item.temp1 : 0;
            let t2 = item.temp2 ? item.temp2 : 0;
            let u1 = item['gpu-util1'] ? item['gpu-util1'] : 0;
            let u2 = item['gpu-util2'] ? item['gpu-util2'] : 0;

            dataMap[item.n_id] = { temp: t1 > t2 ? t1 : t2, util: u1 > u2 ? u1 : u2 };

            timeDataMap[item.dateTime] = dataMap;
          }
        }
        let nodeCount = Object.keys(nodeCountMap).length;
        let nodeMap = {};
        let legend_list = [];
        let series_list = [];
        let time_list = [];

        for (const key in timeDataMap) {
          let data = timeDataMap[key];
          if (Object.keys(data).length == nodeCount) {
            time_list.push(key);
            for (const nodeid in data) {
              let arr = nodeMap[nodeid];
              let sitem = data[nodeid];
              if (!arr) {
                arr = {};
              }
              let temparr = arr['temp'];
              if (!temparr) {
                temparr = []
              }
              temparr.push(sitem.temp);
              let utilarr = arr['util'];
              if (!utilarr) {
                utilarr = []
              }
              utilarr.push(sitem.util);

              arr = { temp: temparr, util: utilarr };
              nodeMap[nodeid] = arr;
            }
          }
        }

        for (const key in nodeMap) {
          let datas = nodeMap[key];
          let name = this.nodeInfoMap[key].name;
          let tname = name + '-温度';
          let uname = name + '-使用率';

          legend_list.push(tname);
          series_list.push({
            name: tname,
            type: 'line',
            smooth: true,
            yAxisIndex: 1,
            tooltip: {
              valueFormatter: function(value) {
                return value + ' °C';
              }
            },
            data: datas['temp']
          });

          legend_list.push(uname);
          series_list.push({
            name: uname,
            type: 'bar',
            yAxisIndex: 0,
            smooth: true,
            data: datas['util']
          });
        }
        let option = {
          title: {
            text: 'GPU'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: legend_list
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: time_list
          },
          yAxis: [{
              type: 'value',
              name: '使用率',
            },
            {
              type: 'value',
              name: '温度',
              axisLabel: {
                formatter: '{value} °C'
              }
            }
          ],
          series: series_list
        }
        this.optionGpu = option;
        this.loading = false;
      });
    },
  }
}

</script>
<style scoped>
.chart {
  height: 21vh;
}

.el-card {
  max-height: 42vh;
  margin-bottom: 20px;
  margin-right: 20px;
}

.el-form-item {
  width: 300px;
}

</style>
