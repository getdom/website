'use client';

import Image from 'next/image';

interface WebsiteCardProps {
  id: number;
  title: string;
  url: string;
  category?: string;
  tags?: string;
  colorPalette?: string;
  screenshotPath: string;
  onDelete?: (id: number) => void;
  onClick?: () => void;
}

export default function WebsiteCard({ id, title, url, category, tags, colorPalette, screenshotPath, onDelete, onClick }: WebsiteCardProps) {
  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const colors = colorPalette ? JSON.parse(colorPalette) : [];
  
  return (
    <div className="group relative bg-white rounded overflow-hidden transition-all duration-200 border border-gray-200 hover:border-gray-400">
      <button 
        onClick={onClick}
        className="block w-full text-left cursor-pointer"
      >
        <div className="aspect-video bg-gray-50 overflow-hidden relative">
          <Image
            src={screenshotPath}
            alt={title}
            fill
            className="object-cover object-top transition-opacity duration-300 group-hover:opacity-90"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h3 className="font-normal text-black mb-1 line-clamp-2 min-h-[3rem] text-sm">
            {title}
          </h3>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gray-500 hover:text-black hover:underline mb-2 block truncate"
          >
            {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
          {colors.length > 0 && (
            <div className="flex gap-1 mb-2">
              {colors.map((color: string, index: number) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tagList.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {tagList.length > 3 && (
                <span className="px-2 py-0.5 text-gray-500 text-xs">
                  +{tagList.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </button>
      
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this website?')) {
              onDelete(id);
            }
          }}
          className="absolute top-2 right-2 bg-white hover:bg-black hover:text-white text-black rounded p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 border border-gray-300 z-10 text-xs"
          aria-label="Delete"
        >
          ×
        </button>
      )}
    </div>
  );
}
