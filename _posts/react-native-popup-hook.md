---
created_date: 2023-05-11 19:18
updated_date: 2023-05-12 16:14
archive: 
tags:
  - react
  - blog
title: react native 弹窗浮层的管理方式
name: react native 弹窗浮层的管理方式
slug: react-native-popup-hook
brief: Dialog，BottomDrawer，Modal，Tooltip 等各种浮层弹窗虽然在表现上不一样，但他们的状态管理逻辑，如打开浮层，关闭浮层，层叠浮层等逻辑相差不大，因此可以实现一个 hook，抽取共同的逻辑，子组件间用 context 共享公共的浮层操作方法。
---

## 背景

在 react native 需求开发中，经常遇到浮层的需求，即 `Dialog`，`BottomDrawer`，`Modal` 等浮层组件，但内部的公共组件库总是难以满足需求，例如浮层层叠，操作浮层的方式，获取操作的结果等，需要二次开发。

### 现有浮层实现相似点

研究下了内部组件库的实现，实现上有相同，都有相似的展示浮层，关闭浮层的状态管理逻辑，

```tsx title={Dialog.tsx} *{2,16}
export class Dialog extends PureComponent {
  static showPopup = (config) => { // 👈🏻 操作显示浮层
    return new Promise((resolve) => {
      const inst = Dialog.instances[pageId];
      if (inst) {
        inst.setState({
          show: true,
          config,
        });
      }
    });
  };

  handleDismiss = (result) => {
    // 👇🏻 隐藏浮层
    this.setState({ show: false }, () => this.resolve?.({ action: result }));
  };

  render() {
    const { show } = this.state;
    if (!show) {
      return null;
    }
    return (
      <View>
        <TouchableOpacity onPress={() => this.handleDismiss(Dialog.Action.Cancel)}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
```

### 现有浮层实现不同点

使用上又有些不同，`Dialog` 渲染的位置会放在顶层组件树，然后在子组件内部通过 `Dialog.showPopup(config)` 配置并显示 `Dialog`

```tsx title={Screen.tsx} *{7}
function Screen() {
  return (
    <View>
      <View>
        <Child />
      </View>
      <Dialog /> {/* 👈🏻 在这里渲染 Dialog */}
    </View>
  );
}
```

```tsx title={Child.tsx} *{3}
function Child() {
  const handlePress = () => {
    const result = await Dialog.showPopup(config); // 👈🏻 配置并显示 Dialog，获取操作 Dialog 的结果
  };
  return <View onPress={handlePress}>{/* ... */}</View>;
}
```

`BottomDrawer`，`Modal` 放到组件树，当普通组件引用，其实为了覆盖整个屏幕，也必须放在页面的顶层组件树中

这个方式每个页面都要维护一套展示和隐藏的状态逻辑

```tsx title={Screen.tsx} *{7-9}
function Screen() {
  return (
    <View>
      <View>
        <Child />
      </View>
      <BottomDrawer show={state.showContent1}>{/* content */}</BottomDrawer>
      <BottomDrawer show={state.showContent2}>{/* content */}</BottomDrawer>
      <Modal visible={state.visible}>{/* content */}</Modal>
    </View>
  );
}
```

### 存在问题

这样维护起来有些混乱，每次需求开发都要把组件二次改造一下，要么页面存在大量展示隐藏的状态逻辑，使用方式也不一致，多次迭代后就得花更多时间学习研究组件怎么用，要么新的开发者又重新写一套。

实际打开浮层，层叠展示多个浮层，关闭浮层，它们的状态管理逻辑基本一样，只是在表现层不一样，因此可以自定义一个 hook，提取它们的共同逻辑。

## 代码实现

用方法的形式操作浮层，提供 `open`，`close`，`closeAll` 3 个方法

```typescript title={usePopupStack.ts}
import { ReactNode, useContext, useEffect, useMemo, useRef } from 'react';
import { Keyboard, Platform, BackHandler } from 'react-native';
import useCallbackState from './useCallbackState';

type TPopUpInfo = {
  shouldShow: boolean;
  component: ReactNode;
  onClose: () => void;
};

export type TManageStack = {
  open: (renderComponent: (onClose: () => void) => ReactNode) => number;
  close: (popUpId: number) => void;
  closeAll: () => void;
};

/**
 * Dialog, BottomDrawer, Modal etc.
 */
export const usePopupStack = () => {
  const [list, setList] = useCallbackState<TPopUpInfo[]>([]);
  const popUpMap = useRef<Map<number, TPopUpInfo>>(new Map());
  const manageStack = useMemo((): TManageStack => {
    return {
      open: (renderComponent) => {
        const popUpId = Date.now();
        const onClose = () => {
          // 快速点击会执行多次
          if (popUpMap.current.get(popUpId)) {
            popUpMap.current.get(popUpId)!.shouldShow = false;
            setList(cloneList(popUpMap.current), () => {
              popUpMap.current.delete(popUpId);
            });
          }
        };
        const component = renderComponent(onClose);
        popUpMap.current.set(popUpId, {
          shouldShow: true,
          component,
          onClose,
        });
        Keyboard.dismiss();
        setList(cloneList(popUpMap.current)); // 👈🏻 不能渲染 ref，把 list clone 存到 state 上
        return popUpId;
      },
      close: (popUpId: number) => {
        popUpMap.current.get(popUpId)?.onClose();
      },
      closeAll: () => {
        [...popUpMap.current.values()].forEach((popup) => {
          popup.onClose();
        });
      },
    };
  }, [setList]);

  useEffect(() => {
    // 监听 android 的实体返回键，关闭 pop up
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', function () {
        if (popUpMap.current) {
          const topPopupId = Array.from(popUpMap.current.keys()).pop();
          if (topPopupId) {
            manageStack.close(topPopupId);
          }
        }
      });
    }
    return () => {
      if (Platform.OS === 'android') {
        BackHandler.removeEventListener('hardwareBackPress');
      }
    };
  }, [manageStack]);

  return { manageStack, list };
};
```

### 用法

每种浮层都用 `usePopupStack` 管理，用 context 往下传递 `open`，`close`，`closeAll` 3 个方法

```tsx title={BottomDrawerContextProvider.tsx}
import React, { createContext, PropsWithChildren } from 'react';
import BottomDrawer from '//ButtomDrawer';
import { usePopupStack } from './usePopupStack';
import type { TManageStack } from './usePopupStack';

export const BottomDrawerContext = createContext({} as TManageStack);

export const BottomDrawerContextProvider: React.FC<PropsWithChildren> = (props) => {
  const { manageStack: bottomDrawer, list: drawerList } = usePopupStack();

  return (
    <BottomDrawerContext.Provider value={bottomDrawer}>
      {props.children}
      {drawerList.map(
        // 渲染 open 的 BottomDrawer
        ({ component, shouldShow, onClose }, index) => (
          <BottomDrawer
            key={index}
            shouldShow={shouldShow}
            onDismiss={onClose}
          >
            {component}
          </BottomDrawer>
        )
      )}
    </BottomDrawerContext.Provider>
  );
};
```

浮层组件都放到顶层组件树渲染，这样浮层可以覆盖整个页面。

```tsx title={Screen.tsx}
function Screen() {
  <BottomDrawerContextProvider>
    <DialogContextProvider>
      <View>...</View>
    </DialogContextProvider>
  </BottomDrawerContextProvider>;
}
```

子组件从 context 获取 `open`，`close`，`closeAll` 方法

```tsx title={Child.tsx}
function Child() {
  const bottomDrawer = useContext(BottomDrawerContext);
  const handle = () => {
    const drawerId = bottomDrawer.open((onClose) => {
      return (
        <View>
          <Button onPress={onClose}>Close</Button>
        </View>
      );
    });
  };

  useEffect(() => {
    return () => {
      bottomDrawer.close(drawerId);
    };
  }, []);

  return <></>;
}
```

这样，抽取一个 hook，每个组件不用维护浮层的状态，使用也简洁清晰。

> [本博客](https://marsk6.github.io/) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
