<template>
  <el-dialog title="内存" v-model="dialogVisible" width="90vw" top="5vh" destroy-on-close append-to-body @open="open" @close="close">
    <el-form :model="searchForm" :inline="true">
      <el-form-item label="日期">
        <el-date-picker v-model="searchForm.date" type="daterange" unlink-panels range-separator="To" start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" format="YYYY-MM-DD" value-format="YYYY-MM-DD" :clearable="false" @change="getList" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">查询</el-button>
      </el-form-item>
    </el-form>
    <v-chart  v-loading="loading" class="chart" :option="option" />
    <el-table  v-loading="loading" :data="dataList" height="36vh">
      <el-table-column property="dateTime" label="时间" />
      <el-table-column property="total_text" label="total" />
      <el-table-column property="used_text" label="used" />
      <el-table-column property="free_text" label="free" />
      <el-table-column property="shared_text" label="shared" />
      <el-table-column property="cache_text" label="cache" />
      <el-table-column property="available_text" label="available" />
    </el-table>
  </el-dialog>
</template>
<script>
import * as echarts from 'echarts';
import moment from 'moment';
import { getRamLogList } from '@/api/ramlogs';
import { convert } from '@/utils/unitConvert';

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
      getRamLogList(params).then(res => {
        let legend_list = ['used']
        let category_list = [];
        let series_datas = [];
        let max = 0;
        for (const i in res) {
          let item = res[i];
          item.dateTime = moment(item.created_time).format('YYYY-MM-DD HH:mm:ss');
          item.total_text = convert(item.total);
          item.used_text = convert(item.used);
          item.free_text = convert(item.free);
          item.shared_text = convert(item.shared);
          item.cache_text = convert(item.cache);
          item.available_text = convert(item.available);

          if(i == 0) {
            max = item.total;
          }
          category_list.push(moment(item.created_time).format('YYYY-MM-DD HH:mm'))
          series_datas.push(item.used);
        }
        let series = [{
          name: 'used',
          type: 'line',
          stack: 'Total',
          smooth: true,
          data: series_datas
        }]
        let option = {
          tooltip: {
            trigger: 'axis',
            valueFormatter: (value) => convert(value)
          },
          legend: {
            data: legend_list
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: category_list
          },
          yAxis: {
            type: 'value',
            max: max,
            axisLabel: {
              formatter: function(value, index) {
                return convert(value, 0);
              }
            }
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
