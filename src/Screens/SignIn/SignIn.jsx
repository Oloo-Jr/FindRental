import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      .catch(error => alert(error.message))
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        navigate('/');
      }
    });
    return unsubscribe;
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div className='min-h-screen'>
      <MainHeader />
      <div className='flex flex-col my-12 items-center justify-center'>
        <div className='sm:w-1/3 w-full'>
          <form className='flex flex-col items-start gap-2 w-full bg-gray-100 shadow rounded py-4 px-6'>
            <h1 className='py-2 font-semibold text-xl'>Sign In</h1>
            <label className='text-sm'>Email Address</label>
            <input className='w-full bg-gray-200 text-black p-2 rounded border border-gray-600'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Email Address' />
            <div className='flex items-start gap-2 flex-col w-full'>
              <label className='text-sm'>Password</label>
              <div className='flex items-center w-full'>
                <input className='w-full bg-gray-200 text-black p-2 rounded border border-gray-600'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='password'
                  type={showPassword ? 'text' : 'password'}
                />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <input className='w-4 h-4' type='checkbox' onChange={togglePasswordVisibility} />
              <label htmlFor="ingredient1" className="ml-2 text-sm">Show Password</label>
            </div>
          </form>

          <button onClick={handleLogin} className='w-full bg-[#17304a] text-white rounded mt-4 py-2 hover:shadow'>Sign In</button>

        </div>
      </div>


    </div>
  )
}
