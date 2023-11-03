import React, { useState, useEffect } from 'react';
import './AddProduct.css'
import {BsImageFill} from 'react-icons/bs'
import {GrTextAlignFull} from 'react-icons/gr'
import { db, storage, auth } from '../../Database/config';
import firebase from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import MainHeader from '../../Components/Header/Header';

export default function AddProduct() {

    const navigate = useNavigate();

    const [images, setImages] = useState([]);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState(0);
    const [isChecked, setIsChecked] = useState(false);
    const [realEstateName, setRealEstateName] = useState("");
    const [agentcounty, setAgentcounty] = useState("");
    const [agentnumber, setAgentnumber] = useState("")

    const fetchUserData = () => {
      db.collection('RealEstate').doc(auth.currentUser.uid).get()
      .then((doc) => {
        if (doc.exists) {
          // Data of the logged-in user
          const userData = doc.data();
          const realEstateName = doc.data().businessname;
          const agentcounty = doc.data().selectedCounty;
          const agentnumber = doc.data().phonenumber;
          setAgentcounty(agentcounty);
          setAgentnumber(agentnumber);
          setRealEstateName(realEstateName);
          console.log('User data:', userData);
        } else {
          console.log('No such document!');
        }
      })
  } 

  useEffect(() => {
    fetchUserData();
  }, [])
  

    const handleImageChange = (e) => {
      const files = Array.from(e.target.files); // Multiple files selected
      const urls = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          // You may use this URL for image preview if needed
          const imageURL = reader.result;
          urls.push(imageURL);
          if (urls.length === files.length) {
            setImages(urls);
          }
        };
        reader.readAsDataURL(file);
      });
    };
  
    const handleCheckboxChange = (e) => {
      setIsChecked(e.target.checked);
    };
  
    const handleUpload = () => {
      // Upload images to storage (if needed) and get their URLs
      const imageUrls = [];
      const uploadPromises = images.map((imageFile) => {
        // Use storage to upload images and get their URLs
        // For example, using Firebase Storage
        return storage.ref(`images/${imageFile.name}`).put(imageFile).then((snapshot) => {
          return snapshot.ref.getDownloadURL();
        });
      });
  
      Promise.all(uploadPromises)
        .then((downloadURLs) => {
          imageUrls.push(...downloadURLs);
  
          // Store imageUrls along with other data in Firestore
          return db.collection('products').add({
            title: title,
            price: price,
            description: description,
            forSale: isChecked,
            images: imageUrls,
            realEstateName: realEstateName,
            agentcounty: agentcounty,
            agentnumber: agentnumber
            // Other product details
          });
        })
        .then((docRef) => {
          console.log('Product added with ID: ', docRef.id);
          navigate('/products'); // Redirect after successful upload
        })
        .catch((error) => {
          console.error('Error adding product: ', error);
        });
    };
  

  
  return (
    <div className='uploadScreen'>
        <MainHeader />
        <div className='uploadBody'>
            <div className='uploadCard'>
                <h1 className='uploadTitle'>Add Property</h1>
                <div className='uploadDescription'>
                    <GrTextAlignFull/>
                    <textarea value={title} onChange={(e) => setTitle(e.target.value)} 
                    className='uploadTextarea' placeholder=' Property Title' />
                </div>
                <div className='uploadImage'>
                    <h5 className='ImageWord'><BsImageFill /> Add Images</h5>
                    <input onChange={handleImageChange} className='uploadImageBtn' type='file' multiple  accept='image/*'/>
                </div>
                <div className='uploadDescription'>
                    <GrTextAlignFull/>
                    <textarea value={price} onChange={(e) => setPrice(e.target.value)} 
                    className='uploadTextarea' placeholder='Price'/>
                </div>
                <div className='uploadDescription'>
                    <GrTextAlignFull/>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} 
                    className='uploadTextarea' placeholder='Description'/>
                </div>
                <div className='uploadDescription'>
                    <label className='uploadTextarea'>
                        <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={handleCheckboxChange}
                        />
                       For Sale: 
                    </label>
                    </div>
                <button className='uploadButton' onClick={handleUpload}  >Upload Product</button>
            </div>
        </div>
    </div>
  )
}
