<template>
  <div class="welcome-page">
    <div class="content-wrapper">
      <div class="intro-row">
        <img src="/aiAvatar.svg" width="80" alt="logo" />
        <McIntroduction :title="GlobalConfig.title" :sub-title="GlobalConfig.subTitle"
          :description="[$t('welcome.description1'), $t('welcome.description2')]" class="welcome-introduction">
        </McIntroduction>
      </div>
      <div class="guess-question">
        <div class="guess-title">
          <div>{{ $t("welcome.guessYouWantAsk") }}</div>
          <div>
            <i class="icon-recover"></i>
            <span>{{ $t("welcome.change") }}</span>
          </div>
        </div>
        <div class="guess-content">
          <span v-for="(item, index) in list" :key="index" @click="onItemClick(item)">
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalConfig from '@/global-config';
import {
  guessQuestionsCn,
  guessQuestionsEn,
  mockAnswer,
} from '@/mock-data/mock-chat-view';
import { useChatMessageStore, useLangStore } from '@/store';
import { LangType } from '@/types';
import { useMenuStore } from '@/store/menu-store';
import { storeToRefs } from 'pinia';
import { watch, computed } from 'vue';

const langStore = useLangStore();
const chatMessageStore = useChatMessageStore();
const menuStore = useMenuStore();
const { menuLabel } = storeToRefs(menuStore);

const menuToQuestions: Record<string, string[]> = {
  ["综合信息"]:["今天重点关注天气",
    "预警发布情况",
    "有无气象突发事件"],
  ["模式分析"]: ["降水突破极值情况",
    "暴雨影响范围",
    "寒潮影响范围",
    "高温情况统计"],
  ["卫星雷达"]: ["当前雷达回波最强区域"],
  ["数值分析"]: ["降水预报ts评分总体情况",
    "需要关注预报天气",
    "中国区域总体雨带趋势"],
  ["集合预报"]: [" 降水概率情况综述"],
  ["预报制作"]: ["当前需要制作的预报产品",
    "预报制作流程介绍"],
};

type GuessItemValue = keyof typeof mockAnswer;
type GuessItem = { label: string; value: GuessItemValue; };

const list = ref<GuessItem[]>([]);

// 1) 直接 watch，菜单名变化时刷新组件逻辑
watch(menuLabel, (newLabel) => {
  if (!newLabel) return;
  // 2) 根据菜单名获取对应的问题列表
  const questions = menuToQuestions[newLabel] || [];
  // 3) 更新组件数据
  list.value = questions.map((item) => ({ label: item, value: item as GuessItemValue }));
  // 在这里做刷新动作，比如重新拉数据或更新本地状态
  // list.value = [{ label: newLabel, value: newLabel as GuessItemValue }]
});


// const list = computed<GuessItem[]>(() =>
//   langStore.currentLang === LangType.CN ? guessQuestionsCn : guessQuestionsEn,
// );

const onItemClick = (item: GuessItem) => {
  // if (mockAnswer[item.value]) {
    chatMessageStore.ask(item.label, mockAnswer[item.value]);
  // }
};

const buttonText = ref("调用 action");
const onInvokeAction = async () => {
  buttonText.value = "调用中...";
  window.parent.postMessage({
    action: 'invokeAppAction',
    name: 'getDashboardInfo',
    args: {}
  }, "*");
}
</script>

<style scoped lang="scss">
@import "devui-theme/styles-var/devui-var.scss";

.welcome-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  .content-wrapper {
    margin: auto 0;
    width: 100%;
    gap: 24px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  overflow: auto;
  width: 100%;
  max-width: 1200px;
  padding: 0 12px;
  gap: 24px;

  .welcome-introduction {
    :deep() {
      .mc-introduction-description {
        font-size: var(--devui-font-size, 14px);
      }
    }
  }

  .intro-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .guess-question {
    width: 100%;
    padding: 24px;
    border-radius: 24px;
    background-color: $devui-base-bg;

    .guess-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: $devui-text;
      margin-bottom: 16px;

      &>div:first-child {
        font-weight: 700;
        font-size: 16px;
        line-height: 24px;
      }

      &>div:last-child {
        font-size: $devui-font-size;
        color: $devui-aide-text;
        cursor: pointer;

        span {
          margin-left: 4px;
          line-height: 24px;
        }
      }
    }

    .guess-content {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;

      span {
        font-size: $devui-font-size;
        color: $devui-aide-text;
        padding: 10px 16px;
        border-radius: $devui-border-radius-full;
        background-color: $devui-dividing-line;
        cursor: pointer;
      }
    }
  }
}
</style>
