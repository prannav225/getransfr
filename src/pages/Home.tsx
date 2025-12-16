/* eslint-disable @typescript-eslint/no-unused-vars */
import { Header } from '@/components/layout/Header';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { useDevices } from '@/hooks/useDevices';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { TransferProgress } from '../components/files/TransferProgress';
import { FileTransferModal } from '@/components/modals/FileTransferModal';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SendView } from '@/components/views/SendView';
import { ReceiveView } from '@/components/views/ReceiveView';
import { BottomNav } from '@/components/navigation/BottomNav';

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

    // Stagger animation for children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 100
            }
        }
    };

    const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');

    return (
        <div className="relative min-h-screen font-sans overflow-x-hidden">
            <AnimatedBackground />
            
            <motion.div 
                className="container mx-auto p-4 sm:p-6 max-w-6xl relative z-10 min-h-screen flex flex-col"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header is always visible but maybe simplified? Keeping full header for now */}
                <motion.div variants={itemVariants} className="w-full mb-6">
                    <Header currentDevice={currentDevice} />
                </motion.div>

                {/* Desktop/Tablet Grid - Only visible when not mobile or when tab system isn't active (fallback) */}
                <div className="hidden lg:block w-full"> {/* Wrap in full width div */}
                    {activeTab === 'send' ? (
                        <SendView 
                            currentDevice={currentDevice}
                            connectedDevices={connectedDevices}
                            handleSendFiles={handleSendFiles}
                            selectedFiles={selectedFiles}
                            handleFileSelect={handleFileSelect}
                            handleFileRemove={handleFileRemove}
                            isSending={isSending}
                        />
                    ) : (
                        <ReceiveView currentDevice={currentDevice} />
                    )}
                </div>

                {/* Mobile View - Visible only on small screens */}
                <motion.div 
                    className="block lg:hidden h-full touch-pan-y select-none transform-gpu"
                    onPanEnd={(_e, { offset }) => {
                        // Swipe Left (Go to Receive)
                        if (offset.x < -50 && activeTab === 'send') {
                            setActiveTab('receive');
                        }
                        // Swipe Right (Go to Send)
                        else if (offset.x > 50 && activeTab === 'receive') {
                            setActiveTab('send');
                        }
                    }}
                >
                     <AnimatePresence mode="wait" initial={false}>
                        {activeTab === 'send' ? (
                            <motion.div
                                key="send"
                                initial={{ opacity: 0, x: "-50%" }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: "-50%" }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="h-full"
                            >
                                <SendView 
                                    currentDevice={currentDevice}
                                    connectedDevices={connectedDevices}
                                    handleSendFiles={handleSendFiles}
                                    selectedFiles={selectedFiles}
                                    handleFileSelect={handleFileSelect}
                                    handleFileRemove={handleFileRemove}
                                    isSending={isSending}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="receive"
                                initial={{ opacity: 0, x: "50%" }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: "50%" }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="h-full"
                            >
                                <ReceiveView currentDevice={currentDevice} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Bottom Navigation */}
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>

            <AnimatePresence>
                {(isSending || progress > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-24 left-0 right-0 z-50 p-4" // Lifted up to avoid nav overlap
                    >
                        <div className="max-w-xl mx-auto">
                            <TransferProgress
                                progress={progress}
                                isSending={isSending}
                                onCancel={cancelTransfer || undefined}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
