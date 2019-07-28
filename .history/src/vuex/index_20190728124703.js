let _Vue;
class Store {
    constructor(options) {
        /**借用Vue的双向绑定机制让Vuex中data变化实时更新界面 */
        this.vm = new _Vue({
            data: {
                state: options.state
            }
        })
        /**保存一份到本身实例 */
        this._options = options;
        /**保存getters */
        this.getters = {};
        let getters = this._options.getters || {}
        /**遍历保存传入的getters，监听状态改变重新执行该函数 */
        Object.keys(getters).forEach((getterName) => {
            Object.defineProperty(this.getters, getterName, {
                get: (payload) => {
                    return getters[getterName](this.state, payload)
                }
            })
        })
    }
    get state() {
        return this.vm.state
    }
}
let install = (vm, options) => {
    _Vue = vm;
    _Vue.mixin({
        beforeCreate() {
            if (this.$parent) {
                this.$store = this.$parent.$store
            } else {
                this.$store = this.$options && this.$options.store
            }
        }
    })
}
export default {
    install,
    Store
};