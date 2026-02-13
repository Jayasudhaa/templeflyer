// ============================================================================
// FILE: components/editor/ProjectModal.tsx
// PURPOSE: Canva-style project picker (New/Open/Continue/Templates)
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { X, Plus, FolderOpen, Star, Calendar, Search, Clock } from "lucide-react";

interface Project {
  id: string;
  project_name: string;
  description: string;
  thumbnail_url: string | null;
  updated_at: string;
  is_favorite: boolean;
  is_template: boolean;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onOpenProject: (project: Project) => void;
}

export default function ProjectModal({
  isOpen,
  onClose,
  onNewProject,
  onOpenProject
}: ProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"recent" | "templates">("recent");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects || []);
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 1100px;
          max-height: 85vh;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-title {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
        }
        
        .close-button {
          padding: 8px;
          border: none;
          background: #f3f4f6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .close-button:hover {
          background: #e5e7eb;
        }
        
        .modal-body {
          padding: 32px;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .new-project-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px;
          border-radius: 16px;
          margin-bottom: 32px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .new-project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
        }
        
        .new-project-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .new-icon {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .new-text h3 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        
        .new-text p {
          margin: 0;
          opacity: 0.9;
        }
        
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          font-size: 15px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s ease;
        }
        
        .tab:hover {
          color: #374151;
        }
        
        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        
        .search-box {
          margin-bottom: 24px;
          position: relative;
        }
        
        .search-input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s ease;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }
        
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }
        
        .project-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .project-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .project-thumbnail {
          width: 100%;
          height: 180px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }
        
        .project-info {
          padding: 16px;
        }
        
        .project-name {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }
        
        .project-date {
          font-size: 13px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }
      `}</style>

      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Your Projects</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* New Project Card */}
          <div className="new-project-card" onClick={onNewProject}>
            <div className="new-project-content">
              <div className="new-icon">
                <Plus size={32} />
              </div>
              <div className="new-text">
                <h3>Create New Project</h3>
                <p>Start fresh with a blank canvas</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${tab === "recent" ? "active" : ""}`}
              onClick={() => setTab("recent")}
            >
              <Clock size={16} style={{ display: "inline", marginRight: 6 }} />
              Recent Projects
            </button>
            <button
              className={`tab ${tab === "templates" ? "active" : ""}`}
              onClick={() => setTab("templates")}
            >
              <Star size={16} style={{ display: "inline", marginRight: 6 }} />
              Templates
            </button>
          </div>

          {/* Search */}
          {tab === "recent" && (
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Projects Grid */}
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : tab === "recent" ? (
            filteredProjects.length > 0 ? (
              <div className="projects-grid">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="project-card"
                    onClick={() => onOpenProject(project)}
                  >
                    <div className="project-thumbnail">
                      {project.thumbnail_url ? (
                        <img 
                          src={project.thumbnail_url} 
                          alt={project.project_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <FolderOpen size={40} />
                      )}
                    </div>
                    <div className="project-info">
                      <p className="project-name">{project.project_name}</p>
                      <p className="project-date">
                        <Clock size={14} />
                        {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FolderOpen size={48} />
                <p>No projects found</p>
              </div>
            )
          ) : (
            templates.length > 0 ? (
              <div className="projects-grid">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="project-card"
                    onClick={() => onOpenProject(template)}
                  >
                    <div className="project-thumbnail">
                      {template.thumbnail_url ? (
                        <img 
                          src={template.thumbnail_url} 
                          alt={template.project_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Star size={40} />
                      )}
                    </div>
                    <div className="project-info">
                      <p className="project-name">{template.project_name}</p>
                      <p className="project-date">Template</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Star size={48} />
                <p>No templates available</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
