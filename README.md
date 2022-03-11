
## 前言

> 9012 年了，牛客的面经看的笔者由衷得觉得，这年头，没看过源码，估计都不敢说自己是前端攻城狮了吧，再不折腾一下，估计连切图都要轮不上了。虽然说安心做个切图仔还是挺快乐的，不过说实在的，没有梦想的切图仔，和咸鱼有什么分别。

今天笔者要讨论的就是如何实现一个缩小版的`Vuex`，本篇先大家熟悉一下他的内部结构大概是什么样的以及实现一个自己的`state`、`getters`、`mutations`、`actions`，`modules`部分笔者将在下一篇文章中进行介绍。

## 准备工作

用了这么久`Vuex`了，我们不妨大胆的想象几个问题：

- 我们是怎么在每个`Vue`实例上都能拿到`$store`，它的实现原理是什么。
- `Vuex` 怎么实现和`Vue`一样，数据改变，界面自动更新。
- `getters`与`mutations`、`actions`有什么不同，怎么实现。
- `mutations`与`actions`有什么不同，应用场景的区别，为什么。

接下来，我们将从这几个问题开始，揭开`Vuex`的神秘面纱

## Vuex 解析

> Vuex 试探之旅，你值得拥(fang)有(qi)。

> 友情提醒，下面的代码不能直接用，只是笔者截取了片段用于理解，文末会贴上完整代码。

因为本篇不涉及`modules`，所以文中`getters`、`mutations`、`actions`实现将会和源码有一些的出入，不过，原理是一样的。

### 如何给每个实例注入\$store

如果大家有自己注册导入过`Vuex`，那么相信大家对这样的过程自然是了然于心：

- 先驾轻就熟的`import Vuex from 'vue'`
- 然后面无表情的`Vue.use(Vuex)`
- 接着略带得意的`const store=new Vuex.Store({...})`
- 最后如释重负的在`new Vue`的地方放上`store`

我们从第二个步骤开始研究。

> 至于那些问`import`怎么用的大哥我只能默默地说一句，9012 年了，没接触过`es6`你是怎么学完`Vue.js`的。

顾名思义，`use`就是用的意思，这其实就涉及到`Vue`的这一个插件安装机制了，它会默认去找需要安装的模块的`install`方法，然后把`Vue`以及其他参数传入你的`install`方法，然后呢，我们就可以在这一步上动点手脚了。

话不多说，看（代）码：

```javascript
let _Vue;
const install = (vm, options) => {
  _Vue = vm;
  _Vue.mixin({
    beforeCreate() {
      if (this.$parent) {
        this.$store = this.$parent.$store;
      } else {
        this.$store = this.$options && this.$options.store;
      }
    }
  });
};

export default { install };
```

首先我们会先把`Vue`保存一下，留待他用（管他待会用不用，先留着）。然后接下来就是我们上面提出的第一个问题怎么实现的答案了，使用`Vue`内部的`mixin`方法，给每个实例混入一个钩子函数。

> 什么是混入，这里假装大家都知不道，稍微介绍一下。以上面代码为例，差不多就是给每个实例都添加一个`beforeCreate`方法，它不会覆盖原有的钩子函数，而是会一起执行。

然后我们可以先判断是否是子组件，如果是就拿到它父组件的`$store`赋值给当前子组件的`store`上，如果不是子组件，就可以从`$options`上拿到`$store`，这样一来，所有`Vue`实例就都有了`$store`属性了。

### state 实现

> 其实说白了，`state`不就是一个储存一些属性的对象而已，换了张脸我还是认识你王麻子。

上(代)码：

```javascript
class Store {
  constructor(options) {
    /**保存一份到本身实例 */
    this._options = options;
  }
  get state() {
    return this._options.state;
  }
}
```

劫持一下获取方式，实际上就是在访问你传进来的对象。当然，如果只是这么写还是有点问题的，它没法根据数据改变来自动让界面更新。

### 数据改变如何更新界面

> 其实这个问题真挺好解决的，笔者在问题中都已经提醒你了，不信你回去再看看

我们借用`Vue`实例具有数据界面绑定的特性，于是我们给`state`稍微包装一下就可以实现我们要的效果了。

```javascript
/**借用Vue的双向绑定机制让Vuex中data变化实时更新界面 */
this.vm = new _Vue({
  data: {
    state: options.state
  }
});
```

然后再修改一下对应的`get`方法

```javascript
get state() {
        return this.vm.state
    }
```

### getters 实现

其实从用法上看，`getters`用法和我们的`computed`真挺像的。从表现形式上看，它其实根本上就是个函数，只不过人家内部代替你执行了。

```javascript
/**简化代码，封装遍历方法 */
const forEach = (obj, callback) => {
  Object.keys(obj).forEach(key => {
    callback(key, obj[key]);
  });
};
/**保存getters */
this.getters = {};
let getters = this._options.getters || {};
/**遍历保存传入的getters，监听状态改变重新执行该函数 */
forEach(getters, (getterName, fn) => {
  Object.defineProperty(this.getters, getterName, {
    get: () => {
      return fn(this.state);
    }
  });
});
```

这里我们遍历了用户传入的`getters`对象，然后把拿到的属性名写入到实例的`getters`对象上，并绑定了对应的`get`方法。这个地方我们用上了我们熟悉的属性劫持来控制怎么给用户返回我们想给他的值。

同时，因为`getter`中的第一个参数是`state`对象，所以我们在执行`get`方法的时候会把`state`作为参数传入执行，并返回函数执行结果给用户。

> 似乎实现起来并不怎么难看懂，估计部分小伙伴会想，这货该不会在讹我吧，怎么可能这么简单。

### mutations 实现

其实吧，笔者觉得`mutations`这个东东有点像我们用过的`methods`对象，同样是一个对象上绑定了很多函数，只不过用法上面看上去似乎不太一样，我们一般都是使用`commit`方法来调用一个`mutation`函数，然后传入两个参数`state、payload`。

看到这个`payload`,就会有小伙伴问了，啥是`payload`啊？官方文档称之为载荷，名字挺高大上的哈，其实就是接收用户传入的参数。

来看看笔者的实现吧。

```javascript
/**保存mutations */\
    constructor(options) {
        this.mutations = {};
        let mutations = this._options.mutations || {};
        forEach(mutations, (mutationName, fn) => {
            this.mutations[mutationName] = (payload) => {
                return fn(this.state, payload)
            }
        })
    }
    ...
    commit = (type, payload) => {
        this.mutations[type](payload);
    }
```

先把用户传入的`mutations`对象的属性和方法保存到`Vuex`实例上，然后让用户调用`commit`方法的时候来指向对应的函数，并把`state`和`payload`传入。

乍一看，似乎和`getters`实现差不太多，只不过这里没用到属性劫持了，而是给你包装了一下调用方式。（反正笔者是这么理解的）

### actions 实现

对于这个家伙的用途，相信部分小伙伴也能轻松的说出，是的，官方推荐一般的应用场景就是处理一些异步事件，而`mutations`一般用于处理同步事件。下面贴上官方的一张概念图你就能理解了。

![](https://user-gold-cdn.xitu.io/2019/7/23/16c1f442bb99b6ac?w=701&h=551&f=png&s=8112)

> 这时候又有小伙伴要说了，我用`mutations`一样的可以实现啊。是的，用`mutations`当然也行，不过只是不符合`Vuex`的设计理念而已。

如果对于一些异步事件使用`mutations`会出现`devtools`无法捕获到这个事件的记录，所以我们最好还是走走寻常路，跟着官方走吧。

```javascript
/**保存actions */
    constructor(options) {
        this.actions = {};
        let actions = this._options.actions || {};
        forEach(actions, (actionName, fn) => {
            this.actions[actionName] = (payload) => {
                return fn(this, payload)
            }
        })
    }
    ...
    dispatch = (type, payload) => {
        this.actions[type](payload)
    }
```

它实现起来还是挺像`mutations`的（毕竟两个好基友嘛），他们从代码层次上看差不太多，只是在传参方面和调用方法方面有点差异，一个用`commit`，参数是`state,payload`；一个是`dispatch`，传参是一个`Vuex`实例(实际上并不是的，因为涉及到`modules`，下文将会讲到)。

具体代码实现和`mutations`差不多，笔者这就不多啰嗦了，不过在这里笔者还是要提醒一下，因为一般来说我们在使用`actions`的时候都是用的解构，获取`commit`，以及一些其他参数，所以我们在这里需要注意下`this`指向的问题，笔者这里用的是箭头函数来解决了这个问题。

### 完整代码

```javascript
let _Vue;
/**简化代码，封装遍历方法 */
const forEach = (obj, callback) => {
  Object.keys(obj).forEach(key => {
    callback(key, obj[key]);
  });
};
class Store {
  constructor(options) {
    /**借用Vue的双向绑定机制让Vuex中data变化实时更新界面 */
    this.vm = new _Vue({
      data: {
        state: options.state
      }
    });
    /**保存一份到本身实例 */
    this._options = options;
    /**保存getters */
    this.getters = {};
    let getters = this._options.getters || {};
    /**遍历保存传入的getters，监听状态改变重新执行该函数 */
    forEach(getters, (getterName, fn) => {
      Object.defineProperty(this.getters, getterName, {
        get: () => {
          return fn(this.state);
        }
      });
    });

    /**保存mutations */
    this.mutations = {};
    let mutations = this._options.mutations || {};
    forEach(mutations, (mutationName, fn) => {
      this.mutations[mutationName] = payload => {
        return fn(this.state, payload);
      };
    });

    /**保存actions */
    this.actions = {};
    let actions = this._options.actions || {};
    forEach(actions, (actionName, fn) => {
      this.actions[actionName] = payload => {
        return fn(this, payload);
      };
    });
  }
  get state() {
    return this.vm.state;
  }
  commit = (type, payload) => {
    this.mutations[type](payload);
  };
  dispatch = (type, payload) => {
    this.actions[type](payload);
  };
}
const install = (vm, options) => {
  _Vue = vm;
  _Vue.mixin({
    beforeCreate() {
      if (this.$parent) {
        this.$store = this.$parent.$store;
      } else {
        this.$store = this.$options && this.$options.store;
      }
    }
  });
};
export default {
  install,
  Store
};
```

> 修行不易，前端的世界总是日新月异，要跟上它的步伐还是要多折腾折腾。

今天笔者就暂时说到这了，小伙伴觉得有帮助的话就给笔者点个赞呗。

贴上笔者个人网站地址:
[烟雨的个人博客](https://xiaohanglin.site)

源码 github 地址：[my_vuex](https://github.com/STDSuperman/my-vuex)
