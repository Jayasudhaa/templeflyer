// ============================================================================
// FILE: components/editor/ProjectModal.tsx
// PURPOSE: Canva-style project picker (New/Open/Continue/Templates)
// REWRITE: safer async, escape/outside close, better typing, no breaking changes
// ============================================================================

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, FolderOpen, Star, Search, Clock } from "lucide-react";

export interface Project {
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
  getAuthToken?: () => Promise<string | null>;
}

type TabKey = "recent" | "templates";

type ProjectsApiResponse = {
  success?: boolean;
  projects?: unknown[];
  templates?: unknown[];
};

function isProject(x: any): x is Project {
  return (
    x &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.project_name === "string" &&
    typeof x.description === "string" &&
    (typeof x.thumbnail_url === "string" || x.thumbnail_url === null) &&
    typeof x.updated_at === "string" &&
    typeof x.is_favorite === "boolean" &&
    typeof x.is_template === "boolean"
  );
}

function safeDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString();
}

export default function ProjectModal({
  isOpen,
  onClose,
  onNewProject,
  onOpenProject,
  getAuthToken,
}: ProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const aliveRef = useRef(true);

  // Track mount/unmount to avoid setState after close/unmount
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // ESC to close (only when open)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Reset search when switching tabs (keeps UX clean)
  useEffect(() => {
    if (tab !== "recent") setSearchQuery("");
  }, [tab]);

  useEffect(() => {
    if (!isOpen) return;
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchJson = async <T,>(url: string): Promise<T> => {
    const token = getAuthToken ? await getAuthToken() : null;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchJson<ProjectsApiResponse>("/api/projects");

      const projRaw = Array.isArray(data.projects) ? data.projects : [];
      const tmplRaw = Array.isArray(data.templates) ? data.templates : [];

      const nextProjects = projRaw.filter(isProject);
      const nextTemplates = tmplRaw.filter(isProject);

      if (!aliveRef.current) return;
      if (data.success) {
        setProjects(nextProjects);
        setTemplates(nextTemplates);
      } else {
        // Keep existing lists but end loading
        console.warn("Projects API returned success=false");
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.project_name.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const onOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Click-outside-to-close: only when clicking directly on overlay
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onMouseDown={onOverlayMouseDown}>
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
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
          margin: 0;
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
          border: none;
          width: 100%;
          text-align: left;
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
          display: inline-flex;
          align-items: center;
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
          background: white;
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

        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
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
          gap: 6px;
          margin: 0;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }
      `}</style>

      <div className="modal" role="dialog" aria-modal="true" aria-label="Project picker">
        <div className="modal-header">
          <h2 className="modal-title">Your Projects</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* New Project Card */}
          <button type="button" className="new-project-card" onClick={onNewProject}>
            <div className="new-project-content">
              <div className="new-icon">
                <Plus size={32} />
              </div>
              <div className="new-text">
                <h3>Create New Project</h3>
                <p>Start fresh with a blank canvas</p>
              </div>
            </div>
          </button>

          {/* Tabs */}
          <div className="tabs">
            <button
              type="button"
              className={`tab ${tab === "recent" ? "active" : ""}`}
              onClick={() => setTab("recent")}
            >
              <Clock size={16} style={{ display: "inline", marginRight: 6 }} />
              Recent Projects
            </button>
            <button
              type="button"
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

          {/* Grid */}
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : tab === "recent" ? (
            filteredProjects.length > 0 ? (
              <div className="projects-grid">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="project-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenProject(project)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenProject(project);
                    }}
                    aria-label={`Open project ${project.project_name}`}
                  >
                    <div className="project-thumbnail">
                      {project.thumbnail_url ? (
                        <img src={project.thumbnail_url} alt={project.project_name} className="thumb-img" />
                      ) : (
                        <FolderOpen size={40} />
                      )}
                    </div>
                    <div className="project-info">
                      <p className="project-name">{project.project_name}</p>
                      <p className="project-date">
                        <Clock size={14} />
                        {safeDateLabel(project.updated_at)}
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
          ) : templates.length > 0 ? (
            <div className="projects-grid">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="project-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenProject(template)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onOpenProject(template);
                  }}
                  aria-label={`Open template ${template.project_name}`}
                >
                  <div className="project-thumbnail">
                    {template.thumbnail_url ? (
                      <img src={template.thumbnail_url} alt={template.project_name} className="thumb-img" />
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
          )}
        </div>
      </div>
    </div>
  );
}
