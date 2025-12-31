/**
 * 事件总线
 * 全局事件系统，用于组件间通信
 * 参考 console-ui/src/globalLib.js 中的 nacosEvent
 * 自定义实现，支持事件监听、触发、移除等功能
 */

// 定义事件类型
export type EventType = string | symbol

// 事件处理器类型
export type Handler<T = any> = (event: T) => void

// 事件对象接口
interface EventObject {
  callback: Handler
  once: boolean
}

/**
 * 事件总线类
 */
class EventBus {
  private eventList: Map<EventType, EventObject[]> = new Map()
  private ignoreEventList: Map<EventType, Array<{ argsList: any[]; self: EventBus }>> = new Map()

  /**
   * 监听事件
   * @param eventName 事件名
   * @param callback 回调函数
   * @param once 是否只监听一次，默认 false
   */
  listen(eventName: EventType, callback: Handler, once = false): void {
    if (!eventName || typeof callback !== 'function') {
      return
    }

    if (!this.eventList.has(eventName)) {
      this.eventList.set(eventName, [])
    }

    this.eventList.get(eventName)!.push({
      callback,
      once,
    })

    // 如果有未消费的消息，立即触发
    if (this.ignoreEventList.has(eventName)) {
      const ignoreList = this.ignoreEventList.get(eventName)!
      ignoreList.forEach((eventObj) => {
        this.trigger.apply(eventObj.self, eventObj.argsList as any)
      })
      this.ignoreEventList.delete(eventName)
    }
  }

  /**
   * 只监听一次
   * @param eventName 事件名
   * @param callback 回调函数
   */
  once(eventName: EventType, callback: Handler): void {
    this.listen(eventName, callback, true)
  }

  /**
   * 监听事件，之前未消费的消息也会进行触发
   * @param eventName 事件名
   * @param callback 回调函数
   * @param once 是否只监听一次，默认 false
   */
  listenAllTask(eventName: EventType, callback: Handler, once = false): void {
    this.listen(eventName, callback, once)

    // 触发之前未消费的消息
    if (this.ignoreEventList.has(eventName)) {
      const ignoreList = this.ignoreEventList.get(eventName)!
      ignoreList.forEach((eventObj) => {
        this.trigger.apply(eventObj.self, eventObj.argsList as any)
      })
      this.ignoreEventList.delete(eventName)
    }
  }

  /**
   * 触发事件
   * @param eventName 事件名
   * @param args 事件参数
   */
  trigger(eventName: EventType, ...args: any[]): void {
    if (!this.eventList.has(eventName) || !this.eventList.get(eventName)!.length) {
      // 如果还没有订阅消息，将其放到未消费队列里
      if (!this.ignoreEventList.has(eventName)) {
        this.ignoreEventList.set(eventName, [])
      }
      this.ignoreEventList.get(eventName)!.push({
        argsList: [eventName, ...args],
        self: this,
      })
      return
    }

    const handlers = this.eventList.get(eventName)!
    const newHandlers: EventObject[] = []

    handlers.forEach((obj) => {
      if (typeof obj.callback === 'function') {
        try {
          obj.callback.apply(this, args)
        } catch (error) {
          console.error(`Error in event handler for "${String(eventName)}":`, error)
        }
        // 如果不是一次性事件，保留处理器
        if (!obj.once) {
          newHandlers.push(obj)
        }
      }
    })

    // 更新事件列表
    if (newHandlers.length > 0) {
      this.eventList.set(eventName, newHandlers)
    } else {
      this.eventList.delete(eventName)
    }
  }

  /**
   * 移除事件监听
   * @param eventName 事件名
   * @param callback 回调函数（可选，如果不提供则移除该事件的所有监听器）
   */
  remove(eventName: EventType, callback?: Handler): void {
    if (!eventName || !this.eventList.has(eventName)) {
      return
    }

    if (!callback) {
      // 移除该事件的所有监听器
      this.eventList.delete(eventName)
      return
    }

    // 移除指定的监听器
    const handlers = this.eventList.get(eventName)!
    const newHandlers = handlers.filter((obj) => obj.callback !== callback)

    if (newHandlers.length > 0) {
      this.eventList.set(eventName, newHandlers)
    } else {
      this.eventList.delete(eventName)
    }
  }

  /**
   * 移除所有事件监听
   */
  removeAll(): void {
    this.eventList.clear()
    this.ignoreEventList.clear()
  }

  /**
   * 获取事件监听器数量
   * @param eventName 事件名
   */
  listenerCount(eventName: EventType): number {
    return this.eventList.get(eventName)?.length || 0
  }

  /**
   * 获取所有事件名
   */
  eventNames(): EventType[] {
    return Array.from(this.eventList.keys())
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// 导出类型和实例
export default eventBus

