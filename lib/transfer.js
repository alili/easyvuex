import axios from 'axios'
import {
  commit,
  get
} from './utils'

const transfer = function transfer (store) {
  let mutations = {}
  let getters = {}
  let actions = {}
  let state = {
    ...store.state
  }

  for (let item in state) {
    mutations[item] = function (_state, data) {
      _state[item] = data
    }
    getters[item] = function (_state) {
      return _state[item]
    }
  }
  for (let item in store.getters) {
    getters[item] = function (state, getters, rootstate) {
      return store.getters[item].bind(
        undefined,
        state,
        get.bind({
          path: rootstate.route.path,
          root: {
            getters
          }
        })
      )()
    }
  }
  for (let item in store.actions) {
    actions[item] = async function (context, options) {
      let root = options && options.$root || this
      let path = options && options.$path || this.state.route.path
      
      let _commit = commit.bind(this, {
        root,
        path,
      })
      let _get = get.bind(this, {
        root,
        path,
      })

      delete(options.$root)
      delete(options.$path)

      let actionRes = null
      let res = null
      let method = store.actions[item].method || (options && options.method) || 'get'
      if (!options) options = {}
      // 如果 pre 存在, 则直接执行 pre
      if (store.actions[item].pre && typeof store.actions[item].pre === 'function') {
        actionRes = await store.actions[item].pre(context, options)
      }
      // 如果 check 不存在, 或 check 存在, 且结果为true, 则执行
      if (!store.actions[item].check || (store.actions[item].check && !!store.actions[item].check.call(this, context, options))) {
        try {
          if (store.actions[item].action && typeof store.actions[item].action === 'function') {
            res = await store.actions[item].action(options, {
              commit: _commit,
              get: _get
            })
          } else if (store.actions[item].link) {
            let link = store.actions[item].link
            if (typeof link === 'function') {
              link = await link(options)
            }
            res = await axios({
              method,
              url: link,
              json: true,
              headers: store.actions[item].headers && 
                (typeof store.actions[item].headers === 'function' ? store.actions[item].headers(options, _get) : store.actions[item].headers),
              [method === 'post' ? 'data' : 'params']: store.actions[item].setting ? store.actions[item].setting(context, options) : options
            })
            if (res && res.data) {
              res = res.data
            }
          }
        } catch (err) {
          console.error(`${item} error:`, err)
          throw (err)
        }
        // 执行请求后的回调函数
        if (options.dispose) { // 存在配置的回调, 则执行回调(不推荐使用异步方法)
          if (Object.prototype.toString.call(options.dispose) === '[object AsyncFunction]') {
            let disposeRes = await options.dispose.call(this, {
              commit: _commit,
              get: _get
            }, res, options)
            return disposeRes
          } else {
            return options.dispose.call(this, {
              commit: _commit,
              get: _get
            }, res, options)
          }
        } else if (store.actions[item].dispose) { // 存在预设的回调, 则执行回调
          return store.actions[item].dispose.call(this, {
            commit: _commit,
            get: _get
          }, res, options)
        }
      }
      return res || actionRes // 返回请求的结果
    }
  }
  return {
    namespaced: true,
    state,
    mutations: {
      ...mutations,
      ...store.mutations
    },
    getters,
    actions,
    modules: {
      ...store.modules
    }
  }
}

export { transfer }
