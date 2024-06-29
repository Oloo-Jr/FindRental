import React, { useEffect, useState } from 'react';
import logo from '../../Assets/rekebisha-logo-reverse.png'
import { auth } from '../../Database/config';
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';

export default function MainHeader() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  const handleSignOut = (e) => {
    e.preventDefault();
    auth
      .signOut()
      .then(() => {
        navigate('/login');
      })
      .catch(error => alert(error.message))
  }

  return (
    <div className='bg-[#17304a] flex items-center sm:px-20 px-6 py-4 justify-between' >
      <Link to='#'>
        <img src={logo} className='sm:h-12 h-8 w-auto' alt='Rekebisha' />
      </Link>

      {user && <div className='bg-red-600 text-white sm:text-sm text-[12px] rounded px-4 py-2 cursor-pointer font-medium flex gap-2' onClick={handleSignOut}>
        <div>Sign Out</div>
      </div>}

    </div>
  )
}