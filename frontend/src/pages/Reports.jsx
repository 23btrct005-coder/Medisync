import { useEffect, useState, useRef } from 'react';
import api from '../api/axiosConfig';
import { Download, File, Loader2, UploadCloud, Camera, X } from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('reports');
      setReports(res.data);
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchReports();
    } catch (err) {
      console.error("Upload failed", err);
      if (err.message === 'Network Error') {
        alert("Server unreachable. The frontend cannot connect to the backend API. If you are on mobile, ensure your backend is deployed to a public server (like Render) and VITE_API_URL is set in Vercel.");
      } else {
        alert(err.response?.data?.message || "Failed to securely upload report.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Unable to access the camera. Please ensure permissions are granted in your browser settings.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const width = videoRef.current.videoWidth || videoRef.current.clientWidth || 640;
      const height = videoRef.current.videoHeight || videoRef.current.clientHeight || 480;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          alert("Capture failed: Browser could not process the photo payload. Please try again.");
          return;
        }
        const file = new File([blob], "scanned_report.jpg", { type: "image/jpeg" });
        
        stopCamera();
        
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
          await api.post('reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          fetchReports();
        } catch (err) {
           console.error("Upload failed", err);
           if (err.message === 'Network Error') {
             alert("Server unreachable. The frontend cannot connect to the backend API. Ensure your backend is deployed publicly.");
           } else {
             alert(err.response?.data?.message || "Failed to securely upload report. Please ensure your backend is running.");
           }
        } finally {
          setUploading(false);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleDownload = async (id, fileName) => {
    setDownloadingId(id);
    try {
      const res = await api.get(`reports/download/${id}`, {
        responseType: 'blob', // Important for downloading files
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medical Reports</h2>
          <p className="text-slate-500 text-sm mt-1">Upload and access your lab results & imaging securely.</p>
        </div>
        
        <div className="flex gap-2">
           <input 
             type="file" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             accept=".pdf,.jpg,.jpeg,.png"
           />
           <button 
             onClick={startCamera}
             disabled={uploading}
             className="flex items-center px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
             title="Scan Document with Camera"
           >
             <Camera size={20} />
             <span className="hidden sm:inline ml-2">Scan</span>
           </button>
           <button 
             onClick={() => fileInputRef.current.click()}
             disabled={uploading}
             className="flex items-center px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
           >
             {uploading ? (
               <><Loader2 size={20} className="mr-2 animate-spin" /> Processing AI...</>
             ) : (
               <><UploadCloud size={20} className="mr-2" /> Secure Upload</>
             )}
           </button>
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-primary-500" size={32} />
         </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
            <File size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium text-lg">No reports available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="card flex flex-col justify-between group">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-red-50 rounded-lg text-red-500">
                  <File size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-slate-800 truncate" title={report.fileName}>
                    {report.fileName}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Uploaded: {new Date(report.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => handleDownload(report.id, report.fileName)}
                  disabled={downloadingId === report.id}
                  className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-primary-600 transition-colors disabled:opacity-50"
                >
                  {downloadingId === report.id ? (
                     <><Loader2 size={16} className="animate-spin mr-2" /> Downloading...</>
                  ) : (
                     <><Download size={16} className="mr-2" /> Download Report</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
            <button onClick={stopCamera} className="absolute top-6 right-6 text-white p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors z-50">
                <X size={24} />
            </button>
            <div className="relative w-full max-w-3xl px-4 flex flex-col items-center">
                <h3 className="text-white text-xl font-bold mb-6">Position document in frame</h3>
                <div className="w-full bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 relative flex items-center justify-center shadow-2xl">
                   <video 
                     ref={videoRef} 
                     autoPlay 
                     playsInline 
                     // Add an onLoadedMetadata to ensure stream plays immediately on iOS
                     onLoadedMetadata={() => videoRef.current?.play()}
                     className="w-full h-auto max-h-[65vh] object-contain"
                   ></video>
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="mt-8 flex gap-4">
                  <button onClick={capturePhoto} className="px-8 py-4 bg-emerald-600 rounded-full text-white font-bold text-lg hover:bg-emerald-500 shadow-emerald-500/30 shadow-lg flex items-center transition-transform hover:scale-105">
                      <Camera size={28} className="mr-3" /> Capture Document
                  </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
