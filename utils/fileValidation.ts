/**
 * File Upload Validation Utility
 * 
 * Provides secure file validation to prevent malicious uploads
 * Implements OWASP best practices for file upload security
 */

// Allowed file types with their MIME types and max sizes
export const FILE_VALIDATION_RULES = {
    // Images
    IMAGE: {
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        maxSize: 5 * 1024 * 1024, // 5MB
        description: 'Imagens (JPG, PNG, GIF, WebP)'
    },

    // Documents
    DOCUMENT: {
        mimeTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
            'text/plain'
        ],
        extensions: ['.pdf', '.docx', '.doc', '.txt'],
        maxSize: 10 * 1024 * 1024, // 10MB
        description: 'Documentos (PDF, DOCX, DOC, TXT)'
    },

    // Spreadsheets
    SPREADSHEET: {
        mimeTypes: [
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ],
        extensions: ['.csv', '.xlsx', '.xls'],
        maxSize: 10 * 1024 * 1024, // 10MB
        description: 'Planilhas (CSV, XLSX, XLS)'
    },

    // CSV only (for imports)
    CSV: {
        mimeTypes: ['text/csv', 'application/vnd.ms-excel'],
        extensions: ['.csv'],
        maxSize: 5 * 1024 * 1024, // 5MB
        description: 'CSV'
    },

    // Audio
    AUDIO: {
        mimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
        extensions: ['.mp3', '.wav', '.ogg'],
        maxSize: 20 * 1024 * 1024, // 20MB
        description: 'Áudio (MP3, WAV, OGG)'
    },

    // Video
    VIDEO: {
        mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
        extensions: ['.mp4', '.webm', '.ogv'],
        maxSize: 100 * 1024 * 1024, // 100MB
        description: 'Vídeo (MP4, WebM, OGV)'
    }
};

export interface FileValidationResult {
    valid: boolean;
    error?: string;
    file?: File;
}

/**
 * Validates a file against specified rules
 * 
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed file type categories (e.g., ['IMAGE', 'DOCUMENT'])
 * @returns Validation result with error message if invalid
 */
export function validateFile(
    file: File | null | undefined,
    allowedTypes: (keyof typeof FILE_VALIDATION_RULES)[]
): FileValidationResult {
    // Check if file exists
    if (!file) {
        return {
            valid: false,
            error: 'Nenhum arquivo selecionado'
        };
    }

    // Collect all allowed MIME types and extensions
    const allowedMimeTypes: string[] = [];
    const allowedExtensions: string[] = [];
    let maxSize = 0;

    allowedTypes.forEach(type => {
        const rules = FILE_VALIDATION_RULES[type];
        allowedMimeTypes.push(...rules.mimeTypes);
        allowedExtensions.push(...rules.extensions);
        maxSize = Math.max(maxSize, rules.maxSize);
    });

    // 1. Validate file size
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
        };
    }

    // 2. Validate MIME type
    if (!allowedMimeTypes.includes(file.type)) {
        const typeDescriptions = allowedTypes.map(t => FILE_VALIDATION_RULES[t].description).join(', ');
        return {
            valid: false,
            error: `Tipo de arquivo não permitido. Tipos aceitos: ${typeDescriptions}`
        };
    }

    // 3. Validate file extension (double-check)
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
        const extList = allowedExtensions.join(', ');
        return {
            valid: false,
            error: `Extensão de arquivo não permitida. Extensões aceitas: ${extList}`
        };
    }

    // 4. Check for suspicious file names
    const suspiciousPatterns = [
        /\.exe$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.sh$/i,
        /\.php$/i,
        /\.jsp$/i,
        /\.asp$/i,
        /\.js$/i,
        /\.html$/i,
        /\.htm$/i,
        /\.\./,  // Path traversal
        /[<>:"|?*]/  // Invalid characters
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
        return {
            valid: false,
            error: 'Nome de arquivo suspeito ou inválido'
        };
    }

    // All validations passed
    return {
        valid: true,
        file
    };
}

/**
 * Validates multiple files
 * 
 * @param files - FileList or array of files
 * @param allowedTypes - Array of allowed file type categories
 * @param maxFiles - Maximum number of files allowed (default: 10)
 * @returns Validation result for all files
 */
export function validateFiles(
    files: FileList | File[],
    allowedTypes: (keyof typeof FILE_VALIDATION_RULES)[],
    maxFiles: number = 10
): FileValidationResult {
    const fileArray = Array.from(files);

    // Check number of files
    if (fileArray.length === 0) {
        return {
            valid: false,
            error: 'Nenhum arquivo selecionado'
        };
    }

    if (fileArray.length > maxFiles) {
        return {
            valid: false,
            error: `Número máximo de arquivos excedido. Máximo: ${maxFiles}`
        };
    }

    // Validate each file
    for (const file of fileArray) {
        const result = validateFile(file, allowedTypes);
        if (!result.valid) {
            return result;
        }
    }

    return { valid: true };
}

/**
 * Sanitizes a filename by removing special characters
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
    // Get file extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

    // Remove special characters, keep only alphanumeric, dash, underscore
    const sanitizedName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .substring(0, 100); // Limit length

    return sanitizedName + ext.toLowerCase();
}

/**
 * Creates a secure file upload handler
 * 
 * @param allowedTypes - Array of allowed file type categories
 * @param onSuccess - Callback when file is valid
 * @param onError - Callback when validation fails
 * @returns File change event handler
 */
export function createFileUploadHandler(
    allowedTypes: (keyof typeof FILE_VALIDATION_RULES)[],
    onSuccess: (file: File) => void,
    onError: (error: string) => void
) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const result = validateFile(file, allowedTypes);

        if (result.valid && result.file) {
            onSuccess(result.file);
        } else {
            onError(result.error || 'Erro desconhecido na validação do arquivo');
        }

        // Clear input to allow re-uploading same file
        event.target.value = '';
    };
}

/**
 * Example usage:
 * 
 * ```typescript
 * const handleUpload = createFileUploadHandler(
 *   ['IMAGE'],
 *   (file) => {
 *     console.log('Valid file:', file);
 *     // Process file...
 *   },
 *   (error) => {
 *     alert(error);
 *   }
 * );
 * 
 * <input type="file" onChange={handleUpload} />
 * ```
 */
