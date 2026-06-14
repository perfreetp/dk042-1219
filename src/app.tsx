import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { useApplianceStore } from '@/store/appliance';

function App(props: { children: React.ReactNode }) {
  const { initStore, refreshReminders } = useApplianceStore();

  useEffect(() => {
    initStore();
    console.log('[App] 家电以旧换新决策小程序启动');
  }, [initStore]);

  useDidShow(() => {
    refreshReminders();
    console.log('[App] 小程序进入前台，刷新提醒');
  });

  useDidHide(() => {
    console.log('[App] 小程序进入后台');
  });

  return props.children;
}

export default App;
