/**
 * @Author: wangdaohan
 * @Date:   2018-01-15T15:54:07+08:00
 * @Email:  wangdaohan@didichuxing.com
 * @Filename: easyVuex.js
 * @Last modified by:   wangdaohan
 * @Last modified time: 2018-03-30T21:47:08+08:00
 */
import axios from 'axios'
import {
  sync
} from 'vuex-router-sync'

import {
  mapStore,
  pathFormat
} from './utils'

const easyVuex = {}
easyVuex.install = function (Vue, {
  store,
  router,
  axiosDefaults,
  beforeRequest,
  afterResponse
}) {
  sync(store, router)

  axios.defaults.baseURL = axiosDefaults.baseURL

  axios.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    if (beforeRequest && typeof beforeRequest === 'function') {
      return beforeRequest(config)
    } else {
      return config
    }
  }, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error)
  })
  axios.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    if (afterResponse && typeof afterResponse === 'function') {
      return afterResponse(response)
    } else {
      return response
    }
  }, function (error) {
    // 对响应错误做点什么
    return Promise.reject(error)
  })
  Vue.mixin({
    beforeCreate () {
      if (this.$options && this.$options.states) {
        if (!this.$options.computed) {
          this.$options.computed = {}
        }
        this.$options.states.forEach(item => {
          this.$options.computed[item.split('/').pop()] = mapStore(item)
        })
      }
    },
    methods: {
      do (attr, options) {
        let path
        try {
          if (/\//.test(attr)) {
            path = attr.split('/')
            attr = path.pop()
          } else {
            console.log(`this.$route.path:`, this.$route.path)
            path = pathFormat(this.$route.path)
          }
          if (typeof options === 'object') options = Object.assign({}, options)
          return _dispatch(this.$store, path, attr, options)
        } catch (error) {
          console.log(`do error:`, error)
        }
      }
    }
  })
}

function _dispatch (store, path, attr, options) {
  if (!path.length || attr.split('/') > 1) {
    if (!store._actions[attr]) {
      return console.log('has no action:', path, attr, options)
    } else {
      try {
        return store.dispatch(attr, options)
      } catch (error) {
        throw (error)
      }
    }
  }
  if (!store._actions[`${path.join('/')}/${attr}`]) {
    path.pop()
    return _dispatch(store, path, attr, options)
  }
  return store.dispatch(`${path.join('/')}/${attr}`, {
    __path: path,
    __root: store,
    ...options
  })
}
export {
  easyVuex
}
