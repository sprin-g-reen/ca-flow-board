import { toast as sonnerToast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from "lucide-react";

interface ToastOptions {
  duration?: number;
  dismissible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      duration: options?.duration || 4000,
      dismissible: options?.dismissible !== false,
      icon: <CheckCircle className="h-4 w-4" />,
      className: "bg-green-50 border-green-200 text-green-800",
      ...options
    });
  },
  
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      duration: options?.duration || 5000,
      dismissible: options?.dismissible !== false,
      icon: <XCircle className="h-4 w-4" />,
      className: "bg-red-50 border-red-200 text-red-800",
      ...options
    });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      duration: options?.duration || 4000,
      dismissible: options?.dismissible !== false,
      icon: <AlertCircle className="h-4 w-4" />,
      className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      ...options
    });
  },
  
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      duration: options?.duration || 4000,
      dismissible: options?.dismissible !== false,
      icon: <Info className="h-4 w-4" />,
      className: "bg-blue-50 border-blue-200 text-blue-800",
      ...options
    });
  },
  
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      duration: Infinity,
      dismissible: options?.dismissible !== false,
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      className: "bg-gray-50 border-gray-200 text-gray-800",
      ...options
    });
  },
  
  promise: function<T>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) {
    return sonnerToast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
      ...options
    });
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  }
};

export { toast };