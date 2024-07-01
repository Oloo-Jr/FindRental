import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'primeicons/primeicons.css';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import Login from './Screens/SignIn/SignIn';
import Home from './Screens/Home/Home';
import AddProperty from './Screens/AddProperty/AddProperty';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/add-property" element={<AddProperty />} />
        {/* <Route path="/view-product/:id" element={<ViewProduct />} /> */}
        {/* <Route path="/edit-product/:id" element={<EditProduct />} /> */}
        {/* <Route path="*" element={< Error404 />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
