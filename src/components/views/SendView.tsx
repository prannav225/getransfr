import { FileUpload } from '@/components/files/FileUpload';
import { DeviceList } from '@/components/devices/DeviceList';
import { Device } from '@/types/device';
import { motion } from 'framer-motion';

interface SendViewProps {
  selectedFiles: File[];
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileRemove: (index: number) => void;
  currentDevice: Device | null;
  connectedDevices: Device[];
  handleSendFiles: (device: Device) => Promise<void>;
  onShareText: (to: string, text: string) => void;
  isSending: boolean;
}

export function SendView({
  selectedFiles,
  handleFileSelect,
  handleFileRemove,
  currentDevice,
  connectedDevices,
  handleSendFiles,
  onShareText,
  isSending,
}: SendViewProps) {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
  };

  const leftItemVariants = {
    hidden: { x: -30, opacity: 0, scale: 0.98 },
    visible: { 
        x: 0, 
        opacity: 1, 
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 350, damping: 30 }
    }
  };

  const rightItemVariants = {
    hidden: { x: 30, opacity: 0, scale: 0.98 },
    visible: { 
        x: 0, 
        opacity: 1, 
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 350, damping: 30 }
    }
  };

  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col flex-1 lg:grid lg:grid-cols-12 gap-4 lg:gap-6 items-stretch lg:items-start min-h-0"
    >
      <motion.div variants={leftItemVariants} className="flex-none h-[42%] lg:h-full lg:col-span-6">
        <FileUpload
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
      </motion.div>
      <motion.div variants={rightItemVariants} className="flex-1 min-h-0 lg:h-full lg:col-span-6">
         <DeviceList
            currentDevice={currentDevice}
            connectedDevices={connectedDevices}
            onSendFiles={handleSendFiles}
            onShareText={onShareText}
            selectedFiles={selectedFiles}
            isSending={isSending}
        />
      </motion.div>
    </motion.div>
  );
}
