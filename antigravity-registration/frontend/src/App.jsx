import { FormProvider, useForm } from './context/FormContext';
import WelcomeStep from './components/steps/WelcomeStep';
import PersonalStep from './components/steps/PersonalStep';
import ContactStep from './components/steps/ContactStep';
import MedicalStep from './components/steps/MedicalStep';
import ReviewStep from './components/steps/ReviewStep';
import SuccessStep from './components/steps/SuccessStep';
import { AnimatePresence } from 'framer-motion';

const MainWizard = () => {
  const { step } = useForm();
  
  const renderStep = () => {
    switch (step) {
      case 0: return <WelcomeStep key="st-0" />;
      case 1: return <PersonalStep key="st-1" />;
      case 2: return <ContactStep key="st-2" />;
      case 3: return <MedicalStep key="st-3" />;
      case 4: return <ReviewStep key="st-4" />;
      case 5: return <SuccessStep key="st-5" />;
      default: return <WelcomeStep />;
    }
  };

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-center p-4 min-h-screen">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <FormProvider>
      <div id="stars"></div>
      <MainWizard />
    </FormProvider>
  );
}

export default App;
