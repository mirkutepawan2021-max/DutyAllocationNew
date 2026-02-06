import React, { useState } from 'react';

const FileUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('rosterFile', file);

        try {
            const API_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${API_URL}/api/rotation/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Upload successful!');
                if (onUploadSuccess) onUploadSuccess(data.data);
            } else {
                setMessage(`Upload failed: ${data.error}`);
            }
        } catch (error) {
            setMessage('Network error detected.');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Upload Current Month Roster</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            {message && <p className={`mt-3 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
    );
};

export default FileUpload;
