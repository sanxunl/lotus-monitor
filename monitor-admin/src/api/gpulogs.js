import request from '@/utils/request'

export function getGpuLogList(query) {
  return request({
    url: '/api/gpulogs',
    method: 'get',
    params: query
  })
}
