import request from '@/utils/request'

export function getNodeList() {
  return request({
    url: '/api/nodeinfo',
    method: 'get'
  })
}
