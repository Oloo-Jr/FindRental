import React, { useState, useEffect, useRef } from 'react';
import MainHeader from '../../Components/Header/Header';
import { auth, db, storage } from '../../Database/config';
import firebase from 'firebase/app';
import {
    EyeIcon,
    PencilIcon,
    TrashIcon,
    PlusCircleIcon,
    HomeIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    ClockIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
    PhotoIcon
} from "@heroicons/react/24/solid";
import { useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import countiesData from '../../data/county.json';
import { propertyTypes } from '../../Components/propertyType';

const Home = () => {
    const navigate = useNavigate();
    const toast = useRef(null);
    const [business, setBusiness] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        occupied: 0,
        forSale: 0
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [modalImages, setModalImages] = useState([]);
    const [editLoading, setEditLoading] = useState(false);
    const [contactAttempts, setContactAttempts] = useState({});
    const [showContactsModal, setShowContactsModal] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [contactsLoading, setContactsLoading] = useState(false);

    // Edit form states
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        town: '',
        saleprice: '',
        rentprice: '',
        propertyType: '',
        availabilityType: '',
        bedrooms: '',
        selectedCounty: '',
        subcounties: '',
        images: []
    });
    const [counties, setCounties] = useState([]);
    const [filteredConstituencies, setFilteredConstituencies] = useState([]);

    useEffect(() => {
        setCounties(countiesData.County);
        auth.onAuthStateChanged((user) => {
            if (!user) {
                console.log("User not authenticated");
            } else {
                getBusinessDetails(user.uid);
            }
        });
    }, []);

    const getBusinessDetails = async (userId) => {
        try {
            const docRef = db.collection("RealEstate").doc(userId);
            const docSnapshot = await docRef.get();
            if (docSnapshot.exists) {
                setBusiness(docSnapshot.data());
                getPropertiesForBusiness(docRef);
            } else {
                console.log("Business details not found for the user.");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error fetching business details:", error);
            setIsLoading(false);
        }
    };

    const fetchContactAttempts = async (propertyId) => {
        if (!auth.currentUser) return;
        
        setContactsLoading(true);
        try {
          const attemptsRef = db
            .collection('RealEstate')
            .doc(auth.currentUser.uid)
            .collection('properties')
            .doc(propertyId)
            .collection('contactAttempts');
      
          const snapshot = await attemptsRef
            .orderBy('timestamp', 'desc')
            .get();
      
          const attempts = [];
          snapshot.forEach((doc) => {
            attempts.push({ id: doc.id, ...doc.data() });
          });
      
          setContactAttempts(prev => ({
            ...prev,
            [propertyId]: attempts
          }));
        } catch (error) {
          console.error('Error fetching contact attempts:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Load Failed',
            detail: 'Could not load contact attempts',
            life: 3000,
          });
        } finally {
          setContactsLoading(false);
        }
      };

    const getPropertiesForBusiness = async (businessRef) => {
        try {
            const propertiesRef = businessRef.collection("properties");
            const querySnapshot = await propertiesRef.get();
            const propertiesData = [];
            querySnapshot.forEach((doc) => {
                propertiesData.push({ id: doc.id, ...doc.data() });
            });
            setProperties(propertiesData);
            calculateStats(propertiesData);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching properties:", error);
            setIsLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const vacant = data.filter(p => p.vacant === true).length;     // truly vacant = available
        const occupied = data.filter(p => p.vacant === false).length;  // truly occupied
        const forSale = data.filter(p => p.availabilityType === 'For Sale').length;
        
        setStats({ total, vacant, occupied, forSale });
    };

    const togglePropertyVacancy = async (propertyId, currentVacant) => {
        try {
            const newVacant = !currentVacant;
            const propertyRef = db.collection("RealEstate").doc(auth.currentUser.uid)
                .collection("properties").doc(propertyId);
            
            await propertyRef.update({ vacant: newVacant });
            
            // Update local state
            const updatedProperties = properties.map(p => 
                p.id === propertyId ? { ...p, vacant: newVacant } : p
            );
            setProperties(updatedProperties);
            calculateStats(updatedProperties);

            toast.current?.show({
                severity: "success",
                summary: "Status Updated",
                detail: `Property marked as ${newVacant ? 'vacant' : 'occupied'}`,
                life: 3000,
            });
        } catch (error) {
            console.error("Error updating property vacancy:", error);
            toast.current?.show({
                severity: "error",
                summary: "Update Failed",
                detail: "Could not update property status",
                life: 3000,
            });
        }
    };

    const deleteProperty = async (propertyId) => {
        try {
            const propertyRef = db.collection("RealEstate").doc(auth.currentUser.uid)
                .collection("properties").doc(propertyId);
            
            await propertyRef.delete();
            
            // Update local state
            const updatedProperties = properties.filter(p => p.id !== propertyId);
            setProperties(updatedProperties);
            calculateStats(updatedProperties);
            setShowDeleteConfirm(null);

            toast.current?.show({
                severity: "success",
                summary: "Property Deleted",
                detail: "Property has been successfully deleted",
                life: 3000,
            });
        } catch (error) {
            console.error("Error deleting property:", error);
            toast.current?.show({
                severity: "error",
                summary: "Delete Failed",
                detail: "Could not delete property",
                life: 3000,
            });
        }
    };

    const openEditModal = (property) => {
        setEditingProperty(property);
        setEditForm({
            title: property.title || '',
            description: property.description || '',
            town: property.town || '',
            saleprice: property.saleprice || '',
            rentprice: property.rentprice || '',
            propertyType: property.propertyType || '',
            availabilityType: property.availabilityType || '',
            bedrooms: property.bedrooms || '',
            selectedCounty: property.selectedCounty || '',
            subcounties: property.subcounties || '',
            images: property.images || []
        });

        // Set filtered constituencies based on selected county
        if (property.selectedCounty) {
            const county = countiesData.County.find(c => c.county_name === property.selectedCounty);
            if (county) {
                setFilteredConstituencies(county.constituencies);
            }
        }

        setShowEditModal(true);
    };

    const handleEditFormChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));

        // Handle county change for constituencies
        if (field === 'selectedCounty') {
            if (!value) {
                setFilteredConstituencies([]);
                setEditForm(prev => ({ ...prev, subcounties: '' }));
                return;
            }

            const county = countiesData.County.find(c => c.county_name === value);
            if (county) {
                setFilteredConstituencies(county.constituencies);
            }
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const promises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve({
                        file: file,
                        url: reader.result,
                        name: file.name,
                        isNew: true
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises)
            .then(imageDataArray => {
                setEditForm(prev => ({
                    ...prev,
                    images: [...prev.images, ...imageDataArray]
                }));
            })
            .catch(error => {
                console.error('Error reading files:', error);
            });
    };

    const removeImage = (index) => {
        setEditForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const updateProperty = async () => {
        if (!editForm.title || !editForm.description || !editForm.bedrooms || 
            !editForm.propertyType || !editForm.availabilityType || 
            (!editForm.rentprice && !editForm.saleprice) || !editForm.town || 
            !editForm.selectedCounty || !editForm.subcounties) {
            toast.current?.show({
                severity: "error",
                summary: "Validation Error",
                detail: "Please fill in all required fields",
                life: 3000,
            });
            return;
        }

        setEditLoading(true);

        try {
            // Handle new images upload
            const newImages = editForm.images.filter(img => img.isNew);
            const existingImages = editForm.images.filter(img => !img.isNew);

            let uploadedUrls = [];
            if (newImages.length > 0) {
                const uploadPromises = newImages.map((imageFile) => {
                    return storage
                        .ref(`PostImage/${imageFile.name}`)
                        .put(imageFile.file)
                        .then((snapshot) => snapshot.ref.getDownloadURL());
                });

                uploadedUrls = await Promise.all(uploadPromises);
            }

            // Combine existing and new image URLs
            const allImageUrls = [
                ...existingImages,
                ...uploadedUrls.map(url => ({ url }))
            ];

            // Update property in Firestore
            const propertyRef = db.collection("RealEstate").doc(auth.currentUser.uid)
                .collection("properties").doc(editingProperty.id);

            await propertyRef.update({
                title: editForm.title,
                description: editForm.description,
                town: editForm.town,
                saleprice: editForm.saleprice,
                rentprice: editForm.rentprice,
                propertyType: editForm.propertyType,
                availabilityType: editForm.availabilityType,
                bedrooms: editForm.bedrooms,
                selectedCounty: editForm.selectedCounty,
                subcounties: editForm.subcounties,
                images: allImageUrls,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Update local state
            const updatedProperties = properties.map(p => 
                p.id === editingProperty.id ? { ...p, ...editForm, images: allImageUrls } : p
            );
            setProperties(updatedProperties);
            calculateStats(updatedProperties);

            toast.current?.show({
                severity: "success",
                summary: "Property Updated",
                detail: "Property has been successfully updated",
                life: 3000,
            });

            setShowEditModal(false);
            setEditingProperty(null);
        } catch (error) {
            console.error("Error updating property:", error);
            toast.current?.show({
                severity: "error",
                summary: "Update Failed",
                detail: "Could not update property",
                life: 3000,
            });
        } finally {
            setEditLoading(false);
        }
    };

    const openImageModal = (images, startIndex = 0) => {
        setModalImages(images || []);
        setCurrentImageIndex(startIndex);
        setShowImageModal(true);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => 
            prev === modalImages.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => 
            prev === 0 ? modalImages.length - 1 : prev - 1
        );
    };

    const redirectToView = (id) => {
        console.log(`Navigate to view property: ${id}`);
        // navigate(`/view-property/${id}`);
    };

    const toAddPropertyPage = () => {
        navigate('/add-property');
    };

    const getStatusColor = (vacant) => {
        return vacant ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200';
    };

    const getStatusIcon = (vacant) => {
        return vacant ? 
            <XCircleIcon className="w-4 h-4" /> : 
            <CheckCircleIcon className="w-4 h-4" />;
    };

    const StatCard = ({ icon, title, value, subtitle, color }) => (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${color === 'text-[#1d3c5c]' ? 'bg-[#1d3c5c]' : 'bg-gray-100'}`}>
                    {React.cloneElement(icon, { 
                        className: `w-6 h-6 ${color === 'text-[#1d3c5c]' ? 'text-white' : 'text-gray-600'}` 
                    })}
                </div>
            </div>
        </div>
    );

    const PropertyCard = ({ property }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="h-48 relative overflow-hidden cursor-pointer" onClick={() => openImageModal(property.images, 0)}>
                {property.images && property.images.length > 0 ? (
                    <img 
                        src={property.images[0].url} 
                        alt={property.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#1d3c5c] to-[#2d4c6c] flex items-center justify-center">
                        <PhotoIcon className="w-16 h-16 text-white opacity-50" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(property.vacant)} flex items-center gap-1`}>
                        {getStatusIcon(property.vacant)}
                        {property.vacant ? 'Vacant' : 'Occupied'}
                    </span>
                </div>
                <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white bg-opacity-90 text-[#1d3c5c] rounded-full text-xs font-semibold">
                        {property.availabilityType}
                    </span>
                </div>
                {property.images && property.images.length > 1 && (
                    <div className="absolute bottom-4 right-4">
                        <span className="px-2 py-1 bg-black bg-opacity-60 text-white rounded-full text-xs">
                            +{property.images.length - 1} more
                        </span>
                    </div>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-lg mb-1">{property.title}</h3>
                    <p className="text-white text-sm opacity-90 flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {property.town}, {property.selectedCounty}
                    </p>
                </div>
            </div>
            
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {property.propertyType}
                    </span>
                    <span className="text-sm text-gray-600">{property.subcounties}</span>
                </div>
                
                <div className="space-y-2 mb-6">
                    {property.bedrooms && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Bedrooms</span>
                            <span className="font-semibold text-[#1d3c5c]">{property.bedrooms}</span>
                        </div>
                    )}
                    {property.rentprice && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Monthly Rent</span>
                            <span className="font-semibold text-[#1d3c5c]">KSh {parseInt(property.rentprice).toLocaleString()}</span>
                        </div>
                    )}
                    {property.saleprice && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Selling Price</span>
                            <span className="font-semibold text-[#1d3c5c]">KSh {parseInt(property.saleprice).toLocaleString()}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPropertyId(property.id);
                        fetchContactAttempts(property.id);
                        setShowContactsModal(true);
                    }}
                    className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                    title="View Contact Attempts"
                    >
                    <span>Leads</span>
                    <ChartBarIcon className="w-4 h-4" />
                    <span className="bg-white text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">
                        {contactAttempts[property.id]?.length || 0}
                    </span>
                    </button>
                    <button
                        onClick={() => openEditModal(property)}
                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                        title="Edit Property"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => togglePropertyVacancy(property.id, property.vacant)}
                        className={`p-2 rounded-lg transition-colors ${
                            property.vacant 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        }`}
                        title={property.vacant ? 'Mark as Occupied' : 'Mark as Vacant'}
                    >
                        {property.vacant ? 
                            <CheckCircleIcon className="w-4 h-4" /> : 
                            <XCircleIcon className="w-4 h-4" />
                        }
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(property.id)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        title="Delete Property"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <MainHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1d3c5c]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toast ref={toast} position="bottom-left" />
            <MainHeader />
            
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#1d3c5c] to-[#2d4c6c] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                {business?.businessname || 'Property Dashboard'}
                            </h1>
                            <p className="text-blue-100 flex items-center gap-2">
                                <BuildingOfficeIcon className="w-5 h-5" />
                                Rekebisha Property Agent
                            </p>
                        </div>
                        <button
                            onClick={toAddPropertyPage}
                            className="bg-white text-[#1d3c5c] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            Add Property
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={<HomeIcon />}
                        title="Total Properties"
                        value={stats.total}
                        color="text-[#1d3c5c]"
                    />
                    <StatCard
                    icon={<CheckCircleIcon />}
                    title="Occupied"
                    value={stats.occupied}
                    color="text-green-600"
                    />
                    <StatCard
                    icon={<XCircleIcon />}
                    title="Vacant"
                    value={stats.vacant}
                    color="text-red-600"
                    />
                    <StatCard
                        icon={<CurrencyDollarIcon />}
                        title="For Sale"
                        value={stats.forSale}
                        color="text-blue-600"
                    />
                </div>
            </div>

            {/* Properties Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Your Properties</h2>
                </div>

                {properties.length === 0 ? (
                    <div className="text-center py-16">
                        <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
                        <p className="text-gray-600 mb-6">Start building your portfolio by adding your first property</p>
                        <button
                            onClick={toAddPropertyPage}
                            className="bg-[#1d3c5c] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2d4c6c] transition-colors inline-flex items-center gap-2"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            Add Your First Property
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Property Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-900">Edit Property</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Property Type</label>
                                    <select
                                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                        value={editForm.propertyType}
                                        onChange={(e) => handleEditFormChange('propertyType', e.target.value)}
                                        required
                                    >
                                        <option value="">Select a Type</option>
                                        {propertyTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Property Name</label>
                                    <InputText
                                        value={editForm.title}
                                        onChange={(e) => handleEditFormChange('title', e.target.value)}
                                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                        placeholder="Name of the building"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Bedrooms</label>
                                    <InputText
                                        value={editForm.bedrooms}
                                        onChange={(e) => handleEditFormChange('bedrooms', e.target.value)}
                                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                        placeholder="Number of bedrooms"
                                        keyfilter="num"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Availability</label>
                                    <select
                                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                        value={editForm.availabilityType}
                                        onChange={(e) => handleEditFormChange('availabilityType', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Availability</option>
                                        <option>For Sale</option>
                                        <option>For Rent</option>
                                    </select>
                                </div>

                                {editForm.availabilityType === "For Sale" && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Sale Price (KSH)</label>
                                        <InputText
                                            value={editForm.saleprice}
                                            onChange={(e) => handleEditFormChange('saleprice', e.target.value)}
                                            className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                            placeholder="Sale price"
                                            keyfilter="money"
                                            required
                                        />
                                    </div>
                                )}

                                {editForm.availabilityType === "For Rent" && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Rent Price Monthly (KSH)</label>
                                        <InputText
                                            value={editForm.rentprice}
                                            onChange={(e) => handleEditFormChange('rentprice', e.target.value)}
                                            className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                            placeholder="Monthly rent"
                                            keyfilter="money"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Town</label>
                                    <InputText
                                        value={editForm.town}
                                        onChange={(e) => handleEditFormChange('town', e.target.value)}
                                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                        placeholder="Town location"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">County</label>
                                    <select
                                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                        value={editForm.selectedCounty}
                                        onChange={(e) => handleEditFormChange('selectedCounty', e.target.value)}
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
                                    <label className="text-sm font-medium text-gray-700">Sub-County</label>
                                    <select
                                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                        value={editForm.subcounties}
                                        onChange={(e) => handleEditFormChange('subcounties', e.target.value)}
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

                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
                                <InputTextarea
                                    value={editForm.description}
                                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                    placeholder="Property description"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-700 block mb-2">Property Images</label>
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/png, image/jpeg"
                                    multiple
                                    className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#1d3c5c] focus:border-transparent"
                                />
                                
                                {editForm.images && editForm.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        {editForm.images.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={image.url}
                                                    alt={`Property image ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <Button
                                    label="Update Property"
                                    icon="pi pi-check"
                                    loading={editLoading}
                                    onClick={updateProperty}
                                    className="px-6 py-2 bg-[#1d3c5c] text-white rounded-lg hover:bg-[#2d4c6c] transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Gallery Modal */}
            {showImageModal && modalImages.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="relative">
                            <img
                                src={modalImages[currentImageIndex]?.url}
                                alt={`Property image ${currentImageIndex + 1}`}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            />
                            
                            {modalImages.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
                                    >
                                        <ChevronLeftIcon className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
                                    >
                                        <ChevronRightIcon className="w-6 h-6" />
                                    </button>
                                </>
                            )}
                        </div>

                        {modalImages.length > 1 && (
                            <div className="flex justify-center mt-4 gap-2">
                                {modalImages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-3 h-3 rounded-full transition-all ${
                                            index === currentImageIndex 
                                                ? 'bg-white' 
                                                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="text-center mt-4">
                            <span className="text-white text-sm">
                                {currentImageIndex + 1} of {modalImages.length}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <div className="text-center">
                            <TrashIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Property?</h3>
                            <p className="text-gray-600 mb-6">This action cannot be undone. The property will be permanently deleted.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteProperty(showDeleteConfirm)}
                                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Attempts Modal */}
            {showContactsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">
                    Contact Attempts
                    </h3>
                    <button
                    onClick={() => setShowContactsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    >
                    <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {contactsLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d3c5c]"></div>
                    </div>
                    ) : contactAttempts[selectedPropertyId]?.length > 0 ? (
                    <div className="space-y-4">
                        {contactAttempts[selectedPropertyId].map((attempt) => (
                        <div
                            key={attempt.id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium text-gray-900">
                                {attempt.clientName || 'Anonymous'}
                                </p>
                                {attempt.clientEmail && (
                                <p className="text-sm text-gray-600">{attempt.clientEmail}</p>
                                )}
                                {attempt.clientPhone && (
                                <p className="text-sm text-gray-600">{attempt.clientPhone}</p>
                                )}
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {attempt.type === 'call' ? '📞 Call' : '✉️ Email'}
                            </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {attempt.timestamp?.toDate ? 
                                attempt.timestamp.toDate().toLocaleString() : 
                                'Unknown time'}
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center py-8 text-gray-500">
                        <ChartBarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>No contact attempts yet for this property.</p>
                    </div>
                    )}
                </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default Home;