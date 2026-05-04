import { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePhotoUpload = ({ onFileSelect, initialPreview = null, gender = '', required = false }) => {
  const [preview, setPreview] = useState(initialPreview);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size too large. Please upload an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className={`w-36 h-36 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center transition-all ${!preview ? 'border-dashed border-slate-300' : ''}`}>
          {preview ? (
            <img src={preview} alt="Profile Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-300">
                <User size={64} />
            </div>
          )}
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
          >
            <Camera size={32} />
          </div>
        </div>

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {!preview && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <Upload size={14} /> Upload Profile Photo {required && <span className="text-red-500 ml-1">*</span>}
        </button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">JPG, PNG or WEBP · Max 2MB</p>
    </div>
  );
};

export default ProfilePhotoUpload;
