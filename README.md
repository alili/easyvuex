# easy-vuex
easyvuex 是对 vuex 的封装, 简化vuex 的使用。

## 安装
```
npm i @wonderful/easyvuex
```

## 使用
easyvuex 分为两个部分：整体插件引入以及store modules 转换。
在 main.js 文件中，引入 easyvuex，并且绑定 store 和 router
```
import Vue from 'vue'
import VueRouter from 'vue-router'
import router from './router'
import store from './store/store'
import { easyVuex } from '@wonderful/easyvuex'

Vue.use(VueRouter)
Vue.use(easyVuex, {
  store,
  router
})
```
引入 easyVuex 插件后，在任意 vue 实例中，均可使用 state 配置项，用于声明对 getters 的引用，比如：
```
  props: {},
  state: [
    'zoneList',
    'projectList',
    'itemList',
    'taskTypeOptions'
  ],
  data () {
    return {
      ...
    }
  },
  ...
```
在任意 vue 实例中，增加了 do 方法，作为 dispatch 的扩展，拥有向上追溯调用 actions 的机制。
在任意 vuex 实例中，内置了 clone 方法(暂用)

第二部分在每个 modules 中使用，推荐把下面的代码配置为编辑器的 snippet：
```
import { transfer } from '@wonderful/easyvuex'

const state = {}
const getters = {}
const mutations = {}
const actions = {}

const store = transfer({
  state,
  getters,
  actions,
  mutations,
  modules: {}
})

export default store
/* 根文件写做 */
// export default new Vuex.Store(store) 
```
modules需要和路由层级保持一致，推荐各个页面的 store modules 和页面的.vue文件放在同一文件夹下。

## 机制
通过 transfer 函数会对包裹的函数做如下处理:
-  对所有 state 声明同名的 mutations
-  对所有 state 声明同名的 getters
-  所有的 getters 为函数，提供两个参数：
  - state：即 vuex getters 原 state 参数
  - get：函数，可以向上追溯各个层级的 getters
-  actions 增加 pre 方法，pre 方法会首先执行，可用于数据预处理。
-  actions 增加 check 方法，如果 check 返回值为 false，则 actions 提前结束。
-  如果存在 action 方法，则执行，action 方法提供两个参数
  - options：即调用时提供的载荷
  - get：函数，可以向上追溯各个层级的 getters
-  否则如果存在 link 方法，会以 method 方式（get/post），发送 setting 作为参数
  - link 可以是字符串或者函数
  - link 函数提供一个参数
    - options：即调用时提供的载荷
  - setting 可以是对象或者函数
  - setting 函数提供两个参数：
    - context：当前 store 上下文
    - options：即调用时提供的载荷
-  调用 dispose 方法，处理 action 或 link 接口的返回值
  - dispose 函数提供三个参数：
    - {commit, get} 可以向上追溯各个层级的 commit和getters
    - res action 或 link 接口的返回值
    - options：即调用时提供的载荷

## 向上追溯
页面的本质，是一些数据在场景逻辑下的集合，而路由则是页面关系的组织。所以，路由天然就是一种数据集合的拆分。
路由所管理的场景逻辑和组件的复用有所交叉，对于渲染组件来说，它并不关心数据的实际意义，只关心格式即可。但是对于页面级别来说，不同路由下的页面，可能需要使用同样的组件渲染结构相似但内容不同的数据，此时我们可以选择在页面组件和渲染组件之间增加模块组件，作为亚页面级的业务耦合模块来承载数据和逻辑。如果有一种方法可以把语境(路由)加入到，数据的管理中，我们则可以避开这些亚页面级的业务耦合模块。
受semanticUI 和原型链启发，easyvuex 在 getters 和 do(即原dispatch 方法)中，拓展了向上追溯机制。
比如当前路由为：/book/detail?id=123
调用 `this.do('getDetail', {id: this.$route.query.id})`
则 do 方法会首先在名为 '/book/detail'的 namespace 中寻找名为 getDetail 的 actions，如果没有的话，继续寻找 '/book' 空间下是否有 getDetail 方法，如果没有，则在根 store 中寻找，仍然没有的话会抛出错误。
类似的，如果在组件中使用 state:['bookDetail'] 引入 bookDetail 对象，也会按照这个顺序依次寻找对应的三个 store modules 中，是否有相应的 getters。注意，因为 transfer 插件会自动生成和 state 同名的 getters，所以在大多数情况下，只需要关心在哪个层级有名为 bookDetail 的 state 即可。但是也可以人为重写同名 getters 方法覆盖默认方法。
同理，commit 方法也可以被人为覆盖。

所以 easyvuex 所谈论的数据都是自带语境（路由）的，当前语境下没有相关数据，则会自动向高一层级寻找

## 附录
### 使用 vuex 管理前端数据
vuex 使用单一 store 存储数据，可以使用 modules 分 namespace 存储数据。通过 mutations 追踪数据修改，使用 actions 处理异步事务，还有 getters 用以格式化数据。
在对接组件层面，vuex 提供了 mapXXX 系列的辅助工具用以引入数据。

### 数据拆分
现代前端需要管理越来越多的数据，这些数据可能被 store 或者组件持有，组件亦分为不同类型。可以从三个维度来看待数据的拆分。
组件，维度：通常我们会区分业务组件和渲染组件，区别是自身是否持有数据。比如一个表格组件，仅需要渲染传入的 prop 数据，不需要自身持有数据和逻辑，可以认为是渲染组件

