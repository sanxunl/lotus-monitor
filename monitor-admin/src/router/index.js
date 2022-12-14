import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    { path: '/', component: () => import('@/views/index/index.vue') }
]
export default createRouter({
    history: createWebHashHistory(),
    routes,
})