import { createRouter, createWebHistory } from 'vue-router'
import PoudlardView from '../views/PoudlardView.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: PoudlardView,
    },
    {
        path: '/poudlard',
        name: 'Poudlard',
        component: PoudlardView,
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
