import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import MainHeader from '../../Components/Header/Header';
import { auth, db } from '../../Database/config';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";


const Home = () => {
    const navigate = useNavigate();

    useEffect(() => {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate("/login");
            } else {
                // 
            }
        });
    }, []);

    

    return (
        <div className="flex flex-col">
            <MainHeader />
            
        </div>
    );
}

export default Home;