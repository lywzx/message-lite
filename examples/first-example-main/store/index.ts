import { createContainer } from 'unstated-next';
import { useState } from 'react';

export interface IState {
  list: IAppInfo[];
}

export interface IAppInfo {
  id: string;
  url: string;
  isReady: boolean;
}

function useAppStore(
  initialState: IState = {
    list: [],
  }
) {
  const [appState, setAppState] = useState(initialState);

  const addNewApp = (app: IAppInfo) =>
    setAppState({
      list: [...appState.list, app],
    });

  const removeApp = (id: string) => {
    setAppState({
      list: appState.list.filter((app) => app.id !== id),
    });
  };

  const updateAppReady = (id: string) => {
    const idx = appState.list.findIndex((app) => app.id === id);
    if (idx > -1) {
      const list = [...appState.list];
      const currentApp = list[idx];
      list.splice(idx, 1, {
        ...currentApp,
        isReady: true,
      });
      setAppState({
        list,
      });
    }
  };

  return { appState, addNewApp, removeApp, updateAppReady };
}

export const Counter = createContainer(useAppStore);
