import React from 'react';
import { X, Download, Upload, Users, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onBulkGSTImport: () => void;
  onBulkCINImport: () => void;
  onUploadExcel: () => void;
}

export const ImportOptionsModal: React.FC<ImportOptionsModalProps> = ({
  isOpen,
  onClose,
  onDownloadTemplate,
  onBulkGSTImport,
  onBulkCINImport,
  onUploadExcel,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Import Clients</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Choose your import method
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="space-y-3">
            <Button 
              onClick={onDownloadTemplate}
              variant="outline"
              className="w-full h-16 justify-start gap-4 text-left p-4 hover:bg-blue-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">Download Template</div>
                <div className="text-xs text-gray-500 mt-1">Get Excel template with sample data</div>
              </div>
            </Button>

            <Button 
              onClick={onBulkGSTImport}
              variant="outline"
              className="w-full h-16 justify-start gap-4 text-left p-4 hover:bg-purple-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">Bulk GST Import</div>
                <div className="text-xs text-gray-500 mt-1">Enter multiple GST numbers at once</div>
              </div>
            </Button>

            <Button 
              onClick={onBulkCINImport}
              variant="outline"
              className="w-full h-16 justify-start gap-4 text-left p-4 hover:bg-indigo-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Building className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">Bulk CIN Import</div>
                <div className="text-xs text-gray-500 mt-1">Enter multiple CIN numbers at once</div>
              </div>
            </Button>

            <Button 
              onClick={onUploadExcel}
              variant="outline"
              className="w-full h-16 justify-start gap-4 text-left p-4 hover:bg-green-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">Upload Excel File</div>
                <div className="text-xs text-gray-500 mt-1">Upload completed Excel file</div>
              </div>
            </Button>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
            <Button variant="ghost" onClick={onClose} className="px-4 py-2 text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};