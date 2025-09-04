/**
 * Files Field Editor for File Upload
 * 
 * Handles file uploads via the 3-step Notion API process:
 * 1. Create upload object 
 * 2. Send binary data to upload URL
 * 3. Attach file to page property
 */

import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FieldEditorProps } from './types';
import { formatErrorMessage } from '@/utils/fieldValidation';

interface FileItem {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

interface FilesFieldEditorProps extends FieldEditorProps {
  maxFiles?: number;
  acceptedTypes?: string[]; // e.g., ['.pdf', '.doc', '.jpg']
  maxSize?: number; // in bytes
}

export const FilesFieldEditor: React.FC<FilesFieldEditorProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  isFocused,
  maxFiles = 10,
  acceptedTypes,
  maxSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Parse value into array of file objects
  const files: FileItem[] = Array.isArray(value) ? value : [];

  // Format error message consistently
  const displayError = error ? formatErrorMessage(error) : undefined;

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Validate file count
    if (maxFiles && files.length + selectedFiles.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedFiles: FileItem[] = [];

      for (const file of Array.from(selectedFiles)) {
        // Validate file size
        if (maxSize && file.size > maxSize) {
          throw new Error(`File "${file.name}" exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`);
        }

        // Validate file type
        if (acceptedTypes && acceptedTypes.length > 0) {
          const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
          if (!acceptedTypes.includes(fileExtension)) {
            throw new Error(`File type "${fileExtension}" not supported. Accepted types: ${acceptedTypes.join(', ')}`);
          }
        }

        // For now, create a placeholder file object
        // TODO: Implement actual Notion API upload in Phase B.5.1.1
        const fileUrl = URL.createObjectURL(file);
        uploadedFiles.push({
          name: file.name,
          url: fileUrl,
          type: file.type,
          size: file.size,
        });
      }

      // Update field value with new files
      onChange([...files, ...uploadedFiles]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'File upload failed';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      // Clear input for re-selection
      event.target.value = '';
    }
  }, [files, onChange, maxFiles, maxSize, acceptedTypes]);

  // Handle file removal
  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  }, [files, onChange]);

  // Format file size for display
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  // Get file icon based on type
  const getFileIcon = (_filename: string) => {
    // For now, use generic file icon - could expand with specific icons per type
    return <FileText className="h-4 w-4" />;
  };

  // Render read-only state
  if (field.readOnly) {
    return (
      <div data-testid={`field-${field.key}`} className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label}
          <span className="text-muted-foreground text-xs ml-2">(read-only)</span>
        </Label>
        <div className="min-h-[2.5rem] p-2 bg-white/5 border border-white/10 rounded-md">
          {files.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <Badge
                  key={`${field.key}-${index}`}
                  variant="secondary"
                  className="text-xs cursor-default opacity-80 flex items-center gap-1"
                >
                  {getFileIcon(file.name)}
                  <span>{file.name}</span>
                  {file.size && (
                    <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No files</span>
          )}
        </div>
        {field.helperText && (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div 
      data-testid={`field-${field.key}`}
      className={cn(
      "space-y-2 transition-all",
      isFocused && "scale-[1.02]"
    )}>
      <Label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
        {maxFiles && (
          <span className="text-muted-foreground text-xs ml-2">
            ({files.length}/{maxFiles})
          </span>
        )}
      </Label>

      {/* Files display */}
      <div className="min-h-[4rem] p-3 bg-white/5 border border-white/10 rounded-md">
        {files.length > 0 && (
          <div className="space-y-2 mb-3">
            {files.map((file, index) => (
              <div
                key={`${field.key}-${index}`}
                className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-md group hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.size && (
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {file.url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0 opacity-60 group-hover:opacity-100"
                      onClick={() => window.open(file.url, '_blank')}
                      disabled={disabled}
                      title="Open file"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 p-0 opacity-60 group-hover:opacity-100"
                    onClick={() => handleRemoveFile(index)}
                    disabled={disabled}
                    title="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        {(!maxFiles || files.length < maxFiles) && (
          <div className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              accept={acceptedTypes?.join(',')}
              disabled={disabled || isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              id={`${field.key}-upload`}
            />
            <div className={cn(
              "flex flex-col items-center justify-center py-4 px-6 border-2 border-dashed border-white/20 rounded-md text-center transition-colors",
              "hover:border-white/40 hover:bg-white/5",
              disabled && "opacity-50 cursor-not-allowed",
              isUploading && "pointer-events-none"
            )}>
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Uploading files...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drop files here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {acceptedTypes && `Accepted: ${acceptedTypes.join(', ')} • `}
                    Max {Math.round(maxSize / (1024 * 1024))}MB per file
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {files.length === 0 && (maxFiles && files.length >= maxFiles) && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {field.placeholder || 'Maximum file limit reached'}
            </p>
          </div>
        )}
      </div>

      {/* Helper text */}
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}

      {/* Error messages */}
      {uploadError && (
        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
          {uploadError}
        </p>
      )}
      {displayError && (
        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
          {displayError}
        </p>
      )}
    </div>
  );
};