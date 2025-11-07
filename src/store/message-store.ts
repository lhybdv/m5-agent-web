import { aiModelAvatar, customerAvatar } from "@/mock-data/mock-chat-view";
import type { IMessage } from "@/types";
import dayjs from "dayjs";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useChatHistoryStore } from "./history-store";
import { useChatModelStore } from "./model-store";
import { useChatStatusStore } from "./status-store";
import type { ChunkResponse } from "@/models/types";

export const useChatMessageStore = defineStore("chat-message", () => {
  const chatStatusStore = useChatStatusStore();
  const chatHistoryStore = useChatHistoryStore();
  const chatModelStore = useChatModelStore();
  const messages = ref<IMessage[]>([]);
  const messageChangeCount = ref(0);
  // 安全获取最后一条消息，避免数组为空导致 undefined 问题
  const getLastMessage = (): IMessage | undefined =>
    messages.value.length ? messages.value[messages.value.length - 1] : undefined;
  

  function ask(question: string, answer?: string) {
    if (question === "") {
      return;
    }
    if (!messages.value.length) {
      chatStatusStore.startChat = true;
      chatStatusStore.newChatId();
    }
    chatHistoryStore.addHistory(
      chatStatusStore.currentChatId,
      dayjs().format("YYYY-MM-DD HH:mm"),
      messages.value,
      chatModelStore.currentModel
    );
    messages.value.push({
      from: "user",
      content: question,
      avatarPosition: "side-right",
      avatarConfig: { ...customerAvatar },
    });
    messageChangeCount.value++;
    getAIAnswer(answer ?? question);
  }

  const getAIAnswer = async (content: string) => {
    messages.value.push({
      from: "assistant",
      content: "",
      reasoning_content: "",
      avatarPosition: "side-left",
      avatarConfig: { ...aiModelAvatar },
      loading: true,
      complete: false,
    });
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const resp = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: content,
          model:
            chatModelStore.currentModelName ||
            chatModelStore.currentModel?.modelName || "",
        }),
      });

      let answerText = "";
      if (!resp.ok) {
        answerText = `请求失败：${resp.status} ${resp.statusText}`;
      } else {
        const contentType = resp.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            const data = await resp.json();
            answerText =
              (data && (data.output || data.answer || data.content)) ||
              JSON.stringify(data);
          } catch {
            answerText = await resp.text();
          }
        } else {
          answerText = await resp.text();
        }
      }

      const assistantMsg = getLastMessage();
      if (assistantMsg) {
        assistantMsg.loading = false;
        assistantMsg.content = answerText;
        assistantMsg.complete = true;
      }
      chatHistoryStore.addHistory(
        chatStatusStore.currentChatId,
        dayjs().format("YYYY-MM-DD HH:mm"),
        messages.value,
        chatModelStore.currentModel
      );
      messageChangeCount.value++;
    } catch (e) {
      const assistantMsg = getLastMessage();
      if (assistantMsg) {
        assistantMsg.loading = false;
        assistantMsg.content = "发生错误，请稍后再试。";
        assistantMsg.complete = true;
      }
      messageChangeCount.value++;
    }
  };

  const onMessageChange = (msg: ChunkResponse) => {
    const currentMessage = getLastMessage();
    if (!currentMessage) return;
    currentMessage.loading = false;
    if (!currentMessage.startTime) {
      currentMessage.startTime = Date.now();
    }
    if (!currentMessage.endTime && msg.content) {
      currentMessage.endTime = Date.now();
    }
    currentMessage.reasoning_content += msg.reasoning_content || '';
    currentMessage.content += msg.content || '';
    messageChangeCount.value++;
  };

  const onMessageComplete = () => {
    const msg = getLastMessage();
    if (!msg) return;
    msg.loading = false;
    msg.complete = true;
  };

  return { messages, messageChangeCount, ask };
});
