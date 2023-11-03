import React, { useState, useEffect } from 'react';
import './SignIn.css'
import Header from '../../Components/Header/Header';
import { Link, useNavigate } from 'react-router-dom';
import MainHeader from '../../Components/Header/Header';
import { auth } from '../../Database/config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = () => {
    auth
    .signInWithEmailAndPassword(email, password)
    .then(userCredentials => {
        const user = userCredentials.user;
        console.log( 'Logged in with:', user.email);
       })
       .catch(error => alert(error.message))
}

useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            navigate('/addproduct')
        }
    })
  
    return unsubscribe
  }, [])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div className='login'>
       <MainHeader/>

      <div className='loginBody'>
    
        <div className='loginTitle'>
            <h1>Welcome to Rekebisha Property</h1>
        </div>
        <div className='loginFormCard'>
            <h1 className='formTitle'>Sign In</h1>
            <form className='form'>
                <input className='input'
                value={email}
                onChange={(e)=> setEmail(e.target.value)}  
                placeholder='email'/>
                <div>
                  <div className='passinput'>
                <input className='input' 
                value={password}
                onChange={(e)=> setPassword(e.target.value)} 
                placeholder='password'
                type={showPassword ? 'text' : 'password'}
                />
                  <span
                            onClick={togglePasswordVisibility}
                            style={{ cursor: 'pointer', marginLeft: '10px', width:'5%' }}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'} {/* Eye icons */}
                    </span>
                    </div>
                <h6 className='forgotPassword'>Forgot password?</h6>
                </div>     
            </form>
            
            <button onClick={handleLogin} className='loginButton'>Sign In</button>
            
        </div>
        </div>


    </div>
  )
}
