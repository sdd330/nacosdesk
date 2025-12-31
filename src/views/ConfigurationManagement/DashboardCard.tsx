/**
 * DashboardCard 组件
 * 配置统计卡片组件
 * 使用 Vue 3 JSX + Composition API
 * 参考 console-ui/src/pages/ConfigurationManagement/ConfigurationManagement/DashboardCard.js
 */

import { defineComponent, computed } from 'vue'
import { ElCard, ElCarousel, ElCarouselItem, ElLink, ElTag } from 'element-plus'
import { useI18n } from '@/composables/useI18n'

export interface DashboardCardItem {
  title: string
  url?: string
  tag?: 'new' | 'hot'
}

export interface DashboardCardData {
  modeType: 'notice' | 'normal'
  modeName?: string
  modeList: DashboardCardItem[]
}

export interface DashboardCardProps {
  data?: DashboardCardData
  height?: number | string
}

export default defineComponent<DashboardCardProps>({
  name: 'DashboardCard',
  props: {
    data: {
      type: Object as () => DashboardCardData,
      default: () => ({
        modeType: 'normal',
        modeList: [],
      }),
    },
    height: {
      type: [Number, String],
      default: 'auto',
    },
  },
  setup(props) {
    // ✅ Composition API: 使用 composable
    const { t } = useI18n()

    // ✅ Composition API: 使用 computed 派生状态
    const cardHeight = computed(() => {
      if (typeof props.height === 'number') {
        return `${props.height}px`
      }
      return props.height || 'auto'
    })

    const isNoticeMode = computed(() => props.data?.modeType === 'notice')

    // ✅ Composition API: 返回渲染函数
    return () => {
      const { data = { modeType: 'normal', modeList: [] } } = props

      if (isNoticeMode.value) {
        // 公告模式：轮播显示
        return (
          <div class="dashboard-card-notice">
            <ElCarousel
              height="120px"
              indicator-position="none"
              arrow="never"
              autoplay={data.modeList.length > 1}
              interval={5000}
            >
              {data.modeList.map((item, index) => (
                <ElCarouselItem key={index}>
                  <div class="p-4 bg-blue-50 rounded border border-blue-200 min-h-120px">
                    <div class="font-bold text-blue-600 mb-2">
                      {t('config.importantReminder') || '重要提醒'}
                    </div>
                    <div class="text-gray-700 mb-2">
                      <strong>{item.title}</strong>
                    </div>
                    {item.url && (
                      <ElLink
                        href={item.url}
                        target="_blank"
                        type="primary"
                        class="text-blue-500"
                      >
                        {t('config.viewDetails') || '查看详情'}
                      </ElLink>
                    )}
                  </div>
                </ElCarouselItem>
              ))}
            </ElCarousel>
          </div>
        )
      }

      // 普通模式：链接列表
      return (
        <ElCard
          class="dashboard-card"
          shadow="hover"
          style={{ height: cardHeight.value }}
        >
          {data.modeName && (
            <h3 class="text-lg font-semibold mb-4 text-gray-800">
              {data.modeName}
            </h3>
          )}
          <div class="dashboard-card-list">
            {data.modeList && data.modeList.length > 0 ? (
              <ul class="list-none p-0 m-0">
                {data.modeList.map((item, index) => (
                  <li key={index} class="mb-2 pb-2 border-b border-gray-100 last:border-0">
                    <div class="flex items-center gap-2">
                      {item.url ? (
                        <ElLink
                          href={item.url}
                          target="_blank"
                          type="primary"
                          class="flex-1"
                        >
                          {item.title}
                        </ElLink>
                      ) : (
                        <span class="flex-1 text-gray-700">{item.title}</span>
                      )}
                      {item.tag === 'new' && (
                        <ElTag type="success" size="small">NEW</ElTag>
                      )}
                      {item.tag === 'hot' && (
                        <ElTag type="danger" size="small">HOT</ElTag>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div class="text-gray-400 text-sm text-center py-4">
                {t('config.noData') || '暂无数据'}
              </div>
            )}
          </div>
        </ElCard>
      )
    }
  },
})

