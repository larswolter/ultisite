import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './Layout.jsx';
import Dashboard from './Dashboard.jsx';
import Practices from './Practices.jsx';
import Login from './Login.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: '/anmelden',
    element: (
      <Layout>
        <Login />
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
        <Practices />
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
