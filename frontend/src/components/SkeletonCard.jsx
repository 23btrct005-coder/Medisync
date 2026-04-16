import React from 'react';

const SkeletonCard = () => (
  <div className="glass-card p-4 flex gap-4 items-center border border-slate-100">
    <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
      <div className="h-3 bg-slate-100 rounded-full w-1/2 animate-pulse" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
    <div className="flex items-center gap-3 w-full">
      <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-100 rounded-full w-48 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded-full w-32 animate-pulse" />
      </div>
    </div>
  </div>
);

export default SkeletonCard;
