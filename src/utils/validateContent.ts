/**
 * 配置内容验证工具
 * 参考 console-ui/src/utils/validateContent.js
 * 支持 JSON, YAML, XML, HTML, Properties, TOML 格式验证
 */

import * as yaml from 'js-yaml'
import * as toml from '@iarna/toml'

/**
 * 验证 Properties 配置项
 */
function validateProperty(property: string[]): boolean {
  const length = property.length
  let keyLen = 0
  let valueStart = length
  let hasSep = false
  let precedingBackslash = false
  let c: string

  // 解析 key
  while (keyLen < length) {
    c = property[keyLen]
    if ((c === '=' || c === ':') && !precedingBackslash) {
      valueStart = keyLen + 1
      hasSep = true
      break
    }

    if ((c === ' ' || c === '\t' || c === '\f') && !precedingBackslash) {
      valueStart = keyLen + 1
      break
    }

    if (c === '\\') {
      precedingBackslash = !precedingBackslash
    } else {
      precedingBackslash = false
    }
    keyLen++
  }

  // 解析 value
  while (valueStart < length) {
    c = property[valueStart]
    if (c !== ' ' && c !== '\t' && c !== '\f') {
      if (!hasSep && (c === '=' || c === ':')) {
        hasSep = true
      } else {
        break
      }
    }
    valueStart++
  }

  return (
    validateKeyOrValueForProperty(property, 0, keyLen) &&
    validateKeyOrValueForProperty(property, valueStart, length)
  )
}

function validateKeyOrValueForProperty(property: string[], start: number, end: number): boolean {
  // check null
  if (start >= end) {
    return false
  }
  let index = 0
  let c: string
  while (index < property.length) {
    c = property[index++]
    if (c !== '\\') {
      continue
    }

    c = property[index++]
    // check backslash
    if (!isPropertyEscape(c)) {
      return false
    }

    // check Unicode
    if (c === 'u') {
      const unicode = property.slice(index, index + 4).join('')
      if (!unicode.match(/^[a-f0-9]{4}$/i)) {
        return false
      }
      index += 4
    }
  }

  return true
}

function isPropertyEscape(c: string = ''): boolean {
  return 'abfnrt\\"\'0! #:=u'.includes(c)
}

/**
 * 验证 JSON 格式
 */
export function validateJson(str: string): boolean {
  try {
    return !!JSON.parse(str)
  } catch {
    return false
  }
}

/**
 * 验证 XML/HTML 格式
 */
export function validateXml(str: string): boolean {
  try {
    if (typeof DOMParser !== 'undefined') {
      const parserObj =
        new window.DOMParser()
          .parseFromString(str, 'application/xml')
          .getElementsByTagName('parsererror') || {}
      return parserObj.length === 0
    } else if (typeof (window as any).ActiveXObject !== 'undefined') {
      const xml = new (window as any).ActiveXObject('Microsoft.XMLDOM')
      xml.async = 'false'
      xml.loadXML(str)
      return xml
    }
    return false
  } catch {
    return false
  }
}

/**
 * 验证 YAML 格式
 */
export function validateYaml(str: string): boolean {
  try {
    return !!yaml.load(str)
  } catch {
    return false
  }
}

/**
 * 验证 Properties 格式
 */
export function validateProperties(str: string = ''): boolean {
  let isNewLine = true
  let isCommentLine = false
  let isSkipWhiteSpace = true
  let precedingBackslash = false
  let appendedLineBegin = false
  let skipLF = false
  let hasProperty = false
  const property: string[] = []

  for (let i = 0; i < str.length; i++) {
    const c = str[i]

    if (skipLF) {
      skipLF = false
      if (c === '\n') {
        continue
      }
    }

    // 跳过行首空白字符
    if (isSkipWhiteSpace) {
      if (c === ' ' || c === '\t' || c === '\f') {
        continue
      }
      if (!appendedLineBegin && (c === '\r' || c === '\n')) {
        continue
      }
      appendedLineBegin = false
      isSkipWhiteSpace = false
    }

    // 判断注释行
    if (isNewLine) {
      isNewLine = false
      if (c === '#' || c === '!') {
        isCommentLine = true
        continue
      }
    }

    if (c !== '\n' && c !== '\r') {
      property.push(c)
      if (c === '\\') {
        precedingBackslash = !precedingBackslash
      } else {
        precedingBackslash = false
      }
      continue
    }

    // 跳过注释行
    if (isCommentLine || property.length === 0) {
      isNewLine = true
      isCommentLine = false
      isSkipWhiteSpace = true
      property.length = 0
      continue
    }

    // 处理转义字符
    if (precedingBackslash) {
      property.pop()
      precedingBackslash = false
      isSkipWhiteSpace = true
      appendedLineBegin = true
      if (c === '\r') {
        skipLF = true
      }
      continue
    }

    // 解析出配置项并进行校验
    if (!validateProperty(property)) {
      return false
    }
    hasProperty = true
    property.length = 0
    isNewLine = true
    isSkipWhiteSpace = true
  }

  // 校验最后一行
  if (property.length > 0 && !isCommentLine) {
    return validateProperty(property)
  }

  return hasProperty
}

/**
 * 验证 TOML 格式
 */
export function validateToml(str: string): boolean {
  try {
    // 如果不加这里的 replace 的话在 toml 的注释换行可能会出现以下错误：
    // TomlError: Control characters (codes < 0x1f and 0x7f) are not allowed in comments
    return !!toml.parse(str.replace(/\r\n/g, '\n'))
  } catch {
    return false
  }
}

export interface ValidateOptions {
  content: string
  type: 'json' | 'xml' | 'html' | 'text/html' | 'properties' | 'yaml' | 'toml' | 'text'
}

/**
 * 根据类型验证配置内容
 */
export function validate({ content, type }: ValidateOptions): boolean {
  const validateObj: Record<string, (str: string) => boolean> = {
    json: validateJson,
    xml: validateXml,
    'text/html': validateXml,
    html: validateXml,
    properties: validateProperties,
    yaml: validateYaml,
    toml: validateToml,
  }

  if (!validateObj[type]) {
    return true // 未知类型默认通过验证
  }

  return validateObj[type](content)
}

export default {
  validateJson,
  validateXml,
  validateYaml,
  validateProperties,
  validateToml,
  validate,
}

