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
            this.$store = new Store()
        }
    })
}
export default {
    install,
    Store
};