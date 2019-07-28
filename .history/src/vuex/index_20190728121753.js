let _Vue;
class Store {
    constructor(options) {
        this._options = options;
    }
}

export default install = (vm, options) => {
    _Vue = vm;
    Vue.mixin({
        beforeCreate() {
            this.$store = new Store()
        }
    })
}