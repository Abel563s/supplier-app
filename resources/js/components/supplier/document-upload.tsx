import { type ReactNode } from 'react';
import { UploadCloud, FileText, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type UploadStatus = 'empty' | 'uploading' | 'uploaded' | 'error';

interface DocumentUploadProps {
    title: string;
    description: string;
    required?: boolean;
    status: UploadStatus;
    fileName?: string;
    fileSize?: string;
    uploadedAt?: string;
    onUpload?: () => void;
    onRemove?: () => void;
    onPreview?: () => void;
    action?: ReactNode;
}

export default function DocumentUpload({
    title,
    description,
    required = false,
    status,
    fileName,
    fileSize,
    uploadedAt,
    onUpload,
    onRemove,
    onPreview,
    action,
}: DocumentUploadProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        {required && (
                            <Badge variant="secondary" className="bg-red-50 text-red-700">
                                Required
                            </Badge>
                        )}
                        {!required && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                Optional
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{description}</p>
                </div>

                {status === 'uploaded' && (
                    <Badge className="bg-teal/10 text-teal">Uploaded</Badge>
                )}
                {status === 'error' && (
                    <Badge className="bg-red-50 text-red-700">Error</Badge>
                )}
            </div>

            {status === 'empty' && (
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={onUpload}
                        className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-10 transition-colors hover:border-teal hover:bg-teal/5"
                    >
                        <UploadCloud className="h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                        <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG up to 10 MB</p>
                    </button>
                </div>
            )}

            {status === 'uploaded' && fileName && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10">
                            <FileText className="h-5 w-5 text-teal" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{fileName}</p>
                            <p className="text-xs text-gray-500">
                                {fileSize} {uploadedAt && `• Uploaded ${uploadedAt}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onPreview && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview}>
                                <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                        )}
                        {onRemove && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
                                <X className="h-4 w-4 text-gray-600" />
                            </Button>
                        )}
                        {action}
                    </div>
                </div>
            )}

            {status === 'uploading' && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
                    <div className="flex-1">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="mt-2 h-2 w-full animate-pulse rounded bg-gray-200" />
                    </div>
                </div>
            )}
        </div>
    );
}
