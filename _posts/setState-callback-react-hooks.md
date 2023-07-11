---
created_date: 2022-07-11 17:05
updated_date: 2022-07-11 17:18
archive:
tags:
  - react-hook
  - blog
title: react hooks setState 支持 callback
name: setState-callback-react-hooks
slug: setState-callback-react-hooks
brief: class component 的 setState 支持第二个参数 callback，更新完成后会执行回调，react hooks 的 setState 没有提供类似的功能，因此自定义一个 hook，实现类似的 callback 功能。
---

对于 class component，`this.setState(nextState, callback)` 第二个参数 callback，组件更新完成后会执行回调。
但 react hooks 没有提供类似的功能，因此自定义一个 hook，实现类似的 callback 功能。

```ts title={useCallbackState.ts}
import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export default function useCallbackState<S>(initialState: S | (() => S)) {
  const cbRef = useRef<Function[]>([]);
  const [state, setData] = useState(initialState);
  useEffect(() => {
    if (cbRef.current.length > 0) {
      cbRef.current.forEach((cb) => cb());
      cbRef.current = [];
    }
  }, [state]);
  const setState = useCallback(
    (nextState: SetStateAction<S>, callback?: Function) => {
      callback && cbRef.current.push(callback);
      setData(nextState);
    },
    []
  );
  return [state, setState] as const;
}
```

使用。注意 callback 的作用域链，callback 取到的 state 是旧的。

```ts
const Foo = () => {
  const [state, setState] = useCallbackState(0);
  function handleClick() {
    const nextState = state + 1;
    setState(nextState, () => console.log(nextState))
  }

  return (
    <button onClick={handleClick}>+</button>
  )
}

```

> [本博客](https://marsk6.github.io/) 所有文章除特别声明外，均采用 BY-NC-SA 许可协议。转载请注明出处！
