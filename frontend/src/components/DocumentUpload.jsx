import { useState, useRef } from 'react';
import { Upload, X, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentUpload = ({ onFileSelect, label = "Upload Document", accept = ".pdf,image/*" }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size too large. Please upload a file under 5MB.');
        return;
      }
      
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
      
      onFileSelect(selectedFile);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-300 group
          ${file 
            ? 'border-green-200 bg-green-50/30' 
            : 'border-slate-200 bg-slate-50/50 hover:border-primary-300 hover:bg-primary-50/30'
          }`}
      >
        <div className="p-6 flex flex-col items-center justify-center gap-3">
          {file ? (
            <div className="flex items-center gap-4 w-full text-left">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600 shrink-0 overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FileText size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-[9px] text-slate-400 font-medium">PDF, JPG or PNG (MAX. 5MB)</p>
              </div>
            </>
          )}
        </div>
        
        {file && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200 animate-in zoom-in duration-300">
                <Check size={12} strokeWidth={3} />
            </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
    </div>
  );
};

export default DocumentUpload;
