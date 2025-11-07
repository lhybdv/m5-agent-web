import type { LLMModelsConfig } from "./types";
import DeepSeekIcon from "../../public/deepseek-color.svg";
import QwenIcon from "../../public/qwen.svg";
import SiliconCloudIcon from "../../public/siliconcloud-color.svg";

export const MODEL_CONFIGS = {
  stream: true,
  enableMock: true,
};

export enum LLMProviders {
  SILICON_FLOW = "siliconflow",
  DEEP_SEEK = "deepseek",
  QWEN = "qwen",
}

export enum LLMClientKey {
  openai = "openai",
}

export const LLM_MODELS: LLMModelsConfig[] = [
  {
    // 统一使用硅基流动聚合接口
    providerKey: LLMProviders.SILICON_FLOW,
    apiPath: "https://api.siliconflow.cn/v1",
    apiKey: "",
    models: [
      { name: "deepseekr1", iconPath: DeepSeekIcon },
      { name: "chatglm-88b", iconPath: SiliconCloudIcon },
      { name: "glm-4.5", iconPath: SiliconCloudIcon },
      { name: "qwen3-30-fp8", iconPath: QwenIcon },
      { name: "qwen3-30b", iconPath: QwenIcon },
    ],
    available: true,
    clientKey: LLMClientKey.openai,
  },
];
