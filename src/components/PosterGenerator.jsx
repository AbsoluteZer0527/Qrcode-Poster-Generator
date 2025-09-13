'use client';

import React, { useState, useRef } from 'react';
import { Download, Link, Image, QrCode, Edit3, Save, X, Upload } from 'lucide-react';

const PosterGenerator = () => {
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [posterData, setPosterData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [uploadedImage, setUploadedImage] = useState(null);
  const posterRef = useRef(null);
  const fileInputRef = useRef(null);

  // Generate QR Code using QR Server API
  const generateQRCode = (url) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  // Fetch URL metadata using a CORS proxy
  const fetchMetadata = async (url) => {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (!data.contents) {
        throw new Error('Failed to fetch URL content');
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // Try to get Open Graph image first
      let imageUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      
      // If no OG image, try Twitter card image
      if (!imageUrl) {
        imageUrl = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
      }
      
      // If still no image, try to find the first img tag
      if (!imageUrl) {
        const firstImg = doc.querySelector('img[src]');
        imageUrl = firstImg?.getAttribute('src');
      }

      // Get page title
      const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                   doc.querySelector('title')?.textContent || 
                   'Premium Apartment';

      // Make sure image URL is absolute
      if (imageUrl && !imageUrl.startsWith('http')) {
        const baseUrl = new URL(url).origin;
        imageUrl = new URL(imageUrl, baseUrl).href;
      }

      return {
        title: title.trim(),
        image: uploadedImage || imageUrl,
        url: url,
        subtitle: 'Off-Campus Apartment For Rent',
        description: 'Scan to view this price, listing, and details.',
        footerTitle: 'Find the perfect off-campus apartment near campus',
        footerSubtitle: 'Quality student housing • Verified listings • Trusted by students'
      };
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return {
        title: 'Premium Student Apartment',
        image: uploadedImage || null,
        url: url,
        subtitle: 'Off-Campus Apartment For Rent',
        description: 'Scan to view this amazing apartment listing',
        footerTitle: 'Find the perfect off-campus apartment near campus',
        footerSubtitle: 'Quality student housing • Verified listings • Trusted by students'
      };
    }
  };

  const handleGeneratePoster = async () => {
    if (!url) return;
    
    setIsGenerating(true);
    try {
      const metadata = await fetchMetadata(url);
      const qrCode = generateQRCode(url);
      
      const data = {
        ...metadata,
        qrCode
      };
      
      setPosterData(data);
      setEditableData(data);
      setShowPoster(true);
    } catch (error) {
      console.error('Error generating poster:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setPosterData(editableData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditableData(posterData);
    setIsEditing(false);
  };

  const updateEditableData = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target.result;
        setUploadedImage(imageDataUrl);
        if (isEditing) {
          updateEditableData('image', imageDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPoster = () => {
    if (!posterRef.current) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const posterContent = posterRef.current.outerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Apartment Poster</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print-poster {
              width: 8.5in;
              height: 11in;
              margin: 0 auto;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-poster">
            ${posterContent}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const EditableField = ({ value, onUpdate, multiline = false, className = "", placeholder = "", disabled = false }) => {
    if (!isEditing || disabled) {
      return <span className={className}>{value}</span>;
    }
    
    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) => onUpdate(e.target.value)}
          className={`${className} bg-gray-50 border border-gray-300 px-2 py-1 resize-none`}
          placeholder={placeholder}
          rows={2}
        />
      );
    }
    
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onUpdate(e.target.value)}
        className={`${className} bg-gray-50 border border-gray-300 px-2 py-1`}
        placeholder={placeholder}
      />
    );
  };

  const Poster = ({ data }) => (
    <div 
      ref={posterRef}
      className="w-[8.5in] h-[11in] bg-white p-8 flex flex-col items-center justify-between print:shadow-none"
      style={{ fontSize: '16px' }}
    >
      {/* Header */}
      {/* UniShack Header */}
      <div className="w-full flex items-center justify-start mb-6 p-4 text-white" style={{ backgroundColor: '#2774AE' }}>
        <img 
          src="/logo.svg" 
          alt="UniShack Logo" 
          className="h-8 w-auto mr-3"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <h1 className="text-xl font-bold text-white">
          UniShack
        </h1>
      </div>

      {/* Header */}
      <div className="text-center mb-6">

        <EditableField
          value={data.subtitle}
          onUpdate={(value) => updateEditableData('subtitle', value)}
          className="text-4xl font-bold text-gray-900 mb-3 block"
          placeholder="Header title"
        />
        <EditableField
          value={data.description}
          onUpdate={(value) => updateEditableData('description', value)}
          className="text-lg text-gray-600 block"
          placeholder="Description text"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {/* Property Image */}
        <div className="relative w-96 h-64 bg-gray-100 overflow-hidden border-2 border-gray-300">
          {data.image ? (
            <img 
              src={data.image} 
              alt={data.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: data.image ? 'none' : 'flex' }}>
            <Image size={48} />
          </div>
          
          {/* Upload button when editing */}
          {isEditing && (
            <div className="absolute top-2 right-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#2774AE] text-white p-2 shadow-lg hover:bg-[#1e5a8a] transition-colors"
                style={{ backgroundColor: '#2774AE' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1e5a8a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2774AE'}
              >
                <Upload size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Property Title */}
        <EditableField
          value={data.title}
          onUpdate={(value) => updateEditableData('title', value)}
          multiline={true}
          className="text-3xl font-bold text-gray-900 text-center max-w-lg leading-tight"
          placeholder="Property title"
        />

        {/* QR Code */}
        <div className="bg-white p-4 shadow-lg border-2 border-gray-300">
          <img 
            src={data.qrCode} 
            alt="QR Code"
            className="w-32 h-32"
          />
        </div>

        {/* URL */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2 font-medium">Or visit directly:</p>
          <EditableField
            value={data.url}
            onUpdate={(value) => updateEditableData('url', value)}
            className="text-lg font-mono break-all max-w-md block bg-gray-100 px-3 py-2"
            style={{ color: '#2774AE' }}
            placeholder="Website URL"
          />
        </div>
      </div>

      {/* Footer - Not editable */}
      <div className="text-center mt-8 p-6 text-white w-full" style={{ backgroundColor: '#2774AE' }}>
        <span className="text-xl font-bold mb-2 block text-white">
          {data.footerTitle}
        </span>
        <span className="text-sm opacity-90 block text-white">
          {data.footerSubtitle}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-lg p-6 border border-gray-300">
          <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: '#2774AE' }}>
            Apartment QR Poster
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Listing URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://apartment-listing.com"
                className="w-full px-4 py-3 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <button
              onClick={handleGeneratePoster}
              disabled={!url || isGenerating}
              className="w-full text-white py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md transition-all duration-200"
              style={{ backgroundColor: '#2774AE' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1e5a8a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2774AE'}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Poster...
                </>
              ) : (
                <>
                  <QrCode size={20} />
                  Create Apartment Poster
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Poster Modal */}
      {showPoster && posterData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white max-w-full max-h-full overflow-auto shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Apartment Poster</h2>
              <div className="flex gap-2">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="text-white px-4 py-2 hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
                    style={{ backgroundColor: '#2774AE' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1e5a8a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2774AE'}
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 text-white px-4 py-2 hover:bg-green-700 flex items-center gap-2 font-medium transition-colors"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-4 py-2 hover:bg-gray-600 flex items-center gap-2 font-medium transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={downloadPoster}
                  className="text-white px-4 py-2 hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
                  style={{ backgroundColor: '#2774AE' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1e5a8a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2774AE'}
                >
                  <Download size={16} />
                  Print/Save
                </button>
                <button
                  onClick={() => setShowPoster(false)}
                  className="bg-gray-500 text-white px-4 py-2 hover:bg-gray-600 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <Poster data={isEditing ? editableData : posterData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterGenerator;