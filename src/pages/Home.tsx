/* eslint-disable @typescript-eslint/no-unused-vars */
import { FileUpload } from '@/components/files/FileUpload';
import { DeviceList } from '@/components/devices/DeviceList';
import { Header } from '@/components/layout/Header';
import { useDevices } from '@/hooks/useDevices';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { TransferProgress } from '../components/files/TransferProgress';
import { FileTransferModal } from '@/components/modals/FileTransferModal';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import toast from 'react-hot-toast';
import { Device } from '@/types/device';

export function Home() {
    const { currentDevice, connectedDevices } = useDevices();
    const {
        selectedFiles,
        handleFileSelect,
        handleSendFiles,
        isSending,
        progress,
        cancelTransfer,
        setSelectedFiles
    } = useFileTransfer();

    const handleFileRemove = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        toast.success('File removed successfully');
    };

    useEffect(() => {
        const handleTransferRequest = (e: CustomEvent) => {
            const { files, accept, decline } = e.detail;

            const modal = document.createElement('div');
            document.body.appendChild(modal);

            const root = createRoot(modal);
            root.render(
                <FileTransferModal
                    files={files}
                    onAccept={() => {
                        accept();
                        root.unmount();
                        document.body.removeChild(modal);
                        toast.success('Transfer accepted');
                    }}
                    onDecline={() => {
                        decline();
                        root.unmount();
                        document.body.removeChild(modal);
                        toast('Transfer declined');
                    }}
                />
            );
        };

        const handleTransferError = (e: CustomEvent) => {
            const { message } = e.detail;
            toast.error(message);
        };

        window.addEventListener('file-transfer-request', handleTransferRequest as EventListener);
        window.addEventListener('file-transfer-error', handleTransferError as EventListener);

        return () => {
            window.removeEventListener('file-transfer-request', handleTransferRequest as EventListener);
            window.removeEventListener('file-transfer-error', handleTransferError as EventListener);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-bg-light dark:bg-gradient-bg-dark">
            <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
                <Header currentDevice={currentDevice} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <FileUpload
                            selectedFiles={selectedFiles}
                            onFileSelect={handleFileSelect}
                            onFileRemove={handleFileRemove}
                        />
                    </div>
                    <DeviceList
                        currentDevice={currentDevice}
                        connectedDevices={connectedDevices}
                        onSendFiles={handleSendFiles}
                        selectedFiles={selectedFiles}
                        isSending={isSending}
                    />
                </div>
            </div>
            <TransferProgress
                progress={progress}
                isSending={isSending}
                onCancel={cancelTransfer || undefined}
            />
        </div>
    );
}
