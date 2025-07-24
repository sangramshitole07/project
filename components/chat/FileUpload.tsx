'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUploadSuccess: (message: string) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error');
      setStatusMessage('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setStatusMessage(result.message);
        onUploadSuccess(`✅ ${result.message}`);
      } else {
        setUploadStatus('error');
        setStatusMessage(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      setStatusMessage('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">Upload your CSV file</p>
              <p className="text-sm text-gray-500">Drag and drop or click to select</p>
            </div>
            
            <Button 
              variant="outline" 
              disabled={uploading}
              className="relative"
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <File className="mr-2 h-4 w-4" />
              {uploading ? 'Processing...' : 'Choose File'}
            </Button>
          </div>
        </div>

        {uploadStatus !== 'idle' && (
          <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            uploadStatus === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {uploadStatus === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}