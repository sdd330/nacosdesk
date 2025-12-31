/**
 * URL 参数管理工具
 * 参考 console-ui/src/globalLib.js
 * 支持 hash、href、parent.hash 参数获取
 */

/**
 * 获取 URL 参数
 * 优先级：hash > href > parent.hash
 */
export function getParams(name: string): string | null {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i')
  let result: string[] = []

  // 优先判别 hash
  if (window.location.hash !== '') {
    result = window.location.hash.split('?')
  } else {
    result = window.location.href.split('?')
  }

  // 如果当前窗口没有参数，尝试从父窗口获取
  if (result.length === 1 && window.parent) {
    result = window.parent.location.hash.split('?')
  }

  if (result.length > 1) {
    const r = result[1].match(reg)
    if (r != null) {
      return decodeURIComponent(r[2])
    }
  }

  return null
}

/**
 * 设置 URL 参数
 * @param name 参数名（字符串）或参数对象
 * @param value 参数值（当 name 为字符串时）
 */
export function setParams(
  name: string | Record<string, string>,
  value?: string
): void {
  if (!name) {
    return
  }

  let obj: Record<string, string> = {}
  if (typeof name === 'string') {
    obj = {
      [name]: value || '',
    }
  } else if (Object.prototype.toString.call(name) === '[object Object]') {
    obj = name
  }

  const originHref = window.location.href.split('#')[0]
  let hashArr: string[] = []

  if (window.location.hash) {
    hashArr = window.location.hash.split('?')
  }

  const paramArr = (hashArr[1] && hashArr[1].split('&')) || []

  let paramObj: Record<string, string> = {}
  paramArr.forEach((val) => {
    const tmpArr = val.split('=')
    paramObj[tmpArr[0]] = decodeURIComponent(tmpArr[1] || '')
  })

  paramObj = Object.assign({}, paramObj, obj)

  const resArr =
    Object.keys(paramObj).map(
      (key) => `${key}=${encodeURIComponent(paramObj[key] || '')}`
    ) || []

  hashArr[1] = resArr.join('&')
  const hashStr = hashArr.join('?')

  if (window.history.replaceState) {
    const url = originHref + hashStr
    window.history.replaceState(null, '', url)
  } else {
    window.location.hash = hashStr
  }
}

/**
 * 删除 URL 参数
 * @param name 参数名（字符串）、参数名数组或参数对象
 */
export function removeParams(
  name: string | string[] | Record<string, any>
): void {
  const removeList: string[] = []

  const nameType = Object.prototype.toString.call(name)
  if (nameType === '[object String]') {
    removeList.push(name as string)
  } else if (nameType === '[object Array]') {
    removeList.push(...(name as string[]))
  } else if (nameType === '[object Object]') {
    removeList.push(...Object.keys(name))
  } else {
    return
  }

  const originHref = window.location.href.split('#')[0]
  let hashArr: string[] = []

  if (window.location.hash) {
    hashArr = window.location.hash.split('?')
  }

  let paramArr = (hashArr[1] && hashArr[1].split('&')) || []

  paramArr = paramArr.filter((val) => {
    const tmpArr = val.split('=')
    return removeList.indexOf(tmpArr[0]) === -1
  })

  hashArr[1] = paramArr.join('&')
  const hashStr = hashArr.join('?')

  if (window.history.replaceState) {
    const url = originHref + hashStr
    window.history.replaceState(null, '', url)
  } else {
    window.location.hash = hashStr
  }
}

export default {
  getParams,
  setParams,
  removeParams,
}

