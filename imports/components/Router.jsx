import React from 'react';
import { createBrowserRouter, RouterProvider, useParams } from 'react-router-dom';
import Layout from './Layout.jsx';
import Dashboard from './Dashboard.jsx';
import Practices from './Practices.jsx';
import Login from './Login.jsx';
import WikiPage from './WikiPage.jsx';
import Dokumente from './Dokumente.jsx';
import Tournaments from './Tournaments.jsx';
import Tournament from './Tournament.jsx';

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
        <Tournaments />
      </Layout>
    ),
  },
  {
    path: '/turnier/:tournamentId',
    element: (
      <Layout>
        <Tournament />
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
  {
    path: '/dokumente',
    element: (
      <Layout>
        <Dokumente />
      </Layout>
    ),
  },
  {
    path: '/wasistultimate',
    element: (
      <Layout>
        <WikiPage name="WasIstUltimateFrisbee" />
      </Layout>
    ),
  },
  {
    path: '/infos',
    element: (
      <Layout>
        <WikiPage name="Kommunikation" />
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
