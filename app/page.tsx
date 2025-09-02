'use client';

import { useState, useRef } from 'react';
import axios from 'axios';

interface DetectionResult {
  image: string;
  text: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await axios.post('/api/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during processing');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔍 YOLO Object Detection with OCR
          </h1>
          <p className="text-lg text-gray-600">
            Upload an image to detect objects and recognize text using AI
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Choose Image
              </label>
              {selectedFile && (
                <p className="mt-4 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Detect Objects & Text'}
              </button>
              
              <button
                onClick={resetForm}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Processing your image...</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Detection Results</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Image */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Original Image</h3>
                <div className="border rounded-lg overflow-hidden">
                  {selectedFile && (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Original"
                      className="w-full h-auto"
                    />
                  )}
                </div>
              </div>

              {/* Detected Objects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Object Detection</h3>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${result.image}`}
                    alt="Detection Results"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            {/* Detected Text */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Detected Text</h3>
              <div className="bg-gray-50 border rounded-lg p-4">
                {result.text.trim() ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {result.text}
                  </pre>
                ) : (
                  <p className="text-gray-500 italic">No text detected in the image</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Supported formats: JPG, JPEG, PNG</li>
            <li>• Processing may take 10-30 seconds depending on image size</li>
            <li>• Large images will be automatically resized for processing</li>
            <li>• This demo uses YOLOv8 nano for faster processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
