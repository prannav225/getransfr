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
  isSending: boolean;
}

export function SendView({
  selectedFiles,
  handleFileSelect,
  handleFileRemove,
  currentDevice,
  connectedDevices,
  handleSendFiles,
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: 'spring' as const, stiffness: 100 }
    }
  };

  return (
    <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-180px)] lg:h-full items-stretch lg:items-start pb-4 lg:pb-0"
    >
      <motion.div variants={itemVariants} className="flex-none h-[40%] lg:h-full lg:col-span-7">
        <FileUpload
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
      </motion.div>
      <motion.div variants={itemVariants} className="flex-1 min-h-0 lg:h-full lg:col-span-5">
         <DeviceList
            currentDevice={currentDevice}
            connectedDevices={connectedDevices}
            onSendFiles={handleSendFiles}
            selectedFiles={selectedFiles}
            isSending={isSending}
        />
      </motion.div>
    </motion.div>
  );
}
