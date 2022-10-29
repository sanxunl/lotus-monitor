import request from '@/utils/request'

export function getRamLogList(query) {
  return request({
    url: '/api/ramlogs',
    method: 'get',
    params: query
  })
}
