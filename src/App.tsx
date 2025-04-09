import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { Upload, Users, Sun, Moon } from 'lucide-react'; // Add Sun and Moon icons
import JSZip from 'jszip';
import "./App.css"

// Add this near other imports
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';

interface Device {
  id: string;
  name: string;
  socketId: string;
  avatar?: string; // Add this to store avatar URL
}

interface FileTransferRequest {
  from: string;
  files: File[];
  fileData?: ArrayBuffer;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [lastSentTo, setLastSentTo] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const createZipFile = async (files: File[]): Promise<Blob> => {
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.name, file);
    }
    return await zip.generateAsync({ type: "blob" });
  };
  // Add this function to generate avatar
  const generateAvatar = (name: string) => {
    const avatar = createAvatar(botttsNeutral, {
      seed: name,
      size: 128,
    });
    return avatar.toDataUri();
  };

  // Modify the deviceInfo handler in useEffect
  useEffect(() => {
    const newSocket = io('http://192.168.0.118:3000');
    setSocket(newSocket);

    newSocket.on('deviceInfo', (device: Device) => {
      setCurrentDevice({
        ...device,
        avatar: generateAvatar(device.name)
      });
    });

    newSocket.on('connectedDevices', (devices: Device[]) => {
      setConnectedDevices(devices.map(device => ({
        ...device,
        avatar: generateAvatar(device.name)
      })));
    });

    newSocket.on('fileTransferRequest', (request: FileTransferRequest) => {
      const confirmed = window.confirm(`Receive ${request.files.length} files?`);
      newSocket.emit('fileTransferResponse', {
        to: request.from,
        accepted: confirmed
      });
    });

    newSocket.on('fileTransferReceive', (data: { fileName: string, fileType: string, fileData: ArrayBuffer }) => {
      const blob = new Blob([data.fileData], { type: data.fileType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleSendFiles = async (targetDevice: Device) => {
    if (socket && selectedFiles.length > 0) {
      // Check if files were just sent to this device
      if (isSending) {
        alert("File transfer already in progress!");
        return;
      }

      if (lastSentTo === targetDevice.id) {
        const resend = window.confirm("You just sent files to this device. Send again?");
        if (!resend) return;
      }

      setIsSending(true);
      setLastSentTo(targetDevice.id);

      try {
        let fileToSend: Blob;
        if (selectedFiles.length > 1) {
          fileToSend = await createZipFile(selectedFiles);
        } else {
          fileToSend = selectedFiles[0];
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileData = e.target?.result;
          socket.emit('fileTransferStart', {
            to: targetDevice.id,
            fileName: selectedFiles.length > 1 ? 'shared_files.zip' : selectedFiles[0].name,
            fileType: selectedFiles.length > 1 ? 'application/zip' : fileToSend.type,
            fileData: fileData
          });
        };
        reader.readAsArrayBuffer(fileToSend);
      } catch (error) {
        console.error('Error preparing files:', error);
        alert('Error preparing files for transfer');
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg-light dark:bg-gradient-bg-dark">
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              DropMate
            </h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm shadow-inner-light dark:shadow-inner-dark border border-white/10 dark:border-white/5"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-white/70" />
              ) : (
                <Moon className="w-4 h-4 text-dropmate-primary/70" />
              )}
            </button>
          </div>
          {currentDevice && (
            <div className="flex items-center gap-3 bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm px-4 py-2 rounded-full shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5">
              <img
                src={currentDevice.avatar}
                alt={currentDevice.name}
                className="w-7 h-7 rounded-full ring-2 ring-dropmate-primary/30 dark:ring-dropmate-primary-dark/30"
              />
              <span className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70">Connected as</span>
              <span className="text-sm font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark">{currentDevice.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <div className="bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm rounded-2xl shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Upload className="w-5 h-5 text-dropmate-primary dark:text-dropmate-primary-dark" />
              <h2 className="text-xl font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark">Share Files</h2>
            </div>

            <div className="border-2 border-dashed border-dropmate-primary/20 dark:border-dropmate-primary-dark/20 rounded-xl p-8 text-center hover:border-dropmate-primary/40 dark:hover:border-dropmate-primary-dark/40 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <div className="mb-3">
                  <Upload className="w-10 h-10 text-dropmate-primary/40 dark:text-dropmate-primary-dark/40 mx-auto" />
                </div>
                <p className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70 mb-1">
                  Drop files here or click to select
                </p>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 bg-black/5 dark:bg-white/5 rounded-xl p-4">
                <h3 className="text-sm font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark mb-3">
                  Selected Files ({selectedFiles.length})
                </h3>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-dropmate-primary/40 dark:bg-dropmate-primary-dark/40 rounded-full" />
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-xs">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Connected Devices Section */}
          <div className="bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm rounded-2xl shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-dropmate-primary dark:text-dropmate-primary-dark" />
              <h2 className="text-xl font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark">Nearby Devices</h2>
            </div>

            {connectedDevices.filter(device => device.id !== currentDevice?.id).length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-dropmate-primary/30 dark:text-dropmate-primary-dark/30" />
                <p className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70">No devices found nearby</p>
                <p className="text-xs text-dropmate-text-muted/50 dark:text-dropmate-text-muted-dark/50 mt-1">
                  Make sure other devices are connected to the same network
                </p>
              </div>
              ) : (
              <div className="space-y-3">
                {connectedDevices
                  .filter(device => device.id !== currentDevice?.id)
                  .map(device => (
                    <div
                      key={device.id}
                      className="p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-gradient-accent hover:text-white transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={device.avatar}
                            alt={device.name}
                            className="w-10 h-10 rounded-full ring-2 ring-dropmate-primary/30 dark:ring-dropmate-primary-dark/30 group-hover:ring-white/30"
                          />
                          <div>
                            <p className="font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark group-hover:text-white">
                              {device.name}
                            </p>
                            <p className="text-sm text-dropmate-primary/70 dark:text-dropmate-primary-dark/70 group-hover:text-white/70">
                              Ready to receive
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendFiles(device)}
                          disabled={selectedFiles.length === 0 || isSending}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-dropmate-primary/10 dark:bg-dropmate-primary-dark/10 text-dropmate-primary dark:text-dropmate-primary-dark group-hover:bg-white/20 group-hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isSending ? 'Sending...' : 'Send Files'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
        </div>
        </div>
      </div>
  );
}

export default App;
