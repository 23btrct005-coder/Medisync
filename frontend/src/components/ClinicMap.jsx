import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

const ClinicMap = ({ address, height = "300px" }) => {
  if (!address || address.trim() === '') {
    return (
      <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="p-3 bg-white rounded-2xl text-slate-300">
          <MapPin size={32} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500">No Clinic Location Provided</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Digital-Only Provider</p>
        </div>
      </div>
    );
  }

  const encodedAddress = encodeURIComponent(address);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Official Embed URL for precise location visualization (Requires API Key)
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}`;
  
  // Fallback search URL if no key is provided
  const searchUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const finalUrl = apiKey ? mapUrl : searchUrl;

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-slate-200 shadow-sm bg-slate-50">
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
          <MapPin size={14} className="text-red-500" />
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest truncate max-w-[200px]">
            {address}
          </span>
        </div>
      </div>
      
      <iframe
        width="100%"
        height={height}
        frameBorder="0"
        style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1) brightness(1.05)' }}
        src={finalUrl}
        allowFullScreen
        title="Clinic Location"
        className="transition-all duration-700 group-hover:filter-none"
      ></iframe>

      <div className="absolute bottom-4 right-4 z-10">
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 group/btn"
        >
          Open In Maps
          <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
};

export default ClinicMap;
