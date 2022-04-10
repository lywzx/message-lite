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
    setAppState((appState) => {
      return {
        list: [...appState.list, app],
      };
    });

  const removeApp = (id: string) => {
    setAppState((appState) => {
      return {
        list: appState.list.filter((app) => app.id !== id),
      };
    });
  };

  const updateAppReady = (id: string) => {
    setAppState((appState) => {
      const idx = appState.list.findIndex((app) => app.id === id);
      if (idx > -1) {
        const list = appState.list.slice();
        const currentApp = list[idx];
        list.splice(idx, 1, {
          ...currentApp,
          isReady: true,
        });
        return {
          list,
        };
      }
      return appState;
    });
  };

  return { appState, addNewApp, removeApp, updateAppReady };
}

export const AppStore = createContainer(useAppStore);
