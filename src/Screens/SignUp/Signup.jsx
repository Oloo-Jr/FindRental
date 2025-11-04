import React, { useEffect, useState } from 'react';
import { User, Building2, Phone, Mail, MapPin, CreditCard, FileText, ChevronDown, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { auth } from '../../Database/config';
import { useNavigate } from 'react-router-dom';
import { createRentalDocument } from '../../Database/dbmethods';
import countiesData from '../../data/county.json';

// Input component defined outside to prevent re-creation
const InputField = ({ 
    icon: Icon, 
    placeholder, 
    value, 
    onChange, 
    error, 
    type = "text",
    field,
    ...props 
}) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            <Icon size={20} color="#1d3c5c" />
        </div>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            data-field={field}
            className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent ${
                error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
            }`}
            {...props}
        />
        {error && (
            <div className="flex items-center mt-2 text-red-500 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {error}
            </div>
        )}
    </div>
);

// Select component defined outside to prevent re-creation
const SelectField = ({ 
    icon: Icon, 
    placeholder, 
    value, 
    onChange, 
    options, 
    error,
    field,
    ...props 
}) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            <Icon size={20} />
        </div>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            <ChevronDown size={20} />
        </div>
        <select
            value={value}
            onChange={onChange}
            data-field={field}
            className={`w-full pl-12 pr-10 py-4 border-2 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent appearance-none ${
                error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
            }`}
            {...props}
        >
            <option value="">{placeholder}</option>
            {options.map((option, index) => (
                <option key={index} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        {error && (
            <div className="flex items-center mt-2 text-red-500 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {error}
            </div>
        )}
    </div>
);

export default function RentalSignup() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        businessname: "",
        ownersname: "",
        category: "",
        businessregistrationnumber: "",
        email: "",
        idnumber: "",
        phonenumber: "",
        wphonenumber: "",
        selectedCounty: "",
        subcounties: "",
        latitude: "",
        longitude: ""
    });
    
    const [filteredConstituencies, setFilteredConstituencies] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('detecting');

    // Firebase auth state listener
    // useEffect(() => {
    //     const unsubscribe = auth.onAuthStateChanged(user => {
    //         if (!user) {
    //             navigate('/');
    //         }
    //     });
      
    //     return unsubscribe;
    // }, [navigate]);

    // Single event handler for all form inputs
    const handleFormChange = (e) => {
        const field = e.target.dataset.field;
        const value = e.target.value;
        
        // Update form data
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Special handling for county selection
        if (field === 'selectedCounty') {
            const county = countiesData.County.find(c => c.county_name === value);
            setFilteredConstituencies(county ? county.constituencies : []);
            // Reset subcounty when county changes
            setFormData(prev => ({
                ...prev,
                selectedCounty: value,
                subcounties: ''
            }));
        }
    };

    // Get user location
    useEffect(() => {
        const getLocation = async () => {
            try {
                if (navigator.geolocation) {
                    setLocationStatus('detecting');
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 10000,
                            enableHighAccuracy: true
                        });
                    });
                    
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({ 
                        ...prev, 
                        latitude: latitude.toString(), 
                        longitude: longitude.toString() 
                    }));
                    setLocationStatus('success');
                } else {
                    setLocationStatus('error');
                }
            } catch (error) {
                setLocationStatus('error');
                console.error('Error getting location:', error);
            }
        };

        getLocation();
    }, []);

    // Validation with enhanced checks
    const validateStep = (step) => {
        const newErrors = {};
        
        if (step === 1) {
            if (!formData.businessname.trim()) newErrors.businessname = 'Business name is required';
            if (!formData.ownersname.trim()) newErrors.ownersname = 'Owner name is required';
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }
        
        if (step === 2) {
            if (!formData.phonenumber.trim()) {
                newErrors.phonenumber = 'Phone number is required';
            } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.phonenumber.replace(/\s/g, ''))) {
                newErrors.phonenumber = 'Please enter a valid phone number';
            }
            
            if (!formData.wphonenumber.trim()) {
                newErrors.wphonenumber = 'WhatsApp number is required';
            } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.wphonenumber.replace(/\s/g, ''))) {
                newErrors.wphonenumber = 'Please enter a valid WhatsApp number';
            }
            
            if (!formData.idnumber.trim()) {
                newErrors.idnumber = 'ID number is required';
            } else if (!/^[0-9]{7,8}$/.test(formData.idnumber)) {
                newErrors.idnumber = 'Please enter a valid Kenyan ID number (7-8 digits)';
            }
        }
        
        if (step === 3) {
            if (!formData.selectedCounty) newErrors.selectedCounty = 'County selection is required';
            if (!formData.subcounties) newErrors.subcounties = 'Sub-county selection is required';
            if (locationStatus === 'error') {
                console.warn('Location detection failed, but allowing signup to continue');
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSignUp = async () => {
        if (!validateStep(3)) return;
        
        setIsLoading(true);
        
        // Check if all required fields are filled
        if (
            formData.email !== '' &&
            formData.businessname !== '' &&
            formData.phonenumber !== '' &&
            formData.idnumber !== '' &&
            formData.ownersname !== '' &&
            formData.wphonenumber !== '' &&
            formData.longitude !== '' &&
            formData.latitude !== '' &&
            formData.selectedCounty !== '' &&
            formData.subcounties !== ''
        ) {
            try {
                // Create user with Firebase Auth
                const userCredentials = await auth.createUserWithEmailAndPassword(formData.email, formData.idnumber);
                const user = userCredentials.user;
                
                // Create rental document in Firestore
                await createRentalDocument(
                    formData.businessname,
                    formData.ownersname,
                    formData.businessregistrationnumber,
                    formData.phonenumber,
                    formData.idnumber,
                    formData.category,
                    formData.wphonenumber,
                    formData.latitude,
                    formData.longitude,
                    formData.subcounties,
                    formData.selectedCounty
                );
                
                console.log('Registered with:', user.email);
                alert("Business registered successfully!");
                navigate('/home');
                
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message);
            }
        } else {
            alert("Please fill all the fields!");
        }
        
        setIsLoading(false);
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                        step <= currentStep 
                            ? 'bg-blue-900 text-white shadow-lg' 
                            : 'bg-gray-200 text-gray-400'
                    }`} style={{ backgroundColor: step <= currentStep ? '#1d3c5c' : undefined }}>
                        {step < currentStep ? <CheckCircle size={20} /> : step}
                    </div>
                    {step < 3 && (
                        <div className={`w-16 h-0.5 mx-2 transition-colors duration-300`} 
                             style={{ backgroundColor: step < currentStep ? '#1d3c5c' : '#e5e7eb' }} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const LocationStatus = () => (
        <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center px-4 py-2 rounded-full text-sm ${
                locationStatus === 'success' ? 'bg-green-100 text-green-800' :
                locationStatus === 'detecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
            }`}>
                <MapPin size={16} className="mr-2" />
                {locationStatus === 'success' ? 'Location detected' :
                 locationStatus === 'detecting' ? 'Detecting location...' :
                 'Location detection failed'}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" 
                     style={{ backgroundColor: '#1d3c5c' }}></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" 
                     style={{ backgroundColor: '#2d4c6c' }}></div>
                <div className="absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-4000" 
                     style={{ backgroundColor: '#3d5c7c' }}></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg" 
                             style={{ background: 'linear-gradient(135deg, #1d3c5c, #2d4c6c)' }}>
                            <Building2 size={32} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-bold mb-2" style={{ color: '#1d3c5c' }}>
                            Join Rekebisha Rental
                        </h1>
                        <p className="text-gray-600 mb-4">Let's get you registered and ready to go</p>
                        
                        {/* Login Link */}
                        <div className="flex items-center justify-center">
                            <button 
                                onClick={() => navigate('/')}
                                className="flex items-center text-sm hover:underline transition-colors duration-300"
                                style={{ color: '#1d3c5c' }}
                            >
                                <ArrowLeft size={16} className="mr-1" />
                                Already have an account? Sign in
                            </button>
                        </div>
                    </div>

                    <StepIndicator />
                    <LocationStatus />

                    {/* Form Card */}
                    <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                        <div className="p-8">
                            {/* Step 1: Business & Owner Info */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-semibold" style={{ color: '#1d3c5c' }}>Business Information</h2>
                                        <p className="text-gray-600 mt-2">Tell us about your business</p>
                                    </div>
                                    
                                    <InputField
                                        icon={Building2}
                                        placeholder="Business Name"
                                        value={formData.businessname}
                                        onChange={handleFormChange}
                                        field="businessname"
                                        error={errors.businessname}
                                    />
                                    
                                    <InputField
                                        icon={User}
                                        placeholder="Owner's Full Name"
                                        value={formData.ownersname}
                                        onChange={handleFormChange}
                                        field="ownersname"
                                        error={errors.ownersname}
                                    />
                                    
                                    <InputField
                                        icon={Mail}
                                        type="email"
                                        placeholder="Business Email Address"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        field="email"
                                        error={errors.email}
                                    />
                                    
                                    <InputField
                                        icon={FileText}
                                        placeholder="Business Registration Number (Optional)"
                                        value={formData.businessregistrationnumber}
                                        onChange={handleFormChange}
                                        field="businessregistrationnumber"
                                    />
                                </div>
                            )}

                            {/* Step 2: Contact Information */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-semibold" style={{ color: '#1d3c5c' }}>Contact Information</h2>
                                        <p className="text-gray-600 mt-2">How can customers reach you?</p>
                                    </div>
                                    
                                    <InputField
                                        icon={Phone}
                                        placeholder="Primary Phone Number (M-Pesa)"
                                        value={formData.phonenumber}
                                        onChange={handleFormChange}
                                        field="phonenumber"
                                        error={errors.phonenumber}
                                    />
                                    
                                    <InputField
                                        icon={Phone}
                                        placeholder="WhatsApp Phone Number"
                                        value={formData.wphonenumber}
                                        onChange={handleFormChange}
                                        field="wphonenumber"
                                        error={errors.wphonenumber}
                                    />
                                    
                                    <InputField
                                        icon={CreditCard}
                                        placeholder="National ID Number"
                                        value={formData.idnumber}
                                        onChange={handleFormChange}
                                        field="idnumber"
                                        error={errors.idnumber}
                                    />
                                    
                                    <InputField
                                        icon={Building2}
                                        placeholder="Business Category (Optional)"
                                        value={formData.category}
                                        onChange={handleFormChange}
                                        field="category"
                                    />
                                </div>
                            )}

                            {/* Step 3: Location */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-semibold" style={{ color: '#1d3c5c' }}>Business Location</h2>
                                        <p className="text-gray-600 mt-2">Where is your business located?</p>
                                    </div>
                                    
                                    <SelectField
                                        icon={MapPin}
                                        placeholder="Select County"
                                        value={formData.selectedCounty}
                                        onChange={handleFormChange}
                                        field="selectedCounty"
                                        error={errors.selectedCounty}
                                        options={countiesData.County.map(county => ({
                                            value: county.county_name,
                                            label: county.county_name
                                        }))}
                                    />
                                    
                                    <SelectField
                                        icon={MapPin}
                                        placeholder="Select Sub-County"
                                        value={formData.subcounties}
                                        onChange={handleFormChange}
                                        field="subcounties"
                                        error={errors.subcounties}
                                        options={filteredConstituencies.map(constituency => ({
                                            value: constituency.constituency_name,
                                            label: constituency.constituency_name
                                        }))}
                                    />
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                                {currentStep > 1 ? (
                                    <button
                                        onClick={prevStep}
                                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-300"
                                    >
                                        Previous
                                    </button>
                                ) : (
                                    <div />
                                )}
                                
                                {currentStep < 3 ? (
                                    <button
                                        onClick={nextStep}
                                        className="px-8 py-3 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                        style={{ background: 'linear-gradient(135deg, #1d3c5c, #2d4c6c)' }}
                                    >
                                        Next Step
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSignUp}
                                        disabled={isLoading}
                                        className="px-8 py-3 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        style={{ background: isLoading ? '#6b7280' : 'linear-gradient(135deg, #059669, #1d3c5c)' }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Registering...
                                            </>
                                        ) : (
                                            'Complete Registration'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                                className="h-full transition-all duration-500 rounded-full"
                                style={{ 
                                    width: `${(currentStep / 3) * 100}%`,
                                    background: 'linear-gradient(90deg, #1d3c5c, #2d4c6c)'
                                }}
                            />
                        </div>
                        <p className="text-center text-gray-600 mt-2 text-sm">
                            Step {currentStep} of 3 - {Math.round((currentStep / 3) * 100)}% Complete
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}