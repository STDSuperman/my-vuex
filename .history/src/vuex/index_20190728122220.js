let _Vue;
class Store {
    constructor(options) {
        this._options = options;
    }
}
let install = (vm, options) => {
    _Vue = vm;
    _Vue.mixin({
        beforeCreate() {
            if (this.$parent) {
                this.$store = this.$parent.$store
            } else {
                this.$store = this.$options.$store
            }
        }
    })
}
export default {
    install,
    Store
};