import request from '@/utils/request'

export function getHDLogList(query) {
  return request({
    url: '/api/hdlogs',
    method: 'get',
    params: query
  })
}

export function getHDData(id) {
  return request({
    url: '/api/hdlogs/' + id,
    method: 'get'
  })
}