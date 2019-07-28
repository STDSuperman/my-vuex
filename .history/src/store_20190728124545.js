import Vue from 'vue'
import Vuex from './vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        a: "啊哈哈",
        b: "占山"
    },
    getters: {
        getB(state, payload) {
            return state.b;
        }
    },
    mutations: {

    },
    actions: {

    }
})