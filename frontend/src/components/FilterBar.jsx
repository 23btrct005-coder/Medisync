import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

const FilterBar = ({ 
    searchTerm, 
    onSearchChange, 
    placeholder = "Search...", 
    sortValue, 
    onSortChange, 
    sortOptions = [],
    filters = [],
    onFilterChange
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/50 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200/60 shadow-sm mb-8">
            {/* Search Input */}
            <div className="relative flex-1 group w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder={placeholder} 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Custom Filters */}
                {filters.map((filter, idx) => (
                    <div key={idx} className="relative flex-1 md:flex-none">
                        <select
                            value={filter.value}
                            onChange={(e) => onFilterChange(filter.key, e.target.value)}
                            className="w-full appearance-none pl-5 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-primary-500/20 cursor-pointer transition-all"
                        >
                            <option value="">{filter.label}</option>
                            {filter.options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                ))}

                {/* Sort Dropdown */}
                {sortOptions.length > 0 && (
                    <div className="relative flex-1 md:flex-none">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Filter size={14} />
                        </div>
                        <select
                            value={sortValue}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="w-full appearance-none pl-10 pr-10 py-4 bg-slate-900 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary-500/20 cursor-pointer transition-all"
                        >
                            <option value="">Sort By</option>
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterBar;
