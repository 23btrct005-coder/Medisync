import { useState, useRef } from 'react';
import { Upload, X, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentUpload = ({ onFileSelect, label = "Upload Document", accept = ".pdf,image/*", maxSize = 5 }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast.error(`File size too large. Please upload a file under ${maxSize}MB.`);
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
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-[2.5rem] transition-all duration-500 group
          ${file 
            ? 'border-emerald-200 bg-emerald-50/20' 
            : isDragging
              ? 'border-primary bg-primary/5 scale-[1.02] shadow-2xl shadow-primary/10'
              : 'border-slate-100 bg-slate-50/50 hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50'
          }`}
      >
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          {file ? (
            <div className="flex items-center gap-5 w-full text-left animate-in fade-in slide-in-from-bottom-2">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary shrink-0 overflow-hidden border border-slate-50">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FileText size={28} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate tracking-tight">{file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Verified</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="p-3 bg-white hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all shadow-sm border border-slate-50"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <div className={`w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center transition-all duration-500
                ${isDragging ? 'scale-110 text-primary shadow-primary/20' : 'text-slate-300 group-hover:text-primary group-hover:scale-110'}`}>
                <Upload size={28} />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">PDF, JPG or PNG (MAX. {maxSize}MB)</p>
              </div>
            </>
          )}
        </div>
        
        {file && (
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 animate-in zoom-in duration-500 border-4 border-white">
                <Check size={16} strokeWidth={4} />
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
