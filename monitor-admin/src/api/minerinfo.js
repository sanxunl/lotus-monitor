import request from '@/utils/request'

export function getMinerLogList(query) {
  return request({
    url: '/api/minerinfo',
    method: 'get',
    params: query
  })
}
