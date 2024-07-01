import React, { useState, useEffect, useRef } from 'react';
import { db, storage, auth } from '../../Database/config';
import firebase from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import MainHeader from '../../Components/Header/Header';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import countiesData from '../../data/county.json';
import { InputTextarea } from 'primereact/inputtextarea';

export default function AddProperty() {
  const navigate = useNavigate();
  const toast = useRef(null);

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [town, setTown] = useState("");
  const [saleprice, setSalePrice] = useState(0);
  const [rentprice, setRentPrice] = useState(0);
  const [propertyType, setPropertyType] = useState("");
  const [availabilityType, setAvailabilityType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [counties, setCounties] = useState([]);
  const [subcounties, setSubCounties] = useState("");
  const [selectedCounty, setSelectedCounty] = useState('');
  const [filteredConstituencies, setFilteredConstituencies] = useState([]);

  const handleCountyChange = (event) => {
    const selectedCounty = event.target.value;
    setSelectedCounty(selectedCounty);

    if (!selectedCounty) {
      setFilteredConstituencies("");
      setSubCounties("");
      return;
    }

    const filteredConstituencies = countiesData.County.find(
      (county) => county.county_name === selectedCounty
    ).constituencies;

    setFilteredConstituencies(filteredConstituencies);
  };

  useEffect(() => {
    setCounties(countiesData.County);
  }, []);


  const handleSubCountyChange = (event) => {
    setSubCounties(event.target.value);
  };

  useEffect(() => {

    const unsubscribe = auth.onAuthStateChanged(user => {

    });

    return () => unsubscribe();

  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            file: file,
            url: reader.result,
            name: file.name
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(imageDataArray => {
        setImages(imageDataArray);
      })
      .catch(error => {
        console.error('Error reading files:', error);
      });
  };

  const handleUpload = (e) => {
    e.preventDefault();

    if (images.length === 0 || !title || !description || !bedrooms || !propertyType || !availabilityType || (!rentprice && !saleprice) || !town || !selectedCounty || !subcounties) {
      alert("Please fill in all fields before uploading.");
      return;
    }

    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      alert("User is not authenticated or `auth.currentUser` is null.");
      return;
    }

    const uploadPromises = images.map((imageFile) => {
      if (!imageFile.file || !imageFile.url) {
        return Promise.reject(new Error("Invalid image file."));
      }

      if (!imageFile.name || typeof imageFile.name !== 'string') {
        return Promise.reject(new Error("Image file name is missing or invalid."));
      }

      return storage
        .ref(`PostImage/${imageFile.name}`)
        .put(imageFile.file)
        .then((snapshot) => snapshot.ref.getDownloadURL());
    });

    Promise.all(uploadPromises)
      .then((downloadURLs) => {
        const imageUrls = downloadURLs.map(url => ({ url }));

        if (imageUrls.length > 0 && title && description && bedrooms && propertyType && availabilityType && (rentprice || saleprice) && town && selectedCounty && subcounties) {
          db.collection('RealEstate').doc(user.uid).collection('products').add({
            propertyType: propertyType,
            availabilityType: availabilityType,
            title: title,
            saleprice: saleprice,
            rentprice: rentprice,
            description: description,
            images: imageUrls,
            town: town,
            bedrooms: bedrooms,
            subcounties: subcounties,
            selectedCounty: selectedCounty,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

          toast.current.show({
            severity: "success",
            summary: "Property Saved",
            detail: "Property record created successfully",
            life: 3000,
          });

          setLoading(false);
          return setTimeout(() => {
            navigate("/");
          }, 1000);
        } else {
          setLoading(false);
          toast.current.show({
            severity: "error",
            summary: "Action Failed",
            detail: "Please fill all fields before creating",
            life: 3000,
          });
        }
      })
      .catch((error) => {
        setLoading(false);
        toast.current.show({
          severity: "error",
          summary: "Error adding property",
          detail: error.message,
          life: 3000,
        });
      });
  };

  const cancelUpload = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col">
      <Toast ref={toast} position="bottom-left" />
      <MainHeader />
      <div className="flex gap-2 w-full justify-center text-2xl capitalize font-bold py-6">
        Add a Property/Rental
      </div>
      <div className="bg-gray-100 px-12 py-6 w-full">
        <div className="grid sm:grid-cols-4 grid-cols-1 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm">Property Type</label>
            <select
              className="border border-gray-200 px-2 py-2 rounded"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              required
            >
              <option value="">Select a Type</option>
              <option>Apartment</option>
              <option>Mansion</option>
              <option>Townhouse</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm">Property Name</label>
            <InputText
              value={title}
              onChange={(e) => {
                setNameError(false);
                setTitle(e.target.value);
              }}
              className="border border-gray-200 px-2 py-2 rounded"
              placeholder="Name of the building"
              required
            />
            {nameError && (
              <div className="text-xs text-red-700 error">
                *Name of the product required
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm">Bedrooms</label>
            <InputText
              value={bedrooms}
              onChange={(e) => {
                setBedrooms(e.target.value);
              }}
              className="border border-gray-200 px-2 py-2 rounded capitalize"
              placeholder="Bedrooms"
              keyfilter="num"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm">Availability</label>
            <select
              className="border border-gray-200 px-2 py-2 rounded"
              value={availabilityType}
              onChange={(e) => setAvailabilityType(e.target.value)}
              required
            >
              <option value="">Select Availability</option>
              <option>For Sale</option>
              <option>For Rent</option>
            </select>
          </div>
          {availabilityType === "For Sale" && <div className="flex flex-col gap-1">
            <label className="text-sm">Sale Price (KSH)</label>
            <InputText
              value={saleprice}
              onChange={(e) => {
                setSalePrice(e.target.value);
              }}
              className="border border-gray-200 px-2 py-2 rounded capitalize"
              placeholder="Price for rent or sale"
              keyfilter="money"
              required
            />
            {false && (
              <div className="text-xs text-red-700 error">
                *Price of the product required
              </div>
            )}
          </div>}
          {availabilityType === "For Rent" && <div className="flex flex-col gap-1">
            <label className="text-sm">Rent Price Monthly (KSH)</label>
            <InputText
              value={rentprice}
              onChange={(e) => {
                setRentPrice(e.target.value);
              }}
              className="border border-gray-200 px-2 py-2 rounded capitalize"
              placeholder="Price for rent or sale"
              keyfilter="money"
              required
            />
            {false && (
              <div className="text-xs text-red-700 error">
                *Price of the product required
              </div>
            )}
          </div>}
          <div className="flex flex-col gap-1">
            <label className="text-sm">Upload Images</label>
            <InputText
              className="border border-gray-200 px-2 py-2 rounded capitalize"
              type="file"
              onChange={handleImageChange}
              accept="image/png, image/jpeg"
              multiple
              placeholder="Upload Image"
              required
            />
            {imageError && (
              <div className="text-xs text-red-700 error">
                *Product Image Required
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm">Town</label>
            <InputText
              value={town}
              onChange={(e) => setTown(e.target.value)}
              className="border border-gray-200 px-2 py-2 rounded capitalize"
              placeholder="Town location"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm">County</label>
            <select
              className="border border-gray-200 px-2 py-2 rounded"
              value={selectedCounty}
              onChange={handleCountyChange}
              required
            >
              <option value="">-- Select County --</option>
              {counties && counties.map((county) => (
                <option key={county.county_name} value={county.county_name}>
                  {county.county_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm">Sub-County</label>
            <select
              className="border border-gray-200 px-2 py-2 rounded"
              value={subcounties}
              onChange={handleSubCountyChange}
              required
            >
              <option value="">-- Select Sub-County --</option>
              {filteredConstituencies && filteredConstituencies.map((constituency) => (
                <option key={constituency.constituency_name} value={constituency.constituency_name}>
                  {constituency.constituency_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex w-full my-5">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm">Description</label>
            <InputTextarea
              value={description}
              onChange={(e) => {
                setDescriptionError(false);
                setDescription(e.target.value);
              }}
              className="border border-gray-200 px-2 py-2 rounded"
              placeholder="Description"
              required
              rows={5}
              cols={30}
            />
            {descriptionError && (
              <div className="text-xs text-red-700 error">
                *Description of the product required
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between px-12 mt-6">
        <button
          onClick={cancelUpload}
          className="bg-gray-400 justify-end flex text-white rounded px-4 py-3 font-medium gap-2"
        >
          Cancel
        </button>
        <div className="bg-black justify-end flex text-white rounded px-4 py-3 font-medium gap-2">
          <Button
            label="Create Property"
            icon="pi pi-check"
            loading={loading}
            onClick={handleUpload}
          />
        </div>
      </div>
    </div>
  );
}
