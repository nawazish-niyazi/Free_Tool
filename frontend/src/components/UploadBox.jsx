import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X } from 'lucide-react';

const UploadBox = ({ onFileSelect, selectedFile, onClear, accept, supportText }) => {
    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: accept,
        multiple: false
    });

    if (selectedFile) {
        return (
            <div className="w-full p-8 border-2 border-dashed border-blue-200 bg-blue-50 rounded-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                <FileText size={48} className="text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{selectedFile.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                    onClick={onClear}
                    className="flex items-center px-4 py-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                >
                    <X size={16} className="mr-2" /> Remove File
                </button>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`w-full p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center
        ${isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
        >
            <input {...getInputProps()} />
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <UploadCloud size={32} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
                {isDragActive ? 'Drop file here' : 'Click or Drag file here'}
            </h3>
            <p className="text-gray-500 max-w-sm">
                {supportText || "Supports PDF, Word, Excel, PowerPoint, JPG, PNG up to 50MB"}
            </p>
        </div>
    );
};

export default UploadBox;
