"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Session,
  SessionsData,
  Conversation,
  createNewSession,
  generateSessionTitle,
} from "@/lib/conversations";

const STORAGE_KEY = "voice-chat-sessions";

/**
 * useSessionManager Hook
 *
 * 管理所有会话的状态和持久化
 * 提供会话的 CRUD 操作
 */
export function useSessionManager(initialVoice: string = "ash") {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * 从 localStorage 加载会话
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: SessionsData = JSON.parse(saved);

        // 数据迁移：兼容旧数据，添加 isArchived 和 endedAt 字段
        const migratedSessions = (data.sessions || []).map(session => ({
          ...session,
          isArchived: session.isArchived ?? false,  // 旧会话默认未归档
          endedAt: session.endedAt ?? undefined,
        }));

        setSessions(migratedSessions);
        setCurrentSessionId(data.currentSessionId || "");
        console.log("✅ 已加载会话:", migratedSessions.length, "个");
      } else {
        // 首次使用，创建初始会话
        const newSession = createNewSession(initialVoice);
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
        console.log("✅ 创建初始会话:", newSession.id);
      }
    } catch (error) {
      console.error("❌ 加载会话失败:", error);
      // 出错时创建新会话
      const newSession = createNewSession(initialVoice);
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
    } finally {
      setIsLoaded(true);
    }
  }, []); // 只在组件挂载时执行一次

  /**
   * 自动保存到 localStorage
   */
  useEffect(() => {
    if (!isLoaded) return; // 只在加载完成后才保存

    try {
      const data: SessionsData = {
        sessions,
        currentSessionId,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // console.log("💾 已保存会话:", sessions.length, "个");
    } catch (error) {
      console.error("❌ 保存会话失败:", error);
      if (error instanceof Error && error.name === "QuotaExceededError") {
        alert("存储空间已满，无法保存更多对话。请删除一些旧对话。");
      }
    }
  }, [sessions, currentSessionId, isLoaded]);

  /**
   * 获取当前会话
   */
  const getCurrentSession = useCallback((): Session | null => {
    return sessions.find((s) => s.id === currentSessionId) || null;
  }, [sessions, currentSessionId]);

  /**
   * 创建新会话
   * 自动归档之前的活跃会话
   */
  const createSession = useCallback(
    (voice: string = initialVoice): Session => {
      const newSession = createNewSession(voice);
      const now = new Date().toISOString();

      setSessions((prev) =>
        prev
          .map((s) => {
            // 将之前的活跃会话标记为非活跃
            const updates: Partial<Session> = { isActive: false };

            // 如果之前的活跃会话还没归档，现在归档它
            if (s.isActive && !s.isArchived) {
              updates.isArchived = true;
              updates.endedAt = now;
              updates.updatedAt = now;
            }

            return { ...s, ...updates };
          })
          .concat(newSession)
      );
      setCurrentSessionId(newSession.id);

      console.log("✅ 创建新会话并归档旧会话:", newSession.id);
      return newSession;
    },
    [initialVoice]
  );

  /**
   * 切换到指定会话
   */
  const selectSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        isActive: s.id === sessionId,
      }))
    );
    setCurrentSessionId(sessionId);
    console.log("✅ 切换到会话:", sessionId);
  }, []);

  /**
   * 删除会话
   */
  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);

        // 如果删除的是当前会话，切换到最新的会话
        if (sessionId === currentSessionId && filtered.length > 0) {
          const latest = filtered[filtered.length - 1];
          setCurrentSessionId(latest.id);
          return filtered.map((s) => ({
            ...s,
            isActive: s.id === latest.id,
          }));
        }

        // 如果删除后没有会话了，创建新会话
        if (filtered.length === 0) {
          const newSession = createNewSession(initialVoice);
          setCurrentSessionId(newSession.id);
          return [newSession];
        }

        return filtered;
      });

      console.log("✅ 删除会话:", sessionId);
    },
    [currentSessionId, initialVoice]
  );

  /**
   * 添加消息到当前会话
   */
  const addMessageToCurrentSession = useCallback(
    (message: Conversation) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            const updatedMessages = [...session.messages, message];

            // 改进标题生成逻辑:只要标题还是"新对话"格式且收到第一条用户消息就更新
            let newTitle = session.title;
            if (session.title.startsWith('新对话') &&
                message.role === "user" &&
                message.text.trim()) {
              newTitle = generateSessionTitle([message]);
            }

            return {
              ...session,
              messages: updatedMessages,
              messageCount: updatedMessages.length,
              updatedAt: new Date().toISOString(),
              title: newTitle,
            };
          }
          return session;
        })
      );
    },
    [currentSessionId]
  );

  /**
   * 更新当前会话中的某条消息
   */
  const updateMessageInCurrentSession = useCallback(
    (messageId: string, updates: Partial<Conversation>) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: session.messages.map((msg) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return session;
        })
      );
    },
    [currentSessionId]
  );

  /**
   * 清空当前会话的所有消息
   */
  const clearCurrentSession = useCallback(() => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [],
            messageCount: 0,
            updatedAt: new Date().toISOString(),
            title: generateSessionTitle([]),
          };
        }
        return session;
      })
    );
    console.log("✅ 清空当前会话");
  }, [currentSessionId]);

  /**
   * 更新会话标题
   */
  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title,
              updatedAt: new Date().toISOString(),
            }
          : session
      )
    );
    console.log("✅ 更新会话标题:", sessionId, title);
  }, []);

  /**
   * 归档当前会话
   * 将会话标记为只读，不可继续对话
   */
  const archiveCurrentSession = useCallback(() => {
    const now = new Date().toISOString();
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === currentSessionId) {
          // 归档时,如果标题还是默认的"新对话"格式,基于完整对话重新生成标题
          const title = session.title.startsWith('新对话')
            ? generateSessionTitle(session.messages)
            : session.title;

          return {
            ...session,
            isArchived: true,
            endedAt: now,
            updatedAt: now,
            title,
          };
        }
        return session;
      })
    );
    console.log("✅ 归档当前会话:", currentSessionId);
  }, [currentSessionId]);

  return {
    // 状态
    sessions,
    currentSessionId,
    isLoaded,

    // 方法
    getCurrentSession,
    createSession,
    selectSession,
    deleteSession,
    addMessageToCurrentSession,
    updateMessageInCurrentSession,
    clearCurrentSession,
    updateSessionTitle,
    archiveCurrentSession,  // 新增归档方法
  };
}
