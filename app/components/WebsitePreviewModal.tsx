'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface WebsitePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdate?: () => void;
  website: {
    id: number;
    title: string;
    url: string;
    description?: string;
    category?: string;
    tags?: string;
    colorPalette?: string;
    screenshotPath: string;
    createdAt: string;
  } | null;
}

export default function WebsitePreviewModal({ isOpen, onClose, onTagsUpdate, website }: WebsitePreviewModalProps) {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [isRescanning, setIsRescanning] = useState(false);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditingTags) {
          setIsEditingTags(false);
        } else {
          onClose();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isEditingTags, onClose]);
  
  useEffect(() => {
    if (website?.tags) {
      setTagsInput(website.tags);
    } else {
      setTagsInput('');
    }
  }, [website]);
  
  if (!website) return null;
  
  const formattedDate = new Date(website.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const tagList = website.tags ? website.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const colors = website.colorPalette ? JSON.parse(website.colorPalette) : [];
  
  const handleSaveTags = async () => {
    try {
      const response = await fetch(`/api/websites/${website.id}/tags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: tagsInput }),
      });
      
      if (response.ok) {
        setIsEditingTags(false);
        if (onTagsUpdate) {
          onTagsUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };
  
  const handleRescan = async () => {
    if (!website) return;
    
    setIsRescanning(true);
    try {
      const response = await fetch(`/api/websites/${website.id}/rescan`, {
        method: 'POST',
      });
      
      if (response.ok) {
        if (onTagsUpdate) {
          onTagsUpdate();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Échec du rescan');
      }
    } catch (error) {
      console.error('Failed to rescan website:', error);
      alert('Échec du rescan');
    } finally {
      setIsRescanning(false);
    }
  };
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[700px] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full p-3 sm:p-4 overflow-y-auto">
          <div className="h-full bg-white border border-gray-200 rounded shadow-lg overflow-hidden flex flex-col">
            {/* Header with info */}
            <div className="border-b border-gray-200 bg-white">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-normal text-black break-words flex-1">
                        {website.title}
                      </h2>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors flex-shrink-0"
                      >
                        Visit
                      </a>
                      <button
                        onClick={handleRescan}
                        disabled={isRescanning}
                        className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        title="Rescanner le site pour mettre à jour le screenshot et les couleurs"
                      >
                        {isRescanning ? '...' : '🔄'}
                      </button>
                    </div>
                    <a 
                      href={website.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-black hover:underline text-xs truncate block"
                    >
                      {website.url}
                    </a>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-black transition-colors flex-shrink-0 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                
                {website.description && (
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {website.description}
                  </p>
                )}
                
                {/* Compact info row */}
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                  {website.category && (
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-black">{website.category}</span>
                    </div>
                  )}
                  <span>{formattedDate}</span>
                </div>
                
                {/* Color Palette - Horizontal compact */}
                {colors.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-gray-500">Colors:</span>
                      <div className="flex gap-1">
                        {colors.map((color: string, index: number) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded border border-gray-200"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tags - Compact */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-gray-500">Tags:</span>
                    {!isEditingTags && (
                      <button
                        onClick={() => setIsEditingTags(true)}
                        className="text-xs text-gray-500 hover:text-black transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {isEditingTags ? (
                    <div>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="design, portfolio, minimal"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-black focus:border-black outline-none mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTags}
                          className="flex-1 px-3 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingTags(false);
                            setTagsInput(website.tags || '');
                          }}
                          className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tagList.length > 0 ? (
                        tagList.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Screenshot */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative w-full bg-white rounded overflow-hidden border border-gray-200">
                <Image
                  src={website.screenshotPath}
                  alt={website.title}
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
