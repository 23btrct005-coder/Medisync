import { useState, useRef } from 'react';
import { Upload, X, User, Camera, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const DropZone = ({ 
    onFileSelect, 
    label = "Upload File", 
    subLabel = "Drag & Drop or Click", 
    accept = "image/*", 
    type = "portrait", // portrait or document
    initialPreview = null,
    maxSize = 2 // MB
}) => {
    const [preview, setPreview] = useState(initialPreview);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const processFile = (file) => {
        if (!file) return;
        
        if (file.size > maxSize * 1024 * 1024) {
            toast.error(`File size too large. Max ${maxSize}MB allowed.`);
            return;
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
        
        onFileSelect(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        processFile(file);
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
        const file = e.dataTransfer.files[0];
        if (file && (accept === '*' || file.type.match(accept.replace('*', '.*')))) {
            processFile(file);
        } else {
            toast.error("Invalid file type.");
        }
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview(null);
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (type === 'portrait') {
        return (
            <div className="flex items-center gap-6 relative z-10">
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-24 h-24 rounded-[2rem] border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden cursor-pointer group
                        ${preview ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-white/5'}
                        ${isDragging ? 'border-primary bg-primary/20 scale-105' : 'hover:border-primary/50'}
                    `}
                >
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <Camera className="text-white/20 group-hover:text-primary/50 transition-colors" size={32} />
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={24} className="text-white" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept={accept}
                        onChange={handleFileChange}
                    />
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white/10 hover:bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                            {preview ? 'Change Photo' : 'Upload Portrait'}
                        </button>
                        {preview && (
                            <button 
                                type="button"
                                onClick={handleRemove}
                                className="px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-3xl transition-all duration-300 group
                    ${preview || isDragging
                        ? 'border-primary-300 bg-primary-50/30' 
                        : 'border-slate-100 bg-slate-50/50 hover:border-primary-200 hover:bg-primary-50/10'
                    }`}
            >
                <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300
                        ${preview ? 'bg-primary text-white scale-110' : 'bg-white text-slate-400 group-hover:text-primary group-hover:scale-105'}`}>
                        {preview ? <Upload size={28} /> : <FileText size={28} />}
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">{label}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{subLabel}</p>
                    </div>
                    {preview && (
                        <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full animate-in slide-in-from-bottom-2">
                            <span className="text-[9px] font-black uppercase tracking-widest">File Ready</span>
                        </div>
                    )}
                </div>

                {preview && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm"
                    >
                        <X size={16} />
                    </button>
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

export default DropZone;
