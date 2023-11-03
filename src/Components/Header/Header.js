import React,{useState} from 'react';
import logo from '../../Assets/rekebisha-logo-reverse 1.png'
import './Header.css'
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../../Database/config';


export default function MainHeader() {

  const location = useLocation();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOrder, setIsDropdownOrder] = useState(false);
  const [nestedDropdownIndex, setNestedDropdownIndex] = useState(null);

  const isHomePage = location.pathname === '/';

  const toggleDropdown = (index) => {
    if (nestedDropdownIndex === index) {
      setNestedDropdownIndex(null);
    } else {
      setNestedDropdownIndex(index);
    }
  };
  const handleSignOut = (e) => {
    e.preventDefault();

    auth
    .signOut()
    .then(() => {
      window.location.href = '/';
    })
    .catch(error => alert(error.message))
  }


  return (
    <div className='navigationBar' >
      <Link to='/homescreen'>
        <img src={logo} alt="My Image" style={{ maxWidth: '50%', height: '70%', cursor:'pointer', paddingLeft:'50px', margin: '10px',
      '@media (max-width: 768px)': {
        maxWidth: '100%',
        height: 'auto',
        paddingLeft: '10px', // Adjust the padding for smaller screens
        margin:"0px"
      },
      }}  />
      </Link>
        
      {!isHomePage && ( 
        <div className='navigationButtons'>
            {/*}
            <nav>
            <div className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
          <a href="#" className="dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            Agents
          </a>
          {isDropdownOpen && (
            <div className="dropdown-content">
              <ul>
                <li>
                  <a href="#" onClick={() => toggleDropdown(0)}>Register</a>
                  {nestedDropdownIndex === 0 && (
                    <div className="nested-dropdown-content">
                      <ul>
                        <Link to='/fundisignup'> <li>Fundi</li></Link>
                        <Link to='/dotdotsignup' ><li>DotDot</li></Link>
                        <Link to='/materialsignup' ><li>Buy Materials</li></Link>
                      </ul>
                    </div>
                  )}
                </li>
                <li>
                <a href="#" onClick={() => toggleDropdown(0)}>Delete/Disable</a>
                  {nestedDropdownIndex === 0 && (
                    <div className="nested-dropdown-content">
                      <ul>
                        <li>Fundi</li>
                        <li>DotDot</li>
                        <li>Hustler</li>
                      </ul>
                    </div>
                  )}
                </li>
              </ul>
            </div>
          )}
        </div>
            </nav>
                  */}
            
           {/*        
            <nav>
            <div className={`dropdown ${isDropdownOrder ? 'open' : ''}`}>
          <a href="#" className="dropdown-trigger" onClick={() => setIsDropdownOrder(!isDropdownOrder)}>
            Orders
          </a>
          {isDropdownOrder && (
            <div className="dropdown-content">
              <ul>
                <li>
                  <Link to='/fundiorders'>Fundi</Link>
                  </li>
                <li>DotDot </li>
              </ul>
            </div>
          )}
        </div>
            </nav>
          */}

            <input style={input} type="search"  placeholder="Search a Fundi" />
          
           <nav>
              <button 
              style={{ color:"white",
               fontFamily:"Lexend",
                fontSize:"15px",
                 border:"none",
                  borderRadius:'5px',
                   background:'red',
                    height:'35px',
                     cursor:'pointer'
                     }} 
              onClick={handleSignOut}       
            >Sign Out</button>
            </nav>
          
        </div>
      )}
        {/*Menu Icon for small screens*/}
        
    </div>
  )
}

const input = {
    padding: '5px',
    border: '1px solid #17304A',
    borderRadius: '4px',
    margin: '5px',
    boxSizing: 'border-box', 
    width:'28%',
  };

  const icons ={
    color:"green",
    justifyContents:"space-between"
  }