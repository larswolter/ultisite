import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './Layout.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <div>Aktuelles</div>
      </Layout>
    ),
  },
  {
    path: '/turniere',
    element: (
      <Layout>
        <div>Turniere</div>
      </Layout>
    ),
  },
  {
    path: '/training',
    element: (
      <Layout>
        <div>Training</div>
      </Layout>
    ),
  },
]);

const Router = () => {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
};

export default Router;
