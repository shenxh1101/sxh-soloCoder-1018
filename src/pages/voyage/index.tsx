import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import VoyageCard from '@/components/VoyageCard';
import { mockVoyages } from '@/data/voyage';
import { getRoleText, toggleRole } from '@/utils/role';
import { useApp } from '@/store/AppContext';
import type { Voyage } from '@/types';

const VoyagePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [list, setList] = useState<Voyage[]>([]);
  const [, setRefreshing] = useState(false);

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '进行中' },
    { key: 'pending', label: '待执行' },
    { key: 'completed', label: '已完成' }
  ];

  const filteredList = useMemo(() => {
    let result = [...mockVoyages];
    
    if (activeFilter === 'active') {
      result = result.filter(v => 
        v.status === 'sailing' || v.status === 'anchored' || 
        v.status === 'loading' || v.status === 'unloading' || v.status === 'exception'
      );
    } else if (activeFilter === 'pending') {
      result = result.filter(v => v.status === 'pending');
    } else if (activeFilter === 'completed') {
      result = result.filter(v => v.status === 'completed');
    }
    
    return result;
  }, [activeFilter]);

  useEffect(() => {
    setList(filteredList);
  }, [filteredList]);

  useDidShow(() => {
    console.log('[VoyagePage] 页面显示，当前角色:', state.userRole);
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    console.log('[VoyagePage] 下拉刷新');
    setTimeout(() => {
      setList([...filteredList]);
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleRoleToggle = () => {
    const newRole = toggleRole();
    dispatch({ type: 'SET_USER_ROLE', payload: newRole });
    Taro.showToast({
      title: `已切换为${getRoleText(newRole)}`,
      icon: 'success'
    });
    console.log('[VoyagePage] 角色切换为:', newRole);
  };

  const handleVoyageClick = (voyage: Voyage) => {
    dispatch({ type: 'SET_CURRENT_VOYAGE', payload: voyage });
    Taro.navigateTo({
      url: `/pages/voyage-detail/index?id=${voyage.id}`
    });
  };

  const handleBoardClick = () => {
    Taro.navigateTo({
      url: '/pages/voyage-board/index'
    });
  };

  const handleTasksClick = () => {
    Taro.navigateTo({
      url: '/pages/voyage-tasks/index'
    });
  };

  const handleFleetClick = () => {
    Taro.navigateTo({
      url: '/pages/fleet-overview/index'
    });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <Text className={styles.title}>航次列表</Text>
          <Button className={styles.roleBtn} onClick={handleRoleToggle}>
            {getRoleText(state.userRole)}
          </Button>
        </View>
        <Text className={styles.subtitle}>
          {state.userRole === 'crew' ? '查看我的航次任务' : '管理所有航次进度'}
        </Text>
      </View>

      <View className={styles.quickEntry}>
        {state.userRole === 'dispatcher' ? (
          <>
            <View className={styles.entryCard} onClick={handleBoardClick}>
              <Text className={styles.entryIcon}>📊</Text>
              <View className={styles.entryInfo}>
                <Text className={styles.entryTitle}>航次执行看板</Text>
                <Text className={styles.entryDesc}>监控航次执行全流程</Text>
              </View>
              <Text className={styles.entryArrow}>→</Text>
            </View>
            <View className={styles.entryCard} onClick={handleFleetClick}>
              <Text className={styles.entryIcon}>🚢</Text>
              <View className={styles.entryInfo}>
                <Text className={styles.entryTitle}>船队总览</Text>
                <Text className={styles.entryDesc}>查看船队运行状态</Text>
              </View>
              <Text className={styles.entryArrow}>→</Text>
            </View>
          </>
        ) : (
          <View className={styles.entryCard} onClick={handleTasksClick}>
            <Text className={styles.entryIcon}>📋</Text>
            <View className={styles.entryInfo}>
              <Text className={styles.entryTitle}>航次任务清单</Text>
              <Text className={styles.entryDesc}>查看待办和已完成任务</Text>
            </View>
            <Text className={styles.entryArrow}>→</Text>
          </View>
        )}
      </View>

      <ScrollView className={styles.filterBar} scrollX enableFlex>
        {filters.map(filter => (
          <Button
            key={filter.key}
            className={classnames(styles.filterItem, activeFilter === filter.key && styles.active)}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </ScrollView>

      <View className={styles.listContainer}>
        {list.length > 0 ? (
          list.map(voyage => (
            <VoyageCard
              key={voyage.id}
              voyage={voyage}
              onClick={() => handleVoyageClick(voyage)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无航次数据</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default VoyagePage;
