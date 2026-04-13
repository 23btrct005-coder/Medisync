import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Search, FileText, Calendar, User } from 'lucide-react';

const MedicalHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  useEffect(() => {
    fetchRecords();
  }, [searchTerm]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // API integration with search
      const res = await api.get(`records/my-records${searchTerm ? `?search=${searchTerm}` : ''}`);
      setRecords(res.data);
    } catch (err) {
      console.error("Error fetching records", err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(records.length / recordsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medical History</h2>
          <p className="text-slate-500 text-sm mt-1">Review your past diagnoses and prescriptions</p>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Search diagnosis..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64 transition-shadow"
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
              <FileText size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium text-lg">No medical records found.</p>
          </div>
        ) : (
          <div>
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Diagnosis</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prescription</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900">
                        <Calendar size={16} className="text-slate-400 mr-2" />
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                        {record.diagnosis}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-sm truncate">
                      {record.prescription}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 flex items-center">
                      <User size={16} className="text-slate-400 mr-2" />
                      {record.doctorName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between sm:px-6">
                <p className="text-sm text-slate-700">
                  Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to <span className="font-medium">{Math.min(indexOfLastRecord, records.length)}</span> of <span className="font-medium">{records.length}</span> results
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;
