import { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { AppProvider } from '@/store/AppContext';
// 全局样式
import './app.scss';

function App(props) {
  // 可以使用所有的 React Hooks
  useEffect(() => {
    console.log('[App] 应用启动');
  }, []);

  // 对应 onShow
  useDidShow(() => {
    console.log('[App] 应用显示');
  });

  // 对应 onHide
  useDidHide(() => {
    console.log('[App] 应用隐藏');
  });

  return <AppProvider>{props.children}</AppProvider>;
}

export default App;
