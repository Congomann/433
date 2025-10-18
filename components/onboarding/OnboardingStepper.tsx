import React, { useState, useMemo } from 'react';
import { Agent, User } from '../../types';
import OnboardingHeader from './OnboardingHeader';
import TermsStep from './TermsStep';

// Placeholder content
const welcomeContent = `
  <h1 class="text-3xl font-bold mb-4">Welcome to New Holland Financial Group!</h1>
  <p class="text-lg">We're excited to have you on board. This onboarding process will guide you through the necessary legal agreements and platform setup.</p>
  <p>Please proceed through the steps on the left to complete your onboarding and gain full access to the agent portal.</p>
`;

const termsOfUseContent = `<p>This New Holland Financial Group Terms of Use (this “<strong>Agreement</strong>”) is a binding agreement between New Holland Financial Group, LLC (“<strong>NHFG</strong>”), and either you as an independent insurance broker, advisor, agency, licensed broker-dealer, or other financial institution (“<strong>You</strong>,” “<strong>Your</strong>,” or “<strong>Yours</strong>”) or Your employer or other organization (“<strong>Organization</strong>”) if You are using or accessing the NHFG Portal (as defined below) as an employee or agent of Your Organization and have the authority to bind Your Organization. This Agreement governs Your use of, and to the extent applicable, Your Organization’s use, of NHFG’s cloud-based portal and related products and services, and all related documentation, which is made available through NHFG’s online portal provided to You subject to this Agreement (collectively, the “<strong>NHFG Portal</strong>”). The NHFG Portal is licensed, not sold, to You. This Agreement is in addition to and does not alter any terms and conditions between You and NHFG that is subject to an ordering document or to an executed agreement.</p><p>PLEASE READ THIS AGREEMENT CAREFULLY BEFORE ACCESSING OR USING THE NHFG PORTAL. YOU ACKNOWLEDGE AND AGREE THAT THIS AGREEMENT HAS THE SAME FORCE AND EFFECT AS IF IT WERE EXECUTED IN A WRITTEN DOCUMENT BY YOU AND NHFG. BY CLICKING THE “AGREE” BUTTON AND ACCESSING OR USING THE NHFG PORTAL, YOU (A) ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTAND THIS AGREEMENT; (B) REPRESENT THAT YOU ARE OF LEGAL AGE TO ENTER INTO A BINDING AGREEMENT; AND (C) ACCEPT THIS AGREEMENT AND AGREE THAT YOU ARE LEGALLY BOUND BY ITS TERMS, INCLUDING WITHOUT LIMITATION CONDUCTING THIS TRANSACTION ELECTRONICALLY, DISCLAIMERS OF WARRANTIES, DAMAGE AND REMEDY EXCLUSIONS AND LIMITATIONS, ARBITRATION, AND CHOICE OF LAW. <strong>IF YOU DO NOT AGREE TO THESE TERMS, THEN YOU HAVE NO RIGHT TO, AND SHALL NOT, ACCESS OR USE THE NHFG PORTAL.</strong></p><p>NHFG may change, modify, add, and/or delete all or portions of this Agreement from time to time. NHFG will announce any material changes to this Agreement by posting the amended version on the NHFG Portal and providing a notification upon login to the NHFG Portal. By accessing and/or using the NHFG Portal, You accept and agree to the terms of this Agreement and the use of Your data and personal information as described in this Agreement. If You do not agree to be bound by this Agreement or any subsequent modifications, You should not access or use the NHFG Portal or disclose any personal information through the NHFG Portal.</p><p>This Agreement was last modified on today's date.</p>`;

const agentAgreementContent = `<p>This Independent Agent Agreement ("Agreement") is entered into by and between New Holland Financial Group, LLC ("Company") and you ("Agent").</p><p><strong>1. APPOINTMENT:</strong> Company hereby appoints Agent as a non-exclusive independent contractor to solicit applications for the insurance products offered by Company. Agent is free to solicit insurance for other companies.</p><p><strong>2. AGENT’S DUTIES:</strong> Agent shall solicit applications for insurance products in accordance with the policies and procedures of Company and the respective insurance carriers. Agent shall comply with all applicable laws and regulations.</p><p><strong>3. COMMISSIONS:</strong> Company shall pay Agent commissions on policies sold by Agent in accordance with the commission schedule provided to Agent, which may be amended from time to time. Commissions will be paid after the Company receives the premium from the policyholder.</p><p><strong>4. INDEPENDENT CONTRACTOR STATUS:</strong> Agent is an independent contractor and not an employee of the Company. Agent is responsible for their own expenses, taxes, and obtaining and maintaining all necessary licenses.</p><p><strong>5. TERMINATION:</strong> This Agreement may be terminated by either party with or without cause upon thirty (30) days written notice to the other party.</p><p>BY CLICKING AGREE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO THE TERMS OF THIS AGENT AGREEMENT.</p>`;

interface OnboardingStepperProps {
  agent: Agent;
  currentUser: User;
  onUpdateAgentStep: (step: number) => void;
}

const OnboardingStepper: React.FC<OnboardingStepperProps> = ({ agent, currentUser, onUpdateAgentStep }) => {
  const STEPS = useMemo(() => [
    { name: 'Welcome', description: "Let's get started!" },
    { name: 'Terms Of Use', description: 'Knock out the formalities' },
    { name: 'Agent Agreement', description: 'Review your contract' },
    { name: 'Platform Configuration', description: 'Finalize your setup' },
    { name: 'Portal', description: 'Access the CRM' }
  ], []);
  
  // The step from the DB is 1-based for this flow.
  const [currentStep, setCurrentStep] = useState(agent.onboardingStep || 1);

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep <= STEPS.length) {
      setCurrentStep(nextStep);
      onUpdateAgentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    const prevStep = currentStep - 1;
    if (prevStep > 0) {
      setCurrentStep(prevStep);
      // No need to update DB when going back
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Welcome
        return (
            <div className="bg-white rounded-lg shadow-premium border border-slate-200/50 p-12 h-full flex flex-col justify-between">
                <div className="prose" dangerouslySetInnerHTML={{ __html: welcomeContent }} />
                <div className="flex justify-end mt-8">
                     <button
                        onClick={handleNext}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700"
                    >
                        Start Onboarding
                    </button>
                </div>
            </div>
        );
      case 2: // Terms of Use
        return <TermsStep title="Terms Of Use" content={termsOfUseContent} onNext={handleNext} onPrevious={handlePrevious} isFirstStep={false} />;
      case 3: // Agreement
        return <TermsStep title="Agent Agreement" content={agentAgreementContent} onNext={handleNext} onPrevious={handlePrevious} isFirstStep={false} />;
      case 4: // Platform Config
        return (
            <div className="bg-white rounded-lg shadow-premium border border-slate-200/50 p-12 h-full flex flex-col justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Platform Configuration</h2>
                    <p className="text-slate-600">This step is a placeholder for future platform setup, such as integrating your calendar or setting up payment information.</p>
                     <p className="text-slate-600 mt-4">For now, just click "Next" to complete your onboarding.</p>
                </div>
                <div className="flex justify-between items-center mt-8">
                    <button onClick={handlePrevious} className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Previous</button>
                    <button onClick={handleNext} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700">Finish</button>
                </div>
            </div>
        );
      case 5: // Portal
        // This case shouldn't be reached as the app will re-render, but as a fallback:
        return (
             <div className="bg-white rounded-lg shadow-premium border border-slate-200/50 p-12 text-center">
                <h2 className="text-2xl font-bold text-slate-800">Onboarding Complete!</h2>
                <p className="text-slate-600 mt-4">You will now be redirected to the agent portal.</p>
             </div>
        );
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <OnboardingHeader user={currentUser} />
      <main className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Left Stepper */}
          <div className="lg:col-span-1">
            <nav aria-label="Progress">
              <ol role="list" className="overflow-hidden">
                {STEPS.map((step, stepIdx) => (
                  <li key={step.name} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pb-10' : ''}`}>
                    {stepIdx !== STEPS.length - 1 ? (
                      <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-slate-300" aria-hidden="true" />
                    ) : null}
                    <div className="group relative flex items-start">
                      <span className="flex h-9 items-center">
                        <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                          stepIdx < currentStep -1 ? 'bg-primary-600' : 'border-2 border-slate-300 bg-white'
                        } ${stepIdx + 1 === currentStep ? 'border-primary-600' : ''}`}>
                          {stepIdx < currentStep - 1 ? (
                            <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                            </svg>
                          ) : (
                             <span className={`${stepIdx + 1 === currentStep ? 'text-primary-600' : 'text-slate-500'}`}>{stepIdx + 1}</span>
                          )}
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className={`text-sm font-semibold ${stepIdx + 1 === currentStep ? 'text-primary-600' : 'text-slate-800'}`}>{step.name}</span>
                        <span className="text-sm text-slate-500">{step.description}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          {/* Right Content */}
          <div className="lg:col-span-3">
            {renderStepContent()}
          </div>
        </div>
      </main>
    </div>
  );
};
export default OnboardingStepper;
