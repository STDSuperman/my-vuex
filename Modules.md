
![](https://user-gold-cdn.xitu.io/2019/7/28/16c37712796845af?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

## 前言
通过笔者上篇文章的介绍，相信大家对`Vuex`的基本实现逻辑应该有了一个大概的了解，今天笔者想要介绍的呢就是这一个`Vuex`的`modules`部分。

这个时候就有人问了，`modules`部分为啥不和上文一起介绍完呢？其实当时笔者也有想过一篇文章把`Vuex`的`state`、`getters`、`mutations`、`actions`以及今天的重点`modules`一起捋一遍，不过考虑到加上`modules`之后，会对`Vuex`基本结构部分也就是`state|getters...`的具体原理实现部分产生理解上的影响，于是呢，笔者就把`modules`部分单独抽出来给大家分析一遍，至于为什么会有一定影响，请看下文分解😀。

## Vuex源码分析之 modules
由于使用单一状态树，应用的所有状态会集中到一个比较大的对象。当应用变得非常复杂时，`store` 对象就有可能变得相当臃肿。

为了解决以上问题，`Vuex` 允许我们将 `store` 分割成模块`（module）`。每个模块拥有自己的 `state、mutation、action、getter`，甚至是嵌套子模块——从上至下进行同样方式的分割。

> 具体关于`modules`在`Vuex`中的用法以及应用场景在官方文档中发已经介绍的比较清晰了，笔者在这就不详述了，今天我们的重点还是来研究研究它的具体实现。

### ModuleCollection
在`Vuex`中，有这样的一个类专门用于格式化用户传入的参数对象，使其变成我们方便操作的结构，顾名思义就是模块收集，下面我们将详细介绍它的实现方法。

> 其实从这个地方开始，我们的构造函数内部已经产生了比较大的变化，对`state|getters...`的处理也没有那么简单的只有一层结构了。


```javascript
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
```
为了形成对比，笔者这里把上节的代码注释掉放在下面作为比较，细心的小伙伴应该能发现这个构造函数的内部已经被分化成两个主要模块，一个是模块收集，一个就是模块安装，这里我们先介绍一下这个`ModuleCollection`类。

比如我们一般会传入这样的`Store`参数：

```javascript
{
    state:{},
    getters:{},
    modules:{
        a:{
            state:{
                test:""
            },
            modules:{
                c:{
                    state:{},
                    modules:...
                }
            }
        }
    }
    }
}
```
上面这种结构就是典型的带模块化的结构，我们一般在获取模块中的值的时候是这样的：`this.$store.state.a.test`，那么为了能实现这种取值方式，下面的模块收集格式化就变得十分重要了。

其实下面这个部分可以理解成三部分：
* 先形成模板对象
* 然后将它挂载到对应的层级上
* 最后查询是否还有子模块，如果有就递归继续重复上述步骤。

```javascript
class ModuleCollection {
    constructor(rootModule) {
        this.register([], rootModule)
    }
    register(path, rootModule) {
        /*改造结构为我们的目标对象*/
        let newModule = {
            _raw: rootModule,
            _children: rootModule.modules,
            state: rootModule.state
        }
        
        /*挂载对象*/
        if (path.length == 0) {
            this.root = newModule;
        } else {
            let parent = path.slice(0, -1).reduce((pre, cur) => {
                return pre._children[cur]
            }, this.root)
            parent._children[path[path.length - 1]] = newModule;
        }
        
        /*递归查询*/
        if (rootModule.modules) {
            forEach(rootModule.modules, (moduleName, value) => {
                this.register(path.concat(moduleName), value)
            })
        }
    }
}
```
> 注：上面的`forEach`函数在上文已经有介绍，这里就不继续介绍了。

其实这个部分核心的思想就是递归查找所有的层级的`modules`，然后全部格式化我们想要的结构，下面我们一步步分析这个代码结构。

```javascript
let newModule = {
    _raw: rootModule,
    _children: rootModule.modules,
    state: rootModule.state
}
```

首先我们在开头给出了这样一个模板对象，也就是我们希望格式化后的对象中每个层级应该是这样的结构。`_raw`对象保留了当前层级模块的引用，`_children`属性保存了当前层级下的`modules`对象的引用，然后我们额外保留了一个属性`state`,方便我们后续的操作。

> 我们需要明确一点就是,`Vuex`的机制是，如果你没有设置`namespaced:true`，那么你的`state|mutations...`都会被挂载到根节点上。

然后再往下看：


```javascript
if (path.length == 0) {
    this.root = newModule;
} else {
    let parent = path.slice(0, -1).reduce((pre, cur) => {
        return pre._children[cur]
    }, this.root)
    parent._children[path[path.length - 1]] = newModule;
}
```
> 其实这个地方不太好理解，我们可以这么去看这个部分，比如`a.b.c`,我们可以先取出前面两层，也就是`a.b`，然后再将`c`定义到这个对象上去。这个部分利用的是`reduce`能返回前一项的计算结果的特性加以实现我们想要的效果。

这个部分其实主要的目的就是如果是根模块就直接挂载到`root`上，否则就是子模块。最后进行子模块查询，递归依次挂载并形成我们想要的结构。

> 这个部分其实有点晦涩的地方应该就是那个中间`reduce`部分了，其他应该理解起来还好...吧😂。

### installModule

> 格式化完了，自然就是需要进行我们最重要的一步啦，挂载这个对象🧐。

首先我们也是先捋一遍思路：
* 挂载`state|getters|mutations|actions`
* 查询是否还有子模块，如果有，递归并将各项属性都定义到根模块相应的`state...`上去。

#### 挂载getters


```javascript
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
```


这里的`rootModule`指的就是当前层级的模块对象，先获取当前级有没有`getters`,如果有就挂载到根模块上。

#### 挂载mutations、actions
> 为什么要把这两个放在一起讲呢，额这个，因为他们的实现部分真差不多😅。
这里我们也需要明确一点`Vuex`的机制，如果有同名的`mutaitions`或者`actions`他们会依次执行，所以保存他们的应该是一个数组。

```javascript
/*motations部分*/
let mutations = rootModule._raw.mutations;
if (mutations) {
    forEach(mutations, (mutationName, fn) => {
        store.mutations[mutationName] || (store.mutations[mutationName] = []);
        store.mutations[mutationName].push((payload) => {
            fn(state, payload)
        })
    })
}
/*actions部分*/
let actions = rootModule._raw.actions;
if (actions) {
    forEach(actions, (actionName, fn) => {
        store.actions[actionName] || (store.actions[actionName] = []);
        store.actions[actionName].push((payload) => {
            fn(store, payload)
        })
    })
}
```

首先我们会在根模块上找是否已经有了保存当前函数的数组对象，如果有就直接拿出来，没有就初始化一个空对象，也就是同名函数都将保存到当前数组中等待调用。

这个时候假设我们能看到这样一个根模块上的结构：

```javascript
{
    getters:{},
    state:{},
    mutations:{
        a:[fn1,fn2...]
    },
    actions:{
        b:[fn1,fn2...]
    }
}
```
然后我们的`commit|dispatch`方法也要相应的修改一下啦。

```javascript
commit = (type, payload) => {
    this.mutations[type].forEach(fn => fn(payload));
}
dispatch = (type, payload) => {
    this.actions[type].forEach(fn => fn(payload));
}
```
这里就不能单独的调用了，而是要遍历调用。

#### 查找子模块，递归执行以上步骤
这个其实原理也是比较简单的：

```javascript
if (rootModule._children) {
    forEach(rootModule._children, (moduleName, module) => {
        installModule(store, module.state, path.concat(moduleName), module)
    })
}
```

其实就是遍历出子模块的每个`state|gettes|...`。

#### 挂载state
这里可能又有小伙伴要问了，为啥把这个写在最后呢？咳咳，好吧，这个可能相对来说会复杂一点点，也是考虑到`a.b.c`这种模块之间的层级问题，所以呢，我们又需要用到`reduce`来进行嵌套定义。

```javascript
if (path.length > 0) {
    let parent = path.slice(0, -1).reduce((pre, cur) => {
        return pre[cur]
    }, store.state)
    /**利用Vue set方法实现数据绑定 */
    _Vue.set(parent, path[path.length - 1], rootModule.state)
}

```
> 这里其实也是和上面差不多的，这个`path`是一个数组，最后一位元素代表当前模块对象，所以我们需要用前面的参数找到它的父级，然后再把它定义到它对应的层级位置。


最后贴上`installModule`的全部代码:

```javascript
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
```

### 全部源码

```javascript
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
```

> 说了这么多，虽然有些地方的确有点晦涩隘口，不过笔者还是相信聪明的你们还是能理解的😂。当然，如果觉得本文对你还有点帮助的，就请给笔者点个赞吧。如果发现文中有不正确的地方，请猛戳笔者。

最后贴上笔者的个人网站：[烟雨的个人博客](https://xhlqrn.xyz)