import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { mockShips, mockShipDynamics, getShipById, getShipDynamicsByVoyage } from '@/data/ship';
import { getCurrentVoyage } from '@/data/voyage';
import { formatSpeed, getHeadingText, formatDateTime, formatPercentage, getShipStatusConfig } from '@/utils/format';
import DataPanel from '@/components/DataPanel';
import Timeline from '@/components/Timeline';


const ShipPage: React.FC = () => {
  const { state } = useApp();
  const [, setRefreshing] = useState(false);

  const currentShip = useMemo(() => {
    if (state.userRole === 'crew') {
      const voyage = getCurrentVoyage();
      if (voyage) {
        return getShipById(voyage.shipId);
      }
    }
    return mockShips[0];
  }, [state.userRole]);

  const shipDynamics = useMemo(() => {
    if (currentShip?.currentVoyageId) {
      return getShipDynamicsByVoyage(currentShip.currentVoyageId);
    }
    return mockShipDynamics;
  }, [currentShip]);

  const timelineItems = useMemo(() => {
    return shipDynamics.slice(0, 5).map((d, index) => ({
      time: formatDateTime(d.updateTime),
      title: d.positionText,
      description: `航速 ${formatSpeed(d.speed)}，航向 ${getHeadingText(d.heading)}，天气 ${d.weather}`,
      status: (index === 0 ? 'current' : 'completed') as 'current' | 'completed' | 'pending'
    }));
  }, [shipDynamics]);

  useDidShow(() => {
    console.log('[ShipPage] 页面显示，当前船舶:', currentShip?.name);
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    console.log('[ShipPage] 下拉刷新');
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleUpdatePosition = () => {
    Taro.showModal({
      title: '更新位置',
      content: '确认上报当前船舶位置和动态信息？',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '上报中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '上报成功', icon: 'success' });
            console.log('[ShipPage] 位置更新成功');
          }, 1000);
        }
      }
    });
  };

  const handleFleetOverview = () => {
    Taro.navigateTo({ url: '/pages/fleet-overview/index' });
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      sailing: 'statusSuccess',
      anchored: 'statusWarning',
      docked: '',
      maintenance: 'statusError'
    };
    return map[status] || '';
  };

  const renderCrewView = () => {
    if (!currentShip) return null;
    const statusConfig = getShipStatusConfig(currentShip.status);

    return (
      <>
        <View className={styles.header}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>船舶动态</Text>
          </View>
          <Text className={styles.subtitle}>{currentShip.name}</Text>
        </View>

        <View className={styles.content}>
          <View className={styles.dataGrid}>
            <View className={styles.gridItem}>
              <View className={styles.gridInner}>
                <Text className={styles.value}>{formatSpeed(currentShip.position.speed)}</Text>
                <Text className={styles.label}>当前航速</Text>
              </View>
            </View>
            <View className={styles.gridItem}>
              <View className={styles.gridInner}>
                <Text className={styles.value}>{getHeadingText(currentShip.position.heading)}</Text>
                <Text className={styles.label}>航向</Text>
              </View>
            </View>
            <View className={styles.gridItem}>
              <View className={classnames(styles.gridInner, styles.status)}>
                <Text className={classnames(styles.value, getStatusClass(currentShip.status))}>
                  {statusConfig.text}
                </Text>
                <Text className={styles.label}>船舶状态</Text>
              </View>
            </View>
            <View className={styles.gridItem}>
              <View className={styles.gridInner}>
                <Text className={styles.value}>{currentShip.position.latitude.toFixed(4)}</Text>
                <Text className={styles.label}>纬度</Text>
              </View>
            </View>
            <View className={styles.gridItem}>
              <View className={styles.gridInner}>
                <Text className={styles.value}>{currentShip.position.longitude.toFixed(4)}</Text>
                <Text className={styles.label}>经度</Text>
              </View>
            </View>
            <View className={styles.gridItem}>
              <View className={styles.gridInner}>
                <Text className={styles.value}>{formatDateTime(currentShip.position.updateTime, 'HH:mm')}</Text>
                <Text className={styles.label}>更新时间</Text>
              </View>
            </View>
          </View>

          <DataPanel
            icon="⚓"
            title="油水储量"
            listData={[
              { label: '燃油储量', value: `${formatPercentage(currentShip.fuelLevel)}` },
              { label: '淡水储量', value: `${formatPercentage(currentShip.waterLevel)}` }
            ]}
          />

          {shipDynamics.length > 0 && (
            <DataPanel
              icon="🌤️"
              title="当前海况"
              listData={[
                { label: '天气', value: shipDynamics[0].weather },
                { label: '风力', value: `${shipDynamics[0].windSpeed} 级 ${shipDynamics[0].windDirection}` },
                { label: '浪高', value: `${shipDynamics[0].waveHeight} 米` }
              ]}
            />
          )}

          <Text className={styles.sectionTitle}>航行轨迹</Text>
          <View className={styles.card}>
            <Timeline items={timelineItems} />
          </View>
        </View>

        <View className={styles.bottomBar}>
          <Button className={styles.updateBtn} onClick={handleUpdatePosition}>
            更新位置与动态
          </Button>
        </View>
      </>
    );
  };

  const renderDispatcherView = () => {
    return (
      <>
        <View className={styles.header}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>船队动态</Text>
            <Button className={styles.fleetBtn} onClick={handleFleetOverview}>
              船队总览
            </Button>
          </View>
          <Text className={styles.subtitle}>实时监控所有船舶动态</Text>
        </View>

        <View className={styles.content}>
          <View className={styles.fleetStats}>
            <View className={styles.statItem}>
              <Text className={classnames(styles.count, styles.success)}>
                {mockShips.filter(s => s.status === 'sailing').length}
              </Text>
              <Text className={styles.label}>在航</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.count, styles.warning)}>
                {mockShips.filter(s => s.status === 'anchored').length}
              </Text>
              <Text className={styles.label}>锚泊</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.count}>
                {mockShips.filter(s => s.status === 'docked').length}
              </Text>
              <Text className={styles.label}>停靠</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.count, styles.error)}>
                {mockShips.filter(s => s.status === 'maintenance').length}
              </Text>
              <Text className={styles.label}>维护</Text>
            </View>
          </View>

          <Text className={styles.sectionTitle}>船舶列表</Text>
          {mockShips.map(ship => {
            const statusConfig = getShipStatusConfig(ship.status);
            return (
              <View className={styles.shipItem} key={ship.id}>
                <View className={styles.shipHeader}>
                  <Text className={styles.shipName}>{ship.name}</Text>
                  <View className={classnames(styles.statusTag, styles[ship.status])}>
                    {statusConfig.text}
                  </View>
                </View>
                <View className={styles.shipInfo}>
                  <View className={styles.infoRow}>
                    <Text className={styles.label}>船型：</Text>
                    <Text className={styles.value}>{ship.type}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.label}>航速：</Text>
                    <Text className={styles.value}>{formatSpeed(ship.position.speed)}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.label}>航向：</Text>
                    <Text className={styles.value}>{getHeadingText(ship.position.heading)}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.label}>燃油：</Text>
                    <Text className={styles.value}>{formatPercentage(ship.fuelLevel)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </>
    );
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      {state.userRole === 'crew' ? renderCrewView() : renderDispatcherView()}
    </ScrollView>
  );
};

export default ShipPage;
