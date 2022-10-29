<template>
  <el-dialog title="CPU" v-model="dialogVisible" width="90vw" top="5vh" destroy-on-close append-to-body @open="open" @close="close">
    <el-form :model="searchForm" :inline="true">
      <el-form-item label="日期">
        <el-date-picker v-model="searchForm.date" type="daterange" unlink-panels range-separator="To" start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" format="YYYY-MM-DD" value-format="YYYY-MM-DD" :clearable="false" @change="getList" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">查询</el-button>
      </el-form-item>
    </el-form>
    <v-chart v-loading="loading" class="chart" :option="option" />
    <el-table v-loading="loading" :data="dataList" height="36vh">
      <el-table-column property="dateTime" label="时间" />
      <el-table-column property="us" label="us" />
      <el-table-column property="sy" label="sy" />
      <el-table-column property="ni" label="ni" />
      <el-table-column property="iid" label="id" />
      <el-table-column property="wa" label="wa" />
      <el-table-column property="hi" label="hi" />
      <el-table-column property="si" label="si" />
      <el-table-column property="st" label="st" />
    </el-table>
  </el-dialog>
</template>
<script>
import * as echarts from 'echarts';
import moment from 'moment';
import { getCpuLogList } from '@/api/cpulogs';

export default {
  props: {
    nodeData: {
      type: Object,
      default: null
    },
    dialogVisible: Boolean
  },
  data() {
    return {
      loading: false,
      dataList: [],
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
      option: {}
    };
  },
  computed: {
    visible: function() {
      return this.dialogVisible;
    }
  },
  methods: {
    open() {
      let date = new Date();
      let end = moment(date).format('YYYY-MM-DD');
      date.setDate(date.getDate() - 1);
      let start = moment(date).format('YYYY-MM-DD');
      this.searchForm = {
        date: [start, end]
      }
      this.getList();
    },
    close() {
      this.$emit('close');
    },
    getList() {
      this.loading = true;
      let params = {
        n_id: this.nodeData.id,
        start: this.searchForm.date[0] + ' 00:00:00',
        end: this.searchForm.date[1] + ' 23:59:59',
      }
      getCpuLogList(params).then(res => {
        let legend_list = ['us', 'sy', 'ni', 'id', 'wa', 'hi', 'si', 'st']
        let category_list = [];
        let series_map = {};
        for (const i in res) {
          let item = res[i];
          item.dateTime = moment(item.created_time).format('YYYY-MM-DD HH:mm:ss');
          category_list.push(moment(item.created_time).format('YYYY-MM-DD HH:mm'))
          for (const key in item) {
            if (key != 'id' && key != 'n_id' && key != 'created_time') {
              let array = series_map[key];
              if (!array) {
                array = []
              }
              array.push(item[key]);
              series_map[key] = array;
            }
          }
        }
        let series = [];
        for (const key in series_map) {
          series.push({
            name: key == 'iid' ? 'id' : key,
            type: 'line',
            smooth: true,
            data: series_map[key]
          })
        }
        let option = {
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: legend_list,
            tooltip: {
              show: true,
              formatter: function(value) {
                let name = value.name;
                let text = '';
                switch (name) {
                  case 'us':
                    text = '用户空间程序的cpu使用率';
                    break;
                  case 'sy':
                    text = '系统空间的cpu使用率';
                    break;
                  case 'ni':
                    text = '空闲cpu';
                    break;
                  case 'id':
                    text = 'cpu运行时在等待io的时间';
                    break;
                  case 'wa':
                    text = 'cpu处理硬中断的数量';
                    break;
                  case 'hi':
                    text = 'cpu处理硬中断的数量';
                    break;
                  case 'si':
                    text = 'cpu处理软中断的数量';
                    break;
                  case 'st':
                    text = '被虚拟机偷走的cpu';
                    break;
                  default:
                    text = name;
                }
                return text;
              },
            }
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: category_list
          },
          yAxis: {
            type: 'value'
          },
          series: series
        };
        this.option = option;
        this.dataList = res;
        this.loading = false;
      });
    }
  }
}

</script>
<style scoped>
.chart {
  width: 90vw;
  height: 36vh;
}

.el-form-item {
  width: 300px;
}

</style>
