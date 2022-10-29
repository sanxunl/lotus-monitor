import request from '@/utils/request'

export function getMineOneLogList(query) {
  return request({
    url: '/api/minerwinning',
    method: 'get',
    params: query
  })
}
