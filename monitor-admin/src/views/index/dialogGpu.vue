<template>
  <el-dialog title="GPU" v-model="dialogVisible" width="90vw" top="5vh" destroy-on-close append-to-body @open="open" @close="close">
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
      <el-table-column property="dateTime" label="时间" width="150" />
      <el-table-column label="显卡1" header-align="center">
        <el-table-column property="fan1" label="Fan" />
        <el-table-column property="temp1" label="Temp" />
        <el-table-column label="Pwr">
          <template #default="scope">
            <span v-if="scope.row.cap1">{{ scope.row.usage1 }}W/{{ scope.row.cap1 }}W</span>
          </template>
        </el-table-column>
        <el-table-column label="Memory-Usage" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.memory1">{{ scope.row['mem-usage1'] }}MiB/{{ scope.row.memory1 }}MiB</span>
          </template>
        </el-table-column>
        <el-table-column property="gpu-util1" label="Gpu-Util" />
      </el-table-column>
      <el-table-column label="显卡2" header-align="center">
        <el-table-column property="fan2" label="Fan" />
        <el-table-column property="temp2" label="Temp" />
        <el-table-column label="Pwr">
          <template #default="scope">
            <span v-if="scope.row.cap2">{{ scope.row.usage2 }}W/{{ scope.row.cap2 }}W</span>
          </template>
        </el-table-column>
        <el-table-column label="Memory-Usage" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.memory2">{{ scope.row['mem-usage2'] }}MiB/{{ scope.row.memory2 }}MiB</span>
          </template>
        </el-table-column>
        <el-table-column property="gpu-util1" label="Gpu-Util" />
      </el-table-column>
    </el-table>
  </el-dialog>
</template>
<script>
import * as echarts from 'echarts';
import moment from 'moment';
import { getGpuLogList } from '@/api/gpulogs';

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
      getGpuLogList(params).then(res => {
        let legend_list = ['显卡1-温度', '显卡1-使用率', '显卡2-温度', '显卡2-使用率', ]
        let category_list = [];
        let series_datas_1_temp = [];
        let series_datas_1_util = [];
        let series_datas_2_temp = [];
        let series_datas_2_util = [];
        for (const i in res) {
          let item = res[i];
          item.dateTime = moment(item.created_time).format('YYYY-MM-DD HH:mm:ss');
          category_list.push(moment(item.created_time).format('YYYY-MM-DD HH:mm'));
          if (item.temp1 != undefined) {
            series_datas_1_temp.push(item.temp1);
          } else {
            series_datas_1_temp.push(0);
          }
          if (item['gpu-util1'] != undefined) {
            series_datas_1_util.push(item['gpu-util1']);
          } else {
            series_datas_1_util.push(0);
          }
          if (item.temp2 != undefined) {
            series_datas_2_temp.push(item.temp2);
          } else {
            series_datas_2_temp.push(0);
          }
          if (item['gpu-util2'] != undefined) {
            series_datas_2_util.push(item['gpu-util2']);
          } else {
            series_datas_2_util.push(0);
          }
        }
        let series = [];
        if (series_datas_1_temp.length > 0) {
          series.push({
            name: '显卡1-温度',
            type: 'line',
            smooth: true,
            yAxisIndex: 1,
            tooltip: {
              valueFormatter: function(value) {
                return value + ' °C';
              }
            },
            data: series_datas_1_temp
          })
        }
        if (series_datas_1_util.length > 0) {
          series.push({
            name: '显卡1-使用率',
            type: 'bar',
            yAxisIndex: 0,
            smooth: true,
            data: series_datas_1_util
          });
        }
        if (series_datas_2_temp.length > 0) {
          series.push({
            name: '显卡2-温度',
            type: 'line',
            smooth: true,
            yAxisIndex: 1,
            tooltip: {
              valueFormatter: function(value) {
                return value + ' °C';
              }
            },
            data: series_datas_2_temp
          })
        }
        if (series_datas_2_util.length > 0) {
          series.push({
            name: '显卡2-使用率',
            type: 'bar',
            yAxisIndex: 0,
            smooth: true,
            data: series_datas_2_util
          });
        }
        let option = {
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: legend_list
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: category_list
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
