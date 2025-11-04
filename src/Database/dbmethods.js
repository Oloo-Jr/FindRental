import { auth, db } from "./config"


export const createRentalDocument = (businessname, ownersname, businessregistrationnumber, phonenumber, 
    idnumber, category,  wphonenumber,latitude, longitude, subcounties, selectedCounty) => {
    return db.collection('RealEstate').doc(auth.currentUser.uid).set({
        businessname, 
        ownersname, 
        businessregistrationnumber, 
        phonenumber, 
        idnumber, 
        category, 
        wphonenumber,
        latitude, 
        longitude, 
        subcounties, 
        selectedCounty
    })
}