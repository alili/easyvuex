/**
 * @Author: wangdaohan
 * @Date:   2018-01-15T15:54:07+08:00
 * @Email:  wangdaohan@didichuxing.com
 * @Filename: easyVuex.js
 * @Last modified by:   wangdaohan
 * @Last modified time: 2018-03-30T21:47:08+08:00
 */
import { sync } from 'vuex-router-sync'

import {
  mapStore,
  pathFormat
} from './utils'

const easyVuex = {}
easyVuex.install = function (Vue, {store, router}) {
  sync(store, router)

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
  if (!path.length) {
    if (!store._actions[attr]) {
      return console.log('has no action:', path, attr, options)
    } else {
      return store.dispatch(attr, {
        ...options,
        $store: store,
        $path: path
      })
    }
  }
  if (!store._actions[`${path.join('/')}/${attr}`]) {
    path.pop()
    return _dispatch(store, path, attr, options)
  }
  return store.dispatch(`${path.join('/')}/${attr}`, options)
}
export default easyVuex
