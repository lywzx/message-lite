export const CHILD_FIRST_APP_ID = 'com.example.first.child-1';

export const CHILD_SECOND_APP_ID = 'com.example.first.child-2';

export const EXAMPLE_ASYNC_APP_ID = 'com.example.async-app';

export const ALL_APP_INFOS = [
  {
    id: CHILD_FIRST_APP_ID,
    url: '/first-example-child-1',
  },
  {
    id: CHILD_SECOND_APP_ID,
    url: '/first-example-child-2',
  },
  {
    id: EXAMPLE_ASYNC_APP_ID,
    url: '',
    html: '/example-async-app',
  },
].map((it) => {
  return {
    ...it,
    url: `${it.url}?id=${it.id}`,
  };
});
