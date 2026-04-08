import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Search, User, Droplet, Calendar, Phone, Activity } from 'lucide-react';

const PatientDirectory = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctor/patients');
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching patients", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patient Directory</h2>
          <p className="text-slate-500 text-sm mt-1">Browse and manage all registered patients</p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-72 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin text-primary-500"><Activity size={32} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.length > 0 ? filteredPatients.map(patient => (
            <div 
              key={patient.id} 
              onClick={() => navigate(`/doctor-dashboard/patients/${patient.id}`)}
              className="card cursor-pointer group border-transparent hover:border-primary-200 transition-all duration-300"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg group-hover:scale-110 transition-transform">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{patient.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center mt-0.5">
                    ID: #{patient.id}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center"><Calendar size={14} className="mr-1.5"/> Age</span>
                  <span className="font-medium text-slate-700">{patient.age || 'N/A'} yrs</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center"><Droplet size={14} className="mr-1.5 text-red-400"/> Blood Group</span>
                  <span className="font-medium text-slate-700">{patient.bloodGroup || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center"><Phone size={14} className="mr-1.5"/> Contact</span>
                  <span className="font-medium text-slate-700 truncate max-w-[120px]" title={patient.email}>{patient.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center">
               <User size={48} className="mx-auto text-slate-300 mb-3" />
               <h3 className="text-lg font-medium text-slate-700">No patients found</h3>
               <p className="text-slate-500 mt-1">Try adjusting your search terminology.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDirectory;
