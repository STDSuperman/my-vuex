import Vue from 'vue'
import Vuex from './vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        a: 0,
        b: "占山"
    },
    getters: {
        getB(state) {
            return state.b;
        }
    },
    mutations: {
        increment(state, payload) {
            console.log(payload)
            state.a += payload
        }
    },
    actions: {

    }
})