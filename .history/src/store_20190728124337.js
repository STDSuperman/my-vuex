import Vue from 'vue'
import Vuex from './vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        a: "啊哈哈"
    },
    getters: {
        chageValue(state, payload) {
            state.a = payload
        }
    },
    mutations: {

    },
    actions: {

    }
})