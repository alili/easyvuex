import clone from 'clone'

export const commit = function commit({
  path,
  root
} = {}, attr, options) {
  path = pathFormat(path)

  try {
    while (path.length) {
      if (root._mutations[getPath(path, attr)] !== undefined) {
        root.commit(getPath(path, attr), options)
        return root.getters ? root.getters[getPath(path, attr)] : options
      } else {
        path.pop()
      }
    }
    root.commit(attr, options)
    return root.getters ? root.getters[getPath(path, attr)] : options
  } catch (error) {
    console.log(error)
  }
}

export const get = function get({
  path,
  root
} = {}, attr) {
  path = pathFormat(path)

  while (path.length) {
    if (root.getters[getPath(path, attr)] !== undefined) {
      return root.getters[getPath(path, attr)]
    } else {
      path.pop()
    }
  }
  return root.getters[attr]
}

export const mapStore = function mapStore(item) {
  return {
    get: function () {
      let options = {
        root: this.$store,
        path: this.$route.path
      }
      return get(options, item)
    },
    set: function (val) {
      let options = {
        root: this.$store,
        path: this.$route.path
      }
      if (JSON.stringify(val) === JSON.stringify(get(options, item))) return
      return commit(options, item, clone(val, false))
    }
  }
}

export const pathFormat = function pathFormat(path) {
  let result = path.substring(1)
    .split('/')
  if (result.length === 1 && result[0] === '') {
    return []
  } else {
    return result
  }
}

export const getPath = function getPath(path, attr) {
  if (path.length) {
    return `${path.join('/')}/${attr}`
  } else {
    return attr
  }
}
