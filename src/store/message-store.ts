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
      const apiBase = "http://10.28.16.105:8099";
      const resp = await fetch(`${apiBase}/inner/api/llm-application/open/v3/application/invoke`, {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Authorization": "Bearer LCJleHAiOjE3MDAwMDAwMDAsImVtYWlsIjoi",
          "spac-id": 1426,
          "user-id": 1812
        },
        body: JSON.stringify({
          app_id: "2011326404792381440",
          stream: true,
          send_log_event: false,
          messages: [
            {
              role: "user",
              content: [
                {
                  key: "input_text",
                  value: content,
                  type: "input",
                },
              ],
            },
          ],
        }),
      });

      if (!resp.ok) {
        const assistantMsg = getLastMessage();
        if (assistantMsg) {
          assistantMsg.loading = false;
          assistantMsg.content = `请求失败：${resp.status} ${resp.statusText}`;
          assistantMsg.complete = true;
        }
        messageChangeCount.value++;
        return;
      }

      const contentType = resp.headers.get("content-type") || "";
      const isStream =
        !!resp.body && (
          contentType.includes("text/event-stream") ||
          contentType.includes("application/x-ndjson") ||
          contentType.includes("text/plain")
        );

      if (isStream && resp.body) {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunkText = decoder.decode(value, { stream: true });
          buffer += chunkText;

          // 解析 SSE 的 data: 行或 NDJSON 行
          const parts = buffer.split(/\n\n|\r\n\r\n|\n|\r\n/);
          // 保留最后一个可能未完整的片段在 buffer 中
          buffer = parts.pop() || "";
          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith("data:")) {
              const dataPayload = trimmed.replace(/^data:\s*/, "").trim();
              try {
                const obj = JSON.parse(dataPayload);
                // 新API格式: choices[0].delta.content.msg
                const delta = obj?.choices?.[0]?.delta;
                const text = delta?.content?.msg || delta?.content || "";
                if (text) {
                  onMessageChange({ content: text });
                }
              } catch {
                // 非JSON格式，忽略
              }
            }
          }
        }
        onMessageComplete();
      } else {
        // 非流式处理
        let answerText = "";
        if (contentType.includes("application/json")) {
          try {
            const data = await resp.json();
            const choices = data?.choices || [];
            answerText =
              choices[0]?.delta?.content?.msg ||
              choices[0]?.delta?.content ||
              data?.output ||
              data?.answer ||
              data?.content ||
              JSON.stringify(data);
          } catch {
            answerText = await resp.text();
          }
        } else {
          answerText = await resp.text();
        }

        const assistantMsg = getLastMessage();
        if (assistantMsg) {
          assistantMsg.loading = false;
          assistantMsg.content = answerText;
          assistantMsg.complete = true;
        }
        messageChangeCount.value++;
      }

      // 写入历史
      chatHistoryStore.addHistory(
        chatStatusStore.currentChatId,
        dayjs().format("YYYY-MM-DD HH:mm"),
        messages.value,
        chatModelStore.currentModel
      );
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
