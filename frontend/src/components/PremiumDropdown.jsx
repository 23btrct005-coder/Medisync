import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

const PremiumDropdown = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select Option", 
    label,
    icon,
    searchable = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = options.find(opt => opt === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && (
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                    {label}
                </label>
            )}
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold cursor-pointer flex items-center justify-between transition-all group
                    ${isOpen ? 'ring-2 ring-primary/20 bg-white' : 'hover:bg-slate-100'}
                `}
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-slate-400 group-hover:text-primary transition-colors">{icon}</span>}
                    <span className={selectedOption ? 'text-slate-800' : 'text-slate-300'}>
                        {selectedOption || placeholder}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {searchable && (
                        <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                            <Search size={14} className="text-slate-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border-none p-0 text-xs font-bold focus:ring-0 placeholder:text-slate-300"
                                placeholder="Search options..."
                                autoFocus
                            />
                            {searchQuery && <X size={14} className="text-slate-400 cursor-pointer" onClick={() => setSearchQuery("")} />}
                        </div>
                    )}
                    
                    <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, i) => (
                                <div 
                                    key={i}
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={`px-6 py-3 text-xs font-bold cursor-pointer flex items-center justify-between transition-colors
                                        ${value === opt 
                                            ? 'bg-primary/5 text-primary' 
                                            : 'text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    {opt}
                                    {value === opt && <Check size={14} />}
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-4 text-[10px] font-black text-slate-300 uppercase text-center">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumDropdown;
