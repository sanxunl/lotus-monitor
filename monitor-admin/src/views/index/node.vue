<template>
  <div class="page-node">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>CPU</span>
          <el-button class="button" text @click="onBtnCpuTap">更多</el-button>
        </div>
      </template>
      <v-chart class="chart" :option="optionCPU" />
    </el-card>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>内存</span>
          <el-button class="button" text @click="onBtnRamTap">更多</el-button>
        </div>
      </template>
      <v-chart class="chart" :option="optionRam" />
    </el-card>
    <el-card v-if="nodeData.is_miner || nodeData.is_worker" class="box-card">
      <template #header>
        <div class="card-header">
          <span>GPU</span>
          <el-button class="button" text @click="onBtnGpuTap">更多</el-button>
        </div>
      </template>
      <v-chart class="chart" :option="optionGpu" />
    </el-card>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>硬盘</span>
        </div>
      </template>
      <v-chart class="chart" :option="optionHD" />
    </el-card>
    <el-card v-if="nodeData.is_miner" class="box-card">
      <template #header>
        <div class="card-header">
          <span>选举信息</span>
        </div>
      </template>
      <v-chart class="chart" :option="optionMineOne" />
    </el-card>
    <el-card v-if="nodeData.is_miner" class="box-card">
      <template #header>
        <div class="card-header">
          <span>昨日统计</span>
        </div>
      </template>
      <el-descriptions v-if="minerData && minerData.id" class="margin-top" :column="1" size="large" border>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon>
                <Money />
              </el-icon>
              Worker余额
            </div>
          </template>
          {{ minerData.worker_balance }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon>
                <MagicStick />
              </el-icon>
              参与选举次数
            </div>
          </template>
          {{ minerData.mine_one_count }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon>
                <Trophy />
              </el-icon>
              出块数量
            </div>
          </template>
          {{ minerData.win_count }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon>
                <Refresh />
              </el-icon>
              更新时间
            </div>
          </template>
          {{ minerData.dateTime }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无数据" />
    </el-card>
    <dialog-cpu :node-data="nodeData" :dialog-visible="cpuDialogVisible" @close="cpuDialogVisible=false" />
    <dialog-ram :node-data="nodeData" :dialog-visible="ramDialogVisible" @close="ramDialogVisible=false" />
    <dialog-gpu :node-data="nodeData" :dialog-visible="gpuDialogVisible" @close="gpuDialogVisible=false" />
  </div>
</template>
<script>
import { getCpuLogList } from '@/api/cpulogs';
import { getRamLogList } from '@/api/ramlogs';
import { getGpuLogList } from '@/api/gpulogs';
import { getHDData } from '@/api/hdlogs';
import { getMinerLogList } from '@/api/minerinfo';
import { getMineOneLogList } from '@/api/minerwinning';
import moment from 'moment';
import * as echarts from 'echarts';
import dialogCpu from './dialogCpu';
import dialogRam from './dialogRam';
import dialogGpu from './dialogGpu';
import { convert } from '@/utils/unitConvert';

export default {
  components: { dialogCpu, dialogRam, dialogGpu },
  props: {
    nodeData: {
      type: Object,
      default: null
    },
    isShow: {
      type: Boolean,
      default: null
    }
  },
  data() {
    return {
      cpuDialogVisible: false,
      ramDialogVisible: false,
      gpuDialogVisible: false,
      searchForm: {},
      optionCPU: {},
      optionRam: {},
      optionGpu: {},
      optionHD: {},
      minerData: {},
      optionMineOne: {}
    }
  },
  watch: {
    'isShow': function(newVal, oldVal) {
      if (this.isShow && this.nodeData && this.nodeData.id) {
        this.init();
      }
    }
  },
  methods: {
    init() {
      let date = new Date();
      let end = moment(date).format('YYYY-MM-DD HH:mm:ss');
      date.setDate(date.getDate() - 1);
      let start = moment(date).format('YYYY-MM-DD HH:mm:ss');
      this.searchForm = {
        n_id: this.nodeData.id,
        start: start,
        end: end
      }
      this.getCpuList();
      this.getRamList();
      this.getHDData();
      if (this.nodeData.is_miner || this.nodeData.is_worker) {
        this.getGpuList();
      }
      if (this.nodeData.is_miner) {
        this.getMinerList();
        this.getMineOneList();
      }
    },
    getCpuList() {
      getCpuLogList(this.searchForm).then(res => {
        let legend_list = ['us', 'sy']
        let category_list = [];
        let series_map = {};
        for (const i in res) {
          let item = res[i];
          category_list.push(moment(item.created_time).format('YYYY-MM-DD HH:mm'))
          for (const key in item) {
            if (key == 'us' || key == 'sy') {
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
            name: key,
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
                  default:
                    text =  name;
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
        this.optionCPU = option;
      });
    },
    getRamList() {
      getRamLogList(this.searchForm).then(res => {
        let legend_list = ['used']
        let category_list = [];
        let series_datas = [];
        let max = 0;
        for (const i in res) {
          let item = res[i];
          if (i == 0) {
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
        this.optionRam = option;
      });
    },
    getGpuList() {
      getGpuLogList(this.searchForm).then(res => {
        let legend_list = ['显卡1-温度', '显卡1-使用率', '显卡2-温度', '显卡2-使用率', ]
        let category_list = [];
        let series_datas_1_temp = [];
        let series_datas_1_util = [];
        let series_datas_2_temp = [];
        let series_datas_2_util = [];
        for (const i in res) {
          let item = res[i];
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
        this.optionGpu = option;
      });
    },
    getHDData() {
      getHDData(this.nodeData.id).then(res => {
        let use_pct = res['use_pct'] ? res['use_pct'].replace('%', '') : 0;
        let option = {
          series: [{
            type: 'gauge',
            axisLine: {
              lineStyle: {
                width: 12,
                color: [
                  [0.3, '#67e0e3'],
                  [0.7, '#37a2da'],
                  [1, '#fd666d']
                ]
              }
            },
            pointer: {
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              distance: -12,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 1
              }
            },
            splitLine: {
              distance: -12,
              length: 12,
              lineStyle: {
                color: '#fff',
                width: 1
              }
            },
            axisLabel: {
              color: 'auto',
              distance: 20,
              fontSize: 14
            },
            detail: {
              valueAnimation: true,
              formatter: '{value} %',
              color: 'auto'
            },
            data: [{
              value: use_pct
            }]
          }]
        };
        this.optionHD = option;
      });
    },
    getMinerList() {
      getMinerLogList(this.searchForm).then(res => {
        let item = {};
        if (res && res.length > 0) {
          item = res[res.length - 1];
          item.dateTime = moment(item.created_time).format('YYYY-MM-DD HH:mm:ss');
        }
        this.minerData = item;
      });
    },
    getMineOneList() {
      let date = new Date();
      let start = '';
      let end = '';
      if (date.getHours() < 8 || (date.getHours() == 8 && date.getMinutes() < 30)) {
        end = moment(date).format('YYYY-MM-DD 08:29:59');
        date.setDate(date.getDate() - 1);
        start = moment(date).format('YYYY-MM-DD 08:31:00');
      } else {
        start = moment(date).format('YYYY-MM-DD 08:31:00');
        date.setDate(date.getDate() + 1);
        end = moment(date).format('YYYY-MM-DD 08:29:59');
      }
      let params = {
        n_id: this.nodeData.id,
        start: start,
        end: end
      }
      getMineOneLogList(params).then(res => {
        let legend_list = ['累计参与次数']
        let category_list = [];
        let series_datas = [];
        for (const i in res) {
          let item = res[i];
          category_list.push(moment(item.created_time).format('YYYY-MM-DD HH:mm'))
          series_datas.push(item.count_mineone);
        }
        let series = [{
          name: '累计参与次数',
          type: 'line',
          data: series_datas
        }]
        let option = {
          tooltip: {
            trigger: 'axis',
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
            type: 'value'
          },
          series: series
        };
        this.optionMineOne = option;
      });
    },
    onBtnCpuTap() {
      this.cpuDialogVisible = true;
    },
    onBtnRamTap() {
      this.ramDialogVisible = true;
    },
    onBtnGpuTap() {
      this.gpuDialogVisible = true;
    }
  }
}

</script>
<style scoped>
.chart {
  width: 30vw;
  height: 33vh;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-node {
  width: 100%;
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
