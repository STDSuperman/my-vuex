let _Vue;
/**简化代码，封装遍历方法 */
const forEach = (obj, callback) => {
    Object.keys(obj).forEach((key) => {
        callback(key, obj[key])
    })
}

class ModuleCollection {
    constructor(rootModule) {
        this.register([], rootModule)
    }
    register(path, rootModule) {
        let newModule = {
            _raw: rootModule,
            _children: rootModule.modules,
            state: rootModule.state
        }

        if (path.length == 0) {
            this.root = newModule;
        } else {
            let parent = path.slice(0, -1).reduce((pre, cur) => {
                return pre._children[cur]
            }, this.root)
            parent._children[path[path.length - 1]] = newModule;
        }

        if (rootModule.modules) {
            forEach(rootModule.modules, (moduleName, value) => {
                this.register(path.concat(moduleName), value)
            })
        }
    }
}

/**安装模块 */
const installModule = (store, state, path, rootModule) => {
    if (path.length > 0) {
        let parent = path.slice(0, -1).reduce((pre, cur) => {
            return pre[cur]
        }, store.state)
        /**利用Vue set方法实现数据绑定 */
        _Vue.set(parent, path[path.length - 1], rootModule.state)
    }

    let getters = rootModule._raw.getters;
    if (getters) {
        forEach(getters, (getterName, fn) => {
            Object.defineProperty(store.getters, getterName, {
                get() {
                    return fn(state)
                }
            })
        })
    }

    let mutations = rootModule._raw.mutations;
    if (mutations) {
        forEach(mutations, (mutationName, fn) => {
            store.mutations[mutationName] || (store.mutations[mutationName] = []);
            store.mutations[mutationName].push((payload) => {
                fn(state, payload)
            })
        })
    }

    let actions = rootModule._raw.actions;
    if (actions) {
        forEach(actions, (actionName, fn) => {
            store.actions[actionName] || (store.actions[actionName] = []);
            store.actions[actionName].push((payload) => {
                fn(store, payload)
            })
        })
    }

    if (rootModule._children) {
        forEach(rootModule._children, (moduleName, module) => {
            installModule(store, module.state, path.concat(moduleName), module)
        })
    }
}

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
        this.mutations = {};
        this.actions = {};

        /**格式化用户传入的数据 */
        this.modules = new ModuleCollection(this._options)
        installModule(this, this.state, [], this.modules.root)
        console.log(this)
        // let getters = this._options.getters || {}
        /**遍历保存传入的getters，监听状态改变重新执行该函数 */
        // forEach(getters, (getterName, fn) => {
        //     Object.defineProperty(this.getters, getterName, {
        //         get: () => {
        //             return fn(this.state)
        //         }
        //     })
        // })

        /**保存mutations */
        // this.mutations = {};
        // let mutations = this._options.mutations || {};
        // forEach(mutations, (mutationName, fn) => {
        //     this.mutations[mutationName] = (payload) => {
        //         return fn(this.state, payload)
        //     }
        // })
        // this.actions = {};
        /**保存actions */
        // 
        // let actions = this._options.actions || {};
        // forEach(actions, (actionName, fn) => {
        //     this.actions[actionName] = (payload) => {
        //         return fn(this, payload)
        //     }
        // })
    }
    get state() {
        return this.vm.state
    }
    commit = (type, payload) => {
        this.mutations[type].forEach(fn => fn(payload));
    }
    dispatch = (type, payload) => {
        this.actions[type].forEach(fn => fn(payload));
    }
}
const install = (vm, options) => {
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