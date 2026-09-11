import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building, 
  Plus, 
  MapPin, 
  User, 
  Trash2
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const ProjectsView = ({ onOpenNewProject }) => {
  const { projects, deleteProject, updateProject } = useApp();
  const [filter, setFilter] = useState('All');

  const filteredProjects = projects.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'In Progress') return p.status === 'In Progress';
    if (filter === 'Completed') return p.status === 'Completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white m-0 tracking-tight">Construction Sites & Projects</h2>
          <p className="text-xs text-slate-400">Manage ongoing building sites, client information and site material costs</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Filters */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {['All', 'In Progress', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filter === status ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Add New Site
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-slate-400 text-sm">No construction sites found.</p>
          <button
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4" /> Create Your First Site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-mono text-slate-400">{project.id}</span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">{project.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {project.status || 'Active Site'}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete site "${project.name}"?`)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Delete Site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 mt-4 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Client</span>
                      <span className="font-bold text-amber-400">{project.client || 'Direct Client'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Location</span>
                      <span className="font-semibold text-white truncate max-w-[140px] block">{project.location || 'Site Location'}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-semibold">Total Material Cost Incurred:</span>
                  <span className="font-mono font-black text-rose-400 text-base">
                    {formatINR(project.spent || 0)}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
