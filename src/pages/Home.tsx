import { Header } from '@/components/layout/Header';
import { useDevices } from '@/hooks/useDevices';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { TransferProgress } from '../components/files/TransferProgress';
import { FileTransferModal } from '@/components/modals/FileTransferModal';
import { lazy, Suspense, useEffect, useState, useRef } from 'react';
const AnimatedBackground = lazy(() => import('@/components/layout/AnimatedBackground').then(m => ({ default: m.AnimatedBackground })));
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
const SendView = lazy(() => import('@/components/views/SendView').then(m => ({ default: m.SendView })));
const ReceiveView = lazy(() => import('@/components/views/ReceiveView').then(m => ({ default: m.ReceiveView })));
import { BottomNav } from '@/components/navigation/BottomNav';
import { useClipboard } from '@/hooks/useClipboard';
import { TextTransferModal } from '@/components/modals/TextTransferModal';
import { useSound } from '@/hooks/useSound';
import { eventBus, EVENTS } from '@/utils/events';

export function Home() {
    const { currentDevice, connectedDevices } = useDevices();
    const connectedDevicesRef = useRef(connectedDevices);
    useEffect(() => {
        connectedDevicesRef.current = connectedDevices;
    }, [connectedDevices]);

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

    const [fileTransferRequest, setFileTransferRequest] = useState<{
        files: any[];
        handleAccept: () => void;
        handleDecline: () => void;
    } | null>(null);

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
            const { files, handleAccept, handleDecline } = data;

            if (typeof handleAccept !== 'function') {
                console.error('[Home] handleAccept is MISSING!', data);
            }

            playSound('ding');
            setFileTransferRequest({ 
                files, 
                handleAccept, 
                handleDecline 
            });
        };

        const handleTransferError = (data: any) => {
            const { message } = data;
            toast.error(message);
        };

        const handleTextTransferRequest = (data: any) => {
            const { from, text } = data;
            const sender = connectedDevicesRef.current.find(d => d.socketId === from);
            playSound('ding');
            setTextModal({
                isOpen: true,
                mode: 'receive',
                text,
                deviceName: sender?.name || 'Unknown Device',
                targetSocketId: from
            });
        };

        // Cleanup old history
        const savedHistory = localStorage.getItem('transferHistory');
        if (savedHistory) {
            try {
                const history = JSON.parse(savedHistory);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const filtered = history.filter((record: any) => new Date(record.timestamp) > sevenDaysAgo);
                if (filtered.length !== history.length) {
                    localStorage.setItem('transferHistory', JSON.stringify(filtered));
                }
            } catch (e) { /* ignore */ }
        }

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
    }, []); // Empty dependency array means these listeners are set once and remain stable

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
        <div className="relative min-h-[100dvh] font-sans overflow-x-hidden">
            <Suspense fallback={<div className="fixed inset-0 bg-background" />}>
                <AnimatedBackground />
            </Suspense>

            {/* Overlays and Modals - High Priority */}
            <div className="fixed inset-0 z-[100] pointer-events-none">
                <AnimatePresence>
                    {fileTransferRequest && (
                        <div className="pointer-events-auto">
                            <FileTransferModal
                                files={fileTransferRequest.files}
                                onConfirm={() => {
                                    if (typeof fileTransferRequest.handleAccept === 'function') {
                                        fileTransferRequest.handleAccept();
                                    }
                                    setFileTransferRequest(null);
                                    toast.success('Transfer accepted');
                                }}
                                onCancel={() => {
                                    if (typeof fileTransferRequest.handleDecline === 'function') {
                                        fileTransferRequest.handleDecline();
                                    }
                                    setFileTransferRequest(null);
                                    toast('Transfer declined');
                                }}
                            />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {textModal.isOpen && (
                    <div className="fixed inset-0 z-[101]">
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
                    </div>
                )}
            </AnimatePresence>

            <TransferProgress
                progress={progress}
                isSending={isSending}
                isPreparing={isPreparing}
                onCancel={cancelTransfer || undefined}
            />

            {/* Main Layout Container */}
            <motion.div 
                className="container mx-auto p-4 sm:p-6 max-w-6xl relative z-10 min-h-[100dvh] flex flex-col pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
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

                {/* View Container - Responsive Cross-Fade */}
                <div className="flex-1 relative min-h-0 pt-1">
                    <Suspense fallback={<div className="w-full h-48 bg-white/5 rounded-[var(--radius-xl)] animate-pulse" />}>
                        <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={slideTransition}
                            className="w-full h-full transform-gpu overflow-x-hidden px-1"
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
                    </Suspense>
                </div>
 
                {/* Bottom Navigation */}
                <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
            </motion.div>
        </div>
    );
}
