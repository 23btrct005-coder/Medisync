import { 
  Heart, Brain, Baby, Bone, Eye, Stethoscope, Microscope, Droplet,
  HeartPulse, Home, Monitor, Phone, Scissors, FlaskRound, FlaskConical, 
  Thermometer, Siren, Activity, Droplets, ShieldCheck, Ambulance, User
} from 'lucide-react';

export const PHYSICIAN_DEPARTMENTS = [
  { name: 'Cardiology', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  { name: 'Neurology', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
  { name: 'Orthopedics', icon: Bone, color: 'text-orange-500', bg: 'bg-orange-50' },
  { name: 'Pediatrics', icon: Baby, color: 'text-blue-500', bg: 'bg-blue-50' },
  { name: 'Oncology', icon: Microscope, color: 'text-rose-500', bg: 'bg-rose-50' },
  { name: 'Gynecology', icon: User, color: 'text-pink-500', bg: 'bg-pink-50' },
  { name: 'Dermatology', icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { name: 'Gastroenterology', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { name: 'Ophthalmology', icon: Eye, color: 'text-sky-500', bg: 'bg-sky-50' },
  { name: 'ENT', icon: Siren, color: 'text-indigo-400', bg: 'bg-indigo-50' },
  { name: 'Psychiatry', icon: Brain, color: 'text-violet-500', bg: 'bg-violet-50' },
  { name: 'General Medicine', icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { name: 'Radiology', icon: Microscope, color: 'text-slate-500', bg: 'bg-slate-50' }
];

export const INSTITUTIONAL_SERVICE_CATALOG = [
  {
    category: 'Emergency Services',
    icon: Siren,
    color: 'text-red-600',
    bg: 'bg-red-50',
    description: 'Critical life-safety protocols and rapid response.',
    services: [
        { name: "Ambulance Booking", icon: Ambulance },
        { name: "Emergency Room", icon: Siren },
        { name: "Trauma Care", icon: HeartPulse },
        { name: "Stroke Care", icon: Brain },
        { name: "Cardiac Emergency", icon: Heart },
        { name: "ICU Admission", icon: ShieldCheck }
    ]
  },
  {
    category: 'Diagnostic Services',
    icon: Microscope,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: 'Advanced imaging and clinical laboratory diagnostics.',
    services: [
        { name: "MRI Scan", icon: Activity },
        { name: "CT Scan", icon: Activity },
        { name: "X-Ray", icon: Activity },
        { name: "Ultrasound", icon: Activity },
        { name: "PET Scan", icon: Activity },
        { name: "Blood Test (CBC)", icon: FlaskConical },
        { name: "Thyroid Profile", icon: FlaskRound },
        { name: "Liver Function Test", icon: Activity },
        { name: "ECG / Echo", icon: HeartPulse }
    ]
  },
  {
    category: 'Surgery Booking',
    icon: Scissors,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    description: 'Expert surgical interventions across all specialties.',
    services: [
        { name: "General Surgery", icon: Scissors },
        { name: "Orthopedic Surgery", icon: Bone },
        { name: "Neurosurgery", icon: Brain },
        { name: "Cardiac Surgery", icon: Heart },
        { name: "Urology Surgery", icon: Droplets }
    ]
  },
  {
    category: 'Women & Child Care',
    icon: Baby,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    description: 'Specialized maternity and pediatric protocols.',
    services: [
        { name: "Pregnancy Checkup", icon: User },
        { name: "Fertility Consultation", icon: Droplets },
        { name: "Pediatric Consultation", icon: Baby },
        { name: "Neonatal Care", icon: ShieldCheck }
    ]
  },
  {
    category: 'Preventive Care',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    description: 'Proactive health screening and wellness packages.',
    services: [
        { name: "Full Body Checkup", icon: Activity },
        { name: "Diabetes Screening", icon: Droplet },
        { name: "Heart Screening", icon: Heart },
        { name: "Cancer Screening", icon: Microscope }
    ]
  },
  {
    category: 'Home & Remote Services',
    icon: Home,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    description: 'Modern enterprise healthcare at your doorstep.',
    services: [
        { name: "Home Blood Collection", icon: FlaskConical },
        { name: "Home Nursing", icon: User },
        { name: "Telemedicine", icon: Monitor },
        { name: "Physiotherapy at Home", icon: Activity }
    ]
  }
];

export const ALL_INSTITUTIONAL_SERVICES = INSTITUTIONAL_SERVICE_CATALOG.flatMap(c => c.services.map(s => s.name));
