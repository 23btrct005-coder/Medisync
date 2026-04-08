import { createContext, useState, useContext } from 'react';

const FormContext = createContext();

export const FormProvider = ({ children }) => {
  const [step, setStep] = useState(0); // 0 = Welcome, 1 = Personal, 2 = Contact, etc.
  
  const [formData, setFormData] = useState({
    fullName: '', dob: '', age: '', gender: '', nationalId: '', maritalStatus: '', occupation: '',
    mobileNumber: '', altMobileNumber: '', email: '', 
    address: { street: '', city: '', state: '', pincode: '', country: '' },
    emergencyContactName: '', emergencyRelationship: '', emergencyPhone: '', altEmergencyPhone: '',
    bloodGroup: '', height: '', weight: '', allergies: [], newAllergy: '', existingDiseases: [], newDisease: '',
    currentMedications: '', pastSurgeries: '', hasDisability: false, disabilityDetails: '',
    insuranceProvider: '', insuranceId: '',
    familyHistory: '', smoking: false, alcohol: false, exerciseLevel: '', organDonor: false,
    password: '', confirmPassword: ''
  });

  const [profilePhoto, setProfilePhoto] = useState(null);

  const updateFormData = (fields) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => Math.max(0, prev - 1));

  return (
    <FormContext.Provider value={{ step, setStep, formData, updateFormData, profilePhoto, setProfilePhoto, nextStep, prevStep }}>
      {children}
    </FormContext.Provider>
  );
};

export const useForm = () => useContext(FormContext);
