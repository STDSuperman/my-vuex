import Vue from 'vue'
import Vuex from './vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        a: {
            state: {
                age: 10
            },
            modules: {
                c: {
                    state: {
                        h: 10
                    },
                    getters: {
                        test() {

                        }
                    },
                    actions: {
                        bb() {

                        }
                    }
                }
            }
        }

    },
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
            state.a += payload
        }
    },
    actions: {
        decrement({
            commit
        }, payload) {
            setTimeout(function () {
                commit("increment", payload)
            }, 1000)
        }
    }
})