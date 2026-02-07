import { React, useEffect, useState } from 'react'
import Sidebar from './components/SideBar/Sidebar'
import Main from './components/Main/Main'
import Login from './components/Auth/login'
import { useContext } from 'react';
import { Context } from '../../Backend/context/context';
import AuthPage from './components/Auth/auth';



const App = () => {
  const { user } = useContext(Context);
  return (
    <>
      {
        user && user.emailVerified ?
          (
            <>
              <Sidebar />
              <Main />
            </>
          )
          : (

            <AuthPage />
          )
      }

    </>
  )
}

export default App