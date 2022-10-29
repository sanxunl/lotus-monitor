import request from '@/utils/request'

export function getCpuLogList(query) {
  return request({
    url: '/api/cpulogs',
    method: 'get',
    params: query
  })
}
