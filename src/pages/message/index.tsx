import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getMessageTypeConfig, formatDateTime, getRelativeTime } from '@/utils/format';
import { messageService, refreshData, onDataChange, getCurrentDateTime } from '@/services/dataService';
import type { Message } from '@/types';

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'dispatch', label: '调度指令' },
  { key: 'safety', label: '安全提醒' },
  { key: 'system', label: '系统通知' },
  { key: 'notification', label: '消息通知' }
];

const priorityIcons: Record<string, string> = {
  urgent: '🚨',
  important: '⚠️',
  normal: ''
};

const typeIcons: Record<string, string> = {
  dispatch: '📡',
  safety: '🛟',
  system: '🔔',
  notification: '📨'
};

const MessagePage: React.FC = () => {
  const { state } = useApp();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [, setRefreshing] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const reloadData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  useDidShow(() => {
    console.log('[MessagePage] 页面显示');
    reloadData();
    const unbind = onDataChange(() => {
      reloadData();
    });
    return () => unbind && unbind();
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    reloadData();
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const messageList = useMemo(() => {
    return messageService.getByType(activeFilter);
  }, [activeFilter, dataVersion]);

  const unreadCount = useMemo(() => {
    return messageService.getUnreadCount();
  }, [dataVersion]);

  const getUnreadByType = useCallback((type: string) => {
    return messageService.getUnreadCountByType(type);
  }, [dataVersion]);

  const handleMessageClick = (message: Message) => {
    if (!message.isRead) {
      const now = getCurrentDateTime();
      messageService.markAsRead(message.id, now);
      refreshData();
      reloadData();
    }
    setSelectedMessage(message);
    setShowDetail(true);
    console.log('[MessagePage] 查看消息:', message.id);
  };

  const handleConfirm = () => {
    if (!selectedMessage) return;
    Taro.showModal({
      title: '确认收到',
      content: '确认已阅读并执行该调度指令？',
      success: (res) => {
        if (res.confirm) {
          try {
            const now = getCurrentDateTime();
            const result = messageService.markAsRead(selectedMessage.id, now);
            if (result) {
              Taro.showToast({ title: '已确认', icon: 'success' });
              setShowDetail(false);
              refreshData();
              reloadData();
            }
          } catch (error) {
            console.error('[MessagePage] 确认收到失败:', error);
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleVoyageLink = (voyageId?: string) => {
    if (!voyageId) return;
    setShowDetail(false);
    Taro.navigateTo({
      url: `/pages/voyage-detail/index?id=${voyageId}`
    });
  };

  const renderMessageList = () => {
    if (messageList.length === 0) {
      return (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyText}>暂无消息</Text>
        </View>
      );
    }

    return messageList.map((message) => {
      const typeConfig = getMessageTypeConfig(message.type);

      return (
        <View
          key={message.id}
          className={classnames(styles.messageCard, !message.isRead && styles.unread)}
          onClick={() => handleMessageClick(message)}
        >
          <View className={styles.cardHeader}>
            <View className={classnames(styles.typeTag, styles[message.type])}>
              {typeIcons[message.type]} {typeConfig.text}
            </View>
            {message.priority !== 'normal' && (
              <View className={classnames(styles.priorityTag, styles[message.priority])}>
                {priorityIcons[message.priority]} {message.priority === 'urgent' ? '紧急' : '重要'}
              </View>
            )}
          </View>

          {!message.isRead && <View className={styles.unreadDot} />}

          <Text className={styles.title}>{message.title}</Text>
          <Text className={styles.contentText}>{message.content}</Text>

          <View className={styles.infoRow}>
            <View className={styles.sender}>
              <Text className={styles.senderIcon}>👤</Text>
              <Text>{message.sender}</Text>
            </View>
            <Text className={styles.time}>{getRelativeTime(message.createTime)}</Text>
          </View>

          {message.extra?.actionRequired && state.userRole === 'crew' && !message.isRead && (
            <View className={styles.actionRow}>
              <Button
                className={classnames(styles.actionBtn, styles.primary)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMessageClick(message);
                }}
              >
                立即处理
              </Button>
            </View>
          )}
        </View>
      );
    });
  };

  const renderDetail = () => {
    if (!showDetail || !selectedMessage) return null;

    const typeConfig = getMessageTypeConfig(selectedMessage.type);

    return (
      <View className={styles.detailModal} onClick={() => setShowDetail(false)}>
        <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <View className={styles.modalHeader}>
            <Text className={styles.modalTitle}>消息详情</Text>
            <Text className={styles.closeBtn} onClick={() => setShowDetail(false)}>×</Text>
          </View>

          <View>
            <View className={classnames(styles.modalType, styles[selectedMessage.type])}>
              {typeIcons[selectedMessage.type]} {typeConfig.text}
            </View>
            {selectedMessage.priority !== 'normal' && (
              <View className={classnames(styles.modalPriority, styles[selectedMessage.priority])}>
                {priorityIcons[selectedMessage.priority]} {selectedMessage.priority === 'urgent' ? '紧急' : '重要'}
              </View>
            )}
          </View>

          <Text className={styles.modalTitleText}>{selectedMessage.title}</Text>

          <View className={styles.modalInfo}>
            <View className={styles.senderInfo}>
              <Text className={styles.senderIcon}>👤</Text>
              <Text>{selectedMessage.sender} → {selectedMessage.receiver}</Text>
            </View>
            <Text className={styles.timeInfo}>{formatDateTime(selectedMessage.createTime)}</Text>
          </View>

          <Text className={styles.modalContentText}>{selectedMessage.content}</Text>

          {selectedMessage.extra && (
            <View className={styles.extraInfo}>
              {selectedMessage.extra.actionRequired && (
                <View className={styles.extraItem}>
                  <Text className={styles.extraLabel}>需要回执</Text>
                  <Text className={styles.extraValue}>是</Text>
                </View>
              )}
              {selectedMessage.extra.deadline && (
                <View className={styles.extraItem}>
                  <Text className={styles.extraLabel}>截止时间</Text>
                  <Text className={styles.extraValue}>{selectedMessage.extra.deadline}</Text>
                </View>
              )}
            </View>
          )}

          <View className={styles.modalActions}>
            {selectedMessage.voyageId && (
              <Button
                className={styles.actionBtn}
                onClick={() => handleVoyageLink(selectedMessage.voyageId)}
              >
                查看航次
              </Button>
            )}
            {selectedMessage.extra?.actionRequired && state.userRole === 'crew' && !selectedMessage.isRead ? (
              <Button
                className={classnames(styles.actionBtn, styles.primary)}
                onClick={handleConfirm}
              >
                确认收到
              </Button>
            ) : (
              <Button
                className={classnames(styles.actionBtn, styles.primary)}
                onClick={() => setShowDetail(false)}
              >
                关闭
              </Button>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <Text className={styles.title}>消息中心</Text>
          {unreadCount > 0 && (
            <View className={styles.unreadBadge}>{unreadCount}</View>
          )}
        </View>
        <Text className={styles.subtitle}>
          {state.userRole === 'crew' ? '及时查看调度指令和安全提醒' : '发送调度指令和安全通知'}
        </Text>
      </View>

      <ScrollView className={styles.filterBar} scrollX>
        {typeFilters.map((filter) => (
          <Button
            key={filter.key}
            className={classnames(
              styles.filterItem,
              activeFilter === filter.key && styles.active
            )}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
            {filter.key !== 'all' && getUnreadByType(filter.key) > 0 && (
              <Text> ({getUnreadByType(filter.key)})</Text>
            )}
            {filter.key === 'all' && unreadCount > 0 && (
              <Text> ({unreadCount})</Text>
            )}
          </Button>
        ))}
      </ScrollView>

      <View className={styles.content}>
        {renderMessageList()}
      </View>

      {renderDetail()}
    </ScrollView>
  );
};

export default MessagePage;
