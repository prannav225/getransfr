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
import { useClipboard } from '@/hooks/useClipboard';
import { TextTransferModal } from '@/components/modals/TextTransferModal';
import { useSound } from '@/hooks/useSound';
import { eventBus, EVENTS } from '@/utils/events';

export function Home() {
    const { currentDevice, connectedDevices } = useDevices();
    const { shareText } = useClipboard();
    const {
        selectedFiles,
        handleFileSelect,
        handleSendFiles,
        isSending,
        isPreparing,
        progress,
        cancelTransfer,
        setSelectedFiles
    } = useFileTransfer();
    const { playSound } = useSound();

    const handleFileRemove = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        toast.success('File removed successfully');
    };

    const [textModal, setTextModal] = useState<{
        isOpen: boolean;
        mode: 'send' | 'receive';
        text: string;
        deviceName: string;
        targetSocketId?: string;
    }>({
        isOpen: false,
        mode: 'send',
        text: '',
        deviceName: ''
    });

    useEffect(() => {
        // Handle files shared from other apps via Web Share Target API
        if ('launchQueue' in window) {
            (window as any).launchQueue.setConsumer(async (launchParams: any) => {
                if (launchParams.files && launchParams.files.length > 0) {
                    const files = await Promise.all(
                        launchParams.files.map((fileHandle: any) => fileHandle.getFile())
                    );
                    
                    if (files.length > 0) {
                        const event = {
                            target: {
                                files: Object.assign([], files)
                            }
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handleFileSelect(event);
                        toast.success(`${files.length} file(s) shared with Getransfr`);
                    }
                }
            });
        }

        const handleTransferRequest = (data: any) => {
            const { files, accept, decline } = data;
            playSound('ding');

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

        const handleTransferError = (data: any) => {
            const { message } = data;
            toast.error(message);
        };

        const handleTextTransferRequest = (data: any) => {
            const { from, text } = data;
            const sender = connectedDevices.find(d => d.socketId === from);
            playSound('ding');
            setTextModal({
                isOpen: true,
                mode: 'receive',
                text,
                deviceName: sender?.name || 'Unknown Device',
                targetSocketId: from
            });
        };

        // Auto-cleanup history older than 7 days
        const cleanupHistory = () => {
            const savedHistory = localStorage.getItem('transferHistory');
            if (savedHistory) {
                try {
                    const history = JSON.parse(savedHistory);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    
                    const filteredHistory = history.filter((record: any) => {
                        return new Date(record.timestamp) > sevenDaysAgo;
                    });
                    
                    if (filteredHistory.length !== history.length) {
                        localStorage.setItem('transferHistory', JSON.stringify(filteredHistory));
                    }
                } catch (e) {
                    console.error('Failed to cleanup history:', e);
                }
            }
        };
        cleanupHistory();

        const handleTransferComplete = () => {
            if (Notification.permission === 'granted') {
                new Notification('Transfer Complete', {
                    body: 'Files have been transferred successfully.',
                    icon: '/G.png'
                });
            }
        };

        const unsubFileTransfer = eventBus.on(EVENTS.FILE_TRANSFER_REQUEST, handleTransferRequest);
        const unsubFileError = eventBus.on(EVENTS.FILE_TRANSFER_ERROR, handleTransferError);
        const unsubFileComplete = eventBus.on(EVENTS.FILE_TRANSFER_COMPLETE, handleTransferComplete);
        const unsubTextTransfer = eventBus.on(EVENTS.TEXT_TRANSFER_REQUEST, handleTextTransferRequest);

        return () => {
            unsubFileTransfer();
            unsubFileError();
            unsubFileComplete();
            unsubTextTransfer();
        };
    }, [connectedDevices]); // Add connectedDevices to deps to correctly find sender name

    // Stagger animation for children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12
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

    const handleTabChange = (tab: 'send' | 'receive') => {
        if (tab === activeTab) return;
        setActiveTab(tab);
    };

    const slideVariants = {
        enter: {
            opacity: 0,
            scale: 0.98,
            filter: 'blur(10px)'
        },
        center: {
            zIndex: 1,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)'
        },
        exit: {
            zIndex: 0,
            opacity: 0,
            scale: 1.02,
            filter: 'blur(10px)'
        }
    };

    const slideTransition = {
        opacity: { duration: 0.35 },
        scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
        filter: { duration: 0.35 }
    };

    return (
        <div className="relative min-h-screen font-sans">
            <AnimatedBackground />
            
            <motion.div 
                className="container mx-auto p-4 sm:p-6 max-w-6xl relative z-10 min-h-screen flex flex-col pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header is always visible */}
                <motion.div 
                    variants={itemVariants} 
                    className="w-full mb-3 lg:mb-6 sticky top-0 z-40 bg-transparent"
                >
                    <Header currentDevice={currentDevice} />
                </motion.div>

                {/* Desktop/Tablet Grid - Elegant Cross-Fade */}
                <div className="hidden lg:block w-full flex-1 relative min-h-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={slideTransition}
                            className="w-full h-full transform-gpu overflow-x-hidden pt-1 px-1"
                        >
                            {activeTab === 'send' ? (
                                <SendView 
                                    currentDevice={currentDevice}
                                    connectedDevices={connectedDevices}
                                    handleSendFiles={handleSendFiles}
                                    onShareText={(to, text) => {
                                        const device = connectedDevices.find(d => d.socketId === to);
                                        setTextModal({
                                            isOpen: true,
                                            mode: 'send',
                                            text: text || '',
                                            deviceName: device?.name || 'Unknown Device',
                                            targetSocketId: to
                                        });
                                    }}
                                    selectedFiles={selectedFiles}
                                    handleFileSelect={handleFileSelect}
                                    handleFileRemove={handleFileRemove}
                                    isSending={isSending}
                                />
                            ) : (
                                <ReceiveView currentDevice={currentDevice} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Mobile View - Elegant Cross-Fade */}
                <motion.div 
                    className="block lg:hidden flex-1 relative min-h-0 select-none transform-gpu"
                >
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={slideTransition}
                            className="h-full w-full overflow-x-hidden px-1"
                        >
                            {activeTab === 'send' ? (
                                 <SendView 
                                     currentDevice={currentDevice}
                                     connectedDevices={connectedDevices}
                                     handleSendFiles={handleSendFiles}
                                     onShareText={(to, text) => {
                                         const device = connectedDevices.find(d => d.socketId === to);
                                         setTextModal({
                                             isOpen: true,
                                             mode: 'send',
                                             text: text || '',
                                             deviceName: device?.name || 'Unknown Device',
                                             targetSocketId: to
                                         });
                                     }}
                                     selectedFiles={selectedFiles}
                                     handleFileSelect={handleFileSelect}
                                     handleFileRemove={handleFileRemove}
                                     isSending={isSending}
                                 />
                            ) : (
                                <ReceiveView currentDevice={currentDevice} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
 
                {/* Bottom Navigation */}
                <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
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
                                isPreparing={isPreparing}
                                onCancel={cancelTransfer || undefined}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {textModal.isOpen && (
                    <TextTransferModal
                        mode={textModal.mode}
                        deviceName={textModal.deviceName}
                        initialText={textModal.text}
                        onAction={(text) => {
                            if (textModal.mode === 'send' && textModal.targetSocketId && text) {
                                shareText(textModal.targetSocketId, text);
                            }
                        }}
                        onClose={() => setTextModal(prev => ({ ...prev, isOpen: false }))}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
