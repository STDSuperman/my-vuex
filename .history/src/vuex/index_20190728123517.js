let _Vue;
class Store {
    constructor(options) {
        this.vm = new _Vue({
            data: {
                state: options.state
            }
        })
        this._options = options;
    }
    get state() {
        return this.vm.state
    }
    get getters() {
        return this._options.getters
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