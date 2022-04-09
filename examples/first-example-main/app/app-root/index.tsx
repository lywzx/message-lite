import { SappContainer } from '../sapp-container';
import React from 'react';
import { AppStore } from '../../store';

export function AppRoot() {
  const { appState } = AppStore.useContainer();

  return (
    <>
      {appState.list.map((app) => {
        // eslint-disable-next-line react/jsx-no-undef
        return <SappContainer key={app.id} app={app} />;
      })}
    </>
  );
}
