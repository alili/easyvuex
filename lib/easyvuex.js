/**
 * @Author: wangdaohan
 * @Date:   2018-01-15T15:54:07+08:00
 * @Email:  wangdaohan@didichuxing.com
 * @Filename: easyVuex.js
 * @Last modified by:   wangdaohan
 * @Last modified time: 2018-03-30T21:47:08+08:00
 */
import axios from 'axios'
import { sync } from 'vuex-router-sync'

import {
  mapStore,
  pathFormat
} from './utils'

const easyVuex = {}
easyVuex.install = function (Vue, { store, router, base, header, beforeRequest }) {
  sync(store, router)

  axios.defaults.baseURL = base || ''
  axios.defaults.headers = header || ''

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

  Vue.mixin({
    beforeCreate () {
      if (this.$options && this.$options.state) {
        if (!this.$options.computed) {
          this.$options.computed = {}
        }
        this.$options.state.forEach(item => {
          this.$options.computed[item] = mapStore(item)
        })
      }
    },
    methods: {
      do (attr, options) {
        let path = pathFormat(this.$route.path)
        if (typeof options === 'object') options = Object.assign({}, options)
        return _dispatch(this.$store, path, attr, options)
      },
      clone (obj) {
        return JSON.parse(JSON.stringify(obj))
      }
    }
  })
}

function _dispatch (store, path, attr, options) {
  if (!path.length || attr.split('/') > 1) {
    if (!store._actions[attr]) {
      return console.log('has no action:', path, attr, options)
    } else {
      return store.dispatch(attr, options)
    }
  }
  if (!store._actions[`${path.join('/')}/${attr}`]) {
    path.pop()
    return _dispatch(store, path, attr, options)
  }
  return store.dispatch(`${path.join('/')}/${attr}`, options)
}
export { easyVuex }
