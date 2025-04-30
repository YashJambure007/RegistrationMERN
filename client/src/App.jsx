import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import Signup from './components/Signup'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Home from './components/Home'
import ForgotPass from './components/ForgotPass'
import ResetPassword from './components/ResetPassword'

function App() { 

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Signup/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/home' element={<Home/>}/>
          <Route path='/forgotpassword' element={<ForgotPass/>}/>
          <Route path='/reset_password/:id/:token' element={<ResetPassword/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
