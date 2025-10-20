'use client';

import { useState, useEffect } from 'react';
import WebsiteCard from './components/WebsiteCard';
import AddWebsiteModal from './components/AddWebsiteModal';
import WebsitePreviewModal from './components/WebsitePreviewModal';

interface Website {
  id: number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  tags?: string;
  colorPalette?: string;
  screenshotPath: string;
  createdAt: string;
}

export default function Home() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      if (response.ok) {
        const data = await response.json();
        setWebsites(data);
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (url: string) => {
    const response = await fetch('/api/websites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add website');
    }

    await fetchWebsites();
  };

  const handleDeleteWebsite = async (id: number) => {
    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchWebsites();
      }
    } catch (error) {
      console.error('Failed to delete website:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-12 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-normal text-black mb-1">
                Design Repository
              </h1>
              <p className="text-sm text-gray-500">
                Curated collection of inspiring websites
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
            >
              Add Website
            </button>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black"></div>
            </div>
          ) : websites.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-xl font-normal text-black mb-2">
                No websites yet
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Start building your design repository by adding your first website
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Add Your First Website
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.map((website) => (
                <WebsiteCard
                  key={website.id}
                  {...website}
                  onDelete={handleDeleteWebsite}
                  onClick={() => setSelectedWebsite(website)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400">
            fabrique studio
          </p>
        </div>
      </footer>

      <AddWebsiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddWebsite}
      />

      <WebsitePreviewModal
        isOpen={!!selectedWebsite}
        onClose={() => setSelectedWebsite(null)}
        onTagsUpdate={fetchWebsites}
        website={selectedWebsite}
      />
    </div>
  );
}
